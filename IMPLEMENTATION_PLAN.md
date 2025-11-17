# Implementation Plan: Recipe Card Info Updates

## Issue Summary
Update the recipe card component to:
- Remove ingredients icon and count
- Make the recipe URL a link that opens in a new tab
- Remove the "Added at" time
- Replace "Added at" time with "Added by" (sharererName of the recipe)

## Current Implementation Analysis
The recipe card is implemented in `web/src/components/ui/Recipe/RecipeCard.tsx` and contains:
- Recipe image display
- Recipe title
- Metadata section with:
  - Ingredient count with icon (📊 {ingredientCount} ingredients)
  - Recipe URL domain with external link icon
  - Creation date ("Added {date}")

## Required Changes

### 1. Remove Ingredients Icon and Count
- Remove the div containing the ingredient count display:
```jsx
<div className="flex items-center gap-2 text-xs text-muted-foreground">
  <span className="flex items-center gap-1">
    📊 {ingredientCount} ingredients
  </span>
</div>
```

### 2. Make Recipe URL a Clickable Link
- Modify the URL display to be an actual anchor tag with `target="_blank"` and `rel="noopener noreferrer"`
- Update the styling to maintain visual consistency

### 3. Remove "Added at" Time
- Remove the div that displays the creation date:
```jsx
<div className="text-xs text-muted-foreground">
  Added {new Date(recipe.createdAt).toLocaleDateString()}
</div>
```

### 4. Add "Added by" Information
- Add a new line to display the sharererName from the recipe object
- Place this after the URL display in the metadata section

## Implementation Steps

1. Modify `RecipeCard.tsx` component:
   - Remove ingredient count display
   - Convert URL domain display to clickable link
   - Remove creation date display
   - Add sharererName display

2. Test changes:
   - Verify recipe cards display correctly
   - Confirm URL links open in new tabs
   - Check that sharererName displays properly
   - Ensure responsive design is maintained

## Technical Considerations

- Ensure the recipe object contains the `sharererName` property
- Handle cases where sharererName might be undefined/null
- Maintain existing styling and hover effects
- Ensure accessibility is preserved for the new link

## Estimated Size
SM (1-2 hours)
- 1 hour for implementation
- 1 hour for testing and refinement
