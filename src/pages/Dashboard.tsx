import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import ReservationModal from "../components/ReservationModal";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfDay, isBefore, isToday, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState<string>("bureaux");
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
    }
  }, [reservations]);

  const fetchResources = async (): Promise<void> => {
    const { data: resources, error } = await supabase
      .from("resources")
      .select("*")
      .in("type", ["desk", "room"]);
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
      data: Reservation[] | null;
      error: PostgrestError | null;
    } = await supabase
      .from("reservations")
      .select("*, profiles:user_id(*)")
      .filter("date", "eq", format(selectedDate, "yyyy-MM-dd"));

    if (error) return console.error("Error loading reservations:", error);

    // Mettre à jour les réservations
    setReservations(reservations || []);
    
    // Mettre à jour les ressources avec les réservations
    if (resources.length) {
      const updatedResources = resources.map((resource) => ({
        ...resource,
        reservations: (reservations || []).filter((res) => res.resource_id === resource.id)
      }));
      setResources(updatedResources);
    }

    // Récupérer toutes les réservations de l'utilisateur
    const { data: allUserReservations, error: userReservationsError } = await supabase
      .from("reservations")
      .select("*, profiles:user_id(*)")
      .eq("user_id", currentUser?.id)
      .gte("date", format(selectedDate, "yyyy-MM-dd"));

    if (userReservationsError) {
      console.error("Error loading user reservations:", userReservationsError);
      return;
    }

    // Mettre à jour mes réservations
    setMyReservations(allUserReservations || []);
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

    // Vérifier si l'heure de fin est valide
    const now = new Date();
    const reservationDate = new Date(date);
    
    // Si la date est dans le passé
    if (isBefore(startOfDay(reservationDate), startOfDay(now))) {
      toast({
        title: "Réservation impossible",
        description: "Vous ne pouvez pas réserver pour une date passée.",
        variant: "destructive",
      });
      return;
    }

    // Si c'est aujourd'hui, vérifier l'heure de fin
    if (isToday(reservationDate)) {
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      const endReservationTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        endHours,
        endMinutes
      );

      if (isBefore(endReservationTime, now)) {
        toast({
          title: "Réservation impossible",
          description: "L'heure de fin de la réservation est déjà passée.",
          variant: "destructive",
        });
        return;
      }
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

      // Déterminer le type de ressource
      const resourceType = resourceId.startsWith("place_") ? "slot" : 
                         resourceId.startsWith("bureau_flex_") ? "desk" : 
                         resourceId.startsWith("salle_reunion_") ? "room" : "desk";

      // Step 2: Insert the reservation
      const { error: insertError } = await supabase.from("reservations").insert([
        {
          user_id: currentUser.id,
          resource_id: resourceId,
          type: resourceType,
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
          resourceType === "desk" ? "le bureau" : 
          resourceType === "slot" ? "la place de parking" : 
          "la salle"
        } ${resourceId.replace(
          resourceType === "desk" ? "bureau_flex_" : 
          resourceType === "slot" ? "place_" : 
          "salle_reunion_", 
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
    <div className="h-full flex flex-col grow gap-2 bg-background">
      <Header />
      <div className="flex flex-col md:flex-row grow gap-2">
        <div className="flex gap-4 flex-col bg-card p-6 rounded-lg shadow-md md:max-w-md w-full">
          <h2 className="font-semibold">Visualisation pour le</h2>
          <div className="flex flex-col gap-4">
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
                  let resourceName = "";
                  if (reservation.type === "desk") {
                    resourceName = `Bureau ${reservation.resource_id.replace("bureau_flex_", "")}`;
                  } else if (reservation.type === "slot") {
                    resourceName = `Place de parking ${reservation.resource_id.replace("place_", "")}`;
                  } else if (reservation.resource_id === "PhoneBox") {
                    resourceName = "PhoneBox";
                  } else {
                    resourceName = `Salle ${reservation.resource_id.replace("salle_reunion_", "")}`;
                  }

                  return (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-md">
                      <div>
                        <p className="font-medium">{resourceName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(reservation.date), "dd MMMM yyyy", { locale: fr })} de{" "}
                          {reservation.start_time} à {reservation.end_time}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancelReservation(reservation)}
                        className="bg-destructive text-destructive-foreground px-3 py-1 rounded-md text-sm hover:bg-destructive/90 transition-colors"
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

        <div className="max-h-full grow flex flex-col bg-card p-6 rounded-lg shadow-md">
          <Tabs defaultValue="bureaux" className="w-fit mb-1 mx-auto" onValueChange={setActiveTab}>
            <TabsList className="flex gap-1 h-6 w-fit">
              <TabsTrigger value="bureaux" className="text-xs py-0 px-1">Bureaux</TabsTrigger>
              <TabsTrigger value="parking" className="text-xs py-0 px-1">Parking</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="max-h-full grow flex align-center justify-center">
            <div className="max-h-full md:grow-0 grow shadow-md">
              {activeTab === "bureaux" ? (
                <PlanSVG resources={resources} onSelect={(resource) => setSelectedResource(resource)} />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full justify-items-center items-center min-h-[calc(100vh-200px)] py-8">
                  {Array.from({ length: 12 }, (_, i) => {
                    const spotId = `place_${i + 1}`;
                    const spotReservation = reservations.find(r => 
                      r.resource_id === spotId && 
                      r.date === format(selectedDate, "yyyy-MM-dd")
                    );
                    const isMyReservation = spotReservation?.user_id === currentUser?.id;

                    return (
                      <div
                        key={spotId}
                        className={`p-6 rounded-lg text-center h-[220px] w-[220px] flex flex-col justify-between items-center ${
                          spotReservation
                            ? "bg-destructive/10 text-destructive"
                            : "bg-green-500/10 text-green-500"
                        }`}
                      >
                        <p className="font-medium text-xl mt-4">Place {i + 1}</p>
                        {spotReservation ? (
                          <div className="mb-4 flex flex-col items-center justify-center gap-2 w-full">
                            <img
                              src={spotReservation.profiles?.avatar_url || "/lio2.png"}
                              alt="Profile"
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                            <p className="text-sm text-center break-words w-full">
                              {isMyReservation ? "Réservée par vous" : `Réservée par ${spotReservation.profiles?.display_name || "un utilisateur"}`}
                            </p>
                            {isMyReservation && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancelReservation(spotReservation)}
                              >
                                Annuler
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleReservation(spotId, selectedDate, "00:00", "23:59")}
                            className="mb-4"
                          >
                            Réserver
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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