/**
 * premiumStore — Pass Premium via RevenueCat (react-native-purchases)
 *
 * Prérequis :
 *   pnpm add react-native-purchases  (dans apps/mobile)
 *   Rebuild avec expo-dev-client ou EAS Build
 *   Clés dans .env :
 *     EXPO_PUBLIC_RC_API_KEY_IOS=appl_xxx
 *     EXPO_PUBLIC_RC_API_KEY_ANDROID=goog_xxx
 *
 * Dégradation gracieuse en Expo Go (module absent → available=false).
 */
import { create } from 'zustand';
import { Platform } from 'react-native';

// Import conditionnel (module natif)
let Purchases: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Purchases = require('react-native-purchases').default;
} catch {
  // Expo Go — silencieux
}

const RC_KEY = Platform.OS === 'ios'
  ? (process.env.EXPO_PUBLIC_RC_API_KEY_IOS ?? '')
  : (process.env.EXPO_PUBLIC_RC_API_KEY_ANDROID ?? '');

const ENTITLEMENT_ID = 'premium';
const MONTHLY_PRODUCT_ID = 'loto_seniors_premium_monthly';

export interface PremiumState {
  available:  boolean;   // false = module absent / Expo Go
  isPremium:  boolean;
  loading:    boolean;
  price:      string;    // ex: "3,99 €"
  expiresAt:  string | null;

  // Actions
  configure:  (userId: string) => Promise<void>;
  restore:    () => Promise<void>;
  purchase:   () => Promise<boolean>;  // true = acheté, false = annulé/erreur
}

export const usePremiumStore = create<PremiumState>((set, get) => ({
  available:  !!Purchases && !!RC_KEY,
  isPremium:  false,
  loading:    false,
  price:      '3,99 €',
  expiresAt:  null,

  configure: async (userId) => {
    if (!Purchases || !RC_KEY) return;
    try {
      Purchases.configure({ apiKey: RC_KEY });
      await Purchases.logIn(userId);
      await refreshPremiumStatus(set);
      // Récupérer le prix depuis le store
      const { current } = await Purchases.getOfferings();
      const monthly = current?.availablePackages?.find(
        (p: any) => p.identifier === MONTHLY_PRODUCT_ID || p.packageType === 'MONTHLY'
      );
      if (monthly) {
        set({ price: monthly.product?.priceString ?? '3,99 €' });
      }
    } catch (err) {
      console.warn('[RevenueCat] configure error', err);
    }
  },

  restore: async () => {
    if (!Purchases) return;
    set({ loading: true });
    try {
      await Purchases.restorePurchases();
      await refreshPremiumStatus(set);
    } catch (err) {
      console.warn('[RevenueCat] restore error', err);
    } finally {
      set({ loading: false });
    }
  },

  purchase: async () => {
    if (!Purchases) return false;
    set({ loading: true });
    try {
      const { current } = await Purchases.getOfferings();
      const monthly = current?.availablePackages?.find(
        (p: any) => p.identifier === MONTHLY_PRODUCT_ID || p.packageType === 'MONTHLY'
      );
      if (!monthly) return false;
      await Purchases.purchasePackage(monthly);
      await refreshPremiumStatus(set);
      return get().isPremium;
    } catch (err: any) {
      if (err?.userCancelled) return false;
      console.warn('[RevenueCat] purchase error', err);
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));

async function refreshPremiumStatus(set: (s: Partial<PremiumState>) => void) {
  if (!Purchases) return;
  const info = await Purchases.getCustomerInfo();
  const entitlement = info?.entitlements?.active?.[ENTITLEMENT_ID];
  set({
    isPremium: !!entitlement,
    expiresAt: entitlement?.expirationDate ?? null,
  });
}
