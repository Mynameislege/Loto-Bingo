import { create } from 'zustand';
import { CardSchema } from '@loto-seniors/shared';
import { api } from '../services/api';

interface CheckResult {
  line: boolean;
  quine: boolean;
  bingo: boolean;
}

interface GameState {
  sessionId: string | null;
  card: CardSchema | null;
  ballsDrawn: number[];
  checkResult: CheckResult;
  couponAwarded: boolean;
  gameOver: boolean;
  isLoading: boolean;

  startDailyGame: () => Promise<void>;
  drawBall: () => Promise<void>;
  reset: () => void;
}

const initialCheckResult: CheckResult = { line: false, quine: false, bingo: false };

export const useGameStore = create<GameState>((set, get) => ({
  sessionId: null,
  card: null,
  ballsDrawn: [],
  checkResult: initialCheckResult,
  couponAwarded: false,
  gameOver: false,
  isLoading: false,

  startDailyGame: async () => {
    set({ isLoading: true });
    try {
      const res = await api.post<{
        sessionId: string;
        card: CardSchema;
        ballsDrawn?: number[];
        checkResult?: CheckResult;
        gameOver?: boolean;
        resumed?: boolean;
      }>('/game/daily/start', {});
      set({
        sessionId: res.sessionId,
        card: res.card,
        // Si reprise de partie, restaurer l'état complet de la session
        ballsDrawn: res.ballsDrawn ?? [],
        checkResult: res.checkResult ?? initialCheckResult,
        gameOver: res.gameOver ?? false,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  drawBall: async () => {
    const { sessionId, isLoading, gameOver } = get();
    if (!sessionId || isLoading || gameOver) return;
    set({ isLoading: true });
    try {
      const res = await api.post<{
        ball: number;
        ballsDrawnCount: number;
        checkResult: CheckResult;
        couponAwarded: boolean;
        gameOver: boolean;
      }>(`/game/daily/${sessionId}/draw`, {});

      set((s) => ({
        ballsDrawn: [...s.ballsDrawn, res.ball],
        checkResult: res.checkResult,
        couponAwarded: res.couponAwarded,
        gameOver: res.gameOver,
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => set({
    sessionId: null, card: null, ballsDrawn: [],
    checkResult: initialCheckResult, couponAwarded: false, gameOver: false,
  }),
}));
