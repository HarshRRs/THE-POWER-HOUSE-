import paramiko, sys, os
sys.stdout.reconfigure(encoding='utf-8')

LOCAL_BASE = r'c:\Users\SHAH HARSH\.gemini\antigravity\scratch\rdvpriority'
REMOTE_BASE = '/opt/rdvpriority'

# Files to upload (local relative path -> remote relative path)
FILES = [
    # Backend - Active prefectures config
    ('backend/src/scraper/prefectures/index.ts', 'backend/src/scraper/prefectures/index.ts'),
    ('backend/prisma/seed.ts', 'backend/prisma/seed.ts'),
    ('backend/src/services/prefecture.service.ts', 'backend/src/services/prefecture.service.ts'),
    # Frontend - Only show active prefectures
    ('frontend/src/hooks/usePrefectures.ts', 'frontend/src/hooks/usePrefectures.ts'),
    # Boss Panel - Remove prefectures tab
    ('boss-panel/src/components/Sidebar.tsx', 'boss-panel/src/components/Sidebar.tsx'),
    ('boss-panel/src/components/MobileNav.tsx', 'boss-panel/src/components/MobileNav.tsx'),
    ('boss-panel/src/app/page.tsx', 'boss-panel/src/app/page.tsx'),
]

print('Connecting to server...')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('46.225.228.141', port=22, username='root', password='Root@123456', timeout=20, banner_timeout=20, auth_timeout=20)
sftp = ssh.open_sftp()

print('Uploading files...')
for local_rel, remote_rel in FILES:
    local_path = os.path.join(LOCAL_BASE, local_rel)
    remote_path = f'{REMOTE_BASE}/{remote_rel}'
    print(f'  {local_rel} -> {remote_path}')
    sftp.put(local_path, remote_path)

sftp.close()
print('All files uploaded.')

# Rebuild all containers
print('\nRebuilding all containers...')
cmd = 'cd /opt/rdvpriority && docker compose -f docker-compose.prod.yml build --no-cache api frontend boss-panel 2>&1'
channel = ssh.get_transport().open_session()
channel.settimeout(600)
channel.exec_command(cmd)

output = b''
while True:
    try:
        chunk = channel.recv(4096)
        if not chunk:
            break
        output += chunk
        # Print progress
        lines = chunk.decode('utf-8', errors='replace')
        for line in lines.strip().split('\n'):
            if line.strip():
                print(f'  {line.strip()[:120]}')
    except Exception as e:
        print(f'  Read error: {e}')
        break

exit_code = channel.recv_exit_status()
print(f'\nBuild exit code: {exit_code}')

if exit_code == 0:
    print('\nRestarting containers...')
    stdin, stdout, stderr = ssh.exec_command(
        'cd /opt/rdvpriority && docker compose -f docker-compose.prod.yml up -d api frontend boss-panel 2>&1',
        timeout=120
    )
    result = stdout.read().decode('utf-8', errors='replace')
    print(result)
    
    print('\nRunning seed to activate only 10 prefectures...')
    stdin, stdout, stderr = ssh.exec_command(
        'cd /opt/rdvpriority && docker compose -f docker-compose.prod.yml exec -T api npx prisma db seed 2>&1',
        timeout=60
    )
    seed_result = stdout.read().decode('utf-8', errors='replace')
    print(seed_result)
    print('Deployment complete!')
else:
    print('BUILD FAILED - check output above')
    # Print last part of output for debugging
    decoded = output.decode('utf-8', errors='replace')
    lines = decoded.strip().split('\n')
    print('\nLast 30 lines:')
    for line in lines[-30:]:
        print(f'  {line}')

ssh.close()
