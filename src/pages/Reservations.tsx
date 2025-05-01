import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "../components/Header";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Reservation } from "@/interfaces";
import supabase from "@/supabase";
import { PostgrestError } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";

const Reservations: React.FC = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);

  // Chargement des réservations depuis localStorage
  useEffect(() => {
    loadMyReservations();
  }, []);

  const loadMyReservations = async () => {
    const {
      data: reservations,
      error,
    }: {
      data: Reservation[] | null;
      error: PostgrestError | null;
    } = await supabase
      .from("reservations")
      .select("*, profiles:user_id(*)")
      .eq("user_id", currentUser.id);

    if (error) return console.error("Error loading reservations:", error);

    setMyReservations(reservations || []);
  };

  const handleCancelReservation = async (reservation: Reservation) => {
    try {
      const { error } = await supabase.from("reservations").delete().eq("id", reservation.id);
      if (error) throw error;
      toast({
        title: "Réservation annulée",
        description: `Votre réservation a été annulée.`,
      });
      loadMyReservations();
    } catch (error) {
      console.error("Error during cancellation:", error);
      toast({
        title: "Erreur",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex grow flex-col bg-background">
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
            <div className="bg-card p-8 rounded-lg shadow-md text-center">
              <p className="text-muted-foreground mb-4">Vous n'avez pas encore de réservations.</p>
              <Button onClick={() => (window.location.href = "/dashboard")}>Réserver un espace</Button>
            </div>
          ) : (
            <div className="bg-card rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Réservations en cours</h2>
                <p className="text-sm text-muted-foreground">Gérez vos réservations de bureaux et salles de réunion</p>
              </div>

              <div className="divide-y">
                {myReservations.map((reservation, index) => {
                  const resourceName =
                    reservation.type === "desk"
                      ? `Bureau ${reservation.resource_id.replace("bureau_flex_", "")}`
                      : reservation.type === "slot"
                      ? `Place de parking ${reservation.resource_id.replace("place_", "")}`
                      : reservation.resource_id === "PhoneBox"
                      ? "PhoneBox"
                      : `Salle ${reservation.resource_id.replace("salle_reunion_", "")}`;

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
                        <div className="flex flex-col items-center gap-2">
                          <img
                            src={reservation.profiles?.avatar_url || "/lio2.png"}
                            alt="Profile"
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                          <Button variant="destructive" onClick={() => handleCancelReservation(reservation)}>
                            Annuler
                          </Button>
                        </div>
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
