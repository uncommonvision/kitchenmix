import RecipeCard from './RecipeCard'
import { useRecipeContext } from '@/contexts/RecipeContext'

export default function RecipeList() {
  const { clearSelection, recipes, selectedRecipes } = useRecipeContext()

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {selectedRecipes.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <div className="text-sm text-primary">
              {selectedRecipes.length} recipe{selectedRecipes.length === 1 ? '' : 's'} selected
            </div>
            <button
              onClick={clearSelection}
              className="text-xs text-primary hover:underline"
            >
              Clear selection
            </button>
          </div>
        )}

        {recipes.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              No recipes yet. Click the + button to add a recipe!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
