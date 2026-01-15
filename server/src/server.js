import express from 'express'
import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { Server } from 'socket.io'

import sequelize, { testConnection, syncDatabase } from './config/database.js'
import logger from './config/logger.js'
import routes from './routes/index.js'
import { errorHandler, notFound } from './middleware/errorHandler.middleware.js'
import { User } from './models/index.js'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 8443
const HOST = process.env.HOST || '0.0.0.0'

/**
 * Middleware
 */

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Compression
app.use(compression())

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  }
})
app.use('/api/', limiter)

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`)
    next()
  })
}

// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads')
app.use('/uploads', express.static(uploadDir))

/**
 * Routes
 */
app.use('/api', routes)

/**
 * Error handling
 */
app.use(notFound)
app.use(errorHandler)

/**
 * Create HTTPS or HTTP server
 */
let server

const useHTTPS = process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH

if (useHTTPS) {
  const sslKeyPath = path.resolve(process.env.SSL_KEY_PATH)
  const sslCertPath = path.resolve(process.env.SSL_CERT_PATH)

  if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    const httpsOptions = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    }
    server = https.createServer(httpsOptions, app)
    logger.info('✓ HTTPS server configured')
  } else {
    logger.warn('⚠️  SSL certificates not found, falling back to HTTP')
    server = http.createServer(app)
  }
} else {
  server = http.createServer(app)
  logger.info('HTTP server configured')
}

/**
 * Socket.IO for real-time updates
 */
const io = new Server(server, {
  cors: corsOptions
})

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`)

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`)
  })

  // Example: Listen for DIPA updates
  socket.on('subscribe:dipa', (data) => {
    socket.join(`dipa:${data.year}`)
    logger.info(`Client ${socket.id} subscribed to DIPA ${data.year}`)
  })
})

// Make io available to routes
app.set('io', io)

/**
 * Initialize database and start server
 */
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection()
    if (!dbConnected) {
      logger.error('Failed to connect to database')
      process.exit(1)
    }

    // Sync database models
    await syncDatabase({ alter: process.env.NODE_ENV === 'development' })

    // Create default admin user if not exists
    const adminExists = await User.findOne({
      where: { email: process.env.ADMIN_EMAIL || 'admin@admin.com' }
    })

    if (!adminExists) {
      await User.create({
        email: process.env.ADMIN_EMAIL || 'admin@admin.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        name: process.env.ADMIN_NAME || 'Administrator',
        role: 'admin'
      })
      logger.info('✓ Default admin user created')
    }

    // Start server
    server.listen(PORT, HOST, () => {
      const protocol = useHTTPS ? 'https' : 'http'
      logger.info('━'.repeat(60))
      logger.info('  🚀 Server started successfully!')
      logger.info('━'.repeat(60))
      logger.info(`  Protocol:     ${protocol.toUpperCase()}`)
      logger.info(`  Host:         ${HOST}`)
      logger.info(`  Port:         ${PORT}`)
      logger.info(`  Environment:  ${process.env.NODE_ENV || 'development'}`)
      logger.info(`  Local URL:    ${protocol}://localhost:${PORT}`)
      logger.info(`  API Base:     ${protocol}://localhost:${PORT}/api`)
      logger.info('━'.repeat(60))
      logger.info('')
      logger.info('  Available endpoints:')
      logger.info(`  - ${protocol}://localhost:${PORT}/api/health`)
      logger.info(`  - ${protocol}://localhost:${PORT}/api/auth/login`)
      logger.info(`  - ${protocol}://localhost:${PORT}/api/dipa/items`)
      logger.info(`  - ${protocol}://localhost:${PORT}/api/upload/single`)
      logger.info('━'.repeat(60))
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Server closed')
    sequelize.close()
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    logger.info('Server closed')
    sequelize.close()
    process.exit(0)
  })
})

// Start the server
startServer()
