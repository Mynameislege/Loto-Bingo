export type PhraseCategory =
  | 'number_call'    // Appel d'un numéro spécifique
  | 'tension'        // Joueur proche d'une Ligne/Quine/Bingo
  | 'celebration'    // Ligne / Quine / Bingo validés
  | 'filler'         // Entre les boules
  | 'personal'       // Personnalisé selon le profil joueur
  | 'seasonal'       // Événement saisonnier
  | 'end_no_win'     // Fin de partie sans victoire
  | 'opening'        // Ouverture de la partie
  | 'closing';       // Fermeture de la partie

export type TensionLevel = 'line' | 'quine' | 'bingo';
export type CelebrationEvent = 'line' | 'quine' | 'bingo' | 'bingo_daily';

export interface Phrase {
  id: string;
  category: PhraseCategory;
  text: string;
  /** For number_call: which number this phrase is for (1-90) */
  number?: number;
  /** For tension: which level */
  tensionLevel?: TensionLevel;
  /** For celebration: which event */
  celebrationEvent?: CelebrationEvent;
  /** For seasonal: which event key */
  seasonalEvent?: string;
  /** For personal: which trigger */
  personalTrigger?: string;
  /** Variant index (1, 2 or 3) — allows selecting different variants of same context */
  variant?: number;
}

export interface HostContent {
  version: string;
  phrases: Phrase[];
}
