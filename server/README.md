# Admin PPK Server

Backend REST API server untuk aplikasi Admin PPK dengan PostgreSQL database.

## Features

- 🔐 JWT Authentication with refresh tokens
- 📊 DIPA management with revision tracking
- 📤 File upload with automatic image compression
- 🔄 Real-time updates via WebSocket (Socket.IO)
- 🛡️ Security (Helmet, CORS, Rate Limiting)
- 📝 Request validation
- 📁 Structured logging with Winston
- 🗄️ PostgreSQL with Sequelize ORM

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 13
- npm or yarn

## Installation

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Setup PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE admin_ppk;

# Create user (optional)
CREATE USER ppk_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE admin_ppk TO ppk_user;

# Exit
\q
```

### 3. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env file with your settings
nano .env
```

Required environment variables:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=admin_ppk
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secrets (change these!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Admin User
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=admin123
```

### 4. Generate SSL Certificates (for HTTPS)

```bash
# Run the SSL generation script
cd ..
bash scripts/generate-ssl.sh

# Or manually create certificates
mkdir -p server/ssl
cd server/ssl
openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes
```

### 5. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on `https://localhost:8443` (or `http://localhost:8443` if SSL not configured).

## API Endpoints

### Health Check
```
GET /api/health
```

### Authentication

```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login user
POST   /api/auth/refresh       - Refresh access token
POST   /api/auth/logout        - Logout user
GET    /api/auth/profile       - Get current user profile
PUT    /api/auth/profile       - Update user profile
POST   /api/auth/change-password - Change password
```

### DIPA Management

```
GET    /api/dipa/items                    - Get all DIPA items (paginated)
GET    /api/dipa/:year/active             - Get active DIPA for a year
GET    /api/dipa/:year/revision/:revisi   - Get DIPA at specific revision
GET    /api/dipa/:year/revisions          - Get all revisions for a year
GET    /api/dipa/:year/stats              - Get DIPA statistics
GET    /api/dipa/:year/compare            - Compare two revisions
POST   /api/dipa/revisions                - Create new revision (Admin/PPK)
POST   /api/dipa/import                   - Import DIPA items (Admin/PPK)
PUT    /api/dipa/:id/realisasi            - Update realisasi (Admin/PPK)
```

### File Upload

```
POST   /api/upload/single      - Upload single file
POST   /api/upload/multiple    - Upload multiple files
POST   /api/upload/photo       - Upload photo (with compression)
POST   /api/upload/document    - Upload document
DELETE /api/upload/:filename   - Delete file
GET    /api/upload/:filename   - Get file info
```

## API Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

### Example Request

```bash
# Login
curl -X POST https://localhost:8443/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"admin123"}' \
  -k

# Get DIPA items (with token)
curl -X GET "https://localhost:8443/api/dipa/items?page=1&limit=10" \
  -H "Authorization: Bearer <token>" \
  -k
```

## Database Models

### User
- id, email, password, name, role, isActive, lastLogin, refreshToken

### MasterDipa
- id, tahun, revisi, status, kode, uraian, level, pagu, realisasi, parentKode

### DipaRevision
- id, tahun, revisi, nomorRevisi, tanggalRevisi, keterangan, status, fileAttachment

### SPJPackage
- id, packageCode, processType, year, status, dipaRevision, dipaMakCode, totalPagu, totalRealisasi, metadata, checklistData

## Directory Structure

```
server/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # Sequelize configuration
│   │   └── logger.js     # Winston logger setup
│   ├── models/           # Sequelize models
│   │   ├── User.js
│   │   ├── MasterDipa.js
│   │   ├── DipaRevision.js
│   │   ├── SPJPackage.js
│   │   └── index.js
│   ├── controllers/      # Business logic
│   │   ├── auth.controller.js
│   │   ├── dipa.controller.js
│   │   └── upload.controller.js
│   ├── routes/           # API routes
│   │   ├── auth.routes.js
│   │   ├── dipa.routes.js
│   │   ├── upload.routes.js
│   │   └── index.js
│   ├── middleware/       # Express middleware
│   │   ├── auth.middleware.js
│   │   ├── upload.middleware.js
│   │   ├── validation.middleware.js
│   │   └── errorHandler.middleware.js
│   └── server.js         # Main entry point
├── uploads/              # Uploaded files storage
├── logs/                 # Application logs
├── ssl/                  # SSL certificates
├── .env                  # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## Security Features

- ✅ HTTPS with SSL/TLS encryption
- ✅ JWT authentication with refresh tokens
- ✅ Password hashing with bcrypt
- ✅ Rate limiting to prevent abuse
- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ Input validation with express-validator
- ✅ SQL injection prevention (Sequelize ORM)

## Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start src/server.js --name admin-ppk-server

# Enable auto-start on boot
pm2 startup
pm2 save
```

### Using systemd

See [DEPLOYMENT_MOBILE_ACCESS.md](../docs/DEPLOYMENT_MOBILE_ACCESS.md) for detailed instructions.

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check database credentials in `.env`
- Verify database exists: `psql -U postgres -l`

### SSL Certificate Error

```
Error: ENOENT: no such file or directory, open './ssl/server.key'
```

**Solution:**
- Generate SSL certificates: `bash scripts/generate-ssl.sh`
- Or update `.env` to remove SSL paths (will use HTTP)

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::8443
```

**Solution:**
```bash
# Find process using port
lsof -i :8443

# Kill process
kill -9 <PID>
```

## Development

### Database Migrations

```bash
# Sync database (development only)
# Database will auto-sync on server start in development mode
npm run dev
```

### Logs

Logs are stored in `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

View logs in real-time:
```bash
tail -f logs/combined.log
```

## Support

For issues and questions, refer to:
- [Main Project README](../README.md)
- [Deployment Guide](../docs/DEPLOYMENT_MOBILE_ACCESS.md)
- [DIPA Implementation](../MASTER_DIPA_IMPLEMENTATION.md)
