import React from "react";
import { format, isToday, isTomorrow } from "date-fns";
import { fr } from "date-fns/locale";
import { Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Props = {
  displayName: string | null;
  resourceName: string;
  occurrences: number;
  /** Jours ouvrés à venir où la place est libre. */
  jours: Date[];
  /** Jour (AAAA-MM-JJ) dont la réservation est en cours, ou null. */
  jourEnCours: string | null;
  onAccept: (jour: Date) => void;
  onRefuse: () => void;
};

/**
 * Les display_name nouvellement créés valent l'adresse email (voir
 * AuthContext.signup) : on n'affiche alors que ce qui précède le @, faute de
 * quoi la salutation se lirait "Salut prenom.nom@mhcomm.fr".
 */
const prenomAffichable = (displayName: string | null): string => {
  if (!displayName) return "";
  const base = displayName.includes("@") ? displayName.split("@")[0] : displayName;
  return base.split(/[.\s_-]/)[0];
};

/** "aujourd'hui", "demain", sinon "lundi 14 septembre". */
const libelleJour = (jour: Date): string => {
  if (isToday(jour)) return "aujourd'hui";
  if (isTomorrow(jour)) return "demain";
  return format(jour, "EEEE d MMMM", { locale: fr });
};

const SuggestionHabitude: React.FC<Props> = ({
  displayName,
  resourceName,
  occurrences,
  jours,
  jourEnCours,
  onAccept,
  onRefuse,
}) => {
  const prenom = prenomAffichable(displayName);
  const enCours = jourEnCours !== null;

  return (
    <Alert className="mt-4 border-primary/40 bg-primary/5">
      <Sparkles className="h-4 w-4 text-primary" />
      <AlertTitle className="text-primary">
        {prenom ? `Salut ${prenom} !` : "Bonjour !"}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-3">
          <p className="text-sm">
            J'ai observé que <span className="font-medium">{resourceName}</span> est dans
            tes habitudes — tu l'as réservé {occurrences} fois. Il est libre
            {jours.length > 1 ? " ces jours-ci" : ""}. Tu veux le réserver ?
          </p>

          <div className="flex flex-col gap-2">
            {jours.map((jour) => {
              const cle = format(jour, "yyyy-MM-dd");
              return (
                <Button
                  key={cle}
                  size="sm"
                  variant="outline"
                  className="justify-start bg-background"
                  disabled={enCours}
                  onClick={() => onAccept(jour)}
                >
                  {jourEnCours === cle ? "Réservation…" : `Réserver ${libelleJour(jour)}`}
                </Button>
              );
            })}
          </div>

          <Button size="sm" variant="ghost" onClick={onRefuse} disabled={enCours}>
            Non merci
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default SuggestionHabitude;
