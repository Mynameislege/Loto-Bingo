/**
 * Onglet Campagne — Mode XP + Étoiles uniquement (JAMAIS de coupons)
 * 6 paliers inspirés de la vision produit v6 :
 *   Le Village → La Commune → La Préfecture → La Région → La Capitale → Le Champion
 * 
 * Progression persistée via campaignStore (API + fallback local).
 */
import { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useCampaignStore } from '@/stores/campaignStore';
import { generateCard, generateBallSequence, drawNextBall, checkCard } from '@loto-seniors/game-engine';
import { Colors, Spacing, Radius, Shadow, Typography } from '@/components/ui/tokens';

// ── Paliers Campagne (vision produit v6) ─────────────────────────────────────
const PALIERS = [
  { id:'village',    name:'Le Village',    levels:'1–5',   icon:'🏡', objectif:'Ligne',  ballLimit:75, color:'#4CAF50', dark:'#2E7D32', xpMin:0,     xpMax:500,      rewardDesc:'Badge Village + étoiles de progression' },
  { id:'commune',    name:'La Commune',    levels:'6–15',  icon:'🏘', objectif:'Ligne',  ballLimit:65, color:'#2196F3', dark:'#0D47A1', xpMin:500,   xpMax:1500,     rewardDesc:'Badge Commune + avatar exclusif' },
  { id:'prefecture', name:'La Préfecture', levels:'16–30', icon:'🏛', objectif:'Quine',  ballLimit:85, color:'#9C27B0', dark:'#4A148C', xpMin:1500,  xpMax:3000,     rewardDesc:'Badge Préfecture + fond de carton doré' },
  { id:'region',     name:'La Région',     levels:'31–50', icon:'🗺', objectif:'Quine',  ballLimit:75, color:'#FF9800', dark:'#E65100', xpMin:3000,  xpMax:6000,     rewardDesc:'Badge Région + titre personnalisé' },
  { id:'capitale',   name:'La Capitale',   levels:'51–80', icon:'🏙', objectif:'Bingo',  ballLimit:88, color:'#F44336', dark:'#B71C1C', xpMin:6000,  xpMax:12000,    rewardDesc:'Badge Capitale + animation spéciale' },
  { id:'champion',   name:'Le Champion',   levels:'81+',   icon:'👑', objectif:'Bingo',  ballLimit:80, color:'#C8A000', dark:'#8B6000', xpMin:12000, xpMax:Infinity, rewardDesc:'Titre Champion + statut légendaire' },
] as const;

function getPalier(xp: number) {
  return [...PALIERS].reverse().find(p => xp >= p.xpMin) ?? PALIERS[0];
}

