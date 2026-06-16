/**
 * LotoBallIcon — icône boule de loto pour la barre de navigation
 * Affichée en or (Colors.gold) si le joueur n'a pas encore joué aujourd'hui.
 * Sinon couleur neutre (Colors.textWood).
 */
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from './tokens';

interface Props {
  color: string;   // injecté par expo-router (actif = orange, inactif = textWood)
  size: number;
  playedToday?: boolean;
}

export default function LotoBallIcon({ color, size, playedToday = false }: Props) {
  // Doré si pas encore joué aujourd'hui, sinon couleur standard de la tab bar
  const ballColor = !playedToday ? Colors.gold : color;
  const bandColor = !playedToday ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.7)';
  const letterColor = !playedToday ? '#7A5800' : '#555';

  const r = size / 2;
  const bandH = size * 0.36;
  const bandTop = (size - bandH) / 2;
  const letterSize = Math.round(size * 0.22);
  const numSize = Math.round(size * 0.3);

  return (
    <View style={[
      styles.ball,
      {
        width: size,
        height: size,
        borderRadius: r,
        backgroundColor: ballColor,
        borderColor: !playedToday ? '#B8860B' : color,
      },
    ]}>
      {/* Bande blanche */}
      <View style={[styles.band, { top: bandTop, height: bandH, backgroundColor: bandColor }]} />
      {/* Reflet */}
      <View style={[styles.shine, { width: size * 0.22, height: size * 0.14, borderRadius: size * 0.07 }]} />
      {/* Lettre + chiffre */}
      <View style={styles.textWrap}>
        <Text style={[styles.letter, { fontSize: letterSize, color: letterColor }]}>B</Text>
        <Text style={[styles.num, { fontSize: numSize, color: !playedToday ? '#4A3200' : color }]}>7</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ball: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  shine: {
    position: 'absolute',
    top: '8%',
    left: '12%',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  textWrap: {
    alignItems: 'center',
    zIndex: 3,
  },
  letter: {
    fontWeight: '900',
    lineHeight: undefined,
    letterSpacing: 0.5,
  },
  num: {
    fontWeight: '900',
    lineHeight: undefined,
  },
});
