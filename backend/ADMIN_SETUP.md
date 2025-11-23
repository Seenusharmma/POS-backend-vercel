# Admin Management System Setup

## Overview
This system allows a super admin (`roshansharma7250@gmail.com`) to manage other admin users. Regular admins can access the admin dashboard, but only the super admin can add/remove other admins.

## Initial Setup

### 1. Initialize Super Admin
Run the following command to create the super admin in the database:

```bash
npm run init:superadmin
```

This will:
- Create `roshansharma7250@gmail.com` as a super admin
- Set the `isSuperAdmin` flag to `true`
- Allow this email to manage other admins

### 2. Verify Setup
After running the script, you should see:
```
✅ Super admin created successfully: roshansharma7250@gmail.com
🎉 You can now use this email to manage other admins!
```

## How It Works

### Super Admin Features
- **Access Admin Dashboard**: Can view and manage orders, foods, etc.
- **Manage Admins**: Can add/remove other email addresses as admins
- **Protected**: Super admin cannot be removed

### Regular Admin Features
- **Access Admin Dashboard**: Can view and manage orders, foods, etc.
- **Cannot Manage Admins**: Cannot add/remove other admins

### User Features
- **Regular Access**: Can browse menu, place orders, etc.
- **No Admin Access**: Cannot access admin dashboard

## API Endpoints

### Check Admin Status
```
GET /api/admin/check?email=user@example.com
```

### Get All Admins (Super Admin Only)
```
GET /api/admin/all?requesterEmail=superadmin@example.com
```

### Add Admin (Super Admin Only)
```
POST /api/admin/add
Body: { email: "newadmin@example.com", requesterEmail: "superadmin@example.com" }
```

### Remove Admin (Super Admin Only)
```
DELETE /api/admin/remove
Body: { email: "admin@example.com", requesterEmail: "superadmin@example.com" }
```

## Frontend Usage

1. **Login** with `roshansharma7250@gmail.com`
2. **Navigate** to Admin Dashboard (`/admin`)
3. **Click** on the "👥 Admins" tab
4. **Add/Remove** admins as needed

## Security Notes

- Only super admins can manage other admins
- Super admin cannot be removed
- Admin status is checked via API on each admin route access
- Email addresses are normalized (lowercase, trimmed) before storage

