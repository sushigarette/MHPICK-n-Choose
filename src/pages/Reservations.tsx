import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "../components/Header";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Reservation } from "@/interfaces";
import supabase from "@/supabase";
import { PostgrestError } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Reservations: React.FC = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<"upcoming" | "past">("upcoming");

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

  // Séparation des réservations à venir et passées
  const today = new Date();
  const upcomingReservations = myReservations.filter(r => new Date(r.date) >= new Date(today.toDateString()));
  const pastReservations = myReservations.filter(r => new Date(r.date) < new Date(today.toDateString()));

  // Filtrage par type
  const filterByType = (reservations: Reservation[]) => {
    if (filterType === "all") return reservations;
    return reservations.filter(r => r.type === filterType);
  };

  const getResourceName = (reservation: Reservation) => {
    if (reservation.type === "desk") {
      return `Bureau ${reservation.resource_id.replace("bureau_flex_", "")}`;
    } else if (reservation.type === "slot") {
      return `Place de parking ${reservation.resource_id.replace("place_", "")}`;
    } else if (reservation.type === "baby") {
      return `Place baby ${reservation.resource_id.replace("place_baby_", "")}`;
    } else if (reservation.resource_id === "PhoneBox") {
      return "PhoneBox";
    } else {
      return `Salle ${reservation.resource_id.replace("salle_reunion_", "")}`;
    }
  };

  // Sélection des réservations à afficher selon le filtre période
  const displayedReservations = filterByType(
    filterPeriod === "upcoming" ? upcomingReservations : pastReservations
  );

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

          <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={filterPeriod === "upcoming" ? "default" : "outline"}
                onClick={() => setFilterPeriod("upcoming")}
              >
                À venir
              </Button>
              <Button
                variant={filterPeriod === "past" ? "default" : "outline"}
                onClick={() => setFilterPeriod("past")}
              >
                Passées
              </Button>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type de ressource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="desk">Bureaux</SelectItem>
                <SelectItem value="slot">Parking</SelectItem>
                <SelectItem value="baby">Baby</SelectItem>
                <SelectItem value="room">Salles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card rounded-lg shadow-md overflow-hidden mt-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {filterPeriod === "upcoming" ? "À venir" : "Passées"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {filterPeriod === "upcoming"
                  ? "Gérez vos réservations à venir"
                  : "Historique de vos réservations"}
              </p>
            </div>
            <div className="divide-y">
              {displayedReservations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  Aucune réservation {filterPeriod === "upcoming" ? "à venir" : "passée"}.
                </div>
              ) : (
                displayedReservations.map((reservation, index) => {
                  const reservationDate = new Date(reservation.date);
                  return (
                    <div key={index} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-lg">{getResourceName(reservation)}</p>
                          <p className="text-sm text-gray-600">
                            {filterPeriod === "upcoming"
                              ? `Réservé pour le ${reservationDate.toLocaleDateString("fr-FR")} de ${reservation.start_time} à ${reservation.end_time}`
                              : `Réservé le ${reservationDate.toLocaleDateString("fr-FR")} de ${reservation.start_time} à ${reservation.end_time}`}
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <img
                            src={reservation.profiles?.avatar_url || "/lio2.png"}
                            alt="Profile"
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                          {filterPeriod === "upcoming" && (
                            <Button variant="destructive" onClick={() => handleCancelReservation(reservation)}>
                              Annuler
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Reservations;
