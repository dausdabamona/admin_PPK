import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, Users, Eye, FileText
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, CurrencyInput, TextArea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, { POSISI_PJLP, STATUS_PJLP } from '../../db/database'
import { formatTanggal, formatDateInput, formatRupiah } from '../../utils/formatters'

const initialFormData = {
  nik: '',
  npwp: '',
  nama: '',
  posisi: '',
  unitKerja: '',
  rekening: '',
  bank: '',
  bpjsKesehatan: '',
  bpjsKetenagakerjaan: '',
  honorBulanan: '',
  masaKontrakMulai: '',
  masaKontrakSelesai: '',
  statusAktif: 'aktif'
}

export default function PjlpMaster() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPosisi, setFilterPosisi] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allPjlp = useLiveQuery(() =>
    db.pjlpMaster.orderBy('createdAt').reverse().toArray()
  ) || []

  // Filter
  const filteredPjlp = allPjlp.filter(p => {
    const matchSearch = p.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nik?.includes(searchQuery) ||
      p.npwp?.includes(searchQuery)
    const matchStatus = !filterStatus || p.statusAktif === filterStatus
    const matchPosisi = !filterPosisi || p.posisi === filterPosisi
    return matchSearch && matchStatus && matchPosisi
  })

  // Pagination
  const totalPages = Math.ceil(filteredPjlp.length / itemsPerPage)
  const paginatedPjlp = filteredPjlp.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Options
  const posisiOptions = POSISI_PJLP.map(p => ({
    value: p.id,
    label: p.nama
  }))

  const statusOptions = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'non_aktif', label: 'Non Aktif' },
    { value: 'selesai_kontrak', label: 'Selesai Kontrak' }
  ]

  const bankOptions = [
    { value: 'BRI', label: 'BRI' },
    { value: 'BNI', label: 'BNI' },
    { value: 'Mandiri', label: 'Mandiri' },
    { value: 'BTN', label: 'BTN' },
    { value: 'Bank Papua', label: 'Bank Papua' },
    { value: 'Lainnya', label: 'Lainnya' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleOpenModal = (pjlp = null) => {
    if (pjlp) {
      setEditingId(pjlp.id)
      setFormData({
        nik: pjlp.nik || '',
        npwp: pjlp.npwp || '',
        nama: pjlp.nama || '',
        posisi: pjlp.posisi || '',
        unitKerja: pjlp.unitKerja || '',
        rekening: pjlp.rekening || '',
        bank: pjlp.bank || '',
        bpjsKesehatan: pjlp.bpjsKesehatan || '',
        bpjsKetenagakerjaan: pjlp.bpjsKetenagakerjaan || '',
        honorBulanan: pjlp.honorBulanan?.toString() || '',
        masaKontrakMulai: formatDateInput(pjlp.masaKontrakMulai),
        masaKontrakSelesai: formatDateInput(pjlp.masaKontrakSelesai),
        statusAktif: pjlp.statusAktif || 'aktif'
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
        nik: formData.nik,
        npwp: formData.npwp,
        nama: formData.nama,
        posisi: formData.posisi,
        unitKerja: formData.unitKerja,
        rekening: formData.rekening,
        bank: formData.bank,
        bpjsKesehatan: formData.bpjsKesehatan,
        bpjsKetenagakerjaan: formData.bpjsKetenagakerjaan,
        honorBulanan: parseInt(formData.honorBulanan) || 0,
        masaKontrakMulai: formData.masaKontrakMulai ? new Date(formData.masaKontrakMulai) : null,
        masaKontrakSelesai: formData.masaKontrakSelesai ? new Date(formData.masaKontrakSelesai) : null,
        statusAktif: formData.statusAktif,
        updatedAt: new Date()
      }

      if (editingId) {
        await db.pjlpMaster.update(editingId, data)
      } else {
        data.createdAt = new Date()
        await db.pjlpMaster.add(data)
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
      await db.pjlpMaster.delete(deletingId)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (pjlp) => {
    setViewingData(pjlp)
    setIsViewModalOpen(true)
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  const getPosisiLabel = (posisiId) => {
    return POSISI_PJLP.find(p => p.id === posisiId)?.nama || posisiId
  }

  const getStatusBadge = (status) => {
    const variants = {
      aktif: 'success',
      non_aktif: 'danger',
      selesai_kontrak: 'default'
    }
    const labels = {
      aktif: 'Aktif',
      non_aktif: 'Non Aktif',
      selesai_kontrak: 'Selesai Kontrak'
    }
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  // Stats
  const totalAktif = allPjlp.filter(p => p.statusAktif === 'aktif').length
  const totalNonAktif = allPjlp.filter(p => p.statusAktif !== 'aktif').length

  return (
    <Layout title="Data PJLP">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total PJLP</p>
            <p className="text-2xl font-bold">{allPjlp.length}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">PJLP Aktif</p>
            <p className="text-2xl font-bold">{totalAktif}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Non Aktif / Selesai</p>
            <p className="text-2xl font-bold">{totalNonAktif}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              Master Data PJLP
            </CardTitle>
            <CardDescription>
              Kelola data Penyedia Jasa Lainnya Perseorangan
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={filterPosisi}
              onChange={(e) => {
                setFilterPosisi(e.target.value)
                setCurrentPage(1)
              }}
              options={posisiOptions}
              placeholder="Semua Posisi"
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
                placeholder="Cari nama/NIK..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-48"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Tambah PJLP
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>NIK</TableHeader>
                <TableHeader>Nama</TableHeader>
                <TableHeader>Posisi</TableHeader>
                <TableHeader>Honor Bulanan</TableHeader>
                <TableHeader>Masa Kontrak</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPjlp.length > 0 ? (
                paginatedPjlp.map((pjlp, index) => (
                  <TableRow key={pjlp.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {pjlp.nik}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{pjlp.nama}</p>
                        <p className="text-xs text-gray-500">{pjlp.unitKerja}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPosisiLabel(pjlp.posisi)}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatRupiah(pjlp.honorBulanan)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {pjlp.masaKontrakMulai && pjlp.masaKontrakSelesai ? (
                        <div>
                          <p>{formatTanggal(pjlp.masaKontrakMulai, 'short')}</p>
                          <p className="text-gray-500">s/d {formatTanggal(pjlp.masaKontrakSelesai, 'short')}</p>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(pjlp.statusAktif)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(pjlp)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(pjlp)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(pjlp.id)}
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
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada data PJLP'}
                  colSpan={8}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredPjlp.length}
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
        title={editingId ? 'Edit Data PJLP' : 'Tambah Data PJLP'}
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Identitas */}
            <div className="border-b pb-3">
              <h4 className="font-medium text-gray-700 mb-3">Identitas</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="NIK"
                  name="nik"
                  value={formData.nik}
                  onChange={handleInputChange}
                  placeholder="16 digit NIK"
                  maxLength={16}
                  required
                />
                <Input
                  label="NPWP (Opsional)"
                  name="npwp"
                  value={formData.npwp}
                  onChange={handleInputChange}
                  placeholder="15 digit NPWP"
                  maxLength={15}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <Input
                  label="Nama Lengkap"
                  name="nama"
                  value={formData.nama}
                  onChange={handleInputChange}
                  required
                />
                <Select
                  label="Posisi / Jabatan"
                  name="posisi"
                  value={formData.posisi}
                  onChange={handleInputChange}
                  options={posisiOptions}
                  required
                />
              </div>
              <Input
                label="Unit Kerja"
                name="unitKerja"
                value={formData.unitKerja}
                onChange={handleInputChange}
                className="mt-3"
              />
            </div>

            {/* Rekening */}
            <div className="border-b pb-3">
              <h4 className="font-medium text-gray-700 mb-3">Informasi Rekening</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nomor Rekening"
                  name="rekening"
                  value={formData.rekening}
                  onChange={handleInputChange}
                  required
                />
                <Select
                  label="Bank"
                  name="bank"
                  value={formData.bank}
                  onChange={handleInputChange}
                  options={bankOptions}
                  required
                />
              </div>
            </div>

            {/* BPJS */}
            <div className="border-b pb-3">
              <h4 className="font-medium text-gray-700 mb-3">BPJS</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="No. BPJS Kesehatan"
                  name="bpjsKesehatan"
                  value={formData.bpjsKesehatan}
                  onChange={handleInputChange}
                />
                <Input
                  label="No. BPJS Ketenagakerjaan"
                  name="bpjsKetenagakerjaan"
                  value={formData.bpjsKetenagakerjaan}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Kontrak */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Honor & Masa Kontrak</h4>
              <CurrencyInput
                label="Honor Bulanan"
                name="honorBulanan"
                value={formData.honorBulanan}
                onChange={handleInputChange}
                required
              />
              <div className="grid grid-cols-2 gap-4 mt-3">
                <Input
                  label="Masa Kontrak Mulai"
                  name="masaKontrakMulai"
                  type="date"
                  value={formData.masaKontrakMulai}
                  onChange={handleInputChange}
                />
                <Input
                  label="Masa Kontrak Selesai"
                  name="masaKontrakSelesai"
                  type="date"
                  value={formData.masaKontrakSelesai}
                  onChange={handleInputChange}
                />
              </div>
              <Select
                label="Status"
                name="statusAktif"
                value={formData.statusAktif}
                onChange={handleInputChange}
                options={statusOptions}
                className="mt-3"
              />
            </div>
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
        title="Detail PJLP"
        size="lg"
      >
        {viewingData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">NIK</label>
                <p className="font-mono">{viewingData.nik}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">NPWP</label>
                <p className="font-mono">{viewingData.npwp || '-'}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Nama Lengkap</label>
              <p className="text-lg font-bold">{viewingData.nama}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Posisi</label>
                <p>{getPosisiLabel(viewingData.posisi)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Unit Kerja</label>
                <p>{viewingData.unitKerja || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Rekening</label>
                <p className="font-mono">{viewingData.rekening}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Bank</label>
                <p>{viewingData.bank}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">BPJS Kesehatan</label>
                <p className="font-mono">{viewingData.bpjsKesehatan || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">BPJS Ketenagakerjaan</label>
                <p className="font-mono">{viewingData.bpjsKetenagakerjaan || '-'}</p>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <label className="text-xs text-green-700">Honor Bulanan</label>
              <p className="text-2xl font-bold text-green-600">{formatRupiah(viewingData.honorBulanan)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Masa Kontrak Mulai</label>
                <p>{viewingData.masaKontrakMulai ? formatTanggal(viewingData.masaKontrakMulai) : '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Masa Kontrak Selesai</label>
                <p>{viewingData.masaKontrakSelesai ? formatTanggal(viewingData.masaKontrakSelesai) : '-'}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Status</label>
              <div className="mt-1">{getStatusBadge(viewingData.statusAktif)}</div>
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
          Apakah Anda yakin ingin menghapus data PJLP ini? Data kontrak dan pembayaran terkait juga akan terpengaruh.
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
