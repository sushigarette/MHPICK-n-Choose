import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Vérifier l'état d'authentification au chargement et sur les changements
  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem("isAuthenticated") === "true";
      setIsAuthenticated(auth);

      if (auth) {
        const email = localStorage.getItem("userEmail") || "";
        setUserEmail(email);
      }
    };

    checkAuth();

    // Écouter les changements d'authentification
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");

    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès.",
    });

    navigate("/");
  };

  const handleLogin = () => {
    // Si l'utilisateur est déjà authentifié, rediriger vers le dashboard
    // Sinon, rediriger vers la page de connexion
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="w-full py-4 px-6 bg-white border-b border-gray-200">
      <div className=" mx-auto flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img className="h-8 " src="/lio.png"></img>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 text-transparent bg-clip-text">
            MHPick
          </span>
        </motion.div>

        {isAuthenticated ? (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/lio2.png" alt="User" />
                    <AvatarFallback>{userEmail.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Utilisateur</p>
                    <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>Tableau de bord</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/reservations")}>Mes réservations</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Déconnexion</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-4"
          >
            <Button variant="ghost" onClick={handleLogin}>
              Connexion
            </Button>
            <Button onClick={() => navigate("/register")}>S'inscrire</Button>
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default Header;
