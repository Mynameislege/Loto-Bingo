import { Server, Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';
import * as admin from 'firebase-admin';
import { checkCard, shouldAwardCoupon } from '@loto-seniors/game-engine';
import { selectPhrase, createSession } from '@loto-seniors/host-engine';
import { SocketEvents } from '@loto-seniors/shared';

// In-memory host sessions per room (resets on server restart — acceptable for MVP)
const hostSessions = new Map<string, ReturnType<typeof createSession>>();

export function registerSocketHandlers(io: Server, app: FastifyInstance): void {
  // Attach io to the app so routes can emit events
  (app as FastifyInstance & { io: Server }).io = io;

  // ── Auth middleware ──────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    const token = socket.handshake.auth['token'] as string | undefined;
    if (!token) return next(new Error('Missing auth token'));
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      socket.data.uid = decoded.uid;
      socket.data.userId = await getUserId(app, decoded.uid);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    app.log.info(`Socket connected: ${socket.id} (uid: ${socket.data.uid as string})`);

    // ── Join room ────────────────────────────────────────────────────────
    socket.on(SocketEvents.JOIN_ROOM, async ({ roomId }: { roomId: string }) => {
      await socket.join(roomId);
      app.log.info(`Socket ${socket.id} joined room ${roomId}`);

      // Init host session for this room if first player
      if (!hostSessions.has(roomId)) {
        hostSessions.set(roomId, createSession(5));
      }

      // Announce Marcel opening
      const session = hostSessions.get(roomId)!;
      const phrase = selectPhrase({ isOpening: true, ballsDrawnCount: 0, totalBalls: 90 }, session);
      socket.emit(SocketEvents.HOST_SPEAK, {
        phraseId: phrase.id,
        audioKey: phrase.audioKey,
        text: phrase.text,
      });
    });

    // ── Claim Line ────────────────────────────────────────────────────────
    socket.on(SocketEvents.CLAIM_LINE, async ({ sessionId }: { sessionId: string }) => {
      await handleClaim(app, io, socket, sessionId, 'line');
    });

    // ── Claim Quine ───────────────────────────────────────────────────────
    socket.on(SocketEvents.CLAIM_QUINE, async ({ sessionId }: { sessionId: string }) => {
      await handleClaim(app, io, socket, sessionId, 'quine');
    });

    // ── Claim Bingo ───────────────────────────────────────────────────────
    socket.on(SocketEvents.CLAIM_BINGO, async ({ sessionId }: { sessionId: string }) => {
      await handleClaim(app, io, socket, sessionId, 'bingo');
    });

    socket.on('disconnect', () => {
      app.log.info(`Socket disconnected: ${socket.id}`);
    });
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────

async function getUserId(app: FastifyInstance, uid: string): Promise<string> {
  const user = await app.prisma.user.findUnique({ where: { firebaseUid: uid } });
  return user?.id ?? '';
}

async function handleClaim(
  app: FastifyInstance,
  io: Server,
  socket: Socket,
  sessionId: string,
  claimType: 'line' | 'quine' | 'bingo',
): Promise<void> {
  const session = await app.prisma.gameSession.findUnique({ where: { id: sessionId } });
  if (!session || session.endedAt) return;

  const card = session.card as unknown as Parameters<typeof checkCard>[0];
  const result = checkCard(card, session.ballsDrawn);

  const valid =
    claimType === 'line'  ? result.line  && !session.lineValidated  :
    claimType === 'quine' ? result.quine && !session.quineValidated :
    /* bingo */             result.bingo && !session.bingoValidated;

  if (!valid) {
    socket.emit('game:claim_rejected', { claimType });
    return;
  }

  // Determine coupon for multiplayer bingo
  let couponAwarded = false;
  if (claimType === 'bingo' && session.roomId) {
    const room = await app.prisma.room.findUnique({ where: { id: session.roomId } });
    const isFirst = !room?.firstBingoUserId;
    couponAwarded = shouldAwardCoupon(
      { mode: session.mode as 'multiplayer_public' | 'multiplayer_family', dailyBallLimit: 90, isFirstBingo: isFirst },
      session.ballsDrawn.length,
      true,
    );
    if (isFirst && session.roomId) {
      await app.prisma.room.update({
        where: { id: session.roomId },
        data: { firstBingoUserId: session.userId },
      });
    }
  }

  await app.prisma.gameSession.update({
    where: { id: sessionId },
    data: {
      lineValidated: claimType === 'line' || session.lineValidated,
      quineValidated: claimType === 'quine' || session.quineValidated,
      bingoValidated: claimType === 'bingo' || session.bingoValidated,
      couponAwarded: couponAwarded || session.couponAwarded,
      endedAt: claimType === 'bingo' ? new Date() : null,
    },
  });

  // Marcel celebration phrase
  const roomId = session.roomId;
  if (roomId) {
    const hostSession = hostSessions.get(roomId) ?? createSession(5);
    const phrase = selectPhrase(
      {
        celebrationEvent: claimType,
        isDailyBingo: session.mode === 'daily' && claimType === 'bingo',
        ballsDrawnCount: session.ballsDrawn.length,
        totalBalls: 90,
      },
      hostSession,
    );
    io.to(roomId).emit(SocketEvents.HOST_SPEAK, {
      phraseId: phrase.id,
      audioKey: phrase.audioKey,
      text: phrase.text,
    });
  }

  socket.emit(SocketEvents.RESULT_UPDATE, { claimType, valid: true, couponAwarded });

  if (claimType === 'bingo') {
    const roomIdStr = session.roomId ?? '';
    if (roomIdStr) {
      io.to(roomIdStr).emit(SocketEvents.GAME_OVER, { winnerId: session.userId, couponAwarded });
    }
  }
}
