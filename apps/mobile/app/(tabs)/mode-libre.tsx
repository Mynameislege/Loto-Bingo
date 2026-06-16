import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Alert,
} from 'react-native';
import { generateCard, generateBallSequence, drawNextBall, checkCard } from '@loto-seniors/game-engine';
import type { Card, CheckResult } from '@loto-seniors/game-engine';
import { Colors, Spacing, Radius, Shadow } from '@/components/ui/tokens';
import Marcel, { type MarcelMood, pickQuote } from '@/components/Marcel';
import ConfettiBingo from '@/components/ConfettiBingo';
import { useSound } from '@/hooks/useSound';

// ── Boules B/I/N/G/O (même spec que game.tsx) ────────────────────────────────
interface BallSpec { letter: string; bg: string; bg2: string; border: string; textColor: string; bandColor: string; }
function getBallSpec(n: number): BallSpec {
  if (n <= 18) return { letter: 'B', bg: '#E53935', bg2: '#B71C1C', border: '#8B0000', textColor: '#fff', bandColor: 'rgba(255,255,255,0.92)' };
  if (n <= 36) return { letter: 'I', bg: '#1E88E5', bg2: '#0D47A1', border: '#083180', textColor: '#fff', bandColor: 'rgba(255,255,255,0.92)' };
  if (n <= 54) return { letter: 'N', bg: '#F5F5F5', bg2: '#BDBDBD', border: '#9E9E9E', textColor: '#212121', bandColor: 'rgba(100,100,100,0.15)' };
  if (n <= 72) return { letter: 'G', bg: '#43A047', bg2: '#1B5E20', border: '#0A3D0A', textColor: '#fff', bandColor: 'rgba(255,255,255,0.92)' };
  return             { letter: 'O', bg: '#FB8C00', bg2: '#E65100', border: '#BF360C', textColor: '#fff', bandColor: 'rgba(255,255,255,0.92)' };
}

function LotoBall({ number, size = 44 }: { number: number; size?: number }) {
  const spec = getBallSpec(number);
  const bandH = size * 0.38; const shineW = size * 0.26; const shineH = size * 0.18;
  const letterSize = size < 44 ? 8 : size > 80 ? 22 : 11;
  const numSize    = size < 44 ? 11 : size > 80 ? 32 : 16;
  const bandTop    = (size - bandH) / 2;
  return (
    <View style={[ballS.outer, { width: size, height: size, borderRadius: size / 2, backgroundColor: spec.bg, borderColor: spec.border, shadowColor: spec.bg2 }]}>
      <View style={[ballS.band, { top: bandTop, height: bandH, backgroundColor: spec.bandColor }]} />
      <View style={[ballS.shine1, { width: shineW, height: shineH, top: size * 0.12, left: size * 0.18 }]} />
      <View style={[ballS.shine2, { width: shineW * 0.6, height: shineH * 0.6, top: size * 0.28, left: size * 0.55 }]} />
      <View style={ballS.content}>
        <Text style={[ballS.letter, { fontSize: letterSize, color: spec.textColor }]}>{spec.letter}</Text>
        <Text style={[ballS.number, { fontSize: numSize, color: spec.textColor }]}>{number}</Text>
      </View>
    </View>
  );
}

