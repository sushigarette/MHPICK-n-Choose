import { Reservation, Resource } from "@/interfaces";

export type ResourceType = "desk" | "room" | "slot" | "baby";

// Prefixe d'id -> type de ressource
const PREFIX_TO_TYPE: { prefix: string; type: ResourceType }[] = [
  { prefix: "place_baby_", type: "baby" },
  { prefix: "place_", type: "slot" },
  { prefix: "bureau_flex_", type: "desk" },
  { prefix: "salle_reunion_", type: "room" },
];

/** Déduit le type d'une ressource à partir de son id. */
export const getResourceType = (resourceId: string): ResourceType => {
  const match = PREFIX_TO_TYPE.find((p) => resourceId.startsWith(p.prefix));
  return match?.type ?? "desk";
};

const TYPE_LABEL: Record<ResourceType, string> = {
  desk: "bureau",
  slot: "parking",
  baby: "place baby",
  room: "salle",
};

/** Libellé lisible d'un type (ex: "bureau"). */
export const getTypeLabel = (type: ResourceType): string => TYPE_LABEL[type];

/** Nom affichable d'une réservation (ex: "Bureau 3", "Place de parking 2"). */
export const getReservationName = (reservation: Reservation): string => {
  const { type, resource_id } = reservation;
  if (resource_id === "PhoneBox") return "PhoneBox";
  switch (type) {
    case "desk":
      return `Bureau ${resource_id.replace("bureau_flex_", "")}`;
    case "slot":
      return `Place de parking ${resource_id.replace("place_", "")}`;
    case "baby":
      return `Place baby ${resource_id.replace("place_baby_", "")}`;
    default:
      return `Salle ${resource_id.replace("salle_reunion_", "")}`;
  }
};

export const filterByType = (resources: Resource[], type: ResourceType) =>
  resources.filter((r) => r.type === type);

/**
 * Une ressource est "bloquée" si elle a été désactivée (is_active === false),
 * SAUF si une date de fin de blocage (block_until) a été définie et est déjà
 * passée : dans ce cas le blocage est expiré et la ressource redevient
 * disponible automatiquement. Un blocage sans date de fin reste permanent
 * jusqu'à réactivation manuelle.
 */
export function isResourceBlocked(
  resource: Pick<Resource, "is_active" | "block_until">,
  now: Date = new Date()
): boolean {
  if (resource.is_active !== false) return false;
  if (resource.block_until && new Date(resource.block_until).getTime() <= now.getTime()) {
    return false; // blocage expiré
  }
  return true;
}

/** Inverse pratique : la ressource est-elle disponible ? */
export function isResourceActive(
  resource: Pick<Resource, "is_active" | "block_until">,
  now: Date = new Date()
): boolean {
  return !isResourceBlocked(resource, now);
}
