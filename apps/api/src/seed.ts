/**
 * Seed script — populates the DB with test data for local development.
 * Run: pnpm db:seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding...');

  // ── Test User ──────────────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { firebaseUid: 'test-uid-001' },
    update: {},
    create: {
      firebaseUid: 'test-uid-001',
      displayName: 'Marie Dupont',
      email: 'marie@test.com',
      level: 3,
      xp: 420,
      streakDays: 5,
      totalGames: 12,
      totalBingos: 2,
      preferredHour: 10,
    },
  });
  console.log(`✅ User: ${user.displayName} (${user.id})`);

  // ── Test Merchants ─────────────────────────────────────────────────────
  const boulangerie = await prisma.merchant.upsert({
    where: { siret: '12345678901234' },
    update: {},
    create: {
      siret: '12345678901234',
      name: 'Boulangerie Martin',
      category: 'Alimentaire',
      address: '12 rue de la République, Hyères 83400',
      lat: 43.1199,
      lng: 6.1286,
      subscriptionTier: 'standard',
    },
  });
  console.log(`✅ Merchant: ${boulangerie.name}`);

  const pharmacie = await prisma.merchant.upsert({
    where: { siret: '98765432109876' },
    update: {},
    create: {
      siret: '98765432109876',
      name: 'Pharmacie du Port',
      category: 'Santé',
      address: '3 avenue du Port, Hyères 83400',
      lat: 43.1221,
      lng: 6.1301,
      subscriptionTier: 'premium',
    },
  });
  console.log(`✅ Merchant: ${pharmacie.name}`);

  // ── Coupon Offers ──────────────────────────────────────────────────────
  const offer1 = await prisma.couponOffer.create({
    data: {
      merchantId: boulangerie.id,
      description: '3 baguettes tradition achetées = 1 offerte',
      monthlyStock: 30,
      dailyCap: 2,
      weeklyPlayerCap: 1,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
    },
  });
  console.log(`✅ Offer: ${offer1.description}`);

  const offer2 = await prisma.couponOffer.create({
    data: {
      merchantId: pharmacie.id,
      description: 'Pilulier offert pour tout achat de plus de 20€',
      monthlyStock: 15,
      dailyCap: 1,
      weeklyPlayerCap: 1,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`✅ Offer: ${offer2.description}`);

  console.log('\n🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
