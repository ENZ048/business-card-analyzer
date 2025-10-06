#!/bin/bash

# Script to update nginx configuration for large file uploads
# Run with: sudo bash update-nginx.sh

echo "📝 Updating nginx configuration for api.superscanai.com..."

# Backup current config
echo "Creating backup..."
sudo cp /etc/nginx/sites-available/api.superscanai.com /etc/nginx/sites-available/api.superscanai.com.backup.$(date +%Y%m%d_%H%M%S)

# Update the configuration
echo "Updating configuration file..."
sudo tee /etc/nginx/sites-available/api.superscanai.com > /dev/null << 'EOF'
server {
    server_name api.superscanai.com;

    # Increase body size and timeouts for large file uploads
    client_max_body_size 350M;
    client_body_timeout 1800s;          # 30 minutes
    client_header_timeout 1800s;        # 30 minutes
    proxy_connect_timeout 1800s;        # 30 minutes
    proxy_send_timeout 1800s;           # 30 minutes
    proxy_read_timeout 1800s;           # 30 minutes
    send_timeout 1800s;                 # 30 minutes
    keepalive_timeout 1810s;            # 30 minutes + 10s

    # Buffer settings for large uploads
    client_body_buffer_size 256k;
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;

    location / {
        # Handle preflight OPTIONS requests
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://login.superscanai.com' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With, Accept' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Max-Age' '86400' always;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        # Add CORS headers for all responses (backup to Express CORS)
        add_header 'Access-Control-Allow-Origin' 'https://login.superscanai.com' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With, Accept' always;

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

        # Disable buffering for long requests
        proxy_buffering off;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/api.superscanai.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/api.superscanai.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = api.superscanai.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name api.superscanai.com;
    return 404; # managed by Certbot
}
EOF

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuration is valid!"
    echo "Reloading nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully!"
    echo ""
    echo "🎉 Configuration updated! Large file uploads should now work."
    echo ""
    echo "Backup saved at: /etc/nginx/sites-available/api.superscanai.com.backup.*"
else
    echo "❌ Configuration test failed!"
    echo "Restoring backup..."
    sudo cp /etc/nginx/sites-available/api.superscanai.com.backup.* /etc/nginx/sites-available/api.superscanai.com
    echo "Backup restored. Please check the configuration manually."
    exit 1
fi
