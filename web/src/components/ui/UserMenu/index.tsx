import { User, Settings, LogOut } from 'lucide-react'
import { useState, useRef } from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useKeydownShortcut } from '@/hooks/useKeydownShortcut'
import { useUserIdentity } from '@/hooks/useUserIdentity'
import type { User as UserType } from '@/types'

interface UserMenuProps {
  user: UserType | null
  connectionState?: 'disconnected' | 'connecting' | 'connected' | 'error'
  error?: Error | null
  reconnect?: () => void
}

export default function UserMenu({ user, connectionState, error, reconnect }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { clearUser } = useUserIdentity()

  const toggleOpen = () => setIsOpen(prev => !prev)

  useClickOutside(menuRef, () => setIsOpen(false))
  useKeydownShortcut(
    { key: 'u', ctrl: false, alt: false, shift: false, meta: false },
    toggleOpen,
    'Toggle User Menu',
    'Open or close the user menu'
  )

  const handleSignOut = () => {
    clearUser()
    window.localStorage.removeItem('mixUserName')
    setIsOpen(false)
  }

  const getConnectionStatusColor = () => {
    if (!connectionState) return 'bg-gray-400'
    switch (connectionState) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500 animate-pulse'
      case 'error': return 'bg-red-500'
      default: return 'bg-red-500'
    }
  }

  const getConnectionStatusText = () => {
    if (!connectionState) return 'No connection'
    return connectionState.replace('_', ' ')
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleOpen}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 w-10 cursor-pointer"
      >
        <div className="relative h-10 w-10">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-accent cursor-pointer transition-colors">
            <User className="h-7 w-7 text-muted-foreground" />
          </div>
          {connectionState && (
            <div 
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${getConnectionStatusColor()}`}
            />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
          {user && (
            <>
              <div className="px-3 py-2">
                <div className="text-sm font-semibold">
                  {user.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {user.id}
                </div>
                {connectionState && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`} />
                    <span className="text-xs text-muted-foreground capitalize">
                      {getConnectionStatusText()}
                    </span>
                  </div>
                )}
                {error && (
                  <div className="text-xs text-red-500 mt-1">
                    Error: {error.message}
                  </div>
                )}
                {connectionState === 'error' && reconnect && (
                  <button
                    onClick={reconnect}
                    className="text-xs text-blue-500 hover:text-blue-700 underline mt-1"
                  >
                    Retry
                  </button>
                )}
              </div>
              <div className="my-1 h-px bg-border" />
            </>
          )}
          
          <button className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-foreground">
            <User className="mr-2 h-4 w-4" />
            Profile
          </button>
          
          <button className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-foreground">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </button>
          
          <div className="my-1 h-px bg-border" />
          
          <button 
            onClick={handleSignOut}
            className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
