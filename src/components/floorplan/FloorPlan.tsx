import React from 'react';
import PlanSVG from './PlanSVG';

interface FloorPlanProps {
  desks: { id: string; isBooked: boolean }[];
  meetingRooms: { id: string; isBooked: boolean }[];
  onSelect: (id: string, type: 'desk' | 'room') => void;
}

const FloorPlan: React.FC<FloorPlanProps> = ({ desks, meetingRooms, onSelect }) => {
  return (
    <div className="relative w-full h-full">
      <div className="w-[1200px] h-[1200px] mx-auto">
        <PlanSVG 
          desks={desks}
          meetingRooms={meetingRooms}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
};

export default FloorPlan;
