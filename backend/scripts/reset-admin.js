import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('AdminTest123!', 12);
  const result = await prisma.user.updateMany({
    where: { email: 'admin@rdvpriority.fr' },
    data: { passwordHash: hash, role: 'ADMIN', emailVerified: true }
  });
  console.log('Updated:', JSON.stringify(result));
  
  const user = await prisma.user.findUnique({
    where: { email: 'admin@rdvpriority.fr' },
    select: { id: true, email: true, role: true, emailVerified: true }
  });
  console.log('User:', JSON.stringify(user));
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
