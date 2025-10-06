#!/bin/bash

# Debug script to find why 413 error persists
# Run with: bash debug-413.sh (no sudo needed)

echo "🔍 DEBUGGING 413 REQUEST ENTITY TOO LARGE"
echo "=========================================="
echo ""

echo "1️⃣ Checking if you're on the right server..."
echo "   Hostname: $(hostname)"
echo "   Current user: $(whoami)"
echo ""

echo "2️⃣ Finding ALL nginx configuration files..."
NGINX_CONFIGS=$(sudo find /etc/nginx -type f -name "*.conf" 2>/dev/null)
echo "$NGINX_CONFIGS"
echo ""

echo "3️⃣ Checking client_max_body_size in ALL nginx configs..."
echo "   ---------------------------------------------------"
for config in $NGINX_CONFIGS; do
    if sudo grep -q "client_max_body_size" "$config"; then
        echo "   📄 $config:"
        sudo grep "client_max_body_size" "$config"
    fi
done
echo ""

echo "4️⃣ Checking ACTIVE nginx configuration (what's actually running)..."
echo "   ----------------------------------------------------------------"
sudo nginx -T 2>/dev/null | grep -B 2 -A 2 "client_max_body_size" | head -20
echo ""

echo "5️⃣ Checking for api.superscanai.com configuration..."
if [ -f /etc/nginx/sites-available/api.superscanai.com ]; then
    echo "   ✅ Config file exists"
    echo ""
    echo "   Content preview:"
    echo "   ----------------"
    sudo head -30 /etc/nginx/sites-available/api.superscanai.com
else
    echo "   ❌ Config file NOT FOUND"
fi
echo ""

echo "6️⃣ Checking if config is enabled (symlink exists)..."
if [ -L /etc/nginx/sites-enabled/api.superscanai.com ]; then
    echo "   ✅ Symlink exists in sites-enabled"
else
    echo "   ❌ SYMLINK MISSING!"
    echo "   This is likely the problem!"
    echo "   Run: sudo ln -s /etc/nginx/sites-available/api.superscanai.com /etc/nginx/sites-enabled/"
fi
echo ""

echo "7️⃣ Checking nginx status..."
if sudo systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is RUNNING"
    echo "   Uptime: $(sudo systemctl status nginx | grep Active)"
else
    echo "   ❌ Nginx is NOT RUNNING"
    echo "   Run: sudo systemctl start nginx"
fi
echo ""

echo "8️⃣ Checking backend status..."
if command -v pm2 &> /dev/null; then
    pm2 list 2>/dev/null | head -5
else
    echo "   ⚠️  pm2 not found"
    echo "   Checking if node is running on port 5000..."
    sudo netstat -tlnp | grep 5000 || echo "   ❌ Nothing listening on port 5000"
fi
echo ""

echo "9️⃣ Checking nginx error log (last 10 lines)..."
echo "   ------------------------------------------"
sudo tail -10 /var/log/nginx/error.log 2>/dev/null || echo "   No errors logged recently"
echo ""

echo "🔟 Testing if nginx is actually listening on port 443..."
if sudo netstat -tlnp | grep -q ":443.*nginx"; then
    echo "   ✅ Nginx is listening on port 443"
else
    echo "   ❌ Nginx NOT listening on port 443"
    echo "   Check if another service is using the port"
    sudo netstat -tlnp | grep :443
fi
echo ""

echo "1️⃣1️⃣ Checking if there's a CDN or proxy in front..."
echo "   DNS resolution for api.superscanai.com:"
dig api.superscanai.com +short 2>/dev/null || nslookup api.superscanai.com 2>/dev/null | grep Address || echo "   DNS tools not available"
echo ""

echo "1️⃣2️⃣ Testing actual upload limit with curl..."
echo "   Creating 10MB test file..."
dd if=/dev/zero of=/tmp/test-upload.dat bs=1M count=10 2>/dev/null
echo "   Testing upload to server..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://api.superscanai.com/api/ocr/upload \
  -F "test=@/tmp/test-upload.dat" \
  -H "Origin: https://login.superscanai.com" 2>/dev/null)
echo "   HTTP Response Code: $RESPONSE"
if [ "$RESPONSE" = "413" ]; then
    echo "   ❌ CONFIRMED: Still getting 413 error"
    echo "   The nginx config changes are NOT active!"
elif [ "$RESPONSE" = "000" ]; then
    echo "   ⚠️  Connection failed - check if backend is running"
else
    echo "   ✅ No 413 error! (got $RESPONSE instead)"
    echo "   The upload limit is working, issue might be elsewhere"
fi
rm /tmp/test-upload.dat 2>/dev/null
echo ""

echo "=================================================="
echo "📊 DIAGNOSIS SUMMARY"
echo "=================================================="
echo ""

# Summary
if sudo nginx -T 2>/dev/null | grep -q "client_max_body_size 350M"; then
    echo "✅ client_max_body_size 350M is in active config"
else
    echo "❌ client_max_body_size 350M NOT in active config"
    echo "   → Need to update nginx config"
fi

if [ -L /etc/nginx/sites-enabled/api.superscanai.com ]; then
    echo "✅ Site config is enabled"
else
    echo "❌ Site config is NOT enabled (missing symlink)"
fi

if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
fi

echo ""
echo "📝 RECOMMENDED ACTIONS:"
echo "======================"

if ! sudo nginx -T 2>/dev/null | grep -q "client_max_body_size 350M"; then
    echo "1. Run: sudo bash emergency-fix.sh"
    echo "2. Run: sudo systemctl reload nginx"
fi

if [ ! -L /etc/nginx/sites-enabled/api.superscanai.com ]; then
    echo "3. Run: sudo ln -s /etc/nginx/sites-available/api.superscanai.com /etc/nginx/sites-enabled/"
    echo "4. Run: sudo systemctl reload nginx"
fi

echo ""
echo "After fixing, test again with:"
echo "   bash debug-413.sh"
echo ""
