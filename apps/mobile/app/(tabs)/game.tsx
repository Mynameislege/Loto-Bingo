import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { useGameStore } from '@/stores/gameStore';
import { Colors, Spacing, Radius, Shadow } from '@/components/ui/tokens';
import Marcel, { type MarcelMood, pickQuote } from '@/components/Marcel';
import ConfettiBingo from '@/components/ConfettiBingo';
import { useSound } from '@/hooks/useSound';
import { getCurrentSeasonalEvent, getMarcelSeasonalPhrase } from '@/services/seasonalEvents';

// ── Boules style bingo — lettre B/I/N/G/O + numéro (loto français 1–90) ──────
// B = 1-18  (rouge)
// I = 19-36 (bleu)
// N = 37-54 (blanc / gris clair, texte sombre)
// G = 55-72 (vert)
// O = 73-90 (orange/jaune)

interface BallSpec {
  letter: string;
  bg: string;       // couleur principale boule
  bg2: string;      // dégradé intérieur (plus foncé)
  border: string;   // bord externe
  textColor: string;
  bandColor: string;
}

function getBallSpec(n: number): BallSpec {
  if (n <= 18) return { letter: 'B', bg: '#E53935', bg2: '#B71C1C', border: '#8B0000', textColor: '#fff', bandColor: 'rgba(255,255,255,0.92)' };
  if (n <= 36) return { letter: 'I', bg: '#1E88E5', bg2: '#0D47A1', border: '#083180', textColor: '#fff', bandColor: 'rgba(255,255,255,0.92)' };
  if (n <= 54) return { letter: 'N', bg: '#F5F5F5', bg2: '#BDBDBD', border: '#9E9E9E', textColor: '#212121', bandColor: 'rgba(100,100,100,0.15)' };
  if (n <= 72) return { letter: 'G', bg: '#43A047', bg2: '#1B5E20', border: '#0A3D0A', textColor: '#fff', bandColor: 'rgba(255,255,255,0.92)' };
  return         { letter: 'O', bg: '#FB8C00', bg2: '#E65100', border: '#BF360C', textColor: '#fff', bandColor: 'rgba(255,255,255,0.92)' };
}

// ── Boule style bingo plastique ───────────────────────────────────────────────
function LotoBall({ number, size = 44 }: { number: number; size?: number }) {
  const spec = getBallSpec(number);

  // Proportions selon taille
  const bandH      = size * 0.38;
  const shineW     = size * 0.26;
  const shineH     = size * 0.18;
  const letterSize = size < 44 ? 8  : size > 80 ? 22 : 11;
  const numSize    = size < 44 ? 11 : size > 80 ? 32 : 16;
  const bandTop    = (size - bandH) / 2;

  return (
    <View style={[
      ballStyles.outer,
      {
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: spec.bg,
        borderColor: spec.border,
        shadowColor: spec.bg2,
      },
    ]}>
      {/* Bande blanche horizontale centrale (style bingo authentique) */}
      <View style={[ballStyles.band, { top: bandTop, height: bandH, backgroundColor: spec.bandColor }]} />

      {/* Reflet brillant haut-gauche */}
      <View style={[ballStyles.shine, { width: shineW, height: shineH, borderRadius: shineH / 2 }]} />
      {/* Petit reflet secondaire */}
      <View style={[ballStyles.shine2, { width: shineW * 0.5, height: shineH * 0.5, borderRadius: shineH * 0.25 }]} />

      {/* Lettre (dans la bande blanche) + Numéro */}
      <View style={ballStyles.textContainer}>
        <Text style={[ballStyles.letter, { fontSize: letterSize, color: spec.bg2 }]}>{spec.letter}</Text>
        <Text style={[ballStyles.number, { fontSize: numSize, color: spec.textColor === '#fff' ? '#fff' : spec.bg2 }]}>
          {number}
        </Text>
      </View>
    </View>
  );
}

