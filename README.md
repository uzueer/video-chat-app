
# 📘 Deployment Guide: Omegle Clone with Video on AWS EC2

## 🎯 Objective

Deploy a real-time video chat (WebRTC) application on AWS EC2 with:

* HTTPS support
* Working camera/microphone
* Socket.io signaling
* Public domain access

---

# 🏗️ 1. Project Architecture

```
Frontend → Nginx (System)
Backend → Node.js (Docker :8000)
WebRTC → STUN + TURN
Domain → video.uzueer.in
SSL → Let’s Encrypt
```

---

# ⚙️ 2. Backend Deployment (Docker)

## Steps:

1. Created Dockerfile in `/server`
2. Used docker-compose for backend

### docker-compose.yml (final)

```yaml
version: "3.9"

services:
  server:
    build:
      context: ./server
    container_name: omegle-server
    ports:
      - "8000:8000"
```

## Commands:

```bash
docker-compose down
docker-compose up -d --build
```

---

# 🌐 3. Domain Setup (Hostinger)

* Created subdomain:

```
video.uzueer.in → EC2 Public IP
```

* Type: A record
* Name: video
* Points to: your EC2 IP

---

# 🔒 4. HTTPS Setup (Critical for Camera)

## Installed Certbot:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

## Generated SSL:

```bash
sudo certbot --nginx
```

* Domain: `video.uzueer.in`
* Enabled HTTP → HTTPS redirect

---

# 🧱 5. Nginx Configuration

## File:

```
/etc/nginx/sites-available/default
```

## Final Config:

```nginx
server {
    server_name video.uzueer.in;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /socket.io/ {
        proxy_pass http://localhost:8000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/video.uzueer.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/video.uzueer.in/privkey.pem;
}

server {
    listen 80;
    server_name video.uzueer.in;
    return 301 https://$host$request_uri;
}
```

---

# 🎨 6. Frontend Deployment (NO Docker)

## Built frontend:

```bash
cd client
npm install
npm run build
```

## Copied build to nginx:

```bash
sudo rm -rf /usr/share/nginx/html/*
sudo cp -r dist/* /usr/share/nginx/html/
```

---

# 🔁 7. Fixed Port Conflicts

## Issues faced:

* Port 80 conflict (Docker vs Nginx)
* Port 443 conflict
* Ghost nginx processes

## Fix:

```bash
sudo pkill nginx
sudo fuser -k 80/tcp
sudo fuser -k 443/tcp
sudo systemctl start nginx
```

---

# 🎥 8. WebRTC Fix (MOST IMPORTANT)

## Problem:

* Could see self video
* Could NOT see stranger video

## Cause:

* Only STUN used → fails on AWS (NAT issue)

## Solution:

Added TURN server

### Final WebRTC config:

```javascript
peer = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ]
});
```

---

# 📱 9. Mobile Compatibility Fix

Added to video tags:

```html
<video autoplay muted playsinline id="my-video"></video>
<video autoplay playsinline id="video"></video>
```

---

# 🔌 10. Socket.io Fix

Used nginx proxy:

```nginx
location /socket.io/ {
    proxy_pass http://localhost:8000/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

---

# 🚀 11. Final Result

## Working Features:

✔ HTTPS enabled
✔ Camera access working
✔ Chat working
✔ Stranger video working
✔ Mobile support
✔ Domain connected

---

# 💥 Key Learnings

* WebRTC **requires HTTPS**
* STUN alone is NOT enough → need TURN
* Only ONE service per port
* Nginx should handle frontend in production
* Docker is best for backend only

---

# 🎯 Final URL

```
https://video.uzueer.in
```

---

# 🔥 Status

✅ Fully deployed
✅ Production-ready
