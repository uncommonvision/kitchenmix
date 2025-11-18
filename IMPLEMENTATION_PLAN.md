# Implementation Plan: Remove Duplicated Tab Navigation from Mix Page

## Issue Summary
The tab navigation was recently added to the mix page header. This navigation is now duplicated in the tab navigation area of the mix page. We need to remove the TabButtons from the mix page and replace them with a Section Header.

## Current Implementation Analysis
1. In `MixPage.tsx`, there's a tab navigation section with `TabButton` components for ChefHat (recipe) and MessageSquare (messaging)
2. The `RecipeList.tsx` component doesn't have its own tab navigation
3. The active tab is managed through `NavigationContext`

## Implementation Steps

### 1. Remove Tab Navigation from MixPage.tsx
- Remove the `TabButton` component definition
- Remove the tab navigation div that contains the ChefHat and MessageSquare buttons
- Remove the conditional plus button for recipes

### 2. Add Section Header Component
- Create a dynamic Section Header that displays:
  - "Recipes" when activeTab is 'recipe'
  - "Chat" when activeTab is 'messaging'
- Add appropriate padding to separate it from the fixed header

### 3. Update Conditional Rendering
- Ensure the Section Header is displayed above the tab content
- Maintain the existing functionality for switching between tabs via keyboard shortcuts

## Technical Details

### Files to Modify
- `web/src/pages/MixPage.tsx` - Main file to modify

### Component Changes
1. Remove:
   ```tsx
   const TabButton = ({ icon: Icon, label, tab }: { icon: LucideIcon; label?: string; tab: TabType }) => (
     <button
       onClick={() => setActiveTab(tab)}
       className={`h-10 w-10 text-sm font-medium rounded-md transition-colors ${activeTab === tab
         ? 'bg-primary text-primary-foreground'
         : 'text-muted-foreground hover:text-foreground hover:bg-muted'
         }`}
     >
       <Icon className="w-5 h-5 inline" />
       {label ? <span className="ml-2">{label}</span> : null}
     </button>
   )
   ```

2. Replace the tab navigation section:
   ```tsx
   {/* Tab Navigation */}
   {id && user && (
     <div className="flex justify-between items-center mb-2 px-4">
       <div className="flex gap-2">
         <TabButton icon={ChefHat} tab="recipe" />
         <TabButton icon={MessageSquare} tab="messaging" />
       </div>
       {activeTab === 'recipe' && (
         <button
           onClick={() => setRecipeDialogOpen(true)}
           className="h-10 w-10 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
         >
           <Plus className="w-5 h-5 inline" />
         </button>
       )}
     </div>
   )}
   ```

3. With a Section Header:
   ```tsx
   {/* Section Header */}
   {id && user && (
     <div className="pt-4 px-4">
       <h2 className="text-xl font-semibold">
         {activeTab === 'recipe' ? 'Recipes' : 'Chat'}
       </h2>
     </div>
   )}
   ```

## Testing Plan
1. Verify that the tab navigation still works via keyboard shortcuts (Tab key)
2. Confirm that the Section Header displays "Recipes" when on the recipe tab
3. Confirm that the Section Header displays "Chat" when on the messaging tab
4. Ensure proper spacing between the fixed header and the Section Header
5. Verify that the recipe dialog still opens when clicking the plus button in the header

## Dependencies
- Tailwind CSS v4.0 for styling
- Existing NavigationContext for tab management

## Estimated Size
XS - 0-0.5 hours
