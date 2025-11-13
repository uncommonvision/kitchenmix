import { useToastService } from '@/services/toastService'
import { useMessagingService } from '@/hooks/useMessagingService'
import { useRecipeContext } from '@/contexts/RecipeContext'
import RecipeUrlForm from '@/components/ui/RecipeUrlForm'
import { RecipeList } from '@/components/RecipeCard'
import { useEffect, useState } from 'react'
import type { RecipeUrlRequestPayload } from '@/types'

interface RecipeTabWrapperProps {
  user: {
    id: string
    name: string
    [key: string]: any
  } // User type from useUserIdentity
}

export default function RecipeTabWrapper({ user }: RecipeTabWrapperProps) {
  const { addRecipe, setLoading } = useRecipeContext()
  const toastService = useToastService()
  const [recipeLoading, setRecipeLoading] = useState(false)
  
  const { sendRecipeUrlRequest, onMessage } = useMessagingService({
    uuid: '', // Will be handled by parent
    autoConnect: true
  })

  // Handle WebSocket recipe messages
  useEffect(() => {
    const unsubscribe = onMessage((wsMessage) => {
      switch (wsMessage.type) {
        case 'RECIPE_PROGRESS': {
          toastService.showRecipeProgress(wsMessage.payload.phase, wsMessage.payload.message)
          break;
        }
        case 'RECIPE_ADDITIONS': {
          setRecipeLoading(false)
          setLoading(false)

          if (wsMessage.payload.status === 'success' && wsMessage.payload.recipe) {
            // Add recipe to context
            addRecipe(wsMessage.payload.recipe)
            toastService.showRecipeSuccess(wsMessage.payload.recipe, wsMessage.payload.request)
          } else {
            toastService.showRecipeError('Failed to process recipe')
          }
          break;
        }
      }
    })

    return unsubscribe
  }, [onMessage, toastService, addRecipe, setLoading])

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
      {/* Recipe List - Scrollable, takes available space */}
      <div className="overflow-y-auto pr-2">
        <RecipeList />
      </div>
      
      {/* Recipe URL Form - Pinned at bottom */}
      <RecipeUrlForm
        onSubmit={handleRecipeSubmit}
        isLoading={recipeLoading}
      />
    </div>
  )
}