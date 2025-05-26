import React, { useState, useEffect } from "react";
import ResetPasswordForm from "../components/ResetPasswordForm";
import Header from "../components/Header";
import supabase from "@/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function getTokenAndType(): { token: string; type: string } {
  // Cherche dans les query params
  const searchParams = new URLSearchParams(window.location.search);
  let token = searchParams.get("access_token") || searchParams.get("token") || "";
  let type = searchParams.get("type") || "";

  // Si pas trouvé, cherche dans le hash (et le parse comme une query string)
  if (!token || !type) {
    const hash = window.location.hash.replace(/^#/, "");
    const hashParams = new URLSearchParams(hash);
    token = token || hashParams.get("access_token") || hashParams.get("token") || "";
    type = type || hashParams.get("type") || "";
  }
  return { token, type };
}

const ResetPassword = () => {
  const [{ token, type }, setTokenType] = useState({ token: "", type: "" });
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTokenType(getTokenAndType());
    // Ajoute un listener pour le hashchange (au cas où le hash change après le chargement)
    const onHashChange = () => setTokenType(getTokenAndType());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

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