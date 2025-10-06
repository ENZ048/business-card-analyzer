# Fix Duplicate CORS Headers

## Problem
Error: "The 'Access-Control-Allow-Origin' header contains multiple values 'https://login.superscanai.com, https://login.superscanai.com', but only one is allowed"

## Root Cause
Both **nginx** and **Express backend** are adding CORS headers, causing duplicates.

## Solution
Remove CORS headers from nginx and let Express handle all CORS.

---

## Quick Fix

### Option 1: Run the Fix Script (Easiest)

1. **Upload script to server:**
   ```bash
   scp fix-nginx-cors.sh user@your-server:/home/user/
   ```

2. **SSH into server:**
   ```bash
   ssh user@your-server
   ```

3. **Run the fix:**
   ```bash
   sudo bash fix-nginx-cors.sh
   ```

4. **Done!** Test your application.

---

### Option 2: Manual Fix

1. **SSH into server:**
   ```bash
   ssh user@your-server
   ```

2. **Edit nginx config:**
   ```bash
   sudo nano /etc/nginx/sites-available/api.superscanai.com
   ```

3. **Remove ALL lines with `add_header 'Access-Control-*'`**

4. **Remove the `if ($request_method = 'OPTIONS')` block**

5. **Keep only:**
   ```nginx
   location / {
       proxy_pass http://localhost:5000;
       proxy_http_version 1.1;
       # ... other proxy settings
   }
   ```

6. **Save and test:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## Verification

After the fix, check headers:

```bash
# Test an API endpoint
curl -I https://api.superscanai.com/api/plans

# Should see ONLY ONE Access-Control-Allow-Origin header
```

Expected output:
```
Access-Control-Allow-Origin: https://login.superscanai.com
```

NOT:
```
Access-Control-Allow-Origin: https://login.superscanai.com, https://login.superscanai.com
```

---

## Why This Works

**Before:**
- Nginx adds: `Access-Control-Allow-Origin: https://login.superscanai.com`
- Express adds: `Access-Control-Allow-Origin: https://login.superscanai.com`
- Browser sees: Both (duplicate) → Error ❌

**After:**
- Nginx: (no CORS headers)
- Express adds: `Access-Control-Allow-Origin: https://login.superscanai.com`
- Browser sees: Single header → Works ✅

---

## Complete Fixed Nginx Config

See `nginx-fixed-config.conf` for the complete configuration.

Key points:
- ✅ 30-minute timeouts for large uploads
- ✅ 350M max body size
- ✅ NO CORS headers (Express handles it)
- ✅ Proper proxy settings

---

## Testing

After applying the fix:

1. **Clear browser cache** (CTRL+SHIFT+DELETE)
2. **Hard refresh** (CTRL+F5)
3. **Test login** at https://login.superscanai.com
4. **Test file upload** with multiple images
5. **Check browser console** - should be no CORS errors

---

## Rollback (if needed)

```bash
# List backups
ls -lah /etc/nginx/sites-available/api.superscanai.com.backup.*

# Restore latest backup
sudo cp /etc/nginx/sites-available/api.superscanai.com.backup.YYYYMMDD_HHMMSS /etc/nginx/sites-available/api.superscanai.com

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## Common Issues

### Still seeing CORS errors?

1. **Clear browser cache completely**
2. **Check Express backend is running:**
   ```bash
   pm2 status
   pm2 logs
   ```
3. **Restart backend:**
   ```bash
   pm2 restart all
   ```
4. **Verify Express CORS is enabled in server.js**

### Other errors?

Check logs:
```bash
# Nginx logs
sudo tail -f /var/log/nginx/error.log

# Backend logs
pm2 logs
```

---

## Summary

| Issue | Cause | Fix |
|-------|-------|-----|
| Duplicate CORS headers | Nginx + Express both adding headers | Remove from nginx, keep in Express |
| Timeout on large uploads | 60s nginx timeout | Set to 1800s (30 min) |
| File too large | 300M limit | Increase to 350M |

✅ After this fix, all CORS issues should be resolved!
