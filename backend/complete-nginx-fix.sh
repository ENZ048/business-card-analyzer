#!/bin/bash

# Complete nginx fix script
# Fixes both CORS and file size issues
# Run with: sudo bash complete-nginx-fix.sh

echo "🔧 Complete Nginx Fix for api.superscanai.com"
echo "=============================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root: sudo bash complete-nginx-fix.sh"
    exit 1
fi

# Backup current config
echo "📦 Creating backup..."
BACKUP_FILE="/etc/nginx/sites-available/api.superscanai.com.backup.$(date +%Y%m%d_%H%M%S)"
cp /etc/nginx/sites-available/api.superscanai.com "$BACKUP_FILE"
echo "   ✅ Backup created: $BACKUP_FILE"
echo ""

# Update the configuration
echo "📝 Updating nginx configuration..."
cat > /etc/nginx/sites-available/api.superscanai.com << 'EOF'
server {
    server_name api.superscanai.com;

    # CRITICAL: Increase body size and timeouts for large file uploads
    client_max_body_size 350M;
    client_body_timeout 1800s;
    client_header_timeout 1800s;
    proxy_connect_timeout 1800s;
    proxy_send_timeout 1800s;
    proxy_read_timeout 1800s;
    send_timeout 1800s;
    keepalive_timeout 1810s;

    # Buffer settings for large uploads
    client_body_buffer_size 256k;
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;

    location / {
        # Proxy to Node.js backend
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

echo "   ✅ Configuration updated"
echo ""

# Also check nginx.conf for global client_max_body_size
echo "🔍 Checking nginx.conf for global limits..."
if grep -q "client_max_body_size" /etc/nginx/nginx.conf; then
    echo "   ⚠️  Found client_max_body_size in nginx.conf"
    echo "   Current value:"
    grep "client_max_body_size" /etc/nginx/nginx.conf
    echo ""
    echo "   Updating nginx.conf to allow 350M globally..."
    sed -i 's/client_max_body_size.*$/client_max_body_size 350M;/' /etc/nginx/nginx.conf
    echo "   ✅ Updated nginx.conf"
else
    echo "   Adding client_max_body_size to nginx.conf http block..."
    sed -i '/http {/a \    client_max_body_size 350M;' /etc/nginx/nginx.conf
    echo "   ✅ Added to nginx.conf"
fi
echo ""

# Test configuration
echo "🧪 Testing nginx configuration..."
if nginx -t 2>&1 | tee /tmp/nginx-test.log; then
    echo ""
    echo "   ✅ Configuration is valid!"
    echo ""

    # Reload nginx
    echo "🔄 Reloading nginx..."
    systemctl reload nginx

    if [ $? -eq 0 ]; then
        echo "   ✅ Nginx reloaded successfully!"
        echo ""
        echo "📊 Verification:"
        echo "   --------------"
        nginx -T 2>/dev/null | grep -i "client_max_body_size" | head -3
        echo ""
        echo "🎉 SUCCESS! Configuration applied."
        echo ""
        echo "📝 Next steps:"
        echo "   1. Clear browser cache"
        echo "   2. Test file upload at https://login.superscanai.com"
        echo "   3. Upload should work up to 350MB total"
        echo ""
        echo "💾 Backup saved: $BACKUP_FILE"
    else
        echo "   ❌ Failed to reload nginx"
        echo "   Restoring backup..."
        cp "$BACKUP_FILE" /etc/nginx/sites-available/api.superscanai.com
        systemctl reload nginx
    fi
else
    echo ""
    echo "   ❌ Configuration test FAILED!"
    echo ""
    cat /tmp/nginx-test.log
    echo ""
    echo "   Restoring backup..."
    cp "$BACKUP_FILE" /etc/nginx/sites-available/api.superscanai.com
    echo "   Backup restored."
    echo ""
    echo "   Please check the error above and fix manually."
    exit 1
fi
