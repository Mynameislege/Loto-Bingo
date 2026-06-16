import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, Alert, RefreshControl, ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/components/ui/tokens';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Coupon {
  id: string;
  qrCode: string;
  usedAt: string | null;
  expiresAt: string | null;
  giftedAt: string | null;
  couponOffer: {
    id: string;
    description: string;
    merchant: { name: string; address: string };
  };
}

interface NearbyOffer {
  id: string;
  description: string;
  stockRemaining: number;
  merchant: { name: string; address: string; distanceM?: number };
}

// ── Screen principal ───────────────────────────────────────────────────────────
export default function CouponsScreen() {
  const { user } = useAuthStore();
  const [coupons, setCoupons]         = useState<Coupon[]>([]);
  const [nearby, setNearby]           = useState<NearbyOffer[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/coupon/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  }, [user]);

  const fetchNearby = useCallback(async () => {
    setNearbyLoading(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationError('Permission de localisation refusée'); setNearbyLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;

      const token = user ? await user.getIdToken() : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/merchant/nearby?lat=${latitude}&lng=${longitude}&radius=10000`,
        { headers }
      );
      const data = await res.json();
      setNearby(Array.isArray(data) ? data : []);
    } catch (e) { setLocationError('Impossible de charger les offres proches'); console.error(e); }
    finally { setNearbyLoading(false); }
  }, [user]);

  useEffect(() => {
    Promise.all([fetchCoupons(), fetchNearby()]).finally(() => setLoading(false));
  }, [fetchCoupons, fetchNearby]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchCoupons(), fetchNearby()]);
    setRefreshing(false);
  }, [fetchCoupons, fetchNearby]);

  async function handleGift(coupon: Coupon) {
    if (!user) return;
    Alert.alert(
      'Offrir ce coupon',
      `Offrir le coupon "${coupon.couponOffer.description}" de ${coupon.couponOffer.merchant.name} à un proche ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Offrir en 1 clic',
          onPress: async () => {
            try {
              const token = await user.getIdToken();
              const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/coupon/${coupon.id}/gift`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
              });
              if (res.ok) {
                Alert.alert('✅ Coupon offert !', 'Votre proche a reçu le coupon. Marcel est fier de vous !');
                fetchCoupons();
              } else {
                Alert.alert('Erreur', 'Impossible d'offrir le coupon pour l'instant.');
              }
            } catch (e) { Alert.alert('Erreur réseau', String(e)); }
          },
        },
      ]
    );
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.orange} /></View>;

  const activeCoupons = coupons.filter(c => !c.usedAt && !c.giftedAt);
  const usedCoupons   = coupons.filter(c => c.usedAt || c.giftedAt);

  return (
    <FlatList
      style={styles.container}
      data={[]}
      renderItem={() => null}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
      ListHeaderComponent={() => (
        <>
          {/* ── En-tête ─────────────────────────────── */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Mes Coupons</Text>
            <Text style={styles.headerSub}>Bingo = coupon d'un commerçant de votre quartier</Text>
          </View>

          {/* ── Coupons actifs ──────────────────────── */}
          {activeCoupons.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🎟</Text>
              <Text style={styles.emptyTitle}>Pas encore de coupons</Text>
              <Text style={styles.emptyText}>Faites un BINGO au Loto du Jour ou en Multijoueur pour remporter votre premier coupon !</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Coupons disponibles ({activeCoupons.length})</Text>
              {activeCoupons.map(c => (
                <CouponCard key={c.id} coupon={c} onGift={() => handleGift(c)} />
              ))}
            </>
          )}

          {/* ── Offres près de chez vous ─────────────── */}
          <Text style={styles.sectionTitle}>🗺 Près de chez vous (10 km)</Text>
          {nearbyLoading && <ActivityIndicator color={Colors.orange} style={{ marginBottom: Spacing.lg }} />}
          {locationError && (
            <View style={styles.locationError}>
              <Text style={styles.locationErrorText}>📍 {locationError}</Text>
              <TouchableOpacity onPress={fetchNearby}><Text style={styles.retryBtn}>Réessayer</Text></TouchableOpacity>
            </View>
          )}
          {!nearbyLoading && !locationError && nearby.length === 0 && (
            <View style={styles.nearbyEmpty}>
              <Text style={styles.nearbyEmptyText}>Aucun commerçant partenaire trouvé dans votre zone pour l'instant.</Text>
            </View>
          )}
          {!nearbyLoading && nearby.map(offer => (
            <NearbyCard key={offer.id} offer={offer} />
          ))}

          {/* ── Coupons utilisés / offerts ───────────── */}
          {usedCoupons.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>Historique</Text>
              {usedCoupons.map(c => <CouponCard key={c.id} coupon={c} onGift={undefined} />)}
            </>
          )}

          <View style={{ height: 40 }} />
        </>
      )}
    />
  );
}

// ── Carte coupon ──────────────────────────────────────────────────────────────
function CouponCard({ coupon, onGift }: { coupon: Coupon; onGift?: () => void }) {
  const used    = !!coupon.usedAt;
  const gifted  = !!coupon.giftedAt;
  const expired = coupon.expiresAt ? new Date(coupon.expiresAt) < new Date() : false;
  const expires = coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('fr-FR') : null;
  const inactive = used || gifted || expired;

  return (
    <View style={[styles.card, inactive && styles.cardInactive]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardMerchant}>{coupon.couponOffer.merchant.name}</Text>
        {used   && <Badge label="Utilisé"  color={Colors.textMuted} />}
        {gifted && <Badge label="Offert"   color={Colors.gold} />}
        {expired && !used && !gifted && <Badge label="Expiré" color="#ef5350" />}
      </View>
      <Text style={styles.cardDesc}>{coupon.couponOffer.description}</Text>
      <Text style={styles.cardAddress}>📍 {coupon.couponOffer.merchant.address}</Text>
      {expires && <Text style={styles.cardExpiry}>Expire le {expires}</Text>}

      {/* QR code */}
      {!inactive && (
        <View style={styles.qrBox}>
          <Text style={styles.qrText}>{coupon.qrCode}</Text>
          <Text style={styles.qrHint}>Présentez ce code en caisse</Text>
        </View>
      )}

      {/* Bouton Offrir */}
      {!inactive && onGift && (
        <TouchableOpacity style={styles.giftBtn} onPress={onGift} activeOpacity={0.8}>
          <Text style={styles.giftBtnText}>🎁  Offrir à un proche</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Carte offre proche ────────────────────────────────────────────────────────
function NearbyCard({ offer }: { offer: NearbyOffer }) {
  const dist = offer.merchant.distanceM
    ? offer.merchant.distanceM >= 1000
      ? `${(offer.merchant.distanceM / 1000).toFixed(1)} km`
      : `${Math.round(offer.merchant.distanceM)} m`
    : null;

  return (
    <View style={styles.nearbyCard}>
      <View style={styles.nearbyHeader}>
        <Text style={styles.nearbyMerchant}>{offer.merchant.name}</Text>
        {dist && <Text style={styles.nearbyDist}>📍 {dist}</Text>}
      </View>
      <Text style={styles.nearbyDesc}>{offer.description}</Text>
      <Text style={styles.nearbyAddress}>{offer.merchant.address}</Text>
      {offer.stockRemaining <= 5 && (
        <Text style={styles.nearbyStock}>⚠️ Plus que {offer.stockRemaining} coupon(s) disponible(s) !</Text>
      )}
    </View>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },

  header: { backgroundColor: Colors.wood, paddingTop: 52, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, borderBottomWidth: 3, borderBottomColor: Colors.woodGrain, marginBottom: Spacing.md },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.parchment },
  headerSub: { fontSize: 13, color: Colors.textWood, marginTop: 4 },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, marginTop: Spacing.md },

  emptyCard: { margin: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', ...Shadow.card },
  emptyIcon: { fontSize: 60, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: Colors.text, marginBottom: Spacing.sm },
  emptyText: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },

  card: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, borderLeftWidth: 4, borderLeftColor: Colors.gold, ...Shadow.card },
  cardInactive: { opacity: 0.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardMerchant: { fontSize: 17, fontWeight: '900', color: Colors.gold, flex: 1 },
  cardDesc: { fontSize: 15, color: Colors.text, marginBottom: Spacing.xs },
  cardAddress: { fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.xs },
  cardExpiry: { fontSize: 13, color: Colors.orange, marginBottom: Spacing.sm },
  badge: { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  qrBox: { backgroundColor: '#fff', borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.woodMid },
  qrText: { fontSize: 20, fontWeight: '900', color: '#1A1A1A', letterSpacing: 3 },
  qrHint: { fontSize: 13, color: '#666', marginTop: 4 },

  giftBtn: { backgroundColor: Colors.navy, borderRadius: Radius.md, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: Colors.gold },
  giftBtnText: { fontSize: 16, fontWeight: '800', color: Colors.gold },

  nearbyCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.woodMid, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.woodGrain },
  nearbyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  nearbyMerchant: { fontSize: 15, fontWeight: '800', color: Colors.parchment, flex: 1 },
  nearbyDist: { fontSize: 13, color: Colors.orange, fontWeight: '700' },
  nearbyDesc: { fontSize: 14, color: Colors.textWood, marginBottom: 2 },
  nearbyAddress: { fontSize: 12, color: Colors.textMuted },
  nearbyStock: { fontSize: 12, color: '#ef5350', fontWeight: '700', marginTop: 6 },

  locationError: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  locationErrorText: { fontSize: 14, color: Colors.textMuted, marginBottom: 8 },
  retryBtn: { fontSize: 14, color: Colors.orange, fontWeight: '700' },

  nearbyEmpty: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  nearbyEmptyText: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic' },
});
