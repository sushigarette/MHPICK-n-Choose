import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Resource } from "@/interfaces";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource;
  selectedDate: Date;
  onConfirm: (resourceId: string, date: Date, startTime: string, endTime: string) => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onClose, resource, selectedDate, onConfirm }) => {
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("17:00");
  const { toast } = useToast();

  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 8; // Commence à 8h
    return `${hour.toString().padStart(2, "0")}:00`;
  });

  const handleConfirm = () => {
    if (startTime >= endTime) {
      toast({
        title: "Heures invalides",
        description: "L'heure de fin doit être postérieure à l'heure de début.",
        variant: "destructive",
      });
      return;
    }

    onConfirm(resource.id, selectedDate, startTime, endTime);
    onClose();
  };

  // If there are reservations, show the reservation user ID; otherwise, show the normal reservation form.
  const renderDialogContent = () => {
    if (resource.reservations && resource.reservations.length > 0) {
      return (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réservation existante</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-center">
              <img
                src={resource.reservations[0].profiles.avatar_url || "/lio2.png"}
                alt="Profile"
                className="min-w-16 min-h-16 w-16 h-16 rounded-full object-cover"
              />
              <div>
                <p className="font-medium">Réservé par {resource.reservations[0].profiles.display_name}</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(resource.reservations[0].date), "dd MMMM yyyy", { locale: fr })}
                </p>
                <p className="text-sm text-gray-600">
                  De {resource.reservations[0].start_time} à {resource.reservations[0].end_time}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      );
    }

    // If no reservations, show the reservation form.
    return (
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Réserver {resource.type === "desk" ? "un bureau" : "une salle de réunion"}</DialogTitle>
          <DialogDescription>Sélectionnez les heures pour votre réservation</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Heure de début</label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Heure de fin</label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>Confirmer</Button>
        </DialogFooter>
      </DialogContent>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {renderDialogContent()}
    </Dialog>
  );
};

export default ReservationModal;
