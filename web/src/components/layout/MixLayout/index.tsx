import type { ReactNode } from 'react'
import Header from '../Header'
import { KeyboardShortcutsOverlay } from '@/components/ui'

interface DefaultLayoutProps {
  children: ReactNode
}

export default function MixLayout({ children }: DefaultLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background font-sans antialiased">
      <Header />
      <main className="flex-1 flex flex-col px-4 py-4">
        <div className="container mx-auto flex flex-col flex-1 min-h-0">
          {children}
        </div>
      </main>
      <KeyboardShortcutsOverlay />
    </div>
  )
}
