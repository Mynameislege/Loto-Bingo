/**
 * useVoiceChat — Hook Agora RTC pour la Salle Famille
 * 
 * Prérequis : react-native-agora (module natif)
 *   → pnpm add react-native-agora  (dans apps/mobile)
 *   → Rebuild avec expo-dev-client ou EAS Build
 *   → Clé EXPO_PUBLIC_AGORA_APP_ID dans .env
 *
 * Dégradation gracieuse : si le module natif est absent
 * (Expo Go), le hook retourne available=false et le UI
 * affiche un badge "bientôt disponible".
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';

// Import conditionnel — évite le crash sous Expo Go
let RtcEngine: {
  create: (appId: string) => Promise<any>;
} | null = null;

let ChannelMediaOptions: unknown = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const agora = require('react-native-agora') as {
    default: typeof RtcEngine;
    ChannelMediaOptions: unknown;
  };
  RtcEngine = agora.default;
  ChannelMediaOptions = agora.ChannelMediaOptions;
} catch {
  // Module natif absent → dégradation silencieuse
}

const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID ?? '';

export interface VoiceChatState {
  available:   boolean;   // false = module natif absent (Expo Go)
  joined:      boolean;
  muted:       boolean;
  peers:       number[];  // UIDs des autres participants
  speakingUid: number | null;
  join:        () => Promise<void>;
  leave:       () => Promise<void>;
  toggleMute:  () => void;
}

/**
 * @param channelName  Code de la salle (ex: "ABCD42").
 *                     Passer null désactive le hook.
 * @param uid          UID local (hash numérique de l'user).
 * @param token        Token Agora fourni par le backend
 *                     (GET /agora/token?channel=XXXX)
 */
export function useVoiceChat(
  channelName: string | null,
  uid: number = 0,
  token: string | null = null,
): VoiceChatState {
  const [joined,      setJoined]      = useState(false);
  const [muted,       setMuted]       = useState(false);
  const [peers,       setPeers]       = useState<number[]>([]);
  const [speakingUid, setSpeakingUid] = useState<number | null>(null);
  const engineRef = useRef<any>(null);

  // Initialisation moteur Agora
  useEffect(() => {
    if (!RtcEngine || !channelName || !AGORA_APP_ID) return;

    let engine: any = null;
    (async () => {
      try {
        engine = await (RtcEngine as any).create(AGORA_APP_ID);
        engineRef.current = engine;

        // Voix uniquement
        await engine.enableAudio();
        await engine.disableVideo();
        await engine.setClientRole(1); // Broadcaster

        // Événements
        engine.addListener('UserJoined', (remoteUid: number) => {
          setPeers(prev => prev.includes(remoteUid) ? prev : [...prev, remoteUid]);
        });
        engine.addListener('UserOffline', (remoteUid: number) => {
          setPeers(prev => prev.filter(u => u !== remoteUid));
        });
        engine.addListener('ActiveSpeaker', (remoteUid: number) => {
          setSpeakingUid(remoteUid);
          setTimeout(() => setSpeakingUid(null), 2000);
        });
        engine.addListener('Error', (err: number) => {
          console.warn('[Agora] error', err);
        });
      } catch (err) {
        console.warn('[Agora] init failed', err);
      }
    })();

    return () => {
      engine?.removeAllListeners();
      engine?.destroy();
      engineRef.current = null;
    };
  }, [channelName]);

  // Demande de permission micro Android
  async function requestMicPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO!,
        { title: 'Micro', message: 'Loto Seniors a besoin du micro pour le chat vocal.', buttonPositive: 'OK' },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch { return false; }
  }

  const join = useCallback(async () => {
    if (!engineRef.current || !channelName) return;
    const ok = await requestMicPermission();
    if (!ok) return;
    try {
      await engineRef.current.joinChannel(token ?? null, channelName, null, uid);
      setJoined(true);
    } catch (err) {
      console.warn('[Agora] join failed', err);
    }
  }, [channelName, uid, token]);

  const leave = useCallback(async () => {
    if (!engineRef.current) return;
    try {
      await engineRef.current.leaveChannel();
      setJoined(false);
      setPeers([]);
      setSpeakingUid(null);
    } catch (err) {
      console.warn('[Agora] leave failed', err);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!engineRef.current) return;
    const next = !muted;
    engineRef.current.muteLocalAudioStream(next);
    setMuted(next);
  }, [muted]);

  return {
    available: !!RtcEngine && !!AGORA_APP_ID,
    joined, muted, peers, speakingUid,
    join, leave, toggleMute,
  };
}

// ── Utilitaire : convertir l'UID Firebase en uint32 ─────────────────────────
export function firebaseUidToAgoraUid(uid: string): number {
  // djb2 hash → uint32 positif
  let h = 5381;
  for (let i = 0; i < uid.length; i++) {
    h = ((h << 5) + h) ^ uid.charCodeAt(i);
  }
  return Math.abs(h) % 0xFFFFFFF;
}
