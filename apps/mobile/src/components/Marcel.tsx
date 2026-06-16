/**
 * Marcel — présentateur du Loto Seniors
 * Apparaît en coin haut-droit, slide depuis la droite, auto-dismiss.
 */
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
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
    '« Bienvenue au Loto du Jour ! Les boules sont prêtes ! »',
    '« Bonjour à tous ! Marcel est là ! »',
  ],
  conseil: [
    '« Jouez chaque jour pour vos bonus ! »',
    '« Vos coupons expirent dans 7 jours ! »',
    '« Vérifiez l\'onglet Coupons après chaque BINGO ! »',
    '« La chance sourit aux assidus ! »',
  ],
  ligne: [
    '« UNE LIGNE ! Bravo ! »',
    '« Première ligne ! Marcel est fier ! »',
  ],
  quine: [
    '« QUINE !!! Magnifique ! »',
    '« QUINE ! Il ne manque plus qu\'une ligne ! »',
  ],
  bingo: [
    '« BINGO !!! Vous êtes formidable ! »',
    '« C\'est le BINGO !!! 🥖 »',
    '« BINGO !!! Vive le Loto Seniors ! »',
  ],
};

export function pickQuote(mood: MarcelMood): string {
  const list = MARCEL_QUOTES[mood];
  return list[Math.floor(Math.random() * list.length)] ?? list[0] ?? '';
}