const ballS = StyleSheet.create({
  outer: { justifyContent: 'center', alignItems: 'center', borderWidth: 2, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 6, overflow: 'hidden' },
  band: { position: 'absolute', left: 0, right: 0 },
  shine1: { position: 'absolute', borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.55)' },
  shine2: { position: 'absolute', borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.3)' },
  content: { alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  letter: { fontWeight: '900', lineHeight: 14 },
  number: { fontWeight: '900', lineHeight: 18, marginTop: -2 },
});

// ── XP libre ──────────────────────────────────────────────────────────────────
const XP_BALL = 1; const XP_LINE = 15; const XP_QUINE = 40; const XP_BINGO = 100;

// ── Carton ────────────────────────────────────────────────────────────────────
function CardGrid({ card, drawn, result }: { card: Card; drawn: number[]; result: CheckResult }) {
  const drawnSet = new Set(drawn);
  const completedRows = card.map(row => row.filter((c): c is number => c !== null).every(n => drawnSet.has(n)));

  return (
    <View style={cs.grid}>
      {card.map((row, ri) => (
        <View key={ri} style={[cs.row, completedRows[ri] && cs.rowComplete]}>
          {row.map((cell, ci) => {
            const hit = cell !== null && drawnSet.has(cell);
            return (
              <View key={ci} style={[cs.cell, cell === null && cs.cellBlank, hit && cs.cellHit]}>
                {cell !== null && (
                  hit
                    ? <LotoBall number={cell} size={30} />
                    : <Text style={cs.cellNum}>{cell}</Text>
                )}
              </View>
            );
          })}
        </View>
      ))}
      {result.bingo && <View style={cs.bingoBanner}><Text style={cs.bingoText}>🎉 BINGO !</Text></View>}
      {!result.bingo && result.quine && <View style={[cs.bingoBanner, { backgroundColor: '#FB8C00' }]}><Text style={cs.bingoText}>✨ QUINE !</Text></View>}
      {!result.bingo && !result.quine && result.line && <View style={[cs.bingoBanner, { backgroundColor: '#43A047' }]}><Text style={cs.bingoText}>👍 LIGNE !</Text></View>}
    </View>
  );
}

const cs = StyleSheet.create({
  grid: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.surface, ...Shadow.card },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.woodMid },
  rowComplete: { backgroundColor: 'rgba(67,160,71,0.15)' },
  cell: { flex: 1, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: Colors.woodMid },
  cellBlank: { backgroundColor: Colors.woodMid, opacity: 0.3 },
  cellHit: { backgroundColor: 'rgba(240,128,0,0.12)' },
  cellNum: { fontSize: 14, fontWeight: '700', color: Colors.text },
  bingoBanner: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(229,57,53,0.85)', borderRadius: Radius.md },
  bingoText: { fontSize: 36, fontWeight: '900', color: '#fff' },
});

// ── Screen principal ───────────────────────────────────────────────────────────
const COUNTDOWN_SECS = 4;

