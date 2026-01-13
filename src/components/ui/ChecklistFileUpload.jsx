import { useState, useRef, useEffect } from 'react'
import { Upload, FileText, Download, Trash2, Eye, File, Image, FileSpreadsheet } from 'lucide-react'
import db, {
  saveChecklistFile,
  getChecklistFile,
  deleteChecklistFile,
  downloadChecklistFile,
  formatFileSize
} from '../../db/database'

// File type icons
const getFileIcon = (fileType) => {
  if (fileType?.startsWith('image/')) return Image
  if (fileType?.includes('spreadsheet') || fileType?.includes('excel') || fileType?.includes('csv')) return FileSpreadsheet
  if (fileType?.includes('pdf')) return FileText
  return File
}

// Single file upload for a checklist item
export function ChecklistItemUpload({
  checklistType,
  checklistId,
  itemId,
  identifier,
  onFileChange,
  disabled = false
}) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const fileInputRef = useRef(null)

  // Load existing file on mount
  useEffect(() => {
    if (checklistId) {
      loadExistingFile()
    }
  }, [checklistId, itemId])

  const loadExistingFile = async () => {
    try {
      const existingFile = await getChecklistFile(checklistType, checklistId, itemId)
      if (existingFile) {
        setFile(existingFile)
        if (onFileChange) onFileChange(itemId, existingFile)
      }
    } catch (error) {
      console.error('Error loading file:', error)
    }
  }

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile || !checklistId) return

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10MB')
      return
    }

    setLoading(true)
    try {
      await saveChecklistFile(checklistType, checklistId, itemId, selectedFile, identifier)
      const savedFile = await getChecklistFile(checklistType, checklistId, itemId)
      setFile(savedFile)
      if (onFileChange) onFileChange(itemId, savedFile)
    } catch (error) {
      alert('Gagal mengupload file: ' + error.message)
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (!file || !confirm('Hapus file ini?')) return

    setLoading(true)
    try {
      await deleteChecklistFile(file.id)
      setFile(null)
      if (onFileChange) onFileChange(itemId, null)
    } catch (error) {
      alert('Gagal menghapus file: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (file?.fileData && file?.fileName) {
      downloadChecklistFile(file.fileData, file.fileName)
    }
  }

  const handlePreview = () => {
    if (file?.fileData) {
      if (file.fileType?.startsWith('image/') || file.fileType?.includes('pdf')) {
        setPreviewOpen(true)
      } else {
        handleDownload()
      }
    }
  }

  const FileIcon = file ? getFileIcon(file.fileType) : Upload

  if (!checklistId) {
    return (
      <div className="text-xs text-gray-400 italic">
        Simpan checklist dulu
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
        disabled={disabled || loading}
      />

      {file ? (
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs max-w-[150px]">
            <FileIcon className="w-3 h-3 text-green-600 flex-shrink-0" />
            <span className="truncate text-green-700" title={file.fileName}>
              {file.fileName}
            </span>
          </div>
          <button
            type="button"
            onClick={handlePreview}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="Lihat"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Hapus"
            disabled={loading}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || loading}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 border border-dashed border-gray-300 rounded hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" />
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      )}

      {/* Preview Modal */}
      {previewOpen && file && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-medium">{file.fileName}</h3>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[70vh]">
              {file.fileType?.startsWith('image/') ? (
                <img src={file.fileData} alt={file.fileName} className="max-w-full" />
              ) : file.fileType?.includes('pdf') ? (
                <iframe
                  src={file.fileData}
                  className="w-full h-[60vh]"
                  title={file.fileName}
                />
              ) : (
                <p>Preview tidak tersedia</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Checklist item row with file upload
export function ChecklistItemRow({
  item,
  checked,
  catatan,
  onCheckChange,
  onCatatanChange,
  checklistType,
  checklistId,
  identifier,
  onFileChange
}) {
  return (
    <div className={`p-3 flex items-start gap-3 ${checked ? 'bg-green-50' : ''}`}>
      <label className="flex items-center gap-2 cursor-pointer flex-1">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckChange(item.id, e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <div className="flex-1">
          <span className={`font-medium ${checked ? 'text-green-700' : 'text-gray-700'}`}>
            {item.nama}
          </span>
          {item.wajib && (
            <span className="ml-2 text-xs text-red-500">*wajib</span>
          )}
        </div>
      </label>

      <div className="flex items-center gap-2">
        <ChecklistItemUpload
          checklistType={checklistType}
          checklistId={checklistId}
          itemId={item.id}
          identifier={identifier}
          onFileChange={onFileChange}
        />
        <input
          type="text"
          placeholder="Catatan..."
          value={catatan}
          onChange={(e) => onCatatanChange(item.id, e.target.value)}
          className="w-32 text-sm px-2 py-1 border rounded"
        />
      </div>
    </div>
  )
}

export default ChecklistItemUpload
