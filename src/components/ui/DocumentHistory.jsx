/**
 * Document History Panel Component
 * Shows audit trail / change history for transactions
 */

import { useState, useEffect } from 'react'
import { History, ChevronDown, ChevronUp, User, Clock, FileText, Edit, Trash2, Printer, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { getDocumentHistory, formatAuditAction, AUDIT_ACTIONS } from '../../db/database'
import { formatTanggal } from '../../utils/formatters'

// Action icons mapping
const ActionIcon = ({ action }) => {
  const iconMap = {
    [AUDIT_ACTIONS.CREATE]: <FileText className="w-4 h-4 text-green-500" />,
    [AUDIT_ACTIONS.UPDATE]: <Edit className="w-4 h-4 text-blue-500" />,
    [AUDIT_ACTIONS.DELETE]: <Trash2 className="w-4 h-4 text-red-500" />,
    [AUDIT_ACTIONS.PRINT]: <Printer className="w-4 h-4 text-purple-500" />,
    [AUDIT_ACTIONS.STATUS_CHANGE]: <RefreshCw className="w-4 h-4 text-orange-500" />,
    [AUDIT_ACTIONS.APPROVE]: <CheckCircle className="w-4 h-4 text-green-500" />,
    [AUDIT_ACTIONS.REJECT]: <XCircle className="w-4 h-4 text-red-500" />
  }
  return iconMap[action] || <History className="w-4 h-4 text-gray-500" />
}

// Format field name for display
const formatFieldName = (field) => {
  const fieldLabels = {
    nomor: 'Nomor',
    tanggal: 'Tanggal',
    status: 'Status',
    keterangan: 'Keterangan',
    totalRealisasi: 'Total Realisasi',
    nilaiLS: 'Nilai LS',
    selisih: 'Selisih',
    statusSelisih: 'Status Selisih',
    kotaTujuan: 'Kota Tujuan',
    kotaAsal: 'Kota Asal',
    jenisPerjadin: 'Jenis Perjadin',
    honorBruto: 'Honor Bruto',
    honorNetto: 'Honor Netto',
    totalPotongan: 'Total Potongan',
    statusKelengkapan: 'Status Kelengkapan',
    itemLengkap: 'Item Lengkap',
    totalItem: 'Total Item',
    nama: 'Nama',
    nip: 'NIP',
    posisi: 'Posisi',
    unitKerja: 'Unit Kerja'
  }
  return fieldLabels[field] || field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

// Format value for display
const formatValue = (value) => {
  if (value === null || value === undefined) return '-'
  if (value instanceof Date) return formatTanggal(value)
  if (typeof value === 'object') return JSON.stringify(value)
  if (typeof value === 'number') {
    // Check if it looks like currency
    if (value > 1000) return new Intl.NumberFormat('id-ID').format(value)
    return value.toString()
  }
  return String(value)
}

// Single history entry component
const HistoryEntry = ({ entry, isExpanded, onToggle }) => {
  const hasChanges = entry.fieldChanges && entry.fieldChanges.length > 0

  return (
    <div className="border-l-2 border-gray-200 pl-4 pb-4 relative">
      {/* Timeline dot */}
      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
      </div>

      {/* Entry header */}
      <div
        className={`flex items-start justify-between ${hasChanges ? 'cursor-pointer' : ''}`}
        onClick={hasChanges ? onToggle : undefined}
      >
        <div className="flex items-start gap-3">
          <ActionIcon action={entry.action} />
          <div>
            <p className="font-medium text-gray-900">
              {formatAuditAction(entry.action)}
            </p>
            {entry.description && (
              <p className="text-sm text-gray-600">{entry.description}</p>
            )}
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {entry.createdBy || 'System'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTanggal(entry.createdAt)}
                {' '}
                {new Date(entry.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {hasChanges && (
          <button className="text-gray-400 hover:text-gray-600">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Expanded field changes */}
      {isExpanded && hasChanges && (
        <div className="mt-3 ml-7 bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-600 mb-2">Perubahan:</p>
          <div className="space-y-2">
            {entry.fieldChanges.map((change, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-medium text-gray-700">{formatFieldName(change.field)}:</span>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-red-600 line-through">{formatValue(change.oldValue)}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-green-600">{formatValue(change.newValue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Main DocumentHistory component
export default function DocumentHistory({ tableName, recordId, title = 'Riwayat Dokumen' }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [tableName, recordId])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await getDocumentHistory(tableName, recordId)
      setHistory(data)
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (id) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-500">
          <History className="w-4 h-4 animate-pulse" />
          <span>Memuat riwayat...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">{title}</h3>
          <span className="text-sm text-gray-500">({history.length} entri)</span>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4">
          {history.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Belum ada riwayat untuk dokumen ini
            </p>
          ) : (
            <div className="space-y-0">
              {history.map((entry) => (
                <HistoryEntry
                  key={entry.id}
                  entry={entry}
                  isExpanded={expandedIds.has(entry.id)}
                  onToggle={() => toggleExpanded(entry.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Compact inline history badge showing revision number
export function RevisionBadge({ revision, createdAt, updatedAt, createdBy }) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative inline-block">
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <History className="w-3 h-3" />
        Rev. {revision || 1}
      </span>

      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-50">
          <p><strong>Revisi:</strong> {revision || 1}</p>
          {createdAt && <p><strong>Dibuat:</strong> {formatTanggal(createdAt)}</p>}
          {updatedAt && <p><strong>Diperbarui:</strong> {formatTanggal(updatedAt)}</p>}
          {createdBy && <p><strong>Oleh:</strong> {createdBy}</p>}
        </div>
      )}
    </div>
  )
}

// Archive path display component
export function ArchivePathDisplay({ archivePath }) {
  if (!archivePath) return null

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <FileText className="w-3 h-3" />
      <span className="font-mono">{archivePath}</span>
    </div>
  )
}
