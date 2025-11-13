import RecipeCard from './RecipeCard'
import { useRecipeContext } from '@/contexts/RecipeContext'

interface RecipeListProps {
  emptyMessage?: string
}

export default function RecipeList({ emptyMessage = "No recipes yet" }: RecipeListProps) {
  const { recipes, selectedRecipes, clearSelection } = useRecipeContext()

  if (recipes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">{emptyMessage}</p>
          <p className="text-sm text-muted-foreground">
            Add a recipe URL below to get started
          </p>
        </div>
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
