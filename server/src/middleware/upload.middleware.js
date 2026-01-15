import multer from 'multer'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Create subdirectories
const subdirs = ['documents', 'photos', 'temp']
subdirs.forEach(dir => {
  const dirPath = path.join(uploadDir, dir)
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
})

/**
 * Multer storage configuration
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subdir = file.fieldname === 'photo' ? 'photos' : 'documents'
    cb(null, path.join(uploadDir, subdir))
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    const name = path.basename(file.originalname, ext)
    cb(null, `${name}-${uniqueSuffix}${ext}`)
  }
})

/**
 * File filter
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/pdf'
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`), false)
  }
}

/**
 * Multer upload configuration
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
  }
})

/**
 * Compress uploaded image
 */
export const compressImage = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next()
  }

  try {
    const inputPath = req.file.path
    const outputPath = path.join(
      path.dirname(inputPath),
      `compressed-${path.basename(inputPath)}`
    )

    // Compress image
    await sharp(inputPath)
      .resize(1920, 1920, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 80,
        progressive: true
      })
      .toFile(outputPath)

    // Delete original
    fs.unlinkSync(inputPath)

    // Update file path
    req.file.path = outputPath
    req.file.filename = path.basename(outputPath)

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Compress multiple uploaded images
 */
export const compressImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next()
  }

  try {
    for (const file of req.files) {
      if (file.mimetype.startsWith('image/')) {
        const inputPath = file.path
        const outputPath = path.join(
          path.dirname(inputPath),
          `compressed-${path.basename(inputPath)}`
        )

        await sharp(inputPath)
          .resize(1920, 1920, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({
            quality: 80,
            progressive: true
          })
          .toFile(outputPath)

        fs.unlinkSync(inputPath)

        file.path = outputPath
        file.filename = path.basename(outputPath)
      }
    }

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Clean up uploaded files on error
 */
export const cleanupOnError = (err, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, () => {})
  }

  if (req.files) {
    req.files.forEach(file => {
      fs.unlink(file.path, () => {})
    })
  }

  next(err)
}
