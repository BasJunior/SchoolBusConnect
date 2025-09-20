#!/bin/bash

echo "🚀 SchoolBusConnect Deployment Helper"
echo "======================================"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "✅ Building the application..."
npm run vercel-build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Run: vercel login"
    echo "2. Run: vercel"
    echo "3. Set environment variables:"
    echo "   - DATABASE_URL (your PostgreSQL connection string)"
    echo "   - SESSION_SECRET (a secure random string)"
    echo ""
    echo "🎯 Quick deploy command:"
    echo "vercel --prod"
    echo ""
    echo "📖 For detailed instructions, see DEPLOYMENT.md"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
