# Implementation Plan: Header Icon Navigation Change

## Issue Summary
Change the Header icon navigation to implement a z-index based system where one icon is displayed over others, with animation when tapping the active icon to reveal others.

## Current Implementation Analysis
1. In `Header/index.tsx`, there are three navigation icons (ChefHat, MessageSquare, ShoppingCart) and a UserMenu
2. Each icon has a simple click handler to switch tabs or perform actions
3. All icons are displayed in a row with equal positioning
4. The UserMenu component handles user-related actions

## Implementation Steps

### 1. Restructure Header Navigation State
- Create a new state management system for tracking the "focused" icon
- Implement z-index logic to determine which icon appears on top
- Add animation states for sliding icons

### 2. Implement Icon Stacking with Z-Index
- Modify the icon container to use absolute positioning
- Assign z-index values to each icon based on focus state
- The focused icon should have the highest z-index

### 3. Add Animation Logic
- When tapping the focused icon, animate other icons sliding out to the left
- When icons are revealed, tapping any icon should:
  - Make it the new focused icon
  - Update z-index values for all icons
  - Animate other icons sliding to the right under the new focus icon

### 4. Update Click Handlers
- Modify click handlers to implement the new interaction model
- Ensure the focused icon's onClick method is called appropriately

## Technical Details

### Files to Modify
- `web/src/components/layout/Header/index.tsx` - Main file to modify
- Possibly `web/src/components/ui/UserMenu/index.tsx` - If modifications needed for z-index behavior

### Component Changes

1. Add state management for icon focus and animation:
   ```tsx
   const [focusedIcon, setFocusedIcon] = useState<'chefhat' | 'messagesquare' | 'shoppingcart' | 'userprofile'>('chefhat');
   const [isExpanded, setIsExpanded] = useState(false);
   ```

2. Create a new icon container with absolute positioning:
   ```tsx
   <div className="relative flex items-center h-10">
     {/* Icons will be absolutely positioned with z-index */}
   </div>
   ```

3. Implement each icon with dynamic positioning and z-index:
   ```tsx
   <button
     onClick={() => handleIconClick('chefhat')}
     className={`absolute h-10 w-10 rounded-md transition-all duration-300 ${getIconClasses('chefhat')}`}
     style={{
       zIndex: getZIndex('chefhat'),
       transform: getTransform('chefhat')
     }}
   >
     <ChefHat className="w-5 h-5 inline" />
   </button>
   ```

4. Implement helper functions for dynamic styling:
   ```tsx
   const getZIndex = (icon: string) => {
     // Return z-index based on focus state
   };
   
   const getTransform = (icon: string) => {
     // Return transform based on expansion state and icon position
   };
   
   const handleIconClick = (icon: string) => {
     if (focusedIcon === icon && !isExpanded) {
       setIsExpanded(true);
     } else if (isExpanded) {
       setFocusedIcon(icon as any);
       setIsExpanded(false);
     } else {
       // Direct click on non-focused icon when not expanded
       setFocusedIcon(icon as any);
       // Call the appropriate action
     }
   };
   ```

## Animation Implementation

### Expansion Animation
- When the focused icon is tapped and icons are not expanded:
  - Animate other icons sliding out to the left with staggered delays
  - Use Tailwind classes or CSS transitions for smooth animation

### Focus Change Animation
- When an icon is selected from the expanded state:
  - Animate the selected icon to the focus position
  - Animate other icons sliding to the right under the new focus icon
  - Update z-index values to reflect new focus state

## Testing Plan
1. Verify that initially the ChefHat icon is displayed on top
2. Test that tapping the focused icon animates other icons sliding out to the left
3. Confirm that tapping any revealed icon makes it the new focused icon
4. Verify that other icons slide to the right under the new focus icon
5. Ensure that tapping the focused icon again calls its appropriate onClick method
6. Test that only one icon is the focus icon at a time
7. Verify z-index behavior is working correctly

## Dependencies
- Tailwind CSS v4.0 for styling and animations
- Lucide React icons (ChefHat, MessageSquare, ShoppingCart, User)
- React state management

## Estimated Size
L - 10-20 hours

This is a complex UI interaction that requires:
- State management for focus and expansion
- Complex CSS positioning and animations
- Careful handling of click events
- Thorough testing across different states
