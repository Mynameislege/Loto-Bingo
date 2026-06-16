/**
 * useSeasonalTheme — retourne l'événement actif (ou null).
 * Recalculé au montage uniquement (la date ne change pas en cours de partie).
 */
import { useMemo } from 'react';
import { getCurrentSeasonalEvent, type SeasonalEvent } from '@/services/seasonalEvents';

export function useSeasonalTheme(): SeasonalEvent | null {
  return useMemo(() => getCurrentSeasonalEvent(), []);
}
