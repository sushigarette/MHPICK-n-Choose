// src/App.js
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Reservations from "./pages/Reservations";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/toaster";
import Profile from "./pages/Profile";
import Parking from "./pages/Parking";

const queryClient = new QueryClient();

const PrivateRoute = ({ element }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  return isAuthenticated ? element : <Navigate to="/login" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
            <Route path="/profile" element={<PrivateRoute element={<Profile />} />} />
            <Route path="/reservations" element={<PrivateRoute element={<Reservations />} />} />
            <Route path="/parking" element={<PrivateRoute element={<Parking />} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
