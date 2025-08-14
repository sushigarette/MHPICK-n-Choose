import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Resource } from "@/interfaces";
import supabase from "@/supabase";
import { useAuth } from "@/context/AuthContext";

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource;
  onTicketCreated?: () => void;
}

const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  resource,
  onTicketCreated
}) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"basse" | "normal" | "haute" | "urgente">("normal");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer un ticket.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !message.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("tickets").insert({
        user_id: currentUser.id,
        resource_id: resource.id,
        title: title.trim(),
        message: message.trim(),
        priority,
        status: "envoyé"
      });

      if (error) throw error;

      toast({
        title: "Ticket créé",
        description: "Votre signalement a été envoyé avec succès.",
      });

      // Reset form
      setTitle("");
      setMessage("");
      setPriority("normal");
      
      onClose();
      onTicketCreated?.();
    } catch (error) {
      console.error("Erreur lors de la création du ticket:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le ticket. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle("");
      setMessage("");
      setPriority("normal");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Signaler un problème - {resource.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre du problème</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Bureau en panne, Chaise cassée..."
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priorité</Label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basse">Basse</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Description du problème</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Décrivez le problème en détail..."
              rows={5}
              maxLength={1000}
              required
            />
            <div className="text-xs text-muted-foreground text-right">
              {message.length}/1000 caractères
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer le signalement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TicketModal; 