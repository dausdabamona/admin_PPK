import { CheckCircle2, AlertCircle, FileText, ChevronRight, Clock } from 'lucide-react'
import { Card, CardBody } from './Card'

/**
 * ChecklistSummaryCard - Compact Checklist Summary Component
 *
 * Menampilkan ringkasan checklist dengan dokumen yang belum lengkap
 * tanpa harus membuka detail checklist
 *
 * Features:
 * - Visual progress bar
 * - List dokumen yang belum lengkap (max 5, sisanya collapsed)
 * - Badge status (lengkap/tidak lengkap)
 * - Quick action button
 * - Categorized by mandatory/optional
 *
 * Usage:
 * <ChecklistSummaryCard
 *   isComplete={false}
 *   completionPercent={60}
 *   missingDocs={['Dokumen A', 'Dokumen B']}
 *   mandatoryCount={2}
 *   optionalCount={3}
 *   onViewDetail={() => navigate('/checklist')}
 * />
 */
export default function ChecklistSummaryCard({
  isComplete = false,
  completionPercent = 0,
  missingDocs = [],
  mandatoryMissing = [],
  optionalMissing = [],
  totalMandatory = 0,
  totalOptional = 0,
  lastUpdated = null,
  onViewDetail = null,
  compact = false,
  className = ''
}) {
  // Calculate counts
  const mandatoryCount = mandatoryMissing?.length || 0
  const optionalCount = optionalMissing?.length || 0
  const totalMissing = missingDocs?.length || (mandatoryCount + optionalCount)

  // Determine status color
  const getStatusColor = () => {
    if (isComplete) return 'green'
    if (completionPercent >= 80) return 'blue'
    if (completionPercent >= 50) return 'yellow'
    return 'red'
  }

  const statusColor = getStatusColor()

  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      badge: 'bg-green-100 text-green-800',
      progress: 'bg-green-500'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      badge: 'bg-blue-100 text-blue-800',
      progress: 'bg-blue-500'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      badge: 'bg-yellow-100 text-yellow-800',
      progress: 'bg-yellow-500'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      badge: 'bg-red-100 text-red-800',
      progress: 'bg-red-500'
    }
  }

  const colors = colorClasses[statusColor]

  // Format last updated
  const formatLastUpdated = (date) => {
    if (!date) return null
    const d = new Date(date)
    const now = new Date()
    const diffHours = Math.floor((now - d) / (1000 * 60 * 60))

    if (diffHours < 1) return 'Baru saja'
    if (diffHours < 24) return `${diffHours} jam lalu`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} hari lalu`
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Compact version (for cards/tables)
  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Progress Badge */}
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          )}
          <span className={`text-sm font-medium ${isComplete ? 'text-green-700' : 'text-yellow-700'}`}>
            {completionPercent}%
          </span>
        </div>

        {/* Missing count */}
        {!isComplete && totalMissing > 0 && (
          <span className="text-xs text-gray-600">
            {totalMissing} dokumen belum lengkap
          </span>
        )}

        {/* View detail button */}
        {onViewDetail && (
          <button
            onClick={onViewDetail}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Lihat <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    )
  }

  // Full version
  return (
    <Card className={`${colors.bg} ${colors.border} border ${className}`}>
      <CardBody className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {isComplete ? (
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-yellow-600" />
              </div>
            )}
            <div>
              <h4 className={`font-semibold ${colors.text}`}>
                Kelengkapan Checklist SPJ
              </h4>
              {lastUpdated && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {formatLastUpdated(lastUpdated)}
                </p>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
            {isComplete ? '✓ Lengkap' : `${completionPercent}%`}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span className="font-medium">{completionPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${colors.progress}`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Summary Stats */}
        {!isComplete && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Mandatory Missing */}
            {mandatoryCount > 0 && (
              <div className="bg-white rounded-lg p-2 border border-red-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Wajib Kurang</p>
                    <p className="text-lg font-bold text-red-600">{mandatoryCount}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Optional Missing */}
            {optionalCount > 0 && (
              <div className="bg-white rounded-lg p-2 border border-yellow-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                    <FileText className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Opsional Kurang</p>
                    <p className="text-lg font-bold text-yellow-600">{optionalCount}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Missing Documents List */}
        {!isComplete && missingDocs && missingDocs.length > 0 && (
          <div className="mb-3">
            <p className={`text-sm font-medium ${colors.text} mb-2`}>
              Dokumen yang belum lengkap:
            </p>
            <ul className="space-y-1.5">
              {missingDocs.slice(0, 5).map((doc, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <span className="text-red-500 mt-0.5">•</span>
                  <span className="flex-1">{doc}</span>
                </li>
              ))}
              {missingDocs.length > 5 && (
                <li className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <span>•</span>
                  <span>...dan {missingDocs.length - 5} dokumen lainnya</span>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Mandatory Missing (Categorized) */}
        {!isComplete && mandatoryMissing && mandatoryMissing.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Dokumen Wajib yang Belum Lengkap:
            </p>
            <ul className="space-y-1.5">
              {mandatoryMissing.slice(0, 3).map((doc, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-gray-700 bg-red-50 rounded px-2 py-1"
                >
                  <span className="text-red-600 font-bold mt-0.5">!</span>
                  <span className="flex-1">{doc}</span>
                </li>
              ))}
              {mandatoryMissing.length > 3 && (
                <li className="text-sm text-red-600 font-medium px-2">
                  +{mandatoryMissing.length - 3} dokumen wajib lainnya
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Optional Missing (Categorized) */}
        {!isComplete && optionalMissing && optionalMissing.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium text-yellow-700 mb-2">
              Dokumen Opsional yang Belum Lengkap:
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              {optionalMissing.slice(0, 2).map((doc, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">○</span>
                  <span className="flex-1">{doc}</span>
                </li>
              ))}
              {optionalMissing.length > 2 && (
                <li className="text-xs text-gray-500 italic px-2">
                  +{optionalMissing.length - 2} dokumen opsional lainnya
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Success Message */}
        {isComplete && (
          <div className="bg-white rounded-lg p-3 border border-green-300">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              <div>
                <p className="font-medium text-sm">Checklist SPJ Lengkap</p>
                <p className="text-xs text-green-600">
                  Semua dokumen wajib telah dilengkapi. Pembayaran dapat dilanjutkan.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {onViewDetail && (
          <button
            onClick={onViewDetail}
            className={`w-full mt-3 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
              isComplete
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isComplete ? 'Lihat Detail Checklist' : 'Lengkapi Checklist Sekarang'}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Warning Message */}
        {!isComplete && mandatoryCount > 0 && (
          <div className="mt-3 text-xs text-gray-600 bg-white rounded p-2 border border-gray-200">
            <span className="font-medium text-gray-700">⚠️ Catatan:</span> Pembayaran dan cetak kwitansi tidak dapat dilakukan sampai semua dokumen wajib dilengkapi (100%).
          </div>
        )}
      </CardBody>
    </Card>
  )
}

/**
 * ChecklistInlineStatus - Inline compact status untuk table rows
 */
export function ChecklistInlineStatus({
  isComplete,
  completionPercent,
  missingCount,
  onViewDetail,
  className = ''
}) {
  if (isComplete) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Lengkap
        </span>
        {onViewDetail && (
          <button
            onClick={onViewDetail}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Lihat
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <AlertCircle className="w-3 h-3 mr-1" />
        {completionPercent}%
      </span>
      {missingCount > 0 && (
        <span className="text-xs text-gray-500">
          {missingCount} kurang
        </span>
      )}
      {onViewDetail && (
        <button
          onClick={onViewDetail}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Lengkapi
        </button>
      )}
    </div>
  )
}

/**
 * ChecklistQuickPreview - Tooltip/Popover preview of missing docs
 */
export function ChecklistQuickPreview({ missingDocs, position = 'bottom' }) {
  if (!missingDocs || missingDocs.length === 0) return null

  return (
    <div className="absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-64">
      <p className="text-xs font-medium text-gray-700 mb-2">
        Dokumen yang belum lengkap:
      </p>
      <ul className="space-y-1 text-xs text-gray-600">
        {missingDocs.slice(0, 5).map((doc, idx) => (
          <li key={idx} className="flex items-start gap-1">
            <span className="text-red-500">•</span>
            <span>{doc}</span>
          </li>
        ))}
        {missingDocs.length > 5 && (
          <li className="text-gray-500 italic">
            +{missingDocs.length - 5} lainnya
          </li>
        )}
      </ul>
    </div>
  )
}
