import React, { useState, useEffect } from 'react';
import { useHalloween } from '@/context/HalloweenContext';
import { motion, AnimatePresence } from 'framer-motion';

interface SurpriseImage {
  src: string;
  alt: string;
  duration: number;
}

const HalloweenSurprise: React.FC = () => {
  const { isHalloweenMode, halloweenSurprise } = useHalloween();
  const [showSurprise, setShowSurprise] = useState(false);
  const [currentImage, setCurrentImage] = useState<SurpriseImage | null>(null);

  // Liste des images surprises disponibles
  const surpriseImages: SurpriseImage[] = [
    {
      src: '/peur1.webp',
      alt: 'Image surprise Halloween',
      duration: 3000 // 3 secondes
    },
    // Vous pouvez ajouter d'autres images ici
    // {
    //   src: '/autre-image.webp',
    //   alt: 'Autre surprise',
    //   duration: 2500
    // }
  ];

  useEffect(() => {
    if (!isHalloweenMode || !halloweenSurprise) {
      setShowSurprise(false);
      setCurrentImage(null);
      return;
    }

    // Fonction pour déclencher une surprise aléatoire
    const triggerSurprise = () => {
      if (Math.random() < 0.3) { // 30% de chance
        const randomImage = surpriseImages[Math.floor(Math.random() * surpriseImages.length)];
        setCurrentImage(randomImage);
        setShowSurprise(true);

        // Masquer l'image après sa durée
        setTimeout(() => {
          setShowSurprise(false);
        }, randomImage.duration);
      }
    };

    // Déclencher une surprise immédiatement (petite chance)
    if (Math.random() < 0.1) {
      triggerSurprise();
    }

    // Déclencher des surprises aléatoirement toutes les 10-30 secondes
    const surpriseInterval = setInterval(() => {
      triggerSurprise();
    }, Math.random() * 20000 + 10000); // Entre 10 et 30 secondes

    return () => {
      clearInterval(surpriseInterval);
    };
  }, [isHalloweenMode, halloweenSurprise]);

  if (!isHalloweenMode || !showSurprise || !currentImage) {
    return null;
  }

  return (
    <AnimatePresence>
      {showSurprise && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ 
            duration: 0.5,
            ease: "easeInOut"
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80"
          style={{
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)'
          }}
        >
          <motion.div
            initial={{ rotate: -5, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            exit={{ rotate: 5, scale: 0.8 }}
            transition={{ 
              duration: 0.3,
              ease: "easeOut"
            }}
            className="relative max-w-[90vw] max-h-[90vh]"
          >
            <motion.img
              src={currentImage.src}
              alt={currentImage.alt}
              className="w-full h-full object-contain rounded-lg shadow-2xl"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(255, 107, 53, 0.5))',
                border: '3px solid #ff6b35'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            />
            
            {/* Effet de lueur autour de l'image */}
            <motion.div
              className="absolute inset-0 rounded-lg"
              style={{
                background: 'radial-gradient(circle, rgba(255, 107, 53, 0.3) 0%, transparent 70%)',
                filter: 'blur(20px)',
                zIndex: -1
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.2 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HalloweenSurprise;












