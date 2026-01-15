/**
 * ============================================================================
 * FISCAL YEAR SWITCHER - Header Component
 * ============================================================================
 *
 * Komponen UI untuk switching tahun anggaran di header aplikasi.
 *
 * Features:
 * - Dropdown untuk memilih tahun anggaran
 * - Visual indicator untuk status tahun (Aktif/Arsip/Rekonstruksi)
 * - Auto-reload data saat tahun berganti
 * - Responsive design
 *
 * Integration:
 * - Gunakan di AppHeader atau MainLayout
 * - Otomatis trigger reload workflow, compliance, dan data lainnya
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import React, { useState } from 'react'
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Chip,
  Badge,
  Spinner
} from '@nextui-org/react'
import {
  Calendar,
  CheckCircle2,
  Archive,
  Wrench,
  ChevronDown,
  AlertCircle
} from 'lucide-react'

import { useFiscalYear } from '../../hooks/useFiscalYear.js'
import { FISCAL_YEAR_MODE } from '../../services/fiscal/FiscalYearContext.js'

/**
 * Get visual config for year mode
 */
const getModeConfig = (mode, isActive) => {
  if (isActive) {
    return {
      label: 'Aktif',
      color: 'success',
      icon: CheckCircle2,
      bgColor: 'bg-green-500',
      textColor: 'text-green-600',
      description: 'Tahun anggaran berjalan'
    }
  }

  if (mode === FISCAL_YEAR_MODE.RECONSTRUCTION) {
    return {
      label: 'Rekonstruksi',
      color: 'warning',
      icon: Wrench,
      bgColor: 'bg-orange-500',
      textColor: 'text-orange-600',
      description: 'Mode penyempurnaan administrasi'
    }
  }

  return {
    label: 'Arsip',
    color: 'primary',
    icon: Archive,
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-600',
    description: 'Arsip tahun anggaran lampau'
  }
}

/**
 * Generate available years (2015 - current year + 1)
 */
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const startYear = 2015
  const endYear = currentYear + 1
  const years = []

  for (let year = endYear; year >= startYear; year--) {
    years.push(year)
  }

  return years
}

/**
 * MAIN COMPONENT: FiscalYearSwitcher
 */
