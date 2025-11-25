# Push Notifications Setup Guide

## 🎉 Free Push Notifications - No API Keys Required!

This app uses the browser's native Web Push API with VAPID keys (self-generated, completely free).

## 📋 Setup Instructions

### Step 1: Install Dependencies

```bash
cd backend
npm install web-push
```

### Step 2: Generate VAPID Keys

Run this command to generate your VAPID keys (one-time setup):

```bash
cd backend
node scripts/generateVapidKeys.js
```

This will:
- Generate a public and private VAPID key
- Automatically add them to your `.env` file
- Display the keys in the console

### Step 3: Update VAPID Subject (Optional)

Edit your `.env` file and update the `VAPID_SUBJECT`:

```env
VAPID_SUBJECT=mailto:your-email@example.com
```

Replace `your-email@example.com` with your actual email.

### Step 4: Restart Your Server

```bash
npm run dev
```

## ✅ How It Works

1. **Automatic Setup**: When a user logs in, the app automatically:
   - Requests notification permission
   - Registers a service worker
   - Subscribes to push notifications
   - Saves the subscription to the database

2. **Automatic Notifications**: Push notifications are automatically sent when:
   - A new order is placed
   - Order status changes (Pending → Cooking → Ready → Served → Completed)

3. **User Experience**:
   - Users see a browser permission prompt on first login
   - Notifications appear even when the app is closed
   - Clicking a notification opens the app

## 🔧 Manual Testing

### Test Push Notification via API

```bash
# Send notification to specific user
curl -X POST http://localhost:5000/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "user@example.com",
    "title": "Test Notification",
    "body": "This is a test push notification!"
  }'

# Send notification to all users
curl -X POST http://localhost:5000/api/push/send-all \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Broadcast",
    "body": "This is a broadcast message!"
  }'
```

## 📱 Browser Support

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (iOS 16.4+, macOS)
- ✅ Opera
- ❌ Internet Explorer (not supported)

## 🔒 Security Notes

- VAPID keys are self-generated and stored in your `.env` file
- Never commit `.env` file to version control
- HTTPS is required for production (localhost works for development)
- Service worker must be served from the root domain

## 🐛 Troubleshooting

### Notifications Not Working?

1. **Check VAPID Keys**: Make sure keys are in `.env` file
2. **Check Permission**: User must grant notification permission
3. **Check HTTPS**: Production requires HTTPS (localhost is OK for dev)
4. **Check Browser**: Some browsers require user interaction before showing notifications
5. **Check Service Worker**: Open DevTools → Application → Service Workers

### Service Worker Not Registering?

- Make sure `service-worker.js` is in the `public` folder
- Check browser console for errors
- Clear browser cache and reload

### Permission Denied?

- User must click "Allow" when prompted
- Check browser settings if permission was denied
- Some browsers require user interaction before requesting permission

## 📚 API Endpoints

- `GET /api/push/vapid-key` - Get VAPID public key
- `POST /api/push/subscribe` - Save user subscription
- `POST /api/push/unsubscribe` - Remove user subscription
- `POST /api/push/send` - Send notification to specific user
- `POST /api/push/send-all` - Send notification to all users

## 🎯 Features

- ✅ Free (no third-party services)
- ✅ Works offline (service worker)
- ✅ Automatic setup
- ✅ Real-time order notifications
- ✅ Status change notifications
- ✅ Click to open app
- ✅ Badge support
- ✅ Icon support
- ✅ Custom actions (future)

Enjoy your free push notifications! 🚀

