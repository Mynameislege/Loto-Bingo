/**
 * PremiumCard — Carte Pass Premium pour l'onglet Profil
 * Affiche les avantages et le bouton d'abonnement.
 */
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePremiumStore } from '@/stores/premiumStore';
import { Colors, Spacing, Radius, Shadow } from '@/components/ui/tokens';

const BENEFITS = [
  { icon: 'infinite',          label: 'Parties Mode Libre illimitées' },
  { icon: 'ticket-outline',    label: '5 coupons / mois (vs 1)' },
  { icon: 'star',              label: 'Badge Premium sur le profil' },
  { icon: 'color-palette',     label: 'Skins de carton exclusifs' },
  { icon: 'flash',             label: 'Priorité matchmaking' },
  { icon: 'volume-high',       label: 'Marcel sans publicité' },
] as const;

export default function PremiumCard() {
  const { available, isPremium, loading, price, expiresAt, purchase, restore } = usePremiumStore();

  async function handlePurchase() {
    if (!available) {
      Alert.alert(
        'Pass Premium',
        'Disponible dans la version complète (après build EAS). Abonnement : ' + price + '/mois.',
        [{ text: 'OK' }],
      );
      return;
    }
    const ok = await purchase();
    if (ok) Alert.alert('🎉 Bienvenue Premium !', 'Profitez de tous les avantages Loto Seniors Premium.', [{ text:'Super !' }]);
  }

  if (isPremium) {
    return (
      <View style={st.premiumActive}>
        <View style={st.premiumHeader}>
          <Ionicons name="star" size={22} color={Colors.gold}/>
          <Text style={st.premiumTitle}>Pass Premium actif ✓</Text>
        </View>
        {expiresAt && <Text style={st.expiry}>Renouvellement : {new Date(expiresAt).toLocaleDateString('fr-FR')}</Text>}
        <View style={st.benefitsGrid}>
          {BENEFITS.map(b => (
            <View key={b.label} style={st.benefitRow}>
              <Ionicons name={b.icon as keyof typeof Ionicons.glyphMap} size={16} color={Colors.gold}/>
              <Text style={st.benefitTxt}>{b.label}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={st.restoreBtn} onPress={restore} disabled={loading}>
          <Text style={st.restoreTxt}>Gérer mon abonnement</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={st.card}>
      {/* Badge */}
      <View style={st.badge}><Text style={st.badgeTxt}>✨ PREMIUM</Text></View>

      <Text style={st.headline}>Passez Premium</Text>
      <Text style={st.subline}>Débloquez le meilleur de Loto Seniors</Text>

      {/* Prix */}
      <View style={st.priceRow}>
        <Text style={st.price}>{price}</Text>
        <Text style={st.pricePer}>/mois</Text>
      </View>

      {/* Avantages */}
      <View style={st.benefitsGrid}>
        {BENEFITS.map(b => (
          <View key={b.label} style={st.benefitRow}>
            <Ionicons name={b.icon as keyof typeof Ionicons.glyphMap} size={16} color={Colors.gold}/>
            <Text style={st.benefitTxt}>{b.label}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity style={st.cta} onPress={handlePurchase} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff"/>
          : <Text style={st.ctaTxt}>S'abonner — {price}/mois</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={restore} disabled={loading} style={{marginTop:8,alignItems:'center'}}>
        <Text style={st.restoreTxt}>Restaurer un achat</Text>
      </TouchableOpacity>

      <Text style={st.legalTxt}>
        Abonnement mensuel. Résiliable à tout moment depuis les réglages de l'App Store / Google Play.
        Renouvellement automatique sauf annulation 24h avant la fin de la période.
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  card: {
    backgroundColor: Colors.navy,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.gold,
    ...Shadow.card,
  },
  premiumActive: {
    backgroundColor: Colors.woodMid,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.gold,
    ...Shadow.card,
  },
  premiumHeader: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:8 },
  premiumTitle:  { fontSize:17, fontWeight:'900', color:Colors.gold },
  expiry:        { fontSize:12, color:Colors.textMuted, marginBottom:12 },
  badge: {
    alignSelf:'flex-start',
    backgroundColor: Colors.gold,
    borderRadius: Radius.full,
    paddingHorizontal:12, paddingVertical:5,
    marginBottom:Spacing.sm,
  },
  badgeTxt:   { fontSize:11, fontWeight:'900', color:Colors.navy, letterSpacing:1 },
  headline:   { fontSize:22, fontWeight:'900', color:Colors.parchment, marginBottom:4 },
  subline:    { fontSize:14, color:Colors.textWood, marginBottom:Spacing.md },
  priceRow:   { flexDirection:'row', alignItems:'baseline', gap:4, marginBottom:Spacing.md },
  price:      { fontSize:32, fontWeight:'900', color:Colors.gold },
  pricePer:   { fontSize:15, color:Colors.textWood },
  benefitsGrid: { gap:10, marginBottom:Spacing.md },
  benefitRow: { flexDirection:'row', alignItems:'center', gap:10 },
  benefitTxt: { fontSize:14, color:Colors.parchment, fontWeight:'600' },
  cta: {
    backgroundColor:Colors.orange,
    borderRadius:Radius.lg,
    paddingVertical:18,
    alignItems:'center',
    ...Shadow.card,
  },
  ctaTxt:     { fontSize:17, fontWeight:'900', color:'#fff' },
  restoreBtn: { alignItems:'center', paddingVertical:10, marginTop:4 },
  restoreTxt: { fontSize:13, color:Colors.gold, fontWeight:'600' },
  legalTxt:   { fontSize:11, color:Colors.textMuted, textAlign:'center', marginTop:12, lineHeight:16 },
});
