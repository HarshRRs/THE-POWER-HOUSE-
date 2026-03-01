import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('46.225.228.141', port=22, username='root', password='Root@123456', timeout=20, banner_timeout=20, auth_timeout=20)

tests = [
    ("API Health (external)", "curl -sk https://rdvpriority.fr/api/health/ready"),
    ("Frontend (external)", "curl -sk -o /dev/null -w 'HTTP %{http_code}' https://rdvpriority.fr"),
    ("Boss Panel (external)", "curl -sk -o /dev/null -w 'HTTP %{http_code}' https://admin.rdvpriority.fr"),
    ("API Health (internal)", "docker exec rdv_api curl -s http://localhost:4000/api/health/ready"),
    ("Boss Stats (internal)", "docker exec rdv_api curl -s http://localhost:4000/api/boss/stats"),
    ("Boss Prefectures (internal)", "docker exec rdv_api curl -s http://localhost:4000/api/boss/prefectures | head -c 300"),
    ("Boss Top Prefectures (internal)", "docker exec rdv_api curl -s http://localhost:4000/api/boss/top-prefectures"),
    ("Boss Heatmap count (internal)", "docker exec rdv_api sh -c \"curl -s http://localhost:4000/api/boss/heatmap | python3 -c 'import sys,json;d=json.load(sys.stdin);print(len(d),\\\"entries\\\")' 2>/dev/null || echo 'parse error'\""),
    ("Boss Connections (internal)", "docker exec rdv_api curl -s http://localhost:4000/api/boss/connections"),
    ("Admin URL Changes (internal)", "docker exec rdv_api curl -s http://localhost:4000/api/admin/url-changes"),
    ("VFS Centers (internal)", "docker exec rdv_api curl -s http://localhost:4000/api/vfs/centers | head -c 200"),
    ("Prefecture DB Count", "cd /opt/rdvpriority && docker compose -f docker-compose.prod.yml exec -T api node -e \"const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.prefecture.count().then(c=>console.log('Prefectures:',c)).finally(()=>p.\\$disconnect())\""),
    ("Active Prefectures by Tier", "cd /opt/rdvpriority && docker compose -f docker-compose.prod.yml exec -T api node -e \"const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.prefecture.groupBy({by:['tier'],where:{status:'ACTIVE'},_count:true}).then(r=>r.forEach(s=>console.log('Tier',s.tier,':',s._count))).finally(()=>p.\\$disconnect())\""),
    ("Scraper Logs (recent)", "cd /opt/rdvpriority && docker compose -f docker-compose.prod.yml exec -T api node -e \"const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.scraperLog.findMany({take:5,orderBy:{createdAt:'desc'},select:{prefectureId:true,status:true,finalUrl:true,urlChanged:true,createdAt:true}}).then(r=>console.log(JSON.stringify(r,null,2))).finally(()=>p.\\$disconnect())\""),
    ("Worker1 recent logs", "cd /opt/rdvpriority && docker compose -f docker-compose.prod.yml logs --tail=3 worker1 2>&1 | tail -3"),
    ("WebSocket test", "curl -sk -o /dev/null -w 'HTTP %{http_code}' 'https://rdvpriority.fr/socket.io/?EIO=4&transport=polling'"),
]

for name, cmd in tests:
    print(f"\n{'='*60}")
    print(f"  {name}")
    print('='*60)
    try:
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
        result = output.decode('utf-8', errors='replace').strip()
        exit_code = channel.recv_exit_status()
        status = "PASS" if exit_code == 0 and result else "FAIL"
        print(f"[{status}] {result[:400]}")
    except Exception as e:
        print(f"[ERROR] {e}")

ssh.close()
print("\n" + "="*60)
print("  QA TESTING COMPLETE")
print("="*60)
