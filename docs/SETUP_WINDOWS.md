# Setup Admin PPK Server di Windows

Panduan lengkap instalasi dan konfigurasi Admin PPK Server di Windows untuk akses mobile.

## 📋 Prerequisites

### 1. Install PostgreSQL di Windows

**Download PostgreSQL:**
1. Buka: https://www.postgresql.org/download/windows/
2. Download **PostgreSQL 15 atau 16** (Windows x86-64)
3. Atau langsung: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

**Instalasi PostgreSQL:**
1. Jalankan installer yang sudah didownload
2. Ikuti wizard instalasi:
   - **Installation Directory:** Biarkan default `C:\Program Files\PostgreSQL\15`
   - **Select Components:** Centang semua (PostgreSQL Server, pgAdmin 4, Stack Builder, Command Line Tools)
   - **Data Directory:** Biarkan default `C:\Program Files\PostgreSQL\15\data`
   - **Password:** Masukkan password untuk user `postgres` (INGAT PASSWORD INI!)
   - **Port:** Biarkan default `5432`
   - **Locale:** Pilih `Indonesian, Indonesia` atau biarkan default
3. Klik **Next** sampai selesai
4. Jangan centang "Launch Stack Builder" di akhir instalasi

**Verifikasi Instalasi:**
```cmd
# Buka Command Prompt baru (sebagai Administrator)
# Test apakah PostgreSQL sudah terinstall
"C:\Program Files\PostgreSQL\15\bin\psql.exe" --version
```

Jika muncul versi PostgreSQL, instalasi berhasil!

### 2. Create Database Menggunakan pgAdmin (GUI - LEBIH MUDAH)

**Cara 1: Menggunakan pgAdmin (Recommended untuk Windows):**

1. Buka **pgAdmin 4** dari Start Menu
2. Klik kanan pada **PostgreSQL 15** → Masukkan password postgres
3. Klik kanan **Databases** → **Create** → **Database...**
4. **Database name:** `admin_ppk`
5. **Owner:** `postgres`
6. Klik **Save**

✅ Database `admin_ppk` sudah siap digunakan!

**Cara 2: Menggunakan Command Prompt:**

```cmd
# Buka Command Prompt sebagai Administrator
cd "C:\Program Files\PostgreSQL\15\bin"

# Create database
psql.exe -U postgres -c "CREATE DATABASE admin_ppk;"

# Masukkan password postgres saat diminta
```

### 3. Install Node.js

**Download Node.js:**
1. Buka: https://nodejs.org/
2. Download versi **LTS (Long Term Support)** - contoh: 20.x.x
3. Atau langsung: https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi

**Instalasi Node.js:**
1. Jalankan installer `.msi`
2. Klik **Next** sampai selesai (gunakan default settings)
3. Centang "Automatically install necessary tools" jika ada opsi

**Verifikasi Instalasi:**
```cmd
# Buka Command Prompt baru
node --version
npm --version
```

Harus muncul versi Node.js (v20.x.x) dan npm (v10.x.x).

## 🚀 Setup Admin PPK Server

### 1. Extract/Clone Project

Jika belum punya projectnya:
```cmd
# Clone dari git (jika menggunakan git)
git clone <repository-url> C:\admin_PPK
cd C:\admin_PPK
```

Atau extract file ZIP ke folder `C:\admin_PPK`

### 2. Install Dependencies

```cmd
cd C:\admin_PPK\server
npm install
```

⏳ Tunggu sampai semua dependencies terinstall (2-5 menit).

### 3. Configure Environment Variables

```cmd
# Copy file .env.example menjadi .env
copy .env.example .env

# Edit file .env menggunakan Notepad
notepad .env
```

**Edit file `.env` dengan konfigurasi berikut:**

```env
# Server Configuration
NODE_ENV=development
PORT=8443
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=admin_ppk
DB_USER=postgres
DB_PASSWORD=PASSWORD_POSTGRES_ANDA  # <-- GANTI dengan password postgres Anda!

# JWT Configuration (GANTI dengan string random!)
JWT_SECRET=rahasia-jwt-super-aman-ganti-ini-123456789
JWT_REFRESH_SECRET=rahasia-refresh-super-aman-ganti-ini-987654321
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# SSL Configuration (akan dibuat otomatis)
SSL_KEY_PATH=./ssl/server.key
SSL_CERT_PATH=./ssl/server.crt

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,application/pdf

# CORS Configuration (izinkan semua device di jaringan lokal)
CORS_ORIGIN=*
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Admin User (login pertama kali)
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Administrator

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/server.log
```

