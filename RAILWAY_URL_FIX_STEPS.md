# 🚄 Railway URL Fix - Step by Step Guide

## ❌ Current Issue
Your server is showing `localhost:8080` because Railway environment variables are not configured.

## ✅ Solution Steps

### Step 1: Get Your Railway App URL

1. **Go to your Railway dashboard**
2. **Click on your deployed project**
3. **Look for your app URL** (should be something like: `https://your-app-name.up.railway.app`)
4. **Copy this URL**

### Step 2: Set Environment Variables in Railway

1. **In your Railway project dashboard:**
   - Click on **"Variables"** tab
   - Add these variables:

```env
NODE_ENV=production
CLIENT_URL=https://your-actual-app-name.up.railway.app
PORT=8080
```

**Replace `your-actual-app-name.up.railway.app` with your real Railway app URL!**

### Step 3: Redeploy (Automatic)

Railway will automatically redeploy when you add/change environment variables.

### Step 4: Check the Logs

After redeployment, you should see:
```
🚀 Server running on port 8080
📊 Admin Panel: https://your-app-name.up.railway.app/admin
💰 Currency API: https://your-app-name.up.railway.app/api/currencies
🌐 Base URL: https://your-app-name.up.railway.app
🔧 Environment: production
```

## 🔍 Finding Your Railway App URL

If you can't find your Railway app URL:

1. **In Railway dashboard**, click on your project
2. **Go to "Deployments" tab**
3. **Click on the latest deployment**
4. **Look for "Domain" or "URL" section**
5. **Copy the https:// URL**

## 🆘 If Still Showing Localhost

If it's still showing localhost after setting `CLIENT_URL`:

1. **Check that `NODE_ENV=production` is set**
2. **Verify `CLIENT_URL` is set correctly**
3. **Wait for Railway to finish redeployment**
4. **Check deployment logs for any errors**

## 🎯 What Should Happen

✅ Server will detect Railway environment  
✅ URLs will show your Railway domain  
✅ CORS will work with your Railway domain  
✅ Admin panel accessible at Railway URL  

---

**Next Step:** Go to Railway dashboard → Variables → Add `CLIENT_URL` with your actual Railway app URL
