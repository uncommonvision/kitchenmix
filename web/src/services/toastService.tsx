import { toast } from "sonner"
import { ChefHat, CookingPot, Users } from "lucide-react"
import { useDeviceDetection } from "@/hooks/useDeviceDetection"
import type { Recipe, RecipeUrlRequestPayload } from "@/types"

export function useToastService() {
  const isMobile = useDeviceDetection()

  const getToastOptions = (baseOptions: any = {}) => ({
    ...baseOptions,
    position: 'top-center',
    // position: isMobile ? "top-center" : "bottom-right",
    style: {
      ...(isMobile && {
        width: 'calc(100vw - 2rem)',
        margin: '1rem',
        fontSize: '16px'
      }),
      ...baseOptions.style
    }
  })

  const showRecipeProgress = (_phase: string, message: string) => {
    toast.success(message,
      getToastOptions({
        description: null,
        duration: 2000,
        icon: <CookingPot className="h-4 w-4 text-gray-500" />,
      }) as any
    )
  }

  const showRecipeSuccess = (recipe: Recipe, request: RecipeUrlRequestPayload) => {
    toast(`${recipe.name} recipe has been added by ${request.sender.name}! 🎉`,
      getToastOptions({
        action: {
          label: "View Recipe",
          onClick: (_toastId: string | number) => {
            window.open(recipe.url, "_blank", "noopener,noreferrer")
          }
        },
        description: null,
        duration: 4000,
        icon: <ChefHat className="h-4 w-4 text-gray-500" />,
      }) as any
    )
  }

  const showRecipeError = (errorMessage?: string) => {
    const toastId = toast.error("Recipe processing failed",
      getToastOptions({
        action: {
          label: "Dismiss",
          onClick: () => toast.dismiss(toastId),
        },
        description: errorMessage || "Please check the URL and try again",
        duration: Infinity,
      }) as any
    )
  }

  const showUserJoined = (userName: string) => {
    toast(`${userName} joined the session`,
      getToastOptions({
        description: "Good to see you!",
        duration: 3000,
        icon: <Users className="h-4 w-4 text-gray-500" />,
      }) as any
    )
  }

  const showUserLeft = (userName: string) => {
    toast(`${userName} left the session`,
      getToastOptions({
        description: "Until next time!",
        duration: 3000,
        icon: <Users className="h-4 w-4 text-gray-500" />,
      }) as any
    )
  }

  return {
    showRecipeProgress,
    showRecipeSuccess,
    showRecipeError,
    showUserJoined,
    showUserLeft,
  }
}
