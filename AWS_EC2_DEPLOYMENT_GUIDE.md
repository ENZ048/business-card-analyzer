# AWS EC2 Deployment Guide - Business Card Analyzer

## Fixing 413 Request Entity Too Large Error

### The Problem
The 413 error occurs when nginx (or Apache) has a smaller file size limit than your Node.js application. By default, nginx has a `client_max_body_size` of 1MB, which is much smaller than your application's 50MB limit.

### Solution Steps

#### 1. Update Nginx Configuration

**Find your nginx config file:**
```bash
# Usually located in one of these locations:
sudo find /etc/nginx -name "*.conf" | grep -E "(sites-available|conf.d)"
```

**Edit your nginx configuration:**
```bash
sudo nano /etc/nginx/sites-available/your-domain
# or
sudo nano /etc/nginx/conf.d/your-domain.conf
```

**Add these critical settings:**
```nginx
server {
    listen 80;
    server_name api.superscanai.com;
    
    # CRITICAL: Increase file size limit
    client_max_body_size 50M;
    
    # Increase timeouts for large uploads
    client_body_timeout 60s;
    client_header_timeout 60s;
    
    # Increase buffer sizes
    client_body_buffer_size 128k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase proxy timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

#### 2. Test and Reload Nginx

```bash
# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx
```

#### 3. Verify the Fix

Test your upload endpoint:
```bash
# Test with a file larger than 1MB but smaller than 50MB
curl -X POST https://api.superscanai.com/api/ocr/upload \
  -F "files=@test-image.jpg" \
  -F "userId=test-user" \
  -F "mode=bulk"
```

### Alternative: Global Nginx Configuration

If you want to set this globally for all sites, edit the main nginx config:

```bash
sudo nano /etc/nginx/nginx.conf
```

Add this inside the `http` block:
```nginx
http {
    # Global file size limit
    client_max_body_size 50M;
    
    # Other existing settings...
}
```

### Troubleshooting

#### Check Current Nginx Configuration
```bash
# Check if your config is loaded
sudo nginx -T | grep client_max_body_size

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check access logs
sudo tail -f /var/log/nginx/access.log
```

#### Common Issues

1. **Config not reloaded**: Make sure to run `sudo systemctl reload nginx` after changes
2. **Wrong config file**: Ensure you're editing the correct nginx configuration file
3. **Syntax errors**: Use `sudo nginx -t` to check for syntax errors
4. **Multiple server blocks**: Make sure the `client_max_body_size` is in the correct server block

#### Verify Your Setup

1. **Check nginx version**: `nginx -v`
2. **Check if nginx is running**: `sudo systemctl status nginx`
3. **Check which config is active**: `sudo nginx -T | grep server_name`

### Security Considerations

- 50MB is quite large for business card images. Consider if you really need this size
- Monitor your server for abuse of large file uploads
- Consider implementing rate limiting for file uploads
- Use HTTPS in production (see the full nginx config example)

### Performance Optimization

For better performance with large files:

```nginx
# Add these to your nginx config
client_body_temp_path /tmp/nginx_upload_temp;
client_body_in_file_only on;
client_body_in_single_buffer off;

# For better proxy performance
proxy_request_buffering off;
proxy_buffering off;
```

### Monitoring

Set up monitoring to track:
- File upload success/failure rates
- Average file sizes
- Upload processing times
- Server resource usage during uploads

### Backup Configuration

Always backup your nginx config before making changes:
```bash
sudo cp /etc/nginx/sites-available/your-domain /etc/nginx/sites-available/your-domain.backup
```
