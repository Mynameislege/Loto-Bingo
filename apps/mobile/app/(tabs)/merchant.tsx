import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Alert, Modal,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/components/ui/tokens';

interface Offer {
  id: string;
  description: string;
  discount: string;
  validDays: number;
  active: boolean;
}

export default function MerchantScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ description: '', discount: '', validDays: '30' });
  const [isRegistered, setIsRegistered] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');

  const handleRegister = () => {
    if (!shopName.trim() || !shopAddress.trim()) {
      Alert.alert('Champs requis', 'Merci de renseigner le nom et l\'adresse de votre commerce.');
      return;
    }
    setIsRegistered(true);
    Alert.alert('✅ Bienvenue !', `Votre espace commerçant "${shopName}" est activé.`);
  };

  const handleAddOffer = () => {
    if (!form.description.trim() || !form.discount.trim()) {
      Alert.alert('Champs requis', 'Renseignez la description et la réduction.');
      return;
    }
    const newOffer: Offer = {
      id: Date.now().toString(),
      description: form.description,
      discount: form.discount,
      validDays: parseInt(form.validDays, 10) || 30,
      active: true,
    };
    setOffers(prev => [newOffer, ...prev]);
    setForm({ description: '', discount: '', validDays: '30' });
    setShowModal(false);
    Alert.alert('🎟 Offre publiée !', 'Votre coupon est maintenant disponible pour les joueurs qui font BINGO.');
  };

  const toggleOffer = (id: string) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, active: !o.active } : o));
  };

  const deleteOffer = (id: string) => {
    Alert.alert('Supprimer', 'Supprimer cette offre ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () =>
        setOffers(prev => prev.filter(o => o.id !== id))
      },
    ]);
  };

  // ── Écran d'inscription commerçant ──────────────────────────────────────
  if (!isRegistered) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.registrationContent}>
        {/* Header */}
        <View style={styles.woodHeader}>
          <Text style={styles.headerIcon}>🏪</Text>
          <Text style={styles.headerTitle}>Espace Commerçant</Text>
          <Text style={styles.headerSub}>Touchez les seniors qui jouent près de chez vous</Text>
        </View>

        {/* Concept */}
        <View style={styles.conceptCard}>
          <Text style={styles.conceptTitle}>Comment ça marche ?</Text>
          <ConceptStep icon="🔵" text="Les seniors du quartier jouent au Loto Seniors chaque jour." />
          <ConceptStep icon="🏆" text="Quand ils font BINGO, ils remportent un coupon offert par un commerçant local." />
          <ConceptStep icon="🎟" text="Ils présentent le coupon dans votre boutique pour bénéficier de votre offre." />
          <ConceptStep icon="❤️" text="Vous fidélisez une clientèle sénior et soutenez l'animation locale." />
        </View>

        {/* Tarifs */}
        <View style={styles.pricingCard}>
          <Text style={styles.pricingTitle}>Tarifs simples</Text>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Abonnement mensuel</Text>
            <Text style={styles.pricingValue}>19 € / mois</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Nombre de coupons</Text>
            <Text style={styles.pricingValue}>Illimité</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Engagement</Text>
            <Text style={styles.pricingValue}>Aucun</Text>
          </View>
          <Text style={styles.pricingNote}>
            🎟 5 coupons offerts sur votre premier abonnement
          </Text>
        </View>

        {/* Formulaire inscription */}
        <View style={styles.woodFrame}>
          <Text style={styles.woodFrameTitle}>📝 Inscription</Text>
          <View style={styles.formInner}>
            <Text style={styles.label}>Nom du commerce *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Boulangerie Dupont"
              placeholderTextColor={Colors.woodGrain}
              value={shopName}
              onChangeText={setShopName}
            />
            <Text style={styles.label}>Adresse *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : 12 rue de la Paix, 75001 Paris"
              placeholderTextColor={Colors.woodGrain}
              value={shopAddress}
              onChangeText={setShopAddress}
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister}>
              <Text style={styles.primaryBtnText}>Activer mon espace commerçant</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ── Dashboard commerçant ──────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.woodHeader}>
        <Text style={styles.headerShopName}>🏪 {shopName}</Text>
        <Text style={styles.headerSub}>{shopAddress}</Text>
      </View>
      <View style={styles.woodBorder} />

      <ScrollView contentContainerStyle={styles.dashContent}>
        {/* Métriques */}
        <View style={styles.metricsRow}>
          <MetricBox icon="🎟" label="Coupons actifs" value={`${offers.filter(o => o.active).length}`} color={Colors.orange} />
          <MetricBox icon="✅" label="Utilisés" value="0" color={Colors.success} />
          <MetricBox icon="👥" label="Clients" value="0" color={Colors.blue} />
        </View>

        {/* Bouton ajouter */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnIcon}>＋</Text>
          <Text style={styles.addBtnText}>Créer une offre coupon</Text>
        </TouchableOpacity>

        {/* Liste des offres */}
        {offers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎟</Text>
            <Text style={styles.emptyTitle}>Aucune offre pour l'instant</Text>
            <Text style={styles.emptyText}>
              Créez votre première offre — elle sera attribuée aux prochains joueurs qui font BINGO !
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Mes offres</Text>
            {offers.map(offer => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onToggle={() => toggleOffer(offer.id)}
                onDelete={() => deleteOffer(offer.id)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Modal création offre */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.woodHeader}>
              <Text style={styles.modalTitle}>🎟 Nouvelle offre</Text>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.label}>Description de l'offre *</Text>
              <TextInput
                style={[styles.input, styles.inputDark]}
                placeholder="Ex : -20% sur toute la boulangerie"
                placeholderTextColor={Colors.woodGrain}
                value={form.description}
                onChangeText={v => setForm(p => ({ ...p, description: v }))}
                multiline
              />
              <Text style={styles.label}>Réduction / avantage *</Text>
              <TextInput
                style={[styles.input, styles.inputDark]}
                placeholder="Ex : -20%  ou  1 café offert"
                placeholderTextColor={Colors.woodGrain}
                value={form.discount}
                onChangeText={v => setForm(p => ({ ...p, discount: v }))}
              />
              <Text style={styles.label}>Validité (jours)</Text>
              <TextInput
                style={[styles.input, styles.inputDark]}
                placeholder="30"
                placeholderTextColor={Colors.woodGrain}
                value={form.validDays}
                onChangeText={v => setForm(p => ({ ...p, validDays: v }))}
                keyboardType="number-pad"
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleAddOffer}>
                <Text style={styles.primaryBtnText}>Publier l'offre</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Composants ────────────────────────────────────────────────

function ConceptStep({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.conceptStep}>
      <Text style={styles.conceptIcon}>{icon}</Text>
      <Text style={styles.conceptText}>{text}</Text>
    </View>
  );
}

