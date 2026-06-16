/**
 * useSound — gestion des effets sonores via expo-av
 *
 * Sons utilisés :
 *  - ball_draw  : bruit de boule qui roule / tombe dans le cylindre
 *  - line       : fanfare légère (Ligne)
 *  - quine      : fanfare plus longue (Quine)
 *  - bingo      : célébration complète (Bingo)
 *  - ambience   : fond sonore de salle de loto (loop discret)
 *
 * En attendant les vrais fichiers enregistrés par Marcel (ElevenLabs, Cloudflare R2),
 * tous les sons sont chargés depuis `apps/mobile/assets/sounds/`.
 * Ajouter les MP3 dans ce dossier et les imports ci-dessous seront actifs.
 *
 * Architecture :
 *   - Les sons sont chargés une fois au montage et déchargés au démontage
 *   - `play(key)` joue le son sans bloquer l'UI
 *   - `playAmbience()` / `stopAmbience()` pour le fond sonore en boucle
 */
import { useEffect, useRef, useCallback } from 'react';
import { Audio, AVPlaybackSource } from 'expo-av';

// ── Catalogue des sons ────────────────────────────────────────────────────────
// Remplacer `null` par require('../../../assets/sounds/xxx.mp3') dès que
// les fichiers sont disponibles. Les entrées `null` sont ignorées silencieusement.

const SOUND_SOURCES: Record<string, AVPlaybackSource | null> = {
  ball_draw: null,  // require('../../../assets/sounds/ball_draw.mp3'),
  line:      null,  // require('../../../assets/sounds/line.mp3'),
  quine:     null,  // require('../../../assets/sounds/quine.mp3'),
  bingo:     null,  // require('../../../assets/sounds/bingo.mp3'),
  ambience:  null,  // require('../../../assets/sounds/ambience.mp3'),
};

type SoundKey = keyof typeof SOUND_SOURCES;

export function useSound() {
  const soundsRef = useRef<Partial<Record<SoundKey, Audio.Sound>>>({});
  const ambienceRef = useRef<Audio.Sound | null>(null);

  // Charge tous les sons au montage
  useEffect(() => {
    let mounted = true;

    (async () => {
      // Activer le mode audio (obligatoire sur iOS)
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
      } catch { /* ignore */ }

      // Charger chaque son
      for (const [key, src] of Object.entries(SOUND_SOURCES)) {
        if (!src || !mounted) continue;
        try {
          const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: false });
          if (mounted) soundsRef.current[key as SoundKey] = sound;
        } catch { /* fichier absent — silencieux */ }
      }
    })();

    return () => {
      mounted = false;
      // Décharger tous les sons
      Object.values(soundsRef.current).forEach(s => {
        s?.unloadAsync().catch(() => {});
      });
      soundsRef.current = {};
      ambienceRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  /** Joue un son ponctuel (non-bloquant) */
  const play = useCallback((key: SoundKey) => {
    const sound = soundsRef.current[key];
    if (!sound) return;
    sound.replayAsync().catch(() => {});
  }, []);

  /** Démarre l'ambiance en boucle */
  const playAmbience = useCallback(async () => {
    const src = SOUND_SOURCES.ambience;
    if (!src) return;
    try {
      if (ambienceRef.current) {
        await ambienceRef.current.playAsync();
        return;
      }
      const { sound } = await Audio.Sound.createAsync(src, {
        shouldPlay: true,
        isLooping: true,
        volume: 0.3,
      });
      ambienceRef.current = sound;
    } catch { /* ignore */ }
  }, []);

  /** Arrête l'ambiance */
  const stopAmbience = useCallback(() => {
    ambienceRef.current?.pauseAsync().catch(() => {});
  }, []);

  return { play, playAmbience, stopAmbience };
}
