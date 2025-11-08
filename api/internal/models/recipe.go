package models

import "time"

// GroceryItem represents a grocery item with categorization
type GroceryItem struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Category string `json:"category"`
}

// Ingredient represents an ingredient in a recipe
type Ingredient struct {
	Name        string       `json:"name"`
	GroceryItem *GroceryItem `json:"groceryItem,omitempty"` // Optional field
	Quantity    *string      `json:"quantity"`
	Unit        *string      `json:"unit"`
}

// Recipe represents a complete recipe
type Recipe struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	URL         string       `json:"url"`
	Ingredients []Ingredient `json:"ingredients"`
	CreatedAt   time.Time    `json:"createdAt"`
	UpdatedAt   time.Time    `json:"updatedAt"`
}

// RecipeJSON represents the JSON structure in the file
type RecipeJSON struct {
	Recipes []RecipeJSONItem `json:"recipes"`
}

// RecipeJSONItem represents a recipe in the JSON file
type RecipeJSONItem struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	URL         string       `json:"url"`
	Ingredients []Ingredient `json:"ingredients"`
}

// ToRecipe converts RecipeJSONItem to Recipe with timestamps
func (r *RecipeJSONItem) ToRecipe() *Recipe {
	now := time.Now()
	return &Recipe{
		ID:          r.ID,
		Name:        r.Name,
		URL:         r.URL,
		Ingredients: r.Ingredients,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}
