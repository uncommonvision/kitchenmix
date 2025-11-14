import { Outlet } from 'react-router-dom'
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import { RecipeProvider } from '@/contexts/RecipeContext'
import { useDeviceDetection } from "@/hooks/useDeviceDetection"

function App() {
  const isMobile = useDeviceDetection()

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            ...(isMobile && {
              width: '90vw',
              maxWidth: '400px',
              fontSize: '16px'
            })
          }
        }}
      />
      <RecipeProvider>
        <Outlet />
      </RecipeProvider>
    </ThemeProvider>
  )
}

export default App
