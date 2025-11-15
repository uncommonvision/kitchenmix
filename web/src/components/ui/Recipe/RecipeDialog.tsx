import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import RecipeUrlForm from '@/components/ui/RecipeUrlForm'
import type { RecipeUrlRequestPayload } from '@/types'
import type { WebSocketMessage } from '@/types/websocket'

export interface RecipeDialogProps {
  open: boolean
  onClose: () => void
  user: {
    id: string
    name: string
    [key: string]: any
  }
  sendRecipeUrlRequest: (payload: Omit<RecipeUrlRequestPayload, 'id' | 'sentAt'>) => void
  onMessage: (callback: (wsMessage: WebSocketMessage) => void) => () => void
}

export default function RecipeDialog({ 
  open, 
  onClose, 
  user, 
  sendRecipeUrlRequest, 
  onMessage 
}: RecipeDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [shouldClose, setShouldClose] = useState(false)

  // Handle WebSocket messages to auto-close dialog on success
  useEffect(() => {
    if (!open) return

    const unsubscribe = onMessage((wsMessage) => {
      switch (wsMessage.type) {
        case 'RECIPE_ADDITIONS': {
          // Reset loading state when recipe processing completes
          setIsLoading(false)
          
          // Auto-close dialog when recipe processing completes
          if (wsMessage.payload.status === 'success') {
            setShouldClose(true)
            setTimeout(() => {
              onClose()
              setShouldClose(false)
            }, 100) // Small delay to show success state
          }
          break
        }
      }
    })

    return unsubscribe
  }, [open, onMessage, onClose])

  const handleRecipeSubmit = (recipeUrl: string, e: React.FormEvent) => {
    if (!user) return

    setIsLoading(true)

    const recipePayload: Omit<RecipeUrlRequestPayload, 'id' | 'sentAt'> = {
      sender: user,
      channel: { id: 'channel-1', name: 'General' },
      url: recipeUrl,
    }

    sendRecipeUrlRequest(recipePayload)
    // Loading state will be reset by WebSocket message handler
  }

  // Don't render if dialog should be closed
  if (!open || shouldClose) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">
            Add Recipe
          </h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            disabled={isLoading}
            className="h-8 w-8"
          >
            ×
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-6">
          Enter a recipe URL to add it to this mix
        </p>
        
        <RecipeUrlForm
          onSubmit={handleRecipeSubmit}
          isLoading={isLoading}
          clearForm={shouldClose}
        />
      </div>
    </div>
  )
}