import React, { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

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
  const { login, signup } = useAuth();

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
      if (type === "login") {
        await login(values.email, values.password);
        toast({ title: "Connexion réussie", description: "Bienvenue sur votre espace de réservation." });
      } else {
        await signup(values.email, values.password);
        toast({
          title: "Compte créé avec succès",
          description: "Votre compte a été créé. Vous pouvez maintenant vous connecter.",
        });
      }
      navigate("/dashboard");
    } catch (error) {
      toast({ title: "Erreur", description: error.message || "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full h-fit max-w-md mx-auto p-6 bg-card rounded-lg shadow-lg"
    >
      <h2 className="text-2xl font-bold text-center mb-6 text-foreground">{type === "login" ? "Connexion" : "Créer un compte"}</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Email</FormLabel>
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
                <FormLabel className="text-foreground">Mot de passe</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? type === "login"
                ? "Connexion..."
                : "Création du compte..."
              : type === "login"
              ? "Se connecter"
              : "S'inscrire"}
          </Button>

          <div className="text-center mt-4">
            {type === "login" ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">
                  Vous n'avez pas de compte?{" "}
                  <Button variant="link" className="p-0" onClick={() => navigate("/register")}>
                    S'inscrire
                  </Button>
                </p>
                <Button variant="link" className="p-0" onClick={() => navigate("/reset-password")}>
                  Mot de passe oublié ?
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
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
