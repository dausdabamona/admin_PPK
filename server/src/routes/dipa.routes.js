import express from 'express'
import { body, query } from 'express-validator'
import {
  getDipaItems,
  getActiveDipa,
  getDipaAtRevision,
  createRevision,
  importDipaItems,
  updateRealisasi,
  compareRevisions,
  getRevisions,
  getDipaStats
} from '../controllers/dipa.controller.js'
import { authenticate, authorize } from '../middleware/auth.middleware.js'
import { validate, validatePagination, validateYear } from '../middleware/validation.middleware.js'

const router = express.Router()

/**
 * @route   GET /api/dipa/items
 * @desc    Get all DIPA items with filters
 * @access  Private
 */
router.get(
  '/items',
  authenticate,
  validatePagination,
  getDipaItems
)

/**
 * @route   GET /api/dipa/:year/active
 * @desc    Get active DIPA for a year
 * @access  Private
 */
router.get(
  '/:year/active',
  authenticate,
  validateYear,
  getActiveDipa
)

/**
 * @route   GET /api/dipa/:year/revision/:revisi
 * @desc    Get DIPA at specific revision
 * @access  Private
 */
router.get(
  '/:year/revision/:revisi',
  authenticate,
  validateYear,
  getDipaAtRevision
)

/**
 * @route   GET /api/dipa/:year/revisions
 * @desc    Get all revisions for a year
 * @access  Private
 */
router.get(
  '/:year/revisions',
  authenticate,
  validateYear,
  getRevisions
)

/**
 * @route   GET /api/dipa/:year/stats
 * @desc    Get DIPA statistics
 * @access  Private
 */
router.get(
  '/:year/stats',
  authenticate,
  validateYear,
  getDipaStats
)

/**
 * @route   GET /api/dipa/:year/compare
 * @desc    Compare two DIPA revisions
 * @access  Private
 */
router.get(
  '/:year/compare',
  [
    authenticate,
    validateYear,
    query('revisiA').isInt().withMessage('Revision A must be an integer'),
    query('revisiB').isInt().withMessage('Revision B must be an integer'),
    validate
  ],
  compareRevisions
)

/**
 * @route   POST /api/dipa/revisions
 * @desc    Create new DIPA revision
 * @access  Private (Admin/PPK only)
 */
router.post(
  '/revisions',
  [
    authenticate,
    authorize('admin', 'ppk'),
    body('tahun').isInt({ min: 2000, max: 2100 }).withMessage('Valid year is required'),
    body('tanggalRevisi').isISO8601().withMessage('Valid date is required'),
    body('nomorRevisi').optional().isString(),
    body('keterangan').optional().isString(),
    validate
  ],
  createRevision
)

/**
 * @route   POST /api/dipa/import
 * @desc    Import DIPA items (bulk)
 * @access  Private (Admin/PPK only)
 */
router.post(
  '/import',
  [
    authenticate,
    authorize('admin', 'ppk'),
    body('tahun').isInt({ min: 2000, max: 2100 }).withMessage('Valid year is required'),
    body('revisi').isInt({ min: 0 }).withMessage('Valid revision is required'),
    body('items').isArray({ min: 1 }).withMessage('Items array is required'),
    validate
  ],
  importDipaItems
)

/**
 * @route   PUT /api/dipa/:id/realisasi
 * @desc    Update DIPA realisasi
 * @access  Private (Admin/PPK only)
 */
router.put(
  '/:id/realisasi',
  [
    authenticate,
    authorize('admin', 'ppk'),
    body('realisasi').isFloat({ min: 0 }).withMessage('Valid realisasi value is required'),
    validate
  ],
  updateRealisasi
)

export default router
