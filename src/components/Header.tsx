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
import WeatherWidget from "./WeatherWidget";
import supabase from "@/supabase";
import { Settings, LogOut, LayoutDashboard, User, Calendar, BarChart2 } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, logout, displayName, avatarUrl, currentUser, isAdmin } = useAuth();
  const [userEmail, setUserEmail] = useState("");
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

  const handleLogout = () => {
    logout();
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès.",
    });
    navigate("/");
  };

  return (
    <header className="w-full bg-background border-b border-border">
      <div className="w-full px-6 relative">
        <div className="py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center space-x-2"
            >
              <img 
                className="h-12 cursor-pointer dark:invert" 
                src={"/logomhp.png"}
                onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=2+Imp.+Boudeville,+31100+Toulouse', '_blank')}
              />
              <span 
                className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 text-transparent bg-clip-text cursor-pointer"
                onClick={() => navigate("/dashboard")}
              >
                MHPick
              </span>
            </motion.div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && onlineUsers.length > 0 && (
              <div className="hidden md:flex items-center gap-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">En ligne:</span>
                <div className="flex items-center gap-1">
                  {onlineUsers.slice(0, 4).map(user => (
                    <div key={user.id} className="flex items-center flex-shrink-0">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={user.avatar_url || '/lio2.png'} alt="avatar" />
                        <AvatarFallback className="text-xs">
                          {(user.display_name || '').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="ml-1 text-xs">{user.display_name}</span>
                    </div>
                  ))}
                  {onlineUsers.length > 4 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <span className="text-xs text-muted-foreground cursor-pointer bg-muted px-2 py-1 rounded hover:bg-muted/70 transition-colors select-none">
                          +{onlineUsers.length - 4}
                        </span>
                      </PopoverTrigger>
                      <PopoverContent className="p-2 min-w-[160px] max-h-60 overflow-y-auto">
                        <div className="flex flex-col gap-2">
                          {onlineUsers.slice(4).map(user => (
                            <div key={user.id} className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={user.avatar_url || '/lio2.png'} alt="avatar" />
                                <AvatarFallback className="text-xs">
                                  {(user.display_name || '').substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs">{user.display_name}</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
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
                        <DropdownMenuItem onClick={() => navigate("/admin/stats")}>
                          <BarChart2 className="mr-2 h-4 w-4" />
                          <span>Statistiques TT</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={() => navigate("/mes-signalements")}>
                      <BarChart2 className="mr-2 h-4 w-4" />
                      <span>Mes signalements TT</span>
                    </DropdownMenuItem>
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
            {/* Météo centrée en absolu sur desktop uniquement */}
            <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <WeatherWidget />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
