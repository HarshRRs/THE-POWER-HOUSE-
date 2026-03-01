import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

print('Connecting to server...')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('46.225.228.141', port=22, username='root', password='Root@123456', timeout=20)

print('Creating admin account...')

# First check if bcryptjs is available, if not use bcrypt
js_code = r'''
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const existing = await prisma.user.findUnique({ where: { email: 'admin@rdvpriority.fr' } });
const hash = await bcrypt.hash('Harsh@123456', 12);

if (existing) {
  await prisma.user.update({
    where: { email: 'admin@rdvpriority.fr' },
    data: { passwordHash: hash }
  });
  console.log('Password updated for admin@rdvpriority.fr');
} else {
  await prisma.user.create({
    data: {
      email: 'admin@rdvpriority.fr',
      passwordHash: hash,
      name: 'Boss Admin',
      emailVerified: true
    }
  });
  console.log('Admin created: admin@rdvpriority.fr');
}

await prisma.$disconnect();
'''

# Write JS to temp file on server and execute
cmd = f'''cat > /tmp/create-admin.js << 'ENDOFJS'
{js_code}
ENDOFJS
docker cp /tmp/create-admin.js rdv_api:/app/create-admin.js && docker exec -w /app rdv_api node create-admin.js 2>&1
'''

stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print('Output:', out)
if err:
    print('Stderr:', err)

ssh.close()
print('Done!')
