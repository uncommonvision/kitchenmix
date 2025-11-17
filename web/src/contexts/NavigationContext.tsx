import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export type TabType = 'messaging' | 'recipe';

export interface NavigationContextValue {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

export interface NavigationProviderProps {
  children: ReactNode
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [activeTab, setActiveTab] = useState<TabType>('recipe')

  const contextValue: NavigationContextValue = {
    activeTab,
    setActiveTab
  }

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigationContext(): NavigationContextValue {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigationContext must be used within a NavigationProvider')
  }
  return context
}
