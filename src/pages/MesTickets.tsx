import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Ticket } from "@/interfaces";
import supabase from "@/supabase";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangle, CheckCircle, Clock, MessageSquare } from "lucide-react";

const MesTickets: React.FC = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (currentUser) {
      fetchTickets();
    }
  }, [currentUser, statusFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("tickets")
        .select(`
          *,
          profiles:user_id(display_name, avatar_url),
          admin_profiles:admin_id(display_name, avatar_url),
          resource:resource_id(name, type)
        `)
        .eq("user_id", currentUser?.id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTickets(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des tickets:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos tickets.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "envoyé":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "ouvert":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "traité":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "fermé":
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "envoyé":
        return "bg-blue-100 text-blue-800";
      case "ouvert":
        return "bg-orange-100 text-orange-800";
      case "traité":
        return "bg-green-100 text-green-800";
      case "fermé":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgente":
        return "bg-red-100 text-red-800";
      case "haute":
        return "bg-orange-100 text-orange-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      case "basse":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!currentUser) {
      return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <p>Vous devez être connecté pour voir vos tickets.</p>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen flex grow flex-col bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Mes tickets de support</h1>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="envoyé">Envoyé</SelectItem>
                <SelectItem value="ouvert">Ouvert</SelectItem>
                <SelectItem value="traité">Traité</SelectItem>
                <SelectItem value="fermé">Fermé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : tickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun ticket trouvé
                </h3>
                <p className="text-gray-500 text-center">
                  {statusFilter === "all" 
                    ? "Vous n'avez pas encore créé de ticket de support."
                    : `Aucun ticket avec le statut "${statusFilter}" trouvé.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{ticket.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusIcon(ticket.status)}
                            <span className="ml-1 capitalize">{ticket.status}</span>
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {ticket.resource.name}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>Créé le {format(new Date(ticket.created_at), "dd/MM/yyyy", { locale: fr })}</div>
                        <div>à {format(new Date(ticket.created_at), "HH:mm", { locale: fr })}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Votre message :</h4>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                          {ticket.message}
                        </p>
                      </div>

                      {ticket.admin_response && (
                        <div>
                          <h4 className="font-medium mb-2">
                            Réponse de l'équipe support :
                          </h4>
                          <div className="bg-blue-50 p-3 rounded-md">
                            <p className="text-gray-700 mb-2">{ticket.admin_response}</p>
                            <div className="text-xs text-gray-500">
                              Répondu le {format(new Date(ticket.admin_response_date!), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                              {ticket.admin_profiles && (
                                <span> par {ticket.admin_profiles.display_name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {ticket.status === "envoyé" && (
                        <div className="bg-blue-50 p-3 rounded-md">
                          <p className="text-sm text-blue-700">
                            Votre ticket a été reçu et sera traité dans les plus brefs délais.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MesTickets; 