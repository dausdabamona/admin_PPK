/**
 * ============================================================================
 * useFiscalYear - React Hook for Fiscal Year Context
 * ============================================================================
 *
 * React hook untuk menggunakan FiscalYearContext dengan reactive updates.
 *
 * Features:
 * - Auto re-render saat tahun berganti
 * - Auto re-render saat mode berubah
 * - Cleanup on unmount
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react'
import fiscalYearContext, { FISCAL_YEAR_MODE, FISCAL_YEAR_STATUS } from '../services/fiscal/FiscalYearContext.js'

/**
 * useFiscalYear Hook
 *
 * @returns {Object} Fiscal year state and methods
 *
 * @example
 * const {
 *   activeYear,
 *   mode,
 *   isActive,
 *   isArchive,
 *   isReconstruction,
 *   availableYears,
 *   switchYear,
 *   setMode
 * } = useFiscalYear()
 */
export const useFiscalYear = () => {
  // State
  const [activeYear, setActiveYear] = useState(fiscalYearContext.getActiveYear())
  const [mode, setMode] = useState(fiscalYearContext.getMode())
  const [availableYears, setAvailableYears] = useState([])
  const [summary, setSummary] = useState(null)

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      await fiscalYearContext.initialize()
      setActiveYear(fiscalYearContext.getActiveYear())
      setMode(fiscalYearContext.getMode())
      setAvailableYears(fiscalYearContext.getAvailableYears())
      setSummary(fiscalYearContext.getSummary())
    }

    initialize()
  }, [])

  // Listen to year changes
  useEffect(() => {
    const handleYearChanged = (event) => {
      setActiveYear(event.newYear)
      setMode(event.mode)
      setAvailableYears(fiscalYearContext.getAvailableYears())
      setSummary(fiscalYearContext.getSummary())
    }

    const handleModeChanged = (event) => {
      setMode(event.newMode)
      setSummary(fiscalYearContext.getSummary())
    }

    fiscalYearContext.on('yearChanged', handleYearChanged)
    fiscalYearContext.on('modeChanged', handleModeChanged)

    return () => {
      fiscalYearContext.off('yearChanged', handleYearChanged)
      fiscalYearContext.off('modeChanged', handleModeChanged)
    }
  }, [])

  // Methods
  const switchYear = useCallback(async (year, reason) => {
    return await fiscalYearContext.switchYear(year, reason)
  }, [])

  const changeModeToReconstruction = useCallback(() => {
    return fiscalYearContext.setMode(FISCAL_YEAR_MODE.RECONSTRUCTION)
  }, [])

  const changeModeToArchive = useCallback(() => {
    return fiscalYearContext.setMode(FISCAL_YEAR_MODE.ARCHIVE)
  }, [])

  const changeModeToOperational = useCallback(() => {
    return fiscalYearContext.setMode(FISCAL_YEAR_MODE.OPERATIONAL)
  }, [])

  const createFilter = useCallback((additionalFilters) => {
    return fiscalYearContext.createFilter(additionalFilters)
  }, [activeYear])

  const wrapWithContext = useCallback((data) => {
    return fiscalYearContext.wrapWithContext(data)
  }, [activeYear, mode])

  // Computed values
  const isActive = fiscalYearContext.isActiveYear()
  const isArchive = fiscalYearContext.isArchiveMode()
  const isReconstruction = fiscalYearContext.isReconstructionMode()

  return {
    // State
    activeYear,
    mode,
    availableYears,
    summary,

    // Computed
    isActive,
    isArchive,
    isReconstruction,
    isOperational: mode === FISCAL_YEAR_MODE.OPERATIONAL,

    // Methods
    switchYear,
    changeModeToReconstruction,
    changeModeToArchive,
    changeModeToOperational,
    createFilter,
    wrapWithContext,

    // Context instance (for advanced usage)
    context: fiscalYearContext
  }
}

export default useFiscalYear
