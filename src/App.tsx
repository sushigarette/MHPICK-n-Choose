// src/App.js
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Reservations from "./pages/Reservations";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/toaster";
import Profile from "./pages/Profile";
import Parking from "./pages/Parking";
import Loading from "./components/Loading";
import { useEffect, useState } from "react";
import supabase from "./supabase";
import AdminPanel from "./components/AdminPanel";
import AdminStats from "./pages/AdminStats";
import MesSignalements from "./pages/MesSignalements";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const PrivateRoute = ({ element }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading || showLoading) return <Loading />;
  return isAuthenticated ? element : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(false);
    };
    checkAdminStatus();
  }, [currentUser]);

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return isAdmin ? <>{children}</> : <Navigate to="/dashboard" />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
                <Route path="/profile" element={<PrivateRoute element={<Profile />} />} />
                <Route path="/reservations" element={<PrivateRoute element={<Reservations />} />} />
                <Route path="/parking" element={<PrivateRoute element={<Parking />} />} />
                <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                <Route path="/admin/stats" element={<AdminRoute><AdminStats /></AdminRoute>} />
                <Route path="/mes-signalements" element={<PrivateRoute element={<MesSignalements />} />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
