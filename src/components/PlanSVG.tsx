import React, { useState } from "react";
import { motion } from "framer-motion";
import { Resource } from "@/interfaces";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PlanSVGProps {
  resources: Resource[];
  onSelect: (resource: Resource) => void;
  isAdmin: boolean;
  editMode: boolean;
  addMode: boolean;
  onUpdateResourcePosition: (id: string, cx: number, cy: number) => Promise<void>;
  onAddResource: (cx: number, cy: number) => Promise<void>;
  onDeleteResource: (id: string) => Promise<void>;
}

const PlanSVG: React.FC<PlanSVGProps> = ({
  resources,
  onSelect,
  isAdmin,
  editMode,
  addMode,
  onUpdateResourcePosition,
  onAddResource,
  onDeleteResource,
}) => {
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

  const [draggedResource, setDraggedResource] = useState<Resource | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent, resource: Resource) => {
    if (!isAdmin || !editMode) return;

    const svg = e.currentTarget.closest("svg");
    if (!svg) return;

    const svgRect = svg.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;

    setDraggedResource(resource);
    setDragOffset({
      x: x - resource.cx,
      y: y - resource.cy,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedResource || !editMode) return;

    const svg = e.currentTarget.closest("svg");
    if (!svg) return;

    const svgRect = svg.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;

    const newCx = x - dragOffset.x;
    const newCy = y - dragOffset.y;

    onUpdateResourcePosition(draggedResource.id, newCx, newCy);
  };

  const handleMouseUp = () => {
    setDraggedResource(null);
  };

  const handleSvgClick = (e: React.MouseEvent) => {
    if (!isAdmin || !addMode) return;

    const svg = e.currentTarget;
    const svgRect = svg.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;

    onAddResource(x, y);
  };

  return (
    <div 
      className="w-full h-full flex items-center justify-center overflow-hidden" 
      style={{ 
        backgroundImage: 'url(/plan1.svg)',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
        height: 'calc(100vh - 64px)',
        width: '100%',
        margin: '0',
        padding: '0'
      }}
    >
      <svg
        viewBox="0 0 1112 1196"
        className="w-full h-full"
        style={{
          maxHeight: '100%',
          maxWidth: '100%'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleSvgClick}
      >
        {filteredResources.map((resource) => {
          const isReserved = resource.reservations?.length > 0;
          const isDragging = draggedResource?.id === resource.id;

          // Affichage de l'avatar si réservé
          return (
            <Tooltip key={resource.id}>
              <TooltipTrigger asChild>
                <g
                  onMouseDown={(e) => handleMouseDown(e, resource)}
                  style={{ cursor: isAdmin && editMode ? "move" : "pointer" }}
                >
                  {isReserved && resource.type === "desk" && resource.reservations[0]?.profiles?.avatar_url ? (
                    <image
                      href={resource.reservations[0].profiles.avatar_url}
                      x={resource.cx - 32}
                      y={resource.cy - 32}
                      width="64"
                      height="64"
                      clipPath="circle(32px at 32px 32px)"
                      onClick={() => onSelect(resource)}
                    />
                  ) : (
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
                  )}
                  {isDragging && (
                    <text
                      x={resource.cx + 20}
                      y={resource.cy}
                      fontSize="16"
                      fill="#333"
                    >
                      Glisse pour déplacer
                    </text>
                  )}
                  {isAdmin && editMode && (
                    <g
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteResource(resource.id);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <circle
                        cx={resource.cx + 20}
                        cy={resource.cy - 20}
                        r="8"
                        fill="red"
                        opacity="0.8"
                      />
                      <text
                        x={resource.cx + 20}
                        y={resource.cy - 20}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="12"
                        fontWeight="bold"
                      >
                        ×
                      </text>
                    </g>
                  )}
                </g>
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
          );
        })}

        {/* Instructions pour le mode ajout */}
        {isAdmin && addMode && (
          <text
            x="556"
            y="598"
            textAnchor="middle"
            fill="#666"
            fontSize="16"
          >
            Cliquez sur le plan pour ajouter un nouveau bureau
          </text>
        )}
      </svg>
    </div>
  );
};

export default PlanSVG;