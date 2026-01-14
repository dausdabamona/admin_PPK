# 📱 Deployment Guide: Laptop Server + Mobile Access

## 🎯 Tujuan

Transform aplikasi Admin PPK dari single-user web app menjadi **local private server** yang dapat diakses dari HP, tablet, dan PC lain dalam jaringan lokal.

---

## 🏗️ Arsitektur Overview

```
┌─────────────────────────────────────────────────────────┐
│             JARINGAN WIFI PPK (Lokal)                   │
└─────────────────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   [HP PPK]      [Tablet PPK]    [PC Kantor]
   📱 PWA         📱 PWA          💻 Web
        │              │              │
        └──────────────┼──────────────┘
                       │
                 HTTPS/WiFi
                       │
        ┌──────────────────────────────┐
        │   💻 LAPTOP PPK (SERVER)     │
        │   IP: 192.168.1.100:8443    │
        ├──────────────────────────────┤
        │  Frontend (Vite/PWA)         │
        │  Backend API (Express)       │
        │  Database (PostgreSQL)       │
        │  File Storage                │
        └──────────────────────────────┘
```

---

## 📋 Prerequisites

### Laptop PPK (Server)

- ✅ Node.js 18+ installed
- ✅ PostgreSQL 14+ installed (atau gunakan SQLite untuk development)
- ✅ WiFi/Hotspot aktif
- ✅ Port 8443 & 3000 available
- ✅ OpenSSL (untuk generate SSL certificate)

### Mobile Devices (HP/Tablet)

- ✅ Android 8+ atau iOS 12+
- ✅ Browser modern (Chrome, Safari, Firefox)
- ✅ Terhubung ke WiFi yang sama dengan laptop

---

## 🚀 Step-by-Step Setup

### Step 1: Clone & Install Dependencies

```bash
# Clone repository
cd ~/Documents
git clone <repo-url> admin_PPK
cd admin_PPK

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

cd ..
```

### Step 2: Setup Database

#### Option A: PostgreSQL (Recommended untuk Production)

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

CREATE DATABASE admin_ppk;
CREATE USER ppk_admin WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE admin_ppk TO ppk_admin;
\q
```

#### Option B: SQLite (untuk Development)

```bash
# Install sqlite3
npm install sqlite3

# Database akan otomatis dibuat di ./server/database/admin_ppk.db
```

### Step 3: Configure Environment Variables

```bash
# Copy environment template
cp server/.env.example server/.env

# Edit .env file
nano server/.env
```

**Minimal Configuration (.env):**

```env
# Server
NODE_ENV=production
PORT=3000
HTTPS_PORT=8443
HOST=0.0.0.0

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=admin_ppk
DB_USER=ppk_admin
DB_PASSWORD=your_secure_password

# JWT Secret (Generate dengan: openssl rand -hex 64)
JWT_SECRET=your_generated_jwt_secret_min_64_characters

# SSL (akan di-generate di step berikutnya)
SSL_KEY_PATH=./ssl/server.key
SSL_CERT_PATH=./ssl/server.crt

# File Upload
MAX_FILE_SIZE=50MB
UPLOAD_DIR=./uploads
STORAGE_DIR=./storage

# Network (untuk akses dari perangkat lain)
ALLOWED_ORIGINS=https://192.168.1.100:8443,https://ppk.local:8443
```

### Step 4: Generate SSL Certificate

```bash
# Run SSL generation script
chmod +x scripts/generate-ssl.sh
./scripts/generate-ssl.sh
```

**Output:**
```
✓ Local IP: 192.168.1.100
✓ SSL certificate generated
✓ .env updated

Server URLs:
- Local:   https://localhost:8443
- Network: https://192.168.1.100:8443
```

**Note:** Script akan otomatis detect IP laptop dan generate certificate.

### Step 5: Run Database Migrations

```bash
cd server
npm run migrate

# Optional: Seed initial data
npm run seed
```

### Step 6: Build Frontend (PWA)

```bash
cd client
npm run build

# Files akan di-generate di client/dist
# Server akan serve static files dari directory ini
```

### Step 7: Start Server

```bash
cd server
npm start
```

**Expected Output:**

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Admin PPK Server Started                            ║
║                                                           ║
║   Environment: PRODUCTION                                ║
║   HTTPS Port:  8443                                      ║
║                                                           ║
║   Local Access:                                          ║
║   🔒 https://localhost:8443                              ║
║                                                           ║
║   Network Access (from mobile):                          ║
║   🔒 https://192.168.1.100:8443                          ║
║                                                           ║
║   Database: PostgreSQL (Connected ✓)                    ║
║   WebSocket: Enabled                                     ║
║   SSL/TLS: Enabled                                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### Step 8: Test dari Laptop

```bash
# Open browser
open https://localhost:8443

