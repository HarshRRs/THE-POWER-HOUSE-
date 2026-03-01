import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('46.225.228.141', port=22, username='root', password='Root@123456', timeout=20)

js_script = '''
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get recent detections
const detections = await prisma.detection.findMany({
  take: 10,
  orderBy: { detectedAt: 'desc' },
  select: {
    id: true,
    detectedAt: true,
    slotsAvailable: true,
    prefecture: { select: { name: true } },
    vfsCenter: { select: { name: true } }
  }
});
console.log('Recent detections:');
console.log(JSON.stringify(detections, null, 2));

// Get scraper log summary
const logs = await prisma.scraperLog.findMany({
  take: 20,
  orderBy: { startedAt: 'desc' },
  select: {
    status: true,
    startedAt: true,
    errorMessage: true,
    prefecture: { select: { name: true } }
  }
});
console.log('\\nRecent scraper logs:');
console.log(JSON.stringify(logs, null, 2));

await prisma.$disconnect();
'''

print('Checking recent activity...')
stdin, stdout, stderr = ssh.exec_command(f"cat > /tmp/recent.mjs << 'EOF'\n{js_script}\nEOF", timeout=30)
stdout.read()

stdin, stdout, stderr = ssh.exec_command('docker cp /tmp/recent.mjs rdv_api:/app/recent.mjs && docker exec -w /app rdv_api node recent.mjs 2>&1', timeout=60)
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
