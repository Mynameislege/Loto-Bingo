import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

async function plugin(app: FastifyInstance): Promise<void> {
  const redis = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
  });

  // Wait for ready or first error (max 25s)
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Redis connection timeout after 25s')), 25000);
    redis.once('ready', () => { clearTimeout(timer); resolve(); });
    redis.once('error', (err: Error) => { clearTimeout(timer); reject(err); });
  });

  app.decorate('redis', redis);

  app.addHook('onClose', async () => {
    await redis.quit();
  });
}

export const redisPlugin = fp(plugin, { name: 'redis' });
