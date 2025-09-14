import React from 'react';
import LoadingAdvanced from './LoadingAdvanced';

const LoadingTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Test des animations de chargement</h1>
        <p className="mb-4">Les animations devraient changer toutes les 2 secondes</p>
        <LoadingAdvanced 
          changeInterval={2000}
          message="Test des animations..."
        />
      </div>
    </div>
  );
};

export default LoadingTest;
