
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import { Button } from "@/components/ui/button";

const Index: React.FC = () => {
  const navigate = useNavigate();
  
  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    if (localStorage.getItem('isAuthenticated') === 'true') {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl text-center"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-teal-500 text-transparent bg-clip-text">
            Simplifiez la gestion de vos espaces de travail
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            FlexReserve vous permet de réserver facilement des bureaux et des salles de réunion en quelques clics
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/register')} className="text-lg py-6">
              Commencer gratuitement
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="text-lg py-6">
              Se connecter
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