**PENTING:** Ganti `DB_PASSWORD` dengan password postgres Anda!

### 4. Generate SSL Certificate

**Opsi A: Menggunakan OpenSSL (Jika sudah terinstall):**

```cmd
cd C:\admin_PPK

# Jika punya Git Bash, gunakan script bash
"C:\Program Files\Git\bin\bash.exe" scripts/generate-ssl.sh
```

**Opsi B: Manual dengan OpenSSL:**

Download OpenSSL untuk Windows:
- https://slproweb.com/products/Win32OpenSSL.html
- Download **Win64 OpenSSL v3.x.x Light**

Install, lalu jalankan:
```cmd
cd C:\admin_PPK\server
mkdir ssl

# Generate private key
"C:\Program Files\OpenSSL-Win64\bin\openssl.exe" genrsa -out ssl\server.key 2048

# Generate certificate
"C:\Program Files\OpenSSL-Win64\bin\openssl.exe" req -new -x509 -key ssl\server.key -out ssl\server.crt -days 365
```

**Opsi C: Skip SSL (Gunakan HTTP saja):**

Edit `.env`, hapus atau comment baris SSL:
```env
# SSL_KEY_PATH=./ssl/server.key
# SSL_CERT_PATH=./ssl/server.crt
```

Server akan jalan di HTTP (port 8443) tanpa SSL.

### 5. Cek IP Address Laptop

Catat IP address laptop Anda di jaringan WiFi:

```cmd
ipconfig
```

Cari bagian **Wireless LAN adapter Wi-Fi:**
```
IPv4 Address. . . . . . . . : 192.168.1.100
```

Catat IP ini (contoh: `192.168.1.100`). HP/Tablet akan akses ke IP ini.

### 6. Start Server

```cmd
cd C:\admin_PPK\server
npm start
```

Jika berhasil, akan muncul:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Server started successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Protocol:     HTTPS (atau HTTP)
  Host:         0.0.0.0
  Port:         8443
  Environment:  development
  Local URL:    https://localhost:8443
  API Base:     https://localhost:8443/api
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

✅ **Server sudah running!**

### 7. Test dari Browser Laptop

Buka browser di laptop:
```
https://localhost:8443/api/health
```

atau (jika tidak pakai SSL):
```
http://localhost:8443/api/health
```

Harus muncul response JSON:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-14T...",
  "uptime": 123.45
}
```

## 📱 Akses dari HP/Tablet (Mobile)

### 1. Pastikan Satu Jaringan WiFi

- Laptop PPK connect ke WiFi (misalnya: WiFi Kantor)
- HP/Tablet connect ke WiFi yang SAMA

### 2. Allow Firewall di Windows

**Buka Windows Firewall:**
```cmd
# Jalankan sebagai Administrator
netsh advfirewall firewall add rule name="Node Server Port 8443" dir=in action=allow protocol=TCP localport=8443
```

Atau secara manual:
1. Buka **Windows Defender Firewall**
2. Klik **Advanced settings**
3. Klik **Inbound Rules** → **New Rule...**
4. Pilih **Port** → Next
5. **TCP** → Specific local ports: `8443` → Next
6. **Allow the connection** → Next
7. Centang semua (Domain, Private, Public) → Next
8. **Name:** `Admin PPK Server` → Finish

### 3. Akses dari HP

Buka browser di HP (Chrome/Safari):
```
https://192.168.1.100:8443/api/health
```

Ganti `192.168.1.100` dengan IP laptop Anda (dari langkah 5).

**Jika pakai HTTPS (dengan SSL):**
- Browser akan warning "Your connection is not private" atau "Certificate not trusted"
- Klik **Advanced** → **Proceed to... (unsafe)** atau **Tetap lanjutkan**
- Ini normal untuk self-signed certificate

**Login Test:**
```
https://192.168.1.100:8443/api/auth/login
```

POST dengan body:
```json
{
  "email": "admin@admin.com",
  "password": "admin123"
}
```

## 🔧 Troubleshooting

### Error: "ECONNREFUSED" atau "Cannot connect to database"

**Solusi:**
1. Pastikan PostgreSQL service running:
   - Buka **Services** (Win + R → `services.msc`)
   - Cari **postgresql-x64-15**
   - Status harus **Running**
   - Jika tidak, klik kanan → **Start**

2. Test koneksi database:
```cmd
cd "C:\Program Files\PostgreSQL\15\bin"
psql.exe -U postgres -d admin_ppk
# Masukkan password
# Jika berhasil connect, ketik: \q untuk keluar
```

3. Cek konfigurasi `.env`:
   - `DB_HOST=localhost` ✓
   - `DB_PORT=5432` ✓
   - `DB_NAME=admin_ppk` ✓
   - `DB_PASSWORD` sesuai password postgres ✓

### Error: "Port 8443 already in use"

**Solusi:**
```cmd
# Cari process yang pakai port 8443
netstat -ano | findstr :8443

