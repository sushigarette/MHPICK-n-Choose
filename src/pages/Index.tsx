import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen grow flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl text-center"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-teal-500 text-transparent bg-clip-text">
            C'est parti pour une réservation !
          </h1>
          <p className="text-xl text-gray-600 mb-8">Bureaux, salles de réunion, places de parking</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/register")} className="text-lg py-6">
              Besoin d'un compte ?
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login")} className="text-lg py-6">
              Connecte toi
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
