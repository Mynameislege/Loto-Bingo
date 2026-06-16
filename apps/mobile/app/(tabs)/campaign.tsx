/**
 * Onglet Campagne — Mode XP uniquement
 * Progression libre, pas de coupons, gain d'XP et déblocage de récompenses.
 */
import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Spacing, Radius, Shadow, Typography } from '@/components/ui/tokens';

// Niveaux de la campagne
const CAMPAIGN_LEVELS = [
  { level: 1, name: 'Débutant',     xpRequired: 0,    reward: 'Accès à la Campagne', icon: '🌱' },
  { level: 2, name: 'Apprenti',     xpRequired: 100,  reward: 'Avatar exclusif',      icon: '🎯' },
  { level: 3, name: 'Régulier',     xpRequired: 300,  reward: '+1 Coupon bonus/mois', icon: '⭐' },
  { level: 4, name: 'Confirmé',     xpRequired: 600,  reward: 'Fond de carton doré',  icon: '🏆' },
  { level: 5, name: 'Expert',       xpRequired: 1000, reward: 'Badge Champion',        icon: '👑' },
  { level: 6, name: 'Légendaire',   xpRequired: 2000, reward: 'Coupon VIP mensuel',    icon: '💎' },
];

const XP_PER_BALL  = 1;   // 1 XP par boule tirée en Campagne
const XP_PER_LINE  = 10;
const XP_PER_QUINE = 25;
const XP_PER_BINGO = 60;

