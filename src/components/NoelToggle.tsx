import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useNoelSettings } from "@/context/NoelSettingsContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function NoelToggle() {
  const { theme, setTheme } = useTheme();
  const { settings } = useNoelSettings();
  const [noelDisabledForSession, setNoelDisabledForSession] = useState(() => {
    return sessionStorage.getItem('noel_disabled_session') === 'true';
  });

  const isNoelActive = settings.noel_theme_enabled && !noelDisabledForSession;

  const toggleNoel = () => {
    if (isNoelActive) {
      // Désactiver le thème de Noël pour cette session
      sessionStorage.setItem('noel_disabled_session', 'true');
      setNoelDisabledForSession(true);
      setTheme('light');
    } else {
      // Réactiver le thème de Noël pour cette session
      sessionStorage.removeItem('noel_disabled_session');
      setNoelDisabledForSession(false);
      if (settings.noel_theme_enabled) {
        setTheme('noel');
      }
    }
  };

  // Ne pas afficher le bouton si le thème de Noël n'est pas activé globalement
  if (!settings.noel_theme_enabled) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleNoel}
            className={`h-9 w-9 ${isNoelActive ? 'text-red-500' : ''}`}
          >
            <Sparkles className={`h-[1.2rem] w-[1.2rem] transition-all ${isNoelActive ? 'scale-110' : ''}`} />
            <span className="sr-only">{isNoelActive ? 'Désactiver le thème de Noël (session)' : 'Activer le thème de Noël'}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isNoelActive ? 'Désactiver le thème de Noël (session)' : 'Activer le thème de Noël'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

