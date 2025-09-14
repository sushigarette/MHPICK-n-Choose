import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X, Download, Smartphone, Home } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallPrompt: React.FC = () => {
  const { isInstalled, isMobile, canInstall, installApp } = usePWA();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Afficher le prompt après un délai pour les mobiles
  useEffect(() => {
    if (isMobile && !isInstalled && canInstall) {
      // Vérifier si l'utilisateur a déjà fermé le prompt
      if (!sessionStorage.getItem('installPromptDismissed')) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000); // Afficher après 3 secondes
      }
    }
  }, [isMobile, isInstalled, canInstall]);

  // Gérer l'installation
  const handleInstallClick = async () => {
    const success = await installApp();
    if (success) {
      setShowInstallPrompt(false);
    }
  };

  // Fermer le prompt
  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Ne plus afficher pendant cette session
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  // Ne pas afficher si déjà installée ou si l'utilisateur a fermé
  if (isInstalled || !isMobile || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-xl border border-blue-200 p-4 animate-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Home className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              📱 Installer MHPICK
            </h3>
            <p className="text-xs text-gray-700 mb-3 leading-relaxed">
              Ajoutez l'app à votre écran d'accueil pour un accès instantané aux réservations
            </p>
            
            <div className="flex gap-2">
              <Button
                onClick={handleInstallClick}
                size="sm"
                className="flex-1 text-xs h-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-md"
              >
                <Download className="w-3 h-3 mr-1" />
                Installer
              </Button>
              
              <Button
                onClick={handleDismiss}
                variant="outline"
                size="sm"
                className="text-xs h-8 px-3 border-gray-300 hover:bg-gray-50"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 text-center">
              ✨ Gratuit • Rapide • Hors ligne
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
