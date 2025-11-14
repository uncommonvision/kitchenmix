package recipe

import (
	"context"
	"encoding/json"
	"fmt"
	"kitchenmix/api/internal/models"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ollama/ollama/api"
)

type RecipeService struct {
	// Store for recipes indexed by mixId then URL
	recipeStore map[string]map[string]*models.Recipe
}

func NewRecipeService() *RecipeService {
	service := &RecipeService{
		recipeStore: make(map[string]map[string]*models.Recipe),
	}

	return service
}

// GetRecipeByURL fetches a recipe from a given URL
func (s *RecipeService) GetRecipeByURL(url string, mixId string, sharerID string, sharerName string, progressCallback func(string, string, string)) (*models.Recipe, error) {
	// Check if we have it in our store for this mix
	if mixCache, exists := s.recipeStore[mixId]; exists {
		if recipe, exists := mixCache[url]; exists {
			if progressCallback != nil {
				progressCallback("complete", "completed", "Recipe found in cache")
			}
			return recipe, nil
		}
	}

	// If not found, try to dynamically extract from URL
	recipe, err := s.extractRecipeFromURL(url, mixId, sharerID, sharerName, progressCallback)
	if err != nil {
		log.Printf("Failed to extract recipe from URL %s: %v", url, err)
		if progressCallback != nil {
			progressCallback("error", "failed", fmt.Sprintf("Recipe not found for URL %s: %v", url, err))
		}
		return nil, fmt.Errorf("recipe not found for URL %s: %w", url, err)
	}

	return recipe, nil
}

// extractRecipeFromURL dynamically extracts a recipe from a given URL using web scraping and AI
func (s *RecipeService) extractRecipeFromURL(url string, mixId string, sharerID string, sharerName string, progressCallback func(string, string, string)) (*models.Recipe, error) {
	// Send progress update that we're starting web content fetch
	if progressCallback != nil {
		progressCallback("fetching", "in_progress", fmt.Sprintf("Fetching recipe from %s", url))
	}

	// Fetch web content (already optimized with content extraction)
	content, err := s.fetchWebContent(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch web content: %w", err)
	}

	// Send progress update that we completed fetching
	if progressCallback != nil {
		progressCallback("fetching", "completed", "Content retrieved successfully")
	}

	log.Printf("content: %+v", content)

	// // Try to parse as JSON-LD first (if content looks like JSON)
	// if strings.HasPrefix(strings.TrimSpace(content), "{") || strings.HasPrefix(strings.TrimSpace(content), "[") {
	// 	if recipe, err := s.parseJSONLDRecipe(content, url, sharerID, sharerName); err == nil {
	// 		if progressCallback != nil {
	// 			progressCallback("extracting", "completed", fmt.Sprintf("Extracted from JSON-LD schema with %d ingredients", len(recipe.Ingredients)))
	// 		}
	// 		if progressCallback != nil {
	// 			progressCallback("complete", "completed", "Recipe processed successfully")
	// 		}
	// 		// Cache the extracted recipe
	// 		s.recipeStore[url] = recipe
	// 		return recipe, nil
	// 	}
	// 	// If JSON-LD parsing fails, fall through to AI extraction
	// 	log.Printf("JSON-LD parsing failed, falling back to AI extraction")
	// }

	// Send progress update that we're starting AI extraction
	if progressCallback != nil {
		progressCallback("extracting", "in_progress", "Extracting ingredients with AI...")
	}

	// Extract recipe using AI
	recipe, err := s.extractRecipe(content, url, sharerID, sharerName)
	if err != nil {
		return nil, fmt.Errorf("failed to extract recipe: %w", err)
	}

	// Send progress update that extraction is complete
	if progressCallback != nil {
		progressCallback("extracting", "completed", fmt.Sprintf("Received recipe with %d ingredients", len(recipe.Ingredients)))
	}

	// Send completion progress
	if progressCallback != nil {
		progressCallback("complete", "completed", "Recipe processed successfully")
	}

	// Cache the extracted recipe
	if s.recipeStore[mixId] == nil {
		s.recipeStore[mixId] = make(map[string]*models.Recipe)
	}
	s.recipeStore[mixId][url] = recipe

	return recipe, nil
}

// fetchWebContent scrapes the given URL and returns the HTML content
func (s *RecipeService) fetchWebContent(url string) (string, error) {
	return getPageHTML(url)
}

