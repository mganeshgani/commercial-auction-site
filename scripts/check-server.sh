#!/bin/bash
DROPLET_IP="YOUR_DROPLET_IP"

echo "=== PM2 Status ==="
ssh root@${DROPLET_IP} "pm2 status"

echo ""
echo "=== Last 30 Log Lines ==="
ssh root@${DROPLET_IP} "pm2 logs auction-backend --lines 30 --nostream"

echo ""
echo "=== Disk Usage ==="
ssh root@${DROPLET_IP} "df -h /var/www/uploads"

echo ""
echo "=== Memory Usage ==="
ssh root@${DROPLET_IP} "free -m"