# Or use curl
curl -k https://localhost:8443/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-14T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "production"
}
```

---

## 📱 Access dari Mobile Device (HP/Tablet)

### Step 1: Connect ke WiFi yang Sama

Pastikan HP/Tablet terhubung ke WiFi yang SAMA dengan laptop server.

### Step 2: Cek IP Laptop

```bash
# Di laptop, cek IP address
hostname -I
# Output: 192.168.1.100
```

### Step 3: Open Browser di HP

1. Buka browser (Chrome/Safari)
2. Ketik URL: `https://192.168.1.100:8443`
3. Akan muncul **Certificate Warning** (NORMAL untuk self-signed cert)

**Android:**
- Klik "Advanced" → "Proceed to 192.168.1.100 (unsafe)"

**iOS:**
- Klik "Show Details" → "Visit this website"

### Step 4: Login

Gunakan kredensial yang sudah dibuat saat seed database.

### Step 5: Install PWA (Optional)

**Android:**
1. Klik menu (⋮) → "Add to Home Screen"
2. App akan muncul di launcher seperti app native

**iOS:**
1. Klik Share button (⬆️)
2. Scroll → "Add to Home Screen"
3. App akan muncul di home screen

---

## 🔒 Security Best Practices

### 1. Change Default Passwords

```bash
# Generate strong JWT secret
openssl rand -hex 64

# Update .env
JWT_SECRET=<generated_secret>
```

### 2. Setup Firewall (Optional)

```bash
# UFW (Ubuntu)
sudo ufw allow 8443/tcp
sudo ufw enable

# Restrict to local network only
sudo ufw allow from 192.168.1.0/24 to any port 8443
```

### 3. Enable Database Encryption

Update `server/src/config/database.js`:

```javascript
dialectOptions: {
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
}
```

### 4. Regular Backups

```bash
# Automated backup script
chmod +x scripts/backup-database.sh
./scripts/backup-database.sh

# Add to crontab (daily backup at 2 AM)
crontab -e
0 2 * * * /path/to/admin_PPK/scripts/backup-database.sh
```

---

## 🛠️ Troubleshooting

### Issue 1: Cannot Access from Mobile

**Problem:** Browser tidak bisa connect ke `https://192.168.1.100:8443`

**Solutions:**

1. **Check WiFi:** Pastikan HP dan laptop di WiFi yang sama

```bash
# Di laptop
hostname -I

# Di HP (Android)
Settings → WiFi → Advanced → IP Address
```

2. **Check Firewall:**

```bash
# Temporarily disable firewall untuk testing
sudo ufw disable

# Test connection
# Jika berhasil, add rule dan enable kembali
sudo ufw allow 8443/tcp
sudo ufw enable
```

3. **Check Server Running:**

```bash
# Di laptop
curl -k https://localhost:8443/health

# Should return JSON dengan status: "OK"
```

4. **Check Port Binding:**

```bash
# Ensure server bind to 0.0.0.0, bukan 127.0.0.1
# Di .env:
HOST=0.0.0.0  # ✓ Correct
# HOST=127.0.0.1  # ✗ Wrong (only localhost)
```

---

### Issue 2: Certificate Warning di Mobile

**Problem:** Browser menampilkan "Your connection is not private"

**This is NORMAL** untuk self-signed certificate.

**Solutions:**

**Option A: Bypass Warning (Quick)**
- Android: Advanced → Proceed
- iOS: Show Details → Visit website

**Option B: Install Certificate (Better)**

1. Download certificate:
```bash
# Di laptop
cd server/ssl
python3 -m http.server 8000
```

2. Di HP, open: `http://192.168.1.100:8000/server.crt`

3. Install:
- **Android:** Settings → Security → Install Certificate → CA Certificate
- **iOS:** Settings → General → VPN & Device Management → Install Profile

---

### Issue 3: Database Connection Error

**Problem:** `Unable to connect to database`

**Solutions:**

1. **Check PostgreSQL Running:**

```bash
sudo systemctl status postgresql

# If not running
sudo systemctl start postgresql
```

2. **Check Database Exists:**

```bash
sudo -u postgres psql -l | grep admin_ppk
```

3. **Check Credentials:**

```bash
# Test connection
psql -h localhost -U ppk_admin -d admin_ppk -c "SELECT 1;"
```

4. **Check pg_hba.conf:**

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add line:
host    admin_ppk    ppk_admin    127.0.0.1/32    md5

# Restart
sudo systemctl restart postgresql
```

---

### Issue 4: Upload File Failed from Mobile

**Problem:** Error saat upload foto dari HP

**Solutions:**

1. **Check File Size Limit:**

```javascript
// server/.env
MAX_FILE_SIZE=50MB

