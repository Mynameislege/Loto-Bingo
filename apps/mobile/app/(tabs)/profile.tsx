import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Switch,
} from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { usePremiumStore } from '@/stores/premiumStore';
import PremiumCard from '@/components/PremiumCard';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/components/ui/tokens';
import { api } from '@/services/api';

type Tab = 'profil' | 'reglages' | 'aide';

interface Stats {
  gamesPlayed: number;
  bingos: number;
  coupons: number;
  streakDays: number;
  level: number;
  xp: number;
  xpNext: number;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { configure: configurePremium, isPremium } = usePremiumStore();
  const [activeTab, setActiveTab] = useState<Tab>('profil');
  const [sounds, setSounds] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [stats, setStats] = useState<Stats>({
    gamesPlayed: 0, bingos: 0, coupons: 0,
    streakDays: 0, level: 1, xp: 0, xpNext: 100,
  });

  useEffect(() => {
    if (!user) return;
    api.get<Stats>('/auth/stats')
      .then(setStats)
      .catch(() => {}); // silencieux si API indisponible
    // Initialiser RevenueCat
    if (user.uid) configurePremium(user.uid).catch(() => {});
  }, [user, configurePremium]);

  const handleSignOut = () => {
    Alert.alert(
      'Se déconnecter',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const displayName = user?.displayName ?? 'Joueur';
  const email = user?.email ?? '';
  const initiale = displayName.charAt(0).toUpperCase();

  const { level, xp, xpNext, streakDays, gamesPlayed, bingos, coupons } = stats;

  return (
    <View style={styles.container}>
      {/* En-tête bois */}
      <View style={styles.woodHeader}>
        <View style={styles.woodHeaderInner}>
          <View>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{initiale}</Text>
            </View>
            {isPremium && (
              <View style={styles.premiumBadge}><Text style={styles.premiumBadgeTxt}>★ PREMIUM</Text></View>
            )}
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>
        {/* Bord bois bas */}
        <View style={styles.woodBorder} />
      </View>

      {/* Barre d'onglets */}
      <View style={styles.tabBar}>
        {(['profil', 'reglages', 'aide'] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab === 'profil' ? '👤 Profil' : tab === 'reglages' ? '⚙️ Réglages' : '❓ Aide'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenu */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* ── ONGLET PROFIL ── */}
        {activeTab === 'profil' && (
          <>
            {/* Stats */}
            <View style={styles.woodFrame}>
              <Text style={styles.woodFrameTitle}>⭐ Mes statistiques</Text>
              <View style={styles.statsGrid}>
                <StatBox icon="🏆" label="Niveau" value={`${level}`} color={Colors.gold} />
                <StatBox icon="⚡" label="XP" value={`${xp}/${xpNext}`} color={Colors.orange} />
                <StatBox icon="🔥" label="Série" value={`${streakDays}j`} color={Colors.red} />
                <StatBox icon="🔵" label="Parties" value={`${gamesPlayed}`} color={Colors.blue} />
                <StatBox icon="🎉" label="Bingos" value={`${bingos}`} color={Colors.success} />
                <StatBox icon="🎟" label="Coupons" value={`${coupons}`} color={Colors.purple} />
              </View>
            </View>

            {/* Barre XP */}
            <View style={styles.xpCard}>
              <View style={styles.xpHeader}>
                <Text style={styles.xpLabel}>Progression niveau {level}</Text>
                <Text style={styles.xpValue}>{xp} / {xpNext} XP</Text>
              </View>
              <View style={styles.xpBar}>
                <View style={[styles.xpFill, { width: `${Math.min((xp / xpNext) * 100, 100)}%` }]} />
              </View>
            </View>

            {/* Pass Premium */}
            <PremiumCard />

            {/* Compte */}
            <View style={styles.woodFrame}>
              <Text style={styles.woodFrameTitle}>👤 Mon compte</Text>
              <OptionRow icon="✏️" label="Modifier mon prénom" onPress={() =>
                Alert.alert('Bientôt disponible', 'Cette fonctionnalité arrive prochainement.')
              } />
              <OptionRow icon="🏅" label="Mes succès" onPress={() =>
                Alert.alert('Bientôt disponible', 'Débloquez des badges en jouant !')
              } />
              <OptionRow icon="📊" label="Historique des parties" onPress={() =>
                Alert.alert('Bientôt disponible', 'Vos dernières parties apparaîtront ici.')
              } />
            </View>

            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Text style={styles.signOutText}>🚪 Se déconnecter</Text>
            </TouchableOpacity>
            <Text style={styles.version}>Loto Seniors v0.1.0</Text>
          </>
        )}

        {/* ── ONGLET RÉGLAGES ── */}
        {activeTab === 'reglages' && (
          <>
            <View style={styles.woodFrame}>
              <Text style={styles.woodFrameTitle}>🔔 Notifications</Text>
              <ToggleRow
                icon="🔵"
                label="Rappel quotidien"
                sub="Loto du Jour à 10h"
                value={notifications}
                onToggle={setNotifications}
              />
            </View>

            <View style={styles.woodFrame}>
              <Text style={styles.woodFrameTitle}>🎮 Jeu</Text>
              <ToggleRow
                icon="🔊"
                label="Sons de Marcel"
                sub="Annonces vocales du présentateur"
                value={sounds}
                onToggle={setSounds}
              />
              <ToggleRow
                icon="💥"
                label="Effets sonores"
                sub="Boules et animations"
                value={sounds}
                onToggle={setSounds}
              />
            </View>

            <View style={styles.woodFrame}>
              <Text style={styles.woodFrameTitle}>♿ Accessibilité</Text>
              <OptionRow icon="🔤" label="Taille du texte" sub="Grand (18pt)" onPress={() =>
                Alert.alert('Bientôt disponible', 'Réglage de la taille du texte.')
              } />
              <OptionRow icon="🌗" label="Contraste élevé" onPress={() =>
                Alert.alert('Bientôt disponible', 'Mode contraste renforcé.')
              } />
            </View>
          </>
        )}

        {/* ── ONGLET AIDE ── */}
        {activeTab === 'aide' && (
          <>
            <View style={styles.woodFrame}>
              <Text style={styles.woodFrameTitle}>📖 Comment jouer ?</Text>
              <View style={styles.helpCard}>
                <HelpStep num="1" text="Lancez le Loto du Jour depuis l'accueil." />
                <HelpStep num="2" text="Votre carton s'affiche — il contient 15 numéros sur 3 lignes." />
                <HelpStep num="3" text="Appuyez sur « Tirer une boule » pour piger les numéros." />
                <HelpStep num="4" text="Marcel annonce chaque numéro — les vôtres s'allument en orange !" />
                <HelpStep num="5" text="Complétez une LIGNE, une QUINE (2 lignes) ou un BINGO (carton plein) pour gagner un coupon !" />
              </View>
            </View>

            <View style={styles.woodFrame}>
              <Text style={styles.woodFrameTitle}>🎟 Les coupons</Text>
              <Text style={styles.helpText}>
                Chaque BINGO vous rapporte un coupon offert par un commerçant local. Retrouvez vos coupons dans l'onglet{' '}
                <Text style={{ color: Colors.gold, fontWeight: '700' }}>Coupons</Text>
                {' '}et présentez-les en caisse pour profiter de votre réduction.
              </Text>
            </View>

            <View style={styles.woodFrame}>
              <Text style={styles.woodFrameTitle}>📞 Contact</Text>
              <OptionRow icon="💬" label="Nous écrire" onPress={() =>
                Alert.alert('Contact', 'Écrivez-nous à contact@lotoseniors.fr')
              } />
              <OptionRow icon="📋" label="Conditions d'utilisation" onPress={() => {}} />
              <OptionRow icon="🔒" label="Politique de confidentialité" onPress={() => {}} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Composants ───────────────────────────────────────────────

function StatBox({ icon, label, value, color }: {
  icon: string; label: string; value: string; color: string;
}) {
  return (
    <View style={[styles.statBox, { borderTopColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function OptionRow({ icon, label, sub, onPress }: {
  icon: string; label: string; sub?: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.optionRow} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.optionIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionLabel}>{label}</Text>
        {sub && <Text style={styles.optionSub}>{sub}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function ToggleRow({ icon, label, sub, value, onToggle }: {
  icon: string; label: string; sub?: string;
  value: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.optionRow}>
      <Text style={styles.optionIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionLabel}>{label}</Text>
        {sub && <Text style={styles.optionSub}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.woodMid, true: Colors.orange }}
        thumbColor={Colors.parchment}
      />
    </View>
  );
}

function HelpStep({ num, text }: { num: string; text: string }) {
  return (
    <View style={styles.helpStep}>
      <View style={styles.helpNum}>
        <Text style={styles.helpNumText}>{num}</Text>
      </View>
      <Text style={styles.helpStepText}>{text}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // En-tête bois
  woodHeader: {
    backgroundColor: Colors.wood,
    paddingTop: 56,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 0,
  },
  woodHeaderInner: {
    alignItems: 'center',
    paddingBottom: Spacing.lg,
  },
  woodBorder: {
    height: 6,
    backgroundColor: Colors.woodGrain,
    marginHorizontal: -Spacing.lg,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.woodMid,
    borderWidth: 3, borderColor: Colors.woodGrain,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  avatarLetter: { fontSize: 36, fontWeight: '800', color: Colors.parchment },
  name: { fontSize: 22, fontWeight: '700', color: Colors.parchment, marginBottom: 2 },
  email: { fontSize: 14, color: Colors.textWood },

  // Barre d'onglets
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.woodMid,
    borderBottomWidth: 2,
    borderBottomColor: Colors.woodGrain,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabItemActive: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.orange,
    backgroundColor: Colors.wood,
  },
  tabLabel: { fontSize: 14, fontWeight: '600', color: Colors.textWood },
  tabLabelActive: { color: Colors.parchment },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 40 },

  // Cadre bois
  woodFrame: {
    backgroundColor: Colors.woodMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.woodGrain,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadow.card,
  },
  woodFrameTitle: {
    fontSize: 17, fontWeight: '700', color: Colors.parchment,
    backgroundColor: Colors.wood,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.woodGrain,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    padding: Spacing.sm, gap: 8,
  },
  statBox: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: Colors.wood,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    alignItems: 'center',
    borderTopWidth: 3,
  },
  statIcon: { fontSize: 24, marginBottom: 2 },
  statValue: { fontSize: 20, fontWeight: '800', marginBottom: 1 },
  statLabel: { fontSize: 12, color: Colors.textWood, fontWeight: '600' },

  // XP
  xpCard: {
    backgroundColor: Colors.woodMid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.woodGrain,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpLabel: { fontSize: 15, fontWeight: '600', color: Colors.parchment },
  xpValue: { fontSize: 15, fontWeight: '700', color: Colors.gold },
  xpBar: {
    height: 10, backgroundColor: Colors.wood,
    borderRadius: 5, overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: Colors.orange,
    borderRadius: 5,
  },

  // Options
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.wood,
  },
  optionIcon: { fontSize: 20, marginRight: Spacing.md, width: 28 },
  optionLabel: { fontSize: 17, color: Colors.parchment, fontWeight: '500' },
  optionSub: { fontSize: 13, color: Colors.textWood, marginTop: 2 },
  chevron: { fontSize: 22, color: Colors.woodGrain },

  // Aide
  helpCard: { padding: Spacing.md },
  helpStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  helpNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.orange,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12, marginTop: 1,
    flexShrink: 0,
  },
  helpNumText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  helpStepText: { fontSize: 16, color: Colors.parchment, flex: 1, lineHeight: 22 },
  helpText: {
    fontSize: 16, color: Colors.parchment, lineHeight: 24,
    padding: Spacing.md,
  },

  // Déconnexion
  signOutBtn: {
    borderWidth: 2, borderColor: Colors.error,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  signOutText: { fontSize: 18, fontWeight: '700', color: Colors.error },
  version: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },
  premiumBadge: {
    position: 'absolute', bottom: -6, left: '50%',
    transform: [{ translateX: -32 }],
    backgroundColor: Colors.gold, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  premiumBadgeTxt: { fontSize: 10, fontWeight: '900', color: Colors.navy, letterSpacing: 0.5 },
});
