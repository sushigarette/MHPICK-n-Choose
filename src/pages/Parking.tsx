import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import supabase from "@/supabase";
import { useAuth } from "@/context/AuthContext";
import { PostgrestError } from "@supabase/supabase-js";
import { Reservation, Resource } from "@/interfaces";

const Parking: React.FC = () => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [parkingSpots, setParkingSpots] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    const spots: Resource[] = Array.from({ length: 12 }, (_, i) => ({
      id: `place_${i + 1}`,
      type: "slot" as const,
      name: `Place ${i + 1}`,
      capacity: 1,
      cx: 0,
      cy: 0,
      reservations: []
    }));
    setParkingSpots(spots);
  }, []);

  useEffect(() => {
    if (selectedDate) fetchReservations();
  }, [selectedDate]);

  const fetchReservations = async () => {
    const { data: reservations, error } = await supabase
      .from("reservations")
      .select("*, profiles:user_id(*)")
      .eq("date", format(selectedDate, "yyyy-MM-dd"))
      .eq("type", "slot");

    if (error) {
      console.error("Error loading reservations:", error);
      return;
    }

    setReservations(reservations || []);
    setParkingSpots(prevSpots => 
      prevSpots.map(spot => ({
        ...spot,
        reservations: reservations?.filter(res => res.resource_id === spot.id) || []
      }))
    );
    const myRes = reservations?.filter(r => r.user_id === currentUser?.id) || [];
    setMyReservations(myRes);
  };

  const handleReservation = async (spotId: string) => {
    if (!currentUser) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour faire une réservation.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("reservations").insert([
        {
          user_id: currentUser.id,
          resource_id: spotId,
          type: "slot",
          date: format(selectedDate, "yyyy-MM-dd"),
          start_time: "00:00",
          end_time: "23:59"
        },
      ]);

      if (error) throw error;
      toast({
        title: "Réservation confirmée",
        description: `Vous avez réservé la place de parking ${spotId.replace("place_", "")} pour le ${format(selectedDate, "dd MMMM yyyy", { locale: fr })}.`,
      });
      fetchReservations();
    } catch (error) {
      console.error("Error during reservation:", error);
      toast({
        title: "Erreur",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleCancelReservation = async (reservation: Reservation) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", reservation.id);

      if (error) throw error;
      toast({
        title: "Réservation annulée",
        description: "Votre réservation a été annulée.",
      });
      fetchReservations();
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex flex-col md:flex-row grow gap-4 p-4">
        <div className="flex gap-4 flex-col bg-white p-6 rounded-lg shadow-md md:max-w-md w-full">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Sélectionnez une date</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/dashboard"}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux bureaux
            </Button>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(new Date(date));
                  }
                }}
                className="rounded-md border"
                disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
              />
            </PopoverContent>
          </Popover>

          {myReservations.length > 0 && (
            <>
              <Separator className="my-2" />
              <h2 className="font-semibold">Mes réservations</h2>
              <div className="flex flex-col gap-2">
                {myReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">Place {reservation.resource_id.replace("place_", "")}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(reservation.date), "dd MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelReservation(reservation)}
                    >
                      Annuler
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="grow bg-white p-6 rounded-lg shadow-md">
          <h2 className="font-semibold mb-4">
            Places disponibles ({parkingSpots.filter(spot => !spot.reservations?.length).length}/{parkingSpots.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {parkingSpots.map((spot) => {
              const isReserved = spot.reservations.length > 0;
              const isMyReservation = spot.reservations.some((r: any) => r.user_id === currentUser?.id);
              const reservation = spot.reservations[0];

              return (
                <div
                  key={spot.id}
                  className={`p-6 rounded-lg text-center min-h-[180px] flex flex-col justify-center items-center ${
                    isReserved
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  <p className="font-medium text-xl">Place {spot.id.replace("place_", "")}</p>
                  {isReserved ? (
                    isMyReservation ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelReservation(reservation)}
                        className="mt-4"
                      >
                        Annuler
                      </Button>
                    ) : (
                      <div className="mt-4 flex flex-col items-center justify-center gap-2 w-full">
                        <img
                          src={reservation.profiles?.avatar_url || "/lio2.png"}
                          alt="Profile"
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <p className="text-sm text-center break-words w-full">
                          Réservée par {reservation.profiles?.display_name || "un utilisateur"}
                        </p>
                      </div>
                    )
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleReservation(spot.id)}
                      className="mt-4"
                    >
                      Réserver
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parking; 