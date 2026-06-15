import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const RegisterBody = z.object({
  displayName: z.string().min(1).max(50),
  preferredHour: z.number().int().min(0).max(23).optional(),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /auth/register
   * Called after Firebase sign-in. Creates or returns the User record.
   */
  app.post(
    '/register',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const body = RegisterBody.safeParse(request.body);
      if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

      const { uid, email } = request.user;
      const { displayName, preferredHour } = body.data;

      const user = await app.prisma.user.upsert({
        where: { firebaseUid: uid },
        create: { firebaseUid: uid, displayName, email, preferredHour },
        update: { displayName, email },
      });

      return reply.send(user);
    },
  );

  /**
   * GET /auth/me
   * Returns the authenticated user's profile.
   */
  app.get(
    '/me',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = await app.prisma.user.findUnique({
        where: { firebaseUid: request.user.uid },
      });
      if (!user) return reply.status(404).send({ error: 'User not found' });
      return reply.send(user);
    },
  );

  /**
   * GET /auth/stats
   * Returns game statistics for the authenticated user.
   */
  app.get(
    '/stats',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = await app.prisma.user.findUnique({
        where: { firebaseUid: request.user.uid },
        include: {
          gameSessions: {
            select: {
              id: true,
              bingoValidated: true,
              lineValidated: true,
              quineValidated: true,
              couponAwarded: true,
              endedAt: true,
            },
          },
          playerCoupons: { select: { id: true, usedAt: true } },
          dailyGames: {
            orderBy: { date: 'desc' },
            take: 30,
            select: { date: true },
          },
        },
      });

      if (!user) return reply.status(404).send({ error: 'User not found' });

      const gamesPlayed = user.gameSessions.filter(s => s.endedAt !== null).length;
      const bingos = user.gameSessions.filter(s => s.bingoValidated).length;
      const coupons = user.playerCoupons.length;

      // Calcul de la série (jours consécutifs)
      let streakDays = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < user.dailyGames.length; i++) {
        const gameDate = new Date(user.dailyGames[i]!.date);
        gameDate.setHours(0, 0, 0, 0);
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        if (gameDate.getTime() === expectedDate.getTime()) {
          streakDays++;
        } else {
          break;
        }
      }

      // Niveau simple basé sur les parties jouées
      const level = Math.floor(gamesPlayed / 10) + 1;
      const xp = gamesPlayed * 10 + bingos * 50;
      const xpNext = level * 100;

      return reply.send({ gamesPlayed, bingos, coupons, streakDays, level, xp, xpNext });
    },
  );
}
