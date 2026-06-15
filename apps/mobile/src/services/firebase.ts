import { initializeApp, getApps } from '@firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey:            process.env['EXPO_PUBLIC_FIREBASE_API_KEY'] ?? '',
  authDomain:        process.env['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'] ?? '',
  projectId:         process.env['EXPO_PUBLIC_FIREBASE_PROJECT_ID'] ?? '',
  storageBucket:     process.env['EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'] ?? '',
  messagingSenderId: process.env['EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'] ?? '',
  appId:             process.env['EXPO_PUBLIC_FIREBASE_APP_ID'] ?? '',
};

// Guard against double-init on Fast Refresh
const existingApps = getApps();
const app = existingApps.length === 0
  ? initializeApp(firebaseConfig)
  : existingApps[0]!;

// AsyncStorage persistence — session survives app restarts
export const auth = existingApps.length === 0
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);