function MetricBox({ icon, label, value, color }: {
  icon: string; label: string; value: string; color: string;
}) {
  return (
    <View style={[styles.metricBox, { borderTopColor: color }]}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function OfferCard({ offer, onToggle, onDelete }: {
  offer: Offer;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.offerCard, !offer.active && styles.offerCardInactive]}>
      <View style={styles.offerHeader}>
        <View style={[styles.statusDot, { backgroundColor: offer.active ? Colors.success : Colors.textMuted }]} />
        <Text style={styles.offerDesc}>{offer.description}</Text>
      </View>
      <Text style={styles.offerDiscount}>{offer.discount}</Text>
      <Text style={styles.offerValidity}>Valide {offer.validDays} jours après attribution</Text>
      <View style={styles.offerActions}>
        <TouchableOpacity style={styles.offerToggle} onPress={onToggle}>
          <Text style={styles.offerToggleText}>{offer.active ? 'Désactiver' : 'Réactiver'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.offerDelete} onPress={onDelete}>
          <Text style={styles.offerDeleteText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  woodHeader: {
    backgroundColor: Colors.wood,
    paddingTop: 56,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  woodBorder: { height: 4, backgroundColor: Colors.woodGrain },
  headerIcon: { fontSize: 48, marginBottom: Spacing.sm },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.parchment, textAlign: 'center' },
  headerShopName: { fontSize: 20, fontWeight: '800', color: Colors.parchment },
  headerSub: { fontSize: 14, color: Colors.textWood, textAlign: 'center', marginTop: 4 },

  // Inscription
  registrationContent: { padding: Spacing.lg, paddingBottom: 40 },
  conceptCard: {
    backgroundColor: Colors.woodMid,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.woodGrain,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  conceptTitle: { fontSize: 18, fontWeight: '700', color: Colors.parchment, marginBottom: Spacing.md },
  conceptStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  conceptIcon: { fontSize: 22, marginRight: 12, marginTop: 1 },
  conceptText: { fontSize: 15, color: Colors.parchment, flex: 1, lineHeight: 22 },

  pricingCard: {
    backgroundColor: Colors.wood,
    borderRadius: Radius.md,
    borderWidth: 2, borderColor: Colors.gold,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  pricingTitle: { fontSize: 18, fontWeight: '700', color: Colors.gold, marginBottom: Spacing.md },
  pricingRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.woodMid,
  },
  pricingLabel: { fontSize: 16, color: Colors.parchment },
  pricingValue: { fontSize: 16, fontWeight: '700', color: Colors.orange },
  pricingNote: { fontSize: 14, color: Colors.goldLight, marginTop: Spacing.md, textAlign: 'center' },

  woodFrame: {
    backgroundColor: Colors.woodMid,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.woodGrain,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadow.card,
  },
  woodFrameTitle: {
    fontSize: 17, fontWeight: '700', color: Colors.parchment,
    backgroundColor: Colors.wood,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.woodGrain,
  },
  formInner: { padding: Spacing.md },
  label: { fontSize: 15, fontWeight: '600', color: Colors.parchment, marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: Colors.wood,
    borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.woodGrain,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 16, color: Colors.parchment,
    marginBottom: 4,
  },
  inputDark: { backgroundColor: Colors.background },

  primaryBtn: {
    backgroundColor: Colors.orange,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  primaryBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  cancelBtn: {
    borderWidth: 2, borderColor: Colors.woodGrain,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: Colors.textWood },

  // Dashboard
  dashContent: { padding: Spacing.lg, paddingBottom: 40 },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  metricBox: {
    flex: 1,
    backgroundColor: Colors.woodMid,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.woodGrain,
    borderTopWidth: 3,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadow.card,
  },
  metricIcon: { fontSize: 22, marginBottom: 4 },
  metricValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  metricLabel: { fontSize: 12, color: Colors.textWood, textAlign: 'center' },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.orange,
    borderRadius: Radius.md,
    paddingVertical: 16,
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  addBtnIcon: { fontSize: 24, color: '#fff', marginRight: 8, lineHeight: 26 },
  addBtnText: { fontSize: 18, fontWeight: '700', color: '#fff' },

  emptyState: {
    alignItems: 'center', padding: Spacing.xl, marginTop: Spacing.lg,
  },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm },
  emptyText: { fontSize: 16, color: Colors.textMuted, textAlign: 'center', lineHeight: 24 },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },

  offerCard: {
    backgroundColor: Colors.woodMid,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.woodGrain,
    borderLeftWidth: 4, borderLeftColor: Colors.orange,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  offerCardInactive: { opacity: 0.5, borderLeftColor: Colors.textMuted },
  offerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  offerDesc: { fontSize: 16, fontWeight: '700', color: Colors.parchment, flex: 1 },
  offerDiscount: { fontSize: 22, fontWeight: '800', color: Colors.gold, marginBottom: 4 },
  offerValidity: { fontSize: 13, color: Colors.textWood, marginBottom: Spacing.md },
  offerActions: { flexDirection: 'row', gap: Spacing.sm },
  offerToggle: {
    flex: 1, backgroundColor: Colors.wood,
    borderRadius: Radius.sm, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.woodGrain,
  },
  offerToggleText: { fontSize: 14, fontWeight: '600', color: Colors.parchment },
  offerDelete: {
    flex: 1, backgroundColor: 'transparent',
    borderRadius: Radius.sm, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.error,
  },
  offerDeleteText: { fontSize: 14, fontWeight: '600', color: Colors.error },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: Colors.woodMid,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.parchment },
  modalScroll: { padding: Spacing.lg },
});
