# 🚀 RentVerse Deployment Guide

## Overview

This guide covers the deployment setup for RentVerse, including:
- Mobile app deployment with EAS
- Backend server configuration
- Database setup with Neon
- Cloudflare Tunnel configuration

---

## 📱 Mobile App Deployment

### Prerequisites

1. **Expo Account**: Create at [expo.dev](https://expo.dev)
2. **EAS CLI**: Install globally
   ```bash
   npm install -g eas-cli
   ```

### Build Profiles

The `eas.json` file contains build configurations:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Building the App

```bash
# Login to Expo
eas login

# Build preview APK (for testing)
eas build --platform android --profile preview

# Build production bundle
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

### Monitoring Builds

```bash
# List recent builds
eas build:list --limit 5

# View build details
eas build:view <build-id>
```

---

## 🖥️ Server Deployment

### Server Requirements

- Ubuntu 22.04 LTS (or similar)
- Docker & Docker Compose
- 2GB+ RAM
- 20GB+ Storage

### Docker Services

| Service | Container Name | Port | Description |
|---------|---------------|------|-------------|
| Core API | rentverse-backend | 3000 | Node.js backend |
| AI Service | rentverse-ai-service-rentverse-ai-1 | 8000 | Python ML service |
| Database | rentverse-db | 5432 | PostgreSQL (local) |
| Caddy | rentverse-caddy | 80, 443 | Reverse proxy |

### Starting Services

```bash
# Navigate to project directory
cd ~/rentverse-core-service

# Start all services
docker compose up -d

# Or start individual services
docker compose up -d app
docker compose up -d db
```

### Service Management

```bash
# View running containers
docker ps

# View logs
docker logs rentverse-backend --tail 100 -f

# Restart a service
docker restart rentverse-backend

# Stop all services
docker compose down
```

### Auto-Start Configuration

Ensure services restart automatically:

```bash
# Set restart policy for all containers
docker update --restart unless-stopped \
  rentverse-backend \
  rentverse-db \
  rentverse-caddy \
  rentverse-ai-service-rentverse-ai-1

# Verify
docker inspect rentverse-backend --format '{{.HostConfig.RestartPolicy.Name}}'
```

---

## 🗄️ Database Setup (Neon)

### Neon Configuration

1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Get connection string

### Connection String Format

```
postgresql://username:password@host/database?sslmode=require
```

### Environment Variable

```bash
# In .env file
DATABASE_URL=postgresql://neondb_owner:password@ep-xxx.aws.neon.tech/rentverse?sslmode=require
```

### Database Migrations

```bash
# Push schema changes
npx prisma db push

# Generate Prisma client
npx prisma generate

# View database
npx prisma studio
```

---

## 🌐 Cloudflare Tunnel Setup

### Installation

```bash
# Download and install cloudflared
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

### Authentication

```bash
# Login to Cloudflare
cloudflared tunnel login
```

### Create Tunnel

```bash
# Create tunnel
cloudflared tunnel create rentverse

# Note the tunnel ID from output
```

### Configure Tunnel

Create `/etc/cloudflared/config.yml`:

```yaml
tunnel: <tunnel-id>
credentials-file: /home/user/.cloudflared/<tunnel-id>.json
protocol: http2

ingress:
  - hostname: rentverse-api.yourdomain.com
    service: http://localhost:3000
  - hostname: rentverse-ai.yourdomain.com
    service: http://localhost:8000
  - service: http_status:404
```

### DNS Configuration

```bash
# Add DNS routes
cloudflared tunnel route dns rentverse rentverse-api
cloudflared tunnel route dns rentverse rentverse-ai
```

### Run as Service

```bash
# Install as systemd service
sudo cloudflared service install

# Enable auto-start
sudo systemctl enable cloudflared

# Start service
sudo systemctl start cloudflared

# Check status
sudo systemctl status cloudflared
```

---

## 🔧 Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Server
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# API
API_VERSION=v1

# CORS
ALLOWED_ORIGINS=https://yourdomain.com

# Session
SESSION_SECRET=your-session-secret
```

### AI Service (.env)

```bash
# Server
HOST=0.0.0.0
PORT=8000

# Model
MODEL_PATH=./models/price_model.pkl
```

---

## 📊 Monitoring

### Health Checks

```bash
# Check Core API
curl https://rentverse-api.yourdomain.com/health

# Check AI Service
curl https://rentverse-ai.yourdomain.com/

# Check from server
curl http://localhost:3000/health
curl http://localhost:8000/
```

### Logs

```bash
# Backend logs
docker logs rentverse-backend --tail 100 -f

# AI Service logs
docker logs rentverse-ai-service-rentverse-ai-1 --tail 100 -f

# Cloudflare Tunnel logs
sudo journalctl -u cloudflared -f
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

---

## 🔄 Updates & Maintenance

### Updating Backend Code

```bash
# Pull latest code
cd ~/rentverse-core-service
git pull

# Rebuild and restart
docker compose up -d --build app
```

### Database Backup

```bash
# Export from Neon (use Neon dashboard)
# Or use pg_dump
pg_dump $DATABASE_URL > backup.sql
```

### Cleanup

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup
docker system prune -a
```

---

## 🆘 Troubleshooting

### Common Issues

**1. Backend not starting**
```bash
# Check logs
docker logs rentverse-backend --tail 50

# Check environment
docker exec rentverse-backend env | grep DATABASE
```

**2. Database connection failed**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check if URL has quotes (remove them)
sed -i 's/"//g' .env
```

**3. Cloudflare Tunnel not connecting**
```bash
# Check status
sudo systemctl status cloudflared

# Restart tunnel
sudo systemctl restart cloudflared

# Check config
cat /etc/cloudflared/config.yml
```

**4. Port already in use**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

---

## 📋 Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database migrated
- [ ] SSL certificates ready (Cloudflare handles this)
- [ ] Domain DNS configured

### Post-Deployment
- [ ] Health checks passing
- [ ] API endpoints responding
- [ ] Mobile app connecting
- [ ] Auto-restart configured
- [ ] Monitoring setup