// createExtractionPrompt creates the prompt for AI recipe extraction
func (s *RecipeService) createExtractionPrompt(htmlContent string) string {
	prompt := fmt.Sprintf(`
You are a recipe parsing AI. Extract recipe information from the following HTML content.

TASK: Parse the HTML and extract:
1. Recipe name
2. List of ingredients with quantities and units
3. Best representative image URL for the recipe

OUTPUT FORMAT: JSON with this exact structure:
{
  "name": "Recipe Name",
  "image": "primary image URL (or null if no suitable image found)",
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
- If there is a range of quantity, pick the larger of sizes

RULES FOR IMAGE EXTRACTION:
- Find the most representative image of the final dish/recipe
- Prefer images that show the completed recipe, not ingredients or preparation steps
- Select the highest quality image (largest resolution/clearest)
- Use absolute URLs (full URLs starting with http:// or https://)
- If multiple similar images exist, pick the first high-quality one
- If no suitable recipe image found, return null
- Avoid logos, ads, or unrelated images
- Prioritize images in <img> tags over background images or CSS-based images

HTML CONTENT:
%s
`, htmlContent)
	return prompt
}

// extractRecipe sends HTML to AI and parses the response
func (s *RecipeService) extractRecipe(htmlContent, url string, sharerID string, sharerName string) (*models.Recipe, error) {
	ollamaClient, err := api.ClientFromEnvironment()
	if err != nil {
		return nil, fmt.Errorf("failed to create AI client: %w", err)
	}

	prompt := s.createExtractionPrompt(htmlContent)

	// Create the chat request
	model := "minimax-m2:cloud"
	req := &api.ChatRequest{
		Model: model,
		Messages: []api.Message{
			{
				Role:    "user",
				Content: prompt,
			},
		},
	}

	// Send request to AI
	var fullResponse strings.Builder
	stream := true
	req.Stream = &stream

	err = ollamaClient.Chat(context.Background(), req, func(resp api.ChatResponse) error {
		if len(resp.Message.Content) > 0 {
			fullResponse.WriteString(resp.Message.Content)
		}
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to call AI: %w", err)
	}

	// Parse the JSON response
	responseText := strings.TrimSpace(fullResponse.String())

	// Clean up the response - sometimes models wrap JSON in code blocks
	responseText = strings.TrimPrefix(responseText, "```json")
	responseText = strings.TrimPrefix(responseText, "```")
	responseText = strings.TrimSuffix(responseText, "```")
	responseText = strings.TrimSpace(responseText)

	var ollamaResp models.OllamaRecipeResponse
	err = json.Unmarshal([]byte(responseText), &ollamaResp)
	if err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w. Response: %s", err, responseText)
	}

	// Convert to internal Recipe model
	recipe := s.convertToRecipe(&ollamaResp, url, sharerID, sharerName)
	return recipe, nil
}

// convertToRecipe converts AI response to internal Recipe model
func (s *RecipeService) convertToRecipe(resp *models.OllamaRecipeResponse, url string, sharerID string, sharerName string) *models.Recipe {
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
		ID:          uuid.New().String(),
		Name:        resp.Name,
		Image:       resp.Image,
		URL:         url,
		Ingredients: ingredients,
		SharerID:    sharerID,
		SharerName:  sharerName,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}

// parseJSONLDRecipe parses JSON-LD schema and extracts recipe data
// Handles 3 formats: array, object with @graph, and direct Recipe object
func (s *RecipeService) parseJSONLDRecipe(jsonLD string, url string, sharerID string, sharerName string) (*models.Recipe, error) {
	// Try parsing as array first (Guardian, AllRecipes format)
	var dataArray []interface{}
	if err := json.Unmarshal([]byte(jsonLD), &dataArray); err == nil {
		for _, item := range dataArray {
			if itemMap, ok := item.(map[string]interface{}); ok {
				// Check if @type is "Recipe" or contains "Recipe" in array
				if s.isRecipeType(itemMap["@type"]) {
					return s.extractRecipeFromJSONLD(itemMap, url, sharerID, sharerName)
				}
			}
		}
	}

	// Try parsing as object
	var dataObj map[string]interface{}
	if err := json.Unmarshal([]byte(jsonLD), &dataObj); err != nil {
		return nil, fmt.Errorf("failed to parse JSON-LD: %w", err)
	}

	// Check if it has @graph (RecipeTinEats, BBC format)
	if graph, ok := dataObj["@graph"].([]interface{}); ok {
		for _, item := range graph {
			if itemMap, ok := item.(map[string]interface{}); ok {
				if s.isRecipeType(itemMap["@type"]) {
					return s.extractRecipeFromJSONLD(itemMap, url, sharerID, sharerName)
				}
			}
		}
	}

	// Check if it's a direct Recipe object (Gordon Ramsay format)
	if s.isRecipeType(dataObj["@type"]) {
		return s.extractRecipeFromJSONLD(dataObj, url, sharerID, sharerName)
	}

	return nil, fmt.Errorf("no Recipe object found in JSON-LD")
}

// isRecipeType checks if the @type field contains "Recipe"
// Handles: "Recipe", ["Recipe"], ["Recipe", "NewsArticle"], etc.
func (s *RecipeService) isRecipeType(typeField interface{}) bool {
	switch v := typeField.(type) {
	case string:
		return v == "Recipe"
	case []interface{}:
		for _, t := range v {
			if str, ok := t.(string); ok && str == "Recipe" {
				return true
			}
		}
	}
	return false
}

