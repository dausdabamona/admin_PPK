import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, Package, Eye, FileText, ArrowRight, Calendar
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, CurrencyInput, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, {
  JENIS_PENGADAAN,
  METODE_PENGADAAN,
  SUMBER_DANA_PENGADAAN,
  WORKFLOW_STATUS_PENGADAAN,
  getWorkflowStatusLabel,
  withAuditCreate,
  withAuditUpdate,
  recordHistory,
  AUDIT_ACTIONS,
  generatePathArsipPengadaan
} from '../../db/database'
import { formatRupiah } from '../../utils/formatters'

const initialFormData = {
  kodePaket: '',
  namaPaket: '',
  jenisPengadaan: '',
  unitPengusul: '',
  nilaiPagu: '',
  sumberDana: '',
  akun: '',
  tahun: new Date().getFullYear().toString(),
  metode: 'pengadaan_langsung',
  keterangan: ''
}

export default function PengadaanMasterPaket() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString())
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allPaket = useLiveQuery(() =>
    db.procurementPackage.orderBy('createdAt').reverse().toArray()
  ) || []

  // Filter
  const filteredPaket = allPaket.filter(p => {
    const matchSearch = p.namaPaket?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kodePaket?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchJenis = !filterJenis || p.jenisPengadaan === filterJenis
    const matchStatus = !filterStatus || p.workflowStatus === filterStatus
    const matchTahun = !filterTahun || p.tahun === filterTahun
    return matchSearch && matchJenis && matchStatus && matchTahun
  })

  // Pagination
  const totalPages = Math.ceil(filteredPaket.length / itemsPerPage)
  const paginatedPaket = filteredPaket.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Options
  const jenisOptions = JENIS_PENGADAAN.map(j => ({ value: j.id, label: j.nama }))
  const metodeOptions = METODE_PENGADAAN.map(m => ({ value: m.id, label: m.nama }))
  const sumberDanaOptions = SUMBER_DANA_PENGADAAN.map(s => ({ value: s.id, label: s.nama }))

  const statusOptions = Object.entries(WORKFLOW_STATUS_PENGADAAN).map(([key, value]) => ({
    value: value,
    label: getWorkflowStatusLabel(value)
  }))

  const tahunOptions = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y >= currentYear - 3; y--) {
    tahunOptions.push({ value: y.toString(), label: y.toString() })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleOpenModal = (paket = null) => {
    if (paket) {
      setEditingId(paket.id)
      setFormData({
        kodePaket: paket.kodePaket || '',
        namaPaket: paket.namaPaket || '',
        jenisPengadaan: paket.jenisPengadaan || '',
        unitPengusul: paket.unitPengusul || '',
        nilaiPagu: paket.nilaiPagu?.toString() || '',
        sumberDana: paket.sumberDana || '',
        akun: paket.akun || '',
        tahun: paket.tahun || new Date().getFullYear().toString(),
        metode: paket.metode || 'pengadaan_langsung',
        keterangan: paket.keterangan || ''
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
      const nilaiPagu = parseInt(formData.nilaiPagu) || 0

      // Validate nilai pagu for pengadaan langsung (max 200jt)
      if (formData.metode === 'pengadaan_langsung' && nilaiPagu > 200000000) {
        alert('Nilai pagu untuk Pengadaan Langsung maksimal Rp 200.000.000')
        setLoading(false)
        return
      }

      const data = {
        kodePaket: formData.kodePaket,
        namaPaket: formData.namaPaket,
        jenisPengadaan: formData.jenisPengadaan,
        unitPengusul: formData.unitPengusul,
        nilaiPagu: nilaiPagu,
        sumberDana: formData.sumberDana,
        akun: formData.akun,
        tahun: formData.tahun,
        metode: formData.metode,
        keterangan: formData.keterangan,
        archivePath: generatePathArsipPengadaan(formData.tahun, formData.kodePaket)
      }

      if (editingId) {
        const existingPaket = await db.procurementPackage.get(editingId)
        const updatedData = withAuditUpdate(data, existingPaket?.revision || 0)
        await db.procurementPackage.update(editingId, updatedData)
        await recordHistory('procurementPackage', editingId, AUDIT_ACTIONS.UPDATE, existingPaket, { ...existingPaket, ...updatedData })
      } else {
        const newData = withAuditCreate({
          ...data,
          workflowStatus: WORKFLOW_STATUS_PENGADAAN.DRAFT
        })
        const newId = await db.procurementPackage.add(newData)
        await recordHistory('procurementPackage', newId, AUDIT_ACTIONS.CREATE, null, newData)
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
      const existingPaket = await db.procurementPackage.get(deletingId)
      await db.procurementPackage.delete(deletingId)
      await recordHistory('procurementPackage', deletingId, AUDIT_ACTIONS.DELETE, existingPaket, null)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (paket) => {
    setViewingData(paket)
    setIsViewModalOpen(true)
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  const getJenisLabel = (jenisId) => {
    return JENIS_PENGADAAN.find(j => j.id === jenisId)?.nama || jenisId
  }

  const getMetodeLabel = (metodeId) => {
    return METODE_PENGADAAN.find(m => m.id === metodeId)?.nama || metodeId
  }

  const getSumberDanaLabel = (sumberDanaId) => {
    return SUMBER_DANA_PENGADAAN.find(s => s.id === sumberDanaId)?.nama || sumberDanaId
  }

  const getStatusBadge = (status) => {
    const variants = {
      [WORKFLOW_STATUS_PENGADAAN.DRAFT]: 'default',
      [WORKFLOW_STATUS_PENGADAAN.PERENCANAAN]: 'info',
      [WORKFLOW_STATUS_PENGADAAN.PEMILIHAN_PENYEDIA]: 'warning',
      [WORKFLOW_STATUS_PENGADAAN.KONTRAK]: 'primary',
      [WORKFLOW_STATUS_PENGADAAN.PELAKSANAAN]: 'info',
      [WORKFLOW_STATUS_PENGADAAN.SERAH_TERIMA]: 'warning',
      [WORKFLOW_STATUS_PENGADAAN.PEMBAYARAN]: 'success',
      [WORKFLOW_STATUS_PENGADAAN.SELESAI]: 'success',
      [WORKFLOW_STATUS_PENGADAAN.BATAL]: 'danger'
    }
    return <Badge variant={variants[status] || 'default'}>{getWorkflowStatusLabel(status)}</Badge>
  }

  // Stats
  const totalNilai = allPaket.reduce((sum, p) => sum + (p.nilaiPagu || 0), 0)
  const totalDraft = allPaket.filter(p => p.workflowStatus === WORKFLOW_STATUS_PENGADAAN.DRAFT).length
  const totalProses = allPaket.filter(p =>
    p.workflowStatus !== WORKFLOW_STATUS_PENGADAAN.DRAFT &&
    p.workflowStatus !== WORKFLOW_STATUS_PENGADAAN.SELESAI &&
    p.workflowStatus !== WORKFLOW_STATUS_PENGADAAN.BATAL
  ).length
  const totalSelesai = allPaket.filter(p => p.workflowStatus === WORKFLOW_STATUS_PENGADAAN.SELESAI).length

  return (
    <Layout title="Master Paket Pengadaan">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Paket</p>
            <p className="text-2xl font-bold">{allPaket.length}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Draft</p>
            <p className="text-2xl font-bold">{totalDraft}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Dalam Proses</p>
            <p className="text-2xl font-bold">{totalProses}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Selesai</p>
            <p className="text-2xl font-bold">{totalSelesai}</p>
          </CardBody>
        </Card>
      </div>

      {/* Total Nilai */}
      <Card className="mb-6">
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Nilai Pagu (Tahun {filterTahun || 'Semua'})</p>
              <p className="text-2xl font-bold text-green-600">{formatRupiah(totalNilai)}</p>
            </div>
            <Package className="w-12 h-12 text-gray-300" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" />
              Daftar Paket Pengadaan
            </CardTitle>
            <CardDescription>
              Kelola paket pengadaan barang/jasa langsung
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
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
              options={jenisOptions}
              placeholder="Semua Jenis"
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
                placeholder="Cari paket..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-48"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Tambah Paket
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>Kode Paket</TableHeader>
                <TableHeader>Nama Paket</TableHeader>
                <TableHeader>Jenis</TableHeader>
                <TableHeader>Nilai Pagu</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPaket.length > 0 ? (
                paginatedPaket.map((paket, index) => (
                  <TableRow key={paket.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {paket.kodePaket}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{paket.namaPaket}</p>
                        <p className="text-xs text-gray-500">{paket.unitPengusul}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">{getJenisLabel(paket.jenisPengadaan)}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatRupiah(paket.nilaiPagu)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(paket.workflowStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(paket)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(paket)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(paket.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Hapus"
                          disabled={paket.workflowStatus !== WORKFLOW_STATUS_PENGADAAN.DRAFT}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableEmpty
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada paket pengadaan'}
                  colSpan={7}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredPaket.length}
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
        title={editingId ? 'Edit Paket Pengadaan' : 'Tambah Paket Pengadaan'}
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Identitas Paket */}
            <div className="border-b pb-3">
              <h4 className="font-medium text-gray-700 mb-3">Identitas Paket</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Kode Paket"
                  name="kodePaket"
                  value={formData.kodePaket}
                  onChange={handleInputChange}
                  placeholder="PL-2024-001"
                  required
                />
                <Select
                  label="Tahun Anggaran"
                  name="tahun"
                  value={formData.tahun}
                  onChange={handleInputChange}
                  options={tahunOptions}
                  required
                />
              </div>
              <Input
                label="Nama Paket Pengadaan"
                name="namaPaket"
                value={formData.namaPaket}
                onChange={handleInputChange}
                placeholder="Pengadaan Alat Laboratorium..."
                className="mt-3"
                required
              />
              <Input
                label="Unit Pengusul"
                name="unitPengusul"
                value={formData.unitPengusul}
                onChange={handleInputChange}
                placeholder="Bidang Penyelenggaraan Pelatihan"
                className="mt-3"
              />
            </div>

            {/* Jenis & Metode */}
            <div className="border-b pb-3">
              <h4 className="font-medium text-gray-700 mb-3">Jenis & Metode Pengadaan</h4>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Jenis Pengadaan"
                  name="jenisPengadaan"
                  value={formData.jenisPengadaan}
                  onChange={handleInputChange}
                  options={jenisOptions}
                  required
                />
                <Select
                  label="Metode Pengadaan"
                  name="metode"
                  value={formData.metode}
                  onChange={handleInputChange}
                  options={metodeOptions}
                  required
                />
              </div>
            </div>

            {/* Anggaran */}
            <div className="border-b pb-3">
              <h4 className="font-medium text-gray-700 mb-3">Informasi Anggaran</h4>
              <CurrencyInput
                label="Nilai Pagu (Rp)"
                name="nilaiPagu"
                value={formData.nilaiPagu}
                onChange={handleInputChange}
                required
              />
              {formData.metode === 'pengadaan_langsung' && parseInt(formData.nilaiPagu) > 200000000 && (
                <p className="text-sm text-red-600 mt-1">
                  Nilai pagu melebihi batas Pengadaan Langsung (maks. Rp 200.000.000)
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 mt-3">
                <Select
                  label="Sumber Dana"
                  name="sumberDana"
                  value={formData.sumberDana}
                  onChange={handleInputChange}
                  options={sumberDanaOptions}
                  required
                />
                <Input
                  label="Kode Akun"
                  name="akun"
                  value={formData.akun}
                  onChange={handleInputChange}
                  placeholder="526111"
                />
              </div>
            </div>

            {/* Keterangan */}
            <div>
              <Textarea
                label="Keterangan"
                name="keterangan"
                value={formData.keterangan}
                onChange={handleInputChange}
                rows={3}
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
        title="Detail Paket Pengadaan"
        size="lg"
      >
        {viewingData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs text-gray-500">Kode Paket</label>
                <p className="font-mono font-bold text-lg">{viewingData.kodePaket}</p>
              </div>
              <div>{getStatusBadge(viewingData.workflowStatus)}</div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Nama Paket</label>
              <p className="font-medium">{viewingData.namaPaket}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Jenis Pengadaan</label>
                <p>{getJenisLabel(viewingData.jenisPengadaan)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Metode</label>
                <p>{getMetodeLabel(viewingData.metode)}</p>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <label className="text-xs text-green-700">Nilai Pagu</label>
              <p className="text-2xl font-bold text-green-600">{formatRupiah(viewingData.nilaiPagu)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Sumber Dana</label>
                <p>{getSumberDanaLabel(viewingData.sumberDana)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Kode Akun</label>
                <p className="font-mono">{viewingData.akun || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Tahun Anggaran</label>
                <p>{viewingData.tahun}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Unit Pengusul</label>
                <p>{viewingData.unitPengusul || '-'}</p>
              </div>
            </div>

            {viewingData.keterangan && (
              <div>
                <label className="text-xs text-gray-500">Keterangan</label>
                <p className="text-sm">{viewingData.keterangan}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <label className="text-xs text-gray-500">Path Arsip</label>
              <p className="font-mono text-sm text-gray-600">{viewingData.archivePath}</p>
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
          Apakah Anda yakin ingin menghapus paket pengadaan ini? Tindakan ini tidak dapat dibatalkan.
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
