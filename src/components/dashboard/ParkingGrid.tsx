import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Reservation, Resource } from "@/interfaces";
import { isReservationActive } from "@/lib/reservations";
import { isResourceActive } from "@/lib/resources";

interface ParkingGridProps {
  resources: Resource[];
  reservations: Reservation[];
  selectedDate: Date;
  currentUserId?: string;
  isAdmin: boolean;
  onReserve: (spotId: string, date: Date) => void;
  onCancel: (reservation: Reservation) => void;
  spotCount?: number;
}

const ParkingGrid: React.FC<ParkingGridProps> = ({
  resources,
  reservations,
  selectedDate,
  currentUserId,
  isAdmin,
  onReserve,
  onCancel,
  spotCount = 12,
}) => {
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full justify-items-center items-center min-h-[calc(100vh-200px)] py-8">
      {Array.from({ length: spotCount }, (_, i) => {
        const spotId = `place_${i + 1}`;
        const spotReservation = reservations.find(
          (r) => r.resource_id === spotId && r.date === dateStr && isReservationActive(r)
        );
        const isMyReservation = spotReservation?.user_id === currentUserId;
        const resource = resources.find((r) => r.id === spotId);
        const isActive = resource ? isResourceActive(resource) : true;

        return (
          <div
            key={spotId}
            className={`p-6 rounded-lg text-center h-[220px] w-[220px] flex flex-col justify-between items-center ${
              !isActive
                ? "bg-destructive/10 text-destructive"
                : spotReservation
                  ? "bg-destructive/10 text-destructive"
                  : "bg-green-500/10 text-green-500"
            }`}
          >
            <p className="font-medium text-xl mt-4">Place {i + 1}</p>
            {!isActive ? (
              <div className="mb-4 flex flex-col items-center justify-center gap-2 w-full">
                <p className="text-sm text-center break-words w-full">Place désactivée</p>
                {resource?.block_reason && (
                  <p className="text-sm text-center break-words w-full">
                    Raison : {resource.block_reason}
                  </p>
                )}
                {resource?.block_until && (
                  <p className="text-sm text-center break-words w-full">
                    Jusqu'au :{" "}
                    {format(new Date(resource.block_until), "dd MMMM yyyy 'à' HH:mm", {
                      locale: fr,
                    })}
                  </p>
                )}
              </div>
            ) : spotReservation ? (
              <div className="mb-4 flex flex-col items-center justify-center gap-2 w-full">
                <img
                  src={spotReservation.profiles?.avatar_url || "/lio2.png"}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <p className="text-sm text-center break-words w-full">
                  {isMyReservation
                    ? "Réservée par vous"
                    : `Réservée par ${spotReservation.profiles?.display_name || "un utilisateur"}`}
                </p>
                {(isMyReservation || isAdmin) && (
                  <Button variant="destructive" size="sm" onClick={() => onCancel(spotReservation)}>
                    {isAdmin && !isMyReservation ? "Annuler (Admin)" : "Annuler"}
                  </Button>
                )}
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => onReserve(spotId, selectedDate)}
                className="mb-4"
              >
                Réserver
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ParkingGrid;
