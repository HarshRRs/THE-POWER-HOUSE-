import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('46.225.228.141', port=22, username='root', password='Root@123456', timeout=20, banner_timeout=20, auth_timeout=20)

# Check Tier 1 prefectures and their status
cmd = """cd /opt/rdvpriority && docker compose -f docker-compose.prod.yml exec -T api node -e "
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
p.prefecture.findMany({where:{tier:1},select:{id:true,name:true,tier:true,status:true}}).then(r=>{
  console.log('Tier 1 prefectures:');
  r.forEach(x=>console.log(x.id, '-', x.name, '-', x.status));
  console.log('Total:', r.length);
}).finally(()=>p.\\$disconnect());
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

# Also check scraper log count
cmd2 = """cd /opt/rdvpriority && docker compose -f docker-compose.prod.yml exec -T api node -e "
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
p.scraperLog.count().then(c=>console.log('Total scraper logs:', c)).finally(()=>p.\\$disconnect());
" 2>&1"""

channel2 = ssh.get_transport().open_session()
channel2.exec_command(cmd2)
channel2.settimeout(30)
output2 = b''
while True:
    try:
        chunk = channel2.recv(4096)
        if not chunk:
            break
        output2 += chunk
    except:
        break
print(output2.decode('utf-8', errors='replace'))

ssh.close()
