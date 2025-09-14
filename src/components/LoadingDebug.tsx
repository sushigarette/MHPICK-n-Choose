import React, { useEffect } from 'react';
import { useLoadingAnimations } from '@/hooks/useLoadingAnimations';
import LoadingAdvanced from './LoadingAdvanced';

const LoadingDebug: React.FC = () => {
  const { 
    currentAnimation, 
    currentLottieAnimation, 
    lottieAnimations,
    changeAnimation,
    isLoading 
  } = useLoadingAnimations();

  useEffect(() => {
    console.log('🔍 Debug Loading:', {
      currentAnimation,
      currentLottieAnimation,
      lottieAnimations,
      isLoading
    });
  }, [currentAnimation, currentLottieAnimation, lottieAnimations, isLoading]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-4">Debug des animations</h1>
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <p><strong>Animation actuelle:</strong> {currentAnimation}</p>
          <p><strong>Lottie actuelle:</strong> {currentLottieAnimation}</p>
          <p><strong>Total animations:</strong> {lottieAnimations.length}</p>
          <p><strong>Chargement:</strong> {isLoading ? 'Oui' : 'Non'}</p>
        </div>
        <button 
          onClick={changeAnimation}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Changer d'animation manuellement
        </button>
      </div>
      
      <LoadingAdvanced 
        changeInterval={3000}
        message="Debug des animations..."
      />
    </div>
  );
};

export default LoadingDebug;
