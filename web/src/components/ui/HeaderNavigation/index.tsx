import { ChefHat, ShoppingCart, MessageSquare } from 'lucide-react'
import UserMenu from '../UserMenu'
import { useNavigationContext } from '@/contexts/NavigationContext'
import type { TabType } from '@/contexts/NavigationContext'
import { useState } from 'react'

export default function HeaderNavigation() {
  const { activeTab, setActiveTab } = useNavigationContext()

  // State for icon focus and expansion
  const [focusedIcon, setFocusedIcon] = useState<'chefhat' | 'messagesquare' | 'shoppingcart'>('chefhat')
  const [isExpanded, setIsExpanded] = useState(false)

  // Helper functions for dynamic styling
  const getZIndex = (tab: TabType) => {
    if (tab === activeTab) return 30
    if (isExpanded) return 20
    return 10
  }

  const getTransform = (icon: string) => {
    if (!isExpanded) return 'translateX(0)'

    const positions: Record<string, string> = {
      'chefhat': 'translateX(0)',
      'messagesquare': 'translateX(-120%)',
      'shoppingcart': 'translateX(-240%)'
    }

    return positions[icon] || 'translateX(0)'
  }

  const getOpacity = (tab: TabType) => {
    if (isExpanded) return 1
    return tab === activeTab ? 1 : 0
  }

  const handleIconClick = (icon: 'chefhat' | 'messagesquare' | 'shoppingcart') => {
    if (focusedIcon === icon && !isExpanded) {
      // Tap on focused icon when not expanded - expand icons
      setIsExpanded(true)
    } else if (isExpanded) {
      // Tap on any icon when expanded - make it focused and collapse
      setFocusedIcon(icon)
      setIsExpanded(false)

      // Call the appropriate action based on the icon
      if (icon === 'chefhat') {
        setActiveTab('recipe')
      } else if (icon === 'messagesquare') {
        setActiveTab('messaging')
      } else if (icon === 'shoppingcart') {
        setActiveTab('grocerylist')
      }

    } else {
      // Tap on non-focused icon when not expanded - make it focused
      setFocusedIcon(icon)
      setIsExpanded(false)

      // Call the appropriate action based on the icon
      if (icon === 'chefhat') {
        setActiveTab('recipe')
      } else if (icon === 'messagesquare') {
        setActiveTab('messaging')
      } else if (icon === 'shoppingcart') {
        setActiveTab('grocerylist')
      }
    }
  }

  const getIconClasses = (icon: 'chefhat' | 'messagesquare' | 'shoppingcart') => {
    if (icon === 'chefhat' && activeTab === 'recipe') {
      return 'bg-primary text-primary-foreground'
    }

    if (icon === 'messagesquare' && activeTab === 'messaging') {
      return 'bg-primary text-primary-foreground'
    }

    if (icon === 'shoppingcart' && activeTab === 'grocerylist') {
      return 'bg-primary text-primary-foreground'
    }

    return 'text-muted-foreground hover:text-foreground hover:bg-muted'
  }

  return (
    <div className="flex items-center">
      <div className="relative flex items-center h-10 w-10 mr-2">
        {/* ChefHat Icon (focused icon) - rendered last to appear on top */}
        <button
          onClick={() => handleIconClick('chefhat')}
          className={`absolute h-10 w-10 rounded-md transition-all duration-300 ${getIconClasses('chefhat')}`}
          style={{
            zIndex: getZIndex('recipe'),
            transform: getTransform('chefhat'),
            opacity: getOpacity('recipe'),
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <ChefHat className="w-5 h-5 inline" />
        </button>

        {/* MessageSquare Icon */}
        <button
          onClick={() => handleIconClick('messagesquare')}
          className={`absolute h-10 w-10 rounded-md transition-all duration-300 ${getIconClasses('messagesquare')}`}
          style={{
            zIndex: getZIndex('messaging'),
            transform: getTransform('messagesquare'),
            opacity: getOpacity('messaging'),
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <MessageSquare className="w-5 h-5 inline" />
        </button>

        {/* ShoppingCart Icon */}
        <button
          onClick={() => handleIconClick('shoppingcart')}
          className={`absolute h-10 w-10 rounded-md transition-all duration-300 ${getIconClasses('shoppingcart')}`}
          style={{
            zIndex: getZIndex('grocerylist'),
            transform: getTransform('shoppingcart'),
            opacity: getOpacity('grocerylist'),
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <ShoppingCart className="w-5 h-5 inline" />
        </button>
      </div>

      {/* UserMenu component for the dropdown menu */}
      <UserMenu />
    </div>
  )
}
