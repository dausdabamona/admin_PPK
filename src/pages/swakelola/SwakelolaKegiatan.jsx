import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, FolderKanban, Eye, Calendar, Banknote,
  CheckSquare, Upload, FileText, Download, X, FolderOpen, CheckCircle, AlertCircle, FileCheck, ClipboardList
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, Textarea, CurrencyInput } from '../../components/ui/Input'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import db, { STATUS_SWAKELOLA, CHECKLIST_SWAKELOLA } from '../../db/database'
import { formatTanggal, formatDateInput, formatRupiah, getCurrentYear } from '../../utils/formatters'

// Auto-generate kode kegiatan
const generateKodeKegiatan = async () => {
  const tahun = getCurrentYear()
  const prefix = `SWK-${tahun}`

  // Get existing kegiatan for this year
  const existingKegiatan = await db.swakelolaKegiatan
    .filter(k => k.kode && k.kode.startsWith(prefix))
    .toArray()

  // Find the highest number
  let maxNumber = 0
  existingKegiatan.forEach(k => {
    const match = k.kode.match(/SWK-\d{4}-(\d+)/)
    if (match) {
      const num = parseInt(match[1])
      if (num > maxNumber) maxNumber = num
    }
  })

  const nextNumber = String(maxNumber + 1).padStart(3, '0')
  return `${prefix}-${nextNumber}`
}

// Convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

