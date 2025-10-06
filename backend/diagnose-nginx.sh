#!/bin/bash

# Diagnostic script to check nginx configuration
# Run with: sudo bash diagnose-nginx.sh

echo "🔍 Diagnosing Nginx Configuration for api.superscanai.com"
echo "=================================================="
echo ""

echo "1️⃣ Checking if nginx is running..."
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is running"
else
    echo "   ❌ Nginx is NOT running"
    echo "   Run: sudo systemctl start nginx"
fi
echo ""

echo "2️⃣ Checking current configuration file..."
if [ -f /etc/nginx/sites-available/api.superscanai.com ]; then
    echo "   ✅ Config file exists"
    echo ""
    echo "   Current settings:"
    echo "   -----------------"
    grep -i "client_max_body_size" /etc/nginx/sites-available/api.superscanai.com || echo "   ❌ client_max_body_size NOT FOUND"
    grep -i "proxy_read_timeout" /etc/nginx/sites-available/api.superscanai.com || echo "   ⚠️  proxy_read_timeout NOT FOUND"
    grep -i "Access-Control" /etc/nginx/sites-available/api.superscanai.com && echo "   ⚠️  CORS headers found (should be removed)" || echo "   ✅ No CORS headers (correct)"
else
    echo "   ❌ Config file NOT FOUND"
fi
echo ""

echo "3️⃣ Checking active nginx configuration..."
sudo nginx -T 2>/dev/null | grep -A 20 "server_name api.superscanai.com" | grep "client_max_body_size" || echo "   ❌ client_max_body_size NOT in active config"
echo ""

echo "4️⃣ Testing nginx configuration syntax..."
sudo nginx -t
echo ""

echo "5️⃣ Checking for config backups..."
ls -lh /etc/nginx/sites-available/api.superscanai.com.backup.* 2>/dev/null | tail -3 || echo "   No backups found"
echo ""

echo "6️⃣ Recommended actions:"
echo "   -----------------"
echo "   If client_max_body_size is NOT 350M:"
echo "   → Run: sudo bash fix-nginx-cors.sh"
echo ""
echo "   If CORS headers are present in nginx:"
echo "   → They will cause duplicate headers"
echo "   → Run: sudo bash fix-nginx-cors.sh"
echo ""
echo "   After any changes:"
echo "   → Test: sudo nginx -t"
echo "   → Reload: sudo systemctl reload nginx"
echo ""
echo "=================================================="
