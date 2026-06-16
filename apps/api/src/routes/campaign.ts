import { FastifyInstance } from 'fastify';
import { z } from 'zod';

// ── Paliers par level ──────────────────────────────────────────────────────
const PALIERS = [
  { min: 1,  max: 2,  name: 'village' },
  { min: 3,  max: 4,  name: 'commune' },
  { min: 5,  max: 6,  name: 'bourg' },
  { min: 7,  max: 9,  name: 'cité' },
  { min: 10, max: 14, name: 'métropole' },
  { min: 15, max: 999, name: 'champion' },
];

// XP requis pour atteindre chaque level (index = level - 1)
const XP_TABLE = [0, 100, 250, 500, 900, 1500, 2200, 3200, 4500, 6000, 8000, 10500, 13500, 17000, 21000];

function getPalier(level: number): string {
  return PALIERS.find(p => level >= p.min && level <= p.max)?.name ?? 'champion';
}

function computeLevel(xp: number): number {
  let level = 1;
  for (let i = 1; i < XP_TABLE.length; i++) {
    if (xp >= (XP_TABLE[i] ?? Infinity)) level = i + 1;
    else break;
  }
  return level;
}

const PlayBody = z.object({
  result:     z.enum(['line', 'quine', 'bingo', 'none']),
  ballsDrawn: z.number().int().min(1).max(90),
});

export async function campaignRoutes(app: FastifyInstance): Promise<void> {

  /**
   * GET /campaign/me
   * Retourne la progression campagne du joueur connecté.
   */
  app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { firebaseUid: (request as any).userId },
      select: { xp: true, level: true, totalGames: true, totalBingos: true, streakDays: true },
    });

    if (!user) return reply.status(404).send({ error: 'User not found' });

    return reply.send({
      xp:          user.xp,
      stars:       user.totalBingos,   // 1 bingo = 1 étoile (proxy simple)
      level:       user.level,
      palier:      getPalier(user.level),
      gamesPlayed: user.totalGames,
    });
  });

  /**
   * POST /campaign/play
   * Enregistre une partie et attribue l'XP.
   * Body: { result: 'line'|'quine'|'bingo'|'none', ballsDrawn: number }
   */
  app.post('/play', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { result, ballsDrawn } = PlayBody.parse(request.body);

    const user = await app.prisma.user.findUnique({
      where: { firebaseUid: (request as any).userId },
      select: { xp: true, level: true, totalGames: true, totalBingos: true },
    });

    if (!user) return reply.status(404).send({ error: 'User not found' });

    // ── Calcul XP ────────────────────────────────────────────────────────
    const xpBase =
      result === 'bingo' ? 100 :
      result === 'quine' ?  40 :
      result === 'line'  ?  15 : 0;
    const xpBalls = ballsDrawn; // 1 XP par boule tirée
    const xpEarned = xpBase + xpBalls;

    const newXp        = user.xp + xpEarned;
    const newLevel     = computeLevel(newXp);
    const leveledUp    = newLevel > user.level;
    const newTotalBingos = result === 'bingo' ? user.totalBingos + 1 : user.totalBingos;

    await app.prisma.user.update({
      where: { firebaseUid: (request as any).userId },
      data: {
        xp:          newXp,
        level:       newLevel,
        totalGames:  user.totalGames + 1,
        totalBingos: newTotalBingos,
      },
    });

    return reply.send({
      xpEarned,
      xp:      newXp,
      stars:   newTotalBingos,
      level:   newLevel,
      palier:  getPalier(newLevel),
      leveledUp,
    });
  });
}
