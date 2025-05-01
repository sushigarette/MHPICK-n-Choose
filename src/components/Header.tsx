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
import { useAuth } from "../context/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import supabase from "@/supabase";
import { Settings, LogOut, LayoutDashboard, User, Calendar } from "lucide-react";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, logout, displayName, avatarUrl, currentUser } = useAuth();
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .gte('last_seen', twoMinutesAgo);

      if (!error) setOnlineUsers(data || []);
    };

    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', currentUser.id)
          .single();
        
        setIsAdmin(profile?.is_admin || false);
      }
    };
    checkAdminStatus();
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès.",
    });
    navigate("/");
  };

  return (
    <header className="w-full py-4 px-6 bg-background border-b border-border">
      <div className="mx-auto flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img className="h-8" src={"/lio.png"}></img>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 text-transparent bg-clip-text">
            MHPick
          </span>
        </motion.div>

        <div className="flex items-center gap-4">
          {isAuthenticated && onlineUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">En ligne :</span>
              {onlineUsers.map(user => (
                <div key={user.id} className="flex items-center">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar_url || '/lio2.png'} alt="avatar" />
                    <AvatarFallback>
                      {(user.display_name || '').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="ml-1 text-xs">{user.display_name}</span>
                </div>
              ))}
            </div>
          )}
          <ThemeToggle />
          {isAuthenticated ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl || "/lio2.png"} alt={currentUser?.email || ""} />
                      <AvatarFallback>{currentUser?.email?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{currentUser?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {currentUser?.user_metadata?.full_name}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Tableau de bord</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Mon profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/reservations")}>
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>Mes réservations</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Administration</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
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
              <Button variant="ghost" onClick={() => navigate("/login")}>
                Connexion
              </Button>
              <Button onClick={() => navigate("/register")}>S'inscrire</Button>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
