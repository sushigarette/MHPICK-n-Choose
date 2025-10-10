import React, { useState, useEffect } from 'react';
import { useHalloween } from '@/context/HalloweenContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { X } from 'lucide-react';

interface Pumpkin {
  id: number;
  x: number;
  y: number;
  points: number;
  size: number;
}

const HalloweenGame: React.FC = () => {
  const { isHalloweenMode, halloweenAnimations } = useHalloween();
  const [isGameActive, setIsGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [pumpkins, setPumpkins] = useState<Pumpkin[]>([]);
  const [gameTime, setGameTime] = useState(30);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    if (!isGameActive) return;

    const interval = setInterval(() => {
      if (pumpkins.length < 5) {
        const newPumpkin: Pumpkin = {
          id: Math.random(),
          x: Math.random() * 200 + 50, // Limiter à la zone de jeu
          y: Math.random() * 200 + 50,
          points: Math.floor(Math.random() * 10) + 1,
          size: Math.random() * 20 + 30
        };
        setPumpkins(prev => [...prev, newPumpkin]);
      }
    }, 1000);

    const timer = setInterval(() => {
      setGameTime(prev => {
        if (prev <= 1) {
          setIsGameOver(true);
          setIsGameActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [isGameActive, pumpkins.length]);

  const handlePumpkinClick = (pumpkin: Pumpkin) => {
    setScore(prev => prev + pumpkin.points);
    setPumpkins(prev => prev.filter(p => p.id !== pumpkin.id));
  };

  const startGame = () => {
    setIsGameActive(true);
    setScore(0);
    setGameTime(30);
    setIsGameOver(false);
    setPumpkins([]);
  };

  const stopGame = () => {
    setIsGameActive(false);
    setPumpkins([]);
  };

  if (!isHalloweenMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-4 left-4 z-50"
    >
      {!isGameActive && !isGameOver && (
        <Button
          onClick={startGame}
          className="bg-orange-500 hover:bg-orange-600 text-white halloween-glow"
        >
          🎃 JOUE AVEC MOI
        </Button>
      )}

      {isGameActive && (
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg min-w-[300px]">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm">
              <div>Score: <span className="font-bold text-orange-500">{score}</span></div>
              <div>Temps: <span className="font-bold text-orange-500">{gameTime}s</span></div>
            </div>
            <Button size="sm" variant="ghost" onClick={stopGame}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground mb-2">
            Cliquez sur les citrouilles pour marquer des points !
          </div>

          <div className="relative h-64 overflow-hidden rounded border">
            <AnimatePresence>
              {pumpkins.map(pumpkin => (
                <motion.div
                  key={pumpkin.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    rotate: [0, 360]
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  className={`absolute cursor-pointer halloween-pumpkin ${
                    halloweenAnimations ? 'halloween-glow' : ''
                  }`}
                  style={{
                    left: pumpkin.x,
                    top: pumpkin.y,
                    fontSize: pumpkin.size,
                    zIndex: 10
                  }}
                  onClick={() => handlePumpkinClick(pumpkin)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  🎃
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg min-w-[300px]">
          <div className="text-center">
            <div className="text-2xl mb-2">🎃</div>
            <div className="text-lg font-bold mb-2">Jeu terminé !</div>
            <div className="text-sm mb-4">Score final: <span className="text-orange-500 font-bold">{score}</span></div>
            <Button onClick={startGame} className="bg-orange-500 hover:bg-orange-600">
              Rejouer
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default HalloweenGame;
