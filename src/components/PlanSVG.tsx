import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Resource, Reservation } from "@/interfaces";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";
import supabase from "@/supabase";

interface PlanSVGProps {
  resources: Resource[];
  onSelect: (resource: Resource) => void;
  onCancelReservation: (reservation: Reservation) => Promise<void>;
  isAdmin: boolean;
}

const PlanSVG: React.FC<PlanSVGProps> = ({ resources, onSelect, onCancelReservation, isAdmin }) => {
  const { currentUser } = useAuth();
  const [isAdminStatus, setIsAdminStatus] = useState(false);

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', currentUser.id)
          .single();
        
        setIsAdminStatus(profile?.is_admin || false);
      }
    };
    checkAdminStatus();
  }, [currentUser]);

  // Filtrer les ressources pour n'afficher que les bureaux et les salles
  const filteredResources = resources.filter(resource => 
    resource.type === "desk" || resource.type === "room"
  );

  const getClassName = (reservations: any[], type: string) => {
    if (reservations?.length) {
      return "fill-red-500"; // Reserved
    }

    // Define different colors for different resource types
    switch (type) {
      case "desk":
        return "fill-green-500";
      case "room":
        return "fill-yellow-500";
      default:
        return "fill-yellow-300";
    }
  };

  const handleCancelReservation = async (reservation: any) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", reservation.id);

      if (error) throw error;
      // Rafraîchir les ressources après l'annulation
      window.location.reload();
    } catch (error) {
      console.error("Error during cancellation:", error);
    }
  };

  return (
    <div 
      className="w-full h-full flex items-center justify-center" 
      style={{ 
        backgroundImage: 'url(/plan.svg)',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '90% 90%',
        minHeight: '800px',
        margin: 'auto'
      }}
    >
      <svg
        viewBox="0 0 1112 1196"
        className="w-[90%] h-[90%]"
        style={{
          minHeight: '800px',
          maxHeight: '90vh'
        }}
      >
        {filteredResources.map((resource) => (
          <Tooltip key={resource.id}>
            <TooltipTrigger asChild>
              <motion.ellipse
                id={resource.id}
                cx={resource.cx}
                cy={resource.cy}
                rx="12"
                ry="12"
                className={`cursor-pointer ${getClassName(resource.reservations, resource.type)}`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(resource)}
              />
            </TooltipTrigger>
            <TooltipContent>
              {resource.reservations && resource.reservations.length > 0 ? (
                <div className="text-center">
                  <img
                    src={resource.reservations[0].profiles?.avatar_url || "/lio2.png"}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover mx-auto mb-1"
                  />
                  <p className="text-xs">
                    {resource.reservations[0].user_id === currentUser?.id
                      ? "Réservé par vous"
                      : `Réservé par ${resource.reservations[0].profiles?.display_name || "un utilisateur"}`}
                  </p>
                  {(resource.reservations[0].user_id === currentUser?.id || isAdmin) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancelReservation(resource.reservations[0]);
                      }}
                      className="text-xs text-red-500 hover:text-red-700 mt-1"
                    >
                      {isAdmin && resource.reservations[0].user_id !== currentUser?.id ? "Annuler (Admin)" : "Annuler"}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs">Cliquez pour réserver</p>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
      </svg>
    </div>
  );
};

export default PlanSVG;
