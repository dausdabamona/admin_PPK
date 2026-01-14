import React, { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Package,
  Download,
  Eye,
  FileText,
  Upload,
  Calendar,
  CheckCircle,
  AlertCircle,
  Archive,
  Clock,
  User,
  Activity,
  FolderOpen,
  Shield
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '../ui/Card'
import SPJPackageService from '../../services/SPJPackageService'
import { formatRupiah, formatTanggal } from '../../utils/formatters'

/**
 * SPJPackageBuilder - Complete SPJ Package Manager
 *
 * Features:
 * - Package overview dengan statistik lengkap
 * - Document list (generated + uploaded)
 * - Audit trail lengkap
 * - Chronology timeline
 * - One-click ZIP download
 * - Audit mode untuk review
 */
const SPJPackageBuilder = ({ packageId, mode = 'normal' }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [packageData, setPackageData] = useState(null)
  const [auditTrail, setAuditTrail] = useState([])
  const [chronology, setChronology] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPackageData()
  }, [packageId])

  const loadPackageData = async () => {
    setIsLoading(true)
    try {
      // Load package with enrichment
      const result = await SPJPackageService.getPackage(packageId, {
        enrich: true,
        validate: true,
        summary: true
      })

      if (result.success) {
        setPackageData(result.package)

        // Load audit trail
        const auditResult = await SPJPackageService.getAuditTrail(packageId)
        if (auditResult.success) {
          setAuditTrail(auditResult.auditTrail)
        }

        // Load chronology
        const chronResult = await SPJPackageService.getChronology(packageId)
        if (chronResult.success) {
          setChronology(chronResult.chronology)
        }
      }
    } catch (error) {
      console.error('Error loading package:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadZip = async () => {
    try {
      const result = await SPJPackageService.downloadPackageZip(packageId)
      if (result.success) {
        alert(`✅ Paket berhasil diunduh!\n\nFile: ${result.filename}`)
        // Reload to update audit trail
        loadPackageData()
      } else {
        alert(`❌ Gagal mengunduh: ${result.error}`)
      }
    } catch (error) {
      console.error('Download error:', error)
      alert(`❌ Gagal mengunduh: ${error.message}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data paket...</p>
        </div>
      </div>
    )
  }

  if (!packageData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Paket tidak ditemukan</p>
      </div>
    )
  }

  const isAuditMode = mode === 'audit'

  return (
    <div className="space-y-6">
      {/* Package Header */}
      <Card className={isAuditMode ? 'border-2 border-yellow-500' : ''}>
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {packageData.packageCode}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(packageData.status)}`}>
                    {getStatusLabel(packageData.status)}
                  </span>
                  {isAuditMode && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Mode Audit
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{packageData.title}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    TA {packageData.year}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {packageData.createdBy}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTanggal(packageData.createdAt, 'long')}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleDownloadZip}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download ZIP
            </button>
          </div>
        </CardHeader>

        {/* Tab Navigation */}
        <CardBody className="p-0">
          <div className="border-b">
            <nav className="flex gap-1 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'documents', label: 'Dokumen', icon: FileText },
                { id: 'checklist', label: 'Checklist', icon: CheckCircle },
                { id: 'audit', label: 'Audit Trail', icon: Activity },
                { id: 'timeline', label: 'Kronologi', icon: Calendar }
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600 font-medium'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <OverviewTab packageData={packageData} />
            )}
            {activeTab === 'documents' && (
              <DocumentsTab packageData={packageData} />
            )}
            {activeTab === 'checklist' && (
              <ChecklistTab packageData={packageData} />
            )}
            {activeTab === 'audit' && (
              <AuditTrailTab auditTrail={auditTrail} />
            )}
            {activeTab === 'timeline' && (
              <TimelineTab chronology={chronology} />
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

// ==================== TAB COMPONENTS ====================

const OverviewTab = ({ packageData }) => {
  const stats = [
    {
      label: 'Total Dokumen',
      value: (packageData.generatedDocuments?.length || 0) + (packageData.uploadedDocuments?.length || 0),
      icon: FileText,
      color: 'blue'
    },
    {
      label: 'Dokumen Ter-generate',
      value: packageData.generatedDocuments?.length || 0,
      icon: FileText,
      color: 'green'
    },
    {
      label: 'Dokumen Diunggah',
      value: packageData.uploadedDocuments?.length || 0,
      icon: Upload,
      color: 'purple'
    },
    {
      label: 'Kelengkapan',
      value: `${packageData.checklist?.completionRate || 0}%`,
      icon: CheckCircle,
      color: 'orange'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          const colors = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            orange: 'bg-orange-100 text-orange-600'
          }
          return (
            <div key={idx} className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[stat.color]}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </div>
          )
        })}
      </div>

      {/* Package Information */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Informasi Paket</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow label="Kode Paket" value={packageData.packageCode} />
          <InfoRow label="Jenis Proses" value={getProcessLabel(packageData.processType)} />
          <InfoRow label="Tahun Anggaran" value={packageData.year} />
          <InfoRow label="Status" value={getStatusLabel(packageData.status)} />
          <InfoRow label="Dibuat" value={formatTanggal(packageData.createdAt, 'long')} />
          <InfoRow label="Diperbarui" value={formatTanggal(packageData.updatedAt, 'long')} />
          {packageData.completedAt && (
            <InfoRow label="Diselesaikan" value={formatTanggal(packageData.completedAt, 'long')} />
          )}
          {packageData.archivedAt && (
            <InfoRow label="Diarsipkan" value={formatTanggal(packageData.archivedAt, 'long')} />
          )}
        </div>
      </div>

      {/* Data Summary (if enriched) */}
      {packageData.summary && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Ringkasan Data</h3>
          <div className="space-y-2 text-sm">
            {packageData.summary.kegiatan && (
              <div>
                <span className="font-medium">Kegiatan:</span> {packageData.summary.kegiatan}
              </div>
            )}
            {packageData.summary.kontrak && (
              <div>
                <span className="font-medium">Kontrak:</span> {packageData.summary.kontrak}
              </div>
            )}
            {packageData.summary.nilai && (
              <div>
                <span className="font-medium">Nilai:</span> {formatRupiah(packageData.summary.nilai)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Validation Results */}
      {packageData.validation && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Validasi Data</h3>
          {packageData.validation.isValid ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span>Data lengkap dan valid</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-yellow-600 mb-3">
                <AlertCircle className="w-5 h-5" />
                <span>Terdapat beberapa peringatan</span>
              </div>
              <ul className="space-y-1 text-sm text-gray-600 ml-7">
                {packageData.validation.warnings?.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const DocumentsTab = ({ packageData }) => {
  const generatedDocs = packageData.generatedDocuments || []
  const uploadedDocs = packageData.uploadedDocuments || []

  return (
    <div className="space-y-6">
      {/* Generated Documents */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          Dokumen Ter-generate ({generatedDocs.length})
        </h3>
        {generatedDocs.length > 0 ? (
          <div className="space-y-2">
            {generatedDocs.map((doc, idx) => (
              <div key={idx} className="bg-white border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{doc.filename}</div>
                    <div className="text-xs text-gray-500">
                      {doc.templateName} • {formatTanggal(doc.generatedAt, 'long')}
                    </div>
                  </div>
                </div>
                <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">
                  Preview
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Belum ada dokumen ter-generate</p>
          </div>
        )}
      </div>

      {/* Uploaded Documents */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Upload className="w-5 h-5 text-purple-600" />
          Dokumen Diunggah ({uploadedDocs.length})
        </h3>
        {uploadedDocs.length > 0 ? (
          <div className="space-y-2">
            {uploadedDocs.map((doc, idx) => (
              <div key={idx} className="bg-white border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{doc.filename}</div>
                    <div className="text-xs text-gray-500">
                      {(doc.size / 1024).toFixed(2)} KB • {formatTanggal(doc.uploadedAt, 'long')}
                    </div>
                  </div>
                </div>
                <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">
                  Download
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Belum ada dokumen diunggah</p>
          </div>
        )}
      </div>
    </div>
  )
}

const ChecklistTab = ({ packageData }) => {
  const checklist = packageData.checklist || {}
  const items = checklist.items || []

  // Group by category
  const grouped = {
    mandatory: items.filter(i => i.category === 'mandatory'),
    recommended: items.filter(i => i.category === 'recommended'),
    optional: items.filter(i => i.category === 'optional')
  }

  const renderGroup = (title, items, color) => {
    if (items.length === 0) return null

    const completed = items.filter(i => i.status === 'completed').length

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className={`font-semibold text-${color}-900`}>{title}</h4>
          <span className="text-sm text-gray-600">
            {completed}/{items.length} selesai
          </span>
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className={`bg-white border-l-4 border-${color}-500 rounded p-3 flex items-start gap-3`}>
              <div className="mt-0.5">
                {item.status === 'completed' ? (
                  <CheckCircle className={`w-5 h-5 text-${color}-600`} />
                ) : (
                  <div className={`w-5 h-5 rounded-full border-2 border-gray-300`}></div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.label}</div>
                {item.description && (
                  <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                )}
                {item.completedAt && (
                  <div className="text-xs text-gray-500 mt-1">
                    Diselesaikan: {formatTanggal(item.completedAt, 'long')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Progress Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Progress Checklist</h3>
          <span className="text-2xl font-bold text-blue-600">
            {checklist.completionRate || 0}%
          </span>
        </div>
        <div className="w-full bg-white rounded-full h-3 mb-4">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all"
            style={{ width: `${checklist.completionRate || 0}%` }}
          ></div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Wajib</div>
            <div className="font-semibold text-gray-900">
              {checklist.mandatoryComplete || 0}/{checklist.mandatoryTotal || 0}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Dianjurkan</div>
            <div className="font-semibold text-gray-900">
              {checklist.recommendedComplete || 0}/{checklist.recommendedTotal || 0}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Opsional</div>
            <div className="font-semibold text-gray-900">
              {checklist.optionalComplete || 0}/{checklist.optionalTotal || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      {renderGroup('Dokumen Wajib', grouped.mandatory, 'red')}
      {renderGroup('Dokumen Dianjurkan', grouped.recommended, 'yellow')}
      {renderGroup('Dokumen Opsional', grouped.optional, 'blue')}

      {items.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Checklist belum dikonfigurasi</p>
        </div>
      )}
    </div>
  )
}

const AuditTrailTab = ({ auditTrail }) => {
  return (
    <div className="space-y-3">
      {auditTrail.length > 0 ? (
        auditTrail.map((entry, idx) => (
          <div key={idx} className="bg-white border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 ${getActionColor(entry.action)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="font-medium text-gray-900">{entry.description}</div>
                    <div className="text-sm text-gray-600">
                      {entry.user} • {formatTanggal(entry.timestamp, 'full')}
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {entry.action}
                  </span>
                </div>
                {entry.changes && entry.changes.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                    <div className="font-medium text-gray-700 mb-2">Perubahan:</div>
                    <div className="space-y-1">
                      {entry.changes.map((change, cidx) => (
                        <div key={cidx} className="text-gray-600">
                          <span className="font-medium">{change.field}:</span>{' '}
                          <span className="line-through text-gray-400">
                            {JSON.stringify(change.oldValue)}
                          </span>
                          {' → '}
                          <span className="text-green-600">
                            {JSON.stringify(change.newValue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Belum ada audit trail</p>
        </div>
      )}
    </div>
  )
}

const TimelineTab = ({ chronology }) => {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

      <div className="space-y-6">
        {chronology.length > 0 ? (
          chronology.map((event, idx) => (
            <div key={idx} className="relative flex items-start gap-4 pl-0">
              {/* Timeline dot */}
              <div className={`relative z-10 w-12 h-12 ${getEventColor(event.color)} rounded-full flex items-center justify-center flex-shrink-0`}>
                <Calendar className="w-6 h-6 text-white" />
              </div>

              {/* Event card */}
              <div className="flex-1 bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{event.event}</div>
                    <div className="text-sm text-gray-600">
                      {formatTanggal(event.timestamp, 'full')}
                    </div>
                  </div>
                  <span className={`px-2 py-1 ${getEventBadge(event.color)} text-xs rounded`}>
                    {event.icon}
                  </span>
                </div>
                {event.details && (
                  <div className="mt-2 text-sm text-gray-600">
                    {JSON.stringify(event.details)}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">Belum ada kronologi</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== HELPER COMPONENTS ====================

const InfoRow = ({ label, value }) => (
  <div className="flex items-start gap-2">
    <span className="text-sm text-gray-600 w-32 flex-shrink-0">{label}:</span>
    <span className="text-sm font-medium text-gray-900">{value}</span>
  </div>
)

// ==================== HELPER FUNCTIONS ====================

const getStatusBadge = (status) => {
  const badges = {
    draft: 'bg-gray-100 text-gray-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    archived: 'bg-purple-100 text-purple-700'
  }
  return badges[status] || badges.draft
}

const getStatusLabel = (status) => {
  const labels = {
    draft: 'Draft',
    'in-progress': 'Dalam Progress',
    completed: 'Selesai',
    archived: 'Terarsip'
  }
  return labels[status] || status
}

const getProcessLabel = (processType) => {
  const labels = {
    'up-tup': 'UP/TUP',
    'ls-kontrak': 'LS Kontrak',
    'swakelola': 'Swakelola',
    'perjadin': 'Perjalanan Dinas',
    'pjlp': 'Honor/PJLP'
  }
  return labels[processType] || processType
}

const getActionColor = (action) => {
  const colors = {
    CREATE: 'bg-blue-100 text-blue-600',
    UPDATE: 'bg-yellow-100 text-yellow-600',
    UPDATE_STEP: 'bg-blue-100 text-blue-600',
    GENERATE_DOCS: 'bg-green-100 text-green-600',
    UPLOAD_DOC: 'bg-purple-100 text-purple-600',
    DELETE_DOC: 'bg-red-100 text-red-600',
    ARCHIVE: 'bg-purple-100 text-purple-600',
    DOWNLOAD_ZIP: 'bg-blue-100 text-blue-600'
  }
  return colors[action] || 'bg-gray-100 text-gray-600'
}

const getEventColor = (color) => {
  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
    red: 'bg-red-600',
    gray: 'bg-gray-600'
  }
  return colors[color] || 'bg-gray-600'
}

const getEventBadge = (color) => {
  const badges = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-700'
  }
  return badges[color] || 'bg-gray-100 text-gray-700'
}

export default SPJPackageBuilder
