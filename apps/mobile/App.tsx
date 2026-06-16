/**
 * App.tsx — shim pnpm monorepo
 *
 * Chargé par expo/AppEntry.js quand Metro est lancé depuis la racine du monorepo
 * (pas de champ "main" dans loto-seniors/package.json → fallback sur expo/AppEntry).
 * Ce fichier exporte le composant App d'expo-router pour que
 * registerRootComponent(App) fonctionne correctement.
 */
export { App as default } from 'expo-router/build/qualified-entry';
