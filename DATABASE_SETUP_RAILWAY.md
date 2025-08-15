# 🗄️ Database Setup for Railway Deployment

## Railway MongoDB Plugin Setup (Recommended)

### Step 1: Add MongoDB Plugin to Your Railway Project
1. Go to your Railway project dashboard
2. Click **"+ New"** in your project
3. Select **"Database"** → **"Add MongoDB"**
4. Railway will provision a MongoDB instance for you
5. Wait for provisioning to complete (2-3 minutes)

### Step 2: Get Connection Variables
Railway automatically creates these environment variables for you:
- `MONGO_URL` - Full connection string
- `MONGODB_URI` - Alternative connection string format

Your app is already configured to use `MONGODB_URI`, so no code changes needed!

### Step 3: Configure Additional Environment Variables

The MongoDB connection is now automatic! You just need to add these other variables:

1. Go to your deployed project
2. Click on **Variables** tab  
3. Add these environment variables:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-for-production-use
JWT_EXPIRES_IN=24h
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password-change-this
```

**Note:** Railway automatically provides `MONGODB_URI` - no need to add it manually!

### Step 4: Redeploy & Test
1. After adding the MongoDB plugin, Railway will automatically redeploy
2. Check the deployment logs to ensure database connection is successful
3. Look for: `MongoDB Connected: mongodb://...` in the logs

## 🔍 Testing Your Database Connection

1. **Visit your Railway app URL**
2. **Check if the homepage loads** (means basic connection works)
3. **Test admin login:**
   - Go to `https://your-app.up.railway.app/admin`
   - Login with your admin credentials
   - If successful, database is working!

## 🚨 If You Have Issues

### Connection Errors:
- Double-check the connection string format
- Ensure password doesn't contain special characters (use alphanumeric)
- Verify Network Access allows 0.0.0.0/0

### Deployment Logs:
- In Railway dashboard, click **Deployments**
- View logs for error messages
- Look for MongoDB connection success/failure messages

### Database User Issues:
- Ensure user has "Read and write to any database" permissions
- Try creating a new user with a simpler password

## 🎉 Success Indicators

✅ **Railway deployment logs show:** `MongoDB Connected: cluster0...`  
✅ **Homepage loads without errors**  
✅ **Admin login works**  
✅ **Currency data displays**  

Your database is now hosted and connected to your Railway app!

---

**Next Steps:** Once database is working, you can set up social media integration using the credentials in `RAILWAY_DEPLOYMENT_GUIDE.md`
