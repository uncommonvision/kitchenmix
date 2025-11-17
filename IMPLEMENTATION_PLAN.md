# Implementation Plan: Fix Recipe View Vertical and Horizontal Scrolling

## Issue Description
When using the desktop browser, the page layout adds vertical and horizontal scroll bars when hovering over the recipes. This is caused by the zoom factor being set when you hover over recipe cards.

## Root Cause Analysis
The issue is in the `RecipeCard.tsx` component where the hover effect includes `hover:scale-105` which scales the card by 5%. This scaling causes the card to temporarily exceed its container boundaries, triggering the appearance of scrollbars.

## Solution Approach
The solution involves modifying the CSS classes in the RecipeCard component to prevent the scaling effect from causing overflow. We'll use the `transform-origin` property and ensure the container has enough space to accommodate the scaling without triggering scrollbars.

## Implementation Steps

### 1. Modify RecipeCard Component
- Update the CSS classes in the RecipeCard component to prevent overflow when scaling
- Add `overflow-hidden` to the parent container to clip any overflow during hover
- Adjust the transform origin to ensure scaling is centered properly

### 2. Update RecipeList Container
- Ensure the RecipeList container has proper padding to accommodate the hover effect
- Add `overflow-hidden` to prevent scrollbars from appearing

### 3. Test the Fix
- Test in different browser window sizes
- Verify that hovering over recipes no longer triggers scrollbars
- Ensure the visual effect of the hover is still present but doesn't cause layout shifts

## Technical Details

### File: `web/src/components/ui/Recipe/RecipeCard.tsx`
- Modify the Card component's className to include `overflow-hidden`
- Adjust the hover effect to prevent overflow

### File: `web/src/components/ui/Recipe/RecipeList.tsx`
- Add padding or adjust the grid layout to accommodate the hover effect
- Ensure proper container sizing

## Expected Outcome
- No vertical or horizontal scrollbars appear when hovering over recipes
- The hover effect (scaling) is still visible but doesn't cause layout issues
- Improved user experience on desktop browsers

## Testing Plan
1. Open the application in a desktop browser
2. Navigate to the recipes view
3. Hover over various recipe cards
4. Verify that no scrollbars appear during hover
5. Test on different screen sizes and zoom levels
6. Confirm that the visual hover effect is still present and functional

## Time Estimate
- Implementation: 1-2 hours
- Testing: 1 hour
- Total: 2-3 hours (Size: XS)

## Risk Assessment
- Low risk: This is a CSS-only change that affects visual presentation
- No functional changes to the application logic
- Backward compatible with all browsers that support CSS transforms
