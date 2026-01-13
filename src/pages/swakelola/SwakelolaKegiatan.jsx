import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, FolderKanban, Eye, Calendar, Banknote
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, Textarea, CurrencyInput } from '../../components/ui/Input'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import db, { STATUS_SWAKELOLA } from '../../db/database'
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
  status: STATUS_SWAKELOLA.DRAFT
}

export default function SwakelolaKegiatan() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allKegiatan = useLiveQuery(() =>
    db.swakelolaKegiatan.orderBy('createdAt').reverse().toArray()
  ) || []

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
        status: kegiatan.status || STATUS_SWAKELOLA.DRAFT
      })
    } else {
      setEditingId(null)
      // Auto-generate kode for new kegiatan
      const generatedKode = await generateKodeKegiatan()
      setFormData({
        ...initialFormData,
        kode: generatedKode
      })
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
        updatedAt: new Date()
      }

      if (editingId) {
        await db.swakelolaKegiatan.update(editingId, data)
      } else {
        data.createdAt = new Date()
        await db.swakelolaKegiatan.add(data)
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

    setViewingData({
      ...kegiatan,
      timCount,
      uangMukaCount
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
              Kelola kegiatan swakelola dan pagu anggaran
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
                <TableHeader>Tahun</TableHeader>
                <TableHeader>Pagu</TableHeader>
                <TableHeader>Sumber Dana</TableHeader>
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
                        <p className="text-xs text-gray-500 truncate">{kegiatan.deskripsi}</p>
                      </div>
                    </TableCell>
                    <TableCell>{kegiatan.tahun}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatRupiah(kegiatan.pagu)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">{kegiatan.sumberDana}</Badge>
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
                  colSpan={8}
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Edit Kegiatan Swakelola' : 'Tambah Kegiatan Swakelola'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
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
          Apakah Anda yakin ingin menghapus kegiatan ini? Semua data terkait (Tim, Uang Muka, Realisasi, Rampung) juga akan dihapus.
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
