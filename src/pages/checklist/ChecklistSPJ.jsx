import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, CheckSquare, Eye, Printer,
  Check, X, AlertCircle
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, Textarea, Checkbox } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, { JENIS_PERJADIN, CHECKLIST_DALAM_KOTA, CHECKLIST_LUAR_KOTA } from '../../db/database'
import { formatTanggal, formatDateInput } from '../../utils/formatters'
import { generateChecklistPDF } from '../../utils/documentGenerator'

const initialFormData = {
  sppdId: '',
  namaPemeriksa: '',
  tanggalPemeriksaan: formatDateInput(new Date()),
  catatan: ''
}

export default function ChecklistSPJ() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [checklistItems, setChecklistItems] = useState([])
  const [selectedSPPD, setSelectedSPPD] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allChecklist = useLiveQuery(async () => {
    const checklists = await db.checklistSPJ.orderBy('createdAt').reverse().toArray()
    return Promise.all(checklists.map(async (c) => {
      const sppd = await db.sppd.get(c.sppdId)
      const pegawai = sppd ? await db.pegawai.get(sppd.pegawaiId) : null
      return { ...c, sppd, pegawai }
    }))
  }) || []

  // Get SPPD that don't have checklist yet
  const availableSPPD = useLiveQuery(async () => {
    const allSPPD = await db.sppd.toArray()
    const existingChecklist = await db.checklistSPJ.toArray()
    const checklistSPPDIds = existingChecklist.map(c => c.sppdId)

    const available = allSPPD.filter(s => !checklistSPPDIds.includes(s.id))

    return Promise.all(available.map(async (sppd) => {
      const pegawai = await db.pegawai.get(sppd.pegawaiId)
      return { ...sppd, pegawai }
    }))
  }) || []

  // Filter
  const filteredChecklist = allChecklist.filter(c =>
    c.sppd?.nomor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.pegawai?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.namaPemeriksa?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredChecklist.length / itemsPerPage)
  const paginatedChecklist = filteredChecklist.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const sppdOptions = availableSPPD.map(s => ({
    value: s.id.toString(),
    label: `${s.nomor} - ${s.pegawai?.nama} (${s.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA ? 'Dalam Kota' : 'Luar Kota'})`
  }))

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleChecklistChange = (index, field, value) => {
    const updated = [...checklistItems]
    updated[index][field] = value
    setChecklistItems(updated)
  }

  // Initialize checklist from SPPD
  const handleSPPDChange = (e) => {
    const sppdId = parseInt(e.target.value)
    setFormData(prev => ({ ...prev, sppdId: e.target.value }))

    if (sppdId) {
      const sppd = availableSPPD.find(s => s.id === sppdId)
      if (sppd) {
        setSelectedSPPD(sppd)

        // Load checklist template based on jenis perjadin
        const template = sppd.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA
          ? CHECKLIST_DALAM_KOTA
          : CHECKLIST_LUAR_KOTA

        setChecklistItems(template.map(item => ({
          id: item.id,
          nama: item.nama,
          wajib: item.wajib,
          checked: false,
          keterangan: ''
        })))
      }
    } else {
      setSelectedSPPD(null)
      setChecklistItems([])
    }
  }

  const handleOpenModal = async (checklist = null) => {
    if (checklist) {
      setEditingId(checklist.id)
      const sppd = await db.sppd.get(checklist.sppdId)
      setSelectedSPPD(sppd)
      setChecklistItems(checklist.items || [])

      setFormData({
        sppdId: checklist.sppdId?.toString() || '',
        namaPemeriksa: checklist.namaPemeriksa || '',
        tanggalPemeriksaan: formatDateInput(checklist.tanggalPemeriksaan),
        catatan: checklist.catatan || ''
      })
    } else {
      setEditingId(null)
      setSelectedSPPD(null)
      setChecklistItems([])
      setFormData({
        ...initialFormData,
        tanggalPemeriksaan: formatDateInput(new Date())
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setSelectedSPPD(null)
    setChecklistItems([])
    setFormData(initialFormData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const itemLengkap = checklistItems.filter(item => item.checked).length
      const totalItem = checklistItems.length

      const data = {
        sppdId: parseInt(formData.sppdId),
        jenisPerjadin: selectedSPPD?.jenisPerjadin,
        items: checklistItems,
        statusKelengkapan: itemLengkap === totalItem ? 'lengkap' : 'belum_lengkap',
        totalItem,
        itemLengkap,
        namaPemeriksa: formData.namaPemeriksa,
        tanggalPemeriksaan: new Date(formData.tanggalPemeriksaan),
        catatan: formData.catatan,
        updatedAt: new Date()
      }

      if (editingId) {
        await db.checklistSPJ.update(editingId, data)
      } else {
        data.createdAt = new Date()
        await db.checklistSPJ.add(data)
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
      await db.checklistSPJ.delete(deletingId)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (checklist) => {
    setViewingData(checklist)
    setIsViewModalOpen(true)
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  const handlePrint = async (checklist) => {
    const pegawai = await db.pegawai.get(checklist.pegawai?.id || checklist.sppd?.pegawaiId)
    const sppd = checklist.sppd || await db.sppd.get(checklist.sppdId)

    await generateChecklistPDF({
      ...checklist,
      pegawai,
      sppd
    })
  }

  const getProgressColor = (itemLengkap, totalItem) => {
    const percentage = (itemLengkap / totalItem) * 100
    if (percentage === 100) return 'bg-green-500'
    if (percentage >= 75) return 'bg-yellow-500'
    if (percentage >= 50) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <Layout title="Checklist SPJ SPPD">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary-600" />
              Checklist SPJ SPPD
            </CardTitle>
            <CardDescription>
              Verifikasi kelengkapan dokumen SPJ berdasarkan Kepmen KP No. 56 Tahun 2024
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari checklist..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-64"
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
                <TableHeader>SPPD</TableHeader>
                <TableHeader>Pegawai</TableHeader>
                <TableHeader>Jenis</TableHeader>
                <TableHeader>Kelengkapan</TableHeader>
                <TableHeader>Pemeriksa</TableHeader>
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
                    <TableCell className="font-mono text-xs">
                      {c.sppd?.nomor}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{c.pegawai?.nama}</p>
                        <p className="text-xs text-gray-500">{c.sppd?.kotaTujuan}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA ? 'info' : 'success'}>
                        {c.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA ? 'Dalam Kota' : 'Luar Kota'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${getProgressColor(c.itemLengkap, c.totalItem)}`}
                            style={{ width: `${(c.itemLengkap / c.totalItem) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {c.itemLengkap}/{c.totalItem}
                        </span>
                        {c.itemLengkap === c.totalItem ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{c.namaPemeriksa || '-'}</p>
                        <p className="text-xs text-gray-500">
                          {formatTanggal(c.tanggalPemeriksaan, 'short')}
                        </p>
                      </div>
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
                          onClick={() => handleOpenModal(c)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(c)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Cetak"
                        >
                          <Printer className="w-4 h-4" />
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
        title={editingId ? 'Edit Checklist SPJ' : 'Buat Checklist SPJ'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!editingId && (
              <Select
                label="Pilih SPPD"
                name="sppdId"
                value={formData.sppdId}
                onChange={handleSPPDChange}
                options={sppdOptions}
                required
              />
            )}

            {selectedSPPD && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Jenis Checklist:</strong>{' '}
                  <Badge variant={selectedSPPD.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA ? 'info' : 'success'}>
                    {selectedSPPD.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA
                      ? 'Checklist SPJ Dalam Kota'
                      : 'Checklist SPJ Luar Kota'
                    }
                  </Badge>
                </p>
                <p className="text-sm text-blue-900 mt-1">
                  <strong>Pegawai:</strong> {selectedSPPD.pegawai?.nama}
                </p>
                <p className="text-sm text-blue-900 mt-1">
                  <strong>Tujuan:</strong> {selectedSPPD.kotaTujuan}
                </p>
              </div>
            )}

            {/* Checklist Items */}
            {checklistItems.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h4 className="font-medium text-gray-700">Kelengkapan Dokumen</h4>
                </div>
                <div className="divide-y">
                  {checklistItems.map((item, index) => (
                    <div key={item.id} className="p-4 flex items-start gap-4">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={(e) => handleChecklistChange(index, 'checked', e.target.checked)}
                          className="w-5 h-5 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${item.checked ? 'text-green-700' : 'text-gray-900'}`}>
                            {item.nama}
                          </span>
                          {item.wajib && (
                            <Badge variant="danger">Wajib</Badge>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Keterangan (opsional)"
                          value={item.keterangan}
                          onChange={(e) => handleChecklistChange(index, 'keterangan', e.target.value)}
                          className="input mt-2 text-sm"
                        />
                      </div>
                      <div className="pt-1">
                        {item.checked ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-gray-50 px-4 py-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Status: <strong>{checklistItems.filter(i => i.checked).length}/{checklistItems.length}</strong> dokumen lengkap
                    </span>
                    <div className="w-32 bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${getProgressColor(
                          checklistItems.filter(i => i.checked).length,
                          checklistItems.length
                        )}`}
                        style={{
                          width: `${(checklistItems.filter(i => i.checked).length / checklistItems.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nama Pemeriksa"
                name="namaPemeriksa"
                value={formData.namaPemeriksa}
                onChange={handleInputChange}
                placeholder="Nama pemeriksa dokumen"
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

            <Textarea
              label="Catatan"
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
              {editingId ? 'Simpan Perubahan' : 'Simpan Checklist'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail Checklist SPJ"
        size="lg"
      >
        {viewingData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">SPPD</label>
                <p className="font-mono">{viewingData.sppd?.nomor}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Jenis</label>
                <p>
                  <Badge variant={viewingData.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA ? 'info' : 'success'}>
                    {viewingData.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA ? 'Dalam Kota' : 'Luar Kota'}
                  </Badge>
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Pegawai</label>
              <p className="font-medium">{viewingData.pegawai?.nama}</p>
            </div>

            {/* Checklist Items */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h4 className="font-medium text-gray-700">Kelengkapan Dokumen</h4>
              </div>
              <div className="divide-y">
                {viewingData.items?.map((item, index) => (
                  <div key={index} className="p-3 flex items-center gap-3">
                    {item.checked ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                    <div className="flex-1">
                      <span className={item.checked ? 'text-green-700' : 'text-gray-700'}>
                        {item.nama}
                      </span>
                      {item.keterangan && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.keterangan}</p>
                      )}
                    </div>
                    {item.wajib && !item.checked && (
                      <Badge variant="danger">Belum</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Status Kelengkapan</span>
                <Badge variant={viewingData.statusKelengkapan === 'lengkap' ? 'success' : 'warning'}>
                  {viewingData.itemLengkap}/{viewingData.totalItem} Lengkap
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${getProgressColor(viewingData.itemLengkap, viewingData.totalItem)}`}
                  style={{ width: `${(viewingData.itemLengkap / viewingData.totalItem) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Pemeriksa</label>
                <p>{viewingData.namaPemeriksa}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tanggal Pemeriksaan</label>
                <p>{formatTanggal(viewingData.tanggalPemeriksaan)}</p>
              </div>
            </div>

            {viewingData.catatan && (
              <div>
                <label className="text-xs text-gray-500">Catatan</label>
                <p>{viewingData.catatan}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button icon={Printer} onClick={() => handlePrint(viewingData)}>
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
