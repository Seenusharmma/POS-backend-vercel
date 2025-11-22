#!/bin/bash
# Nginx Setup Script for Food Fantasy Backend
# This script helps set up Nginx as a reverse proxy for the backend

set -e

echo "🍽️ Food Fantasy Backend - Nginx Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}⚠️  Nginx is not installed. Installing...${NC}"
    
    # Detect OS and install Nginx
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        apt-get update
        apt-get install -y nginx
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        yum install -y nginx
    else
        echo -e "${RED}❌ Unsupported OS. Please install Nginx manually.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Nginx installed${NC}"
else
    echo -e "${GREEN}✅ Nginx is already installed${NC}"
fi

# Create directories if they don't exist
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled
mkdir -p /var/log/nginx
mkdir -p /etc/nginx/ssl

# Copy configuration file
echo "📝 Copying Nginx configuration..."
cp nginx.conf /etc/nginx/sites-available/foodfantasy-backend.conf

# Create symlink to enable site
if [ -L /etc/nginx/sites-enabled/foodfantasy-backend.conf ]; then
    echo -e "${YELLOW}⚠️  Configuration already enabled${NC}"
else
    ln -s /etc/nginx/sites-available/foodfantasy-backend.conf /etc/nginx/sites-enabled/
    echo -e "${GREEN}✅ Configuration enabled${NC}"
fi

# Remove default Nginx site if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
    echo -e "${GREEN}✅ Removed default Nginx site${NC}"
fi

# Test Nginx configuration
echo "🔍 Testing Nginx configuration..."
if nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    exit 1
fi

# Create systemd service file for backend (if not exists)
if [ ! -f /etc/systemd/system/foodfantasy-backend.service ]; then
    echo "📝 Creating systemd service file..."
    cat > /etc/systemd/system/foodfantasy-backend.service << EOF
[Unit]
Description=Food Fantasy Backend API Server
After=network.target mongod.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
Environment=PORT=8000
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=foodfantasy-backend

[Install]
WantedBy=multi-user.target
EOF
    echo -e "${GREEN}✅ Systemd service file created${NC}"
fi

# Reload systemd
systemctl daemon-reload

# Enable and start backend service
echo "🚀 Setting up backend service..."
systemctl enable foodfantasy-backend.service
systemctl restart foodfantasy-backend.service
echo -e "${GREEN}✅ Backend service enabled and started${NC}"

# Restart Nginx
echo "🔄 Restarting Nginx..."
systemctl restart nginx
echo -e "${GREEN}✅ Nginx restarted${NC}"

# Enable Nginx to start on boot
systemctl enable nginx

# Display status
echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "📊 Status:"
echo "  - Nginx: $(systemctl is-active nginx)"
echo "  - Backend: $(systemctl is-active foodfantasy-backend.service)"
echo ""
echo "🔍 Useful Commands:"
echo "  - Check Nginx status: sudo systemctl status nginx"
echo "  - Check Backend status: sudo systemctl status foodfantasy-backend"
echo "  - View Nginx logs: sudo tail -f /var/log/nginx/foodfantasy_backend_error.log"
echo "  - View Backend logs: sudo journalctl -u foodfantasy-backend -f"
echo "  - Reload Nginx: sudo systemctl reload nginx"
echo ""
echo "🌐 Your API is now available at:"
echo "  - http://localhost"
echo "  - http://api.foodfantasy.com (if DNS is configured)"
echo ""