export default function CampaignScreen() {
  const { user } = useAuthStore();
  const {
    xp, stars, level, gamesPlayed, loading, error,
    loadCampaign, recordGame,
  } = useCampaignStore();

  const palier      = getPalier(xp);
  const nextPalier  = PALIERS.find(p => p.xpMin > xp);
  const progressPct = nextPalier
    ? (xp - palier.xpMin) / (nextPalier.xpMin - palier.xpMin)
    : 1;

  // Charger la progression au montage
  useEffect(() => {
    if (!user) return;
    user.getIdToken().then(t => loadCampaign(t)).catch(() => {});
  }, [user, loadCampaign]);

  const handleStart = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      // Partie rapide : carton + séquence locale
      const card = generateCard();
      const sequence = generateBallSequence();
      let drawn: number[] = [];
      let result: ReturnType<typeof checkCard> = { line:false, quine:false, bingo:false };
      const currentPalier = getPalier(xp);

      for (let i = 0; i < currentPalier.ballLimit; i++) {
        const ball = drawNextBall(sequence, drawn);
        if (ball === null) break;
        drawn = [...drawn, ball];
        result = checkCard(card, drawn);
        if (result.bingo) break;
        if (result.quine && currentPalier.objectif === 'Quine') break;
        if (result.line  && currentPalier.objectif === 'Ligne')  break;
      }

      const campaignResult =
        result.bingo ? 'bingo' :
        result.quine ? 'quine' :
        result.line  ? 'line'  : 'none';

      const earned = await recordGame(token, campaignResult, drawn.length);

      const msgs: Record<string, string> = {
        bingo: `🎉 BINGO ! +${earned} XP`,
        quine: `✨ Quine ! +${earned} XP`,
        line:  `👍 Ligne ! +${earned} XP`,
        none:  `+${earned} XP (boules tirées)`,
      };
      Alert.alert('Partie terminée', msgs[campaignResult] ?? `+${earned} XP`, [{ text:'OK' }]);
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : String(e));
    }
  }, [user, xp, recordGame]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Campagne Solo</Text>
        <Text style={styles.headerSub}>XP et étoiles — progressez à votre rythme</Text>
      </View>

      {/* Palier actuel */}
      <View style={[styles.palierCard, { borderColor: palier.color }]}>
        <Text style={styles.palierIcon}>{palier.icon}</Text>
        <View style={styles.palierInfo}>
          <Text style={styles.palierName}>{palier.name}</Text>
          <Text style={styles.palierLevels}>Niv. {level} · {gamesPlayed} parties</Text>
          <Text style={styles.palierObjectif}>
            Objectif : <Text style={{ color: palier.color, fontWeight:'800' }}>{palier.objectif}</Text>
            {'  ·  '}<Text style={{ color:Colors.textMuted }}>en {palier.ballLimit} boules max</Text>
          </Text>
        </View>
        <View style={styles.statsCol}>
          {loading
            ? <ActivityIndicator size="small" color={Colors.orange}/>
            : <Text style={styles.statsXp}>{xp} XP</Text>
          }
          <Text style={styles.statsStars}>{'⭐'.repeat(Math.min(stars, 5))}</Text>
        </View>
      </View>

      {/* Erreur API */}
      {error && (
        <View style={styles.errorBand}>
          <Ionicons name="cloud-offline-outline" size={16} color={Colors.gold}/>
          <Text style={styles.errorTxt}>Mode hors-ligne — progression sauvegardée localement</Text>
        </View>
      )}

      {/* Barre de progression */}
      {nextPalier && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width:`${Math.round(progressPct*100)}%`, backgroundColor:palier.color }]}/>
          </View>
          <Text style={styles.progressLabel}>
            {xp - palier.xpMin} / {nextPalier.xpMin - palier.xpMin} XP vers {nextPalier.name}
          </Text>
        </View>
      )}

      {/* Comment gagner de l'XP */}
      <View style={styles.xpCard}>
        <Text style={styles.xpTitle}>Comment gagner de l'XP ?</Text>
        <XpRow icon="ellipse"       label="Boule tirée"     xp={1}   color={Colors.orange}/>
        <XpRow icon="remove"        label="LIGNE complétée" xp={15}  color="#43A047"/>
        <XpRow icon="reorder-three" label="QUINE obtenue"   xp={40}  color="#FB8C00"/>
        <XpRow icon="trophy"        label="BINGO !"         xp={100} color="#E53935"/>
        <View style={styles.noticeBand}>
          <Ionicons name="star" size={16} color={Colors.gold}/>
          <Text style={styles.noticeText}>
            En Campagne : XP et étoiles uniquement — pas de coupons, pas de limite de parties.
          </Text>
        </View>
      </View>

      {/* Les 6 paliers */}
      <Text style={styles.paliersTitle}>Les 6 paliers</Text>
      {PALIERS.map(p => {
        const unlocked  = xp >= p.xpMin;
        const isCurrent = p.id === palier.id;
        return (
          <View key={p.id} style={[styles.palierRow, isCurrent && { borderColor:p.color, borderWidth:2 }, !unlocked && styles.palierRowLocked]}>
            <View style={[styles.palierDot, { backgroundColor: unlocked ? p.color : Colors.woodMid }]}>
              <Text style={styles.palierDotIcon}>{unlocked ? p.icon : '🔒'}</Text>
            </View>
            <View style={styles.palierRowInfo}>
              <Text style={[styles.palierRowName, !unlocked && { color:Colors.textMuted }]}>
                {p.name}<Text style={styles.palierRowLevels}> — niv. {p.levels}</Text>
              </Text>
              <Text style={styles.palierRowDesc}>
                {p.objectif} en {p.ballLimit} boules · {p.rewardDesc}
              </Text>
            </View>
            {isCurrent && <View style={[styles.currentBadge, { backgroundColor:p.color }]}><Text style={styles.currentBadgeText}>Actuel</Text></View>}
          </View>
        );
      })}

      {/* CTA */}
      <TouchableOpacity style={[styles.playBtn, loading && { opacity:0.6 }]} onPress={handleStart} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff"/>
          : <View style={styles.playBtnInner}><Ionicons name="play-circle" size={28} color="#fff"/><Text style={styles.playBtnText}>Lancer une partie Campagne</Text></View>
        }
      </TouchableOpacity>

      <View style={{ height: 40 }}/>
    </ScrollView>
  );
}

