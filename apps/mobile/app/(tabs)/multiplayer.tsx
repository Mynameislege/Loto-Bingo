/**
 * Onglet Multijoueur
 * Partie publique (matchmaking) ou salle famille (code d'invitation).
 */
import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Spacing, Radius, Shadow, Typography } from '@/components/ui/tokens';

type View_ = 'menu' | 'public' | 'family_create' | 'family_join' | 'waiting';

export default function MultiplayerScreen() {
  const { user } = useAuthStore();
  const [view, setView] = useState<View_>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);

  async function handleJoinPublic() {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/room/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode: 'multiplayer_public' }),
      });
      const data = await res.json() as { roomCode?: string; players?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur');
      setPlayers(data.players ?? []);
      setRoomCode(data.roomCode ?? '');
      setView('waiting');
    } catch (e: unknown) {
      Alert.alert('Impossible de rejoindre', e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFamily() {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/room/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode: 'multiplayer_family' }),
      });
      const data = await res.json() as { roomCode?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur');
      setRoomCode(data.roomCode ?? '');
      setPlayers([user.displayName ?? 'Vous']);
      setView('waiting');
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
      setPlayers(data.players ?? []);
      setView('waiting');
    } catch (e: unknown) {
      Alert.alert('Impossible de rejoindre', e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // ── Vue principale ─────────────────────────────────────────────────────────
  if (view === 'menu') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎮 Multijoueur</Text>
          <Text style={styles.headerSub}>Jouez en temps réel contre d'autres joueurs</Text>
        </View>

        {/* Partie publique */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="globe-outline" size={24} color={Colors.orange} />
            <Text style={styles.sectionTitle}>Partie Publique</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Rejoignez une partie avec d'autres joueurs en ligne. Matchmaking automatique — la partie commence dès que la salle est complète (2 à 6 joueurs).
          </Text>
          <View style={styles.infoRow}>
            <InfoChip icon="people" label="2–6 joueurs" />
            <InfoChip icon="ticket" label="Coupon au 1er BINGO" />
            <InfoChip icon="flash" label="Matchmaking rapide" />
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
            onPress={handleJoinPublic}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Trouver une partie →</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Salle Famille */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="home-outline" size={24} color={Colors.gold} />
            <Text style={styles.sectionTitle}>Salle Famille</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Créez une salle privée et invitez vos proches avec un code à 6 lettres. Jouez ensemble à votre rythme.
          </Text>
          <View style={styles.infoRow}>
            <InfoChip icon="people" label="Jusqu'à 6 joueurs" />
            <InfoChip icon="gift" label="Coupons à partager" />
            <InfoChip icon="lock-closed" label="Salle privée" />
          </View>
          <View style={styles.familyBtns}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { flex: 1, marginRight: 8 }]}
              onPress={handleCreateFamily}
              disabled={loading}
            >
              <Text style={styles.secondaryBtnText}>Créer une salle</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { flex: 1, marginLeft: 0 }]}
              onPress={() => setView('family_join')}
            >
              <Text style={styles.primaryBtnText}>Rejoindre</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ── Rejoindre salle famille ────────────────────────────────────────────────
  if (view === 'family_join') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setView('menu')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.parchment} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rejoindre une salle</Text>
        </View>
        <View style={styles.joinCard}>
          <Text style={styles.joinLabel}>Code de la salle (6 lettres)</Text>
          <TextInput
            style={styles.codeInput}
            value={roomCode}
            onChangeText={t => setRoomCode(t.toUpperCase().slice(0, 6))}
            placeholder="ex : ABCD12"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
            maxLength={6}
            keyboardType="default"
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

  // ── Salle d'attente ────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setView('menu')} style={styles.backBtn}>
          <Ionicons name="close" size={22} color={Colors.parchment} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Salle d'attente</Text>
      </View>

      <View style={styles.waitingCard}>
        {roomCode ? (
          <>
            <Text style={styles.codeLabel}>Code de la salle</Text>
            <Text style={styles.codeDisplay}>{roomCode}</Text>
            <Text style={styles.codeHint}>Partagez ce code avec vos proches</Text>
          </>
        ) : null}

        <View style={styles.playersSection}>
          <Text style={styles.playersTitle}>Joueurs ({players.length}/6)</Text>
          {players.map((p, i) => (
            <View key={i} style={styles.playerRow}>
              <Ionicons name="person-circle" size={32} color={Colors.orange} />
              <Text style={styles.playerName}>{p}</Text>
              {i === 0 && <View style={styles.hostBadge}><Text style={styles.hostText}>Hôte</Text></View>}
            </View>
          ))}
        </View>

        <View style={styles.waitingIndicator}>
          <ActivityIndicator color={Colors.orange} size="small" />
          <Text style={styles.waitingText}>En attente de joueurs…</Text>
        </View>

        <Text style={styles.waitingHint}>La partie démarrera automatiquement</Text>
      </View>
    </View>
  );
}

function InfoChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={14} color={Colors.orange} />
      <Text style={styles.chipText}>{label}</Text>
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
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.parchment, flex: 1 },
  headerSub: { fontSize: 13, color: Colors.textWood, marginTop: 4 },

  section: {
    margin: Spacing.lg,
    marginBottom: 0,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  sectionDesc: { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.md, lineHeight: 22 },

  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.lg },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.woodMid, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  chipText: { fontSize: 12, color: Colors.parchment, fontWeight: '600' },

  familyBtns: { flexDirection: 'row', gap: 8 },

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

  joinCard: { margin: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, ...Shadow.card },
  joinLabel: { fontSize: 14, fontWeight: '700', color: Colors.textMuted, marginBottom: Spacing.sm },
  codeInput: {
    backgroundColor: Colors.woodMid, borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: 16,
    fontSize: 28, fontWeight: '900', color: Colors.parchment,
    textAlign: 'center', letterSpacing: 8,
    borderWidth: 2, borderColor: Colors.woodGrain,
    marginBottom: Spacing.lg,
  },

  waitingCard: { margin: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, ...Shadow.card, alignItems: 'center' },
  codeLabel: { fontSize: 13, color: Colors.textMuted, marginBottom: 6 },
  codeDisplay: { fontSize: 40, fontWeight: '900', color: Colors.orange, letterSpacing: 8, marginBottom: 4 },
  codeHint: { fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.xl },

  playersSection: { width: '100%', marginBottom: Spacing.lg },
  playersTitle: { fontSize: 14, fontWeight: '700', color: Colors.textMuted, marginBottom: Spacing.sm },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.woodMid },
  playerName: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1 },
  hostBadge: { backgroundColor: Colors.orange, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  hostText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  waitingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  waitingText: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic' },
  waitingHint: { fontSize: 12, color: Colors.textMuted },
});
