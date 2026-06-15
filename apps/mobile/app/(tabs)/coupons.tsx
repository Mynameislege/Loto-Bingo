import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/components/ui/tokens';

interface Coupon {
  id: string;
  qrCode: string;
  usedAt: string | null;
  expiresAt: string | null;
  couponOffer: {
    description: string;
    merchant: { name: string; address: string };
  };
}

export default function CouponsScreen() {
  const { user } = useAuthStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then(token =>
      fetch(`${process.env.EXPO_PUBLIC_API_URL}/coupon/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    ).then(r => r.json()).then(data => {
      setCoupons(Array.isArray(data) ? data : []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  if (coupons.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🎟</Text>
        <Text style={styles.emptyTitle}>Pas encore de coupons</Text>
        <Text style={styles.emptyText}>
          Faites un BINGO au Loto du Jour pour gagner votre premier coupon !
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Mes Coupons</Text>
      <FlatList
        data={coupons}
        keyExtractor={c => c.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CouponCard coupon={item} />
        )}
      />
    </View>
  );
}

function CouponCard({ coupon }: { coupon: Coupon }) {
  const used = coupon.usedAt !== null;
  const expires = coupon.expiresAt
    ? new Date(coupon.expiresAt).toLocaleDateString('fr-FR')
    : null;

  return (
    <View style={[styles.card, used && styles.cardUsed]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardMerchant}>{coupon.couponOffer.merchant.name}</Text>
        {used && <View style={styles.usedBadge}><Text style={styles.usedText}>Utilisé</Text></View>}
      </View>
      <Text style={styles.cardDesc}>{coupon.couponOffer.description}</Text>
      <Text style={styles.cardAddress}>{coupon.couponOffer.merchant.address}</Text>
      {expires && (
        <Text style={styles.cardExpiry}>Expire le {expires}</Text>
      )}
      <View style={styles.qrBox}>
        <Text style={styles.qrText}>{coupon.qrCode}</Text>
        <Text style={styles.qrHint}>Présentez ce code en caisse</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  pageTitle: { ...Typography.h2, color: Colors.text, padding: Spacing.lg, paddingTop: 60, paddingBottom: Spacing.sm },
  list: { padding: Spacing.lg, paddingTop: 0 },

  emptyIcon: { fontSize: 64, marginBottom: Spacing.lg },
  emptyTitle: { ...Typography.h2, color: Colors.text, textAlign: 'center', marginBottom: Spacing.md },
  emptyText: { ...Typography.body, color: Colors.textMuted, textAlign: 'center' },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
    ...Shadow.card,
  },
  cardUsed: { opacity: 0.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardMerchant: { ...Typography.h3, color: Colors.gold, flex: 1 },
  usedBadge: { backgroundColor: Colors.textMuted, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  usedText: { fontSize: 12, fontWeight: '700', color: Colors.background },
  cardDesc: { ...Typography.body, color: Colors.text, marginBottom: Spacing.xs },
  cardAddress: { ...Typography.small, color: Colors.textMuted, marginBottom: Spacing.sm },
  cardExpiry: { ...Typography.small, color: Colors.orange, marginBottom: Spacing.md },
  qrBox: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  qrText: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', letterSpacing: 2 },
  qrHint: { fontSize: 13, color: '#666', marginTop: 4 },
});
