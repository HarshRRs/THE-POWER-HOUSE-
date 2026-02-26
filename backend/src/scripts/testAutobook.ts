import { PrismaClient } from '@prisma/client';
import { autobookQueue } from '../config/bullmq.js';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Setting up Autobooking Test ---');

    // 1. Ensure a dummy prefecture exists
    const dummyPrefectureId = 'test-prefecture-001';
    await prisma.prefecture.upsert({
        where: { id: dummyPrefectureId },
        update: {},
        create: {
            id: dummyPrefectureId,
            name: 'Test Prefecture',
            department: '75',
            region: 'Ile-de-France',
            bookingUrl: 'https://example.com/booking',
            selectors: {},
        },
    });
    console.log(`Ensured Prefecture ${dummyPrefectureId} exists.`);

    // 2. Create a dummy client for auto-booking
    const client = await prisma.client.create({
        data: {
            firstName: 'Test',
            lastName: 'UserAutoBook',
            phone: '+33600000000',
            email: 'test@example.com',
            dateOfBirth: new Date('1990-01-01'),
            nationality: 'Indian',
            bookingSystem: 'PREFECTURE',
            prefectureId: dummyPrefectureId,
            procedureType: 'RENEWAL_ANY',
            autoBook: true,
            bookingStatus: 'WAITING_SLOT',
            status: 'WAITING',
            priceAgreed: 50.0,
            notes: 'This is a test client for autobooking script.',
        },
    });
    console.log(`Created test client: ${client.id} (${client.firstName} ${client.lastName})`);

    // 3. Add job to Autobooking Queue
    const jobName = `autobook-${client.id}-${Date.now()}`;
    const bookingUrl = 'https://rdv-etrangers-94.interieur.gouv.fr/e-rdv/cjr/creneau'; // You can change this to whatever URL we want to test if it attempts filling

    await autobookQueue.add(jobName, {
        clientId: client.id,
        prefectureId: dummyPrefectureId,
        bookingUrl,
    });

    console.log(`Added job to autobookQueue: ${jobName}`);
    console.log(`Worker should pick this up momentarily.`);

    await prisma.$disconnect();
    // Don't close autobookQueue here immediately if we want to ensure it connects, but normally it's fine
    await autobookQueue.close();
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
