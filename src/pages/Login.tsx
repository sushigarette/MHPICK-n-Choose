
import React from 'react';
import AuthForm from '../components/auth/AuthForm';
import Header from '../components/layout/Header';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <h1 className="text-center text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-teal-500 text-transparent bg-clip-text">
            FlexReserve
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Connectez-vous pour accéder à votre espace de réservation
          </p>
          <p className="text-center text-blue-500 mb-4 text-sm">
            Après la connexion, vous serez dirigé vers le plan interactif pour réserver votre espace
          </p>
          <AuthForm type="login" />
        </div>
      </div>
    </div>
  );
};

export default Login;
