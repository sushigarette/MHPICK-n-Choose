import Lottie from "lottie-react";
import catAnimation from "../cat.json";
import { useEffect, useState } from "react";

const Loading = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [noelBackground, setNoelBackground] = useState(false);
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Vérifier les paramètres de Noël depuis localStorage ou directement depuis la base
    const checkNoelSettings = async () => {
      try {
        // Vérifier si le thème de Noël est activé via les classes CSS
        const root = document.documentElement;
        const hasNoelTheme = root.classList.contains('noel') || root.getAttribute('data-noel-theme') === 'true';
        const hasNoelBackground = root.getAttribute('data-noel-background') === 'true';
        
        if (hasNoelTheme && hasNoelBackground) {
          setNoelBackground(true);
        }
      } catch (error) {
        // Ignorer les erreurs
      }
    };

    checkNoelSettings();
    // Vérifier périodiquement au cas où les paramètres changent
    const interval = setInterval(checkNoelSettings, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Charger aléatoirement une animation de Noël
    const loadRandomNoelAnimation = async () => {
      try {
        // Le thème de Noël est activé par défaut, donc toujours charger une animation de Noël
        // Choisir un numéro aléatoire entre 1 et 6
        const randomNumber = Math.floor(Math.random() * 6) + 1;
        const response = await fetch(`/chargement noel/${randomNumber}.json`);
        
        if (response.ok) {
          const data = await response.json();
          setAnimationData(data);
        } else {
          // Si l'animation de Noël ne charge pas, utiliser l'animation par défaut
          setAnimationData(catAnimation);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'animation de Noël:', error);
        // En cas d'erreur, utiliser l'animation par défaut
        setAnimationData(catAnimation);
      }
    };

    loadRandomNoelAnimation();
  }, []);

  if (!isVisible) return null;

  const backgroundStyle = noelBackground
    ? {
        backgroundImage: "url('/fondnoel.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }
    : { backgroundColor: "#f3f4f6" };

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={backgroundStyle}>
      {/* Contenu principal */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="w-[200px] h-[200px]">
          {animationData ? (
            <Lottie 
              animationData={animationData} 
              loop={true} 
            />
          ) : (
            <Lottie 
              animationData={catAnimation} 
              loop={true} 
            />
          )}
        </div>
        
        {/* Texte de chargement */}
        <div className="mt-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: "'FontNoel', sans-serif" }}>
            MHPICK
          </h2>
          <p className="text-gray-600 text-lg">
            Chargement en cours...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Loading; 