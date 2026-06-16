/**
 * Onglet Multijoueur — Loto Seniors
 * Spec vision produit v6 :
 *  - 10 joueurs total (réels + fantômes)
 *  - Matchmaking garanti < 15 s : T+0 clic, T+10 fantômes, T+15 premier tirage
 *  - Coupon UNIQUEMENT au 1er Bingo
 *  - Salle Famille : code d'invitation, chat vocal WebRTC (à venir)
 */
import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Spacing, Radius, Shadow, Typography } from '@/components/ui/tokens';

const GHOST_NAMES = [
  'Jean-Pierre', 'Marie-Hélène', 'Colette', 'Roger', 'Germaine',
  'Marcel', 'Yvette', 'René', 'Louisette', 'Gaston',
  'Simone', 'André', 'Madeleine', 'Fernand', 'Odette',
  'Bernard', 'Huguette', 'Gérard', 'Monique', 'Raymond',
];

function pickGhosts(count: number, exclude: string): string[] {
  const pool = GHOST_NAMES.filter(n => n !== exclude);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

interface Player {
  name: string;
  isGhost: boolean;
  isHost?: boolean;
  hasLine?: boolean;
  hasQuine?: boolean;
  hasBingo?: boolean;
}

type Screen = 'menu' | 'family_join' | 'waiting_public' | 'waiting_family' | 'in_game';

const TOTAL_PLAYERS    = 10;
const GHOST_FILL_DELAY = 10_000;
const GAME_START_DELAY = 15_000;

export default function MultiplayerScreen() {
  const { user } = useAuthStore();
  const [screen, setScreen] = useState<Screen>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [bingoWinner, setBingoWinner] = useState<string | null>(null);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fillGhostTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (fillGhostTimer.current) clearTimeout(fillGhostTimer.current);
    if (startTimer.current) clearTimeout(startTimer.current);
  }

  useEffect(() => () => clearTimers(), []);

  function handleJoinPublic() {
    if (!user) return;
    const myName = user.displayName ?? 'Vous';
    setPlayers([{ name: myName, isGhost: false, isHost: true }]);
    setScreen('waiting_public');
    setCountdown(15);

    let c = 15;
    countdownRef.current = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0 && countdownRef.current) clearInterval(countdownRef.current);
    }, 1000);

    fillGhostTimer.current = setTimeout(() => {
      setPlayers(prev => {
        const realCount = prev.filter(p => !p.isGhost).length;
        const ghostCount = TOTAL_PLAYERS - realCount;
        const ghosts = pickGhosts(ghostCount, myName).map(name => ({ name, isGhost: true }));
        return [...prev, ...ghosts];
      });
    }, GHOST_FILL_DELAY);

    startTimer.current = setTimeout(() => {
      setScreen('in_game');
    }, GAME_START_DELAY);
  }

  async function handleCreateFamily() {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/room/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode: 'multiplayer_family', maxPlayers: TOTAL_PLAYERS }),
      });
      const data = await res.json() as { roomCode?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur');
      setRoomCode(data.roomCode ?? '');
      setPlayers([{ name: user.displayName ?? 'Vous', isGhost: false, isHost: true }]);
      setScreen('waiting_family');
    } catch (e: unknown) {
      Alert.alert('Impossible de créer la salle', e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinFamily() {
    if (!user || !roomCode.trim()) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/room/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode: 'multiplayer_family', roomCode: roomCode.trim().toUpperCase() }),
      });
      const data = await res.json() as { players?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Salle introuvable');
      setPlayers((data.players ?? []).map((name, i) => ({ name, isGhost: false, isHost: i === 0 })));
      setScreen('waiting_family');
    } catch (e: unknown) {
      Alert.alert('Impossible de rejoindre', e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function handleLeave() {
    clearTimers();
    setScreen('menu');
    setPlayers([]);
    setRoomCode('');
    setCountdown(null);
    setBingoWinner(null);
  }

  // ── Menu principal ───────────────────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Multijoueur</Text>
          <Text style={styles.headerSub}>10 joueurs · Matchmaking garanti en moins de 15 secondes</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="globe-outline" size={26} color={Colors.orange} />
            <Text style={styles.cardTitle}>Partie Publique</Text>
          </View>
          <Text style={styles.cardDesc}>
            Rejoignez une salle avec d'autres joueurs ou des joueurs fantômes. La partie démarre toujours en moins de 15 secondes, à 10 joueurs.
          </Text>
          <View style={styles.chips}>
            <Chip icon="people"   label="10 joueurs" />
            <Chip icon="flash"    label="Moins de 15 s" />
            <Chip icon="ticket"   label="Coupon au 1er Bingo" />
            <Chip icon="person"   label="Fantômes si nécessaire" />
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
            onPress={handleJoinPublic}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>Trouver une partie</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="home-outline" size={26} color={Colors.gold} />
            <Text style={styles.cardTitle}>Salle Famille</Text>
          </View>
          <Text style={styles.cardDesc}>
            Créez une salle privée et invitez vos proches avec un code de 6 lettres. Chat vocal inclus (bientôt disponible).
          </Text>
          <View style={styles.chips}>
            <Chip icon="people"      label="Jusqu'à 10 joueurs" />
            <Chip icon="lock-closed" label="Salle privée" />
            <Chip icon="mic"         label="Chat vocal (bientôt)" />
            <Chip icon="gift"        label="Coupons à partager" />
          </View>
          <View style={styles.familyBtns}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { flex: 1 }]}
              onPress={handleCreateFamily}
              disabled={loading}
            >
              <Text style={styles.secondaryBtnText}>Créer une salle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { flex: 1 }]}
              onPress={() => setScreen('family_join')}
            >
              <Text style={styles.primaryBtnText}>Rejoindre</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.ghostNote}>
          <Text style={styles.ghostNoteTitle}>Les joueurs fantômes</Text>
          <Text style={styles.ghostNoteText}>
            Pour garantir une partie à 10 toujours en moins de 15 secondes, les places vides sont comblées par des joueurs fantômes — de vrais prénoms de seniors français (Jean-Pierre, Colette, Marie…) simulés par le serveur.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ── Rejoindre salle famille ─────────────────────────────────────────────────
  if (screen === 'family_join') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleLeave} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.parchment} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rejoindre une salle</Text>
        </View>
        <View style={[styles.card, { margin: Spacing.lg }]}>
          <Text style={styles.inputLabel}>Code de la salle (6 lettres)</Text>
          <TextInput
            style={styles.codeInput}
            value={roomCode}
            onChangeText={t => setRoomCode(t.toUpperCase().slice(0, 6))}
            placeholder="ex : ABCD12"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
            maxLength={6}
          />
          <TouchableOpacity
            style={[styles.primaryBtn, (!roomCode || loading) && { opacity: 0.5 }]}
            onPress={handleJoinFamily}
            disabled={!roomCode || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Rejoindre la salle</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Salle d'attente publique ────────────────────────────────────────────────
  if (screen === 'waiting_public') {
    const totalSoFar = players.length;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleLeave} style={styles.backBtn}>
            <Ionicons name="close" size={22} color={Colors.parchment} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Matchmaking…</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: 16 }}>
          {countdown !== null && countdown > 0 && (
            <View style={styles.countdownCard}>
              <Text style={styles.countdownNumber}>{countdown}</Text>
              <Text style={styles.countdownLabel}>secondes avant le début</Text>
              {totalSoFar < TOTAL_PLAYERS && (
                <Text style={styles.countdownSub}>Recherche de joueurs… {totalSoFar}/{TOTAL_PLAYERS}</Text>
              )}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Joueurs ({totalSoFar}/{TOTAL_PLAYERS})</Text>
            {players.map((p, i) => (
              <View key={i} style={styles.playerRow}>
                <Ionicons
                  name={p.isGhost ? 'person-outline' : 'person-circle'}
                  size={28}
                  color={p.isGhost ? Colors.textMuted : Colors.orange}
                />
                <Text style={[styles.playerName, p.isGhost && { color: Colors.textMuted }]}>
                  {p.name}
                </Text>
                {p.isHost && <View style={styles.hostBadge}><Text style={styles.hostText}>Hôte</Text></View>}
                {p.isGhost && <Text style={styles.ghostLabel}>fantôme</Text>}
              </View>
            ))}
            {Array.from({ length: TOTAL_PLAYERS - totalSoFar }).map((_, i) => (
              <View key={`empty_${i}`} style={[styles.playerRow, { opacity: 0.3 }]}>
                <Ionicons name="ellipse-outline" size={28} color={Colors.textMuted} />
                <Text style={[styles.playerName, { color: Colors.textMuted }]}>En attente…</Text>
              </View>
            ))}
          </View>

          <View style={[styles.card, { backgroundColor: 'rgba(200,160,0,0.08)' }]}>
            <Text style={[styles.cardTitle, { color: Colors.gold }]}>Règles</Text>
            <Text style={styles.ruleText}>Le coupon va au 1er joueur qui fait Bingo</Text>
            <Text style={styles.ruleText}>Ligne et Quine donnent de l'XP à tous</Text>
            <Text style={styles.ruleText}>Les fantômes jouent comme des humains</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Salle d'attente famille ─────────────────────────────────────────────────
  if (screen === 'waiting_family') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleLeave} style={styles.backBtn}>
            <Ionicons name="close" size={22} color={Colors.parchment} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Salle Famille</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: 16 }}>
          <View style={styles.codeCard}>
            <Text style={styles.codeLabelTop}>Code de la salle</Text>
            <Text style={styles.codeDisplay}>{roomCode}</Text>
            <Text style={styles.codeHint}>Partagez ce code avec votre famille</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Joueurs ({players.length}/{TOTAL_PLAYERS})</Text>
            {players.map((p, i) => (
              <View key={i} style={styles.playerRow}>
                <Ionicons name="person-circle" size={28} color={Colors.orange} />
                <Text style={styles.playerName}>{p.name}</Text>
                {p.isHost && <View style={styles.hostBadge}><Text style={styles.hostText}>Hôte</Text></View>}
              </View>
            ))}
          </View>

          <View style={[styles.card, { backgroundColor: 'rgba(26,55,108,0.25)' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="mic-outline" size={22} color={Colors.navy} />
              <Text style={[styles.cardTitle, { color: Colors.navy }]}>Chat vocal</Text>
            </View>
            <Text style={[styles.cardDesc, { fontSize: 13 }]}>
              Le chat vocal WebRTC entre membres de la Salle Famille arrive prochainement.
            </Text>
          </View>

          {players.length > 0 && (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setScreen('in_game')}>
              <Text style={styles.primaryBtnText}>Lancer la partie ({players.length} joueurs)</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── En jeu ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Partie en cours</Text>
        <Text style={styles.headerSub}>{players.length} joueurs · Coupon au 1er Bingo</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: 16 }}>
        {bingoWinner ? (
          <View style={styles.winnerCard}>
            <Text style={styles.winnerEmoji}>🎉</Text>
            <Text style={styles.winnerTitle}>BINGO !</Text>
            <Text style={styles.winnerName}>{bingoWinner} remporte le coupon !</Text>
            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 20 }]} onPress={handleLeave}>
              <Text style={styles.primaryBtnText}>Retour au menu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.card, { alignItems: 'center', gap: 12 }]}>
              <ActivityIndicator color={Colors.orange} size="large" />
              <Text style={[styles.cardTitle, { textAlign: 'center' }]}>Connexion à la partie…</Text>
              <Text style={[styles.cardDesc, { textAlign: 'center' }]}>
                Le mode multijoueur temps réel (Socket.io) est en cours de déploiement.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Joueurs</Text>
              {players.map((p, i) => (
                <View key={i} style={styles.playerRow}>
                  <Ionicons
                    name={p.isGhost ? 'person-outline' : 'person-circle'}
                    size={24}
                    color={p.isGhost ? Colors.textMuted : Colors.orange}
                  />
                  <Text style={[styles.playerName, p.isGhost && { color: Colors.textMuted }]}>{p.name}</Text>
                  <View style={styles.statusRow}>
                    {p.hasLine  && <StatusBadge label="L" color="#43A047" />}
                    {p.hasQuine && <StatusBadge label="Q" color="#FB8C00" />}
                    {p.hasBingo && <StatusBadge label="B!" color="#E53935" />}
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleLeave}>
              <Text style={styles.secondaryBtnText}>Quitter la partie</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={13} color={Colors.orange} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.statusBadge, { backgroundColor: color }]}>
      <Text style={styles.statusText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 60 },

  header: {
    backgroundColor: Colors.wood,
    paddingTop: 52, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg,
    borderBottomWidth: 3, borderBottomColor: Colors.woodGrain,
    flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.parchment, flex: 1 },
  headerSub: { fontSize: 13, color: Colors.textWood, width: '100%' },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, gap: 10, ...Shadow.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  cardDesc: { ...Typography.body, color: Colors.textMuted, lineHeight: 22, fontSize: 15 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.woodMid, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  chipText: { fontSize: 12, color: Colors.parchment, fontWeight: '600' },

  familyBtns: { flexDirection: 'row', gap: 10 },

  primaryBtn: {
    backgroundColor: Colors.orange, borderRadius: Radius.lg,
    paddingVertical: 16, alignItems: 'center', ...Shadow.card,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  secondaryBtn: {
    backgroundColor: Colors.woodMid, borderRadius: Radius.lg,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.woodGrain,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '700', color: Colors.parchment },

  ghostNote: {
    margin: Spacing.lg, marginTop: 0,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.woodGrain,
  },
  ghostNoteTitle: { fontSize: 14, fontWeight: '800', color: Colors.textMuted, marginBottom: 6 },
  ghostNoteText: { fontSize: 13, color: Colors.textMuted, lineHeight: 19 },

  inputLabel: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  codeInput: {
    backgroundColor: Colors.woodMid, borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: 16,
    fontSize: 28, fontWeight: '900', color: Colors.parchment,
    textAlign: 'center', letterSpacing: 8,
    borderWidth: 2, borderColor: Colors.woodGrain,
  },

  countdownCard: {
    backgroundColor: Colors.wood, borderRadius: Radius.lg,
    padding: Spacing.xl, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.orange, ...Shadow.card,
  },
  countdownNumber: { fontSize: 72, fontWeight: '900', color: Colors.orange, lineHeight: 80 },
  countdownLabel: { fontSize: 16, color: Colors.parchment, fontWeight: '600' },
  countdownSub: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },

  playerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.woodMid,
  },
  playerName: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.text },
  hostBadge: { backgroundColor: Colors.orange, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  hostText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  ghostLabel: { fontSize: 11, color: Colors.textMuted, fontStyle: 'italic' },
  ruleText: { fontSize: 14, color: Colors.parchment, lineHeight: 22 },

  codeCard: {
    backgroundColor: Colors.wood, borderRadius: Radius.lg,
    padding: Spacing.xl, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.gold, ...Shadow.card,
  },
  codeLabelTop: { fontSize: 13, color: Colors.textMuted, marginBottom: 4 },
  codeDisplay: { fontSize: 40, fontWeight: '900', color: Colors.orange, letterSpacing: 8 },
  codeHint: { fontSize: 12, color: Colors.textMuted, marginTop: 6 },

  winnerCard: {
    backgroundColor: Colors.wood, borderRadius: Radius.lg,
    padding: Spacing.xl, alignItems: 'center',
    borderWidth: 3, borderColor: Colors.gold, ...Shadow.card,
  },
  winnerEmoji: { fontSize: 60, marginBottom: 8 },
  winnerTitle: { fontSize: 42, fontWeight: '900', color: Colors.orange, letterSpacing: 4 },
  winnerName: { fontSize: 18, fontWeight: '700', color: Colors.parchment, marginTop: 8, textAlign: 'center' },

  statusRow: { flexDirection: 'row', gap: 4 },
  statusBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '900', color: '#fff' },
});
