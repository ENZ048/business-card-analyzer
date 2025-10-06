#!/bin/bash

# Fix script to set 1000MB (1GB) upload limit
# Run with: sudo bash fix-1000mb.sh

echo "🚀 Setting 1000MB (1GB) Upload Limit"
echo "===================================="
echo ""

# Backup
BACKUP_FILE="/etc/nginx/sites-available/api.superscanai.com.backup.$(date +%Y%m%d_%H%M%S)"
sudo cp /etc/nginx/sites-available/api.superscanai.com "$BACKUP_FILE" 2>/dev/null
echo "✅ Backup created: $BACKUP_FILE"
echo ""

# Fix 1: Update nginx.conf
echo "1️⃣ Updating /etc/nginx/nginx.conf..."
if sudo grep -q "client_max_body_size" /etc/nginx/nginx.conf; then
    sudo sed -i 's/client_max_body_size.*$/client_max_body_size 1000M;/' /etc/nginx/nginx.conf
    echo "   ✅ Updated existing setting to 1000M"
else
    sudo sed -i '/http {/a \    client_max_body_size 1000M;' /etc/nginx/nginx.conf
    echo "   ✅ Added client_max_body_size 1000M"
fi
echo ""

# Fix 2: Update site config
echo "2️⃣ Updating site configuration..."
sudo tee /etc/nginx/sites-available/api.superscanai.com > /dev/null << 'EOF'
server {
    server_name api.superscanai.com;

    # 1GB upload limit
    client_max_body_size 1000M;
    client_body_timeout 1800s;
    client_header_timeout 1800s;
    proxy_connect_timeout 1800s;
    proxy_send_timeout 1800s;
    proxy_read_timeout 1800s;
    send_timeout 1800s;
    keepalive_timeout 1810s;

    # Larger buffers for 1GB uploads
    client_body_buffer_size 512k;
    proxy_buffer_size 256k;
    proxy_buffers 8 256k;
    proxy_busy_buffers_size 512k;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/api.superscanai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.superscanai.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = api.superscanai.com) {
        return 301 https://$host$request_uri;
    }
    listen 80;
    server_name api.superscanai.com;
    return 404;
}
EOF

echo "   ✅ Site config updated with 1000M limit"
echo ""

# Test
echo "3️⃣ Testing configuration..."
if sudo nginx -t; then
    echo ""
    echo "   ✅ Configuration valid"
    echo ""

    # Reload
    echo "4️⃣ Reloading nginx..."
    sudo systemctl reload nginx
    echo "   ✅ Nginx reloaded"
    echo ""

    # Verify
    echo "5️⃣ Verifying active settings..."
    sudo nginx -T 2>/dev/null | grep "client_max_body_size" | head -3
    echo ""

    echo "✅ SUCCESS! Upload limit now set to 1000MB (1GB)"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Restart your backend: pm2 restart all"
    echo "   2. Clear browser cache"
    echo "   3. Test upload at https://login.superscanai.com"
    echo ""
else
    echo ""
    echo "   ❌ Configuration test failed"
    echo "   Restoring backup..."
    sudo cp "$BACKUP_FILE" /etc/nginx/sites-available/api.superscanai.com
    exit 1
fi
