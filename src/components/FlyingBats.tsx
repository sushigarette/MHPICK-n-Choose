import React, { useState, useEffect } from 'react';
import { useHalloween } from '@/context/HalloweenContext';
import { useLocation } from 'react-router-dom';
import Lottie from 'lottie-react';
import batAnimation from '../chauve_souris.json';
import { motion, AnimatePresence } from 'framer-motion';

interface Bat {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  direction: number;
  delay: number;
}

const FlyingBats: React.FC = () => {
  const { isHalloweenMode, halloweenFlyingBats } = useHalloween();
  const location = useLocation();
  const [bats, setBats] = useState<Bat[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  // Debug logs
  console.log('FlyingBats - isHalloweenMode:', isHalloweenMode);
  console.log('FlyingBats - location.pathname:', location.pathname);
  console.log('FlyingBats - bats.length:', bats.length);
  console.log('FlyingBats - Component rendering on:', location.pathname);

  useEffect(() => {
    console.log('FlyingBats - useEffect - isHalloweenMode:', isHalloweenMode, 'halloweenFlyingBats:', halloweenFlyingBats);
    if (!isHalloweenMode || !halloweenFlyingBats) {
      setBats([]);
      return;
    }

    // Créer des chauves-souris volantes
    const createBat = (): Bat => ({
      id: Math.random(),
      x: Math.random() * (window.innerWidth - 200) + 100, // Éviter les bords
      y: Math.random() * (window.innerHeight - 200) + 100, // Éviter les bords
      size: Math.random() * 0.4 + 0.6, // Taille entre 0.6 et 1.0
      speed: Math.random() * 1 + 0.5, // Vitesse plus lente
      direction: Math.random() * 2 - 1, // Direction aléatoire
      delay: Math.random() * 1000 // Délai plus court
    });

    // Créer 3 chauves-souris de test
    const newBats = Array.from({ length: 3 }, createBat);
    console.log('FlyingBats - Creating bats:', newBats.length);
    setBats(newBats);

    // Ajouter des chauves-souris toutes les 8 secondes, maximum 6
    const addBatsInterval = setInterval(() => {
      if (isHalloweenMode) {
        setBats(prevBats => {
          if (prevBats.length < 6) {
            const additionalBats = Array.from({ length: Math.min(2, 6 - prevBats.length) }, createBat);
            console.log('FlyingBats - Adding more bats:', additionalBats.length, 'Total:', prevBats.length + additionalBats.length);
            return [...prevBats, ...additionalBats];
          }
          return prevBats;
        });
      }
    }, 8000);

    // Animation des chauves-souris
    const animateBats = () => {
      setBats(prevBats => 
        prevBats.map(bat => {
          const time = Date.now() * 0.001;
          const wave1 = Math.sin(time * 0.5 + bat.id) * 2; // Mouvement ondulant plus prononcé
          const wave2 = Math.cos(time * 0.3 + bat.id * 0.7) * 1.5; // Mouvement secondaire
          const erratic = Math.sin(time * 2 + bat.id * 2) * 0.5; // Mouvement erratique
          
          return {
            ...bat,
            x: bat.x + bat.direction * bat.speed + erratic,
            y: bat.y + wave1 + wave2, // Mouvement plus complexe
            direction: bat.direction + (Math.random() - 0.5) * 0.1, // Direction qui change légèrement
          };
        }).filter(bat => 
          bat.x > -200 && bat.x < window.innerWidth + 200 && 
          bat.y > -200 && bat.y < window.innerHeight + 200
        )
      );
    };

    const interval = setInterval(animateBats, 100); // Animation plus lente

    return () => {
      clearInterval(interval);
      clearInterval(addBatsInterval);
    };
  }, [isHalloweenMode, halloweenFlyingBats]); // Seulement sur le changement de mode Halloween

  // Test simple - toujours afficher quelque chose en mode Halloween
  if (!isHalloweenMode || !halloweenFlyingBats) {
    console.log('FlyingBats - Not rendering: isHalloweenMode:', isHalloweenMode, 'halloweenFlyingBats:', halloweenFlyingBats);
    return null;
  }

  // Si pas de chauves-souris, créer une de test
  if (bats.length === 0) {
    console.log('FlyingBats - No bats, creating test bat');
    return (
      <div 
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 9999 }}
      >
        <div 
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '100px',
            zIndex: 10000,
            backgroundColor: 'rgba(255, 0, 0, 0.3)',
            borderRadius: '50%',
            padding: '20px',
            border: '3px solid red'
          }}
        >
          🦇 TEST
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 9999 }}
    >
      <AnimatePresence>
        {bats.map(bat => (
          <motion.div
            key={bat.id}
            initial={{ 
              opacity: 0, 
              scale: 0.5,
              x: bat.x,
              y: bat.y
            }}
            animate={{ 
              opacity: 1, 
              scale: bat.size,
              x: bat.x,
              y: bat.y,
              rotate: [0, 10, -10, 0]
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.5,
              x: bat.x + bat.direction * 100,
              y: bat.y - 50
            }}
            transition={{ 
              duration: 3,
              delay: bat.delay / 1000,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="absolute"
            style={{
              left: bat.x,
              top: bat.y,
              transform: `scale(${bat.size})`,
              zIndex: 10000,
            }}
          >
            <div 
              style={{ 
                width: 80, 
                height: 80,
                fontSize: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                borderRadius: '50%',
                filter: 'drop-shadow(0 0 10px rgba(255, 107, 53, 0.8))',
                border: '2px solid rgba(255, 107, 53, 0.3)'
              }}
            >
              🦇
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FlyingBats;
