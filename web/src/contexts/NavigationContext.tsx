import { createContext, useContext, useState } from 'react'
import { useKeydownShortcut } from '@/hooks/useKeydownShortcut'
import type { ReactNode } from 'react'

export type TabType = 'messaging' | 'recipe' | 'grocerylist';

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

  const tabs: TabType[] = ["recipe", "messaging", "grocerylist"]

  const toggleActiveTab = () => {
    const index = tabs.findIndex((value) => activeTab == value)

    if (index === tabs.length - 1) {
      setActiveTab(tabs[0])
    } else {
      setActiveTab(tabs[index + 1])
    }
  }

  useKeydownShortcut(
    { key: 'Tab' },
    () => toggleActiveTab(),
    'Toggle between Tabs',
    'Press TAB to switch between tabs'
  )

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
