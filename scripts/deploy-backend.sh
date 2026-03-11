#!/bin/bash

# ============================================
# AUCTION APP — BACKEND DEPLOYMENT SCRIPT
# Run this on your LOCAL machine to deploy
# Usage: ./scripts/deploy-backend.sh
# ============================================

set -e  # Exit immediately if any command fails

DROPLET_IP="YOUR_DROPLET_IP"          # ← Replace with your actual droplet IP
DROPLET_USER="root"
APP_DIR="/var/www/auction-app"

echo "🚀 Starting deployment..."

# Step 1: Push latest code to GitHub
echo "📤 Pushing to GitHub..."
git add .
git commit -m "deploy: $(date '+%Y-%m-%d %H:%M')" || echo "Nothing new to commit"
git push origin main

# Step 2: SSH into droplet and pull + restart
echo "🔄 Updating server..."
ssh ${DROPLET_USER}@${DROPLET_IP} << 'ENDSSH'
  set -e
  cd /var/www/auction-app

  echo "Pulling latest code..."
  git pull origin main

  echo "Installing dependencies..."
  cd backend
  npm install --production

  echo "Restarting app..."
  pm2 restart auction-backend

  echo "Checking status..."
  pm2 status auction-backend

  echo "✅ Deployment complete!"
ENDSSH

echo ""
echo "✅ Done! Your app is updated at https://api.yourdomain.com"