// extractRecipeFromJSONLD extracts recipe data from a JSON-LD Recipe object
func (s *RecipeService) extractRecipeFromJSONLD(recipeData map[string]interface{}, url string, sharerID string, sharerName string) (*models.Recipe, error) {
	// Extract recipe name
	name, _ := recipeData["name"].(string)
	if name == "" {
		return nil, fmt.Errorf("recipe name not found in JSON-LD")
	}

	// Extract ingredients
	var ingredients []models.Ingredient
	if ingredientsRaw, ok := recipeData["recipeIngredient"].([]interface{}); ok {
		for _, ingRaw := range ingredientsRaw {
			if ingStr, ok := ingRaw.(string); ok {
				// Parse ingredient string (e.g., "2 cups flour" or "350g sushi rice")
				ingredient := s.parseIngredientString(ingStr)
				ingredients = append(ingredients, ingredient)
			}
		}
	}

	if len(ingredients) == 0 {
		return nil, fmt.Errorf("no ingredients found in JSON-LD")
	}

	log.Printf("Extracted recipe from JSON-LD: %s with %d ingredients", name, len(ingredients))

	now := time.Now()
	return &models.Recipe{
		ID:          uuid.New().String(),
		Name:        name,
		URL:         url,
		Ingredients: ingredients,
		SharerID:    sharerID,
		SharerName:  sharerName,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

// parseIngredientString parses an ingredient string into structured data
// Examples: "2 cups flour", "350g sushi rice", "Fine sea salt"
func (s *RecipeService) parseIngredientString(ingredientStr string) models.Ingredient {
	// This is a simple parser - could be enhanced with more sophisticated parsing
	parts := strings.Fields(strings.TrimSpace(ingredientStr))

	if len(parts) == 0 {
		return models.Ingredient{Name: ingredientStr}
	}

	// Try to detect quantity and unit patterns
	// Pattern 1: "2 cups flour" or "350g rice"
	if len(parts) >= 2 {
		// Check if first part looks like a quantity (number or number with unit)
		firstPart := parts[0]

		// Check for patterns like "350g", "2tbsp", "1.5tsp"
		if hasNumberPrefix(firstPart) {
			quantity, unit := splitQuantityUnit(firstPart)
			if quantity != "" {
				name := strings.Join(parts[1:], " ")
				return models.Ingredient{
					Name:     name,
					Quantity: &quantity,
					Unit:     &unit,
				}
			}
		}

		// Check for patterns like "2 cups flour"
		if isNumeric(firstPart) && len(parts) >= 3 {
			quantity := firstPart
			unit := parts[1]
			name := strings.Join(parts[2:], " ")
			return models.Ingredient{
				Name:     name,
				Quantity: &quantity,
				Unit:     &unit,
			}
		}
	}

	// If no quantity/unit detected, use the whole string as name
	return models.Ingredient{Name: ingredientStr}
}

// hasNumberPrefix checks if a string starts with a number
func hasNumberPrefix(s string) bool {
	if len(s) == 0 {
		return false
	}
	c := s[0]
	return (c >= '0' && c <= '9') || c == '.'
}

// isNumeric checks if a string is a number
func isNumeric(s string) bool {
	for _, c := range s {
		if !((c >= '0' && c <= '9') || c == '.' || c == '-') {
			return false
		}
	}
	return len(s) > 0
}

// splitQuantityUnit splits "350g" into "350" and "g"
func splitQuantityUnit(s string) (quantity, unit string) {
	i := 0
	for i < len(s) && (s[i] >= '0' && s[i] <= '9' || s[i] == '.' || s[i] == '-') {
		i++
	}
	if i > 0 && i < len(s) {
		return s[:i], s[i:]
	}
	return "", ""
}

// GetMixRecipes returns all recipes for a given mixId
func (s *RecipeService) GetMixRecipes(mixId string) []*models.Recipe {
	mixCache := s.recipeStore[mixId]
	if mixCache == nil {
		return nil
	}

	recipes := make([]*models.Recipe, 0, len(mixCache))
	for _, recipe := range mixCache {
		recipes = append(recipes, recipe)
	}
	return recipes
}

// ClearMix removes all recipes for a given mixId
func (s *RecipeService) ClearMix(mixId string) {
	delete(s.recipeStore, mixId)
}

// GetMixRecipeCount returns the number of recipes for a given mixId
func (s *RecipeService) GetMixRecipeCount(mixId string) int {
	if mixCache := s.recipeStore[mixId]; mixCache != nil {
		return len(mixCache)
	}
	return 0
}

// HasMix checks if a mixId exists in the cache
func (s *RecipeService) HasMix(mixId string) bool {
	_, exists := s.recipeStore[mixId]
	return exists
}
