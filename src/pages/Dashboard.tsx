import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import ReservationModal from "../components/ReservationModal";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import supabase from "@/supabase";
import { useAuth } from "@/context/AuthContext";
import { PostgrestError } from "@supabase/supabase-js";
import PlanSVG from "@/components/PlanSVG";
import { Reservation, Resource } from "@/interfaces";

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const { currentUser } = useAuth();

  // Only fetch resources once
  useEffect(() => {
    fetchResources();
  }, []);

  // Fetch reservations on every date change
  useEffect(() => {
    if (selectedDate) fetchReservations();
  }, [selectedDate]);

  useEffect(() => {
    if (resources.length) {
      const updatedResources = resources.map((resource) => {
        const res = reservations.filter((res) => res.resource_id === resource.id);
        return { ...resource, reservations: res };
      });
      setResources(updatedResources);
      console.log(updatedResources);
    }
  }, [reservations]);

  const fetchResources = async (): Promise<void> => {
    const { data: resources, error } = await supabase.from("resources").select("*");
    if (error) throw error;
    setResources(resources);
    if (selectedDate) fetchReservations();
  };

  const fetchReservations = async () => {
    // Fetch reservations for the given day
    const {
      data: reservations,
      error,
    }: {
      data: Reservation[] | null; // The data will be an array of Reservation objects or null
      error: PostgrestError | null; // The error can be a PostgrestError or null
    } = await supabase
      .from("reservations")
      .select("*, profiles:user_id(*)")
      .filter("date", "eq", format(selectedDate, "yyyy-MM-dd"));

    if (error) return console.error("Error loading reservations:", error);

    setReservations([...reservations]);
    const myRes = reservations.filter((r) => r.user_id == currentUser.id);
    setMyReservations(myRes);
  };

  const handleReservation = async (resourceId: string, date: Date, startTime: string, endTime: string) => {
    if (!currentUser) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour faire une réservation.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Step 1: Check for existing reservations
      const { data: existingReservations, error: checkError } = await supabase
        .from("reservations")
        .select("*")
        .eq("resource_id", resourceId)
        .eq("date", format(date, "yyyy-MM-dd"))
        .or(`start_time.lte.${endTime},end_time.gte.${startTime}`);

      if (checkError) throw checkError;

      if (existingReservations?.length) {
        toast({
          title: "Réservation impossible",
          description: "Cette ressource est déjà réservée pour ces horaires.",
          variant: "destructive",
        });
        return;
      }

      // Step 2: Insert the reservation
      const { error: insertError } = await supabase.from("reservations").insert([
        {
          user_id: currentUser.id,
          resource_id: resourceId,
          type: selectedResource?.type || "desk",
          date: format(date, "yyyy-MM-dd"),
          start_time: startTime,
          end_time: endTime,
        },
      ]);

      if (insertError) throw insertError;

      fetchReservations();
      setSelectedResource(null);

      toast({
        title: "Réservation confirmée",
        description: `Vous avez réservé ${
          selectedResource?.type === "desk" ? "le bureau" : "la salle"
        } ${resourceId.replace(
          selectedResource?.type === "desk" ? "bureau_flex_" : "salle_reunion_",
          ""
        )} pour le ${format(date, "dd MMMM yyyy", { locale: fr })} de ${startTime} à ${endTime}.`,
      });
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
      const { error } = await supabase.from("reservations").delete().eq("id", reservation.id);
      if (error) throw error;
      toast({
        title: "Réservation annulée",
        description: `Votre réservation a été annulée.`,
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
    <div className="h-full flex flex-col grow gap-2 bg-gray-50">
      <Header />
      <div className="flex flex-col md:flex-row grow gap-2">
        <div className="flex gap-4 flex-col bg-white p-6 rounded-lg shadow-md md:max-w-md w-full">
          <h2 className="font-semibold">Visualisation pour le</h2>
          <div className="flex flex-col gap-4">
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
            <Button 
              variant="outline" 
              className="w-[280px]"
              onClick={() => window.location.href = "/parking"}
            >
              Réserver un parking
            </Button>
          </div>
          <Separator className="mb-2" />

          <h2 className="font-semibold">Légende</h2>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
              <span>Bureau disponible ({resources.filter(r => r.type === 'desk' && !r.reservations?.length).length}/{resources.filter(r => r.type === 'desk').length})</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
              <span>Bureau réservé</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-300 mr-2"></div>
              <span>Salle disponible ({resources.filter(r => r.type === 'room' && !r.reservations?.length).length}/{resources.filter(r => r.type === 'room').length})</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
              <span>Salle réservée</span>
            </div>
          </div>
          <Separator className="mb-2" />

          {myReservations.length > 0 && (
            <>
              <h2 className="font-semibold">Mes réservations</h2>
              <div className="flex flex-col gap-2">
                {myReservations.map((reservation, index) => {
                  const resourceName =
                    reservation.type === "desk"
                      ? `Bureau ${reservation.resource_id.replace("bureau_flex_", "")}`
                      : reservation.type === "slot"
                      ? `Place de parking ${reservation.resource_id.replace("place_", "")}`
                      : reservation.resource_id === "PhoneBox"
                      ? "PhoneBox"
                      : `Salle ${reservation.resource_id.replace("salle_reunion_", "")}`;

                  return (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="font-medium">{resourceName}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(reservation.date), "dd MMMM yyyy", { locale: fr })} de{" "}
                          {reservation.start_time} à {reservation.end_time}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancelReservation(reservation)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="max-h-full grow flex align-center justify-center bg-white p-6 rounded-lg shadow-md">
          <div className="max-h-full md:grow-0 grow shadow-md">
            <PlanSVG resources={resources} onSelect={(resource) => setSelectedResource(resource)} />
          </div>
        </div>
      </div>

      {selectedResource && (
        <ReservationModal
          isOpen={!!selectedResource}
          onClose={() => setSelectedResource(null)}
          resource={selectedResource}
          selectedDate={selectedDate}
          onConfirm={handleReservation}
        />
      )}
    </div>
  );
};

export default Dashboard;
