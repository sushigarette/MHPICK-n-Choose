import React from "react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface DeskProps {
  id: string;
  cx: number;
  cy: number;
  isBooked: boolean;
  onSelect: (id: string, type: "desk" | "room") => void;
}

const Desk: React.FC<DeskProps> = ({ id, cx, cy, isBooked, onSelect }) => (
  <motion.ellipse
    id={id}
    cx={cx}
    cy={cy}
    rx="8"
    ry="8"
    className={`cursor-pointer ${isBooked ? "fill-red-500" : "fill-green-500"}`}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => onSelect(id, "desk")}
  />
);

interface MeetingRoomProps {
  id: string;
  cx: number;
  cy: number;
  isBooked: boolean;
  onSelect: (id: string, type: "desk" | "room") => void;
}

const MeetingRoom: React.FC<MeetingRoomProps> = ({ id, cx, cy, isBooked, onSelect }) => (
  <motion.ellipse
    id={id}
    cx={cx}
    cy={cy}
    rx="8"
    ry="8"
    className={`cursor-pointer ${isBooked ? "fill-red-500" : "fill-yellow-300"}`}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => onSelect(id, "room")}
  />
);

interface PlanSVGProps {
  desks: { id: string; isBooked: boolean; cx: number; cy: number }[];
  meetingRooms: { id: string; isBooked: boolean; cx: number; cy: number }[];
  onSelect: (id: string, type: "desk" | "room") => void;
}

const PlanSVG: React.FC<PlanSVGProps> = ({ desks, meetingRooms, onSelect }) => {
  console.log(meetingRooms);
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
          {meetingRooms.map((room) => (
            <MeetingRoom
              key={room.id}
              id={room.id}
              cx={room.cx}
              cy={room.cy}
              isBooked={room.isBooked}
              onSelect={onSelect}
            />
          ))}

          {/* Phone Box */}
          <motion.circle
            id="PhoneBox"
            cx="754.7262"
            cy="394.64691"
            r="10.08222"
            className="cursor-pointer fill-blue-500"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("PhoneBox", "room")}
          />

          {/* Bureaux flexibles */}
          {desks.map((desk) => (
            <Desk key={desk.id} id={desk.id} cx={desk.cx} cy={desk.cy} isBooked={desk.isBooked} onSelect={onSelect} />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default PlanSVG;