// ── Composant Marcel ─────────────────────────────────────────────────────────
export default function Marcel({
  visible,
  mood = 'bienvenue',
  quote,
  withBaguette = false,
}: MarcelProps) {
  const translateX = useRef(new Animated.Value(200)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const baguetteRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0, tension: 70, friction: 9,
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
            Animated.timing(baguetteRotate, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(baguetteRotate, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]),
          { iterations: 4 }
        ).start();
      }
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: 200, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const baguetteRotateInterp = baguetteRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-25deg', '-10deg'],
  });

  const displayQuote = quote ?? pickQuote(mood);
  const isExcited = mood === 'bingo' || mood === 'quine';

  if (!visible) return null;

  return (
    <Animated.View style={[styles.corner, { opacity, transform: [{ translateX }] }]}>

      {/* Bulle de dialogue */}
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{displayQuote}</Text>
        <View style={styles.bubbleTail} />
      </View>

      {/* Marcel + baguette */}
      <View style={styles.marcelRow}>
        {withBaguette && (
          <Animated.View style={[styles.baguetteWrap, { transform: [{ rotate: baguetteRotateInterp }] }]}>
            <View style={styles.baguetteBody}>
              <View style={styles.baguetteTip} />
            </View>
          </Animated.View>
        )}

        <View style={styles.marcel}>
          {/* Béret */}
          <View style={styles.beretGroup}>
            <View style={styles.beretPomPom} />
            <View style={styles.beretTop} />
            <View style={styles.beretBrim} />
          </View>

          {/* Tête */}
          <View style={styles.head}>
            <View style={styles.eyebrows}>
              <View style={[styles.eyebrow, isExcited && styles.eyebrowExcited]} />
              <View style={[styles.eyebrow, isExcited && styles.eyebrowExcited, { transform: [{ scaleX: -1 }] }]} />
            </View>
            <View style={styles.eyes}>
              <View style={styles.eyeOuter}><View style={styles.eyeInner} /><View style={styles.eyeShine} /></View>
              <View style={styles.eyeOuter}><View style={styles.eyeInner} /><View style={styles.eyeShine} /></View>
            </View>
            <View style={styles.nose} />
            <View style={styles.mustacheRow}>
              <View style={styles.mustacheLeft} />
              <View style={styles.mustacheGap} />
              <View style={styles.mustacheRight} />
            </View>
            <View style={[styles.mouth, isExcited ? styles.mouthBig : styles.mouthSmile]} />
            <View style={styles.cheekLeft} />
            <View style={styles.cheekRight} />
          </View>

          {/* Cou */}
          <View style={styles.neck} />

          {/* Marinière */}
          <View style={styles.body}>
            <View style={[styles.stripe, { top: 0 }]} />
            <View style={[styles.stripe, { top: 10 }]} />
            <View style={[styles.stripe, { top: 20 }]} />
            <View style={styles.collar} />
          </View>
        </View>
      </View>
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
  corner: {
    position: 'absolute',
    top: 80, right: 12,
    width: 170,
    zIndex: 100,
    alignItems: 'flex-end',
  },

  // Bulle
  bubble: {
    backgroundColor: Colors.parchment,
    borderRadius: Radius.md,
    borderWidth: 2, borderColor: Colors.woodGrain,
    paddingHorizontal: 10, paddingVertical: 8,
    width: '100%',
    marginBottom: 6,
    ...Shadow.card,
  },
  bubbleText: {
    fontSize: 12, color: Colors.textDark,
    fontStyle: 'italic', lineHeight: 17,
    textAlign: 'center', fontWeight: '600',
  },
  bubbleTail: {
    position: 'absolute', bottom: -8, right: 30,
    width: 0, height: 0,
    borderLeftWidth: 6, borderLeftColor: 'transparent',
    borderRightWidth: 6, borderRightColor: 'transparent',
    borderTopWidth: 8, borderTopColor: Colors.woodGrain,
  },

  // Marcel row
  marcelRow: { flexDirection: 'row', alignItems: 'flex-end' },

  // Baguette
  baguetteWrap: { marginRight: 4, marginBottom: 12 },
  baguetteBody: {
    width: 8, height: 60,
    backgroundColor: '#D4A055',
    borderRadius: 4, overflow: 'hidden',
    borderWidth: 1, borderColor: '#B8842A',
  },
  baguetteTip: {
    position: 'absolute', top: 0, left: 1, right: 1,
    height: 10, backgroundColor: '#C8902A',
    borderTopLeftRadius: 4, borderTopRightRadius: 4,
  },

  // Marcel body
  marcel: { alignItems: 'center', width: 70 },

  beretGroup: { alignItems: 'center', marginBottom: -3, zIndex: 2 },
  beretPomPom: { width: 7, height: 7, borderRadius: 4, backgroundColor: ROUGE, marginBottom: 1 },
  beretTop: { width: 50, height: 13, backgroundColor: NAVY, borderTopLeftRadius: 25, borderTopRightRadius: 25, transform: [{ rotate: '-3deg' }] },
  beretBrim: { width: 58, height: 5, backgroundColor: '#0F1E4A', borderRadius: 2, marginTop: -1 },

  head: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: SKIN, borderWidth: 2, borderColor: SKIN_D,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative', overflow: 'visible', zIndex: 1,
  },

  eyebrows: { flexDirection: 'row', gap: 10, position: 'absolute', top: 11 },
  eyebrow: { width: 11, height: 3, backgroundColor: MOUSTACHE, borderRadius: 2, transform: [{ rotate: '-8deg' }] },
  eyebrowExcited: { transform: [{ rotate: '-20deg' }] },

  eyes: { flexDirection: 'row', gap: 10, position: 'absolute', top: 17 },
  eyeOuter: { width: 10, height: 10, borderRadius: 5, backgroundColor: WHITE, borderWidth: 1, borderColor: DARK, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  eyeInner: { width: 5, height: 5, borderRadius: 3, backgroundColor: DARK },
  eyeShine: { position: 'absolute', top: 1, right: 1, width: 3, height: 3, borderRadius: 2, backgroundColor: WHITE },

  nose: { position: 'absolute', top: 26, width: 8, height: 7, backgroundColor: SKIN_D, borderRadius: 4, borderWidth: 1, borderColor: '#C88A55' },

  mustacheRow: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 34 },
  mustacheLeft: { width: 14, height: 8, backgroundColor: MOUSTACHE, borderTopLeftRadius: 2, borderBottomLeftRadius: 7, borderBottomRightRadius: 3, transform: [{ rotate: '5deg' }] },
  mustacheGap: { width: 3 },
  mustacheRight: { width: 14, height: 8, backgroundColor: MOUSTACHE, borderTopRightRadius: 2, borderBottomRightRadius: 7, borderBottomLeftRadius: 3, transform: [{ rotate: '-5deg' }] },

  mouth: { position: 'absolute', top: 43, width: 14, height: 6, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, backgroundColor: 'transparent', borderWidth: 2, borderColor: '#8B4513', borderTopWidth: 0 },
  mouthSmile: { width: 14, height: 6 },
  mouthBig: { width: 20, height: 9, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },

  cheekLeft: { position: 'absolute', top: 29, left: 4, width: 10, height: 6, borderRadius: 5, backgroundColor: '#F08080', opacity: 0.35 },
  cheekRight: { position: 'absolute', top: 29, right: 4, width: 10, height: 6, borderRadius: 5, backgroundColor: '#F08080', opacity: 0.35 },

  neck: { width: 16, height: 7, backgroundColor: SKIN_D, zIndex: 0 },

  body: { width: 56, height: 38, backgroundColor: WHITE, borderRadius: 6, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: '#DDD' },
  stripe: { position: 'absolute', left: 0, right: 0, height: 8, backgroundColor: NAVY, opacity: 0.85 },
  collar: { position: 'absolute', top: 0, alignSelf: 'center', width: 20, height: 10, backgroundColor: WHITE, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, borderWidth: 1, borderColor: '#DDD' },
});
