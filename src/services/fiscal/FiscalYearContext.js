/**
 * ============================================================================
 * FISCAL YEAR CONTEXT - Multi Tahun Anggaran Management
 * ============================================================================
 *
 * Service sentral untuk mengelola konteks Tahun Anggaran (TA) di seluruh sistem.
 *
 * Prinsip Arsitektur:
 * 1. ISOLASI DATA - Semua data ter-isolasi per TA
 * 2. SINGLE ACTIVE YEAR - Hanya satu TA aktif pada satu waktu
 * 3. IMMUTABILITY - Historical data tidak pernah diubah
 * 4. AUDIT TRAIL - Semua perubahan konteks tercatat
 * 5. REACTIVE - Semua modul auto-update saat TA berubah
 *
 * Target:
 * "Satu sistem untuk TA berjalan dan penataan TA lampau,
 *  terpisah, aman, dan siap audit"
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import { EventEmitter } from 'events'

/**
 * Fiscal Year Status
 */
export const FISCAL_YEAR_STATUS = {
  ACTIVE: 'ACTIVE',           // TA berjalan (operasional harian)
  ARCHIVE: 'ARCHIVE',         // TA lampau (arsip final)
  RECONSTRUCTION: 'RECONSTRUCTION', // TA lampau (dalam rekonstruksi)
  CLOSED: 'CLOSED'            // TA sudah ditutup permanen
}

/**
 * Fiscal Year Mode
 */
export const FISCAL_YEAR_MODE = {
  OPERATIONAL: 'OPERATIONAL', // Mode kerja normal (TA aktif)
  ARCHIVE: 'ARCHIVE',         // Mode lihat arsip
  RECONSTRUCTION: 'RECONSTRUCTION' // Mode rekonstruksi administrasi
}

/**
 * Fiscal Year Context Service
 */
class FiscalYearContext extends EventEmitter {
  constructor() {
    super()

    // State
    this._activeYear = null
    this._availableYears = []
    this._yearData = new Map()
    this._mode = FISCAL_YEAR_MODE.OPERATIONAL
    this._initialized = false

    // Storage key
    this._storageKey = 'admin_ppk_fiscal_year_context'

    // Audit trail
    this._auditTrail = []
  }

  /**
   * Initialize fiscal year context
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._initialized) return

    try {
      // Load from localStorage
      this._loadFromStorage()

      // If no active year, set to current year
      if (!this._activeYear) {
        const currentYear = new Date().getFullYear()
        await this.setActiveYear(currentYear, { skipValidation: true })
      }

      // Load available years (from database or config)
      await this._loadAvailableYears()

      this._initialized = true
      this._log('INITIALIZE', `Fiscal Year Context initialized with TA ${this._activeYear}`)

      console.log('[FiscalYearContext] Initialized successfully')
    } catch (error) {
      console.error('[FiscalYearContext] Initialization error:', error)
      throw error
    }
  }

  /**
   * Get active fiscal year
   * @returns {number} Active year (e.g., 2024)
   */
  getActiveYear() {
    if (!this._initialized) {
      console.warn('[FiscalYearContext] Not initialized, returning current year')
      return new Date().getFullYear()
    }
    return this._activeYear
  }

  /**
   * Set active fiscal year
   * @param {number} year - Year to set as active
   * @param {Object} options - Options
   * @returns {Promise<boolean>} Success
   */
  async setActiveYear(year, options = {}) {
    const { skipValidation = false, reason = 'Manual switch' } = options

    try {
      // Validate year
      if (!skipValidation && !this._isValidYear(year)) {
        throw new Error(`Invalid fiscal year: ${year}`)
      }

      const oldYear = this._activeYear
      this._activeYear = year

      // Determine mode based on year
      this._mode = this._determineModeForYear(year)

      // Save to storage
      this._saveToStorage()

      // Log audit trail
      this._log('SET_ACTIVE_YEAR', `Changed from TA ${oldYear} to TA ${year}`, {
        oldYear,
        newYear: year,
        mode: this._mode,
        reason
      })

      // Emit event for reactive updates
      this.emit('yearChanged', {
        oldYear,
        newYear: year,
        mode: this._mode
      })

      console.log(`[FiscalYearContext] Active year changed: ${oldYear} → ${year} (${this._mode})`)

      return true
    } catch (error) {
      console.error('[FiscalYearContext] Set active year error:', error)
      return false
    }
  }

