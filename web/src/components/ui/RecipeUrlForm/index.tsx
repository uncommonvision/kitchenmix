import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput, InputGroupButton } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CircleCheck, TriangleAlert } from 'lucide-react'
import { useState } from 'react'

interface RecipeUrlFormProps {
  recipeUrl: string;
  setRecipeUrl: (url: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

// URL validation function
const isValidUrl = (url: string): boolean => {
  if (!url || url.trim().length === 0) return false;
  
  try {
    // Create a full URL with current protocol for validation
    const fullUrl = `https://${url.trim()}`;
    const urlObj = new URL(fullUrl);
    
    // Check that it has a valid domain
    return urlObj.hostname.length > 0 && 
           urlObj.hostname.includes('.') &&
           urlObj.hostname.split('.').pop()!.length >= 2;
  } catch {
    return false;
  }
};

// Helper function to clean URL by removing protocol
const cleanUrl = (url: string, protocol: "https://" | "http://"): string => {
  return url.replace(protocol, '').trim();
};

export default function RecipeUrlForm({
  recipeUrl,
  setRecipeUrl,
  onSubmit,
}: RecipeUrlFormProps) {
  const [isValid, setIsValid] = useState(false);
  const [hasInput, setHasInput] = useState(false);
  const [protocol, setProtocol] = useState<"https://" | "http://">("https://");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRecipeUrl(value);
    setHasInput(value.length > 0);
    setIsValid(isValidUrl(value));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    if (pastedText.startsWith('https://')) {
      setProtocol('https://');
      const cleanedUrl = cleanUrl(pastedText, 'https://');
      setRecipeUrl(cleanedUrl);
      setHasInput(cleanedUrl.length > 0);
      setIsValid(isValidUrl(cleanedUrl));
    } else if (pastedText.startsWith('http://')) {
      setProtocol('http://');
      const cleanedUrl = cleanUrl(pastedText, 'http://');
      setRecipeUrl(cleanedUrl);
      setHasInput(cleanedUrl.length > 0);
      setIsValid(isValidUrl(cleanedUrl));
    } else {
      // No protocol, keep current protocol
      setRecipeUrl(pastedText);
      setHasInput(pastedText.length > 0);
      setIsValid(isValidUrl(pastedText));
    }
  };

  const getValidationIcon = () => {
    if (!hasInput) return null;
    return isValid ? (
      <CircleCheck className="text-green-500" size={16} />
    ) : (
      <TriangleAlert className="text-orange-500" size={16} />
    );
  };

  const getValidationTooltip = () => {
    if (!hasInput) return "This is content in a tooltip.";
    return isValid ? "Valid URL format" : "Invalid URL format";
  };
  return (
    <TooltipProvider>
      <form onSubmit={onSubmit} className="my-4">
        <InputGroup className="w-full">
          <InputGroupAddon>
            <InputGroupText>{protocol}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            className="!px-0 mx-0"
            value={recipeUrl}
            onChange={handleInputChange}
            onPaste={handlePaste}
            placeholder="example.com/recipe"
          />
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
        </InputGroup>
      </form>
    </TooltipProvider>
  )
}

