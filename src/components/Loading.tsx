import Lottie from "lottie-react";
import catAnimation from "../cat.json";
import chauveSourisAnimation from "../chauve_souris.json";
import { useEffect, useState } from "react";
import { useHalloween } from "@/context/HalloweenContext";

const Loading = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { isHalloweenMode } = useHalloween();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center ${
      isHalloweenMode 
        ? 'halloween-loading-screen' 
        : 'bg-gray-100'
    }`}>
      {/* Fond Halloween avec image de fond */}
      {isHalloweenMode && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/fond_chargement_hallowen.png)',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.7,
            width: '100%',
            height: '100%',
            minHeight: '100vh',
            minWidth: '100vw'
          }}
        />
      )}
      
      {/* Effet de brouillard Halloween */}
      {isHalloweenMode && (
        <div className="halloween-loading-fog" />
      )}
      
      {/* Contenu principal */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className={`w-[200px] h-[200px] ${
          isHalloweenMode ? 'halloween-loading-bounce' : ''
        }`}>
          <Lottie 
            animationData={isHalloweenMode ? chauveSourisAnimation : catAnimation} 
            loop={true} 
          />
        </div>
        
        {/* Texte de chargement Halloween */}
        {isHalloweenMode && (
          <div className="mt-8 text-center">
            <h2 className="text-4xl font-bold halloween-neon-text mb-4">
              MHPICK
            </h2>
            <p className="text-orange-400 text-xl halloween-loading-pulse">
              👻 Chargement en cours... 🦇
            </p>
            <div className="mt-4 flex justify-center space-x-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full halloween-loading-pulse" style={{animationDelay: '0s'}}></div>
              <div className="w-2 h-2 bg-orange-400 rounded-full halloween-loading-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-orange-400 rounded-full halloween-loading-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        )}
        
        {/* Texte de chargement normal */}
        {!isHalloweenMode && (
          <div className="mt-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              MHPICK
            </h2>
            <p className="text-gray-600 text-lg">
              Chargement en cours...
            </p>
          </div>
        )}
      </div>
      
      {/* Effets de particules Halloween */}
      {isHalloweenMode && (
        <>
          <div className="halloween-loading-particle" style={{top: '10%', left: '10%'}}>🎃</div>
          <div className="halloween-loading-particle" style={{top: '20%', right: '15%'}}>👻</div>
          <div className="halloween-loading-particle" style={{bottom: '20%', left: '15%'}}>🦇</div>
          <div className="halloween-loading-particle" style={{bottom: '10%', right: '10%'}}>💀</div>
          <div className="halloween-loading-particle" style={{top: '50%', left: '5%'}}>🕷️</div>
          <div className="halloween-loading-particle" style={{top: '60%', right: '5%'}}>🕸️</div>
        </>
      )}
    </div>
  );
};

export default Loading; 