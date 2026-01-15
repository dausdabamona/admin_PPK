import express from 'express'
import authRoutes from './auth.routes.js'
import dipaRoutes from './dipa.routes.js'
import uploadRoutes from './upload.routes.js'

const router = express.Router()

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

/**
 * API version info
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Admin PPK API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      dipa: '/api/dipa',
      upload: '/api/upload'
    }
  })
})

/**
 * Mount routes
 */
router.use('/auth', authRoutes)
router.use('/dipa', dipaRoutes)
router.use('/upload', uploadRoutes)

export default router
