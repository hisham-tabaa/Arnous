@echo off
echo 🚀 Preparing for Railway deployment...

echo 🧹 Cleaning up existing files...
if exist node_modules rmdir /s /q node_modules
if exist client\node_modules rmdir /s /q client\node_modules
if exist server\node_modules rmdir /s /q server\node_modules
if exist client\package-lock.json del client\package-lock.json
if exist server\package-lock.json del server\package-lock.json
if exist package-lock.json del package-lock.json

echo 📦 Installing dependencies...
npm install

echo ✅ Ready for Railway deployment!
echo.
echo Next steps:
echo 1. Commit these changes: git add . ^&^& git commit -m "Fix lock files for Railway deployment"
echo 2. Push to GitHub: git push origin main
echo 3. Deploy on Railway using the updated configuration
pause
