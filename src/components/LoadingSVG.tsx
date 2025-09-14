import React, { useEffect } from "react";
import { useLoadingAnimations } from "@/hooks/useLoadingAnimations";

interface LoadingSVGProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  message?: string;
  showMessage?: boolean;
  autoChange?: boolean;
  changeInterval?: number;
}

const LoadingSVG: React.FC<LoadingSVGProps> = ({
  size = 'lg',
  color = 'currentColor',
  message = 'Chargement...',
  showMessage = true,
  autoChange = true,
  changeInterval = 3000
}) => {
  const { currentAnimation, changeAnimation, isLoading } = useLoadingAnimations();

  // Changer d'animation automatiquement
  useEffect(() => {
    if (!autoChange || isLoading) return;

    const interval = setInterval(() => {
      changeAnimation();
    }, changeInterval);

    return () => clearInterval(interval);
  }, [autoChange, changeInterval, changeAnimation, isLoading]);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10', 
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6 p-8">
      <div 
        className={`${sizeClasses[size]} text-primary`}
        style={{ color }}
      >
        {currentAnimation && (
          <img
            src={`/src/animations/${currentAnimation}.svg`}
            alt="Loading animation"
            className="w-full h-full drop-shadow-lg"
            style={{ 
              filter: 'drop-shadow(0 0 8px currentColor)',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          />
        )}
      </div>
      
      {showMessage && (
        <div className={`${textSizeClasses[size]} text-muted-foreground font-medium`}>
          <span className="animate-pulse">{message}</span>
        </div>
      )}
    </div>
  );
};

export default LoadingSVG;
