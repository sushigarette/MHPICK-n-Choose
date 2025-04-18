import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Lottie from "lottie-react";

const NotFound = () => {
  const location = useLocation();
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    // Charger l'animation de manière asynchrone
    fetch("/morty.json")
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => console.error("Erreur lors du chargement de l'animation:", error));
  }, [location.pathname]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="w-[400px] h-[400px]">
            {animationData && <Lottie animationData={animationData} loop={true} />}
          </div>
          <motion.p 
            className="text-2xl text-gray-600 mb-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Oups ! Page non trouvée
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Button 
              onClick={() => window.location.href = "/"}
              className="text-lg py-6 px-8"
            >
              Retour à l'accueil
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
