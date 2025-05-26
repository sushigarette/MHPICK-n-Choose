import React, { useState, useEffect } from "react";
import ResetPasswordForm from "../components/ResetPasswordForm";
import Header from "../components/Header";
import { useSearchParams } from "react-router-dom";
import supabase from "@/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState("");
  const [type, setType] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(searchParams.get("access_token") || searchParams.get("token") || "");
    setType(searchParams.get("type") || "");
  }, [searchParams]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMessage("Erreur : " + error.message);
    } else {
      setMessage("Mot de passe changé avec succès ! Vous pouvez maintenant vous connecter.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen grow flex flex-col bg-background">
      <Header />
      <div className="flex grow items-center">
        <div className="w-full h-fit max-w-md mx-auto p-6 bg-card rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6">Réinitialisation du mot de passe</h2>
          {token && type === "recovery" ? (
            <form onSubmit={handleReset} className="space-y-4">
              <Input
                type="password"
                placeholder="Nouveau mot de passe"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Changement..." : "Changer le mot de passe"}
              </Button>
              {message && <div className="text-center text-sm mt-2">{message}</div>}
            </form>
          ) : (
            <ResetPasswordForm />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 