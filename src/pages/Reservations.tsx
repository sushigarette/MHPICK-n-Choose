import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "../components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const Reservations: React.FC = () => {
  const { toast } = useToast();
  const [myReservations, setMyReservations] = useState<{ id: string; type: "desk" | "room"; date: Date }[]>([]);

  // Chargement des réservations depuis localStorage
  useEffect(() => {
    const savedReservations = localStorage.getItem("myReservations");
    if (savedReservations) {
      setMyReservations(JSON.parse(savedReservations));
    }
  }, []);

  const handleCancelReservation = (resourceId: string, resourceType: "desk" | "room") => {
    // Mettre à jour les réservations
    setMyReservations(myReservations.filter((reservation) => reservation.id !== resourceId));

    // Mettre à jour les bureaux ou salles
    if (resourceType === "desk") {
      const savedDesks = localStorage.getItem("desks");
      if (savedDesks) {
        const desks = JSON.parse(savedDesks);
        const updatedDesks = desks.map((desk: any) =>
          desk.id === resourceId ? { ...desk, isBooked: false, bookedBy: null } : desk
        );
        localStorage.setItem("desks", JSON.stringify(updatedDesks));
      }
    } else {
      const savedRooms = localStorage.getItem("meetingRooms");
      if (savedRooms) {
        const rooms = JSON.parse(savedRooms);
        const updatedRooms = rooms.map((room: any) =>
          room.id === resourceId ? { ...room, isBooked: false, bookedBy: null } : room
        );
        localStorage.setItem("meetingRooms", JSON.stringify(updatedRooms));
      }
    }

    // Sauvegarder les réservations mises à jour
    localStorage.setItem(
      "myReservations",
      JSON.stringify(myReservations.filter((reservation) => reservation.id !== resourceId))
    );

    toast({
      title: "Réservation annulée",
      description: `Votre réservation a été annulée avec succès.`,
    });
  };

  return (
    <div className="min-h-screen flex grow flex-col bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-3xl font-bold mb-6 text-center">Mes réservations</h1>

          {myReservations.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-600 mb-4">Vous n'avez pas encore de réservations.</p>
              <Button onClick={() => (window.location.href = "/dashboard")}>Réserver un espace</Button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Réservations en cours</h2>
                <p className="text-sm text-gray-600">Gérez vos réservations de bureaux et salles de réunion</p>
              </div>

              <div className="divide-y">
                {myReservations.map((reservation, index) => {
                  const resourceName =
                    reservation.type === "desk"
                      ? `Bureau ${reservation.id.replace("desk-", "")}`
                      : reservation.id === "phonebox"
                      ? "PhoneBox"
                      : `Salle ${reservation.id.replace("room-", "")}`;

                  const reservationDate = new Date(reservation.date);

                  return (
                    <div key={index} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-lg">{resourceName}</p>
                          <p className="text-sm text-gray-600">
                            Réservé pour le {reservationDate.toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() => handleCancelReservation(reservation.id, reservation.type)}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Reservations;
