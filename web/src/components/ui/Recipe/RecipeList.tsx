import RecipeCard from './RecipeCard'
import { useRecipeContext } from '@/contexts/RecipeContext'
import { useToastService } from '@/services/toastService'
import { useEffect, useState } from 'react'
import RecipeUrlForm from '@/components/ui/RecipeUrlForm'
import type { RecipeUrlRequestPayload } from '@/types'
import type { WebSocketMessage } from '@/types/websocket'

interface RecipeListProps {
  user: {
    id: string
    name: string
    [key: string]: any
  } // User type from useUserIdentity
  sendRecipeUrlRequest: (payload: Omit<RecipeUrlRequestPayload, 'id' | 'sentAt'>) => void
  onMessage: (callback: (wsMessage: WebSocketMessage) => void) => () => void
}

export default function RecipeList({ user, sendRecipeUrlRequest, onMessage }: RecipeListProps) {
  const { clearSelection, recipes, selectedRecipes, setLoading } = useRecipeContext()
  const toastService = useToastService()
  const [recipeLoading, setRecipeLoading] = useState(false)
  const [clearForm, setClearForm] = useState(false)

  // Handle WebSocket recipe messages
  useEffect(() => {
    const unsubscribe = onMessage((wsMessage) => {
      switch (wsMessage.type) {
        case 'RECIPE_PROGRESS': {
          toastService.showRecipeProgress(wsMessage.payload.phase, wsMessage.payload.message)
          break;
        }
        case 'RECIPE_ADDITIONS': {
          // Only handle UI-related aspects here (toast, form clearing)
          // Recipe data is added to context in MixPage to avoid race conditions

          setRecipeLoading(false)
          setLoading(false)

          if (wsMessage.payload.status === 'success') {
            if (wsMessage.payload.list && wsMessage.payload.list.length > 0) {
              // Show toast only for new submissions (when user just submitted)
              // For existing recipes on join, MixPage handles the context update
              toastService.showRecipeSuccess(wsMessage.payload.list, {} as RecipeUrlRequestPayload)
            } else {
              toastService.showRecipeError('No recipes found in response')
            }
          } else {
            toastService.showRecipeError('Failed to process recipe')
          }

          // Clear form after submission (not needed for existing recipes)
          setClearForm(true)
          setTimeout(() => setClearForm(false), 100)
          break;
        }
      }
    })

    return unsubscribe
  }, [onMessage, toastService, setLoading])

  const handleRecipeSubmit = (recipeUrl: string, _e: React.FormEvent) => {
    if (!user) return;

    setRecipeLoading(true)
    setLoading(true)

    const recipePayload: Omit<RecipeUrlRequestPayload, 'id' | 'sentAt'> = {
      sender: user,
      channel: { id: 'channel-1', name: 'General' },
      url: recipeUrl,
    };

    sendRecipeUrlRequest(recipePayload);
  }

  return (
    <div className="grid grid-rows-[1fr_auto] h-full min-h-0">
      <div className="overflow-y-auto">
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
              Add a recipe URL below to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
              />
            ))}
          </div>
        )}
      </div>

      <RecipeUrlForm
        onSubmit={handleRecipeSubmit}
        isLoading={recipeLoading}
        clearForm={clearForm}
      />
    </div>
  )
}
