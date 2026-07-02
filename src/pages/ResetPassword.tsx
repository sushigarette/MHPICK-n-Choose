import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ResetPasswordForm from "../components/ResetPasswordForm";
import Header from "../components/Header";
import supabase from "@/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const MIN_PASSWORD_LENGTH = 6;

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // true dès qu'une session de récupération est établie (lien reçu par email)
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const done = () => { if (!cancelled) setCheckingLink(false); };

    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    // 0. Le lien peut revenir avec une erreur (lien expiré / déjà utilisé).
    const linkError = url.searchParams.get("error_description") || hashParams.get("error_description");
    if (linkError) {
      setMessage(decodeURIComponent(linkError.replace(/\+/g, " ")));
      done();
      return;
    }

    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type");
    const code = url.searchParams.get("code");

    if (tokenHash && type) {
      // 1. Flux recommandé : c'est l'appli qui consomme le token (résiste au
      //    pré-chargement des liens par les scanners de messagerie).
      supabase.auth
        .verifyOtp({ type: type as "recovery", token_hash: tokenHash })
        .then(({ error }) => {
          if (!cancelled && !error) setRecoveryReady(true);
          done();
        });
    } else if (code) {
      // 2. Flux PKCE : échange du code contre une session.
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!cancelled && !error) setRecoveryReady(true);
        done();
      });
    } else {
      // 3. Flux implicite : le hash est consommé au chargement (événement
      //    PASSWORD_RECOVERY ci-dessous). On vérifie aussi une session existante.
      supabase.auth.getSession().then(({ data }) => {
        if (!cancelled && data.session) setRecoveryReady(true);
        done();
      });
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        setRecoveryReady(true);
        setCheckingLink(false);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setMessage(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      setMessage("Erreur : " + error.message);
      return;
    }

    toast({
      title: "Mot de passe modifié",
      description: "Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
    });
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen grow flex flex-col bg-background">
      <Header />
      <div className="flex grow items-center">
        <div className="w-full h-fit max-w-md mx-auto p-6 bg-card rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6">Réinitialisation du mot de passe</h2>

          {checkingLink ? (
            <p className="text-center text-sm text-muted-foreground">Vérification du lien…</p>
          ) : recoveryReady ? (
            <form onSubmit={handleReset} className="space-y-4">
              <Input
                type="password"
                placeholder="Nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Changement..." : "Changer le mot de passe"}
              </Button>
              {message && <div className="text-center text-sm mt-2 text-destructive">{message}</div>}
            </form>
          ) : (
            <>
              {message && (
                <div className="mb-4 rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
                  Ce lien est invalide ou a expiré. Demandez-en un nouveau ci-dessous.
                </div>
              )}
              <p className="text-sm text-muted-foreground text-center mb-4">
                Saisissez votre adresse email : vous recevrez un lien pour choisir un nouveau mot de passe.
              </p>
              <ResetPasswordForm />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
