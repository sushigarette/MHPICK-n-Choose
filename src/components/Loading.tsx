import Lottie from "lottie-react";
import catAnimation from "../cat.json";
import { useEffect, useState } from "react";

const Loading = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
      {/* Contenu principal */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="w-[200px] h-[200px]">
          <Lottie 
            animationData={catAnimation} 
            loop={true} 
          />
        </div>
        
        {/* Texte de chargement */}
        <div className="mt-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
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