  /**
   * Switch to another fiscal year
   * @param {number} year - Year to switch to
   * @param {string} reason - Reason for switching
   * @returns {Promise<boolean>} Success
   */
  async switchYear(year, reason = 'User switched year') {
    return await this.setActiveYear(year, { reason })
  }

  /**
   * Get all available fiscal years
   * @returns {Array<Object>} Available years with metadata
   */
  getAvailableYears() {
    return this._availableYears.map(yearInfo => ({
      year: yearInfo.year,
      status: yearInfo.status,
      label: this._getYearLabel(yearInfo.year, yearInfo.status),
      isCurrent: yearInfo.year === this._activeYear,
      packageCount: yearInfo.packageCount || 0,
      lastActivity: yearInfo.lastActivity
    }))
  }

  /**
   * Get current mode
   * @returns {string} Current mode (OPERATIONAL/ARCHIVE/RECONSTRUCTION)
   */
  getMode() {
    return this._mode
  }

  /**
   * Set mode explicitly (for reconstruction)
   * @param {string} mode - Mode to set
   * @returns {boolean} Success
   */
  setMode(mode) {
    if (!Object.values(FISCAL_YEAR_MODE).includes(mode)) {
      console.error(`[FiscalYearContext] Invalid mode: ${mode}`)
      return false
    }

    const oldMode = this._mode
    this._mode = mode

    this._log('SET_MODE', `Changed mode from ${oldMode} to ${mode}`)

    this.emit('modeChanged', {
      oldMode,
      newMode: mode,
      year: this._activeYear
    })

    console.log(`[FiscalYearContext] Mode changed: ${oldMode} → ${mode}`)

    return true
  }

  /**
   * Check if current year is active (operational)
   * @returns {boolean}
   */
  isActiveYear() {
    const currentYear = new Date().getFullYear()
    return this._activeYear === currentYear
  }

  /**
   * Check if in archive mode
   * @returns {boolean}
   */
  isArchiveMode() {
    return this._mode === FISCAL_YEAR_MODE.ARCHIVE
  }

  /**
   * Check if in reconstruction mode
   * @returns {boolean}
   */
  isReconstructionMode() {
    return this._mode === FISCAL_YEAR_MODE.RECONSTRUCTION
  }

  /**
   * Get year data/metadata
   * @param {number} year - Year to get data for
   * @returns {Object} Year metadata
   */
  getYearData(year) {
    return this._yearData.get(year) || null
  }

  /**
   * Set year data/metadata
   * @param {number} year - Year to set data for
   * @param {Object} data - Year metadata
   */
  setYearData(year, data) {
    this._yearData.set(year, {
      ...this._yearData.get(year),
      ...data,
      updatedAt: new Date().toISOString()
    })

    this._saveToStorage()
  }

  /**
   * Get audit trail
   * @param {number} limit - Max entries to return
   * @returns {Array<Object>} Audit trail entries
   */
  getAuditTrail(limit = 100) {
    return this._auditTrail.slice(-limit)
  }

  /**
   * Get context summary
   * @returns {Object} Context summary
   */
  getSummary() {
    return {
      activeYear: this._activeYear,
      mode: this._mode,
      isActive: this.isActiveYear(),
      availableYears: this._availableYears.length,
      totalPackages: this._getTotalPackages(),
      lastSwitch: this._getLastSwitch()
    }
  }

  /**
   * Create filter object for database queries
   * @param {Object} additionalFilters - Additional filters
   * @returns {Object} Filter object with tahunAnggaran
   */
  createFilter(additionalFilters = {}) {
    return {
      tahunAnggaran: this._activeYear,
      ...additionalFilters
    }
  }

  /**
   * Wrap data with year context
   * @param {Object} data - Data to wrap
   * @returns {Object} Data with year context
   */
  wrapWithContext(data) {
    return {
      ...data,
      tahunAnggaran: this._activeYear,
      fiscalYearMode: this._mode,
      contextTimestamp: new Date().toISOString()
    }
  }

  /**
   * Check if year is valid
   * @param {number} year - Year to validate
   * @returns {boolean}
   * @private
   */
  _isValidYear(year) {
    // Year must be between 2015 and current year + 1
    const currentYear = new Date().getFullYear()
    return year >= 2015 && year <= currentYear + 1
  }

