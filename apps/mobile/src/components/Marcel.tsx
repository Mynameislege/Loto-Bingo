/**
 * Marcel — présentateur du Loto Seniors
 * Vieux français classique : béret, moustache, marinière, baguette occasionnelle.
 * Apparaît avec parcimonie : victoires, conseils, moments clés.
 */
import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
} from 'react-native';
import { Colors, Radius, Shadow } from './ui/tokens';

export type MarcelMood = 'bienvenue' | 'conseil' | 'ligne' | 'quine' | 'bingo';

interface MarcelProps {
  visible: boolean;
  mood?: MarcelMood;
  quote?: string;
  withBaguette?: boolean;
  onDismiss?: () => void;
}

// ── Citations par humeur ─────────────────────────────────────────────────────
export const MARCEL_QUOTES: Record<MarcelMood, string[]> = {
  bienvenue: [
    '« Mesdames et messieurs, bienvenue au Loto du Jour ! Les boules sont prêtes ! »',
    '« Bonjour à tous ! Marcel est là, et les numéros aussi ! »',
  ],
  conseil: [
    '« Psst… jouez chaque jour, votre série vous rapporte des bonus ! »',
    '« N\'oubliez pas : vos coupons expirent dans 7 jours, hop hop hop ! »',
    '« Un conseil de Marcel : vérifiez l\'onglet Coupons après chaque BINGO ! »',
    '« La chance sourit aux assidus, mon ami ! »',
  ],
  ligne: [
    '« UNE LIGNE ! Bravo, on est bien partis ! »',
    '« Première ligne validée ! Marcel est fier de vous ! »',
  ],
  quine: [
    '« QUINE !!! Deux lignes complètes ! Magnifique ! »',
    '« Voilà voilà voilà ! QUINE ! Il ne manque plus qu\'une ligne ! »',
  ],
  bingo: [
    '« BINGO !!! Félicitations, vous êtes formidable ! Un coupon vous attend ! »',
    '« C\'est le BINGO !!! Marcel vous offre une baguette ! 🥖 »',
    '« BINGO !!! Quelle partie extraordinaire ! Vive le Loto Seniors ! »',
  ],
};

export function pickQuote(mood: MarcelMood): string {
  const list = MARCEL_QUOTES[mood];
  return list[Math.floor(Math.random() * list.length)];
}

