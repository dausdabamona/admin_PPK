import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, Users, Eye, Download
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, { GOLONGAN_OPTIONS } from '../../db/database'
import { formatTanggal } from '../../utils/formatters'

const initialFormData = {
  nik: '',
  npwp: '',
  nama: '',
  golongan: '',
  pangkat: '',
  jabatan: '',
  unitKerja: '',
  rekening: '',
  bank: '',
  statusPns: 'pns',
  statusAktif: 'aktif'
}

export default function HonorMaster() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterStatusPns, setFilterStatusPns] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allRecipients = useLiveQuery(() =>
    db.honorRecipient.orderBy('createdAt').reverse().toArray()
  ) || []

  // Filter
  const filteredRecipients = allRecipients.filter(r => {
    const matchSearch = r.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.nik?.includes(searchQuery) ||
      r.npwp?.includes(searchQuery)
    const matchStatus = !filterStatus || r.statusAktif === filterStatus
    const matchPns = !filterStatusPns || r.statusPns === filterStatusPns
    return matchSearch && matchStatus && matchPns
  })

  // Pagination
  const totalPages = Math.ceil(filteredRecipients.length / itemsPerPage)
  const paginatedRecipients = filteredRecipients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Options
  const golonganOptions = GOLONGAN_OPTIONS.map(g => ({
    value: g.id,
    label: g.nama
  }))

  const statusOptions = [
    { value: 'aktif', label: 'Aktif' },
    { value: 'non_aktif', label: 'Non Aktif' }
  ]

  const statusPnsOptions = [
    { value: 'pns', label: 'PNS/ASN' },
    { value: 'non_pns', label: 'Non PNS' }
  ]

  const bankOptions = [
    { value: 'BRI', label: 'BRI' },
    { value: 'BNI', label: 'BNI' },
    { value: 'Mandiri', label: 'Mandiri' },
    { value: 'BTN', label: 'BTN' },
    { value: 'BSI', label: 'BSI' },
    { value: 'Bank Papua', label: 'Bank Papua' },
    { value: 'Lainnya', label: 'Lainnya' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleOpenModal = (recipient = null) => {
    if (recipient) {
      setEditingId(recipient.id)
      setFormData({
        nik: recipient.nik || '',
        npwp: recipient.npwp || '',
        nama: recipient.nama || '',
        golongan: recipient.golongan || '',
        pangkat: recipient.pangkat || '',
        jabatan: recipient.jabatan || '',
        unitKerja: recipient.unitKerja || '',
        rekening: recipient.rekening || '',
        bank: recipient.bank || '',
        statusPns: recipient.statusPns || 'pns',
        statusAktif: recipient.statusAktif || 'aktif'
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
        golongan: formData.golongan,
        pangkat: formData.pangkat,
        jabatan: formData.jabatan,
        unitKerja: formData.unitKerja,
        rekening: formData.rekening,
        bank: formData.bank,
        statusPns: formData.statusPns,
        statusAktif: formData.statusAktif,
        updatedAt: new Date()
      }

      if (editingId) {
        await db.honorRecipient.update(editingId, data)
      } else {
        data.createdAt = new Date()
        await db.honorRecipient.add(data)
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
      await db.honorRecipient.delete(deletingId)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (recipient) => {
    setViewingData(recipient)
    setIsViewModalOpen(true)
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  const getStatusBadge = (status) => {
    const variants = {
      aktif: 'success',
      non_aktif: 'danger'
    }
    const labels = {
      aktif: 'Aktif',
      non_aktif: 'Non Aktif'
    }
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  const getPnsBadge = (status) => {
    return status === 'pns'
      ? <Badge variant="primary">PNS/ASN</Badge>
      : <Badge variant="warning">Non PNS</Badge>
  }

  // Stats
  const totalPns = allRecipients.filter(r => r.statusPns === 'pns').length
  const totalNonPns = allRecipients.filter(r => r.statusPns !== 'pns').length
  const totalAktif = allRecipients.filter(r => r.statusAktif === 'aktif').length

  return (
    <Layout title="Master Penerima Honor">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Penerima</p>
            <p className="text-2xl font-bold">{allRecipients.length}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">PNS/ASN</p>
            <p className="text-2xl font-bold">{totalPns}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Non PNS</p>
            <p className="text-2xl font-bold">{totalNonPns}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Aktif</p>
            <p className="text-2xl font-bold">{totalAktif}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              Master Data Penerima Honor
            </CardTitle>
            <CardDescription>
              Kelola data penerima honorarium dan jasa profesi
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={filterStatusPns}
              onChange={(e) => {
                setFilterStatusPns(e.target.value)
                setCurrentPage(1)
              }}
              options={statusPnsOptions}
              placeholder="Semua Tipe"
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
              Tambah Penerima
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
                <TableHeader>Golongan</TableHeader>
                <TableHeader>Jabatan</TableHeader>
                <TableHeader>Tipe</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRecipients.length > 0 ? (
                paginatedRecipients.map((recipient, index) => (
                  <TableRow key={recipient.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {recipient.nik}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{recipient.nama}</p>
                        <p className="text-xs text-gray-500">{recipient.unitKerja}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {recipient.golongan || '-'}
                    </TableCell>
                    <TableCell>
                      {recipient.jabatan || '-'}
                    </TableCell>
                    <TableCell>
                      {getPnsBadge(recipient.statusPns)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(recipient.statusAktif)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(recipient)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(recipient)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(recipient.id)}
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
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada data penerima honor'}
                  colSpan={8}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredRecipients.length}
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
        title={editingId ? 'Edit Data Penerima' : 'Tambah Data Penerima'}
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
              <Input
                label="Nama Lengkap"
                name="nama"
                value={formData.nama}
                onChange={handleInputChange}
                required
                className="mt-3"
              />
              <div className="grid grid-cols-2 gap-4 mt-3">
                <Select
                  label="Tipe Penerima"
                  name="statusPns"
                  value={formData.statusPns}
                  onChange={handleInputChange}
                  options={statusPnsOptions}
                  required
                />
                <Select
                  label="Status"
                  name="statusAktif"
                  value={formData.statusAktif}
                  onChange={handleInputChange}
                  options={statusOptions}
                />
              </div>
            </div>

            {/* Kepegawaian */}
            <div className="border-b pb-3">
              <h4 className="font-medium text-gray-700 mb-3">Kepegawaian</h4>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Golongan"
                  name="golongan"
                  value={formData.golongan}
                  onChange={handleInputChange}
                  options={golonganOptions}
                  placeholder="Pilih golongan"
                />
                <Input
                  label="Pangkat"
                  name="pangkat"
                  value={formData.pangkat}
                  onChange={handleInputChange}
                  placeholder="Misal: Penata Tk. I"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <Input
                  label="Jabatan"
                  name="jabatan"
                  value={formData.jabatan}
                  onChange={handleInputChange}
                  placeholder="Jabatan/Posisi"
                />
                <Input
                  label="Unit Kerja"
                  name="unitKerja"
                  value={formData.unitKerja}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Rekening */}
            <div>
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
        title="Detail Penerima Honor"
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
                <label className="text-xs text-gray-500">Tipe</label>
                <div className="mt-1">{getPnsBadge(viewingData.statusPns)}</div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(viewingData.statusAktif)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Golongan</label>
                <p>{viewingData.golongan || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Pangkat</label>
                <p>{viewingData.pangkat || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Jabatan</label>
                <p>{viewingData.jabatan || '-'}</p>
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

            <div className="text-xs text-gray-400 border-t pt-3">
              <p>Dibuat: {viewingData.createdAt ? formatTanggal(viewingData.createdAt) : '-'}</p>
              {viewingData.updatedAt && (
                <p>Diperbarui: {formatTanggal(viewingData.updatedAt)}</p>
              )}
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
          Apakah Anda yakin ingin menghapus data penerima honor ini? Data pembayaran terkait mungkin terpengaruh.
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
