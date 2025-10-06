# Manual Fix Steps - 413 Error

## If Scripts Don't Work, Follow These Steps Manually

### Step 1: Edit nginx.conf

```bash
sudo nano /etc/nginx/nginx.conf
```

**Find the `http {` block and add this line right after it:**

```nginx
http {
    client_max_body_size 350M;    # ADD THIS LINE

    # ... rest of config
}
```

**Save:** `CTRL+O`, `ENTER`, `CTRL+X`

---

### Step 2: Edit Site Config

```bash
sudo nano /etc/nginx/sites-available/api.superscanai.com
```

**COMPLETELY REPLACE the file contents with this:**

```nginx
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
```

**Save:** `CTRL+O`, `ENTER`, `CTRL+X`

---

### Step 3: Test Configuration

```bash
sudo nginx -t
```

**Should show:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

---

### Step 4: Reload Nginx

```bash
sudo systemctl reload nginx
```

**If reload doesn't work, restart:**
```bash
sudo systemctl restart nginx
```

---

### Step 5: Verify Settings Applied

```bash
sudo nginx -T | grep client_max_body_size
```

**Should show multiple lines with:**
```
client_max_body_size 350M;
```

---

### Step 6: Restart Backend

```bash
pm2 restart all
pm2 status
```

**Should show backend running (online)**

---

### Step 7: Test Upload

1. **Clear browser cache completely** (CTRL+SHIFT+DELETE)
2. **Close browser completely**
3. **Reopen browser**
4. Go to `https://login.superscanai.com`
5. **Try upload again**

---

## If STILL Getting 413

### Nuclear Option 1: Check All nginx.conf Files

Sometimes there are multiple nginx.conf files:

```bash
# Find all nginx configs
sudo find /etc/nginx -name "*.conf" -exec grep -l "client_max_body_size" {} \;

# Check each one
sudo grep -r "client_max_body_size" /etc/nginx/
```

Make sure ALL show `350M` (or remove smaller values)

---

### Nuclear Option 2: Add to Multiple Locations

```bash
# Add to nginx.conf http block
sudo nano /etc/nginx/nginx.conf
# Add: client_max_body_size 350M;

# Add to site config server block
sudo nano /etc/nginx/sites-available/api.superscanai.com
# Add: client_max_body_size 350M;

# Add to default config too (just in case)
sudo nano /etc/nginx/sites-available/default
# Add: client_max_body_size 350M;
```

---

### Nuclear Option 3: Full Nginx Restart

```bash
# Stop nginx completely
sudo systemctl stop nginx

# Wait 5 seconds
sleep 5

# Start nginx
sudo systemctl start nginx

# Check status
sudo systemctl status nginx
```

---

### Nuclear Option 4: Check if Another Service is Interfering

```bash
# Check if apache or another proxy is running
sudo netstat -tlnp | grep :443

# Should ONLY show nginx, not apache or others
```

---

## Verification Checklist

After all steps, verify:

```bash
# 1. Nginx running?
sudo systemctl status nginx

# 2. Config has 350M?
sudo nginx -T | grep client_max_body_size

# 3. No syntax errors?
sudo nginx -t

# 4. Backend running?
pm2 status

# 5. Port 5000 listening?
sudo netstat -tlnp | grep 5000

# 6. No errors in logs?
sudo tail -20 /var/log/nginx/error.log
```

---

## Test with curl

```bash
# Create a test file
dd if=/dev/zero of=test.dat bs=1M count=50

# Upload it
curl -X POST https://api.superscanai.com/api/ocr/upload \
  -F "test=@test.dat" \
  -H "Origin: https://login.superscanai.com" \
  -v

# Should NOT return 413
# Should return something from backend (even if it's an error about the file type)
```

---

## If Everything Above Fails

**There might be a reverse proxy or CDN in front of nginx:**

1. **Check DNS** - where does api.superscanai.com point?
   ```bash
   dig api.superscanai.com
   nslookup api.superscanai.com
   ```

2. **Check if using Cloudflare** - Cloudflare has 100MB limit on free plan
   - Go to Cloudflare dashboard
   - Check if proxy is enabled (orange cloud)
   - Either upgrade plan or disable proxy (gray cloud)

3. **Check for load balancer** - AWS/DigitalOcean load balancers have limits
   - Check load balancer settings
   - Increase upload limit there too

---

## Last Resort: Contact Support

If nothing works, you might need to check:
- Server provider limits (some VPS have hard limits)
- Firewall rules blocking large uploads
- SELinux/AppArmor blocking nginx changes

```bash
# Check SELinux
sestatus

# If enforcing, might need to adjust
# Check AppArmor
sudo aa-status
```
