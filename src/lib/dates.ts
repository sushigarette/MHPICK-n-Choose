import { startOfDay, isBefore, isAfter } from "date-fns";

/**
 * Une date est réservable si :
 * - elle n'est pas dans le passé,
 * - elle est dans les 7 jours ouvrés à venir,
 * - ce n'est ni un samedi ni un dimanche.
 */
export function isDateDisponible(date: Date): boolean {
  const today = startOfDay(new Date());
  const maxDate = new Date(today);
  let added = 0;
  while (added < 7) {
    maxDate.setDate(maxDate.getDate() + 1);
    if (maxDate.getDay() !== 0 && maxDate.getDay() !== 6) {
      added++;
    }
  }
  return (
    !isBefore(startOfDay(date), today) &&
    !isAfter(startOfDay(date), maxDate) &&
    date.getDay() !== 0 &&
    date.getDay() !== 6
  );
}

/**
 * Renvoie la prochaine date réservable dans la direction donnée, ou null
 * si aucune n'est trouvée dans les 31 jours.
 * @param direction -1 pour le passé, +1 pour le futur
 */
export function findAvailableDate(from: Date, direction: 1 | -1): Date | null {
  const candidate = new Date(from);
  for (let essais = 0; essais <= 31; essais++) {
    candidate.setDate(candidate.getDate() + direction);
    if (isDateDisponible(candidate)) return new Date(candidate);
  }
  return null;
}
