import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { InputGroupAddon, InputGroupInput, InputGroupButton } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CircleCheck, TriangleAlert, LoaderPinwheel } from 'lucide-react'
import { useKeydownShortcut } from '@/hooks/useKeydownShortcut'
import type { RecipeUrlRequestPayload } from '@/types'
import type { WebSocketMessage } from '@/types/websocket'

// URL validation function
const isValidUrl = (url: string): boolean | null => {
  if (url === "") return null;
  if (!url || url.trim().length === 0) return false;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;

  try {
    // Validate the URL as-is since it includes the protocol
    const urlObj = new URL(url.trim());

    if (urlObj.protocol != "http:" && urlObj.protocol != "https:") {
      return false;
    }

    // Check that it has a valid domain
    return urlObj.hostname.length > 0 &&
      urlObj.hostname.includes('.') &&
      urlObj.hostname.split('.').pop()!.length >= 2;
  } catch {
    return false;
  }
};

export interface RecipeDialogProps {
  open: boolean
  onClose: () => void
  user: {
    id: string
    name: string
    [key: string]: any
  } | null
  sendRecipeUrlRequest: (payload: Omit<RecipeUrlRequestPayload, 'id' | 'sentAt'>) => void
  onMessage: (callback: (wsMessage: WebSocketMessage) => void) => () => void
}

export default function RecipeDialog({
  open,
  onClose,
  user,
  sendRecipeUrlRequest,
  onMessage
}: RecipeDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [shouldClose, setShouldClose] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [url, setUrl] = useState<string>("");
  const [progressMessage, setProgressMessage] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle WebSocket messages
  useEffect(() => {
    if (!open) return

    const unsubscribe = onMessage((wsMessage) => {
      switch (wsMessage.type) {
        case 'RECIPE_ADDITIONS': {
          // Reset loading state when recipe processing completes
          setIsLoading(false)

          // Auto-close dialog when recipe processing completes
          if (wsMessage.payload.status === 'success') {
            setShouldClose(true)
            setTimeout(() => {
              onClose()
              setShouldClose(false)
              setUrl("")
              setIsValid(null)
              setProgressMessage("")
            }, 100) // Small delay to show success state
          }
          break
        }
        case 'RECIPE_PROGRESS': {
          // Display progress messages
          setProgressMessage(wsMessage.payload.message)
          break
        }
      }
    })

    return unsubscribe
  }, [open, onMessage, onClose])

  // Handle form clearing when dialog should close
  useEffect(() => {
    if (shouldClose) {
      setUrl("");
      setIsValid(null);
      setProgressMessage("");
    }
  }, [shouldClose]);

  useKeydownShortcut(
    { key: 'l', ctrl: false, alt: false, shift: false, meta: false },
    () => inputRef.current?.focus(),
    'Focus Recipe Url Input',
    'Focus on the recipe url input field'
  )

  const getValidationIcon = () => {
    if (isValid == null) return null;

    return isValid ? (
      <CircleCheck className="text-green-500" size={16} />
    ) : (
      <TriangleAlert className="text-orange-500" size={16} />
    );
  };

  const getValidationTooltip = () => {
    if (!hasInput()) return "This is content in a tooltip.";
    return isValid ? "Valid URL format" : "Invalid URL format";
  };

  const handleCancel = () => {
    // Clear progress message and close the dialog
    setProgressMessage("");
    onClose()
  }

  const hasInput = (): boolean => {
    return url.length > 0;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isLoading) {
      let value = e.target.value;
      setUrl(value);
      setIsValid(isValidUrl(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isValid && !isLoading) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.currentTarget.blur()
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!isLoading) {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');

      setUrl(pastedText);
      setIsValid(isValidUrl(pastedText)); // Validate with current protocol
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isValid && !isLoading) {
      // Set loading state and process recipe
      setIsLoading(true)

      if (!user) return

      const recipePayload: Omit<RecipeUrlRequestPayload, 'id' | 'sentAt'> = {
        sender: user,
        channel: { id: 'channel-1', name: 'General' },
        url: url,
      }

      sendRecipeUrlRequest(recipePayload)
    }
  }

  // Don't render if dialog should be closed
  if (!open || shouldClose) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div
        className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">
            Add Recipe
          </h2>
          {/* Remove the close "x" button as per requirements */}
        </div>

        <form onSubmit={handleSubmit}>
          <TooltipProvider>
            <div>
              <div className="relative">
                <InputGroupInput
                  className="pr-7" // Add padding to the right to make space for the icon
                  disabled={isLoading}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="https://example.com/recipe"
                  ref={inputRef}
                  type="url"
                  value={url}
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <InputGroupAddon align="inline-end">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InputGroupButton className="rounded-full" size="icon-xs">
                          {getValidationIcon()}
                        </InputGroupButton>
                      </TooltipTrigger>
                      <TooltipContent>{getValidationTooltip()}</TooltipContent>
                    </Tooltip>
                  </InputGroupAddon>
                </div>
              </div>

              {/* Display progress message between input and button */}
              {progressMessage && (
                <div className="text-sm text-muted-foreground mt-2">
                  {progressMessage}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isValid || isLoading}
                  className="flex-1"
                >
                  Submit
                  {isLoading && (
                    <LoaderPinwheel className="h-4 w-4 animate-spin" />
                  )}
                </Button>
              </div>
            </div>
          </TooltipProvider>
        </form>
      </div>
    </div>
  )
}
