/**
 * seasonalEvents.ts — 14 événements saisonniers Loto Seniors
 *
 * Retourne l'événement actif (ou null si aucun), avec :
 *   - thème couleurs (primary, accent, bg)
 *   - phrases Marcel spéciales
 *   - emoji et nom de la fête
 *   - skin de carton (cardBg color)
 *
 * Dates variables (Pâques, Fêtes des Mères / Pères) calculées dynamiquement.
 */

export interface SeasonalEvent {
  id:          string;
  name:        string;
  emoji:       string;
  primary:     string;   // couleur principale (boules, CTA)
  accent:      string;   // couleur secondaire (header, carton)
  bg:          string;   // fond app
  cardBg:      string;   // fond carton
  marcelPhrases: string[];
}

// ── Calendrier fixe ──────────────────────────────────────────────────────────
interface FixedEvent {
  id: string;
  startMonth: number; startDay: number;
  endMonth: number;   endDay: number;
  event: SeasonalEvent;
}

const FIXED: FixedEvent[] = [
  {
    id: 'nouvel_an', startMonth:1, startDay:1, endMonth:1, endDay:7,
    event: {
      id:'nouvel_an', name:'Bonne Année !', emoji:'🎆',
      primary:'#C8A000', accent:'#1A376C', bg:'#0A1628', cardBg:'#1A2840',
      marcelPhrases: [
        'Bonne année à toutes et à tous ! Que 2025 soit pleine de Bingos ! 🎆',
        'Le Loto du Nouvel An commence — les vœux se font en boules ! ✨',
        'Champagne ! Et si votre premier Bingo de l\'année arrivait maintenant ?',
        'Nouvelle année, nouveau carton, mêmes bonnes chances ! Allez !',
        'Marcel vous souhaite un tirage doré pour cette nouvelle année ! 🌟',
      ],
    },
  },
  {
    id: 'epiphanie', startMonth:1, startDay:6, endMonth:1, endDay:14,
    event: {
      id:'epiphanie', name:'Épiphanie', emoji:'👑',
      primary:'#C8A000', accent:'#8B6000', bg:'#FFF8E7', cardBg:'#FFF3CC',
      marcelPhrases: [
        'Qui aura la fève ? C\'est peut-être ce Bingo qui vous couronnera ! 👑',
        'Galette des rois et Loto Seniors — le roi du jour, c\'est vous !',
        'La fève est dans les boules ce soir ! Bonne Épiphanie !',
        'Que le roi ou la reine du Bingo se lève ! 🎂',
        'Marcel la joue galette : chaque boule est une chance de gagner la fève !',
      ],
    },
  },
  {
    id: 'chandeleur', startMonth:2, startDay:2, endMonth:2, endDay:2,
    event: {
      id:'chandeleur', name:'Chandeleur', emoji:'🥞',
      primary:'#F08000', accent:'#C8A000', bg:'#FFF8F0', cardBg:'#FFF3E0',
      marcelPhrases: [
        'Chandeleur oblige — chaque numéro est une crêpe dorée ! 🥞',
        'Marcel a mis la pâte à crêpes sur les boules — ça glisse bien !',
        'Retournez votre carton comme une crêpe ! C\'est l\'heure du Bingo !',
        'Votre crêpe du Bingo est prête — il ne manque que la garniture !',
        'Bonne Chandeleur ! La chance tourne comme une crêpe ce soir. 🥞',
      ],
    },
  },
  {
    id: 'saint_valentin', startMonth:2, startDay:10, endMonth:2, endDay:14,
    event: {
      id:'saint_valentin', name:'Saint-Valentin', emoji:'💝',
      primary:'#E53935', accent:'#C2185B', bg:'#FFF0F3', cardBg:'#FFE0E8',
      marcelPhrases: [
        'Amour, tendresse et… BINGO ! Bonne Saint-Valentin à tous ! 💝',
        'Marcel est amoureux des boules ce soir ! Que l\'amour guide votre carton !',
        'Le cœur fait boum, la boule fait ding — bonne Saint-Valentin ! 💕',
        'Que la chance sourie aux amoureux du Loto Seniors ce soir !',
        'Un carton plein, c\'est le plus beau cadeau de la Saint-Valentin ! 💘',
      ],
    },
  },
  {
    id: 'fete_nationale', startMonth:7, startDay:10, endMonth:7, endDay:14,
    event: {
      id:'fete_nationale', name:'14 Juillet', emoji:'🎇',
      primary:'#1565C0', accent:'#E53935', bg:'#F0F4FF', cardBg:'#E8EEFF',
      marcelPhrases: [
        'Vive la France ! Ce soir le Loto Seniors tire aux couleurs du drapeau ! 🎇',
        'Liberté, Égalité, Bingo ! Bonne fête nationale !',
        'Les feux du 14 Juillet illuminent notre carton ce soir ! 🇫🇷',
        'Marcel vous souhaite une belle fête nationale — avec un Bingo en prime !',
        'Aux armes, joueuses et joueurs ! Le Bingo n\'attend pas ! 🎆',
      ],
    },
  },
  {
    id: 'ete', startMonth:7, startDay:15, endMonth:8, endDay:31,
    event: {
      id:'ete', name:'Grandes Vacances', emoji:'☀️',
      primary:'#FF9800', accent:'#0288D1', bg:'#FFF8E1', cardBg:'#FFF3CD',
      marcelPhrases: [
        'Bonnes vacances ! Le soleil brille et le Loto Seniors aussi ☀️',
        'Parasol, glace et carton de Loto — les incontournables de l\'été !',
        'Marcel est en mode vacances — mais pas les boules ! 🏖',
        'L\'été est là : profitez du soleil entre deux Bingos ! 🌊',
        'Grandes vacances rime avec grandes chances ! À vous de jouer !',
      ],
    },
  },
  {
    id: 'toussaint', startMonth:10, startDay:25, endMonth:11, endDay:2,
    event: {
      id:'toussaint', name:'Halloween / Toussaint', emoji:'🎃',
      primary:'#FF6F00', accent:'#4A148C', bg:'#1A0A2E', cardBg:'#2A1040',
      marcelPhrases: [
        'Trick or Bingo ! Les boules sont ensorcelées ce soir ! 🎃',
        'Marcel a mis son costume de chauve-souris — bonne Toussaint !',
        'Les fantômes du carton vont sortir : BINGO ! 👻',
        'Cette nuit, même les sorcières jouent au Loto Seniors ! 🧙',
        'Qui a peur du grand méchant carton ? Pas vous ! Allez !',
      ],
    },
  },
  {
    id: 'armistice', startMonth:11, startDay:11, endMonth:11, endDay:11,
    event: {
      id:'armistice', name:'Armistice', emoji:'🕊️',
      primary:'#455A64', accent:'#B71C1C', bg:'#F5F5F5', cardBg:'#ECEFF1',
      marcelPhrases: [
        'En ce 11 novembre, une pensée pour tous ceux qui ont construit notre liberté. 🕊️',
        'Bonne fête de l\'Armistice. Jouons en paix et en mémoire. 🌹',
        'Marcel s\'incline. Que cette partie soit placée sous le signe de la fraternité.',
        '11 novembre — ensemble, en mémoire et en jeu. 🕊️',
        'La paix comme la chance se mérite. Bonne commémoration.',
      ],
    },
  },
  {
    id: 'noel', startMonth:12, startDay:15, endMonth:12, endDay:31,
    event: {
      id:'noel', name:'Noël', emoji:'🎄',
      primary:'#E53935', accent:'#2E7D32', bg:'#F8FFF8', cardBg:'#E8FFE8',
      marcelPhrases: [
        'Joyeux Noël ! Que le Père Noël apporte des Bingos pour tout le monde ! 🎅',
        'Ho Ho Ho ! Marcel a trouvé votre carton sous le sapin ! 🎄',
        'Les boules de Noël, c\'est aussi les boules de Loto ! Allez !',
        'Le plus beau cadeau de Noël ? Un BINGO bien sûr ! 🎁',
        'Joyeuses fêtes à toutes et tous ! Marcel vous gâte ce soir. ✨',
      ],
    },
  },
];

