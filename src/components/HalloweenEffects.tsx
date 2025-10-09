import React, { useEffect, useState } from 'react';
import { useHalloween } from '@/context/HalloweenContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  type: 'bat';
  size: number;
  speed: number;
  direction: number;
}

const HalloweenEffects: React.FC = () => {
  const { isHalloweenMode, halloweenParticles } = useHalloween();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isHalloweenMode || !halloweenParticles) {
      setParticles([]);
      return;
    }

    const createParticle = (): Particle => {
      return {
        id: Math.random(),
        x: Math.random() * (window.innerWidth - 100),
        y: window.innerHeight + 50,
        type: 'bat', // Seulement des chauves-souris
        size: Math.random() * 30 + 20,
        speed: Math.random() * 3 + 2,
        direction: Math.random() * 1 - 0.5
      };
    };

    const interval = setInterval(() => {
      setParticles(prev => {
        if (prev.length < 6) {
          return [...prev, createParticle()];
        }
        return prev;
      });
    }, 1500);

    const animationFrame = () => {
      setParticles(prev => 
        prev
          .map(particle => ({
            ...particle,
            x: particle.x + particle.direction,
            y: particle.y - particle.speed
          }))
          .filter(particle => particle.y > -50)
      );
      requestAnimationFrame(animationFrame);
    };

    requestAnimationFrame(animationFrame);

    return () => {
      clearInterval(interval);
    };
  }, [isHalloweenMode, halloweenParticles]);

  if (!isHalloweenMode || !halloweenParticles) return null;

  const getParticleEmoji = (type: string) => {
    switch (type) {
      case 'bat': return '🦇';
      default: return '🦇';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      <AnimatePresence>
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1, 0.8],
              rotate: [0, 180, 360]
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ 
              duration: 6,
              ease: "easeInOut"
            }}
            className="absolute text-2xl"
            style={{
              left: particle.x,
              top: particle.y,
              fontSize: particle.size
            }}
          >
            {getParticleEmoji(particle.type)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default HalloweenEffects;
