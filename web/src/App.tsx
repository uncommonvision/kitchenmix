import { Outlet } from 'react-router-dom'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import { useDeviceDetection } from "@/hooks/useDeviceDetection"

function App() {
  const isMobile = useDeviceDetection()
  
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Toaster 
        position={isMobile ? "top-center" : "bottom-right"}
        toastOptions={{
          duration: isMobile ? 3500 : 4000,
          style: {
            ...(isMobile && {
              width: 'calc(100vw - 2rem)',
              margin: '1rem',
              fontSize: '16px'
            })
          }
        }}
      />
      <Outlet />
    </ThemeProvider>
  )
}

export default App
