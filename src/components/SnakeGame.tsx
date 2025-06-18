import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from './ui/dialog';

interface SnakeGameProps {
  isOpen: boolean;
  onClose: () => void;
}

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const GAME_SPEED = 100;

const SnakeGame: React.FC<SnakeGameProps> = ({ isOpen, onClose }) => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood());
    setScore(0);
    setGameOver(false);
  };

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        if (direction.y === 0) setDirection({ x: 0, y: -1 });
        break;
      case 'ArrowDown':
        if (direction.y === 0) setDirection({ x: 0, y: 1 });
        break;
      case 'ArrowLeft':
        if (direction.x === 0) setDirection({ x: -1, y: 0 });
        break;
      case 'ArrowRight':
        if (direction.x === 0) setDirection({ x: 1, y: 0 });
        break;
    }
  }, [direction]);

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, handleKeyPress]);

  useEffect(() => {
    if (!isOpen || gameOver) return;

    const gameLoop = setInterval(() => {
      setSnake(prevSnake => {
        const newHead = {
          x: prevSnake[0].x + direction.x,
          y: prevSnake[0].y + direction.y,
        };

        // Vérifier les collisions avec les murs
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        // Vérifier les collisions avec le serpent
        if (
          prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
        ) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Vérifier si le serpent mange la nourriture
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(prev => prev + 1);
          setFood(generateFood());
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, GAME_SPEED);

    return () => clearInterval(gameLoop);
  }, [isOpen, direction, food, gameOver, generateFood]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold">Snake Game</h2>
          <div className="relative bg-black rounded-lg overflow-hidden">
            <div
              style={{
                width: GRID_SIZE * CELL_SIZE,
                height: GRID_SIZE * CELL_SIZE,
                position: 'relative',
              }}
            >
              {/* Nourriture */}
              <div
                style={{
                  position: 'absolute',
                  left: food.x * CELL_SIZE,
                  top: food.y * CELL_SIZE,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  backgroundColor: 'red',
                  borderRadius: '50%',
                }}
              />
              {/* Serpent */}
              {snake.map((segment, index) => (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: segment.x * CELL_SIZE,
                    top: segment.y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: index === 0 ? '#22c55e' : '#16a34a',
                    borderRadius: '2px',
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-xl">Score: {score}</p>
            {gameOver && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-red-500 text-xl">Game Over!</p>
                <button
                  onClick={resetGame}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Rejouer
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SnakeGame; 