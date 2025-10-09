import React, { useState, useEffect } from 'react';
import { useHalloween } from '@/context/HalloweenContext';
import { motion, AnimatePresence } from 'framer-motion';

interface RainDrop {
  id: number;
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
}

interface Lightning {
  id: number;
  x: number;
  y: number;
  duration: number;
  intensity: number;
}

const HalloweenWeather: React.FC = () => {
  const { isHalloweenMode, playStormAudio, stopStormAudio, halloweenStormVisual, halloweenRain } = useHalloween();
  const [rainDrops, setRainDrops] = useState<RainDrop[]>([]);
  const [lightning, setLightning] = useState<Lightning[]>([]);
  const [isStormy, setIsStormy] = useState(false);

  useEffect(() => {
    if (!isHalloweenMode) {
      setRainDrops([]);
      setLightning([]);
      setIsStormy(false);
      return;
    }

    // Démarrer avec de la pluie légère seulement si activée
    const createRainDrop = (): RainDrop => ({
      id: Math.random(),
      x: Math.random() * window.innerWidth,
      y: -50,
      speed: Math.random() * 3 + 2,
      length: Math.random() * 20 + 10,
      opacity: Math.random() * 0.6 + 0.2
    });

    let rainInterval: NodeJS.Timeout | null = null;
    
    if (halloweenRain) {
      const initialRain = Array.from({ length: 30 }, createRainDrop);
      setRainDrops(initialRain);

      // Animation de la pluie
      rainInterval = setInterval(() => {
        setRainDrops(prevDrops => 
          prevDrops.map(drop => ({
            ...drop,
            y: drop.y + drop.speed,
            x: drop.x + (Math.sin(drop.y * 0.01) * 0.5) // Légère oscillation
          })).filter(drop => drop.y < window.innerHeight + 50)
          .concat(Array.from({ length: 2 }, createRainDrop))
        );
      }, 50);
    }

    // Gestion des orages seulement si les effets visuels sont activés
    const stormInterval = halloweenStormVisual ? setInterval(() => {
      if (Math.random() < 0.15) { // 15% de chance d'orage (moins fréquent car plus long)
        setIsStormy(true);
        
        // Démarrer l'audio d'orage
        playStormAudio();
        
        // Créer un éclair
        const newLightning: Lightning = {
          id: Math.random(),
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight * 0.3,
          duration: Math.random() * 200 + 100,
          intensity: Math.random() * 0.5 + 0.5
        };
        
        setLightning(prev => [...prev, newLightning]);
        
        // Supprimer l'éclair après sa durée
        setTimeout(() => {
          setLightning(prev => prev.filter(l => l.id !== newLightning.id));
        }, newLightning.duration);
        
        // Arrêter l'orage après environ 15 secondes (comme le son)
        setTimeout(() => {
          setIsStormy(false);
          stopStormAudio(); // Arrêter l'audio d'orage
        }, Math.random() * 3000 + 12000); // Entre 12 et 15 secondes
      }
    }, 8000) : null; // Pas d'intervalle si les effets visuels sont désactivés

    return () => {
      if (rainInterval) clearInterval(rainInterval);
      if (stormInterval) clearInterval(stormInterval);
    };
  }, [isHalloweenMode]);

  if (!isHalloweenMode) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1000 }}>
      {/* Overlay d'orage */}
      <AnimatePresence>
        {isStormy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-purple-900"
            style={{
              background: 'linear-gradient(45deg, #1a0b2e, #2d1b69, #1a0b2e)',
              animation: 'pulse 0.1s infinite alternate'
            }}
          />
        )}
      </AnimatePresence>

      {/* Éclairs */}
      <AnimatePresence>
        {lightning.map(flash => (
          <motion.div
            key={flash.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: flash.intensity,
              scale: [0, 1, 0.8, 1],
              x: flash.x,
              y: flash.y
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.1, repeat: 3, repeatType: "reverse" }}
            className="absolute"
            style={{
              width: '2px',
              height: '200px',
              background: 'linear-gradient(to bottom, transparent, white, transparent)',
              boxShadow: '0 0 20px white, 0 0 40px white, 0 0 60px white',
              transform: `rotate(${Math.random() * 20 - 10}deg)`,
              zIndex: 1001
            }}
          />
        ))}
      </AnimatePresence>

      {/* Pluie */}
      {rainDrops.map(drop => (
        <motion.div
          key={drop.id}
          className="absolute"
          style={{
            left: drop.x,
            top: drop.y,
            width: '1px',
            height: drop.length,
            background: isStormy 
              ? 'linear-gradient(to bottom, transparent, #60a5fa, #3b82f6)'
              : 'linear-gradient(to bottom, transparent, #94a3b8, #64748b)',
            opacity: isStormy ? drop.opacity * 1.5 : drop.opacity,
            boxShadow: isStormy ? '0 0 5px #60a5fa' : 'none',
            zIndex: 1000
          }}
          animate={{
            y: drop.y,
            x: drop.x
          }}
          transition={{ duration: 0.05 }}
        />
      ))}

      {/* Effet de brume */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.1) 100%)',
          zIndex: 999
        }}
        animate={{
          opacity: isStormy ? 0.3 : 0.1
        }}
        transition={{ duration: 2 }}
      />
    </div>
  );
};

export default HalloweenWeather;












