import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('46.225.228.141', port=22, username='root', password='Root@123456', timeout=20)

# Create a JS script to check prefecture status
js_script = '''
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const stats = await prisma.prefecture.groupBy({
  by: ['status'],
  _count: true
});
console.log('Prefecture Status Summary:');
console.log(JSON.stringify(stats, null, 2));

const prefs = await prisma.prefecture.findMany({
  take: 10,
  select: {
    id: true,
    name: true,
    status: true,
    bookingUrl: true,
    lastCheckedAt: true,
    lastAvailableAt: true
  },
  orderBy: { lastCheckedAt: 'desc' }
});
console.log('\\nRecently checked prefectures:');
console.log(JSON.stringify(prefs, null, 2));

await prisma.$disconnect();
'''

# Write the script to server
print('Checking prefecture status in database...')
stdin, stdout, stderr = ssh.exec_command(f"cat > /tmp/check-prefs.mjs << 'EOF'\n{js_script}\nEOF", timeout=30)
stdout.read()

# Run it in the API container
stdin, stdout, stderr = ssh.exec_command('docker cp /tmp/check-prefs.mjs rdv_api:/app/check-prefs.mjs && docker exec -w /app rdv_api node check-prefs.mjs 2>&1', timeout=60)
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
print('Done!')
