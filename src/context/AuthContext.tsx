import supabase from "@/supabase";
import { User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: User;
  displayName: string;
  avatarUrl: string;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
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
        .select("display_name, avatar_url")
        .eq("id", currentUser?.id)
        .single();
      if (data) {
        setDisplayName(data.display_name);
        setAvatarUrl(data.avatar_url);
        setIsLoading(false);
      }
      if (error) console.error("Error fetching profile:", error);
    };
    if (currentUser) fetchProfile();
  }, [currentUser]);

  const login = async (email: string, password: string): Promise<void> => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setCurrentUser(data.user); // Set current user after login
    setIsAuthenticated(true);
  };

  const signup = async (email: string, password: string): Promise<void> => {
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
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, currentUser, displayName, avatarUrl, login, logout, signup }}
    >
      {children}
    </AuthContext.Provider>
  );
};
