import { ChefHat, ShoppingCart, MessageSquare } from 'lucide-react'
import UserMenu from '../../ui/UserMenu'
import { useUserIdentity } from '@/hooks/useUserIdentity'
import { useMessagingService } from '@/hooks/useMessagingService'
import { useParams } from 'react-router-dom'
import { useNavigationContext } from '@/contexts/NavigationContext'

export default function Header() {
  const { user } = useUserIdentity()
  const { id } = useParams<{ id: string }>()
  const { connectionState } = useMessagingService({
    uuid: id || "",
    autoConnect: !!id && !!user
  })
  const { activeTab, setActiveTab } = useNavigationContext()

  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-padding-top">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-foreground">Kitchen Mix</h1>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {id && user && (
            <>
              <button
                onClick={() => setActiveTab('recipe')}
                className={`h-10 w-10 text-sm font-medium rounded-md transition-colors ${activeTab === 'recipe'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
              >
                <ChefHat className="w-5 h-5 inline" />
              </button>
              <button
                onClick={() => setActiveTab('messaging')}
                className={`h-10 w-10 text-sm font-medium rounded-md transition-colors ${activeTab === 'messaging'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
              >
                <MessageSquare className="w-5 h-5 inline" />
              </button>
              <button
                className="h-10 w-10 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <ShoppingCart className="w-5 h-5 inline" />
              </button>
            </>
          )}
          <UserMenu
            user={user}
            connectionState={connectionState}
          />
        </div>
      </div>
    </header>
  )
}
