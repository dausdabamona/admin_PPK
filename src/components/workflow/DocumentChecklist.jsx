import React, { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Upload,
  File,
  Trash2,
  Eye,
  Download
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

/**
 * DocumentChecklist - Smart checklist yang tidak memblokir
 *
 * Prinsip:
 * - Menampilkan status dokumen: wajib, dianjurkan, opsional
 * - User tetap bisa lanjut walau belum lengkap
 * - Visual feedback yang jelas
 * - Drag & drop support
 */
const DocumentChecklist = ({
  checklist = [],
  packageId,
  onUpload,
  onDelete,
  onStatusChange,
  mode = 'non-blocking' // 'non-blocking' | 'strict'
}) => {
  const [items, setItems] = useState(checklist)
  const [uploadingItem, setUploadingItem] = useState(null)
  const [stats, setStats] = useState({
    totalMandatory: 0,
    completedMandatory: 0,
    totalRecommended: 0,
    completedRecommended: 0,
    totalOptional: 0,
    completedOptional: 0,
    completionRate: 0
  })

  useEffect(() => {
    setItems(checklist)
    calculateStats(checklist)
  }, [checklist])

  const calculateStats = (items) => {
    const mandatory = items.filter(item => item.category === 'mandatory')
    const recommended = items.filter(item => item.category === 'recommended')
    const optional = items.filter(item => item.category === 'optional')

    const completedMandatory = mandatory.filter(item => item.status === 'completed').length
    const completedRecommended = recommended.filter(item => item.status === 'completed').length
    const completedOptional = optional.filter(item => item.status === 'completed').length

    const totalCompleted = completedMandatory + completedRecommended + completedOptional
    const total = items.length
    const completionRate = total > 0 ? Math.round((totalCompleted / total) * 100) : 0

    setStats({
      totalMandatory: mandatory.length,
      completedMandatory,
      totalRecommended: recommended.length,
      completedRecommended,
      totalOptional: optional.length,
      completedOptional,
      completionRate
    })

    if (onStatusChange) {
      onStatusChange({
        isComplete: completedMandatory === mandatory.length,
        stats: {
          ...stats,
          completionRate
        }
      })
    }
  }

  const handleFileUpload = async (item, file) => {
    if (!file) return

    setUploadingItem(item.code)

    try {
      // Call parent upload handler
      if (onUpload) {
        await onUpload(item, file)
      }

      // Update status lokal
      const updatedItems = items.map(i =>
        i.code === item.code
          ? { ...i, status: 'completed', uploadedAt: new Date() }
          : i
      )
      setItems(updatedItems)
      calculateStats(updatedItems)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploadingItem(null)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm('Hapus dokumen ini?')) return

    try {
      if (onDelete) {
        await onDelete(item)
      }

      const updatedItems = items.map(i =>
        i.code === item.code
          ? { ...i, status: 'pending', uploadedAt: null }
          : i
      )
      setItems(updatedItems)
      calculateStats(updatedItems)
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'mandatory': return 'WAJIB'
      case 'recommended': return 'DIANJURKAN'
      case 'optional': return 'OPSIONAL'
      default: return 'LAINNYA'
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'mandatory': return 'red'
      case 'recommended': return 'yellow'
      case 'optional': return 'blue'
      default: return 'gray'
    }
  }

  const renderProgressBar = () => {
    const { completionRate } = stats
    let barColor = 'bg-red-500'
    if (completionRate >= 80) barColor = 'bg-green-500'
    else if (completionRate >= 50) barColor = 'bg-yellow-500'

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress Kelengkapan</span>
          <span className="text-sm font-bold text-gray-900">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-600">
          {stats.completedMandatory === stats.totalMandatory ? (
            <span className="text-green-600 font-medium">
              ✓ Semua dokumen wajib sudah lengkap
            </span>
          ) : (
            <span className="text-red-600 font-medium">
              ⚠️ {stats.totalMandatory - stats.completedMandatory} dokumen wajib belum diunggah
            </span>
          )}
        </div>
      </div>
    )
  }

  const renderItem = (item) => {
    const isCompleted = item.status === 'completed'
    const isUploading = uploadingItem === item.code

    return (
      <div
        key={item.code}
        className={`
          flex items-start gap-4 p-4 rounded-lg border-2 transition-all
          ${isCompleted
            ? 'bg-green-50 border-green-200'
            : 'bg-white border-gray-200 hover:border-gray-300'
          }
        `}
      >
        {/* Icon Status */}
        <div className="flex-shrink-0 pt-1">
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          ) : item.category === 'mandatory' ? (
            <AlertCircle className="w-6 h-6 text-red-500" />
          ) : (
            <Circle className="w-6 h-6 text-gray-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900">{item.label}</h4>
                <Badge color={getCategoryColor(item.category)} size="sm">
                  {getCategoryLabel(item.category)}
                </Badge>
              </div>
              {item.description && (
                <p className="text-sm text-gray-600">{item.description}</p>
              )}
              {item.uploadedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Diunggah: {new Date(item.uploadedAt).toLocaleString('id-ID')}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {/* View file */}}
                    title="Lihat dokumen"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDelete(item)}
                    title="Hapus dokumen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(item, file)
                    }}
                    disabled={isUploading}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isUploading}
                    as="span"
                  >
                    {isUploading ? (
                      <>Mengunggah...</>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Unggah
                      </>
                    )}
                  </Button>
                </label>
              )}
            </div>
          </div>

          {/* Catatan untuk item tertentu */}
          {item.note && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              💡 <strong>Catatan:</strong> {item.note}
            </div>
          )}
        </div>
      </div>
    )
  }

  const groupedItems = {
    mandatory: items.filter(i => i.category === 'mandatory'),
    recommended: items.filter(i => i.category === 'recommended'),
    optional: items.filter(i => i.category === 'optional')
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-xs text-red-600 font-medium mb-1">WAJIB</div>
          <div className="text-2xl font-bold text-red-900">
            {stats.completedMandatory}/{stats.totalMandatory}
          </div>
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-xs text-yellow-600 font-medium mb-1">DIANJURKAN</div>
          <div className="text-2xl font-bold text-yellow-900">
            {stats.completedRecommended}/{stats.totalRecommended}
          </div>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs text-blue-600 font-medium mb-1">OPSIONAL</div>
          <div className="text-2xl font-bold text-blue-900">
            {stats.completedOptional}/{stats.totalOptional}
          </div>
        </div>
      </div>

      {/* Checklist Items - Mandatory */}
      {groupedItems.mandatory.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Dokumen Wajib
          </h3>
          <div className="space-y-3">
            {groupedItems.mandatory.map(renderItem)}
          </div>
        </div>
      )}

      {/* Checklist Items - Recommended */}
      {groupedItems.recommended.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Dokumen Dianjurkan
          </h3>
          <div className="space-y-3">
            {groupedItems.recommended.map(renderItem)}
          </div>
        </div>
      )}

      {/* Checklist Items - Optional */}
      {groupedItems.optional.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Dokumen Opsional
          </h3>
          <div className="space-y-3">
            {groupedItems.optional.map(renderItem)}
          </div>
        </div>
      )}

      {/* Footer Message */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            {mode === 'non-blocking' ? (
              <>
                <p className="font-medium mb-1">⚠️ Anda tetap bisa melanjutkan walau belum lengkap</p>
                <p>
                  Dokumen yang belum diunggah dapat ditambahkan kapan saja dari menu <strong>Arsip SPJ</strong>.
                  Sistem hanya memberi saran dan tidak akan menghambat proses Anda.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium mb-1">⚠️ Dokumen wajib harus lengkap</p>
                <p>
                  Untuk melanjutkan, pastikan semua dokumen wajib sudah diunggah.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentChecklist
