package recipe

import (
	"context"
	"encoding/json"
	"fmt"
	"kitchenmix/api/internal/models"
	"log"
	"strings"
	"time"

	"github.com/gocolly/colly/v2"
	"github.com/ollama/ollama/api"
)

type RecipeService struct {
	// Store for recipes indexed by URL
	recipeStore map[string]*models.Recipe
}

// OllamaRecipeResponse represents the expected JSON response structure from OLLAMA
type OllamaRecipeResponse struct {
	Name        string              `json:"name"`
	Ingredients []models.Ingredient `json:"ingredients"`
}

func NewRecipeService() *RecipeService {
	service := &RecipeService{
		recipeStore: make(map[string]*models.Recipe),
	}

	// Load recipes from JSON file (disabled for clean dynamic extraction)
	// service.loadRecipesFromFile()

	return service
}

// GetRecipeByURL fetches a recipe from a given URL
func (s *RecipeService) GetRecipeByURL(url string, progressCallback func(string, string, string)) (*models.Recipe, error) {
	// Check if we have it in our store
	if recipe, exists := s.recipeStore[url]; exists {
		if progressCallback != nil {
			progressCallback("complete", "completed", "Recipe found in local cache")
		}
		return recipe, nil
	}

	// If not found, try to dynamically extract from URL
	recipe, err := s.extractRecipeFromURL(url, progressCallback)
	if err != nil {
		log.Printf("Failed to extract recipe from URL %s: %v", url, err)
		if progressCallback != nil {
			progressCallback("complete", "error", fmt.Sprintf("Recipe not found for URL %s: %v", url, err))
		}
		return nil, fmt.Errorf("recipe not found for URL %s: %w", url, err)
	}

	return recipe, nil
}

// loadRecipesFromFile loads recipes from the JSON data file (disabled)
// This function is no longer used since we removed stub data loading
/*
func (s *RecipeService) loadRecipesFromFile() {
	// Get the current working directory and construct the path to recipes.json
	cwd, err := os.Getwd()
	if err != nil {
		log.Printf("Failed to get current working directory: %v", err)
		return
	}

	// Navigate to the data directory within the api directory
	recipesFile := filepath.Join(cwd, "data", "recipes.json")

	// Read the JSON file
	data, err := os.ReadFile(recipesFile)
	if err != nil {
		log.Printf("Failed to read recipes file: %v", err)
		return
	}

	// Parse the JSON
	var recipeJSON models.RecipeJSON
	if err := json.Unmarshal(data, &recipeJSON); err != nil {
		log.Printf("Failed to parse recipes JSON: %v", err)
		return
	}

	// Convert JSON items to Recipe objects and store them
	for _, recipeItem := range recipeJSON.Recipes {
		recipe := recipeItem.ToRecipe()
		s.recipeStore[recipe.URL] = recipe
		log.Printf("Loaded recipe: %s (URL: %s)", recipe.Name, recipe.URL)
	}

	log.Printf("Successfully loaded %d recipes from JSON file", len(recipeJSON.Recipes))
}
*/

// extractRecipeFromURL dynamically extracts a recipe from a given URL using web scraping and AI
func (s *RecipeService) extractRecipeFromURL(url string, progressCallback func(string, string, string)) (*models.Recipe, error) {
	// Send progress update that we're starting web content fetch
	if progressCallback != nil {
		progressCallback("fetching", "in_progress", fmt.Sprintf("Fetching content from %s", url))
	}

	// Fetch web content
	htmlContent, err := s.fetchWebContent(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch web content: %w", err)
	}

	// Send progress update that we completed fetching
	if progressCallback != nil {
		progressCallback("fetching", "completed", "Content retrieved successfully")
	}

	// Send progress update that we're starting AI extraction
	if progressCallback != nil {
		progressCallback("extracting", "in_progress", "Extracting ingredients with AI...")
	}

	// Extract recipe using AI
	recipe, err := s.extractRecipe(htmlContent, url)
	if err != nil {
		return nil, fmt.Errorf("failed to extract recipe: %w", err)
	}

	// Send progress update that extraction is complete
	if progressCallback != nil {
		progressCallback("extracting", "completed", fmt.Sprintf("Found recipe with %d ingredients", len(recipe.Ingredients)))
	}

	// Send completion progress
	if progressCallback != nil {
		progressCallback("complete", "completed", "Recipe processed successfully")
	}

	// Cache the extracted recipe
	s.recipeStore[url] = recipe

	return recipe, nil
}

// fetchWebContent scrapes the given URL and returns the HTML content
func (s *RecipeService) fetchWebContent(url string) (string, error) {
	c := colly.NewCollector()

	var htmlContent string

	c.OnScraped(func(r *colly.Response) {
		htmlContent = string(r.Body)
	})

	err := c.Visit(url)
	if err != nil {
		return "", fmt.Errorf("failed to visit URL: %w", err)
	}

	return htmlContent, nil
}

// createExtractionPrompt creates the prompt for AI recipe extraction
func (s *RecipeService) createExtractionPrompt(htmlContent string) string {
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

// extractRecipe sends HTML to AI and parses the response
func (s *RecipeService) extractRecipe(htmlContent, url string) (*models.Recipe, error) {
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

	var ollamaResp OllamaRecipeResponse
	err = json.Unmarshal([]byte(responseText), &ollamaResp)
	if err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w. Response: %s", err, responseText)
	}

	// Convert to internal Recipe model
	recipe := s.convertToRecipe(&ollamaResp, url)
	return recipe, nil
}

// convertToRecipe converts AI response to internal Recipe model
func (s *RecipeService) convertToRecipe(resp *OllamaRecipeResponse, url string) *models.Recipe {
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
