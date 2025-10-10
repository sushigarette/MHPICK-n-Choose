import React from 'react';
import { Button } from './ui/button';
import { useHalloween } from '@/context/HalloweenContext';

const HalloweenToggle: React.FC = () => {
  const { isHalloweenMode, toggleHalloweenMode, globalHalloweenMode, userHalloweenDisabled } = useHalloween();

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleHalloweenMode}
        className="h-9 w-9"
        disabled={!globalHalloweenMode} // Désactivé seulement si le thème global n'est pas activé
        title={
          !globalHalloweenMode 
            ? "Le thème Halloween n'est pas activé par l'administrateur"
            : userHalloweenDisabled 
              ? "Cliquez pour réactiver le thème Halloween"
              : "Cliquez pour désactiver le thème Halloween"
        }
      >
        <span className="text-lg">
          {!globalHalloweenMode ? '🌙' : userHalloweenDisabled ? '🌙' : '🎃'}
        </span>
        <span className="sr-only">
          {!globalHalloweenMode 
            ? 'Thème normal (non activé par l\'admin)' 
            : userHalloweenDisabled 
              ? 'Thème Halloween désactivé par vous'
              : 'Thème Halloween activé'
          }
        </span>
      </Button>
      
      {/* Indicateur de statut - masqué sur mobile */}
      <div className="hidden md:block text-xs text-muted-foreground">
        {/* Plus d'indicateur de statut */}
      </div>
    </div>
  );
};

export default HalloweenToggle;
