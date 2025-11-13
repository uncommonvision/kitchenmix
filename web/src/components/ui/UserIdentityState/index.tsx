import type { User } from '@/types'

export interface UserIdentityStateProps {
  user: User | null
  mixId: string | undefined
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error'
  error: Error | null
  reconnect: () => void
}

export function UserIdentityState({
  user,
  mixId,
  connectionState,
  error,
  reconnect
}: UserIdentityStateProps) {
  // Only render when both mixId and user exist
  if (!mixId || !user) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{user.name}</span>
      </span>
      <span className="text-xs text-muted-foreground">•</span>
      <div
        className={`w-2 h-2 rounded-full ${connectionState === 'connected'
            ? 'bg-green-500'
            : connectionState === 'connecting'
              ? 'bg-yellow-500 animate-pulse'
              : 'bg-red-500'
          }`}
      />
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
  )
}

export default UserIdentityState
