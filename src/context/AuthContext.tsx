import supabase from "@/supabase";
import { User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: User;
  displayName: string;
  avatarUrl: string;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User>(null); // Holds the current user info
  const [displayName, setDisplayName] = useState<string>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user); // Set current user
      setIsAuthenticated(!!user);
      setIsLoading(false);
    };

    checkUser();

    // Optional: Listen for auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange((_, session) => {
      setCurrentUser(session?.user || null); // Update current user
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription?.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, is_admin")
        .eq("id", currentUser?.id)
        .single();
      if (data) {
        setDisplayName(data.display_name);
        setAvatarUrl(data.avatar_url);
        setIsAdmin(data.is_admin || false);
        setIsLoading(false);
      }
      if (error) console.error("Error fetching profile:", error);
    };
    if (currentUser) fetchProfile();
  }, [currentUser]);

  // AJOUT : Mise à jour du champ 'last_seen' toutes les 30 secondes
  useEffect(() => {
    if (!currentUser) return;
    const updateLastSeen = async () => {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', currentUser.id);
    };
    updateLastSeen();
    const interval = setInterval(updateLastSeen, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const login = async (email: string, password: string): Promise<void> => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Vérification du statut actif dans la table profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", data.user.id)
      .single();
    if (profileError) throw profileError;
    if (profile && profile.is_active === false) {
      // Déconnexion immédiate si jamais l'utilisateur est désactivé
      await supabase.auth.signOut();
      throw new Error("Votre compte a été désactivé par un administrateur.");
    }
    setCurrentUser(data.user); // Set current user after login
    setIsAuthenticated(true);
  };

  const signup = async (email: string, password: string): Promise<void> => {
    // Vérification du domaine
    if (!email.toLowerCase().endsWith("@mhcomm.fr")) {
      throw new Error("Seules les adresses email se terminant par @mhcomm.fr sont autorisées.");
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          displayName: email, // Set the display name to the email for the moment
        },
      },
    });
    if (error) throw error;
  };

  const logout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setCurrentUser(null); // Clear current user on logout
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  const resetPassword = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, currentUser, displayName, avatarUrl, isAdmin, login, logout, signup, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};
