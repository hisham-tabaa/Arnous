# Railway Deployment Guide

## 🚀 Environment Variables to Set in Railway

Go to your Railway project → **Variables** tab → Add these variables:

### Required Variables:
```bash
# Authentication (CRITICAL - App won't work without this)
JWT_SECRET=arnous-exchange-super-secure-jwt-secret-key-2024-railway-production-32chars
JWT_EXPIRES_IN=24h

# Admin Login Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Database (MongoDB Service)
MONGO_INITDB_ROOT_USERNAME=mongo
MONGO_INITDB_ROOT_PASSWORD=cDrUTnfhFwEaLVIofirehWpnLwbfIMUE
MONGO_INITDB_DATABASE=arnous_exchange

# Environment
NODE_ENV=production
PORT=8080
```

### Railway Auto-Generated Variables:
These are automatically created by Railway when you add MongoDB service:
```bash
MONGOHOST=${RAILWAY_PRIVATE_DOMAIN}
MONGOUSER=${MONGO_INITDB_ROOT_USERNAME}
MONGOPASSWORD=${MONGO_INITDB_ROOT_PASSWORD}
MONGOPORT=27017
```

## 🔧 After Setting Variables:

1. **Redeploy your app** (Railway will automatically redeploy when you change variables)
2. **Check logs** for successful MongoDB connection
3. **Test admin login** with:
   - Username: `admin`
   - Password: `admin123`

## 🐛 Troubleshooting:

### If admin login still fails:
1. Check Railway logs for JWT_SECRET errors
2. Verify all environment variables are set correctly
3. Make sure MongoDB connection is successful

### If user page is empty:
1. Check if currencies were initialized in database
2. Verify API endpoints are responding
3. Check browser console for errors

## 📱 Login Credentials:
- **Admin Username:** `admin`
- **Admin Password:** `admin123`
- **Admin URL:** `https://your-app-name.up.railway.app/admin`

## 🔒 Security Notes:
- Change `ADMIN_PASSWORD` to something secure after first login
- The `JWT_SECRET` should remain the same once set
- Never share these credentials publicly