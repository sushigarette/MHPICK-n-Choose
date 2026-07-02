import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import ReservationModal from "../components/ReservationModal";
import TicketModal from "../components/TicketModal";
import { useToast } from "@/hooks/use-toast";
import { format, startOfDay, isBefore, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import supabase from "@/supabase";
import { useAuth } from "@/context/AuthContext";
import { PostgrestError } from "@supabase/supabase-js";
import PlanSVG from "@/components/PlanSVG";
import { Reservation, Resource } from "@/interfaces";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import SnakeGame from "../components/SnakeGame";
import { getResourceType, getTypeLabel, getReservationName } from "@/lib/resources";
import { isReservationActive, slotsOverlap } from "@/lib/reservations";
import DateNavigator from "@/components/dashboard/DateNavigator";
import ParkingGrid from "@/components/dashboard/ParkingGrid";

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<string>("bureaux");
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [resourceForTicket, setResourceForTicket] = useState<Resource | null>(null);

  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [isShortage, setIsShortage] = useState(false);
  const [shortageDetails, setShortageDetails] = useState<{
    desks: { total: number; available: number };
    parking: { total: number; available: number };
    baby: { total: number; available: number };
  }>({
    desks: { total: 0, available: 0 },
    parking: { total: 0, available: 0 },
    baby: { total: 0, available: 0 }
  });
  const [showSnakeGame, setShowSnakeGame] = useState(false);
  // Incrémenté chaque minute pour libérer automatiquement les créneaux terminés,
  // même si la page reste ouverte (ex : une résa 9h-12h se libère à 12h00).
  const [nowTick, setNowTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setNowTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', currentUser.id)
          .single();
        
        setIsAdmin(profile?.is_admin || false);
      }
    };
    checkAdminStatus();
  }, [currentUser]);

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
        const res = reservations.filter(
          (res) => res.resource_id === resource.id && isReservationActive(res)
        );
        return { ...resource, reservations: res };
      });
      setResources(updatedResources);
    }
  }, [reservations, nowTick]);

  // Vérifier la pénurie de places
  useEffect(() => {
    if (resources.length && reservations.length) {
      const desks = resources.filter(r => r.type === 'desk');
      const parking = resources.filter(r => r.type === 'slot');
      const baby = resources.filter(r => r.type === 'baby');

      const activeReservations = reservations.filter((r) => isReservationActive(r));
      const reservedDesks = activeReservations.filter(r => r.type === 'desk').length;
      const reservedParking = activeReservations.filter(r => r.type === 'slot').length;
      const reservedBaby = activeReservations.filter(r => r.type === 'baby').length;

      const details = {
        desks: { total: desks.length, available: desks.length - reservedDesks },
        parking: { total: parking.length, available: parking.length - reservedParking },
        baby: { total: baby.length, available: baby.length - reservedBaby }
      };

      setShortageDetails(details);

      const isDeskShortage = reservedDesks >= desks.length * 0.7; // 70% des bureaux réservés
      setIsShortage(isDeskShortage);
    }
  }, [resources, reservations, nowTick]);

  // Détecter l'easter egg
  useEffect(() => {
    const checkEasterEgg = () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('easter') === 'lionel') {
        setShowSnakeGame(true);
      }
    };

    checkEasterEgg();
    window.addEventListener('popstate', checkEasterEgg);
    return () => window.removeEventListener('popstate', checkEasterEgg);
  }, []);

  const fetchResources = async (): Promise<void> => {
    const { data: resources, error } = await supabase
      .from("resources")
      .select("*")
      .in("type", ["desk", "room", "baby", "slot"]);

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
      .eq("date", format(selectedDate, "yyyy-MM-dd"));

    if (error) return console.error("Error loading reservations:", error);

    // Mettre à jour les réservations
    setReservations(reservations || []);
    
    // Mettre à jour les ressources avec les réservations (créneaux non terminés)
    if (resources.length) {
      const updatedResources = resources.map((resource) => {
        const res = reservations.filter(
          (res) => res.resource_id === resource.id && isReservationActive(res)
        );
        return { ...resource, reservations: res };
      });
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

  const handleReservation = async (resourceId: string, date: Date, startTime: string = "09:00", endTime: string = "17:00") => {
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

    // L'heure de fin doit être après l'heure de début
    if (endTime <= startTime) {
      toast({
        title: "Réservation impossible",
        description: "L'heure de fin doit être postérieure à l'heure de début.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Déterminer le type de ressource
      const resourceType = getResourceType(resourceId);

      // Vérifier si l'utilisateur a déjà une réservation NON TERMINÉE de ce type ce jour-là.
      // (Une résa dont le créneau est passé ne compte plus : il peut re-réserver.)
      const { data: existingUserReservations, error: userCheckError } = await supabase
        .from("reservations")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("date", format(date, "yyyy-MM-dd"))
        .eq("type", resourceType);

      if (userCheckError) throw userCheckError;

      if ((existingUserReservations ?? []).some((r) => isReservationActive(r))) {
        toast({
          title: "Réservation impossible",
          description: `Vous avez déjà une réservation de ${getTypeLabel(resourceType)} en cours pour cette date.`,
          variant: "destructive",
        });
        return;
      }

      // Vérifier qu'aucune réservation existante de cette ressource ne chevauche le créneau demandé.
      const { data: resourceReservations, error: resourceCheckError } = await supabase
        .from("reservations")
        .select("start_time, end_time")
        .eq("resource_id", resourceId)
        .eq("date", format(date, "yyyy-MM-dd"));

      if (resourceCheckError) throw resourceCheckError;

      const hasConflict = (resourceReservations ?? []).some((r) =>
        slotsOverlap(startTime, endTime, r.start_time, r.end_time)
      );
      if (hasConflict) {
        toast({
          title: "Réservation impossible",
          description: "Cette ressource est déjà réservée sur ce créneau.",
          variant: "destructive",
        });
        return;
      }

      // La vérif ci-dessus laisse une fenêtre de course entre deux utilisateurs :
      // la garantie réelle vient de la contrainte d'exclusion (créneaux non chevauchants)
      // en base — voir les codes 23P01 / 23505 gérés ci-dessous.
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

      if (insertError) {
        // 23P01 = exclusion_violation, 23505 = unique_violation :
        // la ressource vient d'être réservée sur ce créneau par quelqu'un d'autre.
        const code = (insertError as PostgrestError).code;
        if (code === "23P01" || code === "23505") {
          toast({
            title: "Réservation impossible",
            description: "Cette ressource vient d'être réservée sur ce créneau.",
            variant: "destructive",
          });
          fetchReservations();
          return;
        }
        throw insertError;
      }

      fetchReservations();
      setSelectedResource(null);

      const label = getReservationName({ type: resourceType, resource_id: resourceId } as Reservation);
      toast({
        title: "Réservation confirmée",
        description: `Vous avez réservé ${label} pour le ${format(date, "dd MMMM yyyy", { locale: fr })} de ${startTime} à ${endTime}.`,
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

  const handleTTReport = async () => {
    if (!currentUser) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour signaler un TT.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("tt_reports")
        .insert({
          user_id: currentUser.id,
          date: format(selectedDate, "yyyy-MM-dd"),
          reason: "Pénurie de places",
          details: {
            desk_availability: shortageDetails.desks.available,
            parking_availability: shortageDetails.parking.available,
            baby_availability: shortageDetails.baby.available,
            total_reservations: reservations.length
          }
        });

      if (error) throw error;

      toast({
        title: "Signalement enregistré",
        description: "Merci pour votre retour !",
      });
    } catch (error) {
      console.error("Erreur lors du signalement:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer votre signalement.",
        variant: "destructive",
      });
    }
  };


  const handleReportIssue = (resource: Resource) => {
    setResourceForTicket(resource);
    setShowTicketModal(true);
  };

  // Fonction pour créer des réservations de test
  const createTestReservations = async () => {
    if (!isAdmin) return;

    const desks = resources.filter(r => r.type === 'desk');
    
    // Réserver 90% des bureaux
    const numberOfReservations = Math.floor(desks.length * 0.9);
    
    for (let i = 0; i < numberOfReservations; i++) {
      const desk = desks[i];
      if (!desk) continue;

      const { error } = await supabase.from("reservations").insert({
        user_id: currentUser?.id,
        resource_id: desk.id,
        type: "desk",
        date: format(selectedDate, "yyyy-MM-dd"),
        start_time: "09:00",
        end_time: "17:00",
        is_test: true
      });

      if (error) {
        console.error("Erreur lors de la création de la réservation de test:", error);
      }
    }

    // Rafraîchir les réservations
    fetchReservations();
  };

  const deleteTestReservations = async () => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("is_test", true)
        .eq("user_id", currentUser?.id);

      if (error) {
        console.error("Erreur lors de la suppression des réservations de test:", error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer les réservations de test",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Succès",
          description: "Les réservations de test ont été supprimées"
        });
        fetchReservations();
      }
    } catch (error) {
      console.error("Erreur inattendue:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
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
            <DateNavigator selectedDate={selectedDate} onChange={setSelectedDate} />
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
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
                {myReservations.map((reservation, index) => {
                  const resourceName = getReservationName(reservation);

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

          {isShortage && (
            <Alert variant="default" className="mt-4 border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertTitle className="text-yellow-700">Forte affluence prévue</AlertTitle>
              <AlertDescription className="mt-2 text-yellow-600">
                <div className="space-y-2">
                  <p>Disponibilité pour le {format(selectedDate, "dd MMMM yyyy", { locale: fr })} :</p>
                  <ul className="text-sm space-y-1">
                    <li>Bureaux : {shortageDetails.desks.available}/{shortageDetails.desks.total}</li>
                    <li>Parking : {shortageDetails.parking.available}/{shortageDetails.parking.total}</li>
                    <li>Baby : {shortageDetails.baby.available}/{shortageDetails.baby.total}</li>
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={handleTTReport}
                  >
                    Je reste en TT car il n'y a plus de place
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="max-h-full grow flex flex-col bg-card p-6 rounded-lg shadow-md">
          <Tabs defaultValue="bureaux" className="w-fit mb-1 mx-auto" onValueChange={setActiveTab}>
            <TabsList className="flex gap-1 h-6 w-fit">
              <TabsTrigger value="bureaux" className="text-xs py-0 px-1">Bureaux</TabsTrigger>
              <TabsTrigger value="parking" className="text-xs py-0 px-1">Parking</TabsTrigger>
            </TabsList>
          </Tabs>

          {isAdmin && (
            <div className="flex justify-center gap-4 mb-4">
              <Button
                variant="outline"
                onClick={createTestReservations}
                className="min-w-[200px]"
              >
                Simuler une pénurie pour le {format(selectedDate, "dd MMMM yyyy", { locale: fr })}
              </Button>
              <Button
                variant="destructive"
                onClick={deleteTestReservations}
                className="min-w-[200px]"
              >
                Supprimer les réservations de test
              </Button>
            </div>
          )}

          {isAdmin && (
            <div className="flex justify-center gap-4 mb-4">
              <Button
                variant={editMode ? "destructive" : "outline"}
                onClick={() => {
                  setEditMode((v) => !v);
                  setAddMode(false);
                }}
                className="min-w-[200px]"
              >
                {editMode ? "Quitter le mode édition" : "Modifier la position des boutons"}
              </Button>
              <Button
                variant={addMode ? "destructive" : "outline"}
                onClick={() => {
                  setAddMode((v) => !v);
                  setEditMode(false);
                }}
                className="min-w-[200px]"
              >
                {addMode ? "Quitter le mode ajout" : "Ajouter un bureau"}
              </Button>
            </div>
          )}

          <div className="max-h-full grow flex align-center justify-center">
            <div className="max-h-full md:grow-0 grow shadow-md">
              {activeTab === "bureaux" ? (
                <PlanSVG
                  resources={resources}
                  onSelect={(resource) => setSelectedResource(resource)}
                  isAdmin={isAdmin}
                  editMode={editMode}
                  addMode={addMode}
                  onUpdateResourcePosition={async (id, cx, cy) => {
                    await supabase.from("resources").update({ cx, cy }).eq("id", id);
                    await fetchResources();
                    toast({ title: "Position enregistrée !" });
                  }}
                  onAddResource={async (cx, cy) => {
                    try {
                      const newDeskNumber = resources.filter(r => r.type === 'desk').length + 1;
                      const newResource = {
                        id: `bureau_flex_${newDeskNumber}`,
                        type: "desk",
                        name: `Bureau ${newDeskNumber}`,
                        cx: Math.round(cx),
                        cy: Math.round(cy),
                        is_active: true
                      };
                      
                      console.log('Tentative d\'ajout du bureau:', newResource);
                      
                      const { data, error } = await supabase
                        .from("resources")
                        .insert(newResource)
                        .select()
                        .single();

                      if (error) {
                        console.error('Erreur Supabase:', error);
                        toast({
                          title: "Erreur",
                          description: `Impossible d'ajouter le bureau: ${error.message}`,
                          variant: "destructive"
                        });
                      } else {
                        console.log('Bureau ajouté avec succès:', data);
                        setResources(prevResources => [...prevResources, data]);
                        toast({ title: "Bureau ajouté !" });
                      }
                    } catch (err) {
                      console.error('Erreur inattendue:', err);
                      toast({
                        title: "Erreur",
                        description: "Une erreur inattendue s'est produite",
                        variant: "destructive"
                      });
                    }
                  }}
                  onDeleteResource={async (id) => {
                    try {
                      const { error } = await supabase
                        .from("resources")
                        .delete()
                        .eq("id", id);

                      if (error) {
                        console.error('Erreur Supabase:', error);
                        toast({
                          title: "Erreur",
                          description: `Impossible de supprimer le bureau: ${error.message}`,
                          variant: "destructive"
                        });
                      } else {
                        setResources(prevResources => prevResources.filter(r => r.id !== id));
                        toast({ title: "Bureau supprimé !" });
                      }
                    } catch (err) {
                      console.error('Erreur inattendue:', err);
                      toast({
                        title: "Erreur",
                        description: "Une erreur inattendue s'est produite",
                        variant: "destructive"
                      });
                    }
                  }}
                />
              ) : activeTab === "parking" ? (
                <ParkingGrid
                  resources={resources}
                  reservations={reservations}
                  selectedDate={selectedDate}
                  currentUserId={currentUser?.id}
                  isAdmin={isAdmin}
                  onReserve={handleReservation}
                  onCancel={handleCancelReservation}
                />
              ) : null}
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
          onCancelReservation={handleCancelReservation}
          onReportIssue={handleReportIssue}
        />
      )}


      {resourceForTicket && (
        <TicketModal
          isOpen={showTicketModal}
          onClose={() => {
            setShowTicketModal(false);
            setResourceForTicket(null);
          }}
          resource={resourceForTicket}
          onTicketCreated={() => {
            // Optionnel : rafraîchir les données si nécessaire
          }}
        />
      )}

      <SnakeGame
        isOpen={showSnakeGame}
        onClose={() => setShowSnakeGame(false)}
      />
    </div>
  );
};

export default Dashboard;