/**
 * streakStore — Série journalière pardonnable (v6 §6.1)
 * Règle : si le joueur rate au max 2 jours consécutifs, la série continue.
 * Jalons : 1ère Quine, 10e partie, 7j consécutifs, 1er coupon utilisé, 100e partie,
 *          1re partie Famille, anniversaire app.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Milestone {
  id: string;
  label: string;
  icon: string;
  unlockedAt: string | null; // ISO date
  marcelQuote: string;
}

const MILESTONES_TEMPLATE: Omit<Milestone, 'unlockedAt'>[] = [
  { id: 'first_line',    icon: '📏', label: 'Première Ligne !',              marcelQuote: 'Première ligne — et ça commence bien !' },
  { id: 'first_quine',   icon: '✨', label: 'Première Quine !',              marcelQuote: "Votre toute première Quine ! Ce moment-là, on ne l'oublie pas." },
  { id: 'first_bingo',   icon: '🎉', label: 'Premier BINGO !',               marcelQuote: 'VOTRE TOUT PREMIER BINGO ! Mesdames et messieurs !' },
  { id: 'streak_7',      icon: '🔥', label: '7 jours de suite',              marcelQuote: 'Sept jours de suite — quelle belle fidélité !' },
  { id: 'games_10',      icon: '🎯', label: '10 parties jouées',             marcelQuote: 'Dix parties — vous êtes un vrai habitué !' },
  { id: 'first_coupon',  icon: '🎟', label: 'Premier coupon utilisé',        marcelQuote: 'Premier coupon scanné en boutique — le cercle est bouclé !' },
  { id: 'games_100',     icon: '💯', label: '100 parties jouées',            marcelQuote: "Cent parties ! C'est un centenaire du Loto !" },
  { id: 'first_family',  icon: '👨‍👩‍👧', label: 'Première partie en Famille', marcelQuote: "Jouer en famille — il n'y a rien de plus beau !" },
  { id: 'app_birthday',  icon: '🎂', label: 'Un an avec nous !',             marcelQuote: 'Un an déjà que vous jouez avec nous — merci, et longue vie à notre belle aventure !' },
];

export interface StreakState {
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string | null;  // 'YYYY-MM-DD'
  missedDays: number;             // jours consécutifs sans jouer (reset à 0 quand on joue)
  totalGames: number;
  milestones: Milestone[];

  // Actions
  recordGamePlayed: (opts?: { gotLine?: boolean; gotQuine?: boolean; gotBingo?: boolean; usedCoupon?: boolean; isFamilyGame?: boolean }) => void;
  checkAppBirthday: (installDate: string) => void;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'loto_streak_v1';
const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => {
  const da = new Date(a); const db = new Date(b);
  return Math.round(Math.abs(db.getTime() - da.getTime()) / 86400000);
};

export const useStreakStore = create<StreakState>((set, get) => ({
  currentStreak: 0,
  bestStreak: 0,
  lastPlayedDate: null,
  missedDays: 0,
  totalGames: 0,
  milestones: MILESTONES_TEMPLATE.map(m => ({ ...m, unlockedAt: null })),

  recordGamePlayed: (opts = {}) => {
    const { currentStreak, bestStreak, lastPlayedDate, totalGames, milestones } = get();
    const todayStr = today();
    let newStreak = currentStreak;

    if (lastPlayedDate === null) {
      newStreak = 1;
    } else if (lastPlayedDate === todayStr) {
      // Déjà joué aujourd'hui — pas de changement de streak
    } else {
      const gap = daysBetween(lastPlayedDate, todayStr);
      if (gap === 1) {
        // Jour suivant — continue la série
        newStreak = currentStreak + 1;
      } else if (gap <= 3) {
        // Pardonnable (1-2 jours ratés) — la série CONTINUE sans pénalité (v6 §6.1)
        newStreak = currentStreak + 1;
      } else {
        // Plus de 2 jours manqués — reset
        newStreak = 1;
      }
    }

    const newTotal   = lastPlayedDate !== todayStr ? totalGames + 1 : totalGames;
    const newBest    = Math.max(bestStreak, newStreak);
    const nowISO     = new Date().toISOString();

    // Jalons
    const updated = milestones.map(m => {
      if (m.unlockedAt) return m;
      let unlock = false;
      if (m.id === 'first_line'   && opts.gotLine)        unlock = true;
      if (m.id === 'first_quine'  && opts.gotQuine)       unlock = true;
      if (m.id === 'first_bingo'  && opts.gotBingo)       unlock = true;
      if (m.id === 'first_coupon' && opts.usedCoupon)     unlock = true;
      if (m.id === 'first_family' && opts.isFamilyGame)   unlock = true;
      if (m.id === 'streak_7'     && newStreak >= 7)      unlock = true;
      if (m.id === 'games_10'     && newTotal >= 10)      unlock = true;
      if (m.id === 'games_100'    && newTotal >= 100)     unlock = true;
      return unlock ? { ...m, unlockedAt: nowISO } : m;
    });

    const next = { currentStreak: newStreak, bestStreak: newBest, lastPlayedDate: todayStr, missedDays: 0, totalGames: newTotal, milestones: updated };
    set(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },

  checkAppBirthday: (installDate: string) => {
    const { milestones } = get();
    const days = daysBetween(installDate, today());
    if (days >= 365) {
      const updated = milestones.map(m =>
        m.id === 'app_birthday' && !m.unlockedAt
          ? { ...m, unlockedAt: new Date().toISOString() }
          : m
      );
      set({ milestones: updated });
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), milestones: updated }));
    }
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<StreakState>;
      // Calculer les jours manqués depuis la dernière session
      const lastPlayed = saved.lastPlayedDate ?? null;
      let missedDays = 0;
      if (lastPlayed && lastPlayed !== today()) {
        missedDays = daysBetween(lastPlayed, today()) - 1;
      }
      set({ ...saved, missedDays } as StreakState);
    } catch (_) { /* ignore */ }
  },
}));
