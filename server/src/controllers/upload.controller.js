import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Upload single file
 */
export const uploadSingle = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    const fileUrl = `/uploads/${path.basename(path.dirname(req.file.path))}/${req.file.filename}`

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        url: fileUrl
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Upload multiple files
 */
export const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      })
    }

    const files = req.files.map(file => {
      const fileUrl = `/uploads/${path.basename(path.dirname(file.path))}/${file.filename}`
      return {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: fileUrl
      }
    })

    res.json({
      success: true,
      message: `${files.length} files uploaded successfully`,
      data: files
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete file
 */
export const deleteFile = async (req, res, next) => {
  try {
    const { filename } = req.params
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads')

    // Search in subdirectories
    const subdirs = ['documents', 'photos', 'temp']
    let deleted = false

    for (const subdir of subdirs) {
      const filePath = path.join(uploadDir, subdir, filename)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        deleted = true
        break
      }
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get file info
 */
export const getFileInfo = async (req, res, next) => {
  try {
    const { filename } = req.params
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads')

    // Search in subdirectories
    const subdirs = ['documents', 'photos', 'temp']
    let fileInfo = null

    for (const subdir of subdirs) {
      const filePath = path.join(uploadDir, subdir, filename)
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath)
        fileInfo = {
          filename,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          url: `/uploads/${subdir}/${filename}`
        }
        break
      }
    }

    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      })
    }

    res.json({
      success: true,
      data: fileInfo
    })
  } catch (error) {
    next(error)
  }
}
