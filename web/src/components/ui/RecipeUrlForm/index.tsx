import { useRef, useState } from 'react'
import { InputGroupAddon, InputGroupInput, InputGroupButton } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CircleCheck, TriangleAlert, LoaderPinwheel } from 'lucide-react'
import { useKeydownShortcut } from '@/hooks/useKeydownShortcut'

interface RecipeUrlFormProps {
  onSubmit: (recipeUrl: string, e: React.FormEvent) => void;
  isLoading?: boolean;
}

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

export default function RecipeUrlForm({
  onSubmit,
  isLoading = false,
}: RecipeUrlFormProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [url, setUrl] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null)

  const getValidationIcon = () => {
    // Show loader when loading
    if (isLoading) {
      return <LoaderPinwheel className="text-blue-500 animate-spin" size={16} />
    }

    if (isValid == null) return null;

    return isValid ? (
      <CircleCheck className="text-green-500" size={16} />
    ) : (
      <TriangleAlert className="text-orange-500" size={16} />
    );
  };

  useKeydownShortcut(
    { key: 'l', ctrl: false, alt: false, shift: false, meta: false },
    () => inputRef.current?.focus(),
    'Focus Recipe Url Input',
    'Focus on the recipe url input field'
  )

  const getValidationTooltip = () => {
    if (isLoading) return "Processing recipe...";
    if (!hasInput) return "This is content in a tooltip.";
    return isValid ? "Valid URL format" : "Invalid URL format";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isValid && !isLoading) {
      e.preventDefault();
      onSubmit(url, e);
      setUrl("");
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.currentTarget.blur()
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    setUrl(value);
    setIsValid(isValidUrl(value));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');

    setUrl(pastedText);
    setIsValid(isValidUrl(pastedText)); // Validate with current protocol
  };

  const hasInput = (): boolean => {
    return url.length > 0;
  }

  return (
    <TooltipProvider>
      <div>
        <div className="grid relative w-full">
          <InputGroupInput
            className="col-start-1 row-start-1"
            disabled={isLoading}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="https://example.com/recipe"
            ref={inputRef}
            type="url"
            value={url}
          />
          <InputGroupAddon align="inline-end" className="col-start-1 row-start-1">
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
    </TooltipProvider>
  )
}
