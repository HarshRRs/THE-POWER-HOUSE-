import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('46.225.228.141', port=22, username='root', password='Root@123456', timeout=20, banner_timeout=20, auth_timeout=20)

# Reset all priority prefectures to ACTIVE and clear error counts
cmd = """cd /opt/rdvpriority && docker compose -f docker-compose.prod.yml exec -T api node -e "
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();

const priorityIds = [
  'paris_75','bobigny_93','creteil_94','nanterre_92',
  'evry_91','cergy_95','melun_77','versailles_78',
  'lyon_69','marseille_13','toulouse_31','lille_59',
  'nantes_44','bordeaux_33','montpellier_34','strasbourg_67',
  'nice_06','rouen_76','rennes_35','grenoble_38'
];

async function fix() {
  const result = await p.prefecture.updateMany({
    where: { id: { in: priorityIds } },
    data: { status: 'ACTIVE', consecutiveErrors: 0 }
  });
  console.log('Reset', result.count, 'prefectures to ACTIVE');

  const stats = await p.prefecture.groupBy({
    by: ['tier','status'],
    where: { id: { in: priorityIds } },
    _count: true
  });
  stats.forEach(s => console.log('Tier', s.tier, s.status, ':', s._count));
  await p.\\$disconnect();
}
fix().catch(e => { console.error(e); process.exit(1); });
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
print('EXIT:', channel.recv_exit_status())
ssh.close()
