import { HostContent } from './types';

export const hostContent: HostContent = {
  version: '1.0.0-mvp',
  phrases: [

    // ── OUVERTURE ─────────────────────────────────────────────────────────
    { id: 'open_1', category: 'opening', variant: 1,
      text: 'Mesdames et messieurs, bienvenue ! La partie va commencer...' },
    { id: 'open_2', category: 'opening', variant: 2,
      text: 'Alors, tout le monde est prêt ? On y va !' },
    { id: 'open_3', category: 'opening', variant: 3,
      text: 'Les cartons sont prêts, les boules aussi — c\'est parti !' },

    // ── APPELS DE NUMÉROS ─────────────────────────────────────────────────
    // Numéros emblématiques avec folklore
    { id: 'num_1_1', category: 'number_call', number: 1, variant: 1,
      text: 'Le Un ! Le commencement de toute chose...' },
    { id: 'num_1_2', category: 'number_call', number: 1, variant: 2,
      text: 'Le numéro Un ! On commence fort !' },
    { id: 'num_1_3', category: 'number_call', number: 1, variant: 3,
      text: 'Le Un ! Le premier de la classe !' },

    { id: 'num_7_1', category: 'number_call', number: 7, variant: 1,
      text: 'Le Sept ! Le chiffre porte-bonheur — c\'est bon signe !' },
    { id: 'num_7_2', category: 'number_call', number: 7, variant: 2,
      text: 'Sept ! Les sept merveilles du monde !' },
    { id: 'num_7_3', category: 'number_call', number: 7, variant: 3,
      text: 'Le chiffre 7, le préféré de beaucoup ici !' },

    { id: 'num_11_1', category: 'number_call', number: 11, variant: 1,
      text: 'Onze — les deux bâtons bien droits !' },
    { id: 'num_11_2', category: 'number_call', number: 11, variant: 2,
      text: 'Onze ! Les deux jambes de la victoire !' },
    { id: 'num_11_3', category: 'number_call', number: 11, variant: 3,
      text: 'Le onze — comme les joueurs de l\'équipe de France !' },

    { id: 'num_13_1', category: 'number_call', number: 13, variant: 1,
      text: 'Le Treize ! Pas si malchanceux, vous allez voir...' },
    { id: 'num_13_2', category: 'number_call', number: 13, variant: 2,
      text: 'Treize ! Le vendredi 13 peut être de bon augure !' },
    { id: 'num_13_3', category: 'number_call', number: 13, variant: 3,
      text: 'Treize — à table !' },

    { id: 'num_22_1', category: 'number_call', number: 22, variant: 1,
      text: 'Vingt-deux — les p\'tits canards sur la mare !' },
    { id: 'num_22_2', category: 'number_call', number: 22, variant: 2,
      text: 'Vingt-deux ! Voilà les deux petits canetons !' },
    { id: 'num_22_3', category: 'number_call', number: 22, variant: 3,
      text: 'Le vingt-deux — coin coin !' },

    { id: 'num_33_1', category: 'number_call', number: 33, variant: 1,
      text: 'Trente-trois ! Dites trente-trois...' },
    { id: 'num_33_2', category: 'number_call', number: 33, variant: 2,
      text: 'Trente-trois — comme dirait le docteur !' },
    { id: 'num_33_3', category: 'number_call', number: 33, variant: 3,
      text: 'Le trente-trois, l\'âge du Christ !' },

    { id: 'num_42_1', category: 'number_call', number: 42, variant: 1,
      text: 'Quarante-deux ! La réponse à tout, paraît-il...' },
    { id: 'num_42_2', category: 'number_call', number: 42, variant: 2,
      text: 'Quarante-deux — la réponse à l\'univers !' },
    { id: 'num_42_3', category: 'number_call', number: 42, variant: 3,
      text: 'Le quarante-deux ! Si vous savez, vous savez...' },

    { id: 'num_51_1', category: 'number_call', number: 51, variant: 1,
      text: 'Cinquante et un ! Et ça, Michel, c\'est son chiffre préféré...' },
    { id: 'num_51_2', category: 'number_call', number: 51, variant: 2,
      text: 'Cinquante et un — un chiffre qui a de la personnalité !' },
    { id: 'num_51_3', category: 'number_call', number: 51, variant: 3,
      text: 'Le cinquante et un ! Certains d\'entre vous sourient, je le sens.' },

    { id: 'num_69_1', category: 'number_call', number: 69, variant: 1,
      text: 'Soixante-neuf — allons, on ne dit rien !' },
    { id: 'num_69_2', category: 'number_call', number: 69, variant: 2,
      text: 'Soixante-neuf... (silence) ...très bien, continuons !' },
    { id: 'num_69_3', category: 'number_call', number: 69, variant: 3,
      text: 'Le soixante-neuf — je vois des sourires, c\'est bien !' },

    { id: 'num_77_1', category: 'number_call', number: 77, variant: 1,
      text: 'Les deux parapluies ! Soixante-dix-sept !' },
    { id: 'num_77_2', category: 'number_call', number: 77, variant: 2,
      text: 'Soixante-dix-sept — les deux cygnes !' },
    { id: 'num_77_3', category: 'number_call', number: 77, variant: 3,
      text: 'Le soixante-dix-sept ! Avec ce temps, il faudra les parapluies !' },

    { id: 'num_88_1', category: 'number_call', number: 88, variant: 1,
      text: 'Les deux grosses dames — quatre-vingt-huit !' },
    { id: 'num_88_2', category: 'number_call', number: 88, variant: 2,
      text: 'Quatre-vingt-huit — les deux anneaux !' },
    { id: 'num_88_3', category: 'number_call', number: 88, variant: 3,
      text: 'Le quatre-vingt-huit — les deux rondes !' },

    { id: 'num_90_1', category: 'number_call', number: 90, variant: 1,
      text: 'Et voilà le dernier — le Quatre-vingt-dix !' },
    { id: 'num_90_2', category: 'number_call', number: 90, variant: 2,
      text: 'Quatre-vingt-dix ! Le dernier en piste !' },
    { id: 'num_90_3', category: 'number_call', number: 90, variant: 3,
      text: 'Le quatre-vingt-dix — le grand final !' },

    // Appels génériques (pour les numéros sans folklore spécifique)
    { id: 'num_gen_1', category: 'number_call', variant: 1,
      text: 'Et on continue — la suivante !' },
    { id: 'num_gen_2', category: 'number_call', variant: 2,
      text: 'Les boules n\'attendent pas !' },
    { id: 'num_gen_3', category: 'number_call', variant: 3,
      text: 'En route, en route !' },

    // ── TENSION ───────────────────────────────────────────────────────────
    { id: 'tension_line_1', category: 'tension', tensionLevel: 'line', variant: 1,
      text: 'Je sens que quelqu\'un est tout proche là...' },
    { id: 'tension_line_2', category: 'tension', tensionLevel: 'line', variant: 2,
      text: 'Encore une petite boule et c\'est la ligne !' },
    { id: 'tension_line_3', category: 'tension', tensionLevel: 'line', variant: 3,
      text: 'Ça commence à chaufffer dans les cartons !' },

    { id: 'tension_quine_1', category: 'tension', tensionLevel: 'quine', variant: 1,
      text: 'Une petite boule et c\'est la gloire !' },
    { id: 'tension_quine_2', category: 'tension', tensionLevel: 'quine', variant: 2,
      text: 'Oh oh oh... quelqu\'un est très proche de la quine !' },
    { id: 'tension_quine_3', category: 'tension', tensionLevel: 'quine', variant: 3,
      text: 'La quine est à portée de main — on retient son souffle !' },

    { id: 'tension_bingo_1', category: 'tension', tensionLevel: 'bingo', variant: 1,
      text: 'Attention, attention — le bingo est tout proche !' },
    { id: 'tension_bingo_2', category: 'tension', tensionLevel: 'bingo', variant: 2,
      text: 'Le grand moment approche... une boule suffit !' },
    { id: 'tension_bingo_3', category: 'tension', tensionLevel: 'bingo', variant: 3,
      text: 'Je le sens... ça va tomber d\'une seconde à l\'autre !' },

    // ── CÉLÉBRATIONS ──────────────────────────────────────────────────────
    { id: 'cel_line_1', category: 'celebration', celebrationEvent: 'line', variant: 1,
      text: 'LIGNE ! Voilà qui commence bien !' },
    { id: 'cel_line_2', category: 'celebration', celebrationEvent: 'line', variant: 2,
      text: 'Une belle première ligne — bravo !' },
    { id: 'cel_line_3', category: 'celebration', celebrationEvent: 'line', variant: 3,
      text: 'LIGNE ! On est lancé !' },

    { id: 'cel_quine_1', category: 'celebration', celebrationEvent: 'quine', variant: 1,
      text: 'QUINE ! Oh là là, ça chauffe sérieusement !' },
    { id: 'cel_quine_2', category: 'celebration', celebrationEvent: 'quine', variant: 2,
      text: 'LA QUINE ! Magnifique — plus qu\'une ligne !' },
    { id: 'cel_quine_3', category: 'celebration', celebrationEvent: 'quine', variant: 3,
      text: 'QUINE ! On y est presque !' },

    { id: 'cel_bingo_1', category: 'celebration', celebrationEvent: 'bingo', variant: 1,
      text: 'BINGO !!! Mesdames et messieurs, nous avons un grand gagnant !' },
    { id: 'cel_bingo_2', category: 'celebration', celebrationEvent: 'bingo', variant: 2,
      text: 'BINGO !!! C\'est fabuleux ! Quelle belle partie !' },
    { id: 'cel_bingo_3', category: 'celebration', celebrationEvent: 'bingo', variant: 3,
      text: 'BINGO !!! Et voilà — la victoire est au bout du carton !' },

    { id: 'cel_bingo_daily_1', category: 'celebration', celebrationEvent: 'bingo_daily', variant: 1,
      text: 'BINGO ! Et voilà votre coupon du jour — bien mérité !' },
    { id: 'cel_bingo_daily_2', category: 'celebration', celebrationEvent: 'bingo_daily', variant: 2,
      text: 'BINGO ! Le coupon est à vous — quelle belle matinée !' },
    { id: 'cel_bingo_daily_3', category: 'celebration', celebrationEvent: 'bingo_daily', variant: 3,
      text: 'BINGO ! Votre récompense du jour vous attend !' },

    // ── FILLERS ───────────────────────────────────────────────────────────
    { id: 'fill_1', category: 'filler', variant: 1,
      text: 'La patience est une vertu, on le sait tous ici...' },
    { id: 'fill_2', category: 'filler', variant: 2,
      text: 'On est à mi-chemin — tout peut encore arriver !' },
    { id: 'fill_3', category: 'filler', variant: 3,
      text: 'Les dernières boules sont toujours les plus importantes.' },
    { id: 'fill_4', category: 'filler', variant: 1,
      text: 'La chance est capricieuse, mais elle finit toujours par revenir.' },
    { id: 'fill_5', category: 'filler', variant: 2,
      text: 'Restez concentrés — les boules n\'ont pas dit leur dernier mot !' },

    // ── FIN SANS VICTOIRE ─────────────────────────────────────────────────
    { id: 'end_1', category: 'end_no_win', variant: 1,
      text: 'Ce n\'est pas pour cette fois — mais demain est un autre jour !' },
    { id: 'end_2', category: 'end_no_win', variant: 2,
      text: 'La prochaine partie, c\'est la bonne. J\'en suis certain.' },
    { id: 'end_3', category: 'end_no_win', variant: 3,
      text: 'Si près ! Vraiment si près... On revient vite, hein ?' },

    // ── PERSONNALISÉ ──────────────────────────────────────────────────────
    { id: 'pers_return_1', category: 'personal', personalTrigger: 'player_return', variant: 1,
      text: 'Content de vous revoir ! La chance vous sourit aujourd\'hui ?' },
    { id: 'pers_streak_7_1', category: 'personal', personalTrigger: 'streak_7', variant: 1,
      text: 'Sept jours de suite — quelle belle fidélité !' },
    { id: 'pers_first_bingo_1', category: 'personal', personalTrigger: 'first_bingo_ever', variant: 1,
      text: 'Votre tout premier Bingo ! Ce moment-là, on ne l\'oublie pas.' },
    { id: 'pers_part100_1', category: 'personal', personalTrigger: 'game_100', variant: 1,
      text: 'La centième partie ! Vous êtes un fidèle de la maison !' },

    // ── SAISONNIERS ───────────────────────────────────────────────────────
    { id: 'sea_noel_1', category: 'seasonal', seasonalEvent: 'noel', variant: 1,
      text: 'En décembre, même les boules semblent briller davantage...' },
    { id: 'sea_paques_1', category: 'seasonal', seasonalEvent: 'paques', variant: 1,
      text: 'Comme les œufs cachés, les bonnes surprises se trouvent toujours !' },
    { id: 'sea_14juillet_1', category: 'seasonal', seasonalEvent: '14juillet', variant: 1,
      text: 'Allez les boules, vive la République !' },
    { id: 'sea_beaujolais_1', category: 'seasonal', seasonalEvent: 'beaujolais', variant: 1,
      text: 'Ce soir, les boules ont un léger goût de Gamay...' },
    { id: 'sea_fete_meres_1', category: 'seasonal', seasonalEvent: 'fete_meres', variant: 1,
      text: 'Ce tirage, on le dédie à toutes les mamans du salon !' },
    { id: 'sea_seniors_1', category: 'seasonal', seasonalEvent: 'journee_seniors', variant: 1,
      text: 'Aujourd\'hui, c\'est votre journée. Chaque partie est pour vous.' },

    // ── FERMETURE ─────────────────────────────────────────────────────────
    { id: 'close_1', category: 'closing', variant: 1,
      text: 'Merci à tous — à très bientôt pour une nouvelle partie !' },
    { id: 'close_2', category: 'closing', variant: 2,
      text: 'Belle partie ! On se retrouve demain pour le Loto du Jour ?' },
    { id: 'close_3', category: 'closing', variant: 3,
      text: 'À bientôt — prenez soin de vous !' },
  ],
};
