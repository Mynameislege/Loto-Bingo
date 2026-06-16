import { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { generateCard, generateBallSequence, fillWithGhosts } from '@loto-seniors/game-engine';
import { MatchmakingRequest } from '@loto-seniors/shared';

const ROOM_SIZE = 10;
const MATCHMAKING_WAIT_MS = 10_000; // 10 seconds then fill ghosts

export async function roomRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /room/join
   * Matchmaking: find or create a room, return roomId immediately.
   * Ghost fill happens automatically after MATCHMAKING_WAIT_MS via Socket.io.
   */
  app.post(
    '/join',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const parsed = MatchmakingRequest.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

      const { mode, inviteCode } = parsed.data;

      const user = await app.prisma.user.findUnique({
        where: { firebaseUid: request.user.uid },
      });
      if (!user) return reply.status(404).send({ error: 'User not found' });

      let room;

      if (mode === 'multiplayer_family' && inviteCode) {
        // Family room — find by invite code
        room = await app.prisma.room.findUnique({
          where: { inviteCode },
          include: { players: true },
        });
        if (!room) return reply.status(404).send({ error: 'Room not found' });
        if (room.status !== 'waiting') return reply.status(409).send({ error: 'Room already started' });
      } else {
        // Public — find open room with space
        room = await app.prisma.room.findFirst({
          where: {
            mode: 'multiplayer_public',
            status: 'waiting',
            players: { some: {} }, // at least one player
          },
          include: { players: true },
          orderBy: { createdAt: 'asc' }, // join oldest room first
        });

        if (!room || (room.players?.length ?? 0) >= ROOM_SIZE) {
          // Create a new room
          const ballSequence = generateBallSequence();
          room = await app.prisma.room.create({
            data: {
              mode: 'multiplayer_public',
              status: 'waiting',
              maxPlayers: ROOM_SIZE,
              ballSequence,
            },
            include: { players: true },
          });

          // Schedule ghost fill after MATCHMAKING_WAIT_MS
          void scheduleGhostFill(app, room.id, MATCHMAKING_WAIT_MS);
        }
      }

      // Generate card and join room
      const card = generateCard();
      await app.prisma.roomPlayer.create({
        data: {
          roomId: room.id,
          userId: user.id,
          card: card as unknown as Prisma.InputJsonValue,
        },
      });

      const playerCount = (room.players?.length ?? 0) + 1;

      return reply.send({
        roomId: room.id,
        status: room.status,
        playerCount,
        card,
        startCountdownMs: playerCount >= ROOM_SIZE ? 5000 : MATCHMAKING_WAIT_MS,
      });
    },
  );

  /**
   * POST /room/create-family
   * Create a family room with an invite code.
   */
  app.post(
    '/create-family',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = await app.prisma.user.findUnique({
        where: { firebaseUid: request.user.uid },
      });
      if (!user) return reply.status(404).send({ error: 'User not found' });

      const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
      const ballSequence = generateBallSequence();
      const card = generateCard();

      const room = await app.prisma.room.create({
        data: {
          mode: 'multiplayer_family',
          status: 'waiting',
          inviteCode,
          maxPlayers: ROOM_SIZE,
          ballSequence,
          players: {
            create: {
              userId: user.id,
              card: card as unknown as Prisma.InputJsonValue,
            },
          },
        },
      });

      return reply.send({ roomId: room.id, inviteCode, card });
    },
  );
}

/**
 * After the wait window, fill remaining slots with ghost players and start the game.
 * Called server-side via setTimeout — fires a Socket.io event to start the countdown.
 */
async function scheduleGhostFill(
  app: FastifyInstance,
  roomId: string,
  delayMs: number,
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  const room = await app.prisma.room.findUnique({
    where: { id: roomId },
    include: { players: true },
  });
  if (!room || room.status !== 'waiting') return;

  const realCount = room.players.filter((p: { isGhost: boolean }) => !p.isGhost).length;
  if (realCount === 0) {
    // Nobody joined — abandon room
    await app.prisma.room.update({ where: { id: roomId }, data: { status: 'finished' } });
    return;
  }

  const ghosts = fillWithGhosts(room.players.length, ROOM_SIZE);

  if (ghosts.length > 0) {
    await app.prisma.roomPlayer.createMany({
      data: ghosts.map((g) => ({
        roomId,
        isGhost: true,
        ghostName: g.displayName,
        card: g.card as unknown as Record<string, unknown>[],
        reactionDelayMs: g.reactionDelayMs,
      })),
    });
  }

  await app.prisma.room.update({
    where: { id: roomId },
    data: { status: 'starting', startedAt: new Date() },
  });

  // Emit countdown to all sockets in this room
  // (io is injected via the socket service — accessed through app)
  const io = (app as FastifyInstance & { io?: { to: (r: string) => { emit: (e: string, d: unknown) => void } } }).io;
  io?.to(roomId).emit('room:status', { status: 'starting', countdownMs: 5000 });

  // Start the game after 5s countdown
  setTimeout(() => {
    void startRoom(app, roomId);
  }, 5000);
}

async function startRoom(app: FastifyInstance, roomId: string): Promise<void> {
  await app.prisma.room.update({
    where: { id: roomId },
    data: { status: 'active' },
  });
  const io = (app as FastifyInstance & { io?: { to: (r: string) => { emit: (e: string, d: unknown) => void } } }).io;
  io?.to(roomId).emit('room:status', { status: 'active' });
}