// ── Composant Marcel ─────────────────────────────────────────────────────────
export default function Marcel({
  visible,
  mood = 'bienvenue',
  quote,
  withBaguette = false,
  onDismiss,
}: MarcelProps) {
  const translateY = useRef(new Animated.Value(300)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const baguetteRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 60, friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1, duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (withBaguette) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(baguetteRotate, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(baguetteRotate, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
          { iterations: 3 }
        ).start();
      }
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 300, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const baguetteRotateInterp = baguetteRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-30deg', '-20deg'],
  });

  const displayQuote = quote ?? pickQuote(mood);
  const isExcited = mood === 'bingo' || mood === 'quine';

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity, transform: [{ translateY }] }]}>
      <TouchableOpacity style={styles.dismissArea} onPress={onDismiss} activeOpacity={1}>

        {/* Bulle de dialogue */}
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{displayQuote}</Text>
          <View style={styles.bubbleTail} />
        </View>

        {/* Marcel + baguette */}
        <View style={styles.marcelRow}>

          {/* Baguette (à gauche, apparaît en mode bingo/quine) */}
          {withBaguette && (
            <Animated.View style={[
              styles.baguetteWrap,
              { transform: [{ rotate: baguetteRotateInterp }] },
            ]}>
              <View style={styles.baguetteBody}>
                <View style={styles.baguetteTip} />
                {[0,1,2,3,4].map(i => (
                  <View key={i} style={styles.baguetteScore} />
                ))}
              </View>
            </Animated.View>
          )}

          {/* Corps de Marcel */}
          <View style={styles.marcel}>

            {/* === BÉRET === */}
            <View style={styles.beretGroup}>
              <View style={styles.beretPomPom} />
              <View style={styles.beretTop} />
              <View style={styles.beretBrim} />
            </View>

            {/* === TÊTE === */}
            <View style={styles.head}>
              {/* Sourcils */}
              <View style={styles.eyebrows}>
                <View style={[styles.eyebrow, isExcited && styles.eyebrowExcited]} />
                <View style={[styles.eyebrow, isExcited && styles.eyebrowExcited, { transform: [{ scaleX: -1 }] }]} />
              </View>

              {/* Yeux */}
              <View style={styles.eyes}>
                <View style={styles.eyeOuter}>
                  <View style={styles.eyeInner} />
                  <View style={styles.eyeShine} />
                </View>
                <View style={styles.eyeOuter}>
                  <View style={styles.eyeInner} />
                  <View style={styles.eyeShine} />
                </View>
              </View>

              {/* Nez */}
              <View style={styles.nose} />

              {/* Moustache */}
              <View style={styles.mustacheRow}>
                <View style={styles.mustacheLeft} />
                <View style={styles.mustacheGap} />
                <View style={styles.mustacheRight} />
              </View>

              {/* Bouche */}
              <View style={[
                styles.mouth,
                isExcited ? styles.mouthBig : mood === 'conseil' ? styles.mouthSmirk : styles.mouthSmile,
              ]} />

              {/* Joues rosées */}
              <View style={styles.cheekLeft} />
              <View style={styles.cheekRight} />
            </View>

            {/* === COU === */}
            <View style={styles.neck} />

            {/* === MARINIÈRE (corps) === */}
            <View style={styles.body}>
              <View style={[styles.stripe, { top: 0  }]} />
              <View style={[styles.stripe, { top: 14 }]} />
              <View style={[styles.stripe, { top: 28 }]} />
              <View style={[styles.stripe, { top: 42 }]} />
              {/* Col */}
              <View style={styles.collar} />
            </View>

          </View>
        </View>

        {/* Tap pour fermer */}
        <Text style={styles.tapHint}>Appuyez pour continuer</Text>

      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const SKIN   = '#F4C18F';