export default function ModeLibreScreen() {
  const [card, setCard]         = useState<Card | null>(null);
  const [sequence, setSequence] = useState<number[]>([]);
  const [drawn, setDrawn]       = useState<number[]>([]);
  const [result, setResult]     = useState<CheckResult>({ line: false, quine: false, bingo: false });
  const [sessionXp, setSessionXp] = useState(0);
  const [totalXp, setTotalXp]   = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted]   = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);

  // Marcel
  const [marcelMsg, setMarcelMsg]   = useState<string | null>(null);
  const [marcelMood, setMarcelMood] = useState<MarcelMood>('neutral');
  const [marcelVisible, setMarcelVisible] = useState(false);
  const marcelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { play, playAmbience, stopAmbience } = useSound();
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Résultats de la partie précédente pour le message Marcel entre parties
  const prevResult = useRef<CheckResult>({ line: false, quine: false, bingo: false });

  function showMarcel(msg: string, mood: MarcelMood, ms = 4000) {
    if (marcelTimer.current) clearTimeout(marcelTimer.current);
    setMarcelMsg(msg); setMarcelMood(mood); setMarcelVisible(true);
    marcelTimer.current = setTimeout(() => setMarcelVisible(false), ms);
  }

  // Démarrer une partie
  function startGame() {
    const newCard = generateCard();
    const newSeq  = generateBallSequence();
    setCard(newCard);
    setSequence(newSeq);
    setDrawn([]);
    setResult({ line: false, quine: false, bingo: false });
    setSessionXp(0);
    setGameOver(false);
    setStarted(true);
    setCountdown(COUNTDOWN_SECS);
    playAmbience();

    const intro = prevResult.current.bingo
      ? pickQuote('opening')
      : prevResult.current.line
        ? 'Et on repart pour une nouvelle partie !'
        : 'Allez, on essaie encore — la chance est capricieuse !'
    showMarcel(intro, 'neutral', 5000);
  }

  // Tirage auto
  useEffect(() => {
    if (!started || gameOver) return;
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { drawOneBall(); return COUNTDOWN_SECS; }
        return c - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, gameOver, drawn.length]);

  const drawOneBall = useCallback(() => {
    if (!card || gameOver) return;
    const nextBall = drawNextBall(sequence, drawn.length);
    if (nextBall === null) { endGame(); return; }

    const newDrawn  = [...drawn, nextBall];
    const newResult = checkCard(card, newDrawn);
    const xp        = XP_BALL
      + (newResult.bingo && !result.bingo ? XP_BINGO : 0)
      + (newResult.quine && !result.quine ? XP_QUINE : 0)
      + (newResult.line  && !result.line  ? XP_LINE  : 0);

    setDrawn(newDrawn);
    setResult(newResult);
    setSessionXp(s => s + xp);
    play('ball_draw');

    // Marcel
    if (newResult.bingo && !result.bingo) {
      play('bingo');
      showMarcel(pickQuote('celebration'), 'celebration', 6000);
      setTotalXp(t => t + sessionXp + xp);
      prevResult.current = newResult;
      endGame();
    } else if (newResult.quine && !result.quine) {
      play('quine');
      showMarcel('✨ QUINE ! Encore un effort !', 'happy', 4000);
    } else if (newResult.line && !result.line) {
      play('line');
      showMarcel(pickQuote('tension'), 'happy', 3500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, drawn, sequence, result, gameOver, sessionXp, play]);

  function endGame() {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setGameOver(true);
    setStarted(false);
    stopAmbience();
  }

  function handleDrawManual() {
    if (!started || gameOver) return;
    if (countdownRef.current) clearInterval(countdownRef.current);
    drawOneBall();
  }

  // ── Écran menu ──────────────────────────────────────────────────────────────
  if (!started && !gameOver && !card) {
    return (
      <ScrollView style={st.container} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={st.header}>
          <Text style={st.headerTitle}>Mode Libre 🎯</Text>
          <Text style={st.headerSub}>Jouez sans limite · XP uniquement · Aucun coupon</Text>
        </View>

        <View style={st.infoCard}>
          <Text style={st.infoTitle}>Comment ça marche ?</Text>
          <InfoRow icon="♾️" label="Parties illimitées — jouez autant que vous voulez" />
          <InfoRow icon="⚡" label={`+${XP_BALL} XP par boule · +${XP_LINE} Ligne · +${XP_QUINE} Quine · +${XP_BINGO} Bingo`} />
          <InfoRow icon="🎙" label="Marcel anime chaque partie" />
          <InfoRow icon="🚫" label="Pas de coupon — c'est réservé au Loto du Jour" />
        </View>

        {totalXp > 0 && (
          <View style={st.xpBanner}>
            <Text style={st.xpBannerLabel}>XP gagnés en Mode Libre</Text>
            <Text style={st.xpBannerValue}>{totalXp} XP</Text>
          </View>
        )}

        <TouchableOpacity style={st.startBtn} onPress={startGame} activeOpacity={0.85}>
          <Text style={st.startBtnText}>🎯  Lancer une partie</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Fin de partie ───────────────────────────────────────────────────────────
  if (gameOver && card) {
    return (
      <ScrollView style={st.container} contentContainerStyle={{ paddingBottom: 60 }}>
        {result.bingo && <ConfettiBingo />}
        <View style={st.header}>
          <Text style={st.headerTitle}>
            {result.bingo ? '🎉 BINGO !' : result.quine ? '✨ Quine !' : result.line ? '👍 Ligne !' : 'Partie terminée'}
          </Text>
          <Text style={st.headerSub}>{sessionXp} XP gagnés cette partie</Text>
        </View>

        <Marcel visible mood={result.bingo ? 'celebration' : 'neutral'}
          message={
            result.bingo ? 'MAGNIFIQUE ! Un vrai champion du Libre !' :
            result.quine ? 'Belle quine ! Vous progressez bien.' :
            result.line  ? 'Une belle ligne — la prochaine ce sera le bingo !' :
            'Ce n'est pas pour cette fois... Mais vous revenez, n'est-ce pas ?'
          } />

        <View style={st.resultCard}>
          <Text style={st.resultXp}>+{sessionXp} XP</Text>
          <Text style={st.resultTotal}>Total : {totalXp + sessionXp} XP en Mode Libre</Text>
        </View>

        <CardGrid card={card} drawn={drawn} result={result} />

        <TouchableOpacity style={st.startBtn} onPress={startGame} activeOpacity={0.85}>
          <Text style={st.startBtnText}>🔄  Rejouer</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Partie en cours ─────────────────────────────────────────────────────────
  if (!card) return null;
  const lastBall = drawn[drawn.length - 1] ?? null;

  return (
    <ScrollView style={st.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={st.header}>
        <Text style={st.headerTitle}>Mode Libre</Text>
        <View style={st.headerRow}>
          <Text style={st.headerSub}>{drawn.length} boules · {sessionXp} XP</Text>
          <TouchableOpacity onPress={() => { Alert.alert('Abandonner ?', 'La partie sera perdue.', [{ text: 'Annuler' }, { text: 'Abandonner', style: 'destructive', onPress: endGame }]); }}>
            <Text style={st.abandonBtn}>✕ Abandonner</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Marcel visible={marcelVisible} mood={marcelMood} message={marcelMsg ?? ''} />

      {/* Dernière boule tirée */}
      {lastBall !== null && (
        <View style={st.lastBallSection}>
          <Text style={st.lastBallLabel}>Dernière boule</Text>
          <LotoBall number={lastBall} size={88} />
        </View>
      )}

      {/* Carton */}
      <CardGrid card={card} drawn={drawn} result={result} />

      {/* Résultats en cours */}
      <View style={st.resultsRow}>
        <ResultChip label="LIGNE"  active={result.line}  color="#43A047" />
        <ResultChip label="QUINE"  active={result.quine} color="#FB8C00" />
        <ResultChip label="BINGO"  active={result.bingo} color="#E53935" />
      </View>

      {/* Tirage */}
      <View style={st.drawSection}>
        <TouchableOpacity style={st.drawBtn} onPress={handleDrawManual} activeOpacity={0.85}>
          <Text style={st.drawBtnText}>Tirer une boule</Text>
        </TouchableOpacity>
        <Text style={st.timerHint}>⏱ Tirage automatique dans {countdown}s</Text>
      </View>

      {/* Historique */}
      <Text style={st.historyLabel}>Boules tirées ({drawn.length})</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.historyScroll} contentContainerStyle={st.historyContent}>
        {[...drawn].reverse().map((n, i) => <LotoBall key={i} number={n} size={36} />)}
      </ScrollView>
    </ScrollView>
  );
}

function InfoRow({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={st.infoRow}>
      <Text style={st.infoIcon}>{icon}</Text>
      <Text style={st.infoLabel}>{label}</Text>
    </View>
  );
}

function ResultChip({ label, active, color }: { label: string; active: boolean; color: string }) {
  return (
    <View style={[st.chip, active && { backgroundColor: color, borderColor: color }]}>
      <Text style={[st.chipText, active && { color: '#fff' }]}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.wood, paddingTop: 52, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, borderBottomWidth: 3, borderBottomColor: Colors.woodGrain },
  headerTitle: { fontSize: 24, fontWeight: '900', color: Colors.parchment },
  headerSub: { fontSize: 13, color: Colors.textWood, marginTop: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  abandonBtn: { fontSize: 13, color: '#ef5350', fontWeight: '700' },

  infoCard: { margin: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.card },
  infoTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  infoIcon: { fontSize: 20, width: 28 },
  infoLabel: { flex: 1, fontSize: 14, color: Colors.textMuted, lineHeight: 20 },

  xpBanner: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.woodMid, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', borderLeftWidth: 4, borderLeftColor: Colors.gold },
  xpBannerLabel: { fontSize: 13, color: Colors.textWood },
  xpBannerValue: { fontSize: 28, fontWeight: '900', color: Colors.gold },

  startBtn: { marginHorizontal: Spacing.lg, marginTop: Spacing.md, backgroundColor: Colors.orange, borderRadius: Radius.lg, paddingVertical: 20, alignItems: 'center', ...Shadow.card },
  startBtnText: { fontSize: 20, fontWeight: '800', color: '#fff' },

  resultCard: { margin: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', ...Shadow.card },
  resultXp: { fontSize: 36, fontWeight: '900', color: Colors.orange },
  resultTotal: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },

  lastBallSection: { alignItems: 'center', paddingVertical: Spacing.lg },
  lastBallLabel: { fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.sm, fontWeight: '700', letterSpacing: 1 },

  resultsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  chip: { borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 2, borderColor: Colors.woodMid },
  chipText: { fontWeight: '900', fontSize: 13, color: Colors.textMuted, letterSpacing: 1 },

  drawSection: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  drawBtn: { backgroundColor: Colors.orange, borderRadius: Radius.lg, paddingVertical: 18, alignItems: 'center', ...Shadow.card },
  drawBtnText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  timerHint: { textAlign: 'center', color: Colors.textMuted, fontSize: 13, marginTop: Spacing.sm },

  historyLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  historyScroll: { marginBottom: Spacing.lg },
  historyContent: { paddingHorizontal: Spacing.lg, gap: 8 },
});
