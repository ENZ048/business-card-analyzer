# Nginx Configuration Update Guide

This guide will help you fix the CORS timeout issue for large file uploads in production.

## Problem
- Large image uploads (>15%) fail with CORS error
- Error: "Access-Control-Allow-Origin header is present on the requested resource"
- Works fine for small batches, fails for large batches

## Root Cause
Nginx has default 60-second timeout, causing uploads to fail during backend processing.

## Solution: Update Nginx Configuration

### Option 1: Automatic Update (Recommended)

1. **Upload the script to your server:**
   ```bash
   scp update-nginx.sh user@your-server:/home/user/
   ```

2. **SSH into your server:**
   ```bash
   ssh user@your-server
   ```

3. **Run the update script:**
   ```bash
   sudo bash update-nginx.sh
   ```

4. **Verify it worked:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

### Option 2: Manual Update

1. **SSH into your server:**
   ```bash
   ssh user@your-server
   ```

2. **Backup current config:**
   ```bash
   sudo cp /etc/nginx/sites-available/api.superscanai.com /etc/nginx/sites-available/api.superscanai.com.backup
   ```

3. **Edit the config:**
   ```bash
   sudo nano /etc/nginx/sites-available/api.superscanai.com
   ```

4. **Replace the content with the contents from `nginx-updated-config.conf`**

5. **Test the configuration:**
   ```bash
   sudo nginx -t
   ```

6. **If test passes, reload nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

7. **If test fails, restore backup:**
   ```bash
   sudo cp /etc/nginx/sites-available/api.superscanai.com.backup /etc/nginx/sites-available/api.superscanai.com
   ```

## Key Changes Made

### Timeout Settings (30 minutes)
```nginx
client_body_timeout 1800s;
proxy_read_timeout 1800s;
proxy_send_timeout 1800s;
```

### Increased Upload Limit
```nginx
client_max_body_size 350M;
```

### CORS Preflight Handling
```nginx
if ($request_method = 'OPTIONS') {
    # Returns 204 immediately for OPTIONS
    return 204;
}
```

### Additional CORS Headers
```nginx
add_header 'Access-Control-Allow-Origin' 'https://login.superscanai.com' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
```

## After Update

### Test the Upload
1. Go to https://login.superscanai.com
2. Upload a batch of 50-100 images
3. Watch the progress bar go from 0-100%
4. Verify it completes successfully

### Monitor Logs (if issues occur)
```bash
# Watch nginx error logs
sudo tail -f /var/log/nginx/error.log

# Watch nginx access logs
sudo tail -f /var/log/nginx/access.log

# Watch backend logs
cd /path/to/backend && pm2 logs
```

## Rollback (if needed)

If something goes wrong:

```bash
# Restore backup
sudo cp /etc/nginx/sites-available/api.superscanai.com.backup /etc/nginx/sites-available/api.superscanai.com

# Test
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

## Verification

After updating, verify these settings are active:

```bash
# Check if nginx config loaded
sudo nginx -T | grep -i "client_max_body_size"
sudo nginx -T | grep -i "proxy_read_timeout"
```

Should show:
```
client_max_body_size 350M;
proxy_read_timeout 1800s;
```

## Expected Behavior After Fix

✅ Upload 100 images without timeout
✅ Progress bar shows continuous progress 0-100%
✅ No CORS errors
✅ Backend processes all images successfully
✅ Takes 10-15 minutes for 100 images (with compression + OCR + AI)

## Troubleshooting

### Still getting CORS errors?
- Check Express backend is running: `pm2 status`
- Restart backend: `pm2 restart all`
- Check backend logs: `pm2 logs`

### Nginx test fails?
- Check syntax carefully (brackets, semicolons)
- Restore backup and try again
- Check nginx error log: `sudo tail -f /var/log/nginx/error.log`

### Upload still times out?
- Verify nginx reloaded: `sudo systemctl status nginx`
- Check backend timeouts in server.js (should be 30 min)
- Verify frontend timeouts in api.js (should be 15 min for bulk)

## Support

If issues persist:
1. Check backend logs: `pm2 logs`
2. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify all timeout settings are correct
4. Test with smaller batch first (10 images)
