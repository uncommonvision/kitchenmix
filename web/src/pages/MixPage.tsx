import { useParams } from 'react-router-dom'
import { ChefHat, MessageSquare, Plus } from 'lucide-react'
import { useMessagingService } from '@/hooks/useMessagingService'
import { useUserIdentity } from '@/hooks/useUserIdentity'
import { useKeydownShortcut } from '@/hooks/useKeydownShortcut'
import { useToastService } from '@/services/toastService'
import { useRecipeContext } from '@/contexts/RecipeContext'
import { useNavigationContext } from '@/contexts/NavigationContext'
import { MixLayout } from "@/components/layout"
import { useEffect, useState } from 'react'
import { MessagesList } from '@/components/ui'
import UserNameDialog from '@/components/ui/UserNameDialog'

import { RecipeList } from '@/components/ui/Recipe'
import RecipeDialog from '@/components/ui/Recipe/RecipeDialog'

import type { ChatMessage, MessagePayload } from '@/types'
import type { Recipe } from '@/types/websocket'

export default function MixPage() {
  const { id } = useParams<{ id: string }>()
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { activeTab, setActiveTab } = useNavigationContext()
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const { user, setUser } = useUserIdentity()
  const { addRecipe } = useRecipeContext()
  const toastService = useToastService()

  // Hydrate the user from localStorage on first mount
  useEffect(() => {
    try {
      const savedName = window.localStorage.getItem('mixUserName')
      if (savedName && savedName.trim() !== '' && !user) {
        setUser(savedName)
      }
    } catch { }
  }, [user, setUser])

  const { connectionState, sendMessage, sendRecipeUrlRequest, onMessage } = useMessagingService({
    uuid: id || "",
    autoConnect: !!id && !!user
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
          toastService.showUserJoined(wsMessage.payload.user.name)
          break
        }
        case 'USER_LEFT': {
          toastService.showUserLeft(wsMessage.payload.user.name)
          break
        }
        case 'RECIPE_ADDITIONS': {
          if (wsMessage.payload.status === 'success') {
            wsMessage.payload.list?.forEach((recipe: Recipe) => {
              addRecipe(recipe)
            })
          }
          break
        }
      }
    })

    return unsubscribe
  }, [onMessage, toastService, addRecipe])

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

  const handleUserNameSubmit = (name: string) => {
    setUser(name)
  }

  const toggleActiveTab = () => {
    setActiveTab(activeTab === 'messaging' ? 'recipe' : 'messaging')
  }

  // Tab navigation hotkeys
  useKeydownShortcut(
    { key: 'Tab' },
    () => toggleActiveTab(),
    'Toggle between Tabs',
    'Press TAB to switch between tabs'
  )

  return (
    <MixLayout>
      <div className="flex flex-col flex-1 min-h-0">
        <UserNameDialog open={!user} onSubmit={handleUserNameSubmit} />

        {/* Section Header with Plus Button */}
        {id && user && (
          <div className="flex justify-between items-center pt-4 px-4">
            <h2 className="text-xl font-semibold text-foreground">
              {activeTab === 'recipe' ? 'Recipes' : 'Chat'}
            </h2>
            <button
              onClick={() => setRecipeDialogOpen(true)}
              className={`h-10 w-10 text-sm font-medium rounded-md transition-colors ${activeTab === 'recipe' 
                ? 'text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer' 
                : 'opacity-0 cursor-default'}`}
              disabled={activeTab !== 'recipe'}
            >
              <Plus className="w-5 h-5 inline" />
            </button>
          </div>
        )}

        {/* Tab Content */}
        {id && user && (
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'messaging' && (
              <div className="h-full flex flex-col">
                <MessagesList
                  messages={messages}
                  currentUser={user}
                  showInput={true}
                  onMessageSubmit={handleMessageSubmit}
                  inputPlaceholder="Type a message..."
                />
              </div>
            )}

            {activeTab === 'recipe' && (
              <RecipeList
              />
            )}
          </div>
        )}
      </div>

      <RecipeDialog
        open={recipeDialogOpen}
        onClose={() => setRecipeDialogOpen(false)}
        user={user}
        sendRecipeUrlRequest={sendRecipeUrlRequest}
        onMessage={onMessage}
      />
    </MixLayout>
  )
}