const SKIN_D = '#E8A96A';
const NAVY   = '#1A2E6B';
const WHITE  = '#F5F5F5';
const DARK   = '#1A0A00';
const MOUSTACHE = '#3D1F00';
const ROUGE  = '#D32F2F';

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 90, left: 0, right: 0,
    alignItems: 'center',
    zIndex: 100,
    paddingHorizontal: 20,
  },
  dismissArea: { alignItems: 'center', width: '100%' },

  // ── Bulle ──────────────────────────────────────────────────────────────────
  bubble: {
    backgroundColor: Colors.parchment,
    borderRadius: Radius.lg,
    borderWidth: 2, borderColor: Colors.woodGrain,
    paddingHorizontal: 18, paddingVertical: 14,
    width: '100%',
    marginBottom: 8,
    ...Shadow.card,
  },
  bubbleText: {
    fontSize: 17, color: Colors.textDark,
    fontStyle: 'italic', lineHeight: 24,
    textAlign: 'center', fontWeight: '600',
  },
  bubbleTail: {
    position: 'absolute', bottom: -10, left: '50%',
    marginLeft: 20,
    width: 0, height: 0,
    borderLeftWidth: 8, borderLeftColor: 'transparent',
    borderRightWidth: 8, borderRightColor: 'transparent',
    borderTopWidth: 10, borderTopColor: Colors.woodGrain,
  },

  // ── Marcel + baguette ──────────────────────────────────────────────────────
  marcelRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },

  // ── Baguette ───────────────────────────────────────────────────────────────
  baguetteWrap: {
    marginRight: 8, marginBottom: 20,
    alignItems: 'center',
    transformOrigin: 'bottom',
  },
  baguetteBody: {
    width: 14, height: 100,
    backgroundColor: '#D4A055',
    borderRadius: 6,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1, borderColor: '#B8842A',
  },
  baguetteTip: {
    position: 'absolute', top: 0, left: 2, right: 2,
    height: 18, backgroundColor: '#C8902A',
    borderTopLeftRadius: 6, borderTopRightRadius: 6,
  },
  baguetteScore: {
    position: 'absolute',
    height: 2, left: 2, right: 2,
    backgroundColor: '#B8742A',
    borderRadius: 1,
    top: undefined,
  },

  // ── Corps Marcel ───────────────────────────────────────────────────────────
  marcel: { alignItems: 'center', width: 100 },

  // Béret
  beretGroup: { alignItems: 'center', marginBottom: -4, zIndex: 2 },
  beretPomPom: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: ROUGE, marginBottom: 1,
  },
  beretTop: {
    width: 72, height: 18,
    backgroundColor: NAVY,
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    transform: [{ scaleX: 1.1 }, { rotate: '-3deg' }],
  },
  beretBrim: {
    width: 84, height: 7,
    backgroundColor: '#0F1E4A',
    borderRadius: 3,
    marginTop: -1,
  },

  // Tête
  head: {
    width: 82, height: 82, borderRadius: 41,
    backgroundColor: SKIN,
    borderWidth: 2, borderColor: SKIN_D,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
    zIndex: 1,
  },

  // Sourcils
  eyebrows: {
    flexDirection: 'row', gap: 14,
    position: 'absolute', top: 16,
  },
  eyebrow: {
    width: 16, height: 4,
    backgroundColor: MOUSTACHE,
    borderRadius: 2,
    transform: [{ rotate: '-8deg' }],
  },
  eyebrowExcited: {
    transform: [{ rotate: '-20deg' }],
  },

  // Yeux
  eyes: {
    flexDirection: 'row', gap: 14,
    position: 'absolute', top: 24,
  },
  eyeOuter: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: WHITE,
    borderWidth: 1.5, borderColor: DARK,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  eyeInner: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: DARK,
  },
  eyeShine: {
    position: 'absolute', top: 2, right: 2,
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: WHITE,
  },

  // Nez
  nose: {
    position: 'absolute', top: 38,
    width: 12, height: 10,
    backgroundColor: SKIN_D,
    borderRadius: 6,
    borderWidth: 1, borderColor: '#C88A55',
  },

  // Moustache
  mustacheRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute', top: 50,
  },
  mustacheLeft: {
    width: 20, height: 11,
    backgroundColor: MOUSTACHE,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 4,
    transform: [{ rotate: '5deg' }],
  },
  mustacheGap: { width: 4 },
  mustacheRight: {
    width: 20, height: 11,
    backgroundColor: MOUSTACHE,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 4,
    transform: [{ rotate: '-5deg' }],
  },

  // Bouche
  mouth: {
    position: 'absolute', top: 63,
    width: 20, height: 8,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 2, borderColor: '#8B4513',
    borderTopWidth: 0,
  },
  mouthSmile: { width: 20, height: 8 },
  mouthBig:   { width: 28, height: 12, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
  mouthSmirk: { width: 14, height: 6, marginLeft: 4 },

  // Joues
  cheekLeft: {
    position: 'absolute', top: 42, left: 6,
    width: 14, height: 9, borderRadius: 7,
    backgroundColor: '#F08080', opacity: 0.35,
  },
  cheekRight: {
    position: 'absolute', top: 42, right: 6,
    width: 14, height: 9, borderRadius: 7,
    backgroundColor: '#F08080', opacity: 0.35,
  },

  // Cou
  neck: {
    width: 22, height: 10,
    backgroundColor: SKIN_D,
    zIndex: 0,
  },

  // Marinière
  body: {
    width: 80, height: 56,
    backgroundColor: WHITE,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1, borderColor: '#DDD',
  },
  stripe: {
    position: 'absolute',
    left: 0, right: 0,
    height: 11,
    backgroundColor: NAVY,
    opacity: 0.85,
  },
  collar: {
    position: 'absolute', top: 0,
    alignSelf: 'center',
    width: 28, height: 14,
    backgroundColor: WHITE,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1, borderColor: '#DDD',
  },

  // Hint
  tapHint: {
    fontSize: 12, color: Colors.textMuted,
    marginTop: 2,
  },
});
