export type Reservation = {
  id: number;
  user_id: string; // UUID as a string
  resource_id: string; // Resource identifier (e.g., "bureau_flex_3")
  type: "desk" | "room" | "slot" | "baby"; // Type can be 'desk', 'room', 'slot' or 'baby'
  date: string; // ISO date string
  start_time: string; // Time string (HH:mm:ss)
  end_time: string; // Time string (HH:mm:ss)
  created_at: string; // ISO datetime string
  is_test?: boolean; // Flag pour identifier les réservations de test
  profiles: {
    display_name: string;
    avatar_url: string;
  };
};

export type Resource = {
  id: string;
  type: "desk" | "room" | "slot" | "baby";
  name: string;
  capacity: number;
  cx: number;
  cy: number;
  reservations?: Reservation[];
  is_active?: boolean;
  block_reason?: string;
  block_until?: string;
};
