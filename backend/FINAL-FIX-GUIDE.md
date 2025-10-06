# Final Fix Guide - 413 Request Entity Too Large

## Current Errors

1. ❌ `413 Request Entity Too Large`
2. ❌ `No 'Access-Control-Allow-Origin' header is present`

## Root Causes

1. **File size limit too small** - nginx needs `client_max_body_size 350M`
2. **CORS not properly configured** - Express backend handles CORS, but nginx might be interfering

---

## 🚀 Complete Fix (Do This Now)

### Step 1: Upload Scripts to Server

```bash
# From your local machine
scp complete-nginx-fix.sh user@your-server:/home/user/
scp diagnose-nginx.sh user@your-server:/home/user/
```

### Step 2: Run Diagnostic

```bash
# SSH to your server
ssh user@your-server

# Check current state
sudo bash diagnose-nginx.sh
```

### Step 3: Apply Complete Fix

```bash
# Run the complete fix
sudo bash complete-nginx-fix.sh
```

This will:
- ✅ Backup your current config
- ✅ Set `client_max_body_size 350M`
- ✅ Set all timeouts to 30 minutes
- ✅ Remove any CORS headers from nginx
- ✅ Update both site config AND nginx.conf
- ✅ Test and reload nginx

### Step 4: Verify

```bash
# Check the active configuration
sudo nginx -T | grep client_max_body_size

# Should show:
# client_max_body_size 350M;
```

### Step 5: Restart Backend

```bash
# Restart your Node.js backend to ensure CORS is working
pm2 restart all

# Check it's running
pm2 status
```

### Step 6: Test

1. **Clear browser cache** (CTRL+SHIFT+DELETE)
2. **Hard refresh** (CTRL+F5)
3. Go to https://login.superscanai.com
4. **Test upload** with 20-30 images
5. Should work without errors!

---

## 🔍 If Still Not Working

### Check 1: Verify Nginx Applied Settings

```bash
# Show active nginx config for your site
sudo nginx -T | grep -A 30 "server_name api.superscanai.com"

# Should show:
# client_max_body_size 350M;
# proxy_read_timeout 1800s;
```

### Check 2: Test Upload Directly

```bash
# Test if nginx accepts large files
curl -X POST https://api.superscanai.com/api/ocr/upload \
  -F "test=@large_file.jpg" \
  -H "Origin: https://login.superscanai.com" \
  -v
```

Should NOT return 413 error.

### Check 3: Check Backend Logs

```bash
# Watch backend logs
pm2 logs

# Watch nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## 📋 What Gets Fixed

| Issue | Before | After |
|-------|--------|-------|
| Max file size | ~1MB (default) | 350MB |
| Timeout | 60s | 1800s (30 min) |
| CORS headers | Duplicate or missing | Single (from Express) |
| Request buffering | On | Off |

---

## 🎯 Expected Behavior After Fix

✅ Upload up to 350MB total file size
✅ Upload 100 images at once
✅ No 413 errors
✅ No CORS errors
✅ Progress bar shows 0-100%
✅ Processing completes in 10-15 minutes

---

## 🆘 Troubleshooting

### Still getting 413?

**Option A: Check nginx.conf**
```bash
sudo nano /etc/nginx/nginx.conf

# Look for client_max_body_size in http block
# Should be: client_max_body_size 350M;
```

**Option B: Check if there are multiple server blocks**
```bash
# Search all nginx configs
sudo grep -r "api.superscanai.com" /etc/nginx/
```

**Option C: Nuclear option - add to nginx.conf**
```bash
sudo nano /etc/nginx/nginx.conf

# Add inside http { } block:
http {
    client_max_body_size 350M;
    # ... rest of config
}

# Save, test, reload
sudo nginx -t
sudo systemctl reload nginx
```

### Still getting CORS errors?

**Check Express backend is running:**
```bash
pm2 status
pm2 restart all
```

**Check Express CORS config:**
```bash
cd /path/to/backend
grep -A 10 "corsOptions" server.js
```

Should include:
```javascript
origin: [
    "https://login.superscanai.com",
    // ...
]
```

### Backend not responding?

```bash
# Check if backend is listening on port 5000
sudo netstat -tlnp | grep 5000

# Should show Node process
```

---

## 📦 Rollback If Needed

```bash
# List backups
ls -lah /etc/nginx/sites-available/api.superscanai.com.backup.*

# Restore latest
sudo cp /etc/nginx/sites-available/api.superscanai.com.backup.YYYYMMDD_HHMMSS \
       /etc/nginx/sites-available/api.superscanai.com

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## ✅ Success Checklist

After running the fix, verify:

- [ ] `sudo nginx -T | grep client_max_body_size` shows 350M
- [ ] `sudo nginx -T | grep proxy_read_timeout` shows 1800s
- [ ] No CORS headers in nginx config
- [ ] Backend is running (`pm2 status`)
- [ ] Can upload small file (test with 1 image)
- [ ] Can upload medium batch (test with 10 images)
- [ ] Can upload large batch (test with 50+ images)
- [ ] No 413 errors in browser console
- [ ] No CORS errors in browser console
- [ ] Progress bar works 0-100%

---

## 📞 Support Commands

```bash
# Full diagnostic
sudo bash diagnose-nginx.sh

# View current nginx config
sudo cat /etc/nginx/sites-available/api.superscanai.com

# View nginx error log
sudo tail -50 /var/log/nginx/error.log

# View backend logs
pm2 logs --lines 50

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Restart backend
pm2 restart all
```
