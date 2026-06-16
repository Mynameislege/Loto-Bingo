/**
 * premiumStore — Pass Premium via RevenueCat
 *
 * Prérequis :
 *   pnpm add react-native-purchases  (dans apps/mobile)
 *   EAS Build (pas compatible Expo Go)
 *   EXPO_PUBLIC_RC_API_KEY_IOS / ANDROID dans .env
 *
 * En attendant : available=false, PremiumCard affiche le prix statique.
 */
import { create } from 'zustand';

// TODO: activer après EAS Build
// import Purchases from 'react-native-purchases';
const Purchases = null;

export interface PremiumState {
  available:  boolean;
  isPremium:  boolean;
  loading:    boolean;
  price:      string;
  expiresAt:  string | null;

  configure:  (userId: string) => Promise<void>;
  restore:    () => Promise<void>;
  purchase:   () => Promise<boolean>;
}

export const usePremiumStore = create<PremiumState>((set) => ({
  available:  false, // true après EAS Build + react-native-purchases
  isPremium:  false,
  loading:    false,
  price:      '3,99 €',
  expiresAt:  null,

  configure: async (_userId) => {
    // Agora non disponible en Expo Go
  },

  restore: async () => {
    set({ loading: true });
    // TODO: Purchases.restorePurchases()
    set({ loading: false });
  },

  purchase: async () => {
    // TODO: Purchases.purchasePackage(...)
    return false;
  },
}));
