import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { useLoadingAnimations } from '@/hooks/useLoadingAnimations';

interface LoadingLottieProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  showMessage?: boolean;
  autoChange?: boolean;
  changeInterval?: number;
}

const LoadingLottie: React.FC<LoadingLottieProps> = ({
  size = 'lg',
  message = 'Chargement...',
  showMessage = true,
  autoChange = true,
  changeInterval = 3000
}) => {
  const { 
    currentLottieAnimation, 
    changeAnimation, 
    isLoading, 
    isCurrentAnimationLottie 
  } = useLoadingAnimations();
  
  const [animationData, setAnimationData] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Charger l'animation Lottie correspondante
  useEffect(() => {
    const loadLottieAnimation = async () => {
      if (!currentLottieAnimation) return;

      try {
        // Charger dynamiquement l'animation Lottie
        const animationModule = await import(`../animations/${currentLottieAnimation}.json`);
        setAnimationData(animationModule.default);
      } catch (error) {
        console.error(`Erreur lors du chargement de l'animation ${currentLottieAnimation}:`, error);
        // Fallback vers l'animation par défaut
        const catAnimation = await import('../cat.json');
        setAnimationData(catAnimation.default);
      }
    };

    if (isCurrentAnimationLottie()) {
      loadLottieAnimation();
    }
  }, [currentLottieAnimation, isCurrentAnimationLottie]);

  // Changer d'animation automatiquement
  useEffect(() => {
    if (!autoChange || isLoading) return;

    const interval = setInterval(() => {
      changeAnimation();
    }, changeInterval);

    return () => clearInterval(interval);
  }, [autoChange, changeInterval, changeAnimation, isLoading]);

  // Timer pour masquer le loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible || isLoading) return null;

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
        {animationData && (
          <Lottie 
            animationData={animationData} 
            loop={true}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
      
      {showMessage && (
        <div className={`${textSizeClasses[size]} text-muted-foreground font-medium mt-4`}>
          <span className="animate-pulse">{message}</span>
        </div>
      )}
    </div>
  );
};

export default LoadingLottie;
