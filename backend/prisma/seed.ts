import { PrismaClient } from '@prisma/client';
import { ALL_PREFECTURES } from '../src/scraper/prefectures/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed all 101 prefectures
  console.log(`Seeding ${ALL_PREFECTURES.length} prefectures...`);

  for (const config of ALL_PREFECTURES) {
    await prisma.prefecture.upsert({
      where: { id: config.id },
      update: {
        name: config.name,
        department: config.department,
        region: config.region,
        tier: config.tier,
        bookingUrl: config.bookingUrl,
        checkInterval: config.checkInterval,
        selectors: config.selectors as object,
      },
      create: {
        id: config.id,
        name: config.name,
        department: config.department,
        region: config.region,
        tier: config.tier,
        bookingUrl: config.bookingUrl,
        checkInterval: config.checkInterval,
        selectors: config.selectors as object,
        status: 'ACTIVE',
      },
    });
  }

  console.log(`Seeded ${ALL_PREFECTURES.length} prefectures successfully`);

  // Print stats
  const stats = await prisma.prefecture.groupBy({
    by: ['tier'],
    _count: true,
  });

  console.log('\nPrefecture stats by tier:');
  stats.forEach((s) => {
    console.log(`  Tier ${s.tier}: ${s._count} prefectures`);
  });

  console.log('\nDatabase seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
