import React, { useState, useEffect } from "react";
import Lottie from "lottie-react";
import catAnimation from "../cat.json";
import { useLoadingAnimations } from "@/hooks/useLoadingAnimations";

interface LoadingAdvancedProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  showMessage?: boolean;
}

const LoadingAdvanced: React.FC<LoadingAdvancedProps> = ({
  size = 'lg',
  message = 'Chargement...',
  showMessage = true
}) => {
  const { 
    currentLottieAnimation,
    isLoading
  } = useLoadingAnimations();
  
  const [isVisible, setIsVisible] = useState(true);
  const [animationData, setAnimationData] = useState<any>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [isAnimationLoaded, setIsAnimationLoaded] = useState(false);

  // Charger l'animation Lottie correspondante
  useEffect(() => {
    const loadLottieAnimation = async () => {
      if (!currentLottieAnimation) return;

      try {
        // Charger dynamiquement l'animation Lottie
        const animationModule = await import(`../animations/${currentLottieAnimation}.json`);
        setAnimationData(animationModule.default);
        setAnimationKey(prev => prev + 1); // Forcer le re-render
        setIsAnimationLoaded(true);
      } catch (error) {
        console.error(`Erreur lors du chargement de l'animation ${currentLottieAnimation}:`, error);
        // Fallback vers l'animation par défaut
        setAnimationData(catAnimation);
        setAnimationKey(prev => prev + 1);
        setIsAnimationLoaded(true);
      }
    };

    loadLottieAnimation();
  }, [currentLottieAnimation]);

  // Plus besoin de changer d'animation ici, c'est fait dans le hook

  // Timer pour masquer le loading (comme l'original)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible || isLoading || !isAnimationLoaded) return null;

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10', 
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const lottieSizeClasses = {
    sm: 'w-[50px] h-[50px]',
    md: 'w-[100px] h-[100px]', 
    lg: 'w-[200px] h-[200px]',
    xl: 'w-[300px] h-[300px]'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-100 z-50">
      <div className={`${lottieSizeClasses[size]} text-primary`}>
        <Lottie 
          key={animationKey}
          animationData={animationData} 
          loop={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      
      {showMessage && (
        <div className={`${textSizeClasses[size]} text-muted-foreground font-medium mt-4`}>
          <span className="animate-pulse">{message}</span>
        </div>
      )}
    </div>
  );
};

export default LoadingAdvanced;
