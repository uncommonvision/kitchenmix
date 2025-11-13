import { Check, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Recipe } from '@/types/websocket'
import { useRecipeContext } from '@/contexts/RecipeContext'

interface RecipeCardProps {
  recipe: Recipe
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const { selectedRecipes, selectRecipe } = useRecipeContext()
  const isSelected = selectedRecipes.includes(recipe.id)
  
  const handleClick = () => {
    selectRecipe(recipe.id, !isSelected)
  }

  const ingredientCount = recipe.ingredients?.length || 0
  const sourceDomain = recipe.url ? new URL(recipe.url).hostname : 'Unknown'

  return (
    <Card
      onClick={handleClick}
      className={`relative group cursor-pointer rounded-lg border transition-all duration-200 hover:shadow-md hover:scale-105 hover:z-10 ${
        isSelected
          ? 'border-ring ring-1 ring-ring bg-transparent shadow-sm'
          : 'border-border hover:border-primary/50'
      }`}
    >
      <div className={`absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
        isSelected
          ? 'border-ring bg-ring text-ring-foreground'
          : 'border-muted-foreground/30 bg-background group-hover:border-primary/50'
      }`}>
        {isSelected && <Check className="h-3 w-3" />}
      </div>

      <CardContent className="p-4">
        {/* Recipe Image */}
        <div className="mb-3 h-32 w-full rounded-md bg-muted overflow-hidden">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.name}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.parentElement!.innerHTML = '<div class="h-full w-full flex items-center justify-center"><span class="text-muted-foreground text-sm">🍳 Recipe</span></div>'
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="text-muted-foreground text-sm">🍳 Recipe</span>
            </div>
          )}
        </div>

        {/* Recipe Title */}
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground leading-tight">
            {recipe.name}
          </h3>
          
          {/* Recipe Metadata */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                📊 {ingredientCount} ingredients
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
              <span className="truncate">{sourceDomain}</span>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Added {new Date(recipe.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}