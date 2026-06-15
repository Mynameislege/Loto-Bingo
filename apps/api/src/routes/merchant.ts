import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const CreateMerchantBody = z.object({
  siret: z.string().length(14),
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  address: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  subscriptionTier: z.enum(['discovery', 'standard', 'premium', 'event']),
});

const CreateOfferBody = z.object({
  description: z.string().min(1).max(200),
  monthlyStock: z.number().int().min(1).max(1000),
  dailyCap: z.number().int().min(1).max(100).default(2),
  weeklyPlayerCap: z.number().int().min(1).max(10).default(1),
  validUntil: z.string().datetime(),
});

export async function merchantRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /merchant
   * Register a merchant (sponsor portal).
   */
  app.post(
    '/',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const parsed = CreateMerchantBody.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

      const merchant = await app.prisma.merchant.create({ data: parsed.data });
      return reply.status(201).send(merchant);
    },
  );

  /**
   * POST /merchant/:merchantId/offer
   * Create a coupon offer for a merchant.
   */
  app.post(
    '/:merchantId/offer',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { merchantId } = request.params as { merchantId: string };
      const parsed = CreateOfferBody.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() });

      const offer = await app.prisma.couponOffer.create({
        data: { ...parsed.data, merchantId },
      });
      return reply.status(201).send(offer);
    },
  );

  /**
   * GET /merchant/:merchantId/stats
   * Dashboard stats for a merchant.
   */
  app.get(
    '/:merchantId/stats',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { merchantId } = request.params as { merchantId: string };

      const [distributed, used] = await Promise.all([
        app.prisma.playerCoupon.count({ where: { merchantId } }),
        app.prisma.playerCoupon.count({ where: { merchantId, usedAt: { not: null } } }),
      ]);

      const conversionRate = distributed > 0 ? Math.round((used / distributed) * 100) : 0;

      return reply.send({ merchantId, distributed, used, conversionRate });
    },
  );

  /**
   * GET /merchant/nearby
   * Return active merchants within radius_km of a lat/lng (uses PostGIS).
   */
  app.get(
    '/nearby',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { lat, lng, radius_km = 10 } = z.object({
        lat: z.coerce.number(),
        lng: z.coerce.number(),
        radius_km: z.coerce.number().default(10),
      }).parse(request.query);

      // PostGIS ST_DWithin query via Prisma $queryRaw
      const merchants = await app.prisma.$queryRaw<{ id: string; name: string; category: string; distance_m: number }[]>`
        SELECT id, name, category,
               ST_Distance(
                 ST_SetSRID(ST_Point(lng, lat), 4326)::geography,
                 ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)::geography
               ) AS distance_m
        FROM merchants
        WHERE active = true
          AND ST_DWithin(
            ST_SetSRID(ST_Point(lng, lat), 4326)::geography,
            ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)::geography,
            ${radius_km * 1000}
          )
        ORDER BY distance_m ASC
        LIMIT 50
      `;

      return reply.send(merchants);
    },
  );
}
