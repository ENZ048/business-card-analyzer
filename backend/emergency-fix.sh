#!/bin/bash

# EMERGENCY FIX - Most direct approach
# Run with: sudo bash emergency-fix.sh

echo "🚨 EMERGENCY FIX - Applying changes directly"
echo "============================================"
echo ""

# Fix 1: Update nginx.conf FIRST (global setting)
echo "1️⃣ Updating /etc/nginx/nginx.conf..."
if ! grep -q "client_max_body_size 350M" /etc/nginx/nginx.conf; then
    # Add to http block if not exists
    sudo sed -i '/http {/a \    client_max_body_size 350M;' /etc/nginx/nginx.conf
    echo "   ✅ Added client_max_body_size 350M to nginx.conf"
else
    echo "   ✅ Already present in nginx.conf"
fi
echo ""

# Fix 2: Completely replace site config
echo "2️⃣ Updating site configuration..."
sudo tee /etc/nginx/sites-available/api.superscanai.com > /dev/null << 'ENDCONFIG'
server {
    server_name api.superscanai.com;

    client_max_body_size 350M;
    client_body_timeout 1800s;
    client_header_timeout 1800s;
    proxy_connect_timeout 1800s;
    proxy_send_timeout 1800s;
    proxy_read_timeout 1800s;
    send_timeout 1800s;
    keepalive_timeout 1810s;

    client_body_buffer_size 256k;
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;

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
ENDCONFIG

echo "   ✅ Site config updated"
echo ""

# Fix 3: Test config
echo "3️⃣ Testing nginx configuration..."
if sudo nginx -t; then
    echo ""
    echo "   ✅ Config is valid"
    echo ""

    # Fix 4: Reload nginx (NOT restart - keeps connections alive)
    echo "4️⃣ Reloading nginx..."
    sudo systemctl reload nginx
    echo "   ✅ Nginx reloaded"
    echo ""

    # Fix 5: Show what's active
    echo "5️⃣ Verifying active configuration..."
    echo "   Looking for client_max_body_size in active config:"
    sudo nginx -T 2>/dev/null | grep -i "client_max_body_size" | head -5
    echo ""

    echo "6️⃣ Checking if backend is running..."
    if pm2 list | grep -q "online"; then
        echo "   ✅ Backend is running"
    else
        echo "   ⚠️  Backend might not be running"
        echo "   Run: cd /path/to/backend && pm2 start ecosystem.config.js"
    fi
    echo ""

    echo "✅ EMERGENCY FIX COMPLETE!"
    echo ""
    echo "📝 NEXT STEPS:"
    echo "   1. Clear browser cache (CTRL+SHIFT+DELETE)"
    echo "   2. Close and reopen browser"
    echo "   3. Go to https://login.superscanai.com"
    echo "   4. Try uploading again"
    echo ""
    echo "   If still getting 413:"
    echo "   → Run: sudo systemctl restart nginx"
    echo "   → Run: pm2 restart all"
    echo ""
else
    echo ""
    echo "   ❌ Config test FAILED"
    echo "   Check the error above"
    exit 1
fi
