import { FastifyInstance } from 'fastify';
import { z } from 'zod';

export async function couponRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /coupon/mine
   * List the authenticated user's coupons (active, not expired, not used).
   */
  app.get(
    '/mine',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = await app.prisma.user.findUnique({
        where: { firebaseUid: request.user.uid },
      });
      if (!user) return reply.status(404).send({ error: 'User not found' });

      const coupons = await app.prisma.playerCoupon.findMany({
        where: {
          userId: user.id,
          usedAt: null,
          giftedToUserId: null,
          expiresAt: { gt: new Date() },
        },
        include: { couponOffer: { include: { merchant: true } } },
        orderBy: { awardedAt: 'desc' },
      });

      return reply.send(coupons);
    },
  );

  /**
   * POST /coupon/:id/gift
   * Gift a coupon to another user (family room contact).
   */
  app.post(
    '/:id/gift',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { recipientUserId } = z.object({ recipientUserId: z.string().uuid() }).parse(request.body);

      const user = await app.prisma.user.findUnique({
        where: { firebaseUid: request.user.uid },
      });
      if (!user) return reply.status(404).send({ error: 'User not found' });

      const coupon = await app.prisma.playerCoupon.findUnique({ where: { id } });
      if (!coupon || coupon.userId !== user.id) return reply.status(404).send({ error: 'Coupon not found' });
      if (coupon.usedAt || coupon.giftedToUserId) return reply.status(409).send({ error: 'Coupon already used or gifted' });

      // Transfer: create new coupon for recipient, mark original as gifted
      const [, newCoupon] = await app.prisma.$transaction([
        app.prisma.playerCoupon.update({
          where: { id },
          data: { giftedToUserId: recipientUserId },
        }),
        app.prisma.playerCoupon.create({
          data: {
            userId: recipientUserId,
            couponOfferId: coupon.couponOfferId,
            merchantId: coupon.merchantId,
            expiresAt: coupon.expiresAt,
          },
        }),
      ]);

      return reply.send({ success: true, newCouponId: newCoupon.id });
    },
  );

  /**
   * POST /coupon/:id/redeem
   * Mark a coupon as used (called when merchant scans QR).
   */
  app.post(
    '/:id/redeem',
    { preHandler: [app.authenticate] }, // merchant-facing: auth via merchant token (simplified here)
    async (request, reply) => {
      const { qrCode } = z.object({ qrCode: z.string().uuid() }).parse(request.body);

      const coupon = await app.prisma.playerCoupon.findUnique({ where: { qrCode } });
      if (!coupon) return reply.status(404).send({ error: 'Coupon not found' });
      if (coupon.usedAt) return reply.status(409).send({ error: 'Coupon already used' });
      if (coupon.expiresAt < new Date()) return reply.status(410).send({ error: 'Coupon expired' });

      await app.prisma.playerCoupon.update({
        where: { id: coupon.id },
        data: { usedAt: new Date() },
      });

      return reply.send({ success: true, redeemedAt: new Date().toISOString() });
    },
  );
}
