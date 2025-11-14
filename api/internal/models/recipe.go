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
	Image       *string      `json:"image,omitempty"`
	Ingredients []Ingredient `json:"ingredients"`
	CreatedAt   time.Time    `json:"createdAt"`
	UpdatedAt   time.Time    `json:"updatedAt"`
}

// OllamaRecipeResponse represents the AI response structure for recipe extraction
type OllamaRecipeResponse struct {
	Name        string       `json:"name"`
	Image       *string      `json:"image,omitempty"`
	Ingredients []Ingredient `json:"ingredients"`
}
