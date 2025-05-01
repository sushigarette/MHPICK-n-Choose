import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Resource, Reservation } from "@/interfaces";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource;
  selectedDate: Date;
  onConfirm: (resourceId: string, date: Date, startTime: string, endTime: string) => void;
  onCancelReservation: (reservation: Reservation) => void;
}

const ReservationModal = ({
  isOpen,
  onClose,
  resource,
  selectedDate,
  onConfirm,
  onCancelReservation,
}: ReservationModalProps) => {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const { currentUser } = useAuth();

  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, "0")}:00`;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(resource.id, selectedDate, startTime, endTime);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {resource.type === "desk" ? "Bureau" : resource.type === "room" ? "Salle" : "Ressource"} {resource.id.replace(/^(bureau_flex_|salle_reunion_)/, "")}
          </DialogTitle>
          <DialogDescription>
            {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
          </DialogDescription>
        </DialogHeader>

        {!resource.is_active ? (
          <div className="flex flex-col gap-4 py-4">
            <div className="bg-destructive/10 p-4 rounded-lg">
              <p className="text-destructive font-medium mb-2">Ressource désactivée</p>
              {resource.block_reason && (
                <p className="text-sm mb-1">
                  <span className="font-medium">Raison :</span> {resource.block_reason}
                </p>
              )}
              {resource.block_until && (
                <p className="text-sm">
                  <span className="font-medium">Jusqu'au :</span> {format(new Date(resource.block_until), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
            </DialogFooter>
          </div>
        ) : resource.reservations?.length > 0 ? (
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-3">
              <img
                src={resource.reservations[0].profiles.avatar_url || "/lio2.png"}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div>
                <p className="font-medium">{resource.reservations[0].profiles.display_name}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(resource.reservations[0].date), "dd MMMM yyyy", { locale: fr })}
                </p>
                <p className="text-sm text-muted-foreground">
                  De {resource.reservations[0].start_time} à {resource.reservations[0].end_time}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
              {resource.reservations[0].user_id === currentUser?.id && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    onCancelReservation(resource.reservations[0]);
                    onClose();
                  }}
                >
                  Annuler la réservation
                </Button>
              )}
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Heure de début</label>
                  <Select
                    value={startTime}
                    onValueChange={setStartTime}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une heure" />
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
                  <Select
                    value={endTime}
                    onValueChange={setEndTime}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une heure" />
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
              <Button type="submit">Réserver</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReservationModal;
