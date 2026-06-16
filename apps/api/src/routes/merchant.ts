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
   * Return active merchants within radius (meters) of a lat/lng.
   * Uses Haversine formula — no PostGIS required.
   * Mobile sends: ?lat=...&lng=...&radius=10000 (meters)
   */
  app.get(
    '/nearby',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { lat, lng, radius } = z.object({
        lat:    z.coerce.number().min(-90).max(90),
        lng:    z.coerce.number().min(-180).max(180),
        radius: z.coerce.number().default(10000),
      }).parse(request.query);

      // Haversine — pure Postgres, aucune extension requise
      type NearbyRow = {
        id: string; name: string; address: string;
        distance_m: number;
        coupon_description: string | null;
        stock_remaining: number | null;
      };

      const rows = await app.prisma.$queryRaw<NearbyRow[]>`
        SELECT
          m.id,
          m.name,
          m.address,
          ROUND(
            6371000.0 * 2.0 * ASIN(SQRT(
              POWER(SIN(RADIANS((m.lat - ${lat}) / 2.0)), 2) +
              COS(RADIANS(${lat})) * COS(RADIANS(m.lat)) *
              POWER(SIN(RADIANS((m.lng - ${lng}) / 2.0)), 2)
            ))
          )::int AS distance_m,
          co.description  AS coupon_description,
          (co.monthly_stock - COALESCE(cs.distributed, 0)) AS stock_remaining
        FROM merchants m
        LEFT JOIN coupon_offers co
          ON co.merchant_id = m.id
         AND co.active = true
         AND co.valid_until > NOW()
        LEFT JOIN coupon_stock cs
          ON cs.coupon_offer_id = co.id
         AND cs.month = DATE_TRUNC('month', NOW())
        WHERE m.active = true
          AND 6371000.0 * 2.0 * ASIN(SQRT(
            POWER(SIN(RADIANS((m.lat - ${lat}) / 2.0)), 2) +
            COS(RADIANS(${lat})) * COS(RADIANS(m.lat)) *
            POWER(SIN(RADIANS((m.lng - ${lng}) / 2.0)), 2)
          )) <= ${radius}
        ORDER BY distance_m ASC
        LIMIT 30
      `;

      const result = rows.map(r => ({
        id:          r.id,
        description: r.coupon_description ?? 'Offre partenaire',
        stockRemaining: r.stock_remaining ?? 0,
        merchant: {
          name:      r.name,
          address:   r.address,
          distanceM: r.distance_m,
        },
      }));

      return reply.send(result);
    },
  );
}
