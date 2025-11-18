import { ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import type { Recipe } from '@/types/websocket'
import { useRecipeContext } from '@/contexts/RecipeContext'

interface RecipeCardProps {
  recipe: Recipe
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const { selectedRecipes, selectRecipe } = useRecipeContext()
  const isSelected = selectedRecipes.includes(recipe.id)

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger selection if not clicking on the checkbox
    if (!(e.target as HTMLElement).closest('button')) {
      selectRecipe(recipe.id, !isSelected)
    }
  }

  const sourceDomain = recipe.url ? new URL(recipe.url).hostname : 'Unknown'

  return (
    <Card
      onClick={handleClick}
      className={`relative group cursor-pointer rounded-lg border transition-all duration-200 hover:shadow-md hover:scale-105 hover:z-10 overflow-hidden ${isSelected
        ? 'border-ring ring-1 ring-ring bg-transparent shadow-sm'
        : 'border-border hover:border-primary/50'
        }`}
    >
      <CardContent className="p-0 overflow-hidden">
        <div className="mb-3 h-32 w-full rounded-t-md bg-muted overflow-hidden">
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

        <div className="px-4 pb-4 space-y-2">
          <h3 className="font-semibold text-foreground leading-tight">
            {recipe.name}
          </h3>

          {/* Recipe Metadata */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
              <a
                href={recipe.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {sourceDomain}
              </a>
            </div>

            <div className="text-xs text-muted-foreground">
              Added by {recipe.sharerName || 'Unknown'}
            </div>
          </div>
        </div>

        <div className="absolute bottom-2 right-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => selectRecipe(recipe.id, !isSelected)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </CardContent>
    </Card>
  )
}
