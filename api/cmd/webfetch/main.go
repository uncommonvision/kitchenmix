package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/gocolly/colly/v2"
	"github.com/ollama/ollama/api"

	"kitchenmix/api/internal/models"
)

const model = "minimax-m2:cloud"

// OllamaRecipeResponse represents the expected JSON response structure from OLLAMA
type OllamaRecipeResponse struct {
	Name        string              `json:"name"`
	Ingredients []models.Ingredient `json:"ingredients"`
}

// getEnv gets environment variable with default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// createIngredientExtractionPrompt creates the prompt for OLLAMA
func createIngredientExtractionPrompt(htmlContent string) string {
	prompt := fmt.Sprintf(`
You are a recipe parsing AI. Extract recipe information from the following HTML content.

TASK: Parse the HTML and extract:
1. Recipe name
2. List of ingredients with quantities and units

OUTPUT FORMAT: JSON with this exact structure:
{
  "name": "Recipe Name",
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": "amount (or null if unclear)",
      "unit": "measurement unit (or null if unclear)"
    }
  ]
}

RULES:
- Extract ONLY ingredients listed for the recipe
- If quantity is unclear, use null
- If unit is unclear, use null  
- If unit is one item, then use piece
- Ignore non-ingredient content like instructions
- If no ingredients found, return empty array
- Be precise with ingredient names (e.g., "olive oil" not just "oil")

HTML CONTENT:
%s
`, htmlContent)
	return prompt
}

// convertToRecipe converts OLLAMA response to internal Recipe model
func convertToRecipe(resp *OllamaRecipeResponse, url string) *models.Recipe {
	ingredients := make([]models.Ingredient, 0, len(resp.Ingredients))

	for _, ing := range resp.Ingredients {
		ingredient := models.Ingredient{
			Name:     ing.Name,
			Quantity: ing.Quantity,
			Unit:     ing.Unit,
		}
		ingredients = append(ingredients, ingredient)
	}

	now := time.Now()
	return &models.Recipe{
		Name:        resp.Name,
		URL:         url,
		Ingredients: ingredients,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}

// extractIngredients sends HTML to OLLAMA and parses the response
func extractIngredients(ctx context.Context, htmlContent string, url string) (*models.Recipe, error) {
	ollamaClient, err := api.ClientFromEnvironment()
	if err != nil {
		return nil, fmt.Errorf("failed to create OLLAMA client: %w", err)
	}

	prompt := createIngredientExtractionPrompt(htmlContent)

	// Create the chat request
	req := &api.ChatRequest{
		Model: model,
		Messages: []api.Message{
			{
				Role:    "user",
				Content: prompt,
			},
		},
	}

	// Send request to OLLAMA
	var fullResponse strings.Builder
	stream := true
	req.Stream = &stream

	err = ollamaClient.Chat(ctx, req, func(resp api.ChatResponse) error {
		if len(resp.Message.Content) > 0 {
			fullResponse.WriteString(resp.Message.Content)
		}
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to call OLLAMA: %w", err)
	}

	log.Printf("response returned from ollama")

	// Parse the JSON response
	responseText := strings.TrimSpace(fullResponse.String())

	// Clean up the response - sometimes models wrap JSON in code blocks
	responseText = strings.TrimPrefix(responseText, "```json")
	responseText = strings.TrimPrefix(responseText, "```")
	responseText = strings.TrimSuffix(responseText, "```")
	responseText = strings.TrimSpace(responseText)

	var ollamaResp OllamaRecipeResponse
	err = json.Unmarshal([]byte(responseText), &ollamaResp)
	if err != nil {
		return nil, fmt.Errorf("failed to parse OLLAMA response: %w. Response: %s", err, responseText)
	}

	// Convert to internal Recipe model
	recipe := convertToRecipe(&ollamaResp, url)
	return recipe, nil
}

func main() {
	// Set up context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	c := colly.NewCollector()

	c.OnRequest(func(r *colly.Request) {
		fmt.Printf("🔍 Visiting: %s\n", r.URL)
	})

	c.OnScraped(func(r *colly.Response) {
		htmlContent := string(r.Body)
		fmt.Printf("📄 Fetched %d bytes of HTML content\n", len(htmlContent))

		// Extract ingredients using OLLAMA
		fmt.Println("🤖 Sending to OLLAMA for ingredient extraction...")
		recipe, err := extractIngredients(ctx, htmlContent, r.Request.URL.String())
		if err != nil {
			log.Printf("❌ Failed to extract ingredients: %v", err)
			return
		}

		// Display results using existing models
		fmt.Printf("✅ Recipe Name: %s\n", recipe.Name)
		fmt.Printf("🥕 Found %d ingredients:\n", len(recipe.Ingredients))

		for i, ingredient := range recipe.Ingredients {
			quantity := "null"
			unit := "null"

			if ingredient.Quantity != nil {
				quantity = *ingredient.Quantity
			}
			if ingredient.Unit != nil {
				unit = *ingredient.Unit
			}

			fmt.Printf("  %d. %s (Quantity: %s, Unit: %s)\n",
				i+1, ingredient.Name, quantity, unit)
		}

		// Also show the full Recipe struct for debugging
		fmt.Printf("\n📋 Full Recipe Structure:\n%+v\n", recipe)
	})

	// c.OnError(func(r *colly.Request, err error) {
	// 	fmt.Printf("❌ Error fetching %s: %v\n", r.URL, err)
	// })

	// Visit the Guardian recipe URL
	targetURL := "https://www.theguardian.com/food/2025/oct/11/meera-sodha-recipe-zaatar-roast-vegetables-whipped-feta"
	fmt.Printf("🚀 Starting web scrape of: %s\n", targetURL)

	err := c.Visit(targetURL)
	if err != nil {
		log.Printf("Failed to visit URL: %v", err)
	}

	fmt.Println("🏁 Webfetch prototype completed")
}
