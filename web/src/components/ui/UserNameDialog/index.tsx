import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface UserNameDialogProps {
  open: boolean
  onSubmit: (name: string) => void
}

export default function UserNameDialog({ open, onSubmit }: UserNameDialogProps) {
  // Determine initial open state based on localStorage presence
  const stored = typeof window !== 'undefined' ? window.localStorage.getItem('mixUserName') : null
  const shouldOpen = open && (!stored || stored.trim() === '')

  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Load persisted name once on mount (for possible edit scenario)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('mixUserName')
      if (saved) setName(saved)
    } catch {}
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) {
      // Persist for future visits
      try {
        window.localStorage.setItem('mixUserName', trimmed)
      } catch {}
      onSubmit(trimmed)
      setName('')
      setSubmitted(true)
    }
  }

  // Hide dialog if parent says it's closed OR we just submitted OR stored name exists
  if (!shouldOpen || submitted) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Join Mix
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Enter your name to participate in this mix
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoFocus
              required
              data-1p-ignore
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={!name.trim()}
          >
            Join Mix
          </Button>
        </form>
      </div>
    </div>
  )
}

