import React, { useState, useEffect } from 'react';

interface LoadingAnimationsProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  message?: string;
  showMessage?: boolean;
}

// Liste des animations disponibles (sera mise à jour automatiquement)
const ANIMATIONS = [
  'spinner-1',
  'spinner-2', 
  'spinner-3',
  'spinner-4',
  'spinner-5'
];

const LoadingAnimations: React.FC<LoadingAnimationsProps> = ({
  size = 'md',
  color = 'currentColor',
  message = 'Chargement...',
  showMessage = true
}) => {
  const [currentAnimation, setCurrentAnimation] = useState<string>('');
  const [animationKey, setAnimationKey] = useState(0);

  // Sélectionner une animation aléatoire au montage
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * ANIMATIONS.length);
    setCurrentAnimation(ANIMATIONS[randomIndex]);
  }, []);

  // Changer d'animation toutes les 3 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * ANIMATIONS.length);
      setCurrentAnimation(ANIMATIONS[randomIndex]);
      setAnimationKey(prev => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <div 
        key={animationKey}
        className={`${sizeClasses[size]} text-primary animate-pulse`}
        style={{ color }}
      >
        {currentAnimation && (
          <img
            src={`/src/animations/${currentAnimation}.svg`}
            alt="Loading animation"
            className="w-full h-full"
            style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}
          />
        )}
      </div>
      
      {showMessage && (
        <div className={`${textSizeClasses[size]} text-muted-foreground font-medium animate-pulse`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default LoadingAnimations;
