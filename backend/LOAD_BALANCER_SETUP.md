# ⚡ Load Balancer Setup Guide

This guide explains how to set up load balancing for the Food Fantasy backend API using multiple methods.

## 📋 Table of Contents

1. [Node.js Cluster Module](#nodejs-cluster-module)
2. [PM2 Process Manager](#pm2-process-manager)
3. [Nginx Reverse Proxy](#nginx-reverse-proxy)
4. [Comparison & Recommendations](#comparison--recommendations)

---

## 🚀 Node.js Cluster Module

The built-in Node.js cluster module creates multiple worker processes that share the same port.

### Features
- ✅ Uses all CPU cores automatically
- ✅ Zero external dependencies
- ✅ Built into Node.js
- ✅ Automatic worker restart on failure
- ✅ Health monitoring

### Setup

1. **Install dependencies** (already installed, cluster is built-in)

2. **Start with cluster mode:**
   ```bash
   node cluster.js
   ```

3. **Or update package.json script:**
   ```json
   {
     "scripts": {
       "start": "node cluster.js",
       "start:single": "node server.js"
     }
   }
   ```

4. **Configure worker count:**
   ```bash
   # Default: Uses 2-4 workers (auto-detected)
   WORKER_COUNT=4 node cluster.js
   ```

### Environment Variables

- `WORKER_COUNT` - Number of worker processes (default: auto-detected, 2-4 workers)
- `PORT` - Server port (default: 8000)

---

## 🔧 PM2 Process Manager

PM2 is a production-grade process manager with advanced features.

### Features
- ✅ Process monitoring and auto-restart
- ✅ Built-in load balancing
- ✅ Logging and log rotation
- ✅ Web dashboard
- ✅ Zero-downtime deployments
- ✅ Memory limit monitoring

### Setup

1. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

2. **Create logs directory:**
   ```bash
   mkdir -p logs
   ```

3. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.cjs
   ```

4. **Useful PM2 commands:**
   ```bash
   # View running processes
   pm2 list
   
   # View logs
   pm2 logs
   
   # Monitor resources
   pm2 monit
   
   # Restart all
   pm2 restart all
   
   # Stop all
   pm2 stop all
   
   # Save current process list
   pm2 save
   
   # Setup startup script (auto-start on server reboot)
   pm2 startup
   pm2 save
   ```

5. **View web dashboard:**
   ```bash
   pm2 web
   # Opens http://localhost:9615
   ```

### Configuration

Edit `ecosystem.config.cjs` to customize:
- `instances`: Number of processes ('max' for all CPUs, or specific number)
- `max_memory_restart`: Auto-restart if memory exceeds limit
- `watch`: Enable file watching (disable in production)

---

## 🌐 Nginx Reverse Proxy

Nginx acts as a reverse proxy and load balancer in front of Node.js instances.

### Features
- ✅ SSL/TLS termination
- ✅ Rate limiting
- ✅ Compression
- ✅ Static file serving
- ✅ Advanced load balancing algorithms

### Setup

1. **Install Nginx:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install nginx
   
   # CentOS/RHEL
   sudo yum install nginx
   ```

2. **Copy configuration:**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/food-fantasy-backend
   sudo ln -s /etc/nginx/sites-available/food-fantasy-backend /etc/nginx/sites-enabled/
   ```

3. **Test configuration:**
   ```bash
   sudo nginx -t
   ```

4. **Start/restart Nginx:**
   ```bash
   sudo systemctl start nginx
   sudo systemctl restart nginx
   ```

5. **Enable auto-start:**
   ```bash
   sudo systemctl enable nginx
   ```

### Configuration Details

The `nginx.conf` file includes:
- **Load balancing** across multiple backend instances
- **Health checks** (automatic removal of failed servers)
- **Rate limiting** (10 req/s for API, 5 req/s for WebSocket)
- **WebSocket support** for Socket.IO
- **Compression** (gzip)
- **Security headers**

### Multiple Backend Instances

To run multiple Node.js instances on different ports:

**Option 1: Using PM2**
```bash
pm2 start ecosystem.config.cjs --instances 4
# PM2 handles port management automatically
```

**Option 2: Using Cluster Module**
```bash
node cluster.js
# Cluster module handles port sharing automatically
```

**Option 3: Manual (for testing)**
```bash
PORT=8000 node server.js &
PORT=8001 node server.js &
PORT=8002 node server.js &
PORT=8003 node server.js &
```

---

## 📊 Comparison & Recommendations

| Feature | Cluster Module | PM2 | Nginx |
|---------|---------------|-----|-------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **CPU Utilization** | ✅ Excellent | ✅ Excellent | N/A |
| **Auto-restart** | ✅ Basic | ✅ Advanced | ❌ No |
| **Logging** | ❌ Basic | ✅ Advanced | ✅ Advanced |
| **Monitoring** | ❌ Basic | ✅ Excellent | ⚠️ Basic |
| **Production Ready** | ⚠️ Good | ✅ Excellent | ✅ Excellent |
| **Dependencies** | ✅ None | ⚠️ External | ⚠️ External |

### Recommendations

**For Development:**
- Use **Cluster Module** (`node cluster.js`) - Simple and works out of the box

**For Production:**
- **Best Option**: **PM2** + **Nginx**
  - PM2 for process management and load balancing
  - Nginx for reverse proxy, SSL, and additional features
- **Alternative**: **Cluster Module** + **Nginx**
  - Simpler setup, but less monitoring features

**For High Traffic:**
- Use **PM2** with multiple instances
- Add **Nginx** as reverse proxy
- Consider **Redis** for Socket.IO session storage (multi-server)

---

## 🔒 Security Considerations

1. **Rate Limiting**: Already configured in Nginx (10 req/s API, 5 req/s WebSocket)
2. **SSL/TLS**: Configure SSL certificates in Nginx (see commented section in nginx.conf)
3. **Firewall**: Only expose port 80/443 (Nginx), not backend ports (8000-8003)
4. **Health Checks**: Automatic removal of unhealthy instances

---

## 🧪 Testing Load Balancer

### Test Multiple Workers

```bash
# Start cluster
node cluster.js

# In another terminal, test load distribution
for i in {1..100}; do
  curl http://localhost:8000/
done
```

### Test with PM2

```bash
# Start with 4 instances
pm2 start ecosystem.config.cjs --instances 4

# Monitor
pm2 monit

# Check logs
pm2 logs
```

### Test with Nginx

```bash
# Start multiple backend instances
node cluster.js  # or PM2

# Test through Nginx
curl http://localhost/health
curl http://localhost/api/foods
```

---

## 📈 Performance Metrics

Expected improvements with load balancing:

- **Throughput**: 2-4x increase (depending on CPU cores)
- **Response Time**: Reduced by 30-50% under load
- **Uptime**: 99.9%+ (automatic restart on failures)
- **Concurrent Users**: 2-4x more supported

---

## 🐛 Troubleshooting

### Workers not starting
- Check if port is already in use: `lsof -i :8000`
- Check logs for errors
- Verify MongoDB connection

### Nginx 502 Bad Gateway
- Check if backend instances are running
- Verify backend ports in nginx.conf match running instances
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### High Memory Usage
- Reduce `WORKER_COUNT` or PM2 instances
- Set `max_memory_restart` in PM2 config
- Monitor with `pm2 monit`

---

## 📝 Environment Variables

Add to `.env` file:

```env
# Load Balancer Configuration
WORKER_COUNT=4          # Number of worker processes (Cluster mode)
PORT=8000               # Base port (Cluster handles port sharing)
NODE_ENV=production     # Environment

# MongoDB (same as before)
MONGODB_URI=your_connection_string

# Cloudinary (same as before)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🚀 Quick Start (Production)

**Recommended Setup:**

```bash
# 1. Install PM2
npm install -g pm2

# 2. Start backend with PM2
pm2 start ecosystem.config.cjs

# 3. Setup Nginx (if using)
sudo cp nginx.conf /etc/nginx/sites-available/food-fantasy-backend
sudo ln -s /etc/nginx/sites-available/food-fantasy-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 4. Save PM2 configuration
pm2 save
pm2 startup  # Auto-start on server reboot
```

Your backend is now load-balanced and production-ready! 🎉

