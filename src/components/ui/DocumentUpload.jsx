import { Upload, FileText, Download, X, FolderOpen } from 'lucide-react'

// Convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

// Download a file from base64
export const downloadFile = (file) => {
  const link = document.createElement('a')
  link.href = file.data
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Format file size
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Generate folder path for different modules
export const generateFolderPath = (moduleType, data) => {
  const tahun = new Date().getFullYear()
  const cleanString = (str) => str?.replace(/[/\\:*?"<>|]/g, '_') || 'Unknown'

  switch (moduleType) {
    case 'sppd':
      // SPJ_SPPD/{tahun}/{bulan}/{nomorSPPD}_{namaPegawai}/
      const bulanSppd = data.tanggalBerangkat
        ? String(new Date(data.tanggalBerangkat).getMonth() + 1).padStart(2, '0')
        : '01'
      return `SPJ_SPPD/${tahun}/${bulanSppd}/${cleanString(data.nomor)}_${cleanString(data.pegawaiNama)}`

    case 'swakelola':
      // SPJ_SWAKELOLA/{tahun}/{kodeKegiatan}_{namaKegiatan}/
      return `SPJ_SWAKELOLA/${tahun}/${cleanString(data.kode)}_${cleanString(data.nama)}`

    case 'pjlp':
      // SPJ_PJLP/{tahun}/{bulan}/{namaPJLP}/
      const bulanPjlp = String(data.bulan || 1).padStart(2, '0')
      return `SPJ_PJLP/${data.tahun || tahun}/${bulanPjlp}/${cleanString(data.nama)}`

    case 'pengadaan':
      // SPJ_PENGADAAN/{tahun}/{kodePaket}_{namaPaket}/
      return `SPJ_PENGADAAN/${data.tahun || tahun}/${cleanString(data.kodePaket)}_${cleanString(data.namaPaket)}`

    case 'honorarium':
      // SPJ_HONOR/{tahun}/{bulan}/{jenisHonor}/
      const bulanHonor = String(data.bulan || 1).padStart(2, '0')
      return `SPJ_HONOR/${data.tahun || tahun}/${bulanHonor}/${cleanString(data.jenisHonor)}`

    default:
      return `SPJ_DOKUMEN/${tahun}/${cleanString(data.nama || 'document')}`
  }
}

// Document Upload Component for checklist items
export default function DocumentUpload({
  uploadedFiles = [],
  onFilesChange,
  folderPath,
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png",
  maxFiles = 5,
  maxSizeMB = 10,
  disabled = false
}) {
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    const newFiles = []

    for (const file of files) {
      // Check max files
      if (uploadedFiles.length + newFiles.length >= maxFiles) {
        alert(`Maksimal ${maxFiles} file`)
        break
      }

      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File "${file.name}" melebihi batas ${maxSizeMB}MB`)
        continue
      }

      try {
        const base64 = await fileToBase64(file)
        newFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64,
          folderPath,
          uploadedAt: new Date().toISOString()
        })
      } catch (error) {
        console.error('Error uploading file:', error)
      }
    }

    if (newFiles.length > 0) {
      onFilesChange([...uploadedFiles, ...newFiles])
    }

    // Reset input
    e.target.value = ''
  }

  const handleRemoveFile = (index) => {
    const updated = uploadedFiles.filter((_, i) => i !== index)
    onFilesChange(updated)
  }

  return (
    <div className="mt-2 space-y-2">
      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
          disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'text-blue-700 bg-blue-50 hover:bg-blue-100'
        }`}>
          <Upload className="w-3.5 h-3.5" />
          Upload Dokumen
          <input
            type="file"
            multiple
            accept={accept}
            onChange={handleFileUpload}
            disabled={disabled}
            className="hidden"
          />
        </label>
        {uploadedFiles.length > 0 && (
          <span className="text-xs text-gray-500">
            {uploadedFiles.length} file
          </span>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-1.5">
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs border border-gray-200"
            >
              <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="flex-1 truncate font-medium">{file.name}</span>
              <span className="text-gray-400 flex-shrink-0">
                {formatFileSize(file.size)}
              </span>
              <button
                type="button"
                onClick={() => downloadFile(file)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Hapus"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}

          {/* Folder Path Display */}
          {folderPath && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
              <FolderOpen className="w-3 h-3" />
              <span className="truncate">Path: {folderPath}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Compact version for table/list views
export function DocumentUploadBadge({ count, onClick }) {
  if (!count) return null

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100"
    >
      <FileText className="w-3 h-3" />
      {count} file
    </button>
  )
}
