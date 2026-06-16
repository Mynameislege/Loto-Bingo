/**
 * campaignStore — progression Campagne persistée côté API
 *
 * Endpoints attendus (apps/api) :
 *   GET  /campaign/me               → { xp, stars, level, palier, gamesPlayed }
 *   POST /campaign/xp               body: { amount, reason }
 *                                   → { xp, stars, level, palier }
 *   POST /campaign/play             body: { result: 'line'|'quine'|'bingo'|'none', ballsDrawn, ... }
 *                                   → { xp, stars, level, palier, xpEarned }
 */
import { create } from 'zustand';

const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type CampaignResult = 'line' | 'quine' | 'bingo' | 'none';

export interface CampaignState {
  xp:          number;
  stars:       number;
  level:       number;
  palier:      string;          // 'village'|'commune'|...
  gamesPlayed: number;
  loading:     boolean;
  error:       string | null;

  // Actions
  loadCampaign: (idToken: string) => Promise<void>;
  recordGame:   (idToken: string, result: CampaignResult, ballsDrawn: number) => Promise<number>; // retourne xpEarned
  reset:        () => void;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  xp:          0,
  stars:       0,
  level:       1,
  palier:      'village',
  gamesPlayed: 0,
  loading:     false,
  error:       null,

  loadCampaign: async (idToken) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/campaign/me`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as {
        xp: number; stars: number; level: number; palier: string; gamesPlayed: number;
      };
      set({
        xp: data.xp ?? 0,
        stars: data.stars ?? 0,
        level: data.level ?? 1,
        palier: data.palier ?? 'village',
        gamesPlayed: data.gamesPlayed ?? 0,
        loading: false,
      });
    } catch (err) {
      // API indisponible → on garde l'état local précédent
      set({ loading: false, error: err instanceof Error ? err.message : String(err) });
    }
  },

  recordGame: async (idToken, result, ballsDrawn) => {
    const { xp, stars } = get();
    try {
      const res = await fetch(`${API}/campaign/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ result, ballsDrawn }),
      });
      if (!res.ok) {
        // Fallback : calcul local
        return localXpCalc(result, ballsDrawn, xp, stars, set);
      }
      const data = await res.json() as {
        xp: number; stars: number; level: number; palier: string; xpEarned: number;
      };
      set({
        xp: data.xp,
        stars: data.stars,
        level: data.level,
        palier: data.palier,
        gamesPlayed: get().gamesPlayed + 1,
      });
      return data.xpEarned ?? 0;
    } catch {
      return localXpCalc(result, ballsDrawn, xp, stars, set);
    }
  },

  reset: () => set({ xp: 0, stars: 0, level: 1, palier: 'village', gamesPlayed: 0, error: null }),
}));

// ── Fallback local (hors-ligne) ──────────────────────────────────────────────
const XP_BALL  = 1;
const XP_LINE  = 15;
const XP_QUINE = 40;
const XP_BINGO = 100;

function localXpCalc(
  result: CampaignResult,
  ballsDrawn: number,
  currentXp: number,
  currentStars: number,
  set: (s: Partial<CampaignState>) => void,
): number {
  const xpBase =
    result === 'bingo' ? XP_BINGO :
    result === 'quine' ? XP_QUINE :
    result === 'line'  ? XP_LINE  : 0;
  const xpBalls = ballsDrawn * XP_BALL;
  const earned  = xpBase + xpBalls;
  // Bonus étoile si bingo en peu de boules
  const newStar = result === 'bingo' && ballsDrawn <= 60 ? 1 : 0;
  set({
    xp:    currentXp + earned,
    stars: currentStars + newStar,
    gamesPlayed: 0, // increment non dispo hors-ligne
  });
  return earned;
}