// Generate folder path for documents
const generateFolderPath = (kode, nama) => {
  const tahun = getCurrentYear()
  const cleanString = (str) => str?.replace(/[/\\:*?"<>|]/g, '_') || 'Unknown'
  return `SPJ_SWAKELOLA/${tahun}/${cleanString(kode)}_${cleanString(nama)}`
}

// Format file size
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const SUMBER_DANA_OPTIONS = [
  { value: 'DIPA', label: 'DIPA' },
  { value: 'PNBP', label: 'PNBP' },
  { value: 'BLU', label: 'BLU' },
  { value: 'Hibah', label: 'Hibah' }
]

const AKUN_OPTIONS = [
  { value: '521211', label: '521211 - Belanja Bahan' },
  { value: '521213', label: '521213 - Honor Narasumber' },
  { value: '522141', label: '522141 - Sewa' },
  { value: '524111', label: '524111 - Perjalanan Dinas Biasa' },
  { value: '524119', label: '524119 - Perjalanan Dinas Lainnya' }
]

const STATUS_OPTIONS = [
  { value: STATUS_SWAKELOLA.DRAFT, label: 'Draft' },
  { value: STATUS_SWAKELOLA.AKTIF, label: 'Aktif' },
  { value: STATUS_SWAKELOLA.PROSES, label: 'Proses' },
  { value: STATUS_SWAKELOLA.SELESAI, label: 'Selesai' }
]

const initialFormData = {
  kode: '',
  nama: '',
  tahun: getCurrentYear().toString(),
  sumberDana: 'DIPA',
  akun: '521211',
  pagu: '',
  deskripsi: '',
  tanggalMulai: '',
  tanggalSelesai: '',
  status: STATUS_SWAKELOLA.DRAFT,
  // TOR and RAB files
  torFiles: [],
  rabFiles: []
}

// Initialize checklist items from template
const initializeChecklist = () => {
  return CHECKLIST_SWAKELOLA.map(item => ({
    id: item.id,
    nama: item.nama,
    wajib: item.wajib,
    ada: false,
    catatan: '',
    uploadedFiles: []
  }))
}

export default function SwakelolaKegiatan() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [checklistItems, setChecklistItems] = useState([])
  const [activeTab, setActiveTab] = useState('info') // 'info' or 'checklist'
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allKegiatan = useLiveQuery(async () => {
    const kegiatan = await db.swakelolaKegiatan.orderBy('createdAt').reverse().toArray()
    // Get checklist status for each kegiatan
    return Promise.all(kegiatan.map(async (k) => {
      const checklist = await db.swakelolaChecklist.where('kegiatanId').equals(k.id).first()
      return {
        ...k,
        checklistStatus: checklist?.statusKelengkapan || null,
        checklistItemLengkap: checklist?.itemLengkap || 0,
        checklistTotalItem: checklist?.totalItem || 0
      }
    }))
  }) || []

  // Filter by search query
  const filteredKegiatan = allKegiatan.filter(k =>
    k.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.kode?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredKegiatan.length / itemsPerPage)
  const paginatedKegiatan = filteredKegiatan.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleChecklistChange = (id, field, value) => {
    setChecklistItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  // Handle file upload for checklist item
  const handleFileUpload = async (itemId, files) => {
    if (!files || files.length === 0) return

    const folderPath = generateFolderPath(formData.kode, formData.nama)
    const updatedItems = [...checklistItems]
    const itemIndex = updatedItems.findIndex(i => i.id === itemId)

    if (itemIndex === -1) return

    const uploadedFiles = updatedItems[itemIndex].uploadedFiles || []

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" melebihi batas 10MB`)
        continue
      }

      try {
        const base64 = await fileToBase64(file)
        uploadedFiles.push({
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

    updatedItems[itemIndex].uploadedFiles = uploadedFiles
    updatedItems[itemIndex].ada = true // Auto-check when file uploaded
    setChecklistItems(updatedItems)
  }

  // Remove file from checklist item
  const handleRemoveFile = (itemId, fileIndex) => {
    setChecklistItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedFiles = item.uploadedFiles.filter((_, i) => i !== fileIndex)
        return { ...item, uploadedFiles: updatedFiles }
      }
      return item
    }))
  }

  // Download file
  const handleDownloadFile = (file) => {
    const link = document.createElement('a')
    link.href = file.data
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle TOR file upload
  const handleTORUpload = async (files) => {
    if (!files || files.length === 0) return

    const folderPath = generateFolderPath(formData.kode, formData.nama)
    const uploadedFiles = [...(formData.torFiles || [])]

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" melebihi batas 10MB`)
        continue
      }

      try {
        const base64 = await fileToBase64(file)
        uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64,
          folderPath: `${folderPath}/TOR`,
          uploadedAt: new Date().toISOString()
        })
      } catch (error) {
        console.error('Error uploading TOR file:', error)
      }
    }

    setFormData(prev => ({ ...prev, torFiles: uploadedFiles }))
  }

  // Handle RAB file upload
  const handleRABUpload = async (files) => {
    if (!files || files.length === 0) return

    const folderPath = generateFolderPath(formData.kode, formData.nama)
    const uploadedFiles = [...(formData.rabFiles || [])]

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`File "${file.name}" melebihi batas 10MB`)
        continue
      }

      try {
        const base64 = await fileToBase64(file)
        uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64,
          folderPath: `${folderPath}/RAB`,
          uploadedAt: new Date().toISOString()
        })
      } catch (error) {
        console.error('Error uploading RAB file:', error)
      }
    }

    setFormData(prev => ({ ...prev, rabFiles: uploadedFiles }))
  }

  // Remove TOR file
  const handleRemoveTORFile = (index) => {
    setFormData(prev => ({
      ...prev,
      torFiles: prev.torFiles.filter((_, i) => i !== index)
    }))
  }

  // Remove RAB file
  const handleRemoveRABFile = (index) => {
    setFormData(prev => ({
      ...prev,
      rabFiles: prev.rabFiles.filter((_, i) => i !== index)
    }))
  }

  const handleOpenModal = async (kegiatan = null) => {
    if (kegiatan) {
      setEditingId(kegiatan.id)
      setFormData({
        kode: kegiatan.kode || '',
        nama: kegiatan.nama || '',
        tahun: kegiatan.tahun || getCurrentYear().toString(),
        sumberDana: kegiatan.sumberDana || 'DIPA',
        akun: kegiatan.akun || '521211',
        pagu: kegiatan.pagu?.toString() || '',
        deskripsi: kegiatan.deskripsi || '',
        tanggalMulai: formatDateInput(kegiatan.tanggalMulai),
        tanggalSelesai: formatDateInput(kegiatan.tanggalSelesai),
        status: kegiatan.status || STATUS_SWAKELOLA.DRAFT,
        torFiles: kegiatan.torFiles || [],
        rabFiles: kegiatan.rabFiles || []
      })

      // Load existing checklist
      const existingChecklist = await db.swakelolaChecklist.where('kegiatanId').equals(kegiatan.id).first()
      if (existingChecklist?.items) {
        setChecklistItems(existingChecklist.items)
      } else {
        setChecklistItems(initializeChecklist())
      }
    } else {
      setEditingId(null)
      // Auto-generate kode for new kegiatan
      const generatedKode = await generateKodeKegiatan()
      setFormData({
        ...initialFormData,
        kode: generatedKode
      })
      setChecklistItems(initializeChecklist())
    }
    setActiveTab('info')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData(initialFormData)
    setChecklistItems([])
    setActiveTab('info')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        kode: formData.kode,
        nama: formData.nama,
        tahun: parseInt(formData.tahun),
        sumberDana: formData.sumberDana,
        akun: formData.akun,
        pagu: parseInt(formData.pagu) || 0,
        deskripsi: formData.deskripsi,
        tanggalMulai: formData.tanggalMulai ? new Date(formData.tanggalMulai) : null,
        tanggalSelesai: formData.tanggalSelesai ? new Date(formData.tanggalSelesai) : null,
        status: formData.status,
        torFiles: formData.torFiles || [],
        rabFiles: formData.rabFiles || [],
        updatedAt: new Date()
      }

      let kegiatanId

      if (editingId) {
        await db.swakelolaKegiatan.update(editingId, data)
        kegiatanId = editingId
      } else {
        data.createdAt = new Date()
        kegiatanId = await db.swakelolaKegiatan.add(data)
      }

      // Save checklist
      const itemLengkap = checklistItems.filter(item => item.ada).length
      const totalItem = checklistItems.length
      const wajibLengkap = checklistItems.filter(item => item.wajib && item.ada).length
      const totalWajib = checklistItems.filter(item => item.wajib).length
      const statusKelengkapan = wajibLengkap === totalWajib ? 'lengkap' : 'belum_lengkap'

      const checklistData = {
        kegiatanId,
        items: checklistItems,
        statusKelengkapan,
        totalItem,
        itemLengkap,
        namaPemeriksa: '',
        tanggalPemeriksaan: new Date(),
        catatan: '',
        updatedAt: new Date()
      }

      // Check if checklist exists
      const existingChecklist = await db.swakelolaChecklist.where('kegiatanId').equals(kegiatanId).first()
      if (existingChecklist) {
        await db.swakelolaChecklist.update(existingChecklist.id, checklistData)
      } else {
        checklistData.createdAt = new Date()
        await db.swakelolaChecklist.add(checklistData)
      }

      handleCloseModal()
    } catch (error) {
      alert('Gagal menyimpan data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      // Delete related data
      const uangMukaList = await db.swakelolaUangMuka.where('kegiatanId').equals(deletingId).toArray()
      for (const um of uangMukaList) {
        await db.swakelolaRealisasi.where('uangMukaId').equals(um.id).delete()
        await db.swakelolaRampung.where('uangMukaId').equals(um.id).delete()
      }
      await db.swakelolaUangMuka.where('kegiatanId').equals(deletingId).delete()
      await db.swakelolaTim.where('kegiatanId').equals(deletingId).delete()
      await db.swakelolaChecklist.where('kegiatanId').equals(deletingId).delete()
      await db.swakelolaKegiatan.delete(deletingId)

      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (kegiatan) => {
    // Get related counts
    const timCount = await db.swakelolaTim.where('kegiatanId').equals(kegiatan.id).count()
    const uangMukaCount = await db.swakelolaUangMuka.where('kegiatanId').equals(kegiatan.id).count()
    const checklist = await db.swakelolaChecklist.where('kegiatanId').equals(kegiatan.id).first()

    setViewingData({
      ...kegiatan,
      timCount,
      uangMukaCount,
      checklist
    })
    setIsViewModalOpen(true)
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  const getStatusBadge = (status) => {
    const variants = {
      [STATUS_SWAKELOLA.DRAFT]: 'default',
      [STATUS_SWAKELOLA.AKTIF]: 'info',
      [STATUS_SWAKELOLA.PROSES]: 'warning',
      [STATUS_SWAKELOLA.SELESAI]: 'success'
    }
    const labels = {
      [STATUS_SWAKELOLA.DRAFT]: 'Draft',
      [STATUS_SWAKELOLA.AKTIF]: 'Aktif',
      [STATUS_SWAKELOLA.PROSES]: 'Proses',
      [STATUS_SWAKELOLA.SELESAI]: 'Selesai'
    }
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  const getChecklistBadge = (status, itemLengkap, totalItem) => {
    if (!status) return <Badge variant="default">Belum diisi</Badge>
    if (status === 'lengkap') {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {itemLengkap}/{totalItem}
        </Badge>
      )
    }
    return (
      <Badge variant="warning" className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {itemLengkap}/{totalItem}
      </Badge>
    )
  }

  // Calculate progress
  const itemLengkap = checklistItems.filter(item => item.ada).length
  const totalItem = checklistItems.length
  const wajibLengkap = checklistItems.filter(item => item.wajib && item.ada).length
  const totalWajib = checklistItems.filter(item => item.wajib).length

  return (
    <Layout title="Data Kegiatan Swakelola">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary-600" />
              Data Kegiatan Swakelola
            </CardTitle>
            <CardDescription>
              Kelola kegiatan swakelola, pagu anggaran, dan checklist dokumen untuk PUM
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kegiatan..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-64"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Tambah Kegiatan
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>Kode</TableHeader>
                <TableHeader>Nama Kegiatan</TableHeader>
                <TableHeader>Pagu</TableHeader>
                <TableHeader>Checklist SPJ</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedKegiatan.length > 0 ? (
                paginatedKegiatan.map((kegiatan, index) => (
                  <TableRow key={kegiatan.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {kegiatan.kode}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{kegiatan.nama}</p>
                        <p className="text-xs text-gray-500">{kegiatan.tahun} | {kegiatan.sumberDana}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatRupiah(kegiatan.pagu)}
                    </TableCell>
                    <TableCell>
                      {getChecklistBadge(kegiatan.checklistStatus, kegiatan.checklistItemLengkap, kegiatan.checklistTotalItem)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(kegiatan.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(kegiatan)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(kegiatan)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(kegiatan.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableEmpty
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada kegiatan swakelola'}
                  colSpan={7}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredKegiatan.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Modal with Tabs */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Edit Kegiatan Swakelola' : 'Tambah Kegiatan Swakelola'}
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          {/* Tab Navigation */}
          <div className="flex border-b mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'info'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Informasi Kegiatan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'checklist'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              Checklist SPJ untuk PUM
              {itemLengkap > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                  wajibLengkap === totalWajib ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {itemLengkap}/{totalItem}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content: Info */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* TOR & RAB Upload Section */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Dokumen Awal Kegiatan</span>
                </div>
                <p className="text-sm text-blue-700 mb-4">
                  Upload TOR (Terms of Reference) dan RAB (Rencana Anggaran Biaya) di awal kegiatan setelah surat tugas diterima.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* TOR Upload */}
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">TOR (Kerangka Acuan)</span>
                      <label className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded cursor-pointer hover:bg-blue-100">
                        <Upload className="w-3.5 h-3.5" />
                        Upload
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleTORUpload(Array.from(e.target.files))}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {formData.torFiles?.length > 0 ? (
                      <div className="space-y-1">
                        {formData.torFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="flex-1 truncate">{file.name}</span>
                            <span className="text-gray-400">{formatFileSize(file.size)}</span>
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(file)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveTORFile(idx)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">Belum ada dokumen TOR</p>
                    )}
                  </div>

                  {/* RAB Upload */}
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">RAB (Rencana Anggaran)</span>
                      <label className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded cursor-pointer hover:bg-green-100">
                        <Upload className="w-3.5 h-3.5" />
                        Upload
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                          onChange={(e) => handleRABUpload(Array.from(e.target.files))}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {formData.rabFiles?.length > 0 ? (
                      <div className="space-y-1">
                        {formData.rabFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
                            <FileText className="w-4 h-4 text-green-500" />
                            <span className="flex-1 truncate">{file.name}</span>
                            <span className="text-gray-400">{formatFileSize(file.size)}</span>
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(file)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveRABFile(idx)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">Belum ada dokumen RAB</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Kode Kegiatan"
                name="kode"
                value={formData.kode}
                onChange={handleInputChange}
                placeholder="SWK-2024-001"
                helper="Otomatis diisi, dapat diedit manual"
                required
              />
              <Input
                label="Tahun Anggaran"
                name="tahun"
                type="number"
                value={formData.tahun}
                onChange={handleInputChange}
                required
              />
              <div className="md:col-span-2">
                <Input
                  label="Nama Kegiatan"
                  name="nama"
                  value={formData.nama}
                  onChange={handleInputChange}
                  placeholder="Pelaksanaan Pelatihan..."
                  required
                />
              </div>
              <Select
                label="Sumber Dana"
                name="sumberDana"
                value={formData.sumberDana}
                onChange={handleInputChange}
                options={SUMBER_DANA_OPTIONS}
                required
              />
              <Select
                label="Akun Belanja"
                name="akun"
                value={formData.akun}
                onChange={handleInputChange}
                options={AKUN_OPTIONS}
                required
              />
              <CurrencyInput
                label="Pagu Anggaran"
                name="pagu"
                value={formData.pagu}
                onChange={handleInputChange}
                placeholder="Masukkan pagu"
                helper="Dapat diedit manual sesuai RKA"
                required
              />
              <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                options={STATUS_OPTIONS}
              />
              <Input
                label="Tanggal Mulai"
                name="tanggalMulai"
                type="date"
                value={formData.tanggalMulai}
                onChange={handleInputChange}
              />
              <Input
                label="Tanggal Selesai"
                name="tanggalSelesai"
                type="date"
                value={formData.tanggalSelesai}
                onChange={handleInputChange}
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Deskripsi"
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Deskripsi singkat kegiatan..."
                />
              </div>
              </div>
            </div>
          )}

          {/* Tab Content: Checklist */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <CheckSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Checklist Dokumen SPJ Swakelola</p>
                    <p className="text-sm text-blue-700">
                      Upload dokumen yang diperlukan untuk diserahkan ke Pemegang Uang Muka (PUM).
                      Berdasarkan Kepmen KP No.56 Tahun 2024.
                    </p>
                  </div>
                </div>
              </div>

              {/* Folder Path Display */}
              {formData.kode && formData.nama && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                  <FolderOpen className="w-4 h-4" />
                  <span>Folder: {generateFolderPath(formData.kode, formData.nama)}</span>
                </div>
              )}

              {/* Checklist Items */}
              <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                {checklistItems.map((item) => (
                  <div key={item.id} className={`p-4 ${item.ada ? 'bg-green-50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.ada}
                        onChange={(e) => handleChecklistChange(item.id, 'ada', e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${item.ada ? 'text-green-700' : 'text-gray-700'}`}>
                            {item.nama}
                          </span>
                          {item.wajib && (
                            <span className="text-xs text-red-500 font-medium">*wajib</span>
                          )}
                        </div>

                        {/* Catatan */}
                        <input
                          type="text"
                          placeholder="Catatan (opsional)"
                          value={item.catatan}
                          onChange={(e) => handleChecklistChange(item.id, 'catatan', e.target.value)}
                          className="mt-2 w-full text-sm px-3 py-1.5 border rounded focus:ring-1 focus:ring-primary-500"
                        />

                        {/* Upload Section */}
                        <div className="mt-2">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            Upload Dokumen
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileUpload(item.id, Array.from(e.target.files))}
                              className="hidden"
                            />
                          </label>
                          {item.uploadedFiles?.length > 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                              {item.uploadedFiles.length} file
                            </span>
                          )}
                        </div>

                        {/* Uploaded Files */}
                        {item.uploadedFiles?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {item.uploadedFiles.map((file, fileIndex) => (
                              <div
                                key={fileIndex}
                                className="flex items-center gap-2 p-2 bg-white border rounded text-xs"
                              >
                                <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <span className="flex-1 truncate font-medium">{file.name}</span>
                                <span className="text-gray-400 flex-shrink-0">
                                  {formatFileSize(file.size)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFile(file)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(item.id, fileIndex)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Hapus"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {item.ada ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-300 mt-1 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress Kelengkapan Dokumen</span>
                  <span className="text-sm text-gray-600">
                    {itemLengkap} / {totalItem} dokumen
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      wajibLengkap === totalWajib ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${totalItem > 0 ? (itemLengkap / totalItem) * 100 : 0}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-gray-500">
                    Wajib: {wajibLengkap}/{totalWajib}
                  </span>
                  <span className={wajibLengkap === totalWajib ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                    {wajibLengkap === totalWajib ? 'Siap diserahkan ke PUM' : 'Dokumen wajib belum lengkap'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button type="submit" loading={loading}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Kegiatan'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail Kegiatan Swakelola"
        size="lg"
      >
        {viewingData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Kode Kegiatan</label>
                <p className="font-mono font-medium">{viewingData.kode}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tahun</label>
                <p>{viewingData.tahun}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Nama Kegiatan</label>
              <p className="font-medium">{viewingData.nama}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500">Deskripsi</label>
              <p className="text-sm">{viewingData.deskripsi || '-'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Sumber Dana</label>
                <p><Badge variant="info">{viewingData.sumberDana}</Badge></p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Akun Belanja</label>
                <p className="font-mono">{viewingData.akun}</p>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700">Pagu Anggaran</span>
              </div>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatRupiah(viewingData.pagu)}
              </p>
            </div>

            {/* TOR & RAB Files Display */}
            {(viewingData.torFiles?.length > 0 || viewingData.rabFiles?.length > 0) && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Dokumen Awal Kegiatan</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* TOR Files */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">TOR (Kerangka Acuan)</p>
                    {viewingData.torFiles?.length > 0 ? (
                      <div className="space-y-1">
                        {viewingData.torFiles.map((file, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleDownloadFile(file)}
                            className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="truncate">{file.name}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">Belum diupload</p>
                    )}
                  </div>
                  {/* RAB Files */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">RAB (Rencana Anggaran)</p>
                    {viewingData.rabFiles?.length > 0 ? (
                      <div className="space-y-1">
                        {viewingData.rabFiles.map((file, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleDownloadFile(file)}
                            className="flex items-center gap-2 text-xs text-green-600 hover:text-green-800"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="truncate">{file.name}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">Belum diupload</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Checklist Status */}
            {viewingData.checklist && (
              <div className={`p-4 rounded-lg ${
                viewingData.checklist.statusKelengkapan === 'lengkap'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className={`w-5 h-5 ${
                      viewingData.checklist.statusKelengkapan === 'lengkap' ? 'text-green-600' : 'text-yellow-600'
                    }`} />
                    <span className="font-medium">Checklist SPJ untuk PUM</span>
                  </div>
                  {getChecklistBadge(
                    viewingData.checklist.statusKelengkapan,
                    viewingData.checklist.itemLengkap,
                    viewingData.checklist.totalItem
                  )}
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      viewingData.checklist.statusKelengkapan === 'lengkap' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                    style={{
                      width: `${(viewingData.checklist.itemLengkap / viewingData.checklist.totalItem) * 100}%`
                    }}
                  />
                </div>

                {/* Show uploaded documents count */}
                {viewingData.checklist.items && (
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">Dokumen yang diupload:</span>
                    <ul className="mt-1 space-y-1">
                      {viewingData.checklist.items.filter(i => i.uploadedFiles?.length > 0).map(item => (
                        <li key={item.id} className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                          {item.nama}: {item.uploadedFiles.length} file
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Tanggal Mulai</label>
                <p>{viewingData.tanggalMulai ? formatTanggal(viewingData.tanggalMulai) : '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tanggal Selesai</label>
                <p>{viewingData.tanggalSelesai ? formatTanggal(viewingData.tanggalSelesai) : '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Status</label>
                <p>{getStatusBadge(viewingData.status)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Anggota Tim</label>
                <p className="font-medium">{viewingData.timCount || 0} orang</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus"
        size="sm"
      >
        <p className="text-gray-600">
          Apakah Anda yakin ingin menghapus kegiatan ini? Semua data terkait (Tim, Uang Muka, Realisasi, Rampung, Checklist) juga akan dihapus.
        </p>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
            Batal
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={loading}>
            Hapus
          </Button>
        </ModalFooter>
      </Modal>
    </Layout>
  )
}