export default function CampaignScreen() {
  const { user } = useAuthStore();
  const [xp, setXp] = useState(0);         // TODO: fetch from API
  const [loading, setLoading] = useState(false);

  const currentLevelData = [...CAMPAIGN_LEVELS].reverse().find(l => xp >= l.xpRequired) ?? CAMPAIGN_LEVELS[0]!;
  const nextLevelData    = CAMPAIGN_LEVELS.find(l => l.xpRequired > xp);
  const progressToNext   = nextLevelData
    ? (xp - currentLevelData.xpRequired) / (nextLevelData.xpRequired - currentLevelData.xpRequired)
    : 1;

  async function handleStartCampaign() {
    if (!user) return;
    setLoading(true);
    try {
      const _token = await user.getIdToken();
      // TODO: lancer une partie Campaign via l'API (mode 'campaign')
      Alert.alert(
        '🚀 Campagne — Bientôt disponible',
        'Le mode Campagne est en cours de développement. Revenez très bientôt !',
        [{ text: 'OK' }],
      );
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚔️ Campagne</Text>
        <Text style={styles.headerSub}>Progressez, montez de niveau, débloquez des récompenses</Text>
      </View>

      {/* Niveau actuel */}
      <View style={styles.levelCard}>
        <Text style={styles.levelIcon}>{currentLevelData.icon}</Text>
        <View style={styles.levelInfo}>
          <Text style={styles.levelName}>{currentLevelData.name}</Text>
          <Text style={styles.levelXP}>{xp} XP total</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>Niv. {currentLevelData.level}</Text>
        </View>
      </View>

      {/* Barre de progression */}
      {nextLevelData && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.round(progressToNext * 100)}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {xp - currentLevelData.xpRequired} / {nextLevelData.xpRequired - currentLevelData.xpRequired} XP
            {' '}→ {nextLevelData.name}
          </Text>
        </View>
      )}

      {/* Comment gagner de l'XP */}
      <View style={styles.xpCard}>
        <Text style={styles.xpTitle}>Comment gagner de l'XP ?</Text>
        <XpRow icon="ellipse" label="Boule tirée"          xp={XP_PER_BALL}  color={Colors.orange} />
        <XpRow icon="remove"  label="LIGNE complétée"      xp={XP_PER_LINE}  color="#43A047" />
        <XpRow icon="reorder-three" label="QUINE obtenue"  xp={XP_PER_QUINE} color="#FB8C00" />
        <XpRow icon="trophy"  label="BINGO !"              xp={XP_PER_BINGO} color="#E53935" />
        <Text style={styles.xpNote}>
          ✨ En Campagne, pas de limite de parties — jouez autant que vous voulez !
        </Text>
      </View>

      {/* Niveaux */}
      <Text style={styles.levelsTitle}>Niveaux & Récompenses</Text>
      {CAMPAIGN_LEVELS.map(lvl => {
        const unlocked = xp >= lvl.xpRequired;
        const isCurrent = lvl.level === currentLevelData.level;
        return (
          <View key={lvl.level} style={[styles.lvlRow, isCurrent && styles.lvlRowActive, !unlocked && styles.lvlRowLocked]}>
            <Text style={styles.lvlIcon}>{unlocked ? lvl.icon : '🔒'}</Text>
            <View style={styles.lvlInfo}>
              <Text style={[styles.lvlName, !unlocked && styles.lvlNameLocked]}>
                Niv. {lvl.level} — {lvl.name}
              </Text>
              <Text style={styles.lvlReward}>{lvl.reward}</Text>
            </View>
            <Text style={styles.lvlXpReq}>{lvl.xpRequired > 0 ? `${lvl.xpRequired} XP` : 'Dispo'}</Text>
          </View>
        );
      })}

      {/* CTA */}
      <TouchableOpacity
        style={[styles.playBtn, loading && { opacity: 0.6 }]}
        onPress={handleStartCampaign}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : (
            <View style={styles.playBtnInner}>
              <Ionicons name="play-circle" size={28} color="#fff" />
              <Text style={styles.playBtnText}>Lancer une partie Campagne</Text>
            </View>
          )
        }
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function XpRow({ icon, label, xp, color }: { icon: string; label: string; xp: number; color: string }) {
  return (
    <View style={styles.xpRow}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={color} />
      <Text style={styles.xpRowLabel}>{label}</Text>
      <Text style={[styles.xpRowValue, { color }]}>+{xp} XP</Text>
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
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.parchment },
  headerSub:   { fontSize: 13, color: Colors.textWood, marginTop: 4 },

  levelCard: {
    margin: Spacing.lg, marginBottom: 0,
    backgroundColor: Colors.wood, borderRadius: Radius.lg,
    borderWidth: 2, borderColor: Colors.woodGrain,
    padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    ...Shadow.card,
  },
  levelIcon: { fontSize: 40 },
  levelInfo: { flex: 1 },
  levelName: { fontSize: 18, fontWeight: '800', color: Colors.parchment },
  levelXP:   { fontSize: 13, color: Colors.textWood, marginTop: 2 },
  levelBadge: {
    backgroundColor: Colors.orange, borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  levelBadgeText: { fontSize: 14, fontWeight: '900', color: '#fff' },

  progressSection: { marginHorizontal: Spacing.lg, marginTop: Spacing.md },
  progressBar: {
    height: 8, backgroundColor: Colors.woodMid,
    borderRadius: 4, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: Colors.orange, borderRadius: 4,
  },
  progressLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 6, textAlign: 'right' },

  xpCard: {
    margin: Spacing.lg, marginTop: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, ...Shadow.card,
  },
  xpTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.woodMid },
  xpRowLabel: { flex: 1, ...Typography.body, color: Colors.text },
  xpRowValue: { fontSize: 16, fontWeight: '900' },
  xpNote: { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', marginTop: Spacing.md, lineHeight: 20 },

  levelsTitle: { fontSize: 15, fontWeight: '800', color: Colors.textMuted, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  lvlRow: {
    marginHorizontal: Spacing.lg, marginBottom: 8,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: 'transparent',
  },
  lvlRowActive: { borderColor: Colors.orange, backgroundColor: Colors.woodMid },
  lvlRowLocked: { opacity: 0.5 },
  lvlIcon: { fontSize: 28, width: 36, textAlign: 'center' },
  lvlInfo: { flex: 1 },
  lvlName: { fontSize: 14, fontWeight: '800', color: Colors.text },
  lvlNameLocked: { color: Colors.textMuted },
  lvlReward: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  lvlXpReq: { fontSize: 13, fontWeight: '700', color: Colors.orange },

  playBtn: {
    marginHorizontal: Spacing.lg, marginTop: Spacing.lg,
    backgroundColor: Colors.orange, borderRadius: Radius.lg,
    paddingVertical: 20, alignItems: 'center', ...Shadow.card,
  },
  playBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playBtnText: { fontSize: 18, fontWeight: '800', color: '#fff' },
});
