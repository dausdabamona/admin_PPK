import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, FileText, Eye, ListChecks, Users,
  CheckSquare, Upload, Download, X, FolderOpen, CheckCircle, AlertCircle
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, Textarea, CurrencyInput } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, {
  JENIS_HONOR,
  STATUS_HONOR_ASSIGNMENT,
  getStatusHonorLabel,
  SUMBER_DANA_PENGADAAN,
  CHECKLIST_HONOR
} from '../../db/database'
import { formatTanggal, formatDateInput, formatRupiah } from '../../utils/formatters'

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
const generateFolderPath = (nomorSK, jenisHonor, tahun) => {
  const cleanString = (str) => str?.replace(/[/\\:*?"<>|]/g, '_') || 'Unknown'
  const jenisLabel = JENIS_HONOR.find(j => j.id === jenisHonor)?.nama || jenisHonor
  return `SPJ_HONOR/${tahun}/${cleanString(jenisLabel)}/${cleanString(nomorSK)}`
}

// Format file size
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Initialize checklist items
const initializeChecklist = () => {
  return CHECKLIST_HONOR.map(item => ({
    id: item.id,
    nama: item.nama,
    wajib: item.wajib,
    ada: false,
    catatan: '',
    uploadedFiles: []
  }))
}

const initialFormData = {
  nomorSK: '',
  tanggalSK: '',
  perihal: '',
  dasarHukum: '',
  jenisHonor: '',
  kegiatanId: '',
  tahun: new Date().getFullYear().toString(),
  pagu: '',
  sumberDana: '',
  akun: '',
  tanggalMulai: '',
  tanggalSelesai: '',
  keterangan: '',
  status: 'draft'
}

export default function HonorAssignment() {
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
  const [filterStatus, setFilterStatus] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString())
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data with checklist status
  const allAssignments = useLiveQuery(async () => {
    const assignments = await db.honorAssignment.orderBy('createdAt').reverse().toArray()
    return Promise.all(assignments.map(async (a) => {
      const checklist = await db.honorChecklist.where('assignmentId').equals(a.id).first()
      return {
        ...a,
        checklistStatus: checklist?.statusKelengkapan || null,
        checklistItemLengkap: checklist?.itemLengkap || 0,
        checklistTotalItem: checklist?.totalItem || 0
      }
    }))
  }) || []

  // Swakelola Kegiatan for linking
  const swakelolaList = useLiveQuery(() =>
    db.swakelolaKegiatan.toArray()
  ) || []

  // Filter
  const filteredAssignments = allAssignments.filter(a => {
    const matchSearch = a.nomorSK?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.perihal?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = !filterStatus || a.status === filterStatus
    const matchJenis = !filterJenis || a.jenisHonor === filterJenis
    const matchTahun = !filterTahun || a.tahun === filterTahun
    return matchSearch && matchStatus && matchJenis && matchTahun
  })

  // Pagination
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage)
  const paginatedAssignments = filteredAssignments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Options
  const jenisHonorOptions = JENIS_HONOR.map(j => ({
    value: j.id,
    label: j.nama
  }))

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'aktif', label: 'Aktif' },
    { value: 'proses', label: 'Dalam Proses' },
    { value: 'selesai', label: 'Selesai' },
    { value: 'batal', label: 'Batal' }
  ]

  const sumberDanaOptions = SUMBER_DANA_PENGADAAN.map(s => ({
    value: s.id,
    label: s.nama
  }))

  const kegiatanOptions = swakelolaList.map(k => ({
    value: k.id.toString(),
    label: `${k.kode} - ${k.nama}`
  }))

  const tahunOptions = []
  const currentYear = new Date().getFullYear()
  for (let i = currentYear; i >= currentYear - 3; i--) {
    tahunOptions.push({ value: i.toString(), label: i.toString() })
  }

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

    const folderPath = generateFolderPath(formData.nomorSK, formData.jenisHonor, formData.tahun)
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

  const handleOpenModal = async (assignment = null) => {
    if (assignment) {
      setEditingId(assignment.id)
      setFormData({
        nomorSK: assignment.nomorSK || '',
        tanggalSK: assignment.tanggalSK ? formatDateInput(assignment.tanggalSK) : '',
        perihal: assignment.perihal || '',
        dasarHukum: assignment.dasarHukum || '',
        jenisHonor: assignment.jenisHonor || '',
        kegiatanId: assignment.kegiatanId?.toString() || '',
        tahun: assignment.tahun || new Date().getFullYear().toString(),
        pagu: assignment.pagu?.toString() || '',
        sumberDana: assignment.sumberDana || '',
        akun: assignment.akun || '',
        tanggalMulai: assignment.tanggalMulai ? formatDateInput(assignment.tanggalMulai) : '',
        tanggalSelesai: assignment.tanggalSelesai ? formatDateInput(assignment.tanggalSelesai) : '',
        keterangan: assignment.keterangan || '',
        status: assignment.status || 'draft'
      })

      // Load existing checklist
      const existingChecklist = await db.honorChecklist.where('assignmentId').equals(assignment.id).first()
      if (existingChecklist?.items) {
        setChecklistItems(existingChecklist.items)
      } else {
        setChecklistItems(initializeChecklist())
      }
    } else {
      setEditingId(null)
      setFormData(initialFormData)
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
        nomorSK: formData.nomorSK,
        tanggalSK: formData.tanggalSK ? new Date(formData.tanggalSK) : null,
        perihal: formData.perihal,
        dasarHukum: formData.dasarHukum,
        jenisHonor: formData.jenisHonor,
        kegiatanId: formData.kegiatanId ? parseInt(formData.kegiatanId) : null,
        tahun: formData.tahun,
        pagu: parseInt(formData.pagu) || 0,
        sumberDana: formData.sumberDana,
        akun: formData.akun,
        tanggalMulai: formData.tanggalMulai ? new Date(formData.tanggalMulai) : null,
        tanggalSelesai: formData.tanggalSelesai ? new Date(formData.tanggalSelesai) : null,
        keterangan: formData.keterangan,
        status: formData.status,
        updatedAt: new Date()
      }

      let assignmentId

      if (editingId) {
        await db.honorAssignment.update(editingId, data)
        assignmentId = editingId
      } else {
        data.createdAt = new Date()
        assignmentId = await db.honorAssignment.add(data)
      }

      // Save checklist
      const itemLengkap = checklistItems.filter(item => item.ada).length
      const totalItem = checklistItems.length
      const wajibLengkap = checklistItems.filter(item => item.wajib && item.ada).length
      const totalWajib = checklistItems.filter(item => item.wajib).length
      const statusKelengkapan = wajibLengkap === totalWajib ? 'lengkap' : 'belum_lengkap'

      const checklistData = {
        assignmentId,
        nominatifId: null,
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
      const existingChecklist = await db.honorChecklist.where('assignmentId').equals(assignmentId).first()
      if (existingChecklist) {
        await db.honorChecklist.update(existingChecklist.id, checklistData)
      } else {
        checklistData.createdAt = new Date()
        await db.honorChecklist.add(checklistData)
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
      // Delete related checklist
      await db.honorChecklist.where('assignmentId').equals(deletingId).delete()
      await db.honorAssignment.delete(deletingId)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (assignment) => {
    const checklist = await db.honorChecklist.where('assignmentId').equals(assignment.id).first()
    setViewingData({ ...assignment, checklist })
    setIsViewModalOpen(true)
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  const getJenisLabel = (jenisId) => {
    return JENIS_HONOR.find(j => j.id === jenisId)?.nama || jenisId
  }

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'default',
      aktif: 'success',
      proses: 'warning',
      selesai: 'primary',
      batal: 'danger'
    }
    return <Badge variant={variants[status] || 'default'}>{getStatusHonorLabel(status)}</Badge>
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

  // Stats
  const totalAktif = allAssignments.filter(a => a.status === 'aktif').length
  const totalProses = allAssignments.filter(a => a.status === 'proses').length
  const totalSelesai = allAssignments.filter(a => a.status === 'selesai').length
  const totalPagu = allAssignments.reduce((sum, a) => sum + (a.pagu || 0), 0)

  return (
    <Layout title="Dasar Penugasan Honor">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total SK</p>
            <p className="text-2xl font-bold">{allAssignments.length}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">SK Aktif</p>
            <p className="text-2xl font-bold">{totalAktif}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Dalam Proses</p>
            <p className="text-2xl font-bold">{totalProses}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Pagu</p>
            <p className="text-xl font-bold">{formatRupiah(totalPagu)}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Daftar SK Penugasan Honor
            </CardTitle>
            <CardDescription>
              Kelola surat keputusan penugasan honorarium dan checklist dokumen untuk PUM
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={filterTahun}
              onChange={(e) => {
                setFilterTahun(e.target.value)
                setCurrentPage(1)
              }}
              options={tahunOptions}
              placeholder="Semua Tahun"
              className="w-full sm:w-28"
            />
            <Select
              value={filterJenis}
              onChange={(e) => {
                setFilterJenis(e.target.value)
                setCurrentPage(1)
              }}
              options={jenisHonorOptions}
              placeholder="Semua Jenis"
              className="w-full sm:w-40"
            />
            <Select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              options={statusOptions}
              placeholder="Semua Status"
              className="w-full sm:w-36"
            />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nomor/perihal..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-48"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Tambah SK
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>Nomor SK</TableHeader>
                <TableHeader>Perihal</TableHeader>
                <TableHeader>Jenis Honor</TableHeader>
                <TableHeader>Pagu</TableHeader>
                <TableHeader>Checklist SPJ</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAssignments.length > 0 ? (
                paginatedAssignments.map((assignment, index) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{assignment.nomorSK}</p>
                        <p className="text-xs text-gray-500">
                          {assignment.tanggalSK ? formatTanggal(assignment.tanggalSK, 'short') : '-'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="line-clamp-2 text-sm">{assignment.perihal}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{getJenisLabel(assignment.jenisHonor)}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatRupiah(assignment.pagu)}
                    </TableCell>
                    <TableCell>
                      {getChecklistBadge(assignment.checklistStatus, assignment.checklistItemLengkap, assignment.checklistTotalItem)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(assignment.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(assignment)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(assignment)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(assignment.id)}
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
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada SK Penugasan'}
                  colSpan={8}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAssignments.length}
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
        title={editingId ? 'Edit SK Penugasan' : 'Tambah SK Penugasan'}
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
              Informasi SK
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
            <div className="space-y-4">
              {/* SK Info */}
              <div className="border-b pb-3">
                <h4 className="font-medium text-gray-700 mb-3">Informasi SK</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nomor SK"
                    name="nomorSK"
                    value={formData.nomorSK}
                    onChange={handleInputChange}
                    placeholder="Nomor SK Penugasan"
                    required
                  />
                  <Input
                    label="Tanggal SK"
                    name="tanggalSK"
                    type="date"
                    value={formData.tanggalSK}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <Input
                  label="Perihal"
                  name="perihal"
                  value={formData.perihal}
                  onChange={handleInputChange}
                  required
                  className="mt-3"
                />
                <Textarea
                  label="Dasar Hukum"
                  name="dasarHukum"
                  value={formData.dasarHukum}
                  onChange={handleInputChange}
                  rows={2}
                  className="mt-3"
                  placeholder="Peraturan/Undang-undang yang menjadi dasar..."
                />
              </div>

              {/* Honor Details */}
              <div className="border-b pb-3">
                <h4 className="font-medium text-gray-700 mb-3">Detail Honorarium</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Jenis Honor"
                    name="jenisHonor"
                    value={formData.jenisHonor}
                    onChange={handleInputChange}
                    options={jenisHonorOptions}
                    required
                  />
                  <Select
                    label="Link Kegiatan (Opsional)"
                    name="kegiatanId"
                    value={formData.kegiatanId}
                    onChange={handleInputChange}
                    options={kegiatanOptions}
                    placeholder="Pilih kegiatan swakelola..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <Select
                    label="Tahun"
                    name="tahun"
                    value={formData.tahun}
                    onChange={handleInputChange}
                    options={tahunOptions}
                    required
                  />
                  <Select
                    label="Sumber Dana"
                    name="sumberDana"
                    value={formData.sumberDana}
                    onChange={handleInputChange}
                    options={sumberDanaOptions}
                    required
                  />
                  <Input
                    label="Akun/MAK"
                    name="akun"
                    value={formData.akun}
                    onChange={handleInputChange}
                    placeholder="521213"
                  />
                </div>
                <CurrencyInput
                  label="Pagu Anggaran"
                  name="pagu"
                  value={formData.pagu}
                  onChange={handleInputChange}
                  required
                  className="mt-3"
                />
              </div>

              {/* Period & Status */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Periode & Status</h4>
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <Select
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    options={statusOptions}
                  />
                  <Textarea
                    label="Keterangan"
                    name="keterangan"
                    value={formData.keterangan}
                    onChange={handleInputChange}
                    rows={2}
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
                    <p className="font-medium text-blue-900">Checklist Dokumen SPJ Honorarium</p>
                    <p className="text-sm text-blue-700">
                      Upload dokumen yang diperlukan untuk diserahkan ke Pemegang Uang Muka (PUM).
                      Berdasarkan Kepmen KP No.56 Tahun 2024.
                    </p>
                  </div>
                </div>
              </div>

              {/* Folder Path Display */}
              {formData.nomorSK && formData.jenisHonor && (
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                  <FolderOpen className="w-4 h-4" />
                  <span>Folder: {generateFolderPath(formData.nomorSK, formData.jenisHonor, formData.tahun)}</span>
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
              {editingId ? 'Simpan Perubahan' : 'Simpan'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail SK Penugasan"
        size="lg"
      >
        {viewingData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Nomor SK</label>
                <p className="font-medium">{viewingData.nomorSK}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tanggal SK</label>
                <p>{viewingData.tanggalSK ? formatTanggal(viewingData.tanggalSK) : '-'}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Perihal</label>
              <p className="font-bold">{viewingData.perihal}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500">Dasar Hukum</label>
              <p className="text-sm">{viewingData.dasarHukum || '-'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Jenis Honor</label>
                <p>{getJenisLabel(viewingData.jenisHonor)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(viewingData.status)}</div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <label className="text-xs text-green-700">Pagu Anggaran</label>
              <p className="text-2xl font-bold text-green-600">{formatRupiah(viewingData.pagu)}</p>
              <p className="text-sm text-green-600 mt-1">
                {viewingData.sumberDana?.toUpperCase()} | Akun: {viewingData.akun || '-'}
              </p>
            </div>

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

            {viewingData.keterangan && (
              <div>
                <label className="text-xs text-gray-500">Keterangan</label>
                <p className="text-sm">{viewingData.keterangan}</p>
              </div>
            )}

            <div className="text-xs text-gray-400 border-t pt-3">
              <p>Dibuat: {viewingData.createdAt ? formatTanggal(viewingData.createdAt) : '-'}</p>
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
          Apakah Anda yakin ingin menghapus SK Penugasan ini? Data nominatif, kwitansi, dan checklist terkait juga akan dihapus.
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
