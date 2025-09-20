#!/bin/bash

echo "🚂 Railway Deployment for SchoolBusConnect"
echo "==========================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

echo "🔧 Building the application..."
npm run railway:build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🚂 Next steps:"
    echo "1. Login to Railway: railway login"
    echo "2. Create new project: railway create"
    echo "3. Add PostgreSQL: railway add postgresql" 
    echo "4. Set environment variables:"
    echo "   railway variables set SESSION_SECRET=your-random-secret-here"
    echo "5. Deploy: railway up"
    echo "6. Run migrations: railway run npm run db:push"
    echo ""
    echo "🎯 Quick deploy command:"
    echo "railway login && railway create && railway add postgresql && railway up"
    echo ""
    echo "📱 Your PWA will be installable on mobile devices!"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
