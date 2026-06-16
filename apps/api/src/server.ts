import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { Server } from 'socket.io';

import { authPlugin } from './plugins/auth';
import { redisPlugin } from './plugins/redis';
import { prismaPlugin } from './plugins/prisma';

import { authRoutes } from './routes/auth';
import { gameRoutes } from './routes/game';
import { roomRoutes } from './routes/room';
import { couponRoutes } from './routes/coupon';
import { merchantRoutes } from './routes/merchant';
import { campaignRoutes } from './routes/campaign';

import { registerSocketHandlers } from './services/socket';

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);
const HOST = process.env['HOST'] ?? '0.0.0.0';

async function bootstrap(): Promise<void> {
  const app = Fastify({
    logger: {
      level: 'info',
    },
    pluginTimeout: 30000,
  });

  // ── Security ──────────────────────────────────────────────────────────
  await app.register(helmet);
  await app.register(cors, { origin: true, credentials: true });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

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
  await app.register(campaignRoutes, { prefix: '/campaign' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  // ── Socket.io — attaché directement au serveur Fastify ───────────────
  await app.ready();

  const io = new Server(app.server, {
    cors: { origin: true, credentials: true },
  });

  registerSocketHandlers(io, app);

  // ── Start ─────────────────────────────────────────────────────────────
  try {
    await app.listen({ port: PORT, host: HOST });
    console.log('Server running at http://' + HOST + ':' + PORT);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void bootstrap();