// ── Calcul Pâques (algorithme Meeus/Jones/Butcher) ───────────────────────────
function easterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day   = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// ── Fête des Mères (dernier dimanche de mai, sauf si Pentecôte = ce jour → 1er juin) ──
function feteMeres(year: number): Date {
  // Dernier dimanche de mai
  const may31 = new Date(year, 4, 31);
  const dayOfWeek = may31.getDay();
  const offset = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const lastSunday = new Date(year, 4, 31 - (dayOfWeek === 0 ? 0 : dayOfWeek));
  // Si Pentecôte ce jour-là (Pâques +49 jours), décaler au 1er juin
  const easter = easterDate(year);
  const pentecote = new Date(easter.getTime() + 49 * 86400000);
  if (lastSunday.toDateString() === pentecote.toDateString()) {
    return new Date(year, 5, 1);
  }
  return lastSunday;
}

// ── Fête des Pères (3e dimanche de juin) ────────────────────────────────────
function fetePeres(year: number): Date {
  let count = 0;
  for (let d = 1; d <= 30; d++) {
    const date = new Date(year, 5, d);
    if (date.getDay() === 0) { count++; if (count === 3) return date; }
  }
  return new Date(year, 5, 21);
}

// ── Mardi Gras (Pâques − 47 jours) ──────────────────────────────────────────
function mardiGras(year: number): Date {
  const easter = easterDate(year);
  return new Date(easter.getTime() - 47 * 86400000);
}

