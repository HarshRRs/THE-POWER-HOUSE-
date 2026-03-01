import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('46.225.228.141', port=22, username='root', password='Root@123456', timeout=20, banner_timeout=20, auth_timeout=20)

# Restart nginx to pick up new container IPs
cmd = """cd /opt/rdvpriority && docker compose -f docker-compose.prod.yml restart nginx 2>&1 && sleep 5 && docker compose -f docker-compose.prod.yml ps 2>&1"""

channel = ssh.get_transport().open_session()
channel.exec_command(cmd)
channel.settimeout(60)
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
