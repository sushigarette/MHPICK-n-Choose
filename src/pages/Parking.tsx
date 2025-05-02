import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import supabase from "@/supabase";
import { useAuth } from "@/context/AuthContext";
import { PostgrestError } from "@supabase/supabase-js";
import { Reservation, Resource } from "@/interfaces";

const Parking: React.FC = () => {
  const { toast } = useToast();
  const { currentUser, isAdmin } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [parkingSpots, setParkingSpots] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);

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
    fetchResources();
  }, []);

  const fetchResources = async () => {
    const { data: resources, error } = await supabase
      .from("resources")
      .select("*")
      .eq("type", "slot");

    if (error) {
      console.error("Error loading resources:", error);
      return;
    }

    setParkingSpots(prevSpots => 
      prevSpots.map(spot => {
        const resource = resources.find(r => r.id === spot.id);
        return {
          ...spot,
          is_active: resource?.is_active ?? true,
          block_reason: resource?.block_reason,
          block_until: resource?.block_until
        };
      })
    );
  };

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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-col md:flex-row grow gap-4 p-4">
        <div className="flex gap-4 flex-col bg-card p-6 rounded-lg shadow-md md:max-w-md w-full">
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() - 1);
                if (!isBefore(startOfDay(newDate), startOfDay(new Date()))) {
                  setSelectedDate(newDate);
                }
              }}
              disabled={isBefore(startOfDay(selectedDate), startOfDay(new Date()))}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
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
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 1);
                setSelectedDate(newDate);
              }}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {myReservations.length > 0 && (
            <>
              <Separator className="my-2" />
              <h2 className="font-semibold">Mes réservations</h2>
              <div className="flex flex-col gap-2">
                {myReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex justify-between items-center p-3 bg-muted rounded-md"
                  >
                    <div>
                      <p className="font-medium">Place {reservation.resource_id.replace("place_", "")}</p>
                      <p className="text-sm text-muted-foreground">
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

        <div className="flex-1 bg-card p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full justify-items-center items-center min-h-[calc(100vh-200px)] py-8">
            {parkingSpots.map((spot) => {
              const isReserved = spot.reservations.length > 0;
              const reservation = spot.reservations[0];
              const isMyReservation = reservation?.user_id === currentUser?.id;

              return (
                <div
                  key={spot.id}
                  className={`p-6 rounded-lg text-center h-[220px] w-[220px] flex flex-col justify-between items-center ${
                    !spot.is_active
                      ? "bg-destructive/10 text-destructive"
                      : isReserved
                        ? "bg-destructive/10 text-destructive"
                        : "bg-green-500/10 text-green-500"
                  }`}
                >
                  <p className="font-medium text-xl mt-4">Place {spot.id.replace("place_", "")}</p>
                  {isReserved ? (
                    isMyReservation || isAdmin ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelReservation(reservation)}
                        className="mt-4"
                      >
                        {isAdmin && !isMyReservation ? "Annuler (Admin)" : "Annuler"}
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