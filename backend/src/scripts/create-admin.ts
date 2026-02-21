import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: npx tsx src/scripts/create-admin.ts <email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`User with email "${email}" not found. Register first.`);
    process.exit(1);
  }

  if (user.role === 'ADMIN') {
    console.log(`User "${email}" is already an admin.`);
    process.exit(0);
  }

  await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
  });

  console.log(`User "${email}" promoted to ADMIN.`);
  await prisma.$disconnect();
}

createAdmin().catch((err) => {
  console.error('Failed to create admin:', err);
  process.exit(1);
});
