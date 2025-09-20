# Railway Deployment Guide

## Quick Deploy to Railway (Recommended)

### Step 1: Prepare for Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"

### Step 2: Configure the Project
Railway will automatically:
- Detect your Node.js app
- Install dependencies
- Build your project

### Step 3: Add Database
1. In Railway dashboard, click "Add Service"
2. Select "PostgreSQL"
3. Railway will automatically create DATABASE_URL

### Step 4: Set Environment Variables
In Railway dashboard, add:
- `SESSION_SECRET` = generate a random string
- `NODE_ENV` = production (optional, Railway sets this)

### Step 5: Deploy
- Railway automatically deploys when you push to GitHub
- Your app will be live at: `https://your-app.up.railway.app`

### Step 6: Run Database Migrations
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and connect to your project
railway login
railway link

# Run migrations
railway run npm run db:push
```

That's it! Your app is live with database included.

## Alternative: Using Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy from current directory
railway up

# Add PostgreSQL
railway add postgresql

# Set environment variables
railway variables set SESSION_SECRET=your-secret-here

# Run migrations
railway run npm run db:push
```