  /**
   * Determine mode based on year
   * @param {number} year - Year
   * @returns {string} Mode
   * @private
   */
  _determineModeForYear(year) {
    const currentYear = new Date().getFullYear()

    if (year === currentYear) {
      return FISCAL_YEAR_MODE.OPERATIONAL
    }

    // Check if year has reconstruction flag
    const yearData = this._yearData.get(year)
    if (yearData?.isReconstructing) {
      return FISCAL_YEAR_MODE.RECONSTRUCTION
    }

    return FISCAL_YEAR_MODE.ARCHIVE
  }

  /**
   * Get year label
   * @param {number} year - Year
   * @param {string} status - Status
   * @returns {string} Label
   * @private
   */
  _getYearLabel(year, status) {
    const currentYear = new Date().getFullYear()

    if (year === currentYear) {
      return `TA ${year} (Aktif)`
    }

    if (status === FISCAL_YEAR_STATUS.RECONSTRUCTION) {
      return `TA ${year} (Rekonstruksi)`
    }

    if (status === FISCAL_YEAR_STATUS.ARCHIVE) {
      return `TA ${year} (Arsip)`
    }

    if (status === FISCAL_YEAR_STATUS.CLOSED) {
      return `TA ${year} (Ditutup)`
    }

    return `TA ${year}`
  }

  /**
   * Load available years (from database or config)
   * @returns {Promise<void>}
   * @private
   */
  async _loadAvailableYears() {
    // TODO: Load from database
    // For now, generate last 5 years

    const currentYear = new Date().getFullYear()
    const years = []

    for (let i = 0; i < 5; i++) {
      const year = currentYear - i
      let status = FISCAL_YEAR_STATUS.ARCHIVE

      if (year === currentYear) {
        status = FISCAL_YEAR_STATUS.ACTIVE
      }

      years.push({
        year,
        status,
        packageCount: 0,
        lastActivity: null
      })
    }

    this._availableYears = years
  }

  /**
   * Get total packages across all years
   * @returns {number}
   * @private
   */
  _getTotalPackages() {
    return this._availableYears.reduce((sum, y) => sum + (y.packageCount || 0), 0)
  }

  /**
   * Get last switch timestamp
   * @returns {string|null}
   * @private
   */
  _getLastSwitch() {
    const lastEntry = this._auditTrail
      .filter(e => e.action === 'SET_ACTIVE_YEAR')
      .slice(-1)[0]

    return lastEntry?.timestamp || null
  }

  /**
   * Log to audit trail
   * @param {string} action - Action type
   * @param {string} description - Description
   * @param {Object} metadata - Additional metadata
   * @private
   */
  _log(action, description, metadata = {}) {
    this._auditTrail.push({
      action,
      description,
      metadata,
      timestamp: new Date().toISOString(),
      user: 'system' // TODO: Get from auth context
    })

    // Keep only last 1000 entries
    if (this._auditTrail.length > 1000) {
      this._auditTrail = this._auditTrail.slice(-1000)
    }

    this._saveToStorage()
  }

  /**
   * Save to localStorage
   * @private
   */
  _saveToStorage() {
    try {
      const state = {
        activeYear: this._activeYear,
        mode: this._mode,
        yearData: Array.from(this._yearData.entries()),
        auditTrail: this._auditTrail.slice(-100) // Save last 100 only
      }

      localStorage.setItem(this._storageKey, JSON.stringify(state))
    } catch (error) {
      console.error('[FiscalYearContext] Save to storage error:', error)
    }
  }

  /**
   * Load from localStorage
   * @private
   */
  _loadFromStorage() {
    try {
      const stored = localStorage.getItem(this._storageKey)
      if (!stored) return

      const state = JSON.parse(stored)

      this._activeYear = state.activeYear
      this._mode = state.mode
      this._yearData = new Map(state.yearData || [])
      this._auditTrail = state.auditTrail || []
    } catch (error) {
      console.error('[FiscalYearContext] Load from storage error:', error)
    }
  }

  /**
   * Reset context (for testing)
   */
  reset() {
    this._activeYear = null
    this._availableYears = []
    this._yearData.clear()
    this._mode = FISCAL_YEAR_MODE.OPERATIONAL
    this._initialized = false
    this._auditTrail = []

    localStorage.removeItem(this._storageKey)

    this.removeAllListeners()
  }
}

/**
 * Singleton instance
 */
const fiscalYearContext = new FiscalYearContext()

export default fiscalYearContext

/**
 * React Hook for using Fiscal Year Context
 */
export const useFiscalYear = () => {
  // This will be implemented in a separate hook file
  // For now, return the context directly
  return fiscalYearContext
}
