import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { Colors, Spacing, Radius, Shadow } from '@/components/ui/tokens';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { card, startDailyGame } = useGameStore();
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const displayName = user?.displayName ?? 'Joueur';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  // Vérifier si la partie du jour est déjà en cours (store Zustand persisté)
  useEffect(() => {
    if (card) setAlreadyPlayed(true);
    else setAlreadyPlayed(false);
  }, [card]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

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
          <Text style={styles.greeting}>{greeting}, <Text style={styles.greetingName}>{displayName}</Text> !</Text>
        </View>
      </View>
      <View style={styles.woodBorder} />

      {/* ── Concept intro ────────────────────────────── */}
      <View style={styles.conceptCard}>
        <Text style={styles.conceptTitle}>🎙 Qu'est-ce que Loto Seniors ?</Text>
        <Text style={styles.conceptBody}>
          Loto Seniors est un jeu de loto gratuit animé par{' '}
          <Text style={styles.conceptHighlight}>Marcel</Text>, votre présentateur attitré.
          Chaque jour, jouez votre partie, et si vous faites{' '}
          <Text style={styles.conceptHighlight}>BINGO</Text>, vous remportez un coupon de réduction
          offert par un commerçant de votre quartier !
        </Text>
        <View style={styles.conceptSteps}>
          <ConceptPill icon="🔵" text="Jouez" />
          <Text style={styles.conceptArrow}>→</Text>
          <ConceptPill icon="🏆" text="Faites BINGO" />
          <Text style={styles.conceptArrow}>→</Text>
          <ConceptPill icon="🎟" text="Gagnez un coupon" />
        </View>
      </View>

      {/* ── Loto du Jour — CTA principal ─────────────── */}
      <TouchableOpacity
        style={[styles.dailyCard, alreadyPlayed && styles.dailyCardPlayed]}
        onPress={() => router.push('/(tabs)/game')}
        accessibilityLabel={alreadyPlayed ? 'Reprendre la partie' : 'Jouer au Loto du Jour'}
        activeOpacity={0.85}
      >
        {/* Décor boules */}
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
        <ModeCard icon="👥" title="Multijoueur" desc="Jouez avec d'autres" onPress={() => router.push('/(tabs)/game')} />
        <ModeCard icon="👨‍👩‍👧" title="Famille" desc="Invitez vos proches" onPress={() => router.push('/(tabs)/game')} />
        <ModeCard icon="⭐" title="Campagne" desc="Progressez par niveaux" onPress={() => router.push('/(tabs)/game')} />
        <ModeCard icon="🎯" title="Mode Libre" desc="Sans contrainte" onPress={() => router.push('/(tabs)/game')} />
      </View>

      {/* ── Astuce du jour ───────────────────────────── */}
      <View style={styles.tipCard}>
        <Text style={styles.tipIcon}>💡</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.tipTitle}>Le saviez-vous ?</Text>
          <Text style={styles.tipText}>
            Jouez chaque jour pour maintenir votre série et débloquer des bonus ! Une série de 7 jours double vos chances de coupon.
          </Text>
        </View>
      </View>

    </ScrollView>
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

function ModeCard({ icon, title, desc, onPress }: {
  icon: string; title: string; desc: string; onPress: () => void;
}) {
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

  // Header bois
  woodHeader: {
    backgroundColor: Colors.wood,
    paddingTop: 56,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  woodBorder: { height: 5, backgroundColor: Colors.woodGrain },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  lotoBalls: { fontSize: 40 },
  appName: { fontSize: 26, fontWeight: '900', color: Colors.parchment, letterSpacing: 0.5 },
  tagline: { fontSize: 14, color: Colors.textWood, marginTop: 2 },
  greetingBox: {
    backgroundColor: Colors.woodMid,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  greeting: { fontSize: 17, color: Colors.parchment },
  greetingName: { fontWeight: '700', color: Colors.goldLight },

  // Concept
  conceptCard: {
    backgroundColor: Colors.woodMid,
    margin: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.woodGrain,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  conceptTitle: { fontSize: 16, fontWeight: '700', color: Colors.woodGrain, marginBottom: Spacing.sm },
  conceptBody: { fontSize: 16, color: Colors.parchment, lineHeight: 24, marginBottom: Spacing.md },
  conceptHighlight: { fontWeight: '800', color: Colors.orange },
  conceptSteps: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 4,
    flexWrap: 'wrap',
  },
  conceptPill: {
    backgroundColor: Colors.wood,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.woodGrain,
    paddingHorizontal: 10, paddingVertical: 6,
    alignItems: 'center',
  },
  conceptPillIcon: { fontSize: 18 },
  conceptPillText: { fontSize: 12, fontWeight: '700', color: Colors.parchment },
  conceptArrow: { fontSize: 16, color: Colors.woodGrain, marginHorizontal: 2 },

  // Loto du jour
  dailyCard: {
    backgroundColor: Colors.wood,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 2, borderColor: Colors.gold,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow.card,
  },
  dailyCardPlayed: {
    borderColor: Colors.woodGrain,
    opacity: 0.9,
  },
  ballRow: {
    flexDirection: 'row', gap: 8, marginBottom: Spacing.md,
  },
  ballEmoji: { fontSize: 24 },
  dailyLabel: {
    fontSize: 12, fontWeight: '900', letterSpacing: 3,
    color: Colors.gold, marginBottom: 4,
  },
  dailyTitle: {
    fontSize: 26, fontWeight: '800', color: Colors.parchment,
    textAlign: 'center', marginBottom: 6,
  },
  dailySub: {
    fontSize: 15, color: Colors.textWood,
    textAlign: 'center', marginBottom: Spacing.lg,
  },
  dailyBtn: {
    backgroundColor: Colors.orange,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
  },
  dailyBtnText: { fontSize: 20, fontWeight: '700', color: '#fff' },

  // Modes
  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: Colors.textWood,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginHorizontal: Spacing.lg, gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  modeCard: {
    backgroundColor: Colors.woodMid,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.woodGrain,
    padding: Spacing.md,
    width: '47.5%',
    alignItems: 'center',
    ...Shadow.card,
  },
  modeIcon: { fontSize: 32, marginBottom: 6 },
  modeTitle: { fontSize: 16, fontWeight: '700', color: Colors.parchment, marginBottom: 2 },
  modeDesc: { fontSize: 13, color: Colors.textWood, textAlign: 'center' },

  // Astuce
  tipCard: {
    flexDirection: 'row',
    backgroundColor: Colors.navy,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderLeftWidth: 4, borderLeftColor: Colors.gold,
    padding: Spacing.md,
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  tipIcon: { fontSize: 28, marginTop: 2 },
  tipTitle: { fontSize: 15, fontWeight: '700', color: Colors.gold, marginBottom: 4 },
  tipText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
});
