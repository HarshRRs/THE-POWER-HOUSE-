import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('46.225.228.141', port=22, username='root', password='Root@123456', timeout=20, banner_timeout=20, auth_timeout=20)

# Use the compiled dist files - import ALL_PREFECTURES from compiled JS
cmd = r"""cd /opt/rdvpriority && docker compose -f docker-compose.prod.yml exec -T api node -e "
const { ALL_PREFECTURES } = require('./dist/scraper/prefectures/index.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding ' + ALL_PREFECTURES.length + ' prefectures...');
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
        selectors: config.selectors,
      },
      create: {
        id: config.id,
        name: config.name,
        department: config.department,
        region: config.region,
        tier: config.tier,
        bookingUrl: config.bookingUrl,
        checkInterval: config.checkInterval,
        selectors: config.selectors,
        status: 'ACTIVE',
      },
    });
  }
  const stats = await prisma.prefecture.groupBy({ by: ['tier'], _count: true });
  stats.forEach(s => console.log('Tier ' + s.tier + ': ' + s._count));
  console.log('Done! Total: ' + ALL_PREFECTURES.length);
  await prisma.\$disconnect();
}
seed().catch(e => { console.error(e); process.exit(1); });
" 2>&1"""

channel = ssh.get_transport().open_session()
channel.exec_command(cmd)
channel.settimeout(120)
output = b''
while True:
    try:
        chunk = channel.recv(4096)
        if not chunk:
            break
        output += chunk
    except:
        break
print(output.decode('utf-8', errors='replace'))
print('EXIT:', channel.recv_exit_status())
ssh.close()
