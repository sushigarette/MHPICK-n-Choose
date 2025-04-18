export type Reservation = {
  id: number;
  user_id: string; // UUID as a string
  resource_id: string; // Resource identifier (e.g., "bureau_flex_3")
  type: "desk" | "room" | "slot"; // Type can be 'desk', 'room' or 'slot'
  date: string; // ISO date string
  start_time: string; // Time string (HH:mm:ss)
  end_time: string; // Time string (HH:mm:ss)
  created_at: string; // ISO datetime string
  profiles: {
    display_name: string;
    avatar_url: string;
  };
};

export type Resource = {
  id: string;
  type: "desk" | "room" | "slot";
  name: string;
  capacity: number;
  cx: number;
  cy: number;
  reservations?: Reservation[];
};
