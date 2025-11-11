package recipe

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/chromedp/chromedp"
)

// getCDPEndpoint reads the Playwright CDP URL from the environment.
// If the variable is empty, it falls back to the historic default.
func getCDPEndpoint() string {
	if v := os.Getenv("PLAYWRIGHT_CDP_URL"); v != "" {
		return v
	}
	// default used for local development
	return "http://localhost:9222"
}

// checkCDPAvailable checks if Chrome DevTools Protocol endpoint is available
// Note: Chrome's HTTP endpoint can be flaky, so we try the WebSocket connection directly
func checkCDPAvailable(cdpURL string) bool {
	// If PLAYWRIGHT_CDP_URL is explicitly set, trust it and try to use it
	if os.Getenv("PLAYWRIGHT_CDP_URL") != "" {
		return true
	}

	// Otherwise, try to verify the HTTP endpoint is available
	client := &http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get(cdpURL + "/json/version")
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == 200
}

// simpleHTTPFetch fetches content using a basic HTTP client as a fallback
func simpleHTTPFetch(url string) (string, error) {
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return "", fmt.Errorf("failed to fetch URL: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP request failed with status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	return string(body), nil
}

// getPageHTML fetches the fully rendered HTML of targetURL using the
// best available method (Chrome DevTools Protocol or simple HTTP).
// It then extracts recipe-specific content to reduce size.
func getPageHTML(targetURL string) (string, error) {
	var html string
	var err error

	// First, try to use Chrome DevTools Protocol (handles JavaScript rendering)
	cdpURL := getCDPEndpoint()

	if checkCDPAvailable(cdpURL) {
		html, err = getPageHTMLWithChrome(cdpURL, targetURL)
	} else {
		// Fallback to simple HTTP fetch
		html, err = getPageHTMLSimpleHTTP(targetURL)
	}

	if err != nil {
		return "", err
	}

	// Extract recipe content to reduce size
	content, _ := extractRecipeContent(html)
	return content, nil
}

// getPageHTMLWithChrome uses Chromium instance via CDP to render JavaScript
func getPageHTMLWithChrome(cdpURL, targetURL string) (string, error) {
	// 1️⃣ Resolve the WebSocket URL of the running browser
	allocCtx, cancelAlloc := chromedp.NewRemoteAllocator(context.Background(), cdpURL)
	defer cancelAlloc()

	// 2️⃣ From the allocator, create a browsing context (a fresh tab)
	tabCtx, cancelTab := chromedp.NewContext(allocCtx)
	defer cancelTab()

	// 3️⃣ Add an overall timeout so a misbehaving page can't hang forever
	ctx, cancelTimeout := context.WithTimeout(tabCtx, 30*time.Second)
	defer cancelTimeout()

	// 4️⃣ Navigate, wait for the DOM, and extract the outerHTML
	var html string
	if err := chromedp.Run(ctx,
		chromedp.Navigate(targetURL),
		chromedp.WaitReady("body", chromedp.ByQuery), // wait until <body> is present
		chromedp.Sleep(2*time.Second),                // give async JS a moment
		chromedp.OuterHTML("html", &html, chromedp.ByQuery),
	); err != nil {
		return "", fmt.Errorf("chromedp run: %w", err)
	}

	return html, nil
}

// getPageHTMLSimpleHTTP uses simple HTTP client to fetch static content
func getPageHTMLSimpleHTTP(targetURL string) (string, error) {
	html, err := simpleHTTPFetch(targetURL)
	if err != nil {
		return "", fmt.Errorf("simple HTTP fetch failed: %w", err)
	}
	return html, nil
}

// TestGetPageHTML is exported for testing purposes
func TestGetPageHTML(url string) (string, error) {
	return getPageHTML(url)
}

// extractJSONLD extracts JSON-LD recipe schema if present
func extractJSONLD(htmlContent string) string {
	re := regexp.MustCompile(`(?s)<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>`)
	matches := re.FindAllStringSubmatch(htmlContent, -1)

	for _, match := range matches {
		if len(match) > 1 {
			jsonContent := match[1]
			// Check for Recipe type in various formats:
			// - "@type":"Recipe"
			// - "@type": "Recipe"
			// - "@type":["Recipe"
			// - "@type": ["Recipe"
			// - Contains "Recipe" anywhere in @type (case-sensitive)
			if strings.Contains(jsonContent, `"@type":"Recipe"`) ||
				strings.Contains(jsonContent, `"@type": "Recipe"`) ||
				strings.Contains(jsonContent, `"@type":["Recipe"`) ||
				strings.Contains(jsonContent, `"@type": ["Recipe"`) ||
				(strings.Contains(jsonContent, `"@type"`) && strings.Contains(jsonContent, `"Recipe"`)) {
				return strings.TrimSpace(jsonContent)
			}
		}
	}
	return ""
}

// validateJSONLD checks if JSON-LD contains actual ingredient data
// Returns true if the JSON-LD has recipeIngredient field with data
func validateJSONLD(jsonLD string) bool {
	// Quick check: does it contain recipeIngredient field?
	if !strings.Contains(jsonLD, `"recipeIngredient"`) {
		return false
	}

	// Try to parse and verify ingredients exist
	var data interface{}
	if err := json.Unmarshal([]byte(jsonLD), &data); err != nil {
		return false
	}

	// Check if it's an array (Guardian, AllRecipes format)
	if dataArray, ok := data.([]interface{}); ok {
		for _, item := range dataArray {
			if itemMap, ok := item.(map[string]interface{}); ok {
				if hasIngredientsInMap(itemMap) {
					return true
				}
			}
		}
		return false
	}

	// Check if it's an object
	if dataObj, ok := data.(map[string]interface{}); ok {
		// Check @graph
		if graph, ok := dataObj["@graph"].([]interface{}); ok {
			for _, item := range graph {
				if itemMap, ok := item.(map[string]interface{}); ok {
					if hasIngredientsInMap(itemMap) {
						return true
					}
				}
			}
			return false
		}

		// Check direct object
		return hasIngredientsInMap(dataObj)
	}

	return false
}

// hasIngredientsInMap checks if a map contains recipeIngredient with data
func hasIngredientsInMap(m map[string]interface{}) bool {
	if ingredients, ok := m["recipeIngredient"]; ok {
		if ingredientArray, ok := ingredients.([]interface{}); ok {
			return len(ingredientArray) > 0
		}
	}
	return false
}

// extractRecipeSection tries to find recipe-specific HTML sections
// Prioritizes sections that contain ingredient data
func extractRecipeSection(htmlContent string) string {
	patterns := []struct {
		name  string
		regex string
	}{
		{"wprm-recipe", `(?s)<div[^>]*class="[^"]*wprm-recipe[^"]*"[^>]*>.*?</div>`},
		{"tasty-recipes", `(?s)<div[^>]*class="[^"]*tasty-recipes[^"]*"[^>]*>.*?</div>`},
		{"recipe-card", `(?s)<div[^>]*class="[^"]*recipe-card[^"]*"[^>]*>.*?</div>`},
		{"mv-create-card", `(?s)<div[^>]*class="[^"]*mv-create-card[^"]*"[^>]*>.*?</div>`},
		{"easyrecipe", `(?s)<div[^>]*class="[^"]*easyrecipe[^"]*"[^>]*>.*?</div>`},
		{"recipe article", `(?s)<article[^>]*class="[^"]*recipe[^"]*"[^>]*>.*?</article>`},
		{"recipe section", `(?s)<section[^>]*class="[^"]*recipe[^"]*"[^>]*>.*?</section>`},
		{"recipe div", `(?s)<div[^>]*class="[^"]*recipe[^"]*"[^>]*>.*?</div>`},
	}

	// First pass: look for sections that contain "ingredient" (case-insensitive)
	for _, p := range patterns {
		re := regexp.MustCompile(p.regex)
		matches := re.FindAllString(htmlContent, -1)

		// Check each match to see if it contains ingredient data
		for _, match := range matches {
			if strings.Contains(strings.ToLower(match), "ingredient") {
				log.Printf("Found recipe section with ingredients using pattern: %s (size: %d bytes)", p.name, len(match))
				return match
			}
		}
	}

	// Second pass: if no section with ingredients found, return first match
	for _, p := range patterns {
		re := regexp.MustCompile(p.regex)
		if match := re.FindString(htmlContent); match != "" {
			log.Printf("Found recipe section using pattern: %s (size: %d bytes)", p.name, len(match))
			return match
		}
	}

	return ""
}

// cleanHTML removes scripts, styles, and minimizes whitespace
func cleanHTML(htmlContent string) string {
	cleaned := htmlContent

	// Remove script tags and content
	cleaned = regexp.MustCompile(`(?i)<script[^>]*>.*?</script>`).ReplaceAllString(cleaned, "")
	// Remove style tags and content
	cleaned = regexp.MustCompile(`(?i)<style[^>]*>.*?</style>`).ReplaceAllString(cleaned, "")
	// Remove noscript tags
	cleaned = regexp.MustCompile(`(?i)<noscript[^>]*>.*?</noscript>`).ReplaceAllString(cleaned, "")
	// Remove HTML comments
	cleaned = regexp.MustCompile(`<!--.*?-->`).ReplaceAllString(cleaned, "")
	// Remove SVG elements (often large and not needed for recipes)
	cleaned = regexp.MustCompile(`(?i)<svg[^>]*>.*?</svg>`).ReplaceAllString(cleaned, "")
	// Remove data attributes (often contain large JSON blobs)
	cleaned = regexp.MustCompile(`\s+data-[a-zA-Z0-9-]+=["'][^"']*["']`).ReplaceAllString(cleaned, "")
	// Collapse multiple whitespace into single space
	cleaned = regexp.MustCompile(`\s+`).ReplaceAllString(cleaned, " ")
	// Remove whitespace between tags
	cleaned = regexp.MustCompile(`>\s+<`).ReplaceAllString(cleaned, "><")

	return strings.TrimSpace(cleaned)
}

// extractRecipeContent uses a 3-tier approach to extract recipe content
// Tier 1: JSON-LD schema (best - structured data, no AI needed)
// Tier 2: Recipe-specific HTML sections (good - targeted content)
// Tier 3: Full HTML cleaning (fallback - works everywhere)
func extractRecipeContent(htmlContent string) (content string, contentType string) {
	originalSize := len(htmlContent)

	// Tier 1: Try JSON-LD first (best option - always check this first!)
	if jsonLD := extractJSONLD(htmlContent); jsonLD != "" {
		// Validate that JSON-LD actually contains ingredient data
		if validateJSONLD(jsonLD) {
			reduction := 100.0 * float64(originalSize-len(jsonLD)) / float64(originalSize)
			log.Printf("Found valid JSON-LD schema with ingredients: %d bytes (%.1f%% reduction)", len(jsonLD), reduction)
			return jsonLD, "jsonld"
		}
		// JSON-LD exists but has no ingredients - log and fall through to HTML extraction
		log.Printf("Found JSON-LD schema but no ingredients - falling back to HTML extraction")
	}

	// Tier 2: Try recipe-specific sections (only if no valid JSON-LD)
	// Note: Only use this if the section is substantial (> 2KB)
	if recipeSection := extractRecipeSection(htmlContent); recipeSection != "" && len(recipeSection) > 2000 {
		cleaned := cleanHTML(recipeSection)
		reduction := 100.0 * float64(originalSize-len(cleaned)) / float64(originalSize)
		log.Printf("Found recipe section: %d bytes (%.1f%% reduction)", len(cleaned), reduction)
		return cleaned, "html"
	}

	// Tier 3: Clean full HTML (safest fallback)
	cleaned := cleanHTML(htmlContent)
	reduction := 100.0 * float64(originalSize-len(cleaned)) / float64(originalSize)
	log.Printf("Using cleaned full HTML: %d bytes (%.1f%% reduction)", len(cleaned), reduction)
	return cleaned, "html"
}
