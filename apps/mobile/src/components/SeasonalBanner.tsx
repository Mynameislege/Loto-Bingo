/**
 * SeasonalBanner — Bandeau saisonnier affiché sur l'accueil et le jeu.
 * Se cache automatiquement quand aucun événement n'est actif.
 */
import { View, Text, StyleSheet } from 'react-native';
import { useSeasonalTheme } from '@/hooks/useSeasonalTheme';
import { Spacing, Radius } from '@/components/ui/tokens';

export default function SeasonalBanner() {
  const event = useSeasonalTheme();
  if (!event) return null;

  return (
    <View style={[st.banner, { backgroundColor: event.accent }]}>
      <Text style={st.emoji}>{event.emoji}</Text>
      <Text style={[st.text, { color: event.primary === '#C8A000' ? '#1A376C' : '#fff' }]}>
        {event.name}
      </Text>
      <Text style={st.emoji}>{event.emoji}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
  },
  emoji: { fontSize: 20 },
  text:  { fontSize: 15, fontWeight: '900', flex: 1, textAlign: 'center' },
});
