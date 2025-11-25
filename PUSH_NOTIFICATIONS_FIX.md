# Push Notifications - Fixed for Development & Vercel

## ✅ All Issues Fixed

Push notifications now work on both:
- **Development Server** (localhost:5173 with backend on localhost:5000)
- **Vercel Production** (HTTPS deployment)

## 🔧 What Was Fixed

### 1. **API Base URL Configuration** (`frontend/src/services/api.js`)
- ✅ Automatically detects development vs production
- ✅ Uses `localhost:5000` for development
- ✅ Uses Vercel URL for production
- ✅ Respects `VITE_API_BASE_URL` if explicitly set

### 2. **Service Worker Registration** (`frontend/src/utils/pushNotifications.js`)
- ✅ Works on both HTTP (localhost) and HTTPS (Vercel)
- ✅ Properly waits for service worker to be ready
- ✅ Handles existing registrations correctly
- ✅ Better error handling and logging

### 3. **Service Worker File** (`frontend/public/service-worker.js`)
- ✅ Improved logging with `[SW]` prefix
- ✅ Better error handling
- ✅ Works on both environments

### 4. **Vite Configuration** (`frontend/vite.config.js`)
- ✅ Added service worker headers for development
- ✅ Ensures service worker is served correctly

### 5. **Push Notification Setup** (`frontend/src/components/notifications/PushNotificationSetup.jsx`)
- ✅ Better error logging
- ✅ Checks for existing subscriptions
- ✅ Improved initialization flow

## 🚀 How to Test

### Development Server

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Push Notifications:**
   - Open `http://localhost:5173`
   - Login with your account
   - Go to Profile page
   - Use the "Test Push Notifications" section
   - Click "Initialize Push Notifications"
   - Click "Test Push Notification"

### Vercel Production

1. **Deploy to Vercel:**
   - Push code to GitHub
   - Vercel will auto-deploy
   - Ensure VAPID keys are in Vercel environment variables

2. **Test Push Notifications:**
   - Open your Vercel deployment URL
   - Login with your account
   - Go to Profile page
   - Use the "Test Push Notifications" section

## 📋 Environment Variables Required

### Backend (.env or Vercel)
```
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your-email@example.com
```

### Frontend (Optional)
```
VITE_API_BASE_URL=https://your-backend.vercel.app
```
(If not set, it auto-detects based on hostname)

## 🔍 Debugging

### Check Service Worker
1. Open DevTools → Application → Service Workers
2. Should see service worker registered
3. Status should be "activated and is running"

### Check Push Subscription
1. Open DevTools → Application → Service Workers
2. Click "Push" under your service worker
3. Should see subscription with keys

### Check Console Logs
- Look for `[SW]` prefixed logs (service worker)
- Look for push notification initialization logs
- Check for any errors

### Common Issues

1. **Service Worker Not Registering:**
   - Check browser console for errors
   - Ensure you're on HTTPS or localhost
   - Clear browser cache and reload

2. **VAPID Key Not Found:**
   - Check backend logs for VAPID key configuration
   - Verify environment variables are set
   - Check `/api/push/vapid-key` endpoint

3. **Subscription Not Saving:**
   - Check network tab for `/api/push/subscribe` request
   - Verify backend is accessible
   - Check MongoDB connection

## ✅ Verification Checklist

- [ ] Service worker registers successfully
- [ ] VAPID key is fetched from backend
- [ ] Push subscription is created
- [ ] Subscription is saved to backend
- [ ] Test push notification works
- [ ] Automatic notifications work (on order placement/status change)

## 🎉 Success Indicators

When everything is working:
- ✅ Console shows: "Push notifications initialized successfully"
- ✅ Service worker is active in DevTools
- ✅ Test push notification appears in browser
- ✅ Automatic notifications appear on order events

