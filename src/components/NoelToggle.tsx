import { Sparkles } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function NoelToggle() {
  const { theme, setTheme } = useTheme();
  const isNoel = theme === 'noel';

  const toggleNoel = () => {
    if (isNoel) {
      setTheme('light');
    } else {
      setTheme('noel');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleNoel}
            className={`h-9 w-9 ${isNoel ? 'text-red-500' : ''}`}
          >
            <Sparkles className={`h-[1.2rem] w-[1.2rem] transition-all ${isNoel ? 'scale-110' : ''}`} />
            <span className="sr-only">Activer le thème de Noël</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isNoel ? 'Désactiver le thème de Noël' : 'Activer le thème de Noël'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

