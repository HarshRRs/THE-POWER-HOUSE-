import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('46.225.228.141', port=22, username='root', password='Root@123456', timeout=20, banner_timeout=20, auth_timeout=20)

cmd = """cd /opt/rdvpriority && docker compose -f docker-compose.prod.yml exec -T api node -e "
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
async function report() {
  // Prefecture stats
  const total = await p.prefecture.count();
  const active = await p.prefecture.count({where:{status:'ACTIVE'}});
  const byTier = await p.prefecture.groupBy({by:['tier'],where:{status:'ACTIVE'},_count:true});
  console.log('=== PREFECTURE STATUS ===');
  console.log('Total:', total, '| Active:', active);
  byTier.forEach(s => console.log('  Tier', s.tier, ':', s._count, 'active'));

  // Scraper stats
  const logCount = await p.scraperLog.count();
  const recent = await p.scraperLog.findMany({take:10,orderBy:{createdAt:'desc'},select:{prefectureId:true,status:true,createdAt:true}});
  console.log('\\n=== SCRAPER STATUS ===');
  console.log('Total logs:', logCount);
  console.log('Recent scrapes:');
  recent.forEach(r => console.log(' ', r.prefectureId, '-', r.status, '-', r.createdAt.toISOString().slice(0,19)));

  // URL tracking
  const urlChanges = await p.scraperLog.count({where:{urlChanged:true}});
  console.log('\\n=== URL TRACKING ===');
  console.log('URL changes detected:', urlChanges);

  // Detection stats
  const detections = await p.detection.count();
  console.log('\\n=== DETECTIONS ===');
  console.log('Total slot detections:', detections);

  await p.\\$disconnect();
}
report().catch(e=>{console.error(e);process.exit(1)});
" 2>&1"""

channel = ssh.get_transport().open_session()
channel.exec_command(cmd)
channel.settimeout(30)
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
ssh.close()
