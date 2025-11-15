import { Utensils } from 'lucide-react'
import UserMenu from '../../ui/UserMenu'
import { useUserIdentity } from '@/hooks/useUserIdentity'
import { useMessagingService } from '@/hooks/useMessagingService'
import { useParams } from 'react-router-dom'

export default function Header() {
  const { user } = useUserIdentity()
  const { id } = useParams<{ id: string }>()
  const { connectionState } = useMessagingService({
    uuid: id || "",
    autoConnect: !!id && !!user
  })

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Utensils className="h-8 w-8 text-foreground" />
            <h1 className="text-xl font-bold text-foreground">Kitchen Mix</h1>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          <UserMenu
            user={user}
            connectionState={connectionState}
          />
        </div>
      </div>
    </header>
  )
}
