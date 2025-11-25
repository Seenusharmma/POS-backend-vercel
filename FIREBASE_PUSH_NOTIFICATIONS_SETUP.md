# Firebase Cloud Messaging (FCM) Push Notifications Setup

## ✅ Complete Setup Guide

This guide will help you set up Firebase Cloud Messaging for push notifications in your application.

## 📋 Prerequisites

1. Firebase project created
2. Firebase Web App configured
3. Firebase Cloud Messaging enabled

## 🔧 Step 1: Firebase Console Setup

### 1.1 Get Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Scroll down to **Your apps** section
5. Click on your Web app or create a new one
6. Copy the Firebase configuration object

### 1.2 Get VAPID Key

1. In Firebase Console, go to **Project Settings**
2. Click on **Cloud Messaging** tab
3. Scroll down to **Web Push certificates**
4. Click **Generate key pair** if you don't have one
5. Copy the **Key pair** (this is your VAPID key)

### 1.3 Get Service Account Key

1. In Firebase Console, go to **Project Settings**
2. Click on **Service accounts** tab
3. Click **Generate new private key**
4. Download the JSON file (keep this secure!)

## 🔧 Step 2: Frontend Setup

### 2.1 Update Environment Variables

Create or update `frontend/.env`:

```env
# Firebase Config
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase VAPID Key (for FCM)
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

### 2.2 Update Firebase Service Worker

Edit `frontend/public/firebase-messaging-sw.js` and replace the `firebaseConfig` object with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your_actual_api_key",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project.appspot.com",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id",
};
```

**Important:** This file must have the actual config values (not environment variables) because service workers run in a different context.

## 🔧 Step 3: Backend Setup

### 3.1 Install Dependencies

```bash
cd backend
npm install firebase-admin
```

### 3.2 Update Environment Variables

Add to `backend/.env`:

```env
# Firebase Service Account (paste the entire JSON as a string)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**For Vercel:**
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add `FIREBASE_SERVICE_ACCOUNT` with the entire JSON as a string (escape quotes properly)

## 🚀 Step 4: Testing

### 4.1 Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 4.2 Test Push Notifications

1. Open `http://localhost:5173`
2. Login with your account
3. Go to **Profile** page
4. Scroll to **"🧪 Test Push Notifications"** section
5. Click **"🚀 Initialize Firebase Push"**
6. Grant notification permission when prompted
7. Click **"📤 Test FCM Notification"**

### 4.3 Verify in Console

Check browser console for:
- ✅ "Firebase push notifications initialized successfully"
- ✅ "FCM Token: [your_token]"
- ✅ "FCM token saved for: [your_email]"

## 📱 How It Works

### Frontend Flow:
1. User logs in → `PushNotificationSetup` component activates
2. Requests notification permission
3. Registers Firebase service worker
4. Gets FCM token from Firebase
5. Sends FCM token to backend

### Backend Flow:
1. Receives FCM token from frontend
2. Saves token to database
3. When sending notification:
   - Uses Firebase Admin SDK
   - Sends notification to FCM token
   - Handles invalid tokens automatically

## 🔍 Troubleshooting

### Issue: "Firebase Messaging is not available"
**Solution:** 
- Check if Firebase config is correct in `firebase.js`
- Ensure `messagingSenderId` is set
- Verify service worker is registered

### Issue: "VITE_FIREBASE_VAPID_KEY is not set"
**Solution:**
- Add `VITE_FIREBASE_VAPID_KEY` to `frontend/.env`
- Get VAPID key from Firebase Console → Cloud Messaging → Web Push certificates

### Issue: "Firebase Admin SDK not initialized"
**Solution:**
- Check `FIREBASE_SERVICE_ACCOUNT` in backend `.env`
- Ensure the JSON is properly formatted
- For Vercel, ensure the environment variable is set

### Issue: Service Worker Not Registering
**Solution:**
- Check browser console for errors
- Ensure you're on HTTPS or localhost
- Clear browser cache and reload
- Check `firebase-messaging-sw.js` has correct config

### Issue: Notifications Not Appearing
**Solution:**
- Check notification permission is granted
- Verify FCM token is saved in database
- Check backend logs for errors
- Test with "Test FCM Notification" button

## 📚 API Endpoints

### Frontend → Backend:
- `POST /api/push/fcm-subscribe` - Save FCM token
- `POST /api/push/fcm-unsubscribe` - Remove FCM token
- `POST /api/push/fcm-send` - Send notification to user
- `POST /api/push/fcm-send-all` - Send notification to all users

## ✅ Verification Checklist

- [ ] Firebase project created
- [ ] Firebase Web App configured
- [ ] VAPID key generated and added to frontend `.env`
- [ ] Service Account key downloaded and added to backend `.env`
- [ ] `firebase-messaging-sw.js` updated with actual config
- [ ] Frontend environment variables set
- [ ] Backend environment variables set
- [ ] Service worker registers successfully
- [ ] FCM token is generated
- [ ] FCM token is saved to database
- [ ] Test notification works

## 🎉 Success!

Once everything is set up:
- ✅ Push notifications work automatically on order placement
- ✅ Push notifications work on order status changes
- ✅ Works on both development and production (Vercel)
- ✅ Cross-platform support (Web, Android, iOS)

## 📝 Notes

- Firebase Cloud Messaging works on HTTPS (production) and localhost (development)
- Service worker must have actual config values (not env variables)
- FCM tokens are automatically refreshed by Firebase
- Invalid tokens are automatically removed from database

