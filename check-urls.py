import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('46.225.228.141', port=22, username='root', password='Root@123456', timeout=20)

js_script = '''
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const prefs = await prisma.prefecture.findMany({
  take: 15,
  select: {
    id: true,
    name: true,
    bookingUrl: true,
    status: true
  },
  orderBy: { name: 'asc' }
});

console.log('Sample Prefecture URLs:');
for (const p of prefs) {
  console.log(`${p.name}: ${p.status}`);
  console.log(`  URL: ${p.bookingUrl}`);
  console.log('');
}

await prisma.$disconnect();
'''

print('Checking stored prefecture URLs...')
stdin, stdout, stderr = ssh.exec_command(f"cat > /tmp/urls.mjs << 'EOF'\n{js_script}\nEOF", timeout=30)
stdout.read()

stdin, stdout, stderr = ssh.exec_command('docker cp /tmp/urls.mjs rdv_api:/app/urls.mjs && docker exec -w /app rdv_api node urls.mjs 2>&1', timeout=60)
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
