# How to Test Push Notifications on Localhost

## 🚀 Quick Start Guide

### Step 1: Make Sure Everything is Running

1. **Backend Server**: Make sure your backend is running on `http://localhost:5000`
2. **Frontend Server**: Make sure your frontend is running (usually `http://localhost:5173`)

### Step 2: Login to Your App

1. Open your app in the browser (Chrome, Edge, or Firefox recommended)
2. Login with your account

### Step 3: Go to Profile Page

1. Navigate to the **Profile** page (`/profile`)
2. You'll see a **"🧪 Test Push Notifications"** section

### Step 4: Test Push Notifications

#### Option A: Using the Test Component (Easiest)

1. **Check Support**: Click "🔍 Check Support" button
   - This verifies your browser supports push notifications
   - Check the browser console for detailed info

2. **Initialize Push**: Click "🚀 Initialize Push" button
   - This will:
     - Request notification permission (you'll see a browser popup)
     - Register the service worker
     - Subscribe to push notifications
     - Save subscription to database
   - **Click "Allow"** when the browser asks for permission

3. **Test Local Notification**: Click "📱 Test Local Notification" button
   - This shows a notification immediately (browser notification)
   - You should see a notification appear even if the tab is not active

4. **Test Push Notification**: Click "📤 Test Push Notification" button
   - This sends a push notification from the server
   - You should see a notification even if the browser tab is closed!

#### Option B: Test via API (Advanced)

You can also test by sending a POST request:

```bash
# Test push notification to specific user
curl -X POST http://localhost:5000/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "your-email@example.com",
    "title": "🧪 Test Notification",
    "body": "This is a test push notification!",
    "icon": "/favicon.ico",
    "tag": "test"
  }'
```

## ✅ What to Expect

### When You Click "Initialize Push":
1. Browser will show a permission popup: **"Allow" or "Block"**
2. Click **"Allow"**
3. You should see: `✅ Push notifications initialized!` toast
4. Check browser console for: `Push notifications initialized successfully`

### When You Click "Test Local Notification":
- A notification appears immediately
- Shows title: "🧪 Test Notification"
- Shows body: "This is a test notification from localhost!"
- Works even if tab is in background

### When You Click "Test Push Notification":
- Notification appears from the server
- Works even if browser tab is closed
- Works even if app is minimized

## 🔍 Troubleshooting

### Permission Denied?
- **Solution**: Go to browser settings → Site Settings → Notifications
- Find your localhost site and set it to "Allow"
- Refresh the page and try again

### Service Worker Not Registering?
1. Open DevTools (F12)
2. Go to **Application** tab → **Service Workers**
3. Check if service worker is registered
4. If not, check console for errors
5. Make sure `service-worker.js` is in `frontend/public/` folder

### Notifications Not Showing?
1. Check browser console for errors
2. Verify VAPID keys are in `.env` file
3. Make sure backend server is running
4. Check if permission is "granted" in the test component

### "VAPID key not loaded" Error?
- Make sure backend is running
- Check `http://localhost:5000/api/push/vapid-key` returns the public key
- Verify VAPID keys are in backend `.env` file

### "User subscription not found" Error?
- Click "Initialize Push" first to create subscription
- Make sure you're logged in with the same email

## 🎯 Testing Real Notifications

After initializing, push notifications will automatically work when:
- ✅ New orders are placed
- ✅ Order status changes (Pending → Cooking → Ready → Served → Completed)

To test real notifications:
1. Place an order (as a user)
2. Change order status (as admin)
3. You should receive push notifications automatically!

## 📱 Browser Requirements

- ✅ **Chrome/Edge**: Full support (Desktop & Mobile)
- ✅ **Firefox**: Full support (Desktop & Mobile)
- ✅ **Safari**: iOS 16.4+ and macOS
- ❌ **Internet Explorer**: Not supported

## 💡 Tips

1. **Test with Tab Closed**: After initializing, close the browser tab and send a test notification - it should still appear!
2. **Check Service Worker**: Open DevTools → Application → Service Workers to see if it's active
3. **Check Subscriptions**: Open DevTools → Application → Storage → IndexedDB to see stored subscriptions
4. **Multiple Browsers**: Test in different browsers - each needs its own subscription

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Permission is "granted"
- ✅ Service worker is registered
- ✅ Test notifications appear
- ✅ Notifications work with tab closed
- ✅ Real order notifications work automatically

Happy testing! 🚀

