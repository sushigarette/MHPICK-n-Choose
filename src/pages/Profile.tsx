import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import supabase from "@/supabase";
import Header from "@/components/Header";
import { SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { currentUser, displayName: oldDisplayName, avatarUrl: oldAvatarUrl } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>("");

  useEffect(() => {
    setDisplayName(oldDisplayName);
  }, [oldDisplayName]);

  useEffect(() => {
    setAvatarUrl(oldAvatarUrl);
  }, [oldAvatarUrl]);

  const handleSave = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, avatar_url: avatarUrl })
      .eq("id", currentUser?.id);
    if (error) {
      toast({
        title: "Erreur lors de la mise à jour du profil",
        variant: "destructive",
      });
      console.error("Error updating profile:", error);
    } else toast({ title: "Profil mis à jour", variant: "default" });
  };

  return (
    <div className="h-full flex flex-col grow gap-2 bg-gray-50">
      <Header />
      <div className="flex grow bg-white p-6 rounded-lg shadow-md w-full items-center justify-center">
        <div className="flex flex-col gap-4 items-start">
          {!oldDisplayName ? (
            <>Chargement...</>
          ) : (
            <>
              <div className="flex gap-4">
                <img src={avatarUrl || "/lio2.png"} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                <div>
                  <h1 className="text-2xl font-bold">Profil</h1>
                  <h2>{currentUser?.email}</h2>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <label htmlFor="displayName">Pseudo pour les réservations</label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName ?? ""}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nom affiché"
                  className="p-2 border rounded w-full"
                />
              </div>
              <div className="flex flex-col gap-2 w-full">
                <label htmlFor="url">URL pour l'avatar</label>
                <input
                  id="url"
                  type="text"
                  value={avatarUrl ?? ""}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="URL Avatar"
                  className="p-2 border rounded w-full"
                />
                <small>
                  Tu peux upload sur <a href="https://imgur.com/upload">Imgur</a>
                </small>
              </div>

              <Button onClick={handleSave}>
                <SaveIcon />
                Enregistrer
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
