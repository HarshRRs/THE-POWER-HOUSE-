import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('46.225.228.141', port=22, username='root', password='Root@123456', timeout=20)

print('=== Worker1 Status (last 50 lines) ===')
stdin, stdout, stderr = ssh.exec_command('docker logs rdv_worker1 --tail 50 2>&1', timeout=30)
print(stdout.read().decode('utf-8', errors='replace'))

print('\n=== Redis Queue Status ===')
stdin, stdout, stderr = ssh.exec_command('docker exec rdv_redis redis-cli keys "bull:*" 2>&1', timeout=30)
print(stdout.read().decode('utf-8', errors='replace'))

print('\n=== Container Health ===')
stdin, stdout, stderr = ssh.exec_command('docker ps --format "table {{.Names}}\t{{.Status}}" 2>&1', timeout=30)
print(stdout.read().decode('utf-8', errors='replace'))

print('\n=== Environment Check (BOOTSTRAP_MODE) ===')
stdin, stdout, stderr = ssh.exec_command('docker exec rdv_worker1 printenv | grep -E "BOOTSTRAP|TWOCAPTCHA|WEBSHARE" 2>&1', timeout=30)
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
print('Done!')
