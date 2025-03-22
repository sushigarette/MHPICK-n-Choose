import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "../components/layout/Header";
import FloorPlan from "../components/floorplan/FloorPlan";
import ReservationModal from "../components/reservation/ReservationModal";
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

// Données des bureaux basées sur les coordonnées fournies
const initialDesksData = [
  { id: "bureau_flex_1", isBooked: false },
  { id: "bureau_flex_2", isBooked: false },
  { id: "bureau_flex_3", isBooked: false },
  { id: "bureau_flex_4", isBooked: false },
  { id: "bureau_flex_5", isBooked: false },
  { id: "bureau_flex_6", isBooked: false },
  { id: "bureau_flex_7", isBooked: false },
  { id: "bureau_flex_8", isBooked: false },
  { id: "bureau_flex_9", isBooked: false },
  { id: "bureau_flex_10", isBooked: false },
  { id: "bureau_flex_11", isBooked: false },
  { id: "bureau_flex_12", isBooked: false },
  { id: "bureau_flex_13", isBooked: false },
  { id: "bureau_flex_14", isBooked: false },
  { id: "bureau_flex_15", isBooked: false },
  { id: "bureau_flex_16", isBooked: false },
  { id: "bureau_flex_17", isBooked: false },
  { id: "bureau_flex_18", isBooked: false },
  { id: "bureau_flex_19", isBooked: false },
  { id: "bureau_flex_20", isBooked: false },
  { id: "bureau_flex_21", isBooked: false },
];

// Données des salles de réunion basées sur les coordonnées fournies
const initialMeetingRoomsData = [
  { id: "salle_reunion_1", isBooked: false },
  { id: "salle_reunion_2", isBooked: false },
  { id: "PhoneBox", isBooked: false },
];

type Reservation = {
  id: number;
  user_id: string; // UUID as a string
  resource_id: string; // Resource identifier (e.g., "bureau_flex_3")
  type: "desk" | "meeting_room"; // Assuming type can be either 'desk' or 'meeting_room'
  date: string; // ISO date string
  start_time: string; // Time string (HH:mm:ss)
  end_time: string; // Time string (HH:mm:ss)
  created_at: string; // ISO datetime string
};

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [desks, setDesks] = useState(initialDesksData);
  const [meetingRooms, setMeetingRooms] = useState(initialMeetingRoomsData);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedResource, setSelectedResource] = useState<{ id: string; type: "desk" | "room" } | null>(null);
  const { currentUser } = useAuth();

  // Charger les réservations depuis Supabase
  useEffect(() => {
    loadReservations();
  }, [selectedDate]);

  const loadReservations = async () => {
    // Get the start and end of the day
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0)); // Start of the day (00:00)
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999)); // End of the day (23:59)

    // Fetch reservations for the given day
    const {
      data: reservations,
      error,
    }: {
      data: Reservation[] | null; // The data will be an array of Reservation objects or null
      error: PostgrestError | null; // The error can be a PostgrestError or null
    } = await supabase
      .from("reservations")
      .select("*")
      .gte("date", startOfDay.toISOString())
      .lte("date", endOfDay.toISOString());

    if (error) return console.error("Error loading reservations:", error);

    console.log(reservations);

    // Update MyReservations state
    const myRes = reservations.filter((r) => r.user_id == currentUser.id);
    setMyReservations(myRes);

    // Assuming desks and meetingRooms are arrays with an 'id' field to match with reservations
    const updatedDesks = desks.map((desk) => ({
      ...desk,
      isBooked: reservations.some((res) => res.resource_id === desk.id),
    }));

    const updatedMeetingRooms = meetingRooms.map((room) => ({
      ...room,
      isBooked: reservations.some((res) => res.resource_id === room.id),
    }));

    // Update state for desks and meeting rooms
    setDesks(updatedDesks);
    setMeetingRooms(updatedMeetingRooms);
  };

  const handleReservation = async (resourceId: string, date: Date, startTime: string, endTime: string) => {
    console.log("handleReservation called with:", { resourceId, date, startTime, endTime });

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
                    console.log("New date selected:", format(date, "yyyy-MM-dd"));
                    setSelectedDate(new Date(date));
                  }
                }}
                className="rounded-md border"
                disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
              />
            </PopoverContent>
          </Popover>
          <Separator className="mb-2" />

          <h2 className="font-semibold">Légende</h2>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
              <span>Bureau disponible</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
              <span>Bureau réservé</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-yellow-300 mr-2"></div>
              <span>Salle disponible</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-amber-300 mr-2"></div>
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
            <FloorPlan
              desks={desks}
              meetingRooms={meetingRooms}
              onSelect={(id, type) => setSelectedResource({ id, type })}
            />
          </div>
        </div>
      </div>

      {selectedResource && (
        <ReservationModal
          isOpen={!!selectedResource}
          onClose={() => setSelectedResource(null)}
          resourceId={selectedResource.id}
          resourceType={selectedResource.type}
          selectedDate={selectedDate}
          onConfirm={handleReservation}
        />
      )}
    </div>
  );
};

export default Dashboard;
