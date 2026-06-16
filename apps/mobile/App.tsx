/**
 * App.tsx — shim pnpm monorepo
 *
 * expo/AppEntry.js (dans le virtual store pnpm) cherche "../../App" depuis
 * un chemin trop profond. Ce fichier satisfait cet import et initialise
 * expo-router manuellement avec le contexte de routage fichier-based.
 */
import React from 'react';
import { ExpoRoot } from 'expo-router';

// require.context est fourni par Metro/Expo — TypeScript ne le connaît pas
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx = (require as any).context('./app');

export default function App() {
  return <ExpoRoot context={ctx} />;
}
