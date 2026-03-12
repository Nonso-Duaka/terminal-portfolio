# Deployment Guide

## Fly.io (Recommended - supports both Web + SSH)

### 1. Install flyctl
```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Login
```bash
fly auth login
```

### 3. Launch (first time only)
```bash
cd ~/terminal-website
fly launch
# When prompted:
#   - App name: nonso-terminal (or your choice)
#   - Region: pick closest to you (ord = Chicago)
#   - Don't add a database
```

### 4. Deploy
```bash
fly deploy
```

### 5. Access
- **Web:** https://nonso-terminal.fly.dev
- **SSH:** `ssh nonso-terminal.fly.dev -p 2222`

### Custom Domain
```bash
fly certs add yourdomain.com
```
Then point your DNS A record to the Fly IP shown.

---

## VPS (DigitalOcean, Hetzner, etc.)

### 1. Set up server
```bash
ssh root@your-server
apt update && apt install -y nodejs npm
git clone <your-repo> ~/terminal-website
cd ~/terminal-website
npm ci --production
```

### 2. Run with systemd
Create `/etc/systemd/system/terminal-portfolio.service`:
```ini
[Unit]
Description=Terminal Portfolio
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/root/terminal-website
ExecStart=/usr/bin/node server.js
Restart=always
Environment=WEB_PORT=3000
Environment=SSH_PORT=22

[Install]
WantedBy=multi-user.target
```

```bash
systemctl enable terminal-portfolio
systemctl start terminal-portfolio
```

### 3. Nginx reverse proxy (for HTTPS on web)
```nginx
server {
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Then: `certbot --nginx -d yourdomain.com`
