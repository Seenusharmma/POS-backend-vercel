# Web Push Notification Debugging Checklist

## 🔍 Step-by-Step Debugging

Please follow these steps **in order** and tell me what you see:

### Step 1: Check Browser Console (CRITICAL)

1. **Open Browser DevTools**
   - Press `F12` or right-click → Inspect
   - Go to **Console** tab

2. **Look for these messages** after logging in:
   ```
   [Push] Initializing push notifications for: your@email.com
   [Push] VAPID public key received
   Registering service worker...
   Service Worker: Installing...
   Service Worker: Activated and ready
   ✅ Push notifications enabled successfully
   ```

3. **Check for ERRORS** (red text):
   - Screenshot any errors you see
   - Tell me what the error message says

### Step 2: Check Notification Permission

**In the browser console, type:**
```javascript
Notification.permission
```

**Expected result:** `"granted"`

**If you see:**
- `"default"` - Permission not requested yet
- `"denied"` - You blocked notifications (need to reset in browser settings)

### Step 3: Check Service Worker

1. In DevTools, go to **Application** tab
2. Click **Service Workers** in left sidebar
3. **Should see:** `service-worker.js` with status "activated"

**Screenshot this and show me!**

### Step 4: Check VAPID Key

**In browser console, type:**
```javascript
fetch('http://localhost:8000/api/push/vapid-key')
  .then(r => r.json())
  .then(d => console.log(d))
```

**Expected:** `{publicKey: "BFsf..."}`

### Step 5: Manual Test Notification

**In browser console, type:**
```javascript
new Notification('Test', {body: 'Manual test notification'})
```

**What happened?**
- ✅ Notification appeared - Browser notifications work!
- ❌ Nothing happened - Permission issue or browser settings
- ❌ Error message - Tell me the error

---

## 🚨 Common Issues & Quick Fixes

### Issue: No console messages at all

**Fix:** PushNotificationManager might not be running
- Verify you're logged in
- Check if `<PushNotificationManager />` is in App.jsx (line 29)

### Issue: "Permission denied" or "default"

**Fix:** Browser hasn't asked for permission yet
- Refresh the page
- Or manually grant: Browser settings → Site settings → Notifications → Allow

### Issue: Service worker not showing

**Fix:** Service worker failed to register
- Check for errors in console
- Verify `service-worker.js` exists in `frontend/public/`

### Issue: VAPID key returns error

**Fix:** Backend VAPID keys not configured
- Check backend console for VAPID key warnings
- Run: `node backend/scripts/generateVapidKeys.js`

---

## 📊 What I Need From You

Please tell me:

1. ✅ **What you see in the console** (copy/paste the messages)
2. ✅ **What `Notification.permission` returns**
3. ✅ **Service Worker status** (screenshot if possible)
4. ✅ **Result of manual test notification**
5. ✅ **Any red error messages**

This will help me identify the exact problem!
