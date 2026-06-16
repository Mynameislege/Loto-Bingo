import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { useStreakStore } from '@/stores/streakStore';
import { Colors, Spacing, Radius, Shadow } from '@/components/ui/tokens';
import SeasonalBanner from '@/components/SeasonalBanner';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { card }  = useGameStore();
  const {
    currentStreak, bestStreak, totalGames,
    milestones, hydrate,
  } = useStreakStore();

  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const displayName = user?.displayName ?? 'Joueur';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  useEffect(() => { hydrate(); }, []);
  useEffect(() => { setAlreadyPlayed(card !== null); }, [card]);

  // Jalons récents (débloqués dans les 3 derniers jours)
  const recentMilestones = milestones.filter(m => {
    if (!m.unlockedAt) return false;
    return (Date.now() - new Date(m.unlockedAt).getTime()) < 3 * 86400000;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Bandeau saisonnier ───────────────────────── */}
      <SeasonalBanner />

      {/* ── En-tête bois ─────────────────────────────── */}
      <View style={styles.woodHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.lotoBalls}>🔵</Text>
          <View>
            <Text style={styles.appName}>Loto Seniors</Text>
            <Text style={styles.tagline}>Le loto du quartier, chaque jour</Text>
          </View>
        </View>
        <View style={styles.greetingBox}>
          <Text style={styles.greeting}>
            {greeting}, <Text style={styles.greetingName}>{displayName}</Text> !
          </Text>
        </View>
      </View>
      <View style={styles.woodBorder} />

      {/* ── Streak & Stats ───────────────────────────── */}
      <View style={styles.statsRow}>
        <StatChip icon="🔥" value={currentStreak.toString()} label="Jours de suite" color={currentStreak >= 7 ? Colors.orange : Colors.gold} />
        <StatChip icon="🏆" value={bestStreak.toString()} label="Meilleure série" color={Colors.gold} />
        <StatChip icon="🎯" value={totalGames.toString()} label="Parties jouées" color={Colors.orange} />
      </View>

      {/* Message streak */}
      {currentStreak >= 7 && (
        <View style={styles.streakBanner}>
          <Text style={styles.streakBannerText}>
            🔥 Série de {currentStreak} jours — vous êtes en feu !
          </Text>
        </View>
      )}
      {currentStreak === 0 && totalGames > 0 && (
        <View style={[styles.streakBanner, { backgroundColor: Colors.navy }]}>
          <Text style={styles.streakBannerText}>
            💙 Pas de panique — jouez aujourd'hui pour relancer votre série !
          </Text>
        </View>
      )}

      {/* ── Jalons récents ───────────────────────────── */}
      {recentMilestones.length > 0 && (
        <View style={styles.milestonesCard}>
          <Text style={styles.milestonesTitle}>🎖 Nouveau jalon !</Text>
          {recentMilestones.map(m => (
            <View key={m.id} style={styles.milestoneRow}>
              <Text style={styles.milestoneIcon}>{m.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.milestoneLabel}>{m.label}</Text>
                <Text style={styles.milestoneQuote}>« {m.marcelQuote} »</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── Loto du Jour — CTA principal ─────────────── */}
      <TouchableOpacity
        style={[styles.dailyCard, alreadyPlayed && styles.dailyCardPlayed]}
        onPress={() => router.push('/(tabs)/game')}
        accessibilityLabel={alreadyPlayed ? 'Reprendre la partie' : 'Jouer au Loto du Jour'}
        activeOpacity={0.85}
      >
        <View style={styles.ballRow}>
          {['🔴','🔵','🟡','🟢','🟣'].map((b, i) => (
            <Text key={i} style={styles.ballEmoji}>{b}</Text>
          ))}
        </View>
        <Text style={styles.dailyLabel}>LOTO DU JOUR</Text>
        <Text style={styles.dailyTitle}>
          {alreadyPlayed ? 'Partie en cours !' : "C'est l'heure de jouer !"}
        </Text>
        <Text style={styles.dailySub}>
          {alreadyPlayed
            ? 'Marcel vous attend pour continuer...'
            : 'Marcel vous attend — 1 partie gratuite par jour'}
        </Text>
        <View style={[styles.dailyBtn, alreadyPlayed && { backgroundColor: Colors.gold }]}>
          <Text style={styles.dailyBtnText}>
            {alreadyPlayed ? '▶  Reprendre la partie' : '🔵  Lancer la partie'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* ── Modes de jeu ─────────────────────────────── */}
      <Text style={styles.sectionTitle}>Autres modes de jeu</Text>
      <View style={styles.grid}>
        <ModeCard icon="👥" title="Multijoueur" desc="Jouez avec d'autres"      onPress={() => router.push('/(tabs)/multiplayer')} />
        <ModeCard icon="👨‍👩‍👧" title="Famille"     desc="Invitez vos proches"    onPress={() => router.push('/(tabs)/multiplayer')} />
        <ModeCard icon="⭐" title="Campagne"    desc="Progressez par niveaux"   onPress={() => router.push('/(tabs)/campaign')} />
        <ModeCard icon="♾️" title="Mode Libre"  desc="Sans contrainte ni coupon" onPress={() => router.push('/(tabs)/mode-libre')} />
      </View>

      {/* ── Jalons à débloquer ───────────────────────── */}
      <Text style={styles.sectionTitle}>Vos jalons</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 10 }}>
        {milestones.map(m => (
          <View key={m.id} style={[styles.milestoneChip, m.unlockedAt && styles.milestoneChipUnlocked]}>
            <Text style={styles.milestoneChipIcon}>{m.icon}</Text>
            <Text style={[styles.milestoneChipLabel, !m.unlockedAt && { color: Colors.textMuted }]}>{m.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* ── Astuce du jour ───────────────────────────── */}
      <View style={styles.tipCard}>
        <Text style={styles.tipIcon}>💡</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.tipTitle}>Le saviez-vous ?</Text>
          <Text style={styles.tipText}>
            Votre série est pardonnable ! Si vous ratez 1 ou 2 jours, Marcel vous attend sans pénalité.
            Au bout de 3 jours sans jouer seulement, la série recommence à zéro.
          </Text>
        </View>
      </View>

    </ScrollView>
  );
}

function StatChip({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ConceptPill({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.conceptPill}>
      <Text style={styles.conceptPillIcon}>{icon}</Text>
      <Text style={styles.conceptPillText}>{text}</Text>
    </View>
  );
}

function ModeCard({ icon, title, desc, onPress }: { icon: string; title: string; desc: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.modeCard} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.modeIcon}>{icon}</Text>
      <Text style={styles.modeTitle}>{title}</Text>
      <Text style={styles.modeDesc}>{desc}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },

  woodHeader: { backgroundColor: Colors.wood, paddingTop: 56, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  woodBorder: { height: 5, backgroundColor: Colors.woodGrain },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.md },
  lotoBalls: { fontSize: 40 },
  appName: { fontSize: 26, fontWeight: '900', color: Colors.parchment, letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: Colors.textWood, marginTop: 2 },
  greetingBox: { backgroundColor: Colors.woodMid, borderRadius: Radius.md, paddingVertical: 10, paddingHorizontal: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.gold },
  greeting: { fontSize: 17, color: Colors.parchment },
  greetingName: { fontWeight: '700', color: Colors.goldLight },

  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.sm },
  statChip: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', ...Shadow.card },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  statLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },

  streakBanner: { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, backgroundColor: 'rgba(240,128,0,0.15)', borderRadius: Radius.md, padding: Spacing.sm, borderLeftWidth: 3, borderLeftColor: Colors.orange },
  streakBannerText: { fontSize: 14, fontWeight: '700', color: Colors.orange },

  milestonesCard: { margin: Spacing.lg, marginBottom: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, ...Shadow.card, borderLeftWidth: 4, borderLeftColor: Colors.gold },
  milestonesTitle: { fontSize: 15, fontWeight: '900', color: Colors.gold, marginBottom: Spacing.md },
  milestoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: Spacing.sm },
  milestoneIcon: { fontSize: 28, width: 36 },
  milestoneLabel: { fontSize: 15, fontWeight: '800', color: Colors.text },
  milestoneQuote: { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', marginTop: 2, lineHeight: 18 },

  milestoneChip: { backgroundColor: Colors.woodMid, borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', minWidth: 90, opacity: 0.5 },
  milestoneChipUnlocked: { backgroundColor: Colors.surface, opacity: 1, borderWidth: 2, borderColor: Colors.gold, ...Shadow.card },
  milestoneChipIcon: { fontSize: 26, marginBottom: 4 },
  milestoneChipLabel: { fontSize: 11, fontWeight: '700', color: Colors.gold, textAlign: 'center' },

  dailyCard: { backgroundColor: Colors.wood, marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, borderRadius: Radius.lg, borderWidth: 2, borderColor: Colors.gold, padding: Spacing.xl, alignItems: 'center', ...Shadow.card },
  dailyCardPlayed: { borderColor: Colors.woodGrain, opacity: 0.9 },
  ballRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  ballEmoji: { fontSize: 24 },
  dailyLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 3, color: Colors.gold, marginBottom: 4 },
  dailyTitle: { fontSize: 26, fontWeight: '800', color: Colors.parchment, textAlign: 'center', marginBottom: 6 },
  dailySub: { fontSize: 15, color: Colors.textWood, textAlign: 'center', marginBottom: Spacing.lg },
  dailyBtn: { backgroundColor: Colors.orange, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: 14 },
  dailyBtnText: { fontSize: 20, fontWeight: '700', color: '#fff' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textWood, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.lg },
  modeCard: { backgroundColor: Colors.woodMid, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.woodGrain, padding: Spacing.md, width: '47.5%', alignItems: 'center', ...Shadow.card },
  modeIcon: { fontSize: 32, marginBottom: 6 },
  modeTitle: { fontSize: 16, fontWeight: '700', color: Colors.parchment, marginBottom: 2 },
  modeDesc: { fontSize: 13, color: Colors.textWood, textAlign: 'center' },

  conceptPill: { backgroundColor: Colors.wood, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.woodGrain, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  conceptPillIcon: { fontSize: 18 },
  conceptPillText: { fontSize: 12, fontWeight: '700', color: Colors.parchment },

  tipCard: { flexDirection: 'row', backgroundColor: Colors.navy, marginHorizontal: Spacing.lg, borderRadius: Radius.md, borderLeftWidth: 4, borderLeftColor: Colors.gold, padding: Spacing.md, gap: Spacing.md, alignItems: 'flex-start' },
  tipIcon: { fontSize: 28, marginTop: 2 },
  tipTitle: { fontSize: 15, fontWeight: '700', color: Colors.gold, marginBottom: 4 },
  tipText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
});