// ── API publique ──────────────────────────────────────────────────────────────
export function getCurrentSeasonalEvent(now = new Date()): SeasonalEvent | null {
  const year  = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based
  const day   = now.getDate();

  // Événements fixes
  for (const ev of FIXED) {
    if (inRange(month, day, ev.startMonth, ev.startDay, ev.endMonth, ev.endDay)) {
      return ev.event;
    }
  }

  // Pâques (Vendredi Saint −2j → Lundi de Pâques +1j)
  const easter = easterDate(year);
  if (inDateRange(now, addDays(easter, -2), addDays(easter, 1))) {
    return {
      id:'paques', name:'Joyeuses Pâques !', emoji:'🐣',
      primary:'#8BC34A', accent:'#F9A825', bg:'#F1F8E9', cardBg:'#E8F5E9',
      marcelPhrases: [
        'Joyeuses Pâques ! Que les œufs en chocolat apportent le Bingo ! 🐣',
        'Marcel cache des boules dans le jardin — allez les chercher !',
        'Lapin de Pâques ou Marcel ? Les deux ont des boules dorées ! 🐰',
        'Ce Loto Pâques sera plein de surprises, comme les œufs chocolat !',
        'Famille, chocolat et Loto Seniors — Joyeuses Pâques à tous ! 🌷',
      ],
    };
  }

  // Mardi Gras (±3 jours)
  const mg = mardiGras(year);
  if (inDateRange(now, addDays(mg, -3), addDays(mg, 0))) {
    return {
      id:'carnaval', name:'Mardi Gras', emoji:'🎭',
      primary:'#9C27B0', accent:'#FF9800', bg:'#FFF8FF', cardBg:'#F3E5F5',
      marcelPhrases: [
        'Carnaval ! Les boules sont déguisées ce soir — à vous de les reconnaître ! 🎭',
        'Mardi Gras oblige : Marcel porte un masque et les boules aussi !',
        'Confettis, masques et BINGO ! Joyeux Carnaval ! 🎊',
        'La fête bat son plein — que votre carton soit votre costume du Bingo !',
        'Ho Marcel est en Arlequin ! Les boules multicolores sont lâchées ! 🃏',
      ],
    };
  }

  // Fête des Mères (dimanche ± 2 jours)
  const meres = feteMeres(year);
  if (inDateRange(now, addDays(meres, -2), addDays(meres, 0))) {
    return {
      id:'fete_meres', name:'Fête des Mères', emoji:'🌸',
      primary:'#E91E63', accent:'#F06292', bg:'#FFF0F5', cardBg:'#FFE4EF',
      marcelPhrases: [
        'Bonne fête à toutes les mamans ! Ce Bingo est pour vous ! 🌸',
        'Marcel embrasse toutes les mamans joueuses du soir !',
        'La plus belle des mères mérite le plus beau des Bingos ! 💐',
        'Fête des Mères : que votre carton soit aussi fleuri que votre bouquet !',
        'Jouer ensemble, c\'est la plus belle façon de fêter les mamans. 🌷',
      ],
    };
  }

  // Fête des Pères (dimanche ± 2 jours)
  const peres = fetePeres(year);
  if (inDateRange(now, addDays(peres, -2), addDays(peres, 0))) {
    return {
      id:'fete_peres', name:'Fête des Pères', emoji:'👔',
      primary:'#1565C0', accent:'#0288D1', bg:'#F0F4FF', cardBg:'#E3F2FD',
      marcelPhrases: [
        'Bonne fête à tous les papas ! Un Bingo pour chacun d\'eux ! 👔',
        'Marcel salue les pères joueurs de ce soir — bravo pour votre persévérance !',
        'Le plus beau cadeau pour papa ? Un carton plein ! 🎁',
        'Fête des Pères : jouons ensemble, en famille !',
        'Papa, ce soir c\'est vous le champion du Loto Seniors ! 🏆',
      ],
    };
  }

  return null;
}

export function getMarcelSeasonalPhrase(event: SeasonalEvent): string {
  const phrases = event.marcelPhrases;
  return phrases[Math.floor(Math.random() * phrases.length)] ?? phrases[0]!;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function inRange(month:number, day:number, sm:number, sd:number, em:number, ed:number): boolean {
  const now  = month * 100 + day;
  const s    = sm * 100 + sd;
  const e    = em * 100 + ed;
  if (s <= e) return now >= s && now <= e;
  return now >= s || now <= e; // wrap-around (ex: Dec→Jan)
}

function inDateRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}
