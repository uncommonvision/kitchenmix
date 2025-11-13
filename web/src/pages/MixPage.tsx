import { useParams } from 'react-router-dom'
import { ChefHat, MessageSquare, type LucideIcon } from 'lucide-react'
import { useMessagingService } from '@/hooks/useMessagingService'
import { useUserIdentity } from '@/hooks/useUserIdentity'
import { useKeydownShortcut } from '@/hooks/useKeydownShortcut'
import { useToastService } from '@/services/toastService'
import { MixLayout } from "@/components/layout"
import { useEffect, useState } from 'react'
import { MessagesList } from '@/components/ui'
import UserNameDialog from '@/components/ui/UserNameDialog'
import UserIdentityState from '@/components/ui/UserIdentityState'
import { RecipeTabWrapper } from '@/components/RecipeCard'

import type { ChatMessage, MessagePayload } from '@/types'

type TabType = 'messaging' | 'recipe';

export default function MixPage() {
  const { id } = useParams<{ id: string }>()
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('messaging');
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
  }, [user, setUser])

  const { connectionState, error, sendMessage, onMessage, reconnect } = useMessagingService({
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

  const handleUserNameSubmit = (name: string) => {
    setUser(name)
  }

  const toggleActiveTab = () => {
    setActiveTab(activeTab === 'messaging' ? 'recipe' : 'messaging')
  }

  const TabButton = ({ icon: Icon, label, tab }: { icon: LucideIcon; label?: string; tab: TabType }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
    >
      <Icon className="w-4 h-4 inline" />
      {label ? <span className="ml-2">{label}</span> : null}
    </button>
  )

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

        {/* User Identity State and Tab Navigation */}
        {id && user && (
          <div className="flex items-center justify-between mb-2">
            <UserIdentityState
              user={user}
              mixId={id}
              connectionState={connectionState}
              error={error}
              reconnect={reconnect}
            />

            <div className="flex gap-2">
              <TabButton icon={MessageSquare} tab="messaging" />
              <TabButton icon={ChefHat} tab="recipe" />
            </div>
          </div>
        )}

        {/* Tab Content */}
        {id && user && (
          <div className="max-h-[calc(100vh-9rem)] flex-1 overflow-hidden">
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
              <RecipeTabWrapper user={user} />
            )}
          </div>
        )}
      </div>
    </MixLayout>
  )
}
