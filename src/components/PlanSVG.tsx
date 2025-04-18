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

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        version="1.1"
        id="svg1"
        className="w-full h-full"
        viewBox="0 0 1112 1196"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        <defs id="defs1" />
        <g id="g1">
          {/* Image de base du plan */}
          <image width="1112" height="1196" preserveAspectRatio="xMidYMid meet" xlinkHref="/plan.svg" id="image1" />

          {/* Salles de réunion */}
          {resources.map((resource) => (
            <Tooltip key={resource.id}>
              <TooltipTrigger asChild>
                <motion.ellipse
                  id={resource.id}
                  cx={resource.cx}
                  cy={resource.cy}
                  rx="8"
                  ry="8"
                  className={`cursor-pointer ${getClassName(resource.reservations, resource.type)}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelect(resource)}
                />
              </TooltipTrigger>
              {resource.reservations?.length > 0 && (
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
        </g>
      </svg>
    </div>
  );
};

export default PlanSVG;
