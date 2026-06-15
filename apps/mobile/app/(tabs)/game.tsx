import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useGameStore } from '@/stores/gameStore';
import { Colors, Spacing, Radius, Shadow } from '@/components/ui/tokens';
import Marcel, { type MarcelMood, pickQuote } from '@/components/Marcel';

// Couleur des boules par dizaine (tradition loto français)
function ballColor(n: number): string {
  if (n <= 9)  return '#E53935';
  if (n <= 19) return '#1E88E5';
  if (n <= 29) return '#43A047';
  if (n <= 39) return '#FB8C00';
  if (n <= 49) return '#8E24AA';
  if (n <= 59) return '#00ACC1';
  if (n <= 69) return '#F4511E';
  if (n <= 79) return '#6D4C41';
  return '#546E7A';
}

// Marcel apparaît tous les N boules tirées (conseils aléatoires)
const CONSEIL_FREQUENCY = 7;

export default function GameScreen() {
  const {
    card, ballsDrawn, checkResult, couponAwarded,
    gameOver, isLoading, startDailyGame, drawBall, reset,
  } = useGameStore();

  // ── État Marcel ────────────────────────────────────────────────────────────
  const [marcelVisible, setMarcelVisible] = useState(false);
  const [marcelMood, setMarcelMood]       = useState<MarcelMood>('bienvenue');
  const [marcelQuote, setMarcelQuote]     = useState('');
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
    autoHideMs = 4500,
  ) => {
    if (marcelTimer.current) clearTimeout(marcelTimer.current);
    setMarcelMood(mood);
    setMarcelQuote(quote ?? pickQuote(mood));
    setMarcelBaguette(baguette);
    setMarcelVisible(true);
    if (autoHideMs > 0) {
      marcelTimer.current = setTimeout(() => setMarcelVisible(false), autoHideMs);
    }
  }, []);

  const hideMarcel = useCallback(() => {
    if (marcelTimer.current) clearTimeout(marcelTimer.current);
    setMarcelVisible(false);
  }, []);

  // ── Nettoyage ──────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      reset();
      if (marcelTimer.current) clearTimeout(marcelTimer.current);
    };
  }, []);

  // ── Déclencheurs Marcel ────────────────────────────────────────────────────
  useEffect(() => {
    if (!card) return;

    // 1. Bingo (priorité max — avec baguette !)
    if (checkResult.bingo && !prevBingo.current) {
      prevBingo.current = true;
      showMarcel('bingo', undefined, true, 7000);
      Alert.alert(
        '🎉 BINGO !',
        'Marcel vous félicite ! Votre coupon vous attend dans l\'onglet Coupons.',
        [{ text: 'Voir mon coupon 🎟', style: 'default' }]
      );
      return;
    }

    // 2. Quine
    if (checkResult.quine && !prevQuine.current) {
      prevQuine.current = true;
      showMarcel('quine', undefined, false, 4000);
      return;
    }

    // 3. Ligne
    if (checkResult.line && !prevLine.current) {
      prevLine.current = true;
      showMarcel('ligne', undefined, false, 3500);
      return;
    }

    // 4. Conseil aléatoire tous les N boules
    const count = ballsDrawn.length;
    if (
      count > 0 &&
      count !== prevBallCount.current &&
      count % CONSEIL_FREQUENCY === 0 &&
      !checkResult.bingo
    ) {
      showMarcel('conseil', undefined, false, 4000);
    }
    prevBallCount.current = count;

  }, [ballsDrawn, checkResult]);

  const lastBall = ballsDrawn[ballsDrawn.length - 1];

  // ── Écran de départ ────────────────────────────────────────────────────────
  if (!card) {
    return (
      <View style={styles.startContainer}>
        <View style={styles.ballDecorRow}>
          {[7, 13, 28, 42, 55, 67, 81].map(n => (
            <View key={n} style={[styles.ballDecor, { backgroundColor: ballColor(n) }]}>
              <Text style={styles.ballDecorText}>{n}</Text>
            </View>
          ))}
        </View>

        <View style={styles.marcelCard}>
          <Text style={styles.marcelMic}>🎙</Text>
          <Text style={styles.marcelName}>MARCEL</Text>
          <Text style={styles.marcelQuote}>
            « Mesdames et messieurs, bienvenue au Loto du Jour !{'\n'}Les boules sont prêtes — êtes-vous prêts ? »
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.startBtn, isLoading && { opacity: 0.6 }]}
          onPress={() => {
            startDailyGame().catch((e: Error) => {
              Alert.alert(
                'Serveur indisponible',
                'Impossible de démarrer la partie.\nVérifiez que le serveur API est lancé (pnpm --filter api dev).\n\n' + e.message,
              );
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

  // ── Partie en cours ────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* En-tête bois */}
        <View style={styles.woodHeader}>
          <Text style={styles.woodHeaderTitle}>🎰 Loto du Jour</Text>
          <Text style={styles.woodHeaderSub}>
            {ballsDrawn.length === 0
              ? 'Tirez votre première boule !'
              : `Boule n° ${ballsDrawn.length} · Dernière : ${lastBall}`}
          </Text>
        </View>

        {/* Dernière boule */}
        {lastBall !== undefined && (
          <View style={styles.lastBallContainer}>
            <View style={[styles.lastBall, { backgroundColor: ballColor(lastBall) }]}>
              <Text style={styles.lastBallNumber}>{lastBall}</Text>
            </View>
            <Text style={styles.lastBallLabel}>Dernière boule</Text>
          </View>
        )}

        {/* Badges résultats */}
        <View style={styles.badgesRow}>
          <ResultBadge label="LIGNE"  active={checkResult.line}  color="#43A047" />
          <ResultBadge label="QUINE"  active={checkResult.quine} color="#FB8C00" />
          <ResultBadge label="BINGO!" active={checkResult.bingo} color="#E53935" />
        </View>

        {/* Carton de loto */}
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
                        isDrawn && { backgroundColor: ballColor(cell!), borderColor: 'transparent' },
                      ]}
                    >
                      {cell !== null && (
                        <Text style={[
                          styles.cartonCellText,
                          isDrawn && styles.cartonCellTextDrawn,
                        ]}>
                          {cell}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Bouton tirer */}
        {!gameOver && (
          <TouchableOpacity
            style={[styles.drawBtn, isLoading && styles.drawBtnDisabled]}
            onPress={drawBall}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" size="large" />
              : <Text style={styles.drawBtnText}>Tirer une boule 🔵</Text>
            }
          </TouchableOpacity>
        )}

        {/* Historique */}
        {ballsDrawn.length > 0 && (
          <>
            <Text style={styles.historyLabel}>Boules sorties ({ballsDrawn.length})</Text>
            <View style={styles.ballsHistory}>
              {ballsDrawn.map((b, i) => (
                <View key={i} style={[styles.historyBall, { backgroundColor: ballColor(b) }]}>
                  <Text style={styles.historyBallText}>{b}</Text>
                </View>
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

        {/* Espace pour Marcel */}
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Marcel en overlay flottant */}
      <Marcel
        visible={marcelVisible}
        mood={marcelMood}
        quote={marcelQuote}
        withBaguette={marcelBaguette}
        onDismiss={hideMarcel}
      />
    </View>
  );
}

// ── Composants ────────────────────────────────────────────────────────────────

function ResultBadge({ label, active, color }: {
  label: string; active: boolean; color: string;
}) {
  return (
    <View style={[styles.badge, active && { backgroundColor: color, borderColor: color }]}>
      <Text style={[styles.badgeText, active && { color: '#fff' }]}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  startContainer: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
    padding: Spacing.lg,
  },
  ballDecorRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.xl },
  ballDecor: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
    ...Shadow.card,
  },
  ballDecorText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  marcelCard: {
    backgroundColor: Colors.wood,
    borderRadius: Radius.lg,
    borderWidth: 2, borderColor: Colors.woodGrain,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    width: '100%',
    ...Shadow.card,
  },
  marcelMic: { fontSize: 40, marginBottom: Spacing.sm },
  marcelName: {
    fontSize: 12, fontWeight: '900', color: Colors.woodGrain,
    letterSpacing: 4, marginBottom: Spacing.sm,
  },
  marcelQuote: {
    fontSize: 17, color: Colors.parchment,
    textAlign: 'center', fontStyle: 'italic', lineHeight: 26,
  },

  startBtn: {
    backgroundColor: Colors.orange,
    borderRadius: Radius.lg,
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
  lastBall: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.25)',
    ...Shadow.card, shadowRadius: 14, shadowOpacity: 0.5,
  },
  lastBallNumber: { fontSize: 36, fontWeight: '900', color: '#fff' },
  lastBallLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 6, letterSpacing: 1 },

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
  cartonCellText: { fontSize: 16, fontWeight: '800', color: Colors.textDark },
  cartonCellTextDrawn: { color: '#fff' },

  drawBtn: {
    backgroundColor: Colors.orange,
    marginHorizontal: Spacing.lg, borderRadius: Radius.lg,
    paddingVertical: 20, alignItems: 'center',
    marginBottom: Spacing.lg, ...Shadow.card,
  },
  drawBtnDisabled: { opacity: 0.6 },
  drawBtnText: { fontSize: 22, fontWeight: '800', color: '#fff' },

  historyLabel: {
    fontSize: 13, fontWeight: '700', color: Colors.textMuted,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
  },
  ballsHistory: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 6, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg,
  },
  historyBall: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', ...Shadow.card,
  },
  historyBallText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  gameOverCard: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.woodMid,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.woodGrain,
    padding: Spacing.lg, alignItems: 'center',
  },
  gameOverText: { fontSize: 18, fontWeight: '700', color: Colors.parchment, textAlign: 'center' },
});