function XpRow({ icon, label, xp, color }: { icon:string; label:string; xp:number; color:string }) {
  return (
    <View style={styles.xpRow}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={color}/>
      <Text style={styles.xpRowLabel}>{label}</Text>
      <Text style={[styles.xpRowValue, { color }]}>+{xp} XP</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex:1, backgroundColor:Colors.background },
  content:    { paddingBottom:60 },
  header:     { backgroundColor:Colors.wood, paddingTop:52, paddingHorizontal:Spacing.lg, paddingBottom:Spacing.lg, borderBottomWidth:3, borderBottomColor:Colors.woodGrain },
  headerTitle:{ fontSize:22, fontWeight:'900', color:Colors.parchment },
  headerSub:  { fontSize:13, color:Colors.textWood, marginTop:4 },
  palierCard: { margin:Spacing.lg, marginBottom:0, backgroundColor:Colors.wood, borderRadius:Radius.lg, borderWidth:2, padding:Spacing.lg, flexDirection:'row', alignItems:'center', gap:12, ...Shadow.card },
  palierIcon: { fontSize:40 },
  palierInfo: { flex:1 },
  palierName: { fontSize:18, fontWeight:'900', color:Colors.parchment },
  palierLevels: { fontSize:12, color:Colors.textWood, marginTop:1 },
  palierObjectif: { fontSize:13, color:Colors.textMuted, marginTop:4 },
  statsCol:   { alignItems:'flex-end' },
  statsXp:    { fontSize:15, fontWeight:'800', color:Colors.orange },
  statsStars: { fontSize:16, marginTop:4 },
  errorBand:  { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'rgba(200,160,0,0.1)', margin:Spacing.lg, marginTop:Spacing.sm, borderRadius:Radius.sm, padding:Spacing.sm },
  errorTxt:   { flex:1, fontSize:12, color:Colors.gold, fontStyle:'italic' },
  progressSection:  { marginHorizontal:Spacing.lg, marginTop:Spacing.md },
  progressBar:      { height:8, backgroundColor:Colors.woodMid, borderRadius:4, overflow:'hidden' },
  progressFill:     { height:'100%', borderRadius:4 },
  progressLabel:    { fontSize:12, color:Colors.textMuted, marginTop:6, textAlign:'right' },
  xpCard:     { margin:Spacing.lg, marginTop:Spacing.md, backgroundColor:Colors.surface, borderRadius:Radius.lg, padding:Spacing.lg, ...Shadow.card },
  xpTitle:    { fontSize:15, fontWeight:'800', color:Colors.text, marginBottom:Spacing.md },
  xpRow:      { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:8, borderBottomWidth:1, borderBottomColor:Colors.woodMid },
  xpRowLabel: { flex:1, ...Typography.body, color:Colors.text },
  xpRowValue: { fontSize:16, fontWeight:'900' },
  noticeBand: { flexDirection:'row', alignItems:'flex-start', gap:8, backgroundColor:'rgba(200,160,0,0.12)', borderRadius:Radius.sm, padding:Spacing.sm, marginTop:Spacing.md },
  noticeText: { flex:1, fontSize:13, color:Colors.gold, lineHeight:19, fontStyle:'italic' },
  paliersTitle: { fontSize:15, fontWeight:'800', color:Colors.textMuted, marginHorizontal:Spacing.lg, marginBottom:Spacing.sm },
  palierRow:  { marginHorizontal:Spacing.lg, marginBottom:8, backgroundColor:Colors.surface, borderRadius:Radius.md, padding:Spacing.md, flexDirection:'row', alignItems:'center', gap:12, borderWidth:1, borderColor:'transparent' },
  palierRowLocked: { opacity:0.45 },
  palierDot:  { width:44, height:44, borderRadius:22, justifyContent:'center', alignItems:'center' },
  palierDotIcon: { fontSize:22 },
  palierRowInfo: { flex:1 },
  palierRowName: { fontSize:14, fontWeight:'800', color:Colors.text },
  palierRowLevels: { fontWeight:'400', color:Colors.textMuted },
  palierRowDesc: { fontSize:12, color:Colors.textMuted, marginTop:2, lineHeight:17 },
  currentBadge: { borderRadius:Radius.full, paddingHorizontal:10, paddingVertical:4 },
  currentBadgeText: { fontSize:11, fontWeight:'900', color:'#fff' },
  playBtn:    { marginHorizontal:Spacing.lg, marginTop:Spacing.lg, backgroundColor:Colors.orange, borderRadius:Radius.lg, paddingVertical:20, alignItems:'center', ...Shadow.card },
  playBtnInner: { flexDirection:'row', alignItems:'center', gap:12 },
  playBtnText: { fontSize:18, fontWeight:'800', color:'#fff' },
});
