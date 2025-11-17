# Implementation Plan: Multiple Add Recipe Dialog Changes

## Issue Summary
Make the following changes to the add recipe dialog:

- Remove the close window "x" from the dialog
- Extract the elements and functionality from RecipeUrlForm and migrate into the RecipeDialog component
- Remove the RecipeUrlForm component after all has migrated to the Recipe Dialog component
- Add a button under the recipe url input field with a default text value of input
- When the button text is submit and clicked, change the text value to cancel, add an animated pinwheel icon after the text, and disable the input field, and send the message type request url recipe
- When the button text is cancel, make the recipe dialog not visible
- When a message type of recipe progress is recieved, display the message text between the input field and the button
- Change the click away behavior of the recipe dialog so it will not hide the recipe dialog, only the button can do that when the text is cancel

## Technical Approach

### 1. Remove Close Button from Dialog
- Remove the "×" button from the RecipeDialog header
- This will prevent users from closing the dialog with the traditional "X" button

### 2. Extract RecipeUrlForm Functionality
- Move all state management and validation logic from RecipeUrlForm to RecipeDialog
- Move the URL validation function to RecipeDialog
- Move the input handling functions to RecipeDialog
- Remove the RecipeUrlForm component entirely after migration

### 3. Add New Button with Dynamic Behavior
- Create a new button component in RecipeDialog with the following states:
  - Default state: "Submit" text
  - Processing state: "Cancel" text with animated pinwheel icon
- Implement click handler that:
  - When in "Submit" state: validates URL, sends recipe request, changes to "Cancel" state
  - When in "Cancel" state: closes the dialog

### 4. Implement Progress Message Display
- Add state to track progress messages
- Display progress messages between the input field and the button
- Update progress messages when recipe progress WebSocket messages are received

### 5. Modify Dialog Close Behavior
- Remove the overlay click handler that closes the dialog
- Only allow closing via the new button when in "Cancel" state

## Implementation Steps

### Step 1: Update RecipeDialog Component
1. Copy all state and functions from RecipeUrlForm to RecipeDialog
2. Replace RecipeUrlForm component with inline implementation
3. Add new button with dynamic text and icon
4. Implement button state management
5. Add progress message state and display
6. Remove overlay click handler
7. Update styling to accommodate new elements

### Step 2: Remove RecipeUrlForm Component
1. Delete the RecipeUrlForm component file
2. Remove any remaining imports or references

### Step 3: Update WebSocket Message Handling
1. Add handling for recipe progress messages
2. Update existing recipe addition handling to work with new flow

### Step 4: Testing
1. Test dialog opening and closing behavior
2. Test URL validation and submission
3. Test progress message display
4. Test cancel functionality
5. Test responsive behavior on different screen sizes

## File Changes

### Modified Files
- `web/src/components/ui/Recipe/RecipeDialog.tsx` - Main implementation
- `web/src/pages/MixPage.tsx` - Remove RecipeUrlForm import (if any)

### Deleted Files
- `web/src/components/ui/RecipeUrlForm/index.tsx` - Component to be removed

## Dependencies
- Lucide React (for icons)
- WebSocket service for recipe processing
- Recipe context for state management

## Estimated Size
MD (5-10 hours)

This estimate accounts for:
- Component refactoring and migration
- State management updates
- UI implementation with proper styling
- WebSocket message handling updates
- Testing and debugging
