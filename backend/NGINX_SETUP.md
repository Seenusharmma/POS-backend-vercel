# Nginx Configuration for Food Fantasy Backend

This directory contains Nginx configuration files to set up a reverse proxy for the Food Fantasy backend API server.

## 📋 What's Included

- **`nginx.conf`** - Main Nginx configuration file
- **`nginx-setup.sh`** - Automated setup script
- **`NGINX_SETUP.md`** - This documentation file

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)

```bash
cd backend
sudo chmod +x nginx-setup.sh
sudo ./nginx-setup.sh
```

This script will:
- Install Nginx (if not already installed)
- Copy configuration files
- Set up systemd service for the backend
- Enable and start services
- Configure automatic startup on boot

### Option 2: Manual Setup

1. **Install Nginx** (if not installed):
   ```bash
   # Ubuntu/Debian
   sudo apt-get update && sudo apt-get install -y nginx
   
   # CentOS/RHEL
   sudo yum install -y nginx
   ```

2. **Copy configuration file**:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/foodfantasy-backend.conf
   ```

3. **Enable the site**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/foodfantasy-backend.conf /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default  # Remove default site
   ```

4. **Test configuration**:
   ```bash
   sudo nginx -t
   ```

5. **Start/Restart Nginx**:
   ```bash
   sudo systemctl restart nginx
   sudo systemctl enable nginx
   ```

## ⚙️ Configuration Details

### Backend Server
- **Port**: 8000 (default)
- **Location**: `127.0.0.1:8000`
- **Protocol**: HTTP

### Features Included

✅ **Reverse Proxy** - Routes requests to Node.js backend  
✅ **WebSocket Support** - Full Socket.IO WebSocket support  
✅ **Rate Limiting** - Protects against DDoS (10 req/s for API, 5 req/s for WebSocket)  
✅ **Gzip Compression** - Reduces response size by 70-90%  
✅ **Security Headers** - XSS protection, frame options, etc.  
✅ **SSL/HTTPS Ready** - Template for SSL configuration  
✅ **Load Balancing Ready** - Can handle multiple backend instances  
✅ **Health Check Endpoint** - `/health` endpoint  

### Ports

- **HTTP**: Port 80
- **HTTPS**: Port 443 (configure SSL certificates)
- **Backend**: Port 8000 (internal, not exposed)

## 🔒 SSL/HTTPS Setup

To enable HTTPS:

1. **Get SSL certificates** (using Let's Encrypt):
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.foodfantasy.com
   ```

2. **Or use your own certificates**:
   - Place certificates in `/etc/nginx/ssl/`
   - Uncomment and configure the HTTPS server block in `nginx.conf`

3. **Uncomment HTTPS section** in `nginx.conf`:
   ```nginx
   server {
       listen 443 ssl http2;
       # ... SSL configuration
   }
   ```

## 🔧 Customization

### Change Backend Port

If your backend runs on a different port, edit `nginx.conf`:

```nginx
upstream backend_server {
    server 127.0.0.1:YOUR_PORT;  # Change 8000 to your port
}
```

### Adjust Rate Limits

Edit the rate limit zones in `nginx.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;  # Change rate here
```

### Add Multiple Backend Servers (Load Balancing)

Uncomment and add more servers in the upstream block:

```nginx
upstream backend_server {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
}
```

## 📊 Monitoring

### View Logs

```bash
# Nginx access logs
sudo tail -f /var/log/nginx/foodfantasy_backend_access.log

# Nginx error logs
sudo tail -f /var/log/nginx/foodfantasy_backend_error.log

# Backend service logs
sudo journalctl -u foodfantasy-backend -f
```

### Check Status

```bash
# Nginx status
sudo systemctl status nginx

# Backend status
sudo systemctl status foodfantasy-backend
```

## 🐛 Troubleshooting

### Nginx won't start

```bash
# Check configuration syntax
sudo nginx -t

# Check for port conflicts
sudo netstat -tulpn | grep :80
```

### Backend not receiving requests

1. **Check backend is running**:
   ```bash
   curl http://127.0.0.1:8000
   ```

2. **Check Nginx can reach backend**:
   ```bash
   sudo tail -f /var/log/nginx/foodfantasy_backend_error.log
   ```

3. **Test WebSocket connection**:
   ```bash
   curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost/socket.io/
   ```

### WebSocket connections fail

1. Ensure `proxy_set_header Upgrade` and `Connection` headers are set
2. Check firewall allows WebSocket connections
3. Verify Socket.IO path is `/socket.io/`

### 502 Bad Gateway

- Backend server is not running
- Backend is on wrong port
- Firewall blocking connection between Nginx and backend

```bash
# Check if backend is running
sudo systemctl status foodfantasy-backend

# Check backend logs
sudo journalctl -u foodfantasy-backend -n 50
```

## 🌐 Domain Configuration

### DNS Setup

Point your domain to your server's IP address:

```
A Record: api.foodfantasy.com -> YOUR_SERVER_IP
```

### Update Nginx Configuration

Replace `api.foodfantasy.com` in `nginx.conf` with your actual domain name.

## 🔄 Reloading Configuration

After making changes:

```bash
# Test configuration
sudo nginx -t

# Reload (zero downtime)
sudo systemctl reload nginx

# Or restart
sudo systemctl restart nginx
```

## 📝 Production Checklist

- [ ] SSL certificates installed and configured
- [ ] HTTPS redirect enabled
- [ ] Rate limiting configured appropriately
- [ ] Log rotation configured
- [ ] Firewall configured (allow ports 80, 443)
- [ ] Backend service configured to auto-start
- [ ] Monitoring set up (logs, alerts)
- [ ] Backup strategy in place

## 🆘 Support

If you encounter issues:

1. Check logs: `/var/log/nginx/foodfantasy_backend_error.log`
2. Verify backend is running: `systemctl status foodfantasy-backend`
3. Test Nginx config: `nginx -t`
4. Check port availability: `netstat -tulpn | grep -E ':(80|443|8000)'`

## 📚 Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Socket.IO with Nginx](https://socket.io/docs/v4/reverse-proxy/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

