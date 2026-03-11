# HOSTING SETUP PROMPT — DigitalOcean Droplet + Vercel + MongoDB Atlas
### For Claude Opus 4.6 · VS Code Agent Mode

---

## WHO YOU ARE & WHAT YOU ARE DOING

You are a senior DevOps engineer helping me host my auction web application.
You have full access to my VS Code project via the agent.

**My tech stack:**
- Frontend: React 19 + TypeScript (will be hosted on Vercel)
- Backend: Node.js + Express (will be hosted on DigitalOcean Droplet)
- Database: MongoDB Atlas (already set up, just need connection string)
- Images: Currently using Cloudinary — we are REPLACING this with local disk storage on the droplet
- Real-time: Socket.io

**My goal:**
1. Help me set up a DigitalOcean droplet step by step
2. Modify my codebase to remove Cloudinary and use local file storage instead
3. Configure everything so the app is fully live and working
4. Set up a simple update workflow so I can push changes anytime

---

## STEP 0 — READ THE PROJECT FIRST

Before making any code changes:

1. Read every file in the project — frontend and backend
2. Find every place Cloudinary is used (search for `cloudinary`, `upload_stream`, `cloudinary.uploader`)
3. Find where environment variables are defined and used
4. Find the image upload logic in all controllers
5. Find how the frontend constructs image URLs
6. Find the Socket.io connection setup on both client and server
7. Find the CORS configuration in `backend/server.js`

Output a summary:
- List every file that uses Cloudinary
- List every controller that handles file uploads
- List every environment variable currently used
- Confirm the backend port being used

Do NOT make any changes until you have read and reported on all of the above.

---

## STEP 1 — MODIFY THE CODEBASE (Before Deployment)

Make these code changes BEFORE we deploy anything. All changes go through git.

### 1A — Remove Cloudinary, Add Local File Storage

Create this new file: `backend/utils/imageUpload.js`

```javascript
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/www/uploads';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';

async function saveImage(buffer, folder = 'players') {
  const filename = `${uuidv4()}.webp`;
  const folderPath = path.join(UPLOAD_DIR, folder);
  const filePath = path.join(folderPath, filename);

  // Create folder if it doesn't exist
  fs.mkdirSync(folderPath, { recursive: true });

  // Resize and convert to WebP using sharp
  await sharp(buffer)
    .resize(400, 400, { fit: 'cover', position: 'centre' })
    .webp({ quality: 82 })
    .toFile(filePath);

  // Return the public-facing URL
  return `${BASE_URL}/uploads/${folder}/${filename}`;
}

async function saveTeamLogo(buffer) {
  const filename = `${uuidv4()}.webp`;
  const folderPath = path.join(UPLOAD_DIR, 'teams');
  const filePath = path.join(folderPath, filename);

  fs.mkdirSync(folderPath, { recursive: true });

  await sharp(buffer)
    .resize(200, 200, { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(filePath);

  return `${BASE_URL}/uploads/teams/${filename}`;
}

async function saveAppLogo(buffer) {
  const filename = `${uuidv4()}.webp`;
  const folderPath = path.join(UPLOAD_DIR, 'logos');
  const filePath = path.join(folderPath, filename);

  fs.mkdirSync(folderPath, { recursive: true });

  await sharp(buffer)
    .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 80 })
    .toFile(filePath);

  return `${BASE_URL}/uploads/logos/${filename}`;
}

async function deleteImage(imageUrl) {
  if (!imageUrl) return;
  if (!imageUrl.includes('/uploads/')) return;

  try {
    const urlPath = new URL(imageUrl).pathname; // e.g. /uploads/players/abc.webp
    const filePath = path.join(UPLOAD_DIR, urlPath.replace('/uploads/', ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Deleted image:', filePath);
    }
  } catch (err) {
    console.error('Failed to delete image:', err.message);
    // Don't throw — deletion failure is not critical
  }
}

module.exports = { saveImage, saveTeamLogo, saveAppLogo, deleteImage };
```

### 1B — Update All Controllers That Use Cloudinary

For EVERY controller file that currently uses Cloudinary:

1. Remove the Cloudinary import and config
2. Import the new imageUpload utility instead
3. Replace every `cloudinary.uploader.upload_stream(...)` call with the appropriate function:
   - Player photos → `saveImage(req.file.buffer, 'players')`
   - Team logos → `saveTeamLogo(req.file.buffer)`
   - App logos → `saveAppLogo(req.file.buffer)`
4. Replace every Cloudinary delete call with `deleteImage(existingUrl)`

Make the player registration non-blocking:
- Save the player to DB immediately with a placeholder photo URL
- Return success response to user immediately
- Upload the image in the background AFTER sending response
- Emit a `playerUpdated` socket event when background upload completes

### 1C — Add Compression Middleware

In `backend/server.js`, add as the VERY FIRST middleware before all routes:

```javascript
const compression = require('compression');
app.use(compression({ level: 6, threshold: 1024 }));
```

### 1D — Update Environment Variables

