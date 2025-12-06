import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { useNoelSettings } from '@/context/NoelSettingsContext';

export function NoelAnimation() {
  const { settings } = useNoelSettings();
  const [animationData, setAnimationData] = useState<any>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  useEffect(() => {
    if (!settings.noel_theme_enabled) {
      return;
    }

    // Charger l'animation
    fetch('/noelbouge.json')
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => console.error('Erreur lors du chargement de l\'animation:', error));
  }, [settings.noel_theme_enabled]);

  useEffect(() => {
    if (!animationData || !settings.noel_theme_enabled) return;

    let animationFrameId: number | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let isAnimating = true;

    const startAnimation = () => {
      // Position initiale aléatoire (avec taille augmentée)
      const animationSize = 400;
      const newTop = Math.random() * (window.innerHeight - animationSize);
      const newDirection = Math.random() > 0.5 ? 'right' : 'left';
      const startLeft = newDirection === 'right' ? -animationSize : window.innerWidth + animationSize;
      const endLeft = newDirection === 'right' ? window.innerWidth + animationSize : -animationSize;

      setDirection(newDirection);
      setPosition({ top: newTop, left: startLeft });

      // Animation de déplacement (ralentie)
      const duration = 15000 + Math.random() * 10000; // Entre 15 et 25 secondes (plus lent)
      const startTime = Date.now();

      const animate = () => {
        if (!isAnimating) return;

        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentLeft = startLeft + (endLeft - startLeft) * progress;
        setPosition(prev => ({ ...prev, left: currentLeft }));

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          // Une fois l'animation terminée complètement, attendre puis relancer
          timeoutId = setTimeout(() => {
            if (isAnimating) {
              startAnimation(); // Relancer avec une nouvelle position
            }
          }, 2000 + Math.random() * 3000); // Attendre 2-5 secondes avant de relancer
        }
      };

      animationFrameId = requestAnimationFrame(animate);
    };

    // Démarrer la première animation
    startAnimation();

    return () => {
      isAnimating = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [animationData, settings.noel_theme_enabled]);

  if (!settings.noel_theme_enabled || !animationData) {
    return null;
  }

  return (
    <div
      className="fixed pointer-events-none z-40"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: direction === 'left' ? 'scaleX(-1)' : 'none',
        width: '400px',
        height: '400px',
      }}
    >
      <Lottie 
        animationData={animationData} 
        loop={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

