import express from 'express'
import {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  getFileInfo
} from '../controllers/upload.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'
import {
  upload,
  compressImage,
  compressImages,
  cleanupOnError
} from '../middleware/upload.middleware.js'

const router = express.Router()

/**
 * @route   POST /api/upload/single
 * @desc    Upload single file
 * @access  Private
 */
router.post(
  '/single',
  authenticate,
  upload.single('file'),
  compressImage,
  uploadSingle,
  cleanupOnError
)

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple files
 * @access  Private
 */
router.post(
  '/multiple',
  authenticate,
  upload.array('files', 10),
  compressImages,
  uploadMultiple,
  cleanupOnError
)

/**
 * @route   POST /api/upload/photo
 * @desc    Upload photo (with compression)
 * @access  Private
 */
router.post(
  '/photo',
  authenticate,
  upload.single('photo'),
  compressImage,
  uploadSingle,
  cleanupOnError
)

/**
 * @route   POST /api/upload/document
 * @desc    Upload document (PDF, etc.)
 * @access  Private
 */
router.post(
  '/document',
  authenticate,
  upload.single('document'),
  uploadSingle,
  cleanupOnError
)

/**
 * @route   DELETE /api/upload/:filename
 * @desc    Delete file
 * @access  Private
 */
router.delete('/:filename', authenticate, deleteFile)

/**
 * @route   GET /api/upload/:filename
 * @desc    Get file info
 * @access  Private
 */
router.get('/:filename', authenticate, getFileInfo)

export default router
