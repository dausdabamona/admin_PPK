import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, ListChecks, Eye, FileText, UserPlus, Printer, Download
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, CurrencyInput, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, {
  JENIS_HONOR,
  STATUS_HONOR_NOMINATIF,
  SATUAN_HONOR,
  BULAN_INDONESIA,
  getStatusNominatifLabel,
  calculatePphHonor,
  getTarifPphLabel
} from '../../db/database'
import { formatTanggal, formatDateInput, formatRupiah } from '../../utils/formatters'

const initialFormData = {
  assignmentId: '',
  nomorNominatif: '',
  tanggal: '',
  bulan: '',
  tahun: new Date().getFullYear().toString(),
  jenisHonor: '',
  status: 'draft'
}

const initialItemData = {
  recipientId: '',
  uraianTugas: '',
  volume: '1',
  satuan: 'ok',
  tarifHonor: ''
}

export default function HonorNominatif() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [selectedNominatif, setSelectedNominatif] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [itemData, setItemData] = useState(initialItemData)
  const [editingItemId, setEditingItemId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString())
  const [filterBulan, setFilterBulan] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allNominatifs = useLiveQuery(() =>
    db.honorNominatif.orderBy('createdAt').reverse().toArray()
  ) || []

  const allAssignments = useLiveQuery(() =>
    db.honorAssignment.where('status').anyOf(['aktif', 'proses']).toArray()
  ) || []

  const allRecipients = useLiveQuery(() =>
    db.honorRecipient.where('statusAktif').equals('aktif').toArray()
  ) || []

  // Fetch items for selected nominatif
  const nominatifItems = useLiveQuery(
    () => selectedNominatif
      ? db.honorNominatifItem.where('nominatifId').equals(selectedNominatif.id).toArray()
      : [],
    [selectedNominatif?.id]
  ) || []

  // Filter
  const filteredNominatifs = allNominatifs.filter(n => {
    const matchSearch = n.nomorNominatif?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = !filterStatus || n.status === filterStatus
    const matchTahun = !filterTahun || n.tahun === filterTahun
    const matchBulan = !filterBulan || n.bulan?.toString() === filterBulan
    return matchSearch && matchStatus && matchTahun && matchBulan
  })

  // Pagination
  const totalPages = Math.ceil(filteredNominatifs.length / itemsPerPage)
  const paginatedNominatifs = filteredNominatifs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Options
  const assignmentOptions = allAssignments.map(a => ({
    value: a.id.toString(),
    label: `${a.nomorSK} - ${a.perihal}`
  }))

  const recipientOptions = allRecipients.map(r => ({
    value: r.id.toString(),
    label: `${r.nama} (${r.statusPns === 'pns' ? `Gol. ${r.golongan}` : 'Non PNS'})`
  }))

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'siap_bayar', label: 'Siap Bayar' },
    { value: 'dibayar', label: 'Sudah Dibayar' },
    { value: 'batal', label: 'Batal' }
  ]

  const bulanOptions = BULAN_INDONESIA.map(b => ({
    value: b.value.toString(),
    label: b.label
  }))

  const satuanOptions = SATUAN_HONOR.map(s => ({
    value: s.id,
    label: s.nama
  }))

  const jenisHonorOptions = JENIS_HONOR.map(j => ({
    value: j.id,
    label: j.nama
  }))

  const tahunOptions = []
  const currentYear = new Date().getFullYear()
  for (let i = currentYear; i >= currentYear - 3; i--) {
    tahunOptions.push({ value: i.toString(), label: i.toString() })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Auto-fill jenis honor from assignment
    if (name === 'assignmentId' && value) {
      const assignment = allAssignments.find(a => a.id.toString() === value)
      if (assignment) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          jenisHonor: assignment.jenisHonor
        }))
      }
    }
  }

  const handleItemInputChange = (e) => {
    const { name, value } = e.target
    setItemData(prev => ({ ...prev, [name]: value }))
  }

  const handleOpenModal = (nominatif = null) => {
    if (nominatif) {
      setEditingId(nominatif.id)
      setFormData({
        assignmentId: nominatif.assignmentId?.toString() || '',
        nomorNominatif: nominatif.nomorNominatif || '',
        tanggal: nominatif.tanggal ? formatDateInput(nominatif.tanggal) : '',
        bulan: nominatif.bulan?.toString() || '',
        tahun: nominatif.tahun || new Date().getFullYear().toString(),
        jenisHonor: nominatif.jenisHonor || '',
        status: nominatif.status || 'draft'
      })
    } else {
      setEditingId(null)
      setFormData(initialFormData)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData(initialFormData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        assignmentId: formData.assignmentId ? parseInt(formData.assignmentId) : null,
        nomorNominatif: formData.nomorNominatif,
        tanggal: formData.tanggal ? new Date(formData.tanggal) : null,
        bulan: formData.bulan ? parseInt(formData.bulan) : null,
        tahun: formData.tahun,
        jenisHonor: formData.jenisHonor,
        status: formData.status,
        totalBruto: 0,
        totalPph: 0,
        totalNetto: 0,
        updatedAt: new Date()
      }

      if (editingId) {
        await db.honorNominatif.update(editingId, data)
      } else {
        data.createdAt = new Date()
        await db.honorNominatif.add(data)
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
      // Delete items first
      await db.honorNominatifItem.where('nominatifId').equals(deletingId).delete()
      // Then delete nominatif
      await db.honorNominatif.delete(deletingId)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
      if (selectedNominatif?.id === deletingId) {
        setSelectedNominatif(null)
      }
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (nominatif) => {
    setSelectedNominatif(nominatif)
    setViewingData(nominatif)
    setIsViewModalOpen(true)
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  // Item management
  const handleOpenItemModal = (item = null) => {
    if (item) {
      setEditingItemId(item.id)
      setItemData({
        recipientId: item.recipientId?.toString() || '',
        uraianTugas: item.uraianTugas || '',
        volume: item.volume?.toString() || '1',
        satuan: item.satuan || 'ok',
        tarifHonor: item.tarifHonor?.toString() || ''
      })
    } else {
      setEditingItemId(null)
      setItemData(initialItemData)
    }
    setIsItemModalOpen(true)
  }

  const handleCloseItemModal = () => {
    setIsItemModalOpen(false)
    setEditingItemId(null)
    setItemData(initialItemData)
  }

  const handleSubmitItem = async (e) => {
    e.preventDefault()
    if (!selectedNominatif) return

    setLoading(true)
    try {
      const recipient = allRecipients.find(r => r.id.toString() === itemData.recipientId)
      const volume = parseInt(itemData.volume) || 1
      const tarifHonor = parseInt(itemData.tarifHonor) || 0
      const jumlahBruto = volume * tarifHonor

      // Calculate PPh
      const pphResult = calculatePphHonor(
        jumlahBruto,
        recipient?.golongan,
        !!recipient?.npwp,
        recipient?.statusPns === 'pns'
      )

      const data = {
        nominatifId: selectedNominatif.id,
        recipientId: parseInt(itemData.recipientId),
        uraianTugas: itemData.uraianTugas,
        volume,
        satuan: itemData.satuan,
        tarifHonor,
        jumlahBruto,
        tarifPph: pphResult.tarif,
        pphDipotong: pphResult.pph,
        jumlahNetto: jumlahBruto - pphResult.pph,
        createdAt: new Date()
      }

      if (editingItemId) {
        await db.honorNominatifItem.update(editingItemId, data)
      } else {
        await db.honorNominatifItem.add(data)
      }

      // Update totals in nominatif
      await updateNominatifTotals(selectedNominatif.id)

      handleCloseItemModal()
    } catch (error) {
      alert('Gagal menyimpan item: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Hapus penerima ini dari nominatif?')) return

    try {
      await db.honorNominatifItem.delete(itemId)
      await updateNominatifTotals(selectedNominatif.id)
    } catch (error) {
      alert('Gagal menghapus item: ' + error.message)
    }
  }

  const updateNominatifTotals = async (nominatifId) => {
    const items = await db.honorNominatifItem.where('nominatifId').equals(nominatifId).toArray()
    const totals = items.reduce((acc, item) => ({
      totalBruto: acc.totalBruto + (item.jumlahBruto || 0),
      totalPph: acc.totalPph + (item.pphDipotong || 0),
      totalNetto: acc.totalNetto + (item.jumlahNetto || 0)
    }), { totalBruto: 0, totalPph: 0, totalNetto: 0 })

    await db.honorNominatif.update(nominatifId, {
      ...totals,
      updatedAt: new Date()
    })
  }

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'default',
      siap_bayar: 'warning',
      dibayar: 'success',
      batal: 'danger'
    }
    return <Badge variant={variants[status] || 'default'}>{getStatusNominatifLabel(status)}</Badge>
  }

  const getBulanLabel = (bulan) => {
    return BULAN_INDONESIA.find(b => b.value === bulan)?.label || bulan
  }

  const getRecipientById = (id) => allRecipients.find(r => r.id === id)
  const getSatuanLabel = (satuanId) => SATUAN_HONOR.find(s => s.id === satuanId)?.nama || satuanId

  // Stats
  const totalNominatifs = allNominatifs.length
  const totalSiapBayar = allNominatifs.filter(n => n.status === 'siap_bayar').length
  const totalDibayar = allNominatifs.filter(n => n.status === 'dibayar').length
  const grandTotalBruto = allNominatifs.reduce((sum, n) => sum + (n.totalBruto || 0), 0)

  return (
    <Layout title="Daftar Nominatif Honor">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Nominatif</p>
            <p className="text-2xl font-bold">{totalNominatifs}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Siap Bayar</p>
            <p className="text-2xl font-bold">{totalSiapBayar}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Sudah Dibayar</p>
            <p className="text-2xl font-bold">{totalDibayar}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Honor</p>
            <p className="text-xl font-bold">{formatRupiah(grandTotalBruto)}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary-600" />
              Daftar Nominatif Honorarium
            </CardTitle>
            <CardDescription>
              Kelola daftar nominatif penerima honor
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
              value={filterBulan}
              onChange={(e) => {
                setFilterBulan(e.target.value)
                setCurrentPage(1)
              }}
              options={bulanOptions}
              placeholder="Semua Bulan"
              className="w-full sm:w-36"
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
                placeholder="Cari nomor..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-40"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Buat Nominatif
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>Nomor Nominatif</TableHeader>
                <TableHeader>Bulan/Tahun</TableHeader>
                <TableHeader>Jml Penerima</TableHeader>
                <TableHeader>Total Bruto</TableHeader>
                <TableHeader>Total PPh</TableHeader>
                <TableHeader>Total Netto</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedNominatifs.length > 0 ? (
                paginatedNominatifs.map((nominatif, index) => (
                  <TableRow key={nominatif.id} className={selectedNominatif?.id === nominatif.id ? 'bg-blue-50' : ''}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{nominatif.nomorNominatif}</p>
                        <p className="text-xs text-gray-500">
                          {nominatif.tanggal ? formatTanggal(nominatif.tanggal, 'short') : '-'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {nominatif.bulan ? getBulanLabel(nominatif.bulan) : '-'} {nominatif.tahun}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      -
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatRupiah(nominatif.totalBruto)}
                    </TableCell>
                    <TableCell className="font-medium text-red-600">
                      {formatRupiah(nominatif.totalPph)}
                    </TableCell>
                    <TableCell className="font-bold text-blue-600">
                      {formatRupiah(nominatif.totalNetto)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(nominatif.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(nominatif)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Lihat & Kelola"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(nominatif)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(nominatif.id)}
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
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada daftar nominatif'}
                  colSpan={9}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredNominatifs.length}
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
        title={editingId ? 'Edit Nominatif' : 'Buat Nominatif Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Select
              label="SK Penugasan"
              name="assignmentId"
              value={formData.assignmentId}
              onChange={handleInputChange}
              options={assignmentOptions}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nomor Nominatif"
                name="nomorNominatif"
                value={formData.nomorNominatif}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Tanggal"
                name="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Select
                label="Bulan"
                name="bulan"
                value={formData.bulan}
                onChange={handleInputChange}
                options={bulanOptions}
                required
              />
              <Select
                label="Tahun"
                name="tahun"
                value={formData.tahun}
                onChange={handleInputChange}
                options={tahunOptions}
                required
              />
              <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                options={statusOptions}
              />
            </div>
            <Select
              label="Jenis Honor"
              name="jenisHonor"
              value={formData.jenisHonor}
              onChange={handleInputChange}
              options={jenisHonorOptions}
              required
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

      {/* View/Manage Modal - Large with Items */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedNominatif(null)
        }}
        title="Detail Nominatif & Kelola Penerima"
        size="full"
      >
        {viewingData && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-xs text-gray-500">Nomor Nominatif</label>
                <p className="font-medium">{viewingData.nomorNominatif}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Periode</label>
                <p>{getBulanLabel(viewingData.bulan)} {viewingData.tahun}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tanggal</label>
                <p>{viewingData.tanggal ? formatTanggal(viewingData.tanggal) : '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(viewingData.status)}</div>
              </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-sm text-green-600">Total Bruto</p>
                <p className="text-xl font-bold text-green-700">{formatRupiah(viewingData.totalBruto)}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <p className="text-sm text-red-600">Total PPh</p>
                <p className="text-xl font-bold text-red-700">{formatRupiah(viewingData.totalPph)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-blue-600">Total Netto</p>
                <p className="text-xl font-bold text-blue-700">{formatRupiah(viewingData.totalNetto)}</p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">Daftar Penerima Honor</h4>
                <Button size="sm" icon={UserPlus} onClick={() => handleOpenItemModal()}>
                  Tambah Penerima
                </Button>
              </div>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>No</TableHeader>
                    <TableHeader>Nama</TableHeader>
                    <TableHeader>Golongan</TableHeader>
                    <TableHeader>Uraian Tugas</TableHeader>
                    <TableHeader>Vol x Tarif</TableHeader>
                    <TableHeader>Bruto</TableHeader>
                    <TableHeader>PPh</TableHeader>
                    <TableHeader>Netto</TableHeader>
                    <TableHeader>Aksi</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {nominatifItems.length > 0 ? (
                    nominatifItems.map((item, index) => {
                      const recipient = getRecipientById(item.recipientId)
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{recipient?.nama || '-'}</p>
                              <p className="text-xs text-gray-500">{recipient?.jabatan}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {recipient?.statusPns === 'pns' ? (
                              <Badge variant="primary">{recipient?.golongan}</Badge>
                            ) : (
                              <Badge variant="warning">Non PNS</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{item.uraianTugas}</TableCell>
                          <TableCell className="text-sm">
                            {item.volume} {getSatuanLabel(item.satuan)} x {formatRupiah(item.tarifHonor)}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatRupiah(item.jumlahBruto)}
                          </TableCell>
                          <TableCell className="text-red-600">
                            {formatRupiah(item.pphDipotong)}
                            <span className="text-xs text-gray-400 ml-1">({getTarifPphLabel(item.tarifPph)})</span>
                          </TableCell>
                          <TableCell className="font-bold text-blue-600">
                            {formatRupiah(item.jumlahNetto)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenItemModal(item)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableEmpty
                      message="Belum ada penerima dalam nominatif ini"
                      colSpan={9}
                    />
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Item Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={handleCloseItemModal}
        title={editingItemId ? 'Edit Penerima' : 'Tambah Penerima'}
        size="lg"
      >
        <form onSubmit={handleSubmitItem}>
          <div className="space-y-4">
            <Select
              label="Penerima Honor"
              name="recipientId"
              value={itemData.recipientId}
              onChange={handleItemInputChange}
              options={recipientOptions}
              required
            />
            <Textarea
              label="Uraian Tugas"
              name="uraianTugas"
              value={itemData.uraianTugas}
              onChange={handleItemInputChange}
              rows={2}
              required
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Volume"
                name="volume"
                type="number"
                min="1"
                value={itemData.volume}
                onChange={handleItemInputChange}
                required
              />
              <Select
                label="Satuan"
                name="satuan"
                value={itemData.satuan}
                onChange={handleItemInputChange}
                options={satuanOptions}
                required
              />
              <CurrencyInput
                label="Tarif Honor"
                name="tarifHonor"
                value={itemData.tarifHonor}
                onChange={handleItemInputChange}
                required
              />
            </div>
            {itemData.recipientId && itemData.tarifHonor && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="text-gray-600">
                  Estimasi: <span className="font-medium text-green-600">
                    {formatRupiah((parseInt(itemData.volume) || 1) * (parseInt(itemData.tarifHonor) || 0))}
                  </span>
                  {' '}(PPh akan dihitung otomatis berdasarkan golongan)
                </p>
              </div>
            )}
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseItemModal}>
              Batal
            </Button>
            <Button type="submit" loading={loading}>
              {editingItemId ? 'Simpan Perubahan' : 'Tambah'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus"
        size="sm"
      >
        <p className="text-gray-600">
          Apakah Anda yakin ingin menghapus nominatif ini? Semua item penerima juga akan dihapus.
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
