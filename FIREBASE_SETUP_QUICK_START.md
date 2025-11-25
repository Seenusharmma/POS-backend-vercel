# Firebase Push Notifications - Quick Start

## 🚀 Quick Setup (5 minutes)

### 1. Get Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → Project Settings → Your apps
3. Copy the config values

### 2. Frontend Setup

Add to `frontend/.env`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

**Get VAPID Key:**
- Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
- Click "Generate key pair" if needed
- Copy the key

**Update Service Worker:**
Edit `frontend/public/firebase-messaging-sw.js` and replace the config object with your actual values.

### 3. Backend Setup

1. **Get Service Account Key:**
   - Firebase Console → Project Settings → Service accounts
   - Click "Generate new private key"
   - Download JSON file

2. **Add to Backend `.env`:**
   ```env
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
   ```
   (Paste the entire JSON as a string)

3. **For Vercel:**
   - Dashboard → Settings → Environment Variables
   - Add `FIREBASE_SERVICE_ACCOUNT` with the JSON string

### 4. Test

1. Start servers:
   ```bash
   cd backend && npm run dev
   cd frontend && npm run dev
   ```

2. Open `http://localhost:5173`
3. Login → Profile → Test Push Notifications
4. Click "Initialize Firebase Push"
5. Click "Test FCM Notification"

## ✅ Done!

Push notifications will now work automatically on:
- Order placement
- Order status changes
- Any custom notifications

## 📚 Full Documentation

See `FIREBASE_PUSH_NOTIFICATIONS_SETUP.md` for detailed setup and troubleshooting.

