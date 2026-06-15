import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  AuthErrorCodes,
} from '@firebase/auth';
import { auth } from '../services/firebase';
import { api } from '../services/api';

// Upsert silencieux — garantit l'existence du record Prisma après connexion
async function syncUserToDB(user: User, displayName?: string): Promise<void> {
  try {
    await api.post('/auth/register', {
      displayName: displayName ?? user.displayName ?? user.email?.split('@')[0] ?? 'Joueur',
    });
  } catch {
    // best-effort — le endpoint /game/daily/start auto-crée aussi si absent
  }
}

// ── Traduction des codes d'erreur Firebase ──────────────────────────────────
function humanizeAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  switch (code) {
    case AuthErrorCodes.NETWORK_REQUEST_FAILED:
    case 'auth/network-request-failed':
      return 'Connexion impossible. Vérifiez votre connexion internet.';
    case AuthErrorCodes.INVALID_PASSWORD:
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email ou mot de passe incorrect.';
    case AuthErrorCodes.USER_DELETED:
    case 'auth/user-not-found':
      return 'Aucun compte trouvé avec cet email.';
    case AuthErrorCodes.EMAIL_EXISTS:
    case 'auth/email-already-in-use':
      return 'Un compte existe déjà avec cet email.';
    case AuthErrorCodes.INVALID_EMAIL:
    case 'auth/invalid-email':
      return 'Adresse email invalide.';
    case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Réessayez dans quelques minutes.';
    default:
      return (error as { message?: string })?.message ?? 'Une erreur inattendue est survenue.';
  }
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  initialize: () => () => void; // returns unsubscribe
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  clearError: () => set({ error: null }),

  initialize: () => {
    const unsubscribe = onAuthStateChanged(
      auth,
      // ── Callback succès ──────────────────────────────────────────────────
      (user) => {
        set({ user, isInitialized: true });
      },
      // ── Callback erreur (token refresh network failure, etc.) ──────────
      // Sans ce callback, Firebase lève une rejection non gérée → écran rouge
      (error) => {
        console.warn('[auth] onAuthStateChanged error:', error.code, error.message);
        // Traiter comme "déconnecté" — l'utilisateur pourra se reconnecter
        set({ user: null, isInitialized: true });
      },
    );
    return unsubscribe;
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      // Garantit l'existence du record Prisma (utilisateurs créés hors app)
      await syncUserToDB(user);
    } catch (error) {
      const msg = humanizeAuthError(error);
      set({ error: msg });
      throw new Error(msg);
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      // Mettre à jour le displayName dans Firebase Auth
      await updateProfile(user, { displayName });
      // Créer le record en DB
      await syncUserToDB(user, displayName);
    } catch (error) {
      const msg = humanizeAuthError(error);
      set({ error: msg });
      throw new Error(msg);
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.warn('[auth] signOut error:', error);
    }
    set({ user: null, error: null });
  },
}));
