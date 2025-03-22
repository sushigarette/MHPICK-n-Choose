import React from "react";
import PlanSVG from "./PlanSVG";

interface FloorPlanProps {
  desks: { id: string; isBooked: boolean; cx: number; cy: number }[];
  meetingRooms: { id: string; isBooked: boolean; cx: number; cy: number }[];
  onSelect: (id: string, type: "desk" | "room") => void;
}

const FloorPlan: React.FC<FloorPlanProps> = ({ desks, meetingRooms, onSelect }) => {
  return <PlanSVG desks={desks} meetingRooms={meetingRooms} onSelect={onSelect} />;
};

export default FloorPlan;
