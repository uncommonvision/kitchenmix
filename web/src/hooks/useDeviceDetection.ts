import { useState, useEffect } from 'react'

export function useDeviceDetection() {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkDevice = () => {
      // Option 1: Touch capability + screen size detection
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isSmallScreen = window.innerWidth <= 768
      
      // Combine both criteria for accurate mobile detection
      // Touch capability catches hybrid devices, screen size filters tablets
      const mobile = hasTouch && isSmallScreen
      
      setIsMobile(mobile)
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
  }, [])
  
  return isMobile
}
