import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startOfDay, isBefore } from 'date-fns';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
  resourceType: 'desk' | 'room';
  selectedDate: Date;
  onConfirm: (resourceId: string, date: Date, startTime: string, endTime: string) => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ 
  isOpen, 
  onClose, 
  resourceId,
  resourceType,
  selectedDate,
  onConfirm
}) => {
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("17:00");
  const { toast } = useToast();

  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 8; // Commence à 8h
    return `${hour.toString().padStart(2, '0')}:00`;
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

    onConfirm(resourceId, selectedDate, startTime, endTime);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Réserver {resourceType === 'desk' ? 'un bureau' : 'une salle de réunion'}
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les heures pour votre réservation
          </DialogDescription>
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
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleConfirm}>Confirmer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationModal;
