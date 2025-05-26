import React from "react";
import ResetPasswordForm from "../components/ResetPasswordForm";
import Header from "../components/Header";

const ResetPassword = () => {
  return (
    <div className="min-h-screen grow flex flex-col bg-background">
      <Header />
      <div className="flex grow items-center">
        <div className="w-full h-fit max-w-md mx-auto p-6 bg-card rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6">Réinitialisation du mot de passe</h2>
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 