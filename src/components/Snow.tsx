import { useEffect, useState } from 'react';
import { useNoelSettings } from '@/context/NoelSettingsContext';

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  size: number;
  opacity: number;
}

export function Snow() {
  const { settings } = useNoelSettings();
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    if (!settings.noel_theme_enabled || !settings.noel_snow) {
      setSnowflakes([]);
      return;
    }

    // Créer 50 flocons de neige
    const flakes: Snowflake[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 8 + Math.random() * 10, // Entre 8 et 18 secondes (plus lent)
      animationDelay: Math.random() * 5,
      size: 8 + Math.random() * 8, // Entre 8px et 16px (plus gros)
      opacity: 0.3 + Math.random() * 0.7, // Entre 0.3 et 1
    }));

    setSnowflakes(flakes);
  }, [settings.noel_theme_enabled, settings.noel_snow]);

  if (!settings.noel_theme_enabled || !settings.noel_snow) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute top-0 text-white"
          style={{
            left: `${flake.left}%`,
            fontSize: `${flake.size}px`,
            opacity: flake.opacity,
            animation: `snowfall ${flake.animationDuration}s linear ${flake.animationDelay}s infinite`,
          }}
        >
          ❄
        </div>
      ))}
      <style>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

