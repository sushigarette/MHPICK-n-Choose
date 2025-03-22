import React from "react";
import AuthForm from "../components/AuthForm";
import Header from "../components/Header";

const Register: React.FC = () => {
  return (
    <div className="min-h-screen grow flex flex-col bg-gray-50">
      <Header />
      <div className="flex grow items-center">
        <AuthForm type="register" />
      </div>
    </div>
  );
};

export default Register;
