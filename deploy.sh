#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════
# RDVPriority - Hetzner Cloud Deployment Script
# ═══════════════════════════════════════════════════════
# Usage: ssh root@YOUR_SERVER_IP 'bash -s' < deploy.sh
# Or:    scp deploy.sh root@YOUR_SERVER_IP: && ssh root@YOUR_SERVER_IP bash deploy.sh
# ═══════════════════════════════════════════════════════

DOMAIN="rdvpriority.fr"
ADMIN_DOMAIN="admin.rdvpriority.fr"
APP_DIR="/opt/rdvpriority"
REPO_URL="https://github.com/HarshRRs/THE-POWER-HOUSE-.git"
EMAIL="rdvpriority@gmail.com"

echo "══════════════════════════════════════════════════"
echo "  RDVPriority - Production Deployment"
echo "══════════════════════════════════════════════════"

# ── Step 1: System Update ─────────────────────────
echo ""
echo "[1/8] Updating system packages..."
apt-get update -y && apt-get upgrade -y

# ── Step 2: Install Docker ────────────────────────
echo ""
echo "[2/8] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "  Docker installed successfully"
else
    echo "  Docker already installed"
fi

# Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
    apt-get install -y docker-compose-plugin
fi

# ── Step 3: Install essential tools ───────────────
echo ""
echo "[3/8] Installing essential tools..."
apt-get install -y git curl ufw fail2ban

# ── Step 4: Configure Firewall ────────────────────
echo ""
echo "[4/8] Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
echo "  Firewall configured: SSH + HTTP + HTTPS only"

# ── Step 5: Clone Repository ─────────────────────
echo ""
echo "[5/8] Setting up application..."
if [ -d "$APP_DIR" ]; then
    echo "  Pulling latest changes..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "  Cloning repository..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# ── Step 6: Environment File ─────────────────────
echo ""
echo "[6/8] Checking environment file..."
if [ ! -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env.production.example" "$APP_DIR/.env"
    chmod 600 "$APP_DIR/.env"
    echo ""
    echo "  ╔══════════════════════════════════════════════╗"
    echo "  ║  IMPORTANT: Edit .env with your real values  ║"
    echo "  ║  nano /opt/rdvpriority/.env                  ║"
    echo "  ║  Then re-run this script                     ║"
    echo "  ╚══════════════════════════════════════════════╝"
    echo ""
    echo "  Fill in ALL 'CHANGE_ME' values before continuing."
    echo "  Generate secrets with: openssl rand -base64 32"
    exit 0
else
    echo "  .env file exists"
fi

# ── Step 7: SSL Certificates ─────────────────────
echo ""
echo "[7/8] Setting up SSL certificates..."

# Create temporary nginx config for initial cert request
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "  Obtaining SSL certificates..."
    
    # Create a temporary nginx for ACME challenge
    mkdir -p "$APP_DIR/nginx"
    cat > "$APP_DIR/nginx/nginx-init.conf" << 'INITNGINX'
server {
    listen 80;
    listen [::]:80;
    server_name rdvpriority.fr www.rdvpriority.fr admin.rdvpriority.fr;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Setting up SSL...';
        add_header Content-Type text/plain;
    }
}
INITNGINX

    # Start temporary nginx for cert validation
    docker run -d --name rdv_nginx_init \
        -p 80:80 \
        -v "$APP_DIR/nginx/nginx-init.conf:/etc/nginx/conf.d/default.conf:ro" \
        -v rdv_certbot_www:/var/www/certbot \
        nginx:alpine

    sleep 3

    # Request certificates
    docker run --rm \
        -v rdv_certbot_www:/var/www/certbot \
        -v rdv_certbot_certs:/etc/letsencrypt \
        certbot/certbot certonly \
        --webroot --webroot-path=/var/www/certbot \
        --email "$EMAIL" --agree-tos --no-eff-email \
        -d "$DOMAIN" -d "www.$DOMAIN" -d "$ADMIN_DOMAIN"

    # Stop temporary nginx
    docker stop rdv_nginx_init && docker rm rdv_nginx_init
    rm -f "$APP_DIR/nginx/nginx-init.conf"

    # Map named volumes for compose
    echo "  SSL certificates obtained"
else
    echo "  SSL certificates already exist"
fi

# ── Step 8: Deploy ────────────────────────────────
echo ""
echo "[8/8] Building and deploying..."
cd "$APP_DIR"

# Build all images
docker compose -f docker-compose.prod.yml build

# Run database migrations
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

# Start all services
docker compose -f docker-compose.prod.yml up -d

# ── Step 9: Setup auto-renewal cron ───────────────
echo ""
echo "Setting up SSL auto-renewal cron..."
(crontab -l 2>/dev/null; echo "0 3 * * * cd $APP_DIR && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload") | sort -u | crontab -

# ── Step 10: Setup daily backup cron ──────────────
echo ""
echo "Setting up daily database backup..."
mkdir -p /opt/backups
cat > /opt/rdvpriority/backup.sh << 'BACKUP'
#!/bin/bash
BACKUP_DIR="/opt/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec rdv_postgres pg_dump -U rdv_prod_user rdvpriority | gzip > "$BACKUP_DIR/rdvpriority_$TIMESTAMP.sql.gz"
# Keep only last 7 days
find "$BACKUP_DIR" -name "rdvpriority_*.sql.gz" -mtime +7 -delete
BACKUP
chmod +x /opt/rdvpriority/backup.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/rdvpriority/backup.sh") | sort -u | crontab -

echo ""
echo "══════════════════════════════════════════════════"
echo "  Deployment Complete!"
echo "══════════════════════════════════════════════════"
echo ""
echo "  Services running:"
docker compose -f docker-compose.prod.yml ps
echo ""
echo "  URLs:"
echo "    Frontend:    https://$DOMAIN"
echo "    Boss Panel:  https://$ADMIN_DOMAIN"
echo "    API:         https://$DOMAIN/api/health"
echo ""
echo "  Useful commands:"
echo "    Logs:        docker compose -f docker-compose.prod.yml logs -f"
echo "    Restart:     docker compose -f docker-compose.prod.yml restart"
echo "    Stop:        docker compose -f docker-compose.prod.yml down"
echo "    Update:      git pull && docker compose -f docker-compose.prod.yml up -d --build"
echo "    DB Backup:   /opt/rdvpriority/backup.sh"
echo ""
