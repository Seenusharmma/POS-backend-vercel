# Deployment Guide for Vercel

## Environment Variables Required

Make sure to set these in your Vercel project settings:

1. **MONGODB_URI** - Your MongoDB connection string
2. **CLOUDINARY_CLOUD_NAME** - Cloudinary cloud name
3. **CLOUDINARY_API_KEY** - Cloudinary API key
4. **CLOUDINARY_API_SECRET** - Cloudinary API secret
5. **VERCEL** - Automatically set to "1" by Vercel (don't set manually)
6. **NODE_ENV** - Automatically set to "production" (don't set manually)

## Common Deployment Issues

### 1. Missing Environment Variables
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add all required variables listed above

### 2. Build Errors
- Check that `package.json` has `"type": "module"` for ES modules
- Ensure all dependencies are listed in `package.json`

### 3. Module Not Found
- Make sure all imports use `.js` extension (e.g., `import { connectDB } from "./config/db.js"`)
- Verify file paths are correct

### 4. Database Connection Issues
- MongoDB URI must be accessible from Vercel's servers
- Check MongoDB Atlas IP whitelist (allow all IPs: 0.0.0.0/0)

### 5. Function Timeout
- Current timeout is set to 30 seconds in `vercel.json`
- Increase if needed (max 60 seconds on Pro plan)

## Deployment Steps

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

## Testing Deployment

After deployment, test these endpoints:
- `GET /` - Health check
- `GET /api/foods` - Fetch foods
- `GET /api/orders` - Fetch orders