const FiscalYearSwitcher = ({
  size = 'md',
  variant = 'flat',
  showDescription = true,
  compact = false,
  onYearChange
}) => {
  const {
    activeYear,
    mode,
    isActive,
    isArchive,
    isReconstruction,
    switchYear
  } = useFiscalYear()

  const [isSwitching, setIsSwitching] = useState(false)
  const [switchError, setSwi<bError] = useState(null)

  const yearOptions = generateYearOptions()
  const modeConfig = getModeConfig(mode, isActive)
  const ModeIcon = modeConfig.icon

  /**
   * Handle year switch
   */
  const handleYearSwitch = async (selectedYear) => {
    if (selectedYear === activeYear) return

    try {
      setIsSwitching(true)
      setSwitchError(null)

      await switchYear(selectedYear, 'User switch from header')

      // Callback to parent (if needed for additional actions)
      if (onYearChange) {
        onYearChange(selectedYear)
      }

      console.log(`[FiscalYearSwitcher] Switched to TA ${selectedYear}`)
    } catch (error) {
      console.error('[FiscalYearSwitcher] Switch error:', error)
      setSwitchError(error.message)
    } finally {
      setIsSwitching(false)
    }
  }

  // Compact mode (just a button with year)
  if (compact) {
    return (
      <Dropdown>
        <DropdownTrigger>
          <Button
            variant={variant}
            size={size}
            startContent={<Calendar className="w-4 h-4" />}
            endContent={<ChevronDown className="w-4 h-4" />}
            isLoading={isSwitching}
          >
            TA {activeYear}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Pilih Tahun Anggaran"
          selectedKeys={[String(activeYear)]}
          onAction={(key) => handleYearSwitch(Number(key))}
        >
          {yearOptions.map(year => {
            const isCurrent = year === new Date().getFullYear()
            return (
              <DropdownItem
                key={String(year)}
                description={isCurrent ? 'Tahun berjalan' : undefined}
                startContent={
                  year === activeYear ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : null
                }
              >
                TA {year}
              </DropdownItem>
            )
          })}
        </DropdownMenu>
      </Dropdown>
    )
  }

  // Full mode (with status indicator and description)
  return (
    <div className="flex items-center gap-3">
      {/* Year Switcher Dropdown */}
      <Dropdown>
        <DropdownTrigger>
          <Button
            variant={variant}
            size={size}
            startContent={
              isSwitching ? (
                <Spinner size="sm" />
              ) : (
                <Calendar className="w-4 h-4" />
              )
            }
            endContent={<ChevronDown className="w-4 h-4" />}
            className="min-w-[180px]"
            isDisabled={isSwitching}
          >
            <div className="flex flex-col items-start">
              <span className="text-xs opacity-70">Tahun Anggaran</span>
              <span className="font-bold">TA {activeYear}</span>
            </div>
          </Button>
        </DropdownTrigger>

        <DropdownMenu
          aria-label="Pilih Tahun Anggaran"
          selectedKeys={[String(activeYear)]}
          onAction={(key) => handleYearSwitch(Number(key))}
          className="max-h-96 overflow-auto"
        >
          {yearOptions.map(year => {
            const isCurrent = year === new Date().getFullYear()
            const isSelected = year === activeYear

            return (
              <DropdownItem
                key={String(year)}
                description={
                  isCurrent
                    ? '✓ Tahun anggaran berjalan'
                    : year > new Date().getFullYear()
                    ? 'Tahun anggaran mendatang'
                    : 'Tahun anggaran lampau'
                }
                startContent={
                  isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : isCurrent ? (
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  ) : null
                }
                className={isSelected ? 'bg-primary-50' : ''}
              >
                <span className={isSelected ? 'font-semibold' : ''}>
                  TA {year}
                </span>
              </DropdownItem>
            )
          })}
        </DropdownMenu>
      </Dropdown>

      {/* Status Indicator */}
      <Badge
        content={<ModeIcon className="w-3 h-3" />}
        color={modeConfig.color}
        placement="top-right"
        shape="circle"
        size="sm"
      >
        <Chip
          color={modeConfig.color}
          variant="flat"
          size="sm"
          startContent={<ModeIcon className="w-3.5 h-3.5" />}
        >
          {modeConfig.label}
        </Chip>
      </Badge>

      {/* Error Indicator */}
      {switchError && (
        <Chip
          color="danger"
          variant="flat"
          size="sm"
          startContent={<AlertCircle className="w-3.5 h-3.5" />}
          onClose={() => setSwitchError(null)}
        >
          Switch Error
        </Chip>
      )}
    </div>
  )
}

export default FiscalYearSwitcher

/**
 * =============================================================================
 * USAGE EXAMPLES
 * =============================================================================
 *
 * // 1. Full mode di AppHeader
 * import FiscalYearSwitcher from './components/fiscal/FiscalYearSwitcher.jsx'
 *
 * function AppHeader() {
 *   return (
 *     <header className="flex items-center justify-between p-4">
 *       <Logo />
 *       <FiscalYearSwitcher
 *         onYearChange={(year) => {
 *           console.log('Year changed to:', year)
 *           // Optionally trigger additional reloads
 *         }}
 *       />
 *       <UserMenu />
 *     </header>
 *   )
 * }
 *
 * // 2. Compact mode di Navbar
 * function Navbar() {
 *   return (
 *     <nav>
 *       <FiscalYearSwitcher compact={true} size="sm" />
 *     </nav>
 *   )
 * }
 *
 * // 3. Custom styling
 * function CustomHeader() {
 *   return (
 *     <FiscalYearSwitcher
 *       size="lg"
 *       variant="bordered"
 *       showDescription={true}
 *     />
 *   )
 * }
 *
 * =============================================================================
 */
