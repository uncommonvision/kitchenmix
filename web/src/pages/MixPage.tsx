import { useParams } from 'react-router-dom'
import { useMessagingService } from '@/hooks/useMessagingService'
import { useUserIdentity } from '@/hooks/useUserIdentity'
import { useToastService } from '@/services/toastService'
import { MixLayout } from "@/components/layout"
import { useEffect, useState } from 'react'
import RecipeUrlForm from '@/components/ui/RecipeUrlForm'
import { MessagesList } from '@/components/ui'
import UserNameDialog from '@/components/ui/UserNameDialog'

import type { ChatMessage, MessagePayload, RecipeUrlRequestPayload } from '@/types'

export default function MixPage() {
  const { id } = useParams<{ id: string }>()
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeProgressMessage, setRecipeProgressMessage] = useState('');
  const { user, setUser } = useUserIdentity()
  const toastService = useToastService()

  // Hydrate the user from localStorage on first mount
  useEffect(() => {
    try {
      const savedName = window.localStorage.getItem('mixUserName')
      if (savedName && savedName.trim() !== '' && !user) {
        setUser(savedName)
      }
    } catch { }
  }, [])

  // Ensure we have a valid UUID before attempting connection
  const validUuid = id && id.trim() !== "" ? id : null

  const { connectionState, error, sendMessage, sendRecipeUrlRequest, onMessage, reconnect } = useMessagingService({
    uuid: validUuid || "",
    autoConnect: !!validUuid && !!user
  });

  // Send USER_IDENTIFY message when connected
  useEffect(() => {
    if (connectionState === 'connected' && user) {
      import('@/services/websocket').then(({ websocketService }) => {
        websocketService.send('USER_IDENTIFY', {
          userId: user.id,
          userName: user.name
        })
      })
    }
  }, [connectionState, user])

  // Handle incoming messages
  useEffect(() => {
    const unsubscribe = onMessage((wsMessage) => {
      switch (wsMessage.type) {
        case 'MESSAGE':
          setMessages(prev => [...prev, wsMessage.payload])
          break
        case 'USER_JOINED': {
          // Show toast notification for user joined
          toastService.showUserJoined(wsMessage.payload.user.name)
          
          // Still add to message history for reference
          const joinMessage: ChatMessage = {
            id: `system-${Date.now()}`,
            text: `${wsMessage.payload.user.name} joined the chat`,
            sentAt: wsMessage.timestamp,
            isSystem: true,
            systemType: 'USER_JOINED'
          }
          setMessages(prev => [...prev, joinMessage])
          break
        }
        case 'USER_LEFT': {
          // Show toast notification for user left
          toastService.showUserLeft(wsMessage.payload.user.name)
          
          // Still add to message history for reference
          const leaveMessage: ChatMessage = {
            id: `system-${Date.now()}`,
            text: `${wsMessage.payload.user.name} left the chat`,
            sentAt: wsMessage.timestamp,
            isSystem: true,
            systemType: 'USER_LEFT'
          }
          setMessages(prev => [...prev, leaveMessage])
          break
        }
        case 'RECIPE_PROGRESS': {
          // Show toast notification for recipe progress
          toastService.showRecipeProgress(wsMessage.payload.phase, wsMessage.payload.message)
          
          // Update progress message displayed below the input
          setRecipeProgressMessage(wsMessage.payload.message);
          break;
        }
        case 'RECIPE_URL_RESPONSE': {
          // Recipe processing finished – clear loading state and progress message
          setRecipeLoading(false);
          setRecipeProgressMessage('');

          // Show toast notification based on success/error
          if (wsMessage.payload.status === 'success' && wsMessage.payload.recipe) {
            toastService.showRecipeSuccess(wsMessage.payload.recipe)
          } else {
            toastService.showRecipeError('Failed to process recipe')
          }

          // Add notification message about the successfully processed recipe
          const recipeNotification: ChatMessage = {
            id: `recipe-response-${Date.now()}`,
            text: `🍳 ${wsMessage.payload.request.sender.name} shared a recipe: ${wsMessage.payload.request.url}`,
            sentAt: wsMessage.timestamp,
            isSystem: true,
            systemType: 'RECIPE_URL_REQUEST'
          };
          setMessages(prev => [...prev, recipeNotification]);
          break;
        }
      }
    })

    return unsubscribe
  }, [onMessage, toastService])

  const handleMessageSubmit = (text: string) => {
    if (!user) return

    const messagePayload: Omit<MessagePayload, 'id' | 'sentAt'> = {
      sender: user,
      channel: { id: 'channel-1', name: 'General' },
      text
    }

    sendMessage(messagePayload)

    const optimisticMessage: ChatMessage = {
      ...messagePayload,
      id: `temp-${Date.now()}`,
      sentAt: new Date().toISOString()
    }
    setMessages(prev => [...prev, optimisticMessage])
  }

  const handleRecipeSubmit = (recipeUrl: string, _e: React.FormEvent) => {
    if (!user) return;

    // Set loading state when submitting
    setRecipeLoading(true);
    setRecipeProgressMessage('');

    // Create recipe submission payload
    const recipePayload: Omit<RecipeUrlRequestPayload, 'id' | 'sentAt'> = {
      sender: user,
      channel: { id: 'channel-1', name: 'General' },
      url: recipeUrl,
    };

    // Send via websocket
    sendRecipeUrlRequest(recipePayload);
  }

  const handleUserNameSubmit = (name: string) => {
    setUser(name)
  }

  return (
    <MixLayout>
      <UserNameDialog open={!user} onSubmit={handleUserNameSubmit} />

      {validUuid && user && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user.name}</span>
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <div className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-green-500' :
            connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`} />
          <span className="text-xs text-muted-foreground capitalize">
            {connectionState.replace('_', ' ')}
          </span>
          {error && (
            <span className="text-xs text-red-500">
              Error: {error.message}
            </span>
          )}
          {connectionState === 'error' && (
            <button
              onClick={reconnect}
              className="text-xs text-blue-500 hover:text-blue-700 underline"
            >
              Retry
            </button>
          )}
        </div>
      )}

      <h1 className="text-3xl font-bold text-foreground mb-4">{id}</h1>

      <RecipeUrlForm
        onSubmit={handleRecipeSubmit}
        isLoading={recipeLoading}
        progressMessage={recipeProgressMessage}
      />

      <div className="flex flex-col h-full space-y-6 pb-24">
        <div>

          {!validUuid && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-800">
                Waiting for valid session ID...
              </p>
            </div>
          )}

        </div>
      </div>


      {user && (
        <MessagesList
          messages={messages}
          currentUser={user}
          showInput={true}
          onMessageSubmit={handleMessageSubmit}
          inputPlaceholder="Type a message..."
        />
      )}
    </MixLayout>
  )
}
