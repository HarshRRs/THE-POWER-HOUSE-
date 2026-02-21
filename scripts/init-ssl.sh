#!/bin/bash
# /scripts/init-ssl.sh

if ! [ -x "$(command -v docker)" ]; then
  echo 'Error: docker is not installed.' >&2
  exit 1
fi

DOMAIN=${1:-"rdvpriority.fr"}
EMAIL=${2:-""}
DATA_PATH="./certbot"

if [ -z "$EMAIL" ]; then
  echo "Usage: $0 domain.com your@email.com"
  exit 1
fi

echo "### Setting up Let's Encrypt for $DOMAIN and www.$DOMAIN"

echo "### Starting temporary nginx for ACME challenge validation..."
docker compose -f docker-compose.prod.yml up -d nginx

echo "### Requesting Let's Encrypt certificate..."
docker run -it --rm \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  certbot/certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d $DOMAIN \
  -d www.$DOMAIN \
  -d api.$DOMAIN \
  --email $EMAIL \
  --rsa-key-size 4096 \
  --agree-tos \
  --force-renewal

echo "### Reloading Nginx with new certificate..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "✅ SSL Certificate setup complete!"
