# 🚀 Hosting Guide - Commercial Auction Site

## Quick Overview

**Best FREE Hosting Combination:**
- **Frontend**: Vercel (Free)
- **Backend**: Render (Free tier)
- **Database**: MongoDB Atlas (Free tier)
- **Images**: Cloudinary (Free tier)

**Total Cost**: $0/month (Free tier limits apply)

---

## 📋 Prerequisites

- GitHub account with your code pushed
- MongoDB Atlas account
- Cloudinary account
- Vercel account
- Render account

---

## Step 1: Setup MongoDB Atlas (Database)

### 1.1 Create MongoDB Cluster

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up / Log in
3. Click **"Build a Database"**
4. Choose **FREE M0 Cluster** (512MB storage)
5. Select your preferred cloud provider & region
6. Click **"Create Cluster"**

### 1.2 Create Database User

1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **Password** authentication
4. Username: `auctionuser`
5. Password: Generate a strong password (save it!)
6. Set role: **Read and write to any database**
7. Click **"Add User"**

### 1.3 Whitelist IP Addresses

1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for Render to connect)
4. Click **"Confirm"**

### 1.4 Get Connection String

1. Go to **Database** → Click **"Connect"**
2. Choose **"Connect your application"**
3. Copy the connection string:
   ```
   mongodb+srv://auctionuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password
5. Add database name: 
   ```
   mongodb+srv://auctionuser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/auction-db?retryWrites=true&w=majority
   ```

---

## Step 2: Setup Cloudinary (Image Storage)

### 2.1 Create Account

1. Go to https://cloudinary.com/
2. Sign up for FREE account
3. Go to **Dashboard**

### 2.2 Get API Credentials

Copy these values:
- **Cloud Name**: `your-cloud-name`
- **API Key**: `123456789012345`
- **API Secret**: `your-api-secret`

---

## Step 3: Deploy Backend to Render

### 3.1 Create Web Service

1. Go to https://render.com/
2. Sign up / Log in
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository: `commercial-auction-site`
5. Configure:
   - **Name**: `auction-backend`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### 3.2 Add Environment Variables

Click **"Environment"** and add these variables:

```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://auctionuser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/auction-db?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=https://your-app-name.vercel.app
```

**Important Notes:**
- Replace MongoDB URI with your actual connection string
- Generate a strong JWT_SECRET (at least 32 characters)
- FRONTEND_URL will be updated after deploying frontend

### 3.3 Deploy

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. Your backend URL will be: `https://auction-backend.onrender.com`
4. **Save this URL** - you'll need it for frontend!

### 3.4 Verify Backend

Visit: `https://auction-backend.onrender.com/api/health`

Should see: `{"status":"ok"}`

---

## Step 4: Deploy Frontend to Vercel

### 4.1 Install Vercel CLI (Optional)

```powershell
npm install -g vercel
```

### 4.2 Deploy via Dashboard

1. Go to https://vercel.com/
2. Sign up / Log in with GitHub
3. Click **"Add New"** → **"Project"**
4. Import `commercial-auction-site` repository
5. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 4.3 Add Environment Variables

Click **"Environment Variables"** and add:

```env
REACT_APP_API_URL=https://auction-backend.onrender.com/api
REACT_APP_SOCKET_URL=https://auction-backend.onrender.com
```

Replace `auction-backend.onrender.com` with your actual Render backend URL.

### 4.4 Deploy

1. Click **"Deploy"**
2. Wait 2-5 minutes
3. Your frontend URL will be: `https://your-app-name.vercel.app`

### 4.5 Update Backend CORS

Go back to **Render** → Your backend service → **Environment**

Update `FRONTEND_URL` to your Vercel URL:
```
FRONTEND_URL=https://your-app-name.vercel.app
```

Click **"Save Changes"** - backend will auto-redeploy.

---

## Step 5: Seed Initial Admin User

### 5.1 Update Seed Script

Edit `backend/scripts/seed-users.js` and update the admin credentials:

```javascript
const adminUser = {
  username: 'admin',
  email: 'your-email@example.com',
  password: 'your-secure-password',
  role: 'admin'
};
```

### 5.2 Run Seed Script on Render

