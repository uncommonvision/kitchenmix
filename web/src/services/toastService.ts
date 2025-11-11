import { toast } from "sonner"
import { useDeviceDetection } from "@/hooks/useDeviceDetection"

export function useToastService() {
  const isMobile = useDeviceDetection()
  
  const getToastOptions = (baseOptions: any = {}) => ({
    ...baseOptions,
    position: isMobile ? "top-center" : "bottom-right",
    style: {
      ...(isMobile && {
        width: 'calc(100vw - 2rem)',
        margin: '1rem',
        fontSize: '16px'
      }),
      ...baseOptions.style
    }
  })
  
  const showUserJoined = (userName: string) => {
    toast.success(`${userName} joined the session`, 
      getToastOptions({
        description: "They're ready to collaborate!",
        duration: 3000
      }) as any
    )
  }
  
  const showUserLeft = (userName: string) => {
    toast(`${userName} left the session`,
      getToastOptions({
        description: "Hope to see them again soon!",
        duration: 3000
      }) as any
    )
  }
  
  const showRecipeProgress = (phase: string, message: string) => {
    const descriptions: Record<string, string> = {
      fetching: "Fetching recipe data...",
      parsing: "Parsing ingredients and steps...",
      analyzing: "Analyzing cooking methods...",
      completing: "Almost ready..."
    }
    
    toast.loading(message,
      getToastOptions({
        description: descriptions[phase] || "Processing...",
        duration: Infinity
      }) as any
    )
  }
  
  const showRecipeSuccess = (recipe: any) => {
    toast.success("Recipe ready! 🎉",
      getToastOptions({
        description: `${recipe.title || 'New recipe'} has been processed`,
        action: {
          label: "View Recipe",
          onClick: () => {
            // Scroll to recipe in the interface
            const recipeElement = document.querySelector(`[data-recipe-id="${recipe.id}"]`)
            if (recipeElement) {
              recipeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }
        }
      }) as any
    )
  }
  
  const showRecipeError = (errorMessage?: string) => {
    toast.error("Recipe processing failed",
      getToastOptions({
        description: errorMessage || "Please check the URL and try again",
        duration: 6000
      }) as any
    )
  }
  
  return {
    showUserJoined,
    showUserLeft,
    showRecipeProgress,
    showRecipeSuccess,
    showRecipeError
  }
}
