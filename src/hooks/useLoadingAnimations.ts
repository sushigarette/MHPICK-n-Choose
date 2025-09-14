import { useState, useEffect } from 'react';

// Hook pour gérer les animations de chargement
export const useLoadingAnimations = () => {
  const [animations, setAnimations] = useState<string[]>([]);
  const [lottieAnimations, setLottieAnimations] = useState<string[]>([]);
  const [currentAnimation, setCurrentAnimation] = useState<string>('');
  const [currentLottieAnimation, setCurrentLottieAnimation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Charger la liste des animations disponibles
  useEffect(() => {
    const loadAnimations = async () => {
      try {
        // Seulement les animations Lottie JSON
        const lottieAnimations = [
          '8-bit Cat',
          'Bouncing Fruits',
          'Cute Doggie',
          'Meditation',
          'Pixel Duck',
          'Ufo lottie animation'
        ];
        
        setLottieAnimations(lottieAnimations);
        
        // Sélectionner une animation Lottie aléatoire UNE SEULE FOIS
        if (lottieAnimations.length > 0) {
          const randomIndex = Math.floor(Math.random() * lottieAnimations.length);
          const selectedAnimation = lottieAnimations[randomIndex];
          setCurrentAnimation(selectedAnimation);
          setCurrentLottieAnimation(selectedAnimation);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des animations:', error);
        setIsLoading(false);
      }
    };

    loadAnimations();
  }, []);

  // Plus besoin de changeAnimation, la sélection se fait dans useEffect

  // Ajouter une nouvelle animation (pour usage futur)
  const addAnimation = (animationName: string, isLottie: boolean = false) => {
    if (isLottie) {
      if (!lottieAnimations.includes(animationName)) {
        setLottieAnimations(prev => [...prev, animationName]);
      }
    } else {
      if (!animations.includes(animationName)) {
        setAnimations(prev => [...prev, animationName]);
      }
    }
  };

  // Vérifier si l'animation actuelle est une animation Lottie
  const isCurrentAnimationLottie = () => {
    return true; // Maintenant toutes les animations sont Lottie
  };

  return {
    animations: lottieAnimations, // Retourner les animations Lottie comme animations principales
    lottieAnimations,
    currentAnimation,
    currentLottieAnimation,
    isLoading,
    addAnimation,
    isCurrentAnimationLottie
  };
};
