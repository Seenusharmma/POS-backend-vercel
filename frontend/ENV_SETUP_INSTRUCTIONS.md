# Frontend Environment Variables Setup

## ✅ Current Status

Your `.env` file has been updated with the required Firebase variables. Here's what you need to do:

## 🔧 Required Actions

### 1. Add Firebase VAPID Key

Your `.env` file currently has:
```
VITE_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

**You need to replace `YOUR_VAPID_KEY_HERE` with your actual VAPID key:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **food-fantasy-26e65**
3. Go to **Project Settings** (gear icon)
4. Click on **Cloud Messaging** tab
5. Scroll down to **Web Push certificates**
6. If you don't have a key pair:
   - Click **"Generate key pair"**
   - Copy the generated key
7. If you already have one:
   - Copy the existing key
8. Replace `YOUR_VAPID_KEY_HERE` in your `.env` file with the actual key

### 2. Update Firebase Service Worker

The file `frontend/public/firebase-messaging-sw.js` has been updated with your Firebase config. This is correct and should work.

**Note:** Service workers can't access environment variables, so the config is hardcoded in this file. This is normal and expected.

## 📋 Current Environment Variables

Your `.env` file contains:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Firebase Configuration (✅ All set)
VITE_FIREBASE_API_KEY=AIzaSyAKWtp1-MG9G3aclNOTo4t4xCMOslOvazk
VITE_FIREBASE_AUTH_DOMAIN=food-fantasy-26e65.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=food-fantasy-26e65
VITE_FIREBASE_STORAGE_BUCKET=food-fantasy-26e65.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=141220621227
VITE_FIREBASE_APP_ID=1:141220621227:web:72222a545d0dc4c20300ee

# Firebase VAPID Key (⚠️ NEEDS TO BE UPDATED)
VITE_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

## ✅ Verification Checklist

After updating the VAPID key:

- [ ] VAPID key added to `.env` file
- [ ] Restart frontend dev server (`npm run dev`)
- [ ] Test push notifications in Profile page
- [ ] Check browser console for "FCM Token" message
- [ ] Verify notifications work

## 🚀 Next Steps

1. **Get VAPID Key** from Firebase Console
2. **Update `.env`** file with the VAPID key
3. **Restart** your frontend server
4. **Test** push notifications

## 📚 For Production (Vercel)

When deploying to Vercel, add all these environment variables in:
- Vercel Dashboard → Your Project → Settings → Environment Variables

Make sure to add:
- All `VITE_FIREBASE_*` variables
- `VITE_API_BASE_URL` (if different from default)

## 🔍 Troubleshooting

### Issue: "VITE_FIREBASE_VAPID_KEY is not set"
**Solution:** Make sure you've added the VAPID key to `.env` and restarted the server.

### Issue: Service worker not registering
**Solution:** 
- Check browser console for errors
- Ensure you're on HTTPS or localhost
- Clear browser cache

### Issue: FCM token not generated
**Solution:**
- Verify VAPID key is correct
- Check notification permission is granted
- Check browser console for errors

