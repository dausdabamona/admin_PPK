import React, { useState } from 'react'
import { Check, AlertCircle, Package, Download, FileText } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { extractSummary } from '../../../../utils/workflow/dataMapper'

/**
 * Step 7: Review & Arsip
 * Review final dan arsipkan sebagai paket SPJ siap audit
 */
const ReviewStep = ({ data = {}, onUpdate, packageData }) => {
  const [isArchiving, setIsArchiving] = useState(false)

  const summary = extractSummary(packageData)
  const generatedDocs = packageData.generate?.generatedDocuments || []
  const uploadedDocs = packageData.upload?.uploadedDocuments || []
  const checklistStatus = packageData.checklist?.checklistStatus || {}

  // Calculate overall completion
  const totalDocs = generatedDocs.length + uploadedDocs.length
  const completionRate = checklistStatus.stats?.completionRate || 0

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Package className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Review & Arsipkan Paket SPJ</h2>
            <p className="text-blue-100 mt-1">
              Periksa kembali kelengkapan dokumen sebelum mengarsipkan
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Data Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-2">Data Kegiatan</div>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-500">Nama Kegiatan</div>
              <div className="font-medium text-gray-900 truncate">
                {summary.kegiatanNama || '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Kontrak</div>
              <div className="font-medium text-gray-900">
                {summary.kontrakNomor || '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Penyedia</div>
              <div className="font-medium text-gray-900 truncate">
                {summary.penyediaNama || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-700 mb-2">Nilai Pembayaran</div>
          <div className="text-2xl font-bold text-green-900 mb-2">
            {summary.kontrakNilai ? formatRupiah(summary.kontrakNilai) : '-'}
          </div>
          <div className="flex items-center gap-2 text-xs text-green-700">
            <Check className="w-4 h-4" />
            <span>Nilai sudah termasuk PPN & PPh</span>
          </div>
        </div>

        {/* Document Summary */}
        <div className={`border rounded-lg p-4 ${
          completionRate >= 80
            ? 'bg-green-50 border-green-200'
            : completionRate >= 50
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
        }`}>
          <div className="text-sm text-gray-700 mb-2">Kelengkapan Dokumen</div>
          <div className="flex items-baseline gap-2 mb-2">
            <div className="text-3xl font-bold text-gray-900">
              {completionRate}%
            </div>
            <div className="text-sm text-gray-600">
              ({totalDocs} dokumen)
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                completionRate >= 80
                  ? 'bg-green-600'
                  : completionRate >= 50
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
              }`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Document Checklist Review */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Daftar Dokumen
        </h3>

        <div className="space-y-4">
          {/* Generated Documents */}
          {generatedDocs.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Dokumen Ter-generate ({generatedDocs.length})
              </h4>
              <div className="space-y-2">
                {generatedDocs.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <div>
                        <div className="font-medium text-gray-900">{doc.filename}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(doc.generatedAt).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uploaded Documents */}
          {uploadedDocs.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Dokumen Diunggah ({uploadedDocs.length})
              </h4>
              <div className="space-y-2">
                {uploadedDocs.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div>
                        <div className="font-medium text-gray-900">{doc.filename}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(doc.uploadedAt).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Documents */}
          {totalDocs === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Belum ada dokumen yang di-generate atau diunggah</p>
            </div>
          )}
        </div>
      </div>

      {/* Warnings (Non-blocking) */}
      {completionRate < 100 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <h4 className="font-medium text-yellow-900 mb-1">
                Perhatian (Anda tetap bisa melanjutkan)
              </h4>
              <p className="text-yellow-800 mb-2">
                Beberapa dokumen belum lengkap ({100 - completionRate}% tersisa).
                Anda tetap dapat mengarsipkan paket SPJ ini dan melengkapi dokumen nanti dari menu Arsip.
              </p>
              {checklistStatus.stats && (
                <ul className="space-y-1 text-yellow-800">
                  {checklistStatus.stats.mandatoryComplete < checklistStatus.stats.totalMandatory && (
                    <li>
                      • Dokumen wajib: {checklistStatus.stats.mandatoryComplete}/{checklistStatus.stats.totalMandatory}
                    </li>
                  )}
                  {checklistStatus.stats.recommendedComplete < checklistStatus.stats.totalRecommended && (
                    <li>
                      • Dokumen dianjurkan: {checklistStatus.stats.recommendedComplete}/{checklistStatus.stats.totalRecommended}
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {completionRate === 100 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-900">
              <h4 className="font-medium mb-1">✓ Dokumen lengkap!</h4>
              <p>
                Semua dokumen sudah lengkap. Paket SPJ siap untuk diarsipkan dan digunakan untuk pelaporan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Archive Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Informasi Arsip</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>Kode Paket:</span>
            <span className="font-mono font-medium">
              LS-Kontrak-{summary.kontrakNomor?.replace(/\//g, '-') || 'DRAFT'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tahun Anggaran:</span>
            <span className="font-medium">{summary.tahun}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Dokumen:</span>
            <span className="font-medium">{totalDocs} file</span>
          </div>
          <div className="flex justify-between">
            <span>Kelengkapan:</span>
            <span className="font-medium">{completionRate}%</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-300">
          <p className="text-xs text-gray-600">
            💡 Setelah diarsipkan, Anda dapat mengunduh semua dokumen sebagai ZIP,
            melihat detail, atau melengkapi dokumen yang masih kurang dari menu Arsip SPJ.
          </p>
        </div>
      </div>

      {/* Final Confirmation */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2">
          Siap untuk Mengarsipkan?
        </h4>
        <p className="text-sm text-blue-800 mb-4">
          Dengan mengklik tombol "Selesai & Arsipkan" di bawah, paket SPJ ini akan disimpan
          ke dalam arsip dan dapat diakses kapan saja dari menu Arsip SPJ.
        </p>
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <Check className="w-4 h-4" />
          <span>Data tersimpan otomatis dan dapat dilengkapi kapan saja</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-blue-700 mt-1">
          <Check className="w-4 h-4" />
          <span>Paket dapat diunduh sebagai ZIP untuk diserahkan ke auditor</span>
        </div>
      </div>
    </div>
  )
}

export default ReviewStep
