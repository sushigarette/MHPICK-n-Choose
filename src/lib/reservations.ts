import { Reservation } from "@/interfaces";

/** Convertit "HH:mm" ou "HH:mm:ss" en minutes depuis minuit. */
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

/**
 * Heure (en minutes) à partir de laquelle une réservation est considérée
 * comme allant "jusqu'à la fin de journée" : elle reste alors affichée toute
 * la journée, même une fois l'heure de fin passée. Seules les réservations plus
 * courtes (qui se terminent avant 17h) libèrent la place à leur heure de fin.
 */
const FULL_DAY_END_MINUTES = 17 * 60; // 17:00

/**
 * Une réservation est "terminée" (et libère la place) uniquement si :
 * - elle se termine AVANT la fin de journée (17h) — une résa jusqu'à 17h/18h
 *   reste affichée toute la journée ; et
 * - sa date + heure de fin est déjà passée.
 * (Pour une date future, elle n'est jamais terminée.)
 */
export function isReservationFinished(
  reservation: Pick<Reservation, "date" | "end_time">,
  now: Date = new Date()
): boolean {
  // Réservation "de fin de journée" (17h ou plus) : on la garde affichée.
  if (toMinutes(reservation.end_time) >= FULL_DAY_END_MINUTES) return false;

  const [h, m, s] = reservation.end_time.split(":").map(Number);
  const end = new Date(`${reservation.date}T00:00:00`);
  end.setHours(h, m || 0, s || 0, 0);
  return end.getTime() <= now.getTime();
}

/** Inverse pratique : la réservation occupe-t-elle encore la ressource ? */
export function isReservationActive(
  reservation: Pick<Reservation, "date" | "end_time">,
  now: Date = new Date()
): boolean {
  return !isReservationFinished(reservation, now);
}

/**
 * Deux créneaux [start, end) le même jour se chevauchent-ils ?
 * Les créneaux jointifs (12h-fin / 12h-début) ne se chevauchent pas.
 */
export function slotsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}
