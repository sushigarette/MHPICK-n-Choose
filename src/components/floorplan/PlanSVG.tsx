import React from "react";
import { motion } from "framer-motion";

interface PlanSVGProps {
  desks: { id: string; isBooked: boolean }[];
  meetingRooms: { id: string; isBooked: boolean }[];
  onSelect: (id: string, type: "desk" | "room") => void;
}

const PlanSVG: React.FC<PlanSVGProps> = ({ desks, meetingRooms, onSelect }) => {
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
          <motion.ellipse
            id="salle_reunion_1"
            cx="556.05078"
            cy="420.26019"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              meetingRooms.find((r) => r.id === "salle_reunion_1")?.isBooked ? "fill-amber-300" : "fill-yellow-300"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("salle_reunion_1", "room")}
          />
          <motion.ellipse
            id="salle_reunion_2"
            cx="514.56506"
            cy="109.79991"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              meetingRooms.find((r) => r.id === "salle_reunion_2")?.isBooked ? "fill-amber-300" : "fill-yellow-300"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("salle_reunion_2", "room")}
          />
          <motion.ellipse
            id="salle_reunion_3"
            cx="64.481392"
            cy="469.34985"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              meetingRooms.find((r) => r.id === "salle_reunion_3")?.isBooked ? "fill-amber-300" : "fill-yellow-300"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("salle_reunion_3", "room")}
          />

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
          <motion.ellipse
            id="bureau_flex_1"
            cx="662.63544"
            cy="51.184258"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_1")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_1", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_2"
            cx="759.27979"
            cy="49.0289"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_2")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_2", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_3"
            cx="662.27979"
            cy="119.0289"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_3")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_3", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_4"
            cx="758.27979"
            cy="117.0289"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_4")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_4", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_5"
            cx="990.55475"
            cy="242.36128"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_5")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_5", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_6"
            cx="1059.2906"
            cy="242.50903"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_6")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_6", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_7"
            cx="993.07758"
            cy="337.6933"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_7")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_7", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_8"
            cx="988.77075"
            cy="537.70813"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_8")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_8", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_9"
            cx="1058.5291"
            cy="537.5379"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_9")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_9", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_10"
            cx="991.27979"
            cy="631.1781"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_10")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_10", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_11"
            cx="1061.0483"
            cy="631.92444"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_11")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_11", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_12"
            cx="989.45142"
            cy="696.48419"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_12")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_12", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_13"
            cx="1057.8021"
            cy="696.97668"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_13")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_13", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_14"
            cx="991.27979"
            cy="790.43182"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_14")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_14", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_15"
            cx="1060.7499"
            cy="791.67816"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_15")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_15", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_16"
            cx="989.06342"
            cy="893.63336"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_16")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_16", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_17"
            cx="1057.9738"
            cy="893.20056"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_17")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_17", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_18"
            cx="991.52606"
            cy="987.32733"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_18")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_18", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_19"
            cx="1060.3992"
            cy="987.73041"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_19")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_19", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_20"
            cx="743.63818"
            cy="629.99915"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_20")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_20", "desk")}
          />
          <motion.ellipse
            id="bureau_flex_21"
            cx="648.48883"
            cy="632.57367"
            rx="8.2798061"
            ry="8.028903"
            className={`cursor-pointer ${
              desks.find((d) => d.id === "bureau_flex_21")?.isBooked ? "fill-red-500" : "fill-green-500"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect("bureau_flex_21", "desk")}
          />
        </g>
      </svg>
    </div>
  );
};

export default PlanSVG;
