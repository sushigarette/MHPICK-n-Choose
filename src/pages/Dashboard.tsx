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

interface Reservation {
  id: string;
  type: "desk" | "room";
  date: Date;
  startTime: string;
  endTime: string;
}

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [desks, setDesks] = useState(initialDesksData);
  const [meetingRooms, setMeetingRooms] = useState(initialMeetingRoomsData);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedResource, setSelectedResource] = useState<{ id: string; type: "desk" | "room" } | null>(null);

  const [todos, setTodos] = useState([]);

  useEffect(() => {
    const getTodos = async () => {
      const { data: todos } = await supabase.from("todos").select();

      if (todos.length > 1) {
        setTodos(todos);
      }
    };

    getTodos();
  }, []);

  // Simuler un utilisateur connecté
  const currentUser = {
    id: "user-1",
    email: "utilisateur@example.com",
    name: "Utilisateur",
  };

  // Charger les réservations depuis le localStorage
  useEffect(() => {
    const savedDesks = localStorage.getItem("desks");
    const savedRooms = localStorage.getItem("meetingRooms");
    const savedReservations = localStorage.getItem("myReservations");

    console.log("Loading from localStorage:", {
      savedDesks,
      savedRooms,
      savedReservations,
    });

    if (savedDesks) {
      const parsedDesks = JSON.parse(savedDesks);
      if (parsedDesks.length === 21) {
        setDesks(parsedDesks);
      } else {
        setDesks(initialDesksData);
      }
    }
    if (savedRooms) setMeetingRooms(JSON.parse(savedRooms));
    if (savedReservations) {
      const parsedReservations = JSON.parse(savedReservations);
      // Convertir les dates string en objets Date
      const reservationsWithDates = parsedReservations.map((res: any) => ({
        ...res,
        date: new Date(res.date),
      }));
      setMyReservations(reservationsWithDates);
    }
  }, []);

  // Sauvegarder les réservations dans le localStorage
  useEffect(() => {
    console.log("Saving to localStorage:", {
      desks,
      meetingRooms,
      myReservations,
    });

    localStorage.setItem("desks", JSON.stringify(desks));
    localStorage.setItem("meetingRooms", JSON.stringify(meetingRooms));
    localStorage.setItem("myReservations", JSON.stringify(myReservations));
  }, [desks, meetingRooms, myReservations]);

  // Mettre à jour l'état des ressources en fonction de la date sélectionnée
  useEffect(() => {
    const updateResourceStatus = () => {
      if (!selectedDate) return;

      const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
      console.log("Updating resource status for date:", selectedDateStr);

      // Réinitialiser l'état des ressources
      const updatedDesks = initialDesksData.map((desk) => ({ ...desk, isBooked: false }));
      const updatedRooms = initialMeetingRoomsData.map((room) => ({ ...room, isBooked: false }));

      // Mettre à jour l'état en fonction des réservations pour la date sélectionnée
      myReservations.forEach((reservation) => {
        const reservationDate = new Date(reservation.date);
        const reservationDateStr = format(reservationDate, "yyyy-MM-dd");
        console.log("Checking reservation:", {
          id: reservation.id,
          date: reservationDateStr,
          selectedDate: selectedDateStr,
        });

        if (reservationDateStr === selectedDateStr) {
          if (reservation.type === "desk") {
            const deskIndex = updatedDesks.findIndex((desk) => desk.id === reservation.id);
            if (deskIndex !== -1) {
              updatedDesks[deskIndex].isBooked = true;
            }
          } else {
            const roomIndex = updatedRooms.findIndex((room) => room.id === reservation.id);
            if (roomIndex !== -1) {
              updatedRooms[roomIndex].isBooked = true;
            }
          }
        }
      });

      setDesks(updatedDesks);
      setMeetingRooms(updatedRooms);
    };

    updateResourceStatus();
  }, [selectedDate, myReservations]);

  const handleReservation = (resourceId: string, date: Date, startTime: string, endTime: string) => {
    console.log("handleReservation called with:", { resourceId, date, startTime, endTime });

    // Vérifier si la ressource est déjà réservée pour cette date et ces heures
    const isAlreadyBooked = myReservations.some((reservation) => {
      const reservationDate = new Date(reservation.date);
      const selectedDateStr = format(date, "yyyy-MM-dd");
      const reservationDateStr = format(reservationDate, "yyyy-MM-dd");

      return (
        reservation.id === resourceId &&
        reservationDateStr === selectedDateStr &&
        ((startTime >= reservation.startTime && startTime < reservation.endTime) ||
          (endTime > reservation.startTime && endTime <= reservation.endTime) ||
          (startTime <= reservation.startTime && endTime >= reservation.endTime))
      );
    });

    if (isAlreadyBooked) {
      toast({
        title: "Réservation impossible",
        description: "Cette ressource est déjà réservée pour ces horaires.",
        variant: "destructive",
      });
      return;
    }

    const newReservation: Reservation = {
      id: resourceId,
      type: selectedResource?.type || "desk",
      date: new Date(date), // S'assurer que c'est un nouvel objet Date
      startTime,
      endTime,
    };

    setMyReservations((prev) => [...prev, newReservation]);
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
  };

  const handleCancelReservation = (reservation: Reservation) => {
    setMyReservations(
      myReservations.filter(
        (r) =>
          r.id !== reservation.id ||
          r.date.getTime() !== reservation.date.getTime() ||
          r.startTime !== reservation.startTime ||
          r.endTime !== reservation.endTime
      )
    );

    toast({
      title: "Réservation annulée",
      description: `Votre réservation a été annulée.`,
    });
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
                      ? `Bureau ${reservation.id.replace("bureau_flex_", "")}`
                      : reservation.id === "PhoneBox"
                      ? "PhoneBox"
                      : `Salle ${reservation.id.replace("salle_reunion_", "")}`;

                  return (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="font-medium">{resourceName}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(reservation.date), "dd MMMM yyyy", { locale: fr })} de{" "}
                          {reservation.startTime} à {reservation.endTime}
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
