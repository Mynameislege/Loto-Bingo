/**
 * useVoiceChat — Hook Agora RTC pour la Salle Famille
 * 
 * Prérequis : react-native-agora (module natif)
 *   → pnpm add react-native-agora  (dans apps/mobile)
 *   → Rebuild avec EAS Build (pas compatible Expo Go)
 *   → Clé EXPO_PUBLIC_AGORA_APP_ID dans .env
 *
 * En attendant : available=false, UI affiche "bientôt disponible".
 */
import { useState, useCallback } from 'react';

// TODO: activer après EAS Build
// import RtcEngine from 'react-native-agora';
const RtcEngine = null;
const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID ?? '';

export interface VoiceChatState {
  available:   boolean;
  joined:      boolean;
  muted:       boolean;
  peers:       number[];
  speakingUid: number | null;
  join:        () => Promise<void>;
  leave:       () => Promise<void>;
  toggleMute:  () => void;
}

export function useVoiceChat(
  _channelName: string | null,
  _uid: number = 0,
  _token: string | null = null,
): VoiceChatState {
  const [joined,      setJoined]      = useState(false);
  const [muted,       setMuted]       = useState(false);
  const [peers]                       = useState<number[]>([]);
  const [speakingUid]                 = useState<number | null>(null);

  const join  = useCallback(async () => { /* Agora non disponible */ }, []);
  const leave = useCallback(async () => { setJoined(false); }, []);
  const toggleMute = useCallback(() => { setMuted(m => !m); }, []);

  return {
    available: false, // true après EAS Build + react-native-agora
    joined, muted, peers, speakingUid,
    join, leave, toggleMute,
  };
}

export function firebaseUidToAgoraUid(uid: string): number {
  let h = 5381;
  for (let i = 0; i < uid.length; i++) {
    h = ((h << 5) + h) ^ uid.charCodeAt(i);
  }
  return Math.abs(h) % 0xFFFFFFF;
}