Option 1 - **Via Render Shell**:
1. Go to your Render backend service
2. Click **"Shell"** tab
3. Run:
   ```bash
   node scripts/seed-users.js
   ```

Option 2 - **Temporarily Add to Start Script**:
1. In `backend/package.json`, temporarily change start script:
   ```json
   "start": "node scripts/seed-users.js && node server.js"
   ```
2. Push to GitHub (triggers auto-deploy)
3. After deployment, revert the change

---

## Step 6: Test Your Application

### 6.1 Access Your App

Visit: `https://your-app-name.vercel.app`

### 6.2 Login as Admin

1. Click **"Login"**
2. Use credentials from seed script
3. Test all features:
   - Create auctioneer
   - Setup form builder
   - Test registration link
   - Add players
   - Run auction

---

## 🔧 Troubleshooting

### Backend Issues

**Problem**: Backend not connecting to MongoDB
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Verify connection string is correct
- Check MongoDB Atlas cluster is active

**Problem**: Images not uploading
- Verify Cloudinary credentials are correct
- Check Cloudinary dashboard for quota limits

### Frontend Issues

**Problem**: Can't connect to backend
- Verify `REACT_APP_API_URL` is correct
- Check browser console for CORS errors
- Ensure backend CORS allows your Vercel domain

**Problem**: Socket connection fails
- Verify `REACT_APP_SOCKET_URL` points to backend
- Check Render logs for websocket errors

### Render Free Tier Limits

- Backend "spins down" after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- To prevent: Use a cron job to ping every 10 minutes

---

## 💰 Cost Breakdown

### Free Tier (Recommended for Testing)

| Service | Plan | Limits | Cost |
|---------|------|--------|------|
| **Vercel** | Hobby | 100GB bandwidth, unlimited sites | **$0** |
| **Render** | Free | 750 hours/month, spins down after 15 min | **$0** |
| **MongoDB Atlas** | M0 | 512MB storage, shared CPU | **$0** |
| **Cloudinary** | Free | 25 GB storage, 25 GB bandwidth | **$0** |

**Total**: **$0/month**

### Paid Tier (For Production)

| Service | Plan | Features | Cost |
|---------|------|----------|------|
| **Vercel** | Pro | No spin-down, analytics, priority support | **$20/month** |
| **Render** | Starter | 512MB RAM, no spin-down, SSL | **$7/month** |
| **MongoDB Atlas** | M2 | 2GB storage, dedicated CPU | **$9/month** |
| **Cloudinary** | Plus | 100 GB storage, 100 GB bandwidth | **$99/month** (or stay free) |

**Total**: **$36-135/month**

---

## 📝 Custom Domain (Optional)

### Add Custom Domain to Vercel

1. Buy domain from Namecheap/GoDaddy
2. In Vercel project → **Settings** → **Domains**
3. Add your domain: `www.yourdomain.com`
4. Follow DNS configuration instructions
5. SSL certificate auto-generated

### Update Backend CORS

Update `FRONTEND_URL` in Render to include new domain:
```
FRONTEND_URL=https://www.yourdomain.com
```

---

## 🔐 Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable MongoDB IP whitelist properly
- [ ] Rotate Cloudinary API secrets
- [ ] Enable 2FA on all accounts
- [ ] Regular database backups
- [ ] Monitor Render logs for suspicious activity

---

## 📊 Monitoring

### Render Logs

Access real-time logs:
1. Go to your Render service
2. Click **"Logs"** tab
3. Monitor API requests and errors

### Vercel Analytics

Enable analytics:
1. Go to project → **Analytics**
2. View page views, performance metrics

### MongoDB Atlas Monitoring

1. Go to **Metrics** tab
2. Monitor connections, operations, storage

---

## 🎉 You're Live!

Your auction platform is now hosted and accessible worldwide!

**Next Steps:**
1. Share registration links with auctioneers
2. Test with real auction data
3. Monitor performance and logs
4. Collect user feedback
5. Iterate and improve

---

## Need Help?

- **Render Support**: https://render.com/docs
- **Vercel Support**: https://vercel.com/docs
- **MongoDB Support**: https://www.mongodb.com/docs/atlas/
- **Cloudinary Support**: https://cloudinary.com/documentation

Happy Hosting! 🚀
