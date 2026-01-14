import React, { useState } from 'react'
import { Upload, File, X, Check } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'

/**
 * Step 6: Upload Dokumen TTD
 * Upload dokumen yang sudah ditandatangani
 */
const UploadStep = ({ data = {}, onUpdate, packageData }) => {
  const [uploading, setUploading] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState(data.uploadedDocuments || [])

  const generatedDocs = packageData.generate?.generatedDocuments || []

  const handleFileSelect = async (e, docTemplate) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)

    try {
      for (const file of files) {
        // TODO: Implement actual file upload to server/storage
        await new Promise(resolve => setTimeout(resolve, 500))

        const newDoc = {
          templateCode: docTemplate?.templateCode || 'manual',
          filename: file.name,
          originalName: docTemplate?.filename || file.name,
          uploadedAt: new Date(),
          size: file.size,
          type: file.type
        }

        setUploadedDocs(prev => [...prev, newDoc])
      }

      // Update step data
      onUpdate({
        ...data,
        uploadedDocuments: [...uploadedDocs, ...files.map(f => ({
          templateCode: docTemplate?.templateCode || 'manual',
          filename: f.name,
          uploadedAt: new Date(),
          size: f.size
        }))]
      })
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Gagal mengunggah file: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = (index) => {
    const updated = uploadedDocs.filter((_, idx) => idx !== index)
    setUploadedDocs(updated)
    onUpdate({
      ...data,
      uploadedDocuments: updated
    })
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-6">
      {/* Info Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Upload className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Langkah 6: Upload Dokumen yang Sudah Ditandatangani</p>
            <p>
              Unggah dokumen yang sudah di-generate dan ditandatangani oleh pejabat terkait.
              Anda juga dapat mengunggah dokumen pendukung lainnya.
            </p>
          </div>
        </div>
      </div>

      {/* Upload for Generated Documents */}
      {generatedDocs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Upload Dokumen yang Sudah Ditandatangani
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Dokumen-dokumen berikut sudah di-generate. Silakan download, tandatangani,
            lalu upload kembali versi yang sudah bertanda tangan.
          </p>

          <div className="space-y-3">
            {generatedDocs.map((doc, idx) => {
              const uploaded = uploadedDocs.find(u => u.templateCode === doc.templateCode)

              return (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 ${
                    uploaded ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {uploaded ? (
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{doc.filename}</div>
                        {uploaded ? (
                          <div className="text-sm text-green-700">
                            ✓ Uploaded: {uploaded.filename}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Belum diunggah
                          </div>
                        )}
                      </div>
                    </div>

                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={(e) => handleFileSelect(e, doc)}
                        disabled={uploading}
                      />
                      <Button
                        size="sm"
                        variant={uploaded ? 'secondary' : 'primary'}
                        disabled={uploading}
                        as="span"
                      >
                        {uploaded ? 'Upload Ulang' : 'Upload TTD'}
                      </Button>
                    </label>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Manual Upload (Other Documents) */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Upload Dokumen Pendukung Lainnya
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Unggah dokumen pendukung lainnya yang tidak ter-generate otomatis
          (NPWP, rekening koran, foto, dll).
        </p>

        <label className="block">
          <input
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={(e) => handleFileSelect(e, null)}
            disabled={uploading}
          />
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium text-blue-600">Klik untuk upload</span> atau drag & drop
            </div>
            <div className="text-xs text-gray-500">
              PDF, JPG, PNG, DOC, DOCX (Max 10MB)
            </div>
          </div>
        </label>
      </div>

      {/* Uploaded Documents List */}
      {uploadedDocs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Dokumen yang Sudah Diunggah ({uploadedDocs.length})
          </h3>

          <div className="space-y-2">
            {uploadedDocs.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{doc.filename}</div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(idx)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                  title="Hapus"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          💡 <strong>Tips:</strong> Anda tidak harus mengunggah semua dokumen sekarang.
          Dokumen dapat dilengkapi kapan saja dari menu Arsip SPJ setelah paket ini diarsipkan.
        </p>
      </div>
    </div>
  )
}

export default UploadStep
