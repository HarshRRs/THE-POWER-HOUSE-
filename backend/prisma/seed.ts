import { PrismaClient } from '@prisma/client';
import { ALL_PREFECTURES } from '../src/scraper/prefectures/index.js';
import { ALL_CONSULATES } from '../src/scraper/consulates/index.js';
import { getAllVfsConfigs } from '../src/scraper/vfs/index.js';

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

  // Seed consulates
  console.log(`Seeding ${ALL_CONSULATES.length} consulate(s)...`);

  for (const config of ALL_CONSULATES) {
    await prisma.consulate.upsert({
      where: { id: config.id },
      update: {
        name: config.name,
        country: config.country,
        city: config.city,
        type: config.type,
        baseUrl: config.baseUrl,
        checkInterval: config.checkInterval,
      },
      create: {
        id: config.id,
        name: config.name,
        country: config.country,
        city: config.city,
        type: config.type,
        baseUrl: config.baseUrl,
        checkInterval: config.checkInterval,
        status: 'ACTIVE',
      },
    });
  }

  console.log(`Seeded ${ALL_CONSULATES.length} consulate(s) successfully`);

  // Seed VFS centers
  const vfsConfigs = getAllVfsConfigs();
  let vfsCenterCount = 0;

  console.log(`Seeding VFS centers from ${vfsConfigs.length} config(s)...`);

  for (const config of vfsConfigs) {
    for (const center of config.centers) {
      const centerId = `${config.id}-${center.id}`;
      
      await prisma.vfsCenter.upsert({
        where: { id: centerId },
        update: {
          name: `VFS ${config.destinationCountry} - ${center.name}`,
          bookingUrl: config.appointmentUrl,
          checkInterval: Math.floor(config.checkInterval / 1000),
        },
        create: {
          id: centerId,
          configId: config.id,
          name: `VFS ${config.destinationCountry} - ${center.name}`,
          destinationCountry: config.destinationCountry,
          sourceCountry: config.sourceCountry,
          city: center.city,
          centerCode: center.code,
          bookingUrl: config.appointmentUrl,
          checkInterval: Math.floor(config.checkInterval / 1000),
          status: 'ACTIVE',
        },
      });
      vfsCenterCount++;
    }
  }

  console.log(`Seeded ${vfsCenterCount} VFS center(s) successfully`);

  // Print stats
  const prefStats = await prisma.prefecture.groupBy({
    by: ['tier'],
    _count: true,
  });

  console.log('\nPrefecture stats by tier:');
  prefStats.forEach((s) => {
    console.log(`  Tier ${s.tier}: ${s._count} prefectures`);
  });

  const consulateCount = await prisma.consulate.count();
  console.log(`\nConsulates: ${consulateCount}`);

  const vfsStats = await prisma.vfsCenter.groupBy({
    by: ['destinationCountry'],
    _count: true,
  });

  console.log('\nVFS centers by country:');
  vfsStats.forEach((s) => {
    console.log(`  ${s.destinationCountry}: ${s._count} centers`);
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
