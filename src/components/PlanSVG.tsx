import React from "react";
import { motion } from "framer-motion";
import { Resource } from "@/interfaces";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PlanSVGProps {
  resources: Resource[];
  onSelect: (resource: Resource) => void;
}

const PlanSVG: React.FC<PlanSVGProps> = ({ resources, onSelect }) => {
  // Filtrer les ressources pour n'afficher que les bureaux et les salles
  const filteredResources = resources.filter(resource => 
    resource.type === "desk" || resource.type === "room"
  );

  const getClassName = (reservations: any[], type: string, isActive: boolean) => {
    if (!isActive) {
      return "fill-destructive/40 cursor-pointer"; // Désactivé mais cliquable
    }
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
                className={`${getClassName(resource.reservations, resource.type, resource.is_active ?? true)}`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(resource)}
              />
            </TooltipTrigger>
            {!resource.is_active ? (
              <TooltipContent>
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-destructive">Ressource désactivée</p>
                  {resource.block_reason && (
                    <p className="text-sm">Raison : {resource.block_reason}</p>
                  )}
                  {resource.block_until && (
                    <p className="text-sm">Jusqu'au : {format(new Date(resource.block_until), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}</p>
                  )}
                </div>
              </TooltipContent>
            ) : resource.reservations?.length > 0 && (
              <TooltipContent>
                <div className="flex flex-col gap-1">
                  <p className="font-medium">{resource.reservations[0].profiles.display_name}</p>
                  <p className="text-sm">
                    {format(new Date(resource.reservations[0].date), "dd MMMM yyyy", { locale: fr })}
                  </p>
                  <p className="text-sm">
                    De {resource.reservations[0].start_time} à {resource.reservations[0].end_time}
                  </p>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </svg>
    </div>
  );
};

export default PlanSVG;
