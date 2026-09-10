import { Reservation } from "@/interfaces";

/**
 * Détection du bureau habituel d'un utilisateur.
 *
 * Les seuils ci-dessous ont été calibrés sur les données réelles : sur les
 * utilisateurs ayant au moins 5 réservations de bureau, le favori représente
 * 69 % des réservations en moyenne, et une majorité dépasse 95 %. Les
 * habitudes sont donc franches, ce qui permet de rester sur un favori global
 * plutôt que de découper par jour de la semaine — un tel découpage diviserait
 * l'historique sans rien gagner en précision.
 */

/** Nombre minimum d'occurrences du favori pour oser une suggestion. */
export const MIN_OCCURRENCES = 3;

/** Part minimale du favori dans l'historique, pour écarter les indécis. */
export const MIN_PART = 0.4;

export type Habitude = {
  resourceId: string;
  /** Nombre de fois où ce bureau a été réservé sur la période observée. */
  occurrences: number;
  /** Part de ce bureau dans l'historique, entre 0 et 1. */
  part: number;
};

/**
 * Renvoie le bureau habituel, ou null si l'historique ne permet pas de
 * conclure. Fonction pure : `reservations` est l'historique déjà filtré sur
 * un utilisateur et sur le type voulu.
 */
export function detecterHabitude(reservations: Pick<Reservation, "resource_id">[]): Habitude | null {
  if (reservations.length === 0) return null;

  const comptes = new Map<string, number>();
  for (const { resource_id } of reservations) {
    comptes.set(resource_id, (comptes.get(resource_id) ?? 0) + 1);
  }

  let favori: string | null = null;
  let occurrences = 0;
  for (const [resourceId, n] of comptes) {
    // En cas d'égalité, on garde le premier rencontré : l'historique étant
    // trié du plus récent au plus ancien, c'est le plus récemment utilisé.
    if (n > occurrences) {
      favori = resourceId;
      occurrences = n;
    }
  }
  if (!favori) return null;

  const part = occurrences / reservations.length;
  if (occurrences < MIN_OCCURRENCES || part < MIN_PART) return null;

  return { resourceId: favori, occurrences, part };
}