# Kill process (ganti <PID> dengan Process ID)
taskkill /PID <PID> /F

# Atau ganti PORT di .env menjadi 8080 atau 3000
```

### HP tidak bisa akses server (timeout/connection refused)

**Solusi:**

1. **Cek firewall:** Pastikan port 8443 diizinkan (lihat langkah 7.2)

2. **Cek antivirus:** Matikan sementara antivirus (Avast, AVG, dll) untuk test

3. **Test ping dari HP:**
   - Install app "Network Analyzer" atau "Fing" di HP
   - Ping ke IP laptop (192.168.1.100)
   - Jika tidak bisa ping, masalah di network

4. **Cek IP laptop:**
```cmd
ipconfig
```
   Pastikan IP tidak berubah (beberapa router assign IP dinamis)

5. **Test dari laptop lain dulu:**
   Buka browser di laptop lain (bukan laptop server):
```
https://192.168.1.100:8443/api/health
```

### SSL Certificate Warning di HP tidak hilang

**Ini normal!** Self-signed certificate memang tidak dipercaya browser.

**Solusi permanen:**
1. Di HP, masuk **Settings** → **Security** → **Install certificates**
2. Upload file `server.crt` dari laptop ke HP (via email/WhatsApp)
3. Install certificate di HP

Atau gunakan HTTP saja (tanpa SSL) untuk development.

### Server error setelah restart Windows

**Solusi:**
Server perlu di-start manual setiap kali Windows restart.

**Auto-start Server (Optional):**

Buat file `start-server.bat`:
```batch
@echo off
cd C:\admin_PPK\server
npm start
pause
```

Simpan di Desktop, double-click untuk start server.

Atau tambahkan ke Windows Startup:
1. Win + R → `shell:startup`
2. Copy shortcut `start-server.bat` ke folder startup

## 🎯 Next Steps

Setelah server running:

1. **Test API dengan Postman:**
   - Download Postman: https://www.postman.com/downloads/
   - Import collection dari `docs/` (jika ada)
   - Test semua endpoints

2. **Setup Frontend Client:**
```cmd
cd C:\admin_PPK\client
npm install
npm run dev
```

3. **Akses PWA dari HP:**
```
https://192.168.1.100:8443
```

4. **Baca dokumentasi lengkap:**
   - `server/README.md` - API documentation
   - `docs/DEPLOYMENT_MOBILE_ACCESS.md` - Advanced deployment

## 📞 Support

Jika masih ada masalah:
1. Cek file log: `C:\admin_PPK\server\logs\combined.log`
2. Screenshot error message
3. Tanyakan ke developer

## ✅ Checklist Setup

- [ ] PostgreSQL terinstall dan service running
- [ ] Database `admin_ppk` sudah dibuat
- [ ] Node.js terinstall (v18+)
- [ ] Project dependencies terinstall (`npm install`)
- [ ] File `.env` sudah dikonfigurasi dengan benar
- [ ] SSL certificate sudah digenerate (atau skip untuk HTTP)
- [ ] IP address laptop sudah dicatat
- [ ] Firewall Windows sudah allow port 8443
- [ ] Server berhasil start tanpa error
- [ ] Test `/api/health` dari laptop berhasil
- [ ] HP/Tablet connect ke WiFi yang sama
- [ ] Test `/api/health` dari HP berhasil
- [ ] Login test berhasil

Selamat! Server Admin PPK siap digunakan untuk akses mobile! 🎉
