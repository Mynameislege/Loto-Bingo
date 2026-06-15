import { FastifyInstance } from 'fastify';
import { generateCard, generateBallSequence, checkCard, shouldAwardCoupon } from '@loto-seniors/game-engine';

export async function gameRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /game/daily/start
   * Start (or return existing) today's Loto du Jour for the authenticated player.
   * Solo, instant launch, no waiting.
   */
  app.post(
    '/daily/start',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      // Auto-créer l'utilisateur en DB s'il n'existe pas encore
      // (possible si l'inscription a échoué côté API mais a réussi côté Firebase)
      const user = await app.prisma.user.upsert({
        where: { firebaseUid: request.user.uid },
        create: {
          firebaseUid: request.user.uid,
          displayName: request.user.name ?? 'Joueur',
          email: request.user.email ?? '',
        },
        update: {},
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if already played today — retourner la session existante plutôt que 409
      const existing = await app.prisma.dailyGame.findUnique({
        where: { userId_date: { userId: user.id, date: today } },
        include: { gameSession: true },
      });
      if (existing?.gameSession) {
        const s = existing.gameSession;
        // Renvoyer la session du jour pour permettre la reprise de partie
        return reply.send({
          sessionId: s.id,
          card: s.card,
          ballsDrawn: s.ballsDrawn,
          checkResult: {
            line: s.lineValidated,
            quine: s.quineValidated,
            bingo: s.bingoValidated,
          },
          gameOver: s.endedAt !== null,
          resumed: true,
        });
      }

      // Create session + card
      const card = generateCard();
      const ballSequence = generateBallSequence();

      const session = await app.prisma.gameSession.create({
        data: {
          userId: user.id,
          mode: 'daily',
          card: card as unknown as Record<string, unknown>[],
          ballsDrawn: [],
        },
      });

      // Create DailyGame record to enforce 1-per-day constraint
      await app.prisma.dailyGame.create({
        data: {
          userId: user.id,
          date: today,
          gameSessionId: session.id,
        },
      });

      // Store ball sequence in Redis (not in DB — server-authoritative, ephemeral)
      await app.redis.setex(
        `daily:sequence:${session.id}`,
        86400, // 24h TTL
        JSON.stringify(ballSequence),
      );

      return reply.send({ sessionId: session.id, card });
    },
  );

  /**
   * POST /game/daily/:sessionId/draw
   * Draw the next ball. Server-authoritative.
   * Returns the ball + updated check result + optional coupon award.
   */
  app.post(
    '/daily/:sessionId/draw',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { sessionId } = request.params as { sessionId: string };

      const session = await app.prisma.gameSession.findUnique({
        where: { id: sessionId },
        include: { user: true },
      });
      if (!session) return reply.status(404).send({ error: 'Session not found' });
      if (session.user.firebaseUid !== request.user.uid) return reply.status(403).send({ error: 'Forbidden' });
      if (session.endedAt) return reply.status(409).send({ error: 'Game already ended' });

      // Retrieve ball sequence from Redis
      const seqRaw = await app.redis.get(`daily:sequence:${sessionId}`);
      if (!seqRaw) return reply.status(410).send({ error: 'Session expired' });
      const sequence: number[] = JSON.parse(seqRaw) as number[];

      const drawnCount = session.ballsDrawn.length;
      if (drawnCount >= 90) return reply.status(409).send({ error: 'All balls drawn' });

      const ball = sequence[drawnCount];
      if (ball === undefined) return reply.status(500).send({ error: 'Invalid sequence' });

      const newBallsDrawn = [...session.ballsDrawn, ball];
      const card = session.card as unknown as Parameters<typeof checkCard>[0];
      const checkResult = checkCard(card, newBallsDrawn);

      // Coupon: Bingo AND within 70-ball daily limit
      const DAILY_BALL_LIMIT = 70;
      const shouldGiveCoupon =
        checkResult.bingo &&
        !session.couponAwarded &&
        shouldAwardCoupon(
          { mode: 'daily', dailyBallLimit: DAILY_BALL_LIMIT },
          newBallsDrawn.length,
          true,
        );

      const gameOver = checkResult.bingo || drawnCount + 1 >= 90;

      // If coupon is awarded, find an active offer and create a PlayerCoupon record
      let couponAwarded = false;
      if (shouldGiveCoupon) {
        const offer = await app.prisma.couponOffer.findFirst({
          where: {
            active: true,
            validUntil: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (offer) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7); // valid for 7 days

          await app.prisma.playerCoupon.create({
            data: {
              userId: session.user.id,
              couponOfferId: offer.id,
              merchantId: offer.merchantId,
              expiresAt,
            },
          });
          couponAwarded = true;
        }
      }

      await app.prisma.gameSession.update({
        where: { id: sessionId },
        data: {
          ballsDrawn: newBallsDrawn,
          lineValidated: checkResult.line,
          quineValidated: checkResult.quine,
          bingoValidated: checkResult.bingo,
          couponAwarded,
          endedAt: gameOver ? new Date() : undefined,
        },
      });

      return reply.send({
        ball,
        ballsDrawnCount: newBallsDrawn.length,
        checkResult,
        couponAwarded,
        gameOver,
      });
    },
  );
}
