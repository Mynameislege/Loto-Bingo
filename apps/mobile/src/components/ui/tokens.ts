// ─── Design Tokens — Loto Seniors ────────────────────────────────────────
// Tapis vert feutré + bois traditionnel de jeu + ivoire — charte UX senior

export const Colors = {
  // Tapis
  background:   '#1A4A2A',  // vert tapis foncé
  surface:      '#1E5C30',  // cartes et inputs sur tapis
  surfaceLight: '#2A7040',  // hover / pressed

  // Bois traditionnel
  wood:         '#4A2E0E',  // bois foncé (châssis)
  woodMid:      '#6B3F16',  // bois milieu (cadres)
  woodLight:    '#A0622A',  // bois clair (accents)
  woodGrain:    '#C4924A',  // fil du bois / bordures
  parchment:    '#F5EDD6',  // parchemin (carton de loto)
  parchmentDim: '#E8D9B8',  // parchemin foncé (cases vides)

  // Texte
  text:         '#F5F0E0',  // crème ivoire
  textDark:     '#2A1A08',  // texte sur parchemin
  textMuted:    '#B8C9B0',  // texte secondaire sur tapis
  textWood:     '#D4A96A',  // texte sur bois

  // Accents
  orange:       '#F08000',  // accent principal / CTA
  gold:         '#C8A000',  // bordures premium / étoiles
  goldLight:    '#F0CC50',  // or clair
  navy:         '#1A376C',  // Marcel / badges info
  red:          '#C0392B',  // boules rouges (couleur loto)
  blue:         '#1A5C9A',  // boules bleues
  purple:       '#6B3FA0',  // boules violettes

  success:      '#4CAF50',
  error:        '#E53935',
  white:        '#FFFFFF',
} as const;

export const Typography = {
  h1:    { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  h2:    { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h3:    { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  body:  { fontSize: 18, fontWeight: '400' as const, lineHeight: 26 },
  small: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  // Minimums UX senior : jamais en dessous de 18pt
} as const;

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const Radius = {
  sm: 8, md: 12, lg: 20, full: 999,
} as const;

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
} as const;
