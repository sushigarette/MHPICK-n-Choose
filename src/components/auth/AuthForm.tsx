
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email({
    message: "Veuillez saisir une adresse email valide.",
  }),
  password: z.string().min(6, {
    message: "Le mot de passe doit contenir au moins 6 caractères.",
  }),
});

interface AuthFormProps {
  type: "login" | "register";
}

const AuthForm: React.FC<AuthFormProps> = ({ type }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    try {
      // Simuler une connexion/inscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sauvegarder les informations d'authentification
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', values.email);
      
      toast({
        title: type === "login" ? "Connexion réussie" : "Compte créé avec succès",
        description: type === "login" 
          ? "Bienvenue sur votre espace de réservation." 
          : "Votre compte a été créé. Vous pouvez maintenant vous connecter.",
      });
      
      console.log("Tentative de redirection vers /dashboard");
      
      // Force la redirection de manière plus directe
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg"
    >
      <h2 className="text-2xl font-bold text-center mb-6">
        {type === "login" ? "Connexion" : "Créer un compte"}
      </h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="votre@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {type === "login" ? "Connexion..." : "Création du compte..."}
              </span>
            ) : (
              <span>{type === "login" ? "Se connecter" : "S'inscrire"}</span>
            )}
          </Button>
          
          <div className="text-center mt-4">
            {type === "login" ? (
              <p className="text-sm text-gray-600">
                Vous n'avez pas de compte?{" "}
                <Button variant="link" className="p-0" onClick={() => navigate("/register")}>
                  S'inscrire
                </Button>
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                Vous avez déjà un compte?{" "}
                <Button variant="link" className="p-0" onClick={() => navigate("/login")}>
                  Se connecter
                </Button>
              </p>
            )}
          </div>
        </form>
      </Form>
    </motion.div>
  );
};

export default AuthForm;