Update `backend/.env.example` to remove all Cloudinary variables and add:
```env
PORT=5001
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_long_random_secret_minimum_32_characters
UPLOAD_DIR=/var/www/uploads
BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

Update `frontend/.env.example`:
```env
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_SOCKET_URL=https://api.yourdomain.com
```

### 1E — Update Frontend Image URL References

Search the entire frontend for any hardcoded Cloudinary URLs or references to `res.cloudinary.com`.
Replace any hardcoded image base URLs with `process.env.REACT_APP_API_URL` base.

Make sure the Socket.io connection in the frontend reads from env:
```typescript
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';
```

Make sure all API calls read from env:
```typescript
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
```

### 1F — Install/Uninstall Packages

In the backend:
```bash
npm install sharp uuid compression
npm uninstall cloudinary
```

### 1G — Create a Local Development Fallback for Image Storage

For local development, images should save to `./uploads/` in the backend folder.
The `UPLOAD_DIR` env variable controls this:
- Local: `UPLOAD_DIR=./uploads` (relative path, created automatically)
- Production: `UPLOAD_DIR=/var/www/uploads` (absolute path on droplet)

Add this to `backend/.env` (local dev file, not committed):
```env
UPLOAD_DIR=./uploads
BASE_URL=http://localhost:5001
```

Also in `backend/server.js`, serve the local uploads folder in development:
```javascript
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}
```

In production, Nginx serves the uploads folder directly — much faster.

### 1H — Update package.json Scripts

In `backend/package.json`, ensure these scripts exist:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "prod": "NODE_ENV=production node server.js"
  }
}
```

---

## STEP 2 — CREATE THE NGINX CONFIG FILE

Create this file in the project root: `nginx/auction-api.conf`

This file will be copied to the droplet during setup.

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Serve uploaded images directly from disk
    # Nginx serves static files 10x faster than Node.js
    location /uploads/ {
        alias /var/www/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin *;

        # Only allow image files — security measure
        location ~* \.(jpg|jpeg|png|webp|gif|svg)$ {
            try_files $uri =404;
        }
    }

    # Forward all API requests to Node.js
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;

        # Required for Socket.io WebSocket upgrade
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Allow uploads up to 10MB
        client_max_body_size 10M;

        # Timeout for slow operations like image processing
        proxy_read_timeout 120s;
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

---

## STEP 3 — CREATE A DEPLOYMENT SCRIPT

Create this file in the project root: `scripts/deploy-backend.sh`

```bash
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
```

Make it executable:
```bash
chmod +x scripts/deploy-backend.sh
```

Also create: `scripts/check-server.sh`
```bash
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
```

---

## STEP 4 — CREATE THE DROPLET SETUP SCRIPT

Create this file: `scripts/setup-droplet.sh`

This is run ONCE on a fresh droplet to install everything.

```bash
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
```

---

## STEP 5 — COMMIT ALL CHANGES

After making all code changes:

```bash
git add .
git commit -m "chore: replace Cloudinary with local storage, add deployment scripts"
git push origin main
```

---

## STEP 6 — MANUAL DROPLET SETUP INSTRUCTIONS

Generate a clear, numbered, copy-paste-ready instruction document for ME to follow.

The document must tell me EXACTLY what to do, step by step, in this order:

1. Create the droplet on DigitalOcean (what options to select)
2. How to SSH into it for the first time
3. How to run the setup script
4. What to put in the .env file (list every variable with a description)
5. How to copy and enable the Nginx config
6. How to start the app with PM2
7. How to add SSL with Certbot
8. How to whitelist the droplet IP in MongoDB Atlas
9. How to set environment variables in Vercel
10. How to verify everything is working (exact URLs to test)
11. What to do every time I want to update the app

Format it as a numbered checklist with copy-paste commands.
Highlight anything that needs MY specific values (IP, domain, passwords) with ALL_CAPS placeholders.

---

## STEP 7 — VERIFY THE SETUP IS CORRECT

Before finishing, do a final check:

1. Search the entire codebase for any remaining `cloudinary` references — there should be ZERO
2. Search for any hardcoded `localhost` URLs in the frontend — should use env variables
3. Confirm `sharp` and `uuid` are in `backend/package.json` dependencies
4. Confirm `cloudinary` is NOT in `backend/package.json`
5. Confirm `compression` is in `backend/package.json`
6. Confirm the Nginx config correctly handles WebSocket upgrade headers for Socket.io
7. Confirm the `.env.example` files are updated and don't contain real secrets
8. Confirm `.gitignore` includes `.env` (never commit real env files)

Output a final checklist showing pass/fail for each check.

---

## IMPORTANT RULES

- Never commit `.env` files to git — only `.env.example` files
- Never hardcode IP addresses or secrets in source code
- Never hardcode domain names in source code — use environment variables
- Every image URL must be built from `BASE_URL` environment variable
- The app must still work locally for development (with local file storage)
- Do not break any existing functionality while making these changes
- If you are unsure about any existing logic, READ the file first, then ask me before changing it

---

## FINAL DELIVERABLES

When everything is done, provide:

1. **List of every file changed** and what was changed in each
2. **List of every new file created** and what it does
3. **The complete step-by-step droplet setup checklist** (from Step 6 above)
4. **How to update the app** after every future code change (3-line summary)
5. **Common errors and fixes** — what might go wrong and how to fix it
