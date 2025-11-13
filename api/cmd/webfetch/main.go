package main

import (
	"fmt"
	"log"
	"os"

	"kitchenmix/api/internal/models"
	"kitchenmix/api/internal/services/recipe"
)

// getEnv gets environment variable with default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// displayRecipe displays the extracted recipe in a formatted way
func displayRecipe(recipe *models.Recipe) {
	fmt.Printf("✅ Recipe Name: %s\n", recipe.Name)

	// Display image if available
	if recipe.Image != nil {
		fmt.Printf("🖼️  Recipe Image: %s\n", *recipe.Image)
	} else {
		fmt.Printf("🖼️  Recipe Image: No image found\n")
	}

	// Display ingredients
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

	// Display source URL
	fmt.Printf("🔗 Source: %s\n", recipe.URL)

	// Display timestamps
	fmt.Printf("📅 Added: %s\n", recipe.CreatedAt.Format("2006-01-02 15:04:05"))

	// Full Recipe struct for debugging
	fmt.Printf("\n📋 Full Recipe Structure:\n%+v\n", recipe)
}

func main() {
	// Create recipe service
	service := recipe.NewRecipeService()

	// Target URL - can be overridden via environment variable
	targetURL := getEnv("TARGET_URL", "https://www.theguardian.com/food/2025/oct/11/meera-sodha-recipe-zaatar-roast-vegetables-whipped-feta")

	fmt.Printf("🚀 Starting recipe extraction from: %s\n", targetURL)

	// Extract recipe using service with progress callback
	recipe, err := service.GetRecipeByURL(targetURL, func(phase, status, message string) {
		fmt.Printf("📊 %s: %s - %s\n", phase, status, message)
	})

	if err != nil {
		log.Fatalf("❌ Failed to extract recipe: %v", err)
	}

	// Display results
	displayRecipe(recipe)

	fmt.Println("🏁 Webfetch prototype completed")
}
