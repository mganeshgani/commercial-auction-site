#!/bin/bash

# ============================================
# AUCTION APP — DROPLET INITIAL SETUP SCRIPT
# Run this ONCE on a brand new droplet
# SSH into your droplet first, then run this
# ============================================

set -e

GITHUB_REPO="https://github.com/yourusername/your-repo.git"   # ← Replace
DOMAIN="api.yourdomain.com"                                     # ← Replace
APP_DIR="/var/www/auction-app"

echo "========================================"
echo " Auction App — Droplet Setup"
echo "========================================"

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install Git
echo "📦 Installing Git..."
apt install -y git

# Install Certbot for SSL
echo "📦 Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Create upload directories
echo "📁 Creating upload directories..."
mkdir -p /var/www/uploads/players
mkdir -p /var/www/uploads/teams
mkdir -p /var/www/uploads/logos
chmod -R 755 /var/www/uploads

# Clone the repository
echo "📥 Cloning repository..."
mkdir -p /var/www
cd /var/www
git clone ${GITHUB_REPO} auction-app
cd auction-app/backend
npm install --production

echo ""
echo "========================================"
echo " ✅ Base setup complete!"
echo ""
echo " NEXT STEPS (do these manually):"
echo ""
echo " 1. Create your .env file:"
echo "    nano /var/www/auction-app/backend/.env"
echo ""
echo " 2. Copy Nginx config:"
echo "    cp /var/www/auction-app/nginx/auction-api.conf /etc/nginx/sites-available/"
echo "    ln -s /etc/nginx/sites-available/auction-api.conf /etc/nginx/sites-enabled/"
echo "    rm /etc/nginx/sites-enabled/default"
echo "    nginx -t && systemctl reload nginx"
echo ""
echo " 3. Start the app:"
echo "    cd /var/www/auction-app/backend"
echo "    pm2 start server.js --name auction-backend"
echo "    pm2 save"
echo "    pm2 startup"
echo ""
echo " 4. Add SSL:"
echo "    certbot --nginx -d ${DOMAIN}"
echo ""
echo " 5. Whitelist this server's IP in MongoDB Atlas:"
echo "    $(curl -s ifconfig.me)"
echo "========================================"
