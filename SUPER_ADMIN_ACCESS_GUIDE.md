# 🎯 How to Access Super Admin Dashboard

## Prerequisites
1. Make sure your backend server is running
2. Make sure MongoDB is connected
3. Make sure your frontend is running

## Step-by-Step Instructions

### Step 1: Initialize Super Admin (One-Time Setup)

Open your terminal and run:

```bash
cd backend
npm run init:superadmin
```

**Expected Output:**
```
🔄 Connecting to database...
✅ Database connected
✅ Super admin created successfully: roshansharma7250@gmail.com
🎉 You can now use this email to manage other admins!
```

### Step 2: Start Your Servers

**Backend:**
```bash
cd backend
npm run dev
# or
npm start
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Step 3: Access the Login Page

1. Open your browser
2. Go to: `http://localhost:5173/login` (or your frontend URL)

### Step 4: Login with Super Admin Email

**Option A: Email/Password Login**
1. Enter email: `roshansharma7250@gmail.com`
2. Enter your Firebase password
3. Click "Log In"

**Option B: Google Sign-In**
1. Click "Continue with Google"
2. Select the Google account: `roshansharma7250@gmail.com`

### Step 5: Access Admin Dashboard

After successful login, you will be automatically redirected to:
- **Admin Dashboard**: `http://localhost:5173/admin`

Or manually navigate to: `/admin`

### Step 6: Access Admin Management

Once in the admin dashboard:
1. Look for the **"👥 Admins"** tab at the top
2. Click on it to access the Admin Management panel
3. Here you can:
   - View all current admins
   - Add new admins by email
   - Remove admins (except super admin)

## Troubleshooting

### Issue: "Access denied! Admins only."
**Solution:** Make sure you ran `npm run init:superadmin` first

### Issue: "Failed to verify admin status"
**Solution:** 
1. Check if backend server is running
2. Check if MongoDB is connected
3. Verify the email matches exactly: `roshansharma7250@gmail.com`

### Issue: "👥 Admins" tab not showing
**Solution:**
1. Make sure you're logged in as `roshansharma7250@gmail.com`
2. Refresh the page
3. Check browser console for errors

### Issue: Can't initialize super admin
**Solution:**
1. Check MongoDB connection string in `.env`
2. Make sure MongoDB is running
3. Check if Admin model exists in database

## Quick Access URLs

- **Login Page**: `http://localhost:5173/login`
- **Admin Dashboard**: `http://localhost:5173/admin`
- **Admin Management**: `http://localhost:5173/admin` → Click "👥 Admins" tab

## Admin Dashboard Features

Once logged in as super admin, you have access to:

1. **🧾 Orders** - View and manage all orders
2. **📜 History** - View order history
3. **🍽️ Food List** - Manage food items
4. **➕ Add Food** - Add new food items
5. **💰 Total Sales** - View sales statistics
6. **👥 Admins** - Manage other admins (Super Admin Only)

## Security Notes

- Super admin email: `roshansharma7250@gmail.com` (case-insensitive)
- Super admin cannot be removed
- Only super admin can add/remove other admins
- Admin status is verified via API on each access

