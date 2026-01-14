import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, ListChecks, Eye, Printer, CheckCircle, XCircle, FileText, Download, Upload, FolderOpen
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { ChecklistItemUpload } from '../../components/ui/ChecklistFileUpload'
import db, { CHECKLIST_SWAKELOLA, CHECKLIST_TYPES, getChecklistFiles, downloadChecklistFile } from '../../db/database'
import { formatTanggal, formatDateInput } from '../../utils/formatters'
import { generateChecklistSwakelolaSpjPDF } from '../../utils/swakelolaDocGenerator'

const initialFormData = {
  kegiatanId: '',
  rampungId: '',
  namaPemeriksa: '',
  tanggalPemeriksaan: '',
  catatan: ''
}

// Helper function to generate folder path for swakelola
const generateFolderPath = (kegiatan) => {
  if (!kegiatan) return ''
  const tahun = new Date().getFullYear()
  const kodeClean = kegiatan.kode?.replace(/[/\\:*?"<>|]/g, '-') || 'NoKode'
  return `SPJ_SWAKELOLA/${tahun}/${kodeClean}`
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

export default function SwakelolaChecklist() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [checklistItems, setChecklistItems] = useState([])
  const [selectedKegiatan, setSelectedKegiatan] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allChecklist = useLiveQuery(async () => {
    const checklist = await db.swakelolaChecklist.orderBy('createdAt').reverse().toArray()
    return Promise.all(checklist.map(async (c) => {
      const kegiatan = await db.swakelolaKegiatan.get(c.kegiatanId)
      const rampung = c.rampungId ? await db.swakelolaRampung.get(c.rampungId) : null
      return { ...c, kegiatan, rampung }
    }))
  }) || []

  const allKegiatan = useLiveQuery(() => db.swakelolaKegiatan.toArray()) || []
  const allRampung = useLiveQuery(() => db.swakelolaRampung.toArray()) || []

  // Filter by kegiatan and search
  const filteredChecklist = allChecklist.filter(c => {
    const matchSearch = c.kegiatan?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.namaPemeriksa?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchKegiatan = !selectedKegiatan || c.kegiatanId === parseInt(selectedKegiatan)
    return matchSearch && matchKegiatan
  })

  // Pagination
  const totalPages = Math.ceil(filteredChecklist.length / itemsPerPage)
  const paginatedChecklist = filteredChecklist.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Options
  const kegiatanOptions = allKegiatan.map(k => ({
    value: k.id.toString(),
    label: `${k.kode} - ${k.nama}`
  }))

  const rampungOptions = allRampung
    .filter(r => {
      if (!formData.kegiatanId) return true
      const kegiatanNum = parseInt(formData.kegiatanId, 10)
      return !isNaN(kegiatanNum) && r.kegiatanId === kegiatanNum
    })
    .map(r => ({
      value: r.id.toString(),
      label: `${r.nomorKwitansi} - ${formatTanggal(r.tanggal, 'short')}`
    }))

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (name === 'kegiatanId') {
      setFormData(prev => ({ ...prev, kegiatanId: value, rampungId: '' }))
    }
  }

  const handleChecklistChange = (id, field, value) => {
    setChecklistItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const initializeChecklist = () => {
    return CHECKLIST_SWAKELOLA.map(item => ({
      ...item,
      ada: false,
      catatan: ''
    }))
  }

  const handleOpenModal = async (checklist = null) => {
    if (checklist) {
      setEditingId(checklist.id)
      setFormData({
        kegiatanId: checklist.kegiatanId?.toString() || '',
        rampungId: checklist.rampungId?.toString() || '',
        namaPemeriksa: checklist.namaPemeriksa || '',
        tanggalPemeriksaan: checklist.tanggalPemeriksaan ? formatDateInput(checklist.tanggalPemeriksaan) : formatDateInput(new Date()),
        catatan: checklist.catatan || ''
      })
      setChecklistItems(checklist.items || initializeChecklist())
    } else {
      setEditingId(null)
      setFormData({
        ...initialFormData,
        tanggalPemeriksaan: formatDateInput(new Date())
      })
      setChecklistItems(initializeChecklist())
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData(initialFormData)
    setChecklistItems([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const itemLengkap = checklistItems.filter(item => item.ada).length
      const totalItem = checklistItems.length
      const wajibLengkap = checklistItems.filter(item => item.wajib && item.ada).length
      const totalWajib = checklistItems.filter(item => item.wajib).length
      const statusKelengkapan = wajibLengkap === totalWajib ? 'lengkap' : 'belum_lengkap'

      const data = {
        kegiatanId: parseInt(formData.kegiatanId),
        rampungId: formData.rampungId ? parseInt(formData.rampungId) : null,
        items: checklistItems,
        statusKelengkapan,
        totalItem,
        itemLengkap,
        namaPemeriksa: formData.namaPemeriksa,
        tanggalPemeriksaan: formData.tanggalPemeriksaan ? new Date(formData.tanggalPemeriksaan) : new Date(),
        catatan: formData.catatan,
        updatedAt: new Date()
      }

      if (editingId) {
        await db.swakelolaChecklist.update(editingId, data)
      } else {
        data.createdAt = new Date()
        await db.swakelolaChecklist.add(data)
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
      await db.swakelolaChecklist.delete(deletingId)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (checklist) => {
    // Load fresh data with kegiatan info
    const kegiatan = await db.swakelolaKegiatan.get(checklist.kegiatanId)
    setViewingData({ ...checklist, kegiatan })
    setIsViewModalOpen(true)
  }

  // Upload file from View Modal
  const handleViewUpload = async (itemId, files) => {
    if (!files || files.length === 0 || !viewingData) return

    const updatedItems = [...viewingData.items]
    const itemIndex = updatedItems.findIndex(item => item.id === itemId)
    if (itemIndex === -1) return

    const uploadedFiles = updatedItems[itemIndex].uploadedFiles || []
    const kegiatan = viewingData.kegiatan

    for (const file of files) {
      try {
        const base64 = await fileToBase64(file)
        const folderPath = generateFolderPath(kegiatan)

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
    updatedItems[itemIndex].ada = true

    // Update database
    const itemLengkap = updatedItems.filter(item => item.ada).length
    await db.swakelolaChecklist.update(viewingData.id, {
      items: updatedItems,
      itemLengkap,
      statusKelengkapan: itemLengkap === updatedItems.length ? 'lengkap' : 'belum_lengkap',
      updatedAt: new Date()
    })

    setViewingData(prev => ({
      ...prev,
      items: updatedItems,
      itemLengkap,
      statusKelengkapan: itemLengkap === updatedItems.length ? 'lengkap' : 'belum_lengkap'
    }))
  }

  // Remove file from View Modal
  const handleViewRemoveFile = async (itemId, fileIndex) => {
    if (!viewingData) return

    const updatedItems = [...viewingData.items]
    const itemIndex = updatedItems.findIndex(item => item.id === itemId)
    if (itemIndex === -1) return

    updatedItems[itemIndex].uploadedFiles.splice(fileIndex, 1)

    // If no files left, uncheck the item
    if (updatedItems[itemIndex].uploadedFiles.length === 0) {
      updatedItems[itemIndex].ada = false
    }

    const itemLengkap = updatedItems.filter(item => item.ada).length
    await db.swakelolaChecklist.update(viewingData.id, {
      items: updatedItems,
      itemLengkap,
      statusKelengkapan: itemLengkap === updatedItems.length ? 'lengkap' : 'belum_lengkap',
      updatedAt: new Date()
    })

    setViewingData(prev => ({
      ...prev,
      items: updatedItems,
      itemLengkap,
      statusKelengkapan: itemLengkap === updatedItems.length ? 'lengkap' : 'belum_lengkap'
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

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  const handlePrint = async (checklist) => {
    try {
      const kegiatan = await db.swakelolaKegiatan.get(checklist.kegiatanId)
      await generateChecklistSwakelolaSpjPDF(checklist, kegiatan)
    } catch (error) {
      alert('Gagal mencetak checklist: ' + error.message)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      lengkap: 'success',
      belum_lengkap: 'warning'
    }
    const labels = {
      lengkap: 'Lengkap',
      belum_lengkap: 'Belum Lengkap'
    }
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  // Calculate checklist progress
  const itemLengkap = checklistItems.filter(item => item.ada).length
  const totalItem = checklistItems.length
  const wajibLengkap = checklistItems.filter(item => item.wajib && item.ada).length
  const totalWajib = checklistItems.filter(item => item.wajib).length

  return (
    <Layout title="Checklist SPJ Swakelola">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary-600" />
              Checklist SPJ Swakelola
            </CardTitle>
            <CardDescription>
              Verifikasi kelengkapan dokumen SPJ berdasarkan Kepmen KP No.56 Tahun 2024
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={selectedKegiatan}
              onChange={(e) => {
                setSelectedKegiatan(e.target.value)
                setCurrentPage(1)
              }}
              options={kegiatanOptions}
              placeholder="Semua Kegiatan"
              className="w-full sm:w-48"
            />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-48"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Buat Checklist
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>Tanggal</TableHeader>
                <TableHeader>Kegiatan</TableHeader>
                <TableHeader>Pemeriksa</TableHeader>
                <TableHeader>Kelengkapan</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedChecklist.length > 0 ? (
                paginatedChecklist.map((c, index) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      {formatTanggal(c.tanggalPemeriksaan)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-mono text-xs">{c.kegiatan?.kode}</p>
                        <p className="text-xs text-gray-500 truncate">{c.kegiatan?.nama}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.namaPemeriksa || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${c.statusKelengkapan === 'lengkap' ? 'bg-green-500' : 'bg-yellow-500'}`}
                            style={{ width: `${(c.itemLengkap / c.totalItem) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {c.itemLengkap}/{c.totalItem}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(c.statusKelengkapan)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(c)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(c)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Cetak"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(c)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(c.id)}
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
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada checklist'}
                  colSpan={7}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredChecklist.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Edit Checklist' : 'Buat Checklist'}
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Kegiatan Swakelola"
                name="kegiatanId"
                value={formData.kegiatanId}
                onChange={handleInputChange}
                options={kegiatanOptions}
                required
              />
              <Select
                label="Rampung (Opsional)"
                name="rampungId"
                value={formData.rampungId}
                onChange={handleInputChange}
                options={rampungOptions}
                placeholder="Pilih rampung terkait"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nama Pemeriksa"
                name="namaPemeriksa"
                value={formData.namaPemeriksa}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Tanggal Pemeriksaan"
                name="tanggalPemeriksaan"
                type="date"
                value={formData.tanggalPemeriksaan}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Checklist Items */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-primary-50 px-4 py-2 border-b">
                <h4 className="font-medium text-primary-700">Dokumen SPJ Swakelola (Kepmen KP No.56/2024)</h4>
                <p className="text-xs text-primary-600">Centang dokumen yang sudah lengkap dan upload file pendukung</p>
              </div>
              <div className="divide-y">
                {checklistItems.map((item) => {
                  const kegiatan = allKegiatan.find(k => k.id === parseInt(formData.kegiatanId))
                  const identifier = kegiatan?.kode || `SWK-${formData.kegiatanId}`
                  return (
                    <div key={item.id} className={`p-3 flex items-start gap-3 ${item.ada ? 'bg-green-50' : ''}`}>
                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={item.ada}
                          onChange={(e) => handleChecklistChange(item.id, 'ada', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <span className={`font-medium ${item.ada ? 'text-green-700' : 'text-gray-700'}`}>
                            {item.nama}
                          </span>
                          {item.wajib && (
                            <span className="ml-2 text-xs text-red-500">*wajib</span>
                          )}
                        </div>
                      </label>
                      <div className="flex items-center gap-2">
                        <ChecklistItemUpload
                          checklistType={CHECKLIST_TYPES.SWAKELOLA}
                          checklistId={editingId}
                          itemId={item.id}
                          identifier={identifier}
                          onFileChange={(itemId, file) => {
                            handleChecklistChange(itemId, 'fileId', file?.id || null)
                            handleChecklistChange(itemId, 'fileName', file?.fileName || null)
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Catatan..."
                          value={item.catatan}
                          onChange={(e) => handleChecklistChange(item.id, 'catatan', e.target.value)}
                          className="w-32 text-sm px-2 py-1 border rounded"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Progress Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progress Kelengkapan</span>
                <span className="text-sm text-gray-600">
                  {itemLengkap} / {totalItem} dokumen
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${wajibLengkap === totalWajib ? 'bg-green-500' : 'bg-yellow-500'}`}
                  style={{ width: `${(itemLengkap / totalItem) * 100}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-gray-500">
                  Wajib: {wajibLengkap}/{totalWajib}
                </span>
                <span className={wajibLengkap === totalWajib ? 'text-green-600 font-medium' : 'text-yellow-600'}>
                  {wajibLengkap === totalWajib ? 'Dokumen wajib lengkap' : 'Dokumen wajib belum lengkap'}
                </span>
              </div>
            </div>

            <Textarea
              label="Catatan Umum"
              name="catatan"
              value={formData.catatan}
              onChange={handleInputChange}
              rows={2}
              placeholder="Catatan tambahan..."
            />
          </div>

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
        title="Detail Checklist"
        size="lg"
      >
        {viewingData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Tanggal Pemeriksaan</label>
                <p>{formatTanggal(viewingData.tanggalPemeriksaan)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Pemeriksa</label>
                <p>{viewingData.namaPemeriksa}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Kegiatan</label>
              <p className="font-mono text-sm">{viewingData.kegiatan?.kode}</p>
              <p className="font-medium">{viewingData.kegiatan?.nama}</p>
            </div>

            {/* Checklist Items with Upload */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                <h4 className="font-medium text-gray-700">Kelengkapan Dokumen</h4>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FolderOpen className="w-4 h-4" />
                  <span className="font-mono">
                    {generateFolderPath(viewingData.kegiatan)}
                  </span>
                </div>
              </div>
              <div className="divide-y">
                {(viewingData.items || []).map((item) => (
                  <div key={item.id} className="p-4">
                    <div className="flex items-start gap-3">
                      {item.ada ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${item.ada ? 'text-green-700' : 'text-gray-700'}`}>
                            {item.nama}
                          </span>
                          {item.wajib && !item.ada && (
                            <Badge variant="danger">Wajib</Badge>
                          )}
                          {item.ada && (
                            <Badge variant="success">Lengkap</Badge>
                          )}
                        </div>
                        {item.catatan && (
                          <p className="text-xs text-gray-500 mt-1">{item.catatan}</p>
                        )}

                        {/* Uploaded Files */}
                        {item.uploadedFiles?.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {item.uploadedFiles.map((file, fileIndex) => (
                              <div key={fileIndex} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg text-sm">
                                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <button
                                  onClick={() => handleDownloadFile(file)}
                                  className="text-blue-700 hover:underline truncate flex-1 text-left"
                                >
                                  {file.name}
                                </button>
                                <span className="text-gray-500 text-xs flex-shrink-0">
                                  {(file.size / 1024).toFixed(1)} KB
                                </span>
                                <button
                                  onClick={() => handleDownloadFile(file)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleViewRemoveFile(item.id, fileIndex)}
                                  className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                                  title="Hapus File"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Upload Button */}
                        <div className="mt-3">
                          <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg cursor-pointer hover:bg-primary-100 transition-colors border border-primary-200">
                            <Upload className="w-4 h-4" />
                            {item.uploadedFiles?.length > 0 ? 'Tambah Dokumen' : 'Upload Dokumen'}
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                              onChange={(e) => handleViewUpload(item.id, e.target.files)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Kelengkapan</p>
                <p className="text-lg font-bold">
                  {viewingData.itemLengkap} / {viewingData.totalItem}
                </p>
              </div>
              {getStatusBadge(viewingData.statusKelengkapan)}
            </div>

            {viewingData.catatan && (
              <div>
                <label className="text-xs text-gray-500">Catatan</label>
                <p>{viewingData.catatan}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                onClick={() => handlePrint(viewingData)}
                icon={Printer}
                className="w-full"
              >
                Cetak Checklist
              </Button>
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
          Apakah Anda yakin ingin menghapus checklist ini?
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