// server/src/middleware/upload.middleware.js
limits: {
  fileSize: 50 * 1024 * 1024 // 50MB
}
```

2. **Check Upload Directory Permissions:**

```bash
chmod 755 server/uploads
chmod 755 server/storage
```

3. **Check Disk Space:**

```bash
df -h
```

---

### Issue 5: Slow Performance on Mobile

**Problem:** App lambat saat diakses dari HP

**Solutions:**

1. **Enable Compression:**

Already enabled in `server/src/server.js`:
```javascript
app.use(compression())
```

2. **Optimize Images:**

Camera capture sudah otomatis compress. Adjust quality:

```javascript
// client/src/utils/camera.js
const quality = 0.8  // Lower = smaller file, faster upload
```

3. **Enable Caching:**

PWA Service Worker already cache assets. Check:

```bash
# Browser DevTools (F12)
Application → Service Workers → Check "Activated"
```

4. **Database Indexes:**

```sql
-- Add indexes untuk query yang sering dipakai
CREATE INDEX idx_sppd_status ON sppd(status);
CREATE INDEX idx_sppd_created_at ON sppd(created_at);
```

---

## 🔄 Auto-Start Server on Boot

### Option 1: systemd Service (Linux)

```bash
# Create service file
sudo nano /etc/systemd/system/admin-ppk.service
```

```ini
[Unit]
Description=Admin PPK Server
After=network.target postgresql.service

[Service]
Type=simple
User=your_username
WorkingDirectory=/home/your_username/Documents/admin_PPK/server
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=admin-ppk

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable admin-ppk
sudo systemctl start admin-ppk

# Check status
sudo systemctl status admin-ppk

# View logs
sudo journalctl -u admin-ppk -f
```

### Option 2: PM2 (Cross-platform)

```bash
# Install PM2
npm install -g pm2

# Start server with PM2
cd server
pm2 start src/server.js --name admin-ppk

# Save PM2 config
pm2 save

# Setup startup script
pm2 startup
# Follow instructions to enable auto-start
```

---

## 📊 Monitoring & Maintenance

### Check Server Status

```bash
# Health check
curl -k https://localhost:8443/health

# Database status
psql -U ppk_admin -d admin_ppk -c "SELECT COUNT(*) FROM users;"

# Disk usage
du -sh server/storage/*
```

### View Logs

```bash
# Server logs
tail -f server/logs/combined.log

# Error logs
tail -f server/logs/error.log

# PM2 logs (if using PM2)
pm2 logs admin-ppk
```

### Backup Database

```bash
# Manual backup
pg_dump -U ppk_admin admin_ppk > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U ppk_admin admin_ppk < backup_20240114.sql
```

---

## 🎯 Performance Optimization

### 1. Enable HTTP/2

```javascript
// server/src/server.js
import http2 from 'http2'

const server = http2.createSecureServer(httpsOptions, app)
```

### 2. Enable Gzip Compression

```javascript
app.use(compression({
  level: 6,
  threshold: 1024
}))
```

### 3. Database Connection Pooling

```javascript
// server/src/config/database.js
pool: {
  max: 10,
  min: 2,
  acquire: 30000,
  idle: 10000
}
```

### 4. Redis Cache (Optional)

```bash
# Install Redis
sudo apt install redis-server

# Install Redis client
npm install redis
```

```javascript
// server/src/config/redis.js
import redis from 'redis'

const client = redis.createClient({
  host: 'localhost',
  port: 6379
})

// Cache API responses
app.get('/api/data', async (req, res) => {
  const cacheKey = 'api:data'
  const cached = await client.get(cacheKey)

  if (cached) {
    return res.json(JSON.parse(cached))
  }

  const data = await fetchFromDatabase()
  await client.setEx(cacheKey, 300, JSON.stringify(data)) // 5 min cache

  res.json(data)
})
```

---

## 📚 Additional Resources

- **Architecture:** `docs/ARCHITECTURE.md`
- **API Documentation:** `docs/API_DOCUMENTATION.md`
- **Checklist Usage:** `docs/CHECKLIST_SUMMARY_USAGE.md`
- **DIPA Module:** `MASTER_DIPA_IMPLEMENTATION.md`

---

## 🆘 Support

Jika mengalami masalah:

1. Check logs: `tail -f server/logs/combined.log`
2. Check health endpoint: `curl -k https://localhost:8443/health`
3. Restart server: `pm2 restart admin-ppk`
4. Check database: `psql -U ppk_admin -d admin_ppk`

---

**✅ Setup Complete!** Aplikasi Admin PPK sekarang bisa diakses dari HP, tablet, dan PC lain dalam jaringan lokal dengan database terpusat di laptop PPK.
