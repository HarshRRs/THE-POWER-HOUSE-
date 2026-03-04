import { PrismaClient } from '@prisma/client';

// In production, code is compiled to dist/. In development, it's in src/.
const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '../dist/scraper' : '../src/scraper';
const configBasePath = isProduction ? '../dist/config' : '../src/config';

async function importModules() {
  const prefectures = await import(`${basePath}/prefectures/index.js`);
  const consulates = await import(`${basePath}/consulates/index.js`);
  const vfs = await import(`${basePath}/vfs/index.js`);
  const categoryConfig = await import(`${configBasePath}/prefecture-categories.config.js`);
  return {
    ALL_PREFECTURES: prefectures.ALL_PREFECTURES,
    ALL_PREFECTURES_FULL: prefectures.ALL_PREFECTURES_FULL,
    ACTIVE_PREFECTURE_IDS: prefectures.ACTIVE_PREFECTURE_IDS,
    ALL_CONSULATES: consulates.ALL_CONSULATES,
    getAllVfsConfigs: vfs.getAllVfsConfigs,
    RDV_PREFECTURE_CATEGORIES: categoryConfig.RDV_PREFECTURE_CATEGORIES,
    OTHER_SYSTEM_CATEGORIES: categoryConfig.OTHER_SYSTEM_CATEGORIES,
    getCategoryUrl: categoryConfig.getCategoryUrl,
  };
}

const prisma = new PrismaClient();

async function main() {
  const { ALL_PREFECTURES, ALL_PREFECTURES_FULL, ACTIVE_PREFECTURE_IDS, ALL_CONSULATES, getAllVfsConfigs, RDV_PREFECTURE_CATEGORIES, OTHER_SYSTEM_CATEGORIES, getCategoryUrl } = await importModules();
  console.log('Seeding database...');

  // Seed only ACTIVE prefectures and set others to PAUSED
  console.log(`Activating ${ACTIVE_PREFECTURE_IDS.length} prefectures, pausing ${ALL_PREFECTURES_FULL.length - ACTIVE_PREFECTURE_IDS.length} others...`);

  // First, set ALL prefectures to PAUSED
  await prisma.prefecture.updateMany({
    data: { status: 'PAUSED' },
  });

  // Then, upsert only the ACTIVE prefectures
  for (const config of ALL_PREFECTURES_FULL) {
    const isActive = ACTIVE_PREFECTURE_IDS.includes(config.id);
    
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
        status: isActive ? 'ACTIVE' : 'PAUSED',
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
        status: isActive ? 'ACTIVE' : 'PAUSED',
      },
    });
  }

  console.log(`Seeded ${ALL_PREFECTURES_FULL.length} prefectures (${ACTIVE_PREFECTURE_IDS.length} ACTIVE, ${ALL_PREFECTURES_FULL.length - ACTIVE_PREFECTURE_IDS.length} PAUSED)`);

  // Seed PrefectureCategory rows for ACTIVE prefectures
  console.log('Seeding prefecture categories...');
  let categoryCount = 0;

  const allCategoryConfigs: Record<string, any[]> = { ...RDV_PREFECTURE_CATEGORIES, ...OTHER_SYSTEM_CATEGORIES };

  for (const prefectureId of ACTIVE_PREFECTURE_IDS) {
    const categories = allCategoryConfigs[prefectureId];
    if (!categories || categories.length === 0) continue;

    for (const cat of categories) {
      // Build the category URL - RDV-Prefecture uses demarche codes, others use code as-is
      const isRdvPrefecture = prefectureId in RDV_PREFECTURE_CATEGORIES;
      const categoryUrl = isRdvPrefecture
        ? getCategoryUrl(cat.code)
        : `https://placeholder.gouv.fr/${prefectureId}/${cat.code}`;

      await prisma.prefectureCategory.upsert({
        where: {
          prefectureId_code: { prefectureId, code: cat.code },
        },
        update: {
          name: cat.name,
          procedure: cat.procedure,
          categoryUrl,
          status: 'ACTIVE',
          consecutiveErrors: 0,
        },
        create: {
          prefectureId,
          code: cat.code,
          name: cat.name,
          procedure: cat.procedure,
          categoryUrl,
          status: 'ACTIVE',
        },
      });
      categoryCount++;
    }
  }

  console.log(`Seeded ${categoryCount} prefecture categories for ${ACTIVE_PREFECTURE_IDS.length} active prefectures`);

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
