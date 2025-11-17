# Implementation Plan: Add Navigation Icons to Header

## Issue Summary
Add the following right-aligned icons to the left of the user profile icon in the header:
- ChefHat icon - when tapped, displays the recipes tab and visually highlights the icon
- ShoppingCart icon - functionality to be determined
- MessageSquare icon - when tapped, displays the messaging tab and visually highlights the icon

## Current Implementation Analysis
1. Header component is located at `web/src/components/layout/Header/index.tsx`
2. Tab navigation is currently implemented in `web/src/pages/MixPage.tsx` with:
   - ChefHat icon for recipes tab
   - MessageSquare icon for messaging tab
3. Lucide icons are already being used in the project via `lucide-react` package
4. ShoppingCart icon is not currently imported but is available in `lucide-react`

## Technical Approach

### 1. Modify Header Component
- Update `web/src/components/layout/Header/index.tsx` to include the new icons
- Import required icons: ChefHat, ShoppingCart, MessageSquare from 'lucide-react'
- Add icons to the left of the UserMenu component in the header
- Ensure icons are the same size as the UserProfile icon
- Implement visual highlighting when icons are active

### 2. State Management
- Create a new context or extend existing context to manage the active navigation state
- This state will need to be shared between the Header and MixPage components
- Consider using React context or lifting state up to a common parent component

### 3. Navigation Integration
- Connect header icons to tab switching functionality in MixPage
- Modify MixPage to accept an external activeTab prop or respond to context changes
- Ensure proper highlighting synchronization between header icons and tab buttons

### 4. Styling
- Ensure consistent styling with existing UI components
- Use the same hover and active state styling as the tab buttons in MixPage
- Maintain responsive design for different screen sizes

## Implementation Steps

### Step 1: Create Navigation Context
1. Create a new context file `web/src/contexts/NavigationContext.tsx`
2. Define context with activeTab state and setter function
3. Wrap the application with this context provider

### Step 2: Update Header Component
1. Import required icons in `web/src/components/layout/Header/index.tsx`
2. Add navigation icons to the left of UserMenu
3. Connect icons to navigation context
4. Implement visual highlighting based on active tab

### Step 3: Modify MixPage Component
1. Update `web/src/pages/MixPage.tsx` to use navigation context
2. Remove local activeTab state if possible, or synchronize with context
3. Ensure tab switching still works with keyboard shortcuts

### Step 4: Testing
1. Verify icons appear correctly in header
2. Test tab switching functionality via header icons
3. Verify visual highlighting works correctly
4. Test responsive design on different screen sizes
5. Ensure existing functionality still works correctly

## Dependencies
- lucide-react (already installed)
- React context API (built into React)

## Estimated Size
MD (5-10 hours)

## Potential Challenges
1. State synchronization between Header and MixPage components
2. Ensuring consistent styling with existing tab navigation
3. Maintaining keyboard shortcut functionality
4. Properly managing component re-renders with context

## Files to Modify
1. `web/src/components/layout/Header/index.tsx` - Add navigation icons
2. `web/src/contexts/NavigationContext.tsx` - New file for navigation state
3. `web/src/pages/MixPage.tsx` - Update to use navigation context
4. Possibly `web/src/main.tsx` or root layout file - To add context provider
