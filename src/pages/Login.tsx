import React from "react";
import AuthForm from "../components/auth/AuthForm";
import Header from "../components/layout/Header";

const Login: React.FC = () => {
  return (
    <div className="min-h-screen grow flex flex-col bg-gray-50">
      <Header />
      <div className="flex grow items-center">
        <AuthForm type="login" />
      </div>
    </div>
  );
};

export default Login;
