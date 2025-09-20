# SchoolBusConnect - Deployment Guide

## Quick Deployment to Vercel

### Prerequisites
1. A Vercel account (free at vercel.com)
2. A PostgreSQL database (recommended: Neon, Supabase, or PlanetScale)

### Step 1: Prepare Database
1. Create a PostgreSQL database on your preferred provider:
   - **Neon** (recommended): https://neon.tech (free tier available)
   - **Supabase**: https://supabase.com (free tier available)
   - **PlanetScale**: https://planetscale.com (MySQL alternative)

2. Get your database connection string (DATABASE_URL)

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
```

#### Option B: Using Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your GitHub repository or upload your project
4. Add environment variables in the dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SESSION_SECRET`: A secure random string (generate at https://generate-secret.vercel.app)

### Step 3: Run Database Migrations
After deployment, run the database migrations:
```bash
# Using Vercel CLI
vercel env pull .env.local
npm run db:push
```

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secure random string for session encryption
- `NODE_ENV`: Set to "production" (Vercel sets this automatically)

### Post-Deployment
1. Visit your deployed app URL
2. Test the health endpoint: `https://your-app.vercel.app/api/health`
3. Register the first user account
4. Configure any additional settings as needed

## Alternative Deployment Options

### Railway
1. Connect your GitHub repository at https://railway.app
2. Add a PostgreSQL service
3. Set environment variables
4. Deploy automatically

### Render
1. Create account at https://render.com
2. Create new Web Service from GitHub
3. Add PostgreSQL database
4. Configure environment variables

### DigitalOcean App Platform
1. Create account at https://digitalocean.com
2. Use App Platform to deploy from GitHub
3. Add managed PostgreSQL database
4. Configure environment variables

## Local Development
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

## Troubleshooting
- Check Vercel function logs in the dashboard
- Ensure DATABASE_URL is correctly formatted
- Verify all environment variables are set
- Check that your database allows external connections
