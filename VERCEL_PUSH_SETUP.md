# Web Push Notifications - Vercel Deployment Guide

## 🎯 Overview
This guide will help you set up Web Push notifications on Vercel deployment.

## 📋 Prerequisites
- Vercel account with deployed project
- Access to Vercel project settings
- Email address for VAPID subject

---

## 🔑 Step 1: Generate VAPID Keys

VAPID keys are required for Web Push API. Generate them once and use for all deployments.

### Option A: Using the Script (Recommended)

```bash
# Navigate to backend directory
cd backend

# Generate keys
node scripts/generateVapidKeys.js
```

The script will output:
```
✅ VAPID Keys Generated:

Public Key: BPx...xyz
Private Key: abc...123

📝 Add these to your .env file:

VAPID_PUBLIC_KEY=BPx...xyz
VAPID_PRIVATE_KEY=abc...123
VAPID_SUBJECT=mailto:your-email@example.com
```

### Option B: Generate Manually

```bash
# Install web-push globally
npm install -g web-push

# Generate keys
web-push generate-vapid-keys
```

**⚠️ IMPORTANT**: Save these keys securely! You'll need them for Vercel.

---

## ☁️ Step 2: Configure Vercel Environment Variables

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Click **Settings** tab
   - Select **Environment Variables**

2. **Add Three Variables**

   | Variable Name | Value | Note |
   |--------------|-------|------|
   | `VAPID_PUBLIC_KEY` | Your public key | From Step 1 |
   | `VAPID_PRIVATE_KEY` | Your private key | From Step 1 |
   | `VAPID_SUBJECT` | `mailto:your-email@example.com` | Use your real email |

3. **Save and Redeploy**
   - Click **Save**
   - Go to **Deployments** tab
   - Click **Redeploy** on latest deployment

---

## ✅ Step 3: Verify Deployment

### Test Backend API

```bash
# Replace with your Vercel URL
curl https://your-app.vercel.app/api/push/vapid-key
```

**Expected Response:**
```json
{
  "publicKey": "BPx...xyz"
}
```

### Test Frontend

1. **Open Your Deployed App**
   ```
   https://your-app.vercel.app
   ```

2. **Check Browser Console**
   - Open DevTools (F12)
   - Look for: `✅ Service worker registered`

3. **Allow Notifications**
   - Browser will prompt for permission
   - Click **Allow**

4. **Place Test Order**
   - Add items to cart
   - Complete checkout
   - Check for notification

---

## 🔧 Troubleshooting

### Issue: "VAPID keys not configured"

**Solution:**
- Verify environment variables are set in Vercel
- Redeploy after adding variables
- Check Vercel function logs

### Issue: Service worker not registering

**Solution:**
- Web Push requires HTTPS (Vercel provides this)
- Clear browser cache
- Check browser console for errors

### Issue: Notifications not received

**Solution:**
1. Check notification permission in browser settings
2. Verify VAPID public key matches between frontend and backend
3. Check Vercel function logs for push errors
4. Test with: `await Notification.requestPermission()`

### Issue: "Subscription expired" error

**Solution:**
- This is normal - subscriptions expire over time
- The system automatically removes expired subscriptions
- User needs to re-subscribe (refresh page)

---

## 📊 Monitoring

### Check Vercel Logs

1. Go to Vercel Dashboard
2. Select **Functions** tab
3. Look for push notification logs:
   ```
   ✅ Push notification sent to: user@example.com
   🗑️ Removed invalid subscription for: user@example.com
   ```

### Test Endpoints

```bash
# Check subscription count (you need to add admin endpoint)
curl https://your-app.vercel.app/api/push/subscriptions

# Send test notification
curl -X POST https://your-app.vercel.app/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "title": "Test Notification",
    "body": "This is a test"
  }'
```

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ `/api/push/vapid-key` returns your public key
- ✅ Service worker registers on app load
- ✅ Browser prompts for notification permission
- ✅ Notifications appear when order status changes
- ✅ Clicking notification opens the app
- ✅ No errors in Vercel function logs

---

## 📱 User Experience

### First Visit
1. User opens app
2. Service worker registers (background)
3. Permission prompt appears
4. User clicks "Allow"
5. Subscription saved to database

### Order Flow
1. User places order
2. Push notification: "📦 Order Placed!"
3. Admin updates status to "Cooking"
4. Push notification: "👨‍🍳 Your order is being cooked"
5. Status updates continue...

### Notification Actions
- Click notification → Opens app
- Close notification → Dismissed
- Permission denied → No notifications (app still works)

---

## 🔒 Security Notes

- **VAPID Private Key**: Never expose in frontend code
- **Environment Variables**: Only accessible on server-side
- **HTTPS Required**: Web Push API requires secure origin
- **User Consent**: Always ask for permission before subscribing

---

## 📚 Additional Resources

- [Web Push API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker Guide](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 🆘 Need Help?

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test on localhost first
4. Clear browser cache and retry
5. Check browser compatibility
