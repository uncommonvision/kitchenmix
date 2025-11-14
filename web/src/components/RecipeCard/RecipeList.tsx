import RecipeCard from './RecipeCard'
import { useRecipeContext } from '@/contexts/RecipeContext'

export default function RecipeList() {
  const { recipes, selectedRecipes, clearSelection } = useRecipeContext()

  if (recipes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">
          Add a recipe URL below to get started
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selection Summary */}
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

      {/* Recipe Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
          />
        ))}
      </div>
    </div>
  )
}
