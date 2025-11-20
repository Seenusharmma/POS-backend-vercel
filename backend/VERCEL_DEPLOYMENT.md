# Vercel Deployment Guide

This guide will walk you through deploying your backend to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free account works)
2. **Vercel CLI** (optional, but recommended): Install globally
   ```bash
   npm install -g vercel
   ```
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)

---

## Method 1: Deploy via Vercel Dashboard (Recommended for First Time)

### Step 1: Prepare Your Repository
1. Push your code to GitHub/GitLab/Bitbucket
2. Make sure `backend/` folder contains:
   - `server.js` (entry point)
   - `vercel.json` (configuration)
   - `package.json` (dependencies)
   - All your route, model, and config files

### Step 2: Import Project to Vercel
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Select the repository containing your backend

### Step 3: Configure Project Settings
1. **Root Directory**: Set to `backend` (important!)
   - Click "Edit" next to Root Directory
   - Enter: `backend`
   
2. **Framework Preset**: Leave as "Other" or "Node.js"

3. **Build Command**: Leave empty (or use `npm run build` if you have one)
   
4. **Output Directory**: Leave empty

5. **Install Command**: `npm install`

### Step 4: Set Environment Variables
Click **"Environment Variables"** and add:

```
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=production
```

**Optional** (if you use Cloudinary):
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Important**: 
- Make sure to add these for **Production**, **Preview**, and **Development** environments
- Click "Save" after adding each variable

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait for the build to complete (usually 1-2 minutes)
3. Your backend will be live at: `https://your-project-name.vercel.app`

---

## Method 2: Deploy via Vercel CLI

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Navigate to Backend Directory
```bash
cd backend
```

### Step 3: Login to Vercel
```bash
vercel login
```
This will open your browser to authenticate.

### Step 4: Deploy
```bash
vercel
```

**First time deployment:**
- Follow the prompts:
  - Set up and deploy? **Yes**
  - Which scope? (Select your account)
  - Link to existing project? **No** (first time)
  - Project name? (Press Enter for default or enter custom name)
  - Directory? (Press Enter, it should detect `backend`)
  - Override settings? **No**

### Step 5: Set Environment Variables
```bash
vercel env add MONGODB_URI
# Paste your MongoDB URI when prompted
# Select: Production, Preview, Development

vercel env add NODE_ENV
# Enter: production
# Select: Production, Preview, Development
```

### Step 6: Deploy to Production
```bash
vercel --prod
```

---

## Method 3: Automatic Deployments (Recommended for Ongoing Development)

### Step 1: Connect Repository
1. Go to Vercel Dashboard
2. Import your Git repository (if not already done)
3. Configure as described in Method 1

### Step 2: Automatic Deployments
- **Every push to `main` branch** → Deploys to Production
- **Every push to other branches** → Creates Preview Deployment
- **Pull Requests** → Creates Preview Deployment with unique URL

### Step 3: Update Environment Variables
- Go to Project Settings → Environment Variables
- Add/update variables as needed
- Redeploy to apply changes

---

## Post-Deployment Checklist

### ✅ Verify Deployment
1. Visit your deployment URL: `https://your-project.vercel.app`
2. You should see: `🍽️ Food Fantasy Backend is running successfully!`
3. Test API endpoints:
   - `https://your-project.vercel.app/api/foods`
   - `https://your-project.vercel.app/api/orders`

### ✅ Update Frontend CORS
Update your frontend to use the new backend URL:
- Add your Vercel backend URL to CORS origins in `server.js` if needed
- Update frontend API base URL to point to Vercel deployment

### ✅ Monitor Logs
- Go to Vercel Dashboard → Your Project → Logs
- Check for any errors or warnings
- Monitor function execution times

---

## Troubleshooting

### Issue: Build Fails
**Solution**: 
- Check Vercel build logs for errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Issue: Environment Variables Not Working
**Solution**:
- Make sure variables are set for the correct environment (Production/Preview)
- Redeploy after adding environment variables
- Check variable names match exactly (case-sensitive)

### Issue: API Routes Return 404
**Solution**:
- Verify `vercel.json` is in the `backend` directory
- Check that Root Directory is set to `backend` in Vercel settings
- Ensure routes are properly configured in `server.js`

### Issue: MongoDB Connection Fails
**Solution**:
- Verify `MONGODB_URI` environment variable is set correctly
- Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for Vercel)
- Ensure MongoDB connection string is correct

### Issue: Socket.IO Not Working
**Note**: Socket.IO WebSockets don't work on Vercel serverless functions. This is expected behavior. The API will work, but real-time WebSocket features are disabled on Vercel.

---

## Useful Vercel CLI Commands

```bash
# View deployment status
vercel ls

# View logs
vercel logs

# Remove deployment
vercel remove

# Link to existing project
vercel link

# Open project in browser
vercel open
```

---

## Important Notes

1. **Root Directory**: Must be set to `backend` in Vercel project settings
2. **Environment Variables**: Must be set in Vercel dashboard or via CLI
3. **Socket.IO**: WebSocket features are disabled on Vercel (serverless limitation)
4. **Cold Starts**: First request after inactivity may be slower (serverless behavior)
5. **Function Timeout**: Default is 10 seconds, can be increased in Pro plan

---

## Next Steps

1. ✅ Deploy your backend
2. ✅ Test all API endpoints
3. ✅ Update frontend to use new backend URL
4. ✅ Set up custom domain (optional)
5. ✅ Monitor performance and logs

---

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Vercel Community: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

