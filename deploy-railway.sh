#!/bin/bash

echo "🚀 Preparing for Railway deployment..."

# Clean up existing lock files and node_modules
echo "🧹 Cleaning up existing files..."
rm -rf node_modules
rm -rf client/node_modules
rm -rf server/node_modules
rm -f client/package-lock.json
rm -f server/package-lock.json
rm -f package-lock.json

# Install dependencies and regenerate lock files
echo "📦 Installing dependencies..."
npm install

echo "✅ Ready for Railway deployment!"
echo ""
echo "Next steps:"
echo "1. Commit these changes: git add . && git commit -m 'Fix lock files for Railway deployment'"
echo "2. Push to GitHub: git push origin main"
echo "3. Deploy on Railway using the updated configuration"
