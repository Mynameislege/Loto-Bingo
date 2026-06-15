import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { Server } from 'socket.io';
import { createServer } from 'http';

import { authPlugin } from './plugins/auth';
import { redisPlugin } from './plugins/redis';
import { prismaPlugin } from './plugins/prisma';

import { authRoutes } from './routes/auth';
import { gameRoutes } from './routes/game';
import { roomRoutes } from './routes/room';
import { couponRoutes } from './routes/coupon';
import { merchantRoutes } from './routes/merchant';

import { registerSocketHandlers } from './services/socket';

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);
const HOST = process.env['HOST'] ?? '0.0.0.0';

async function bootstrap(): Promise<void> {
  const app = Fastify({
    logger: {
      level: process.env['NODE_ENV'] === 'production' ? 'warn' : 'info',
    },
    pluginTimeout: 30000, // 30s — Redis on Railway peut être lent à répondre
  });

  // ── Security ──────────────────────────────────────────────────────────
  await app.register(helmet);
  await app.register(cors, {
    // En dev : tout autoriser (iPhone sur réseau local, émulateur, etc.)
    // En prod : restreindre aux origines connues
    origin: process.env['NODE_ENV'] === 'production'
      ? (process.env['ALLOWED_ORIGINS']?.split(',') ?? ['http://localhost:8081'])
      : true,
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis: undefined, // will use Redis plugin below when available
  });

  // ── Plugins ───────────────────────────────────────────────────────────
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(authPlugin);

  // ── Routes ────────────────────────────────────────────────────────────
  await app.register(authRoutes,     { prefix: '/auth' });
  await app.register(gameRoutes,     { prefix: '/game' });
  await app.register(roomRoutes,     { prefix: '/room' });
  await app.register(couponRoutes,   { prefix: '/coupon' });
  await app.register(merchantRoutes, { prefix: '/merchant' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  // ── Socket.io ─────────────────────────────────────────────────────────
  const httpServer = createServer(app.server);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env['ALLOWED_ORIGINS']?.split(',') ?? ['http://localhost:8081'],
      credentials: true,
    },
  });

  registerSocketHandlers(io, app);

  // ── Start ─────────────────────────────────────────────────────────────
  try {
    await app.ready();
    httpServer.listen(PORT, HOST, () => {
      app.log.info(`Server running at http://${HOST}:${PORT}`);
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void bootstrap();