const ballStyles = StyleSheet.create({
  outer: {
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.6, shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  band: {
    position: 'absolute', left: 0, right: 0,
  },
  shine: {
    position: 'absolute', top: '8%', left: '12%',
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
  shine2: {
    position: 'absolute', top: '18%', left: '22%',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  letter: {
    fontWeight: '900',
    lineHeight: undefined,
    letterSpacing: 1,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textShadowColor: 'rgba(0,0,0,0.2)',
  },
  number: {
    fontWeight: '900',
    lineHeight: undefined,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    textShadowColor: 'rgba(0,0,0,0.35)',
  },
});

// ── Durée du timer en secondes ────────────────────────────────────────────────
const AUTO_DRAW_SECONDS = 6;
const CONSEIL_FREQUENCY = 15;

export default function GameScreen() {
  const {
    card, ballsDrawn, checkResult, couponAwarded,
    gameOver, isLoading, startDailyGame, drawBall, reset,
  } = useGameStore();

  // ── Sons ─────────────────────────────────────────────────────────────────
  const { play, playAmbience, stopAmbience } = useSound();

  // ── Timer auto ────────────────────────────────────────────────────────────
  const [countdown, setCountdown] = useState(AUTO_DRAW_SECONDS);
  const [timerActive, setTimerActive] = useState(false);
  const countdownRef = useRef(AUTO_DRAW_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerProgress = useRef(new Animated.Value(1)).current;

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    countdownRef.current = AUTO_DRAW_SECONDS;
    setCountdown(AUTO_DRAW_SECONDS);
    setTimerActive(true);
    Animated.timing(timerProgress, { toValue: 0, duration: AUTO_DRAW_SECONDS * 1000, useNativeDriver: false }).start();
    timerRef.current = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimerActive(false);
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerProgress.stopAnimation();
    setTimerActive(false);
  }, []);

  // Auto-draw quand countdown atteint 0
  useEffect(() => {
    if (countdown === 0 && card && !gameOver && !isLoading) {
      timerProgress.setValue(1);
      play('ball_draw');
      drawBall();
    }
  }, [countdown]);

  // Redémarrer le timer après chaque tirage
  useEffect(() => {
    if (card && !gameOver && !isLoading) {
      startTimer();
    }
    if (gameOver) stopTimer();
  }, [ballsDrawn.length, gameOver, card]);

  // ── Confetti bingo ────────────────────────────────────────────────────────
  const [confettiVisible, setConfettiVisible] = useState(false);

  // ── État Marcel ──────────────────────────────────────────────────────────
  const [marcelVisible, setMarcelVisible]   = useState(false);
  const [marcelMood, setMarcelMood]         = useState<MarcelMood>('bienvenue');
  const [marcelQuote, setMarcelQuote]       = useState('');
  const [marcelBaguette, setMarcelBaguette] = useState(false);
  const marcelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevBallCount = useRef(0);
  const prevLine  = useRef(false);
  const prevQuine = useRef(false);
  const prevBingo = useRef(false);

  const showMarcel = useCallback((
    mood: MarcelMood,
    quote?: string,
    baguette = false,
    autoHideMs = 4000,
  ) => {
    if (marcelTimer.current) clearTimeout(marcelTimer.current);
    setMarcelMood(mood);
    setMarcelQuote(quote ?? pickQuote(mood));
    setMarcelBaguette(baguette);
    setMarcelVisible(true);
    marcelTimer.current = setTimeout(() => setMarcelVisible(false), autoHideMs);
  }, []);

  // ── Ambiance : démarre dès que la partie commence ─────────────────────────
  useEffect(() => {
    if (card && !gameOver) {
      playAmbience();
    }
    if (gameOver) {
      stopAmbience();
    }
  }, [card, gameOver]);

  // ── Nettoyage ─────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      reset();
      stopTimer();
      stopAmbience();
      if (marcelTimer.current) clearTimeout(marcelTimer.current);
    };
  }, []);

  // ── Déclencheurs Marcel + Sons ────────────────────────────────────────────
  useEffect(() => {
    if (!card) return;

    if (checkResult.bingo && !prevBingo.current) {
      prevBingo.current = true;
      play('bingo');
      showMarcel('bingo', undefined, true, 5000);
      setConfettiVisible(true);
      return;
    }
    if (checkResult.quine && !prevQuine.current) {
      prevQuine.current = true;
      play('quine');
      showMarcel('quine', undefined, false, 4000);
      return;
    }
    if (checkResult.line && !prevLine.current) {
      prevLine.current = true;
      play('line');
      showMarcel('ligne', undefined, false, 3500);
      return;
    }

    const count = ballsDrawn.length;
    if (count > 0 && count !== prevBallCount.current && count % CONSEIL_FREQUENCY === 0 && !checkResult.bingo) {
      showMarcel('conseil', undefined, false, 4000);
    }
    prevBallCount.current = count;
  }, [ballsDrawn, checkResult]);

  const lastBall = ballsDrawn[ballsDrawn.length - 1];

  // ── Écran de départ ───────────────────────────────────────────────────────
  if (!card) {
    return (
      <View style={styles.startContainer}>
        <View style={styles.ballDecorRow}>
          {[7, 13, 28, 42, 55, 67, 81].map(n => (
            <LotoBall key={n} number={n} size={38} />
          ))}
        </View>

        <View style={styles.marcelCard}>
          <Text style={styles.marcelMic}>🎙</Text>
          <Text style={styles.marcelName}>MARCEL</Text>
          <Text style={styles.marcelQuote}>
            {(() => {
              const ev = getCurrentSeasonalEvent();
              return ev
                ? `${ev.emoji}  ${getMarcelSeasonalPhrase(ev)}`
                : `« Mesdames et messieurs, bienvenue au Loto du Jour !\nLes boules sont prêtes — êtes-vous prêts ? »`;
            })()}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.startBtn, isLoading && { opacity: 0.6 }]}
          onPress={() => {
            startDailyGame().catch((e: Error) => {
              Alert.alert('Serveur indisponible', e.message);
            });
          }}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" size="large" />
            : <Text style={styles.startBtnText}>🔵  Lancer le Loto du Jour</Text>
          }
        </TouchableOpacity>

        <Text style={styles.startHint}>1 partie gratuite par jour · Coupons à gagner</Text>
      </View>
    );
  }

  // ── Partie en cours ───────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* En-tête */}
        <View style={styles.woodHeader}>
          <Text style={styles.woodHeaderTitle}>🎰 Loto du Jour</Text>
          <Text style={styles.woodHeaderSub}>
            {ballsDrawn.length === 0 ? 'Prêt à tirer !' : `Boule n°${ballsDrawn.length} · Dernière : ${lastBall}`}
          </Text>
        </View>

        {/* Dernière boule (grande) */}
        {lastBall !== undefined && (
          <View style={styles.lastBallContainer}>
            <LotoBall number={lastBall} size={96} />
            <Text style={styles.lastBallLabel}>Dernière boule</Text>
          </View>
        )}

        {/* Badges résultats */}
        <View style={styles.badgesRow}>
          <ResultBadge label="LIGNE"  active={checkResult.line}  color="#43A047" />
          <ResultBadge label="QUINE"  active={checkResult.quine} color="#FB8C00" />
          <ResultBadge label="BINGO!" active={checkResult.bingo} color="#E53935" />
        </View>

        {/* Carton */}
        <View style={styles.cartonFrame}>
          <View style={styles.cartonHeader}>
            <Text style={styles.cartonTitle}>✦ CARTON N°1 ✦</Text>
            <Text style={styles.cartonSub}>{ballsDrawn.length} boules tirées</Text>
          </View>
          <View style={styles.carton}>
            {card.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.cartonRow}>
                {row.map((cell, colIdx) => {
                  const isDrawn = cell !== null && ballsDrawn.includes(cell);
                  return (
                    <View
                      key={colIdx}
                      style={[
                        styles.cartonCell,
                        cell === null && styles.cartonCellBlank,
                      ]}
                    >
                      {cell !== null && (
                        isDrawn
                          ? <LotoBall number={cell} size={36} />
                          : <Text style={styles.cartonCellText}>{cell}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Bouton tirer + timer */}
        {!gameOver && (
          <View style={styles.drawSection}>
            {/* Barre de progression timer */}
            <View style={styles.timerBarBg}>
              <Animated.View style={[styles.timerBarFill, {
                width: timerProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              }]} />
            </View>

            <TouchableOpacity
              style={[styles.drawBtn, isLoading && styles.drawBtnDisabled]}
              onPress={() => {
                stopTimer();
                timerProgress.setValue(1);
                drawBall();
              }}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" size="large" />
                : (
                  <View style={styles.drawBtnInner}>
                    <Text style={styles.drawBtnText}>Tirer une boule</Text>
                    {timerActive && (
                      <View style={styles.countdownBadge}>
                        <Text style={styles.countdownText}>{countdown}s</Text>
                      </View>
                    )}
                  </View>
                )
              }
            </TouchableOpacity>
            <Text style={styles.timerHint}>⏱ Tirage automatique dans {countdown}s</Text>
          </View>
        )}

        {/* Historique boules */}
        {ballsDrawn.length > 0 && (
          <>
            <Text style={styles.historyLabel}>Boules sorties ({ballsDrawn.length})</Text>
            <View style={styles.ballsHistory}>
              {ballsDrawn.map((b, i) => (
                <LotoBall key={i} number={b} size={40} />
              ))}
            </View>
          </>
        )}

        {gameOver && (
          <View style={styles.gameOverCard}>
            <Text style={styles.gameOverText}>
              {couponAwarded ? '🎉 BINGO — Coupon gagné !' : '⏱ Partie terminée — À demain !'}
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Marcel en coin haut-droit */}
      <Marcel
        visible={marcelVisible}
        mood={marcelMood}
        quote={marcelQuote}
        withBaguette={marcelBaguette}
      />

      {/* Confetti BINGO */}
      <ConfettiBingo
        visible={confettiVisible}
        reward={couponAwarded ? 'coupon' : 'xp'}
        onFinished={() => setConfettiVisible(false)}
      />
    </View>
  );
}

// ── Composants ──────────────────────────────────────────────────────────────────────────────
function ResultBadge({ label, active, color }: { label: string; active: boolean; color: string }) {
  return (
    <View style={[styles.badge, active && { backgroundColor: color, borderColor: color }]}>
      <Text style={[styles.badgeText, active && { color: '#fff' }]}>{label}</Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  startContainer: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
    padding: Spacing.lg,
  },
  ballDecorRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.xl },

  marcelCard: {
    backgroundColor: Colors.wood, borderRadius: Radius.lg,
    borderWidth: 2, borderColor: Colors.woodGrain,
    padding: Spacing.xl, alignItems: 'center',
    marginBottom: Spacing.xl, width: '100%', ...Shadow.card,
  },
  marcelMic: { fontSize: 40, marginBottom: Spacing.sm },
  marcelName: { fontSize: 12, fontWeight: '900', color: Colors.woodGrain, letterSpacing: 4, marginBottom: Spacing.sm },
  marcelQuote: { fontSize: 17, color: Colors.parchment, textAlign: 'center', fontStyle: 'italic', lineHeight: 26 },

  startBtn: {
    backgroundColor: Colors.orange, borderRadius: Radius.lg,
    paddingVertical: 20, paddingHorizontal: Spacing.xl,
    width: '100%', alignItems: 'center',
    marginBottom: Spacing.md, ...Shadow.card,
  },
  startBtnText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  startHint: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },

  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },

  woodHeader: {
    backgroundColor: Colors.wood,
    paddingTop: 52, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: 3, borderBottomColor: Colors.woodGrain,
  },
  woodHeaderTitle: { fontSize: 20, fontWeight: '800', color: Colors.parchment },
  woodHeaderSub: { fontSize: 13, color: Colors.textWood, marginTop: 2 },

  lastBallContainer: { alignItems: 'center', paddingVertical: Spacing.lg },
  lastBallLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 10, letterSpacing: 1 },

  badgesRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: Spacing.sm, marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  badge: {
    flex: 1, paddingVertical: 10, borderRadius: Radius.full,
    borderWidth: 2, borderColor: Colors.textMuted, alignItems: 'center',
  },
  badgeText: { fontSize: 12, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1 },

  cartonFrame: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.lg,
    borderRadius: Radius.lg, borderWidth: 4, borderColor: Colors.woodGrain,
    backgroundColor: Colors.wood, overflow: 'hidden', ...Shadow.card,
  },
  cartonHeader: {
    backgroundColor: Colors.woodMid,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderBottomWidth: 2, borderBottomColor: Colors.woodGrain,
  },
  cartonTitle: { fontSize: 13, fontWeight: '900', color: Colors.woodGrain, letterSpacing: 2 },
  cartonSub: { fontSize: 12, color: Colors.textWood },
  carton: { padding: Spacing.sm, backgroundColor: Colors.parchment },
  cartonRow: { flexDirection: 'row', marginBottom: 4 },
  cartonCell: {
    flex: 1, aspectRatio: 1, margin: 2,
    backgroundColor: Colors.parchmentDim,
    borderRadius: 6, borderWidth: 1, borderColor: '#C8B898',
    justifyContent: 'center', alignItems: 'center',
  },
  cartonCellBlank: { backgroundColor: 'rgba(164,130,80,0.15)', borderColor: 'transparent' },
  cartonCellText: { fontSize: 15, fontWeight: '800', color: Colors.textDark },

  drawSection: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  timerBarBg: { height: 4, backgroundColor: Colors.woodMid, borderRadius: 2, marginBottom: 10, overflow: 'hidden' },
  timerBarFill: { height: '100%', backgroundColor: Colors.orange, borderRadius: 2 },

  drawBtn: {
    backgroundColor: Colors.orange, borderRadius: Radius.lg,
    paddingVertical: 20, alignItems: 'center', ...Shadow.card,
  },
  drawBtnDisabled: { opacity: 0.6 },
  drawBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  drawBtnText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  countdownBadge: {
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  countdownText: { fontSize: 16, fontWeight: '900', color: '#fff' },
  timerHint: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 6 },

  historyLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  ballsHistory: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },

  gameOverCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.woodMid,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.woodGrain,
    padding: Spacing.lg, alignItems: 'center',
  },
  gameOverText: { fontSize: 18, fontWeight: '700', color: Colors.parchment, textAlign: 'center' },
});
