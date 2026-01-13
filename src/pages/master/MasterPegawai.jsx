import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Pencil, Trash2, Search, Download, Upload } from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import db from '../../db/database'

const GOLONGAN_OPTIONS = [
  { value: 'I/a', label: 'I/a - Juru Muda' },
  { value: 'I/b', label: 'I/b - Juru Muda Tingkat I' },
  { value: 'I/c', label: 'I/c - Juru' },
  { value: 'I/d', label: 'I/d - Juru Tingkat I' },
  { value: 'II/a', label: 'II/a - Pengatur Muda' },
  { value: 'II/b', label: 'II/b - Pengatur Muda Tingkat I' },
  { value: 'II/c', label: 'II/c - Pengatur' },
  { value: 'II/d', label: 'II/d - Pengatur Tingkat I' },
  { value: 'III/a', label: 'III/a - Penata Muda' },
  { value: 'III/b', label: 'III/b - Penata Muda Tingkat I' },
  { value: 'III/c', label: 'III/c - Penata' },
  { value: 'III/d', label: 'III/d - Penata Tingkat I' },
  { value: 'IV/a', label: 'IV/a - Pembina' },
  { value: 'IV/b', label: 'IV/b - Pembina Tingkat I' },
  { value: 'IV/c', label: 'IV/c - Pembina Utama Muda' },
  { value: 'IV/d', label: 'IV/d - Pembina Utama Madya' },
  { value: 'IV/e', label: 'IV/e - Pembina Utama' }
]

const BANK_OPTIONS = [
  { value: 'BRI', label: 'Bank BRI' },
  { value: 'BNI', label: 'Bank BNI' },
  { value: 'Mandiri', label: 'Bank Mandiri' },
  { value: 'BTN', label: 'Bank BTN' },
  { value: 'BSI', label: 'Bank Syariah Indonesia' }
]

const initialFormData = {
  nip: '',
  nama: '',
  jabatan: '',
  golongan: '',
  pangkat: '',
  rekening: '',
  bank: '',
  unitKerja: ''
}

export default function MasterPegawai() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch pegawai data with live query
  const allPegawai = useLiveQuery(() => db.pegawai.toArray()) || []

  // Filter by search query
  const filteredPegawai = allPegawai.filter(p =>
    p.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.nip?.includes(searchQuery) ||
    p.jabatan?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredPegawai.length / itemsPerPage)
  const paginatedPegawai = filteredPegawai.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Get pangkat based on golongan
  const getPangkat = (golongan) => {
    const pangkatMap = {
      'I/a': 'Juru Muda',
      'I/b': 'Juru Muda Tingkat I',
      'I/c': 'Juru',
      'I/d': 'Juru Tingkat I',
      'II/a': 'Pengatur Muda',
      'II/b': 'Pengatur Muda Tingkat I',
      'II/c': 'Pengatur',
      'II/d': 'Pengatur Tingkat I',
      'III/a': 'Penata Muda',
      'III/b': 'Penata Muda Tingkat I',
      'III/c': 'Penata',
      'III/d': 'Penata Tingkat I',
      'IV/a': 'Pembina',
      'IV/b': 'Pembina Tingkat I',
      'IV/c': 'Pembina Utama Muda',
      'IV/d': 'Pembina Utama Madya',
      'IV/e': 'Pembina Utama'
    }
    return pangkatMap[golongan] || ''
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      // Auto-fill pangkat when golongan changes
      if (name === 'golongan') {
        updated.pangkat = getPangkat(value)
      }
      return updated
    })
  }

  const handleOpenModal = (pegawai = null) => {
    if (pegawai) {
      setEditingId(pegawai.id)
      setFormData({
        nip: pegawai.nip || '',
        nama: pegawai.nama || '',
        jabatan: pegawai.jabatan || '',
        golongan: pegawai.golongan || '',
        pangkat: pegawai.pangkat || '',
        rekening: pegawai.rekening || '',
        bank: pegawai.bank || '',
        unitKerja: pegawai.unitKerja || ''
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
        ...formData,
        updatedAt: new Date()
      }

      if (editingId) {
        await db.pegawai.update(editingId, data)
      } else {
        data.createdAt = new Date()
        await db.pegawai.add(data)
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
      await db.pegawai.delete(deletingId)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  return (
    <Layout title="Master Pegawai">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Data Pegawai</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari pegawai..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-64"
              />
            </div>
            {/* Add Button */}
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Tambah Pegawai
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>NIP</TableHeader>
                <TableHeader>Nama</TableHeader>
                <TableHeader>Jabatan</TableHeader>
                <TableHeader>Golongan</TableHeader>
                <TableHeader>Rekening</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPegawai.length > 0 ? (
                paginatedPegawai.map((pegawai, index) => (
                  <TableRow key={pegawai.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {pegawai.nip}
                    </TableCell>
                    <TableCell className="font-medium">
                      {pegawai.nama}
                    </TableCell>
                    <TableCell>{pegawai.jabatan}</TableCell>
                    <TableCell>
                      <span className="text-xs">
                        {pegawai.golongan} - {pegawai.pangkat}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">
                        {pegawai.rekening}
                      </span>
                      <br />
                      <span className="text-xs text-gray-500">
                        {pegawai.bank}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(pegawai)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(pegawai.id)}
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
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada data pegawai'}
                  colSpan={7}
                />
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredPegawai.length}
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
        title={editingId ? 'Edit Pegawai' : 'Tambah Pegawai'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="NIP"
              name="nip"
              value={formData.nip}
              onChange={handleInputChange}
              placeholder="198501012010011001"
              required
            />
            <Input
              label="Nama Lengkap"
              name="nama"
              value={formData.nama}
              onChange={handleInputChange}
              placeholder="Nama lengkap dengan gelar"
              required
            />
            <Input
              label="Jabatan"
              name="jabatan"
              value={formData.jabatan}
              onChange={handleInputChange}
              placeholder="Analis Kepegawaian"
              required
            />
            <Select
              label="Golongan"
              name="golongan"
              value={formData.golongan}
              onChange={handleInputChange}
              options={GOLONGAN_OPTIONS}
              required
            />
            <Input
              label="Pangkat"
              name="pangkat"
              value={formData.pangkat}
              onChange={handleInputChange}
              placeholder="Auto-filled dari Golongan"
              disabled
            />
            <Input
              label="Unit Kerja"
              name="unitKerja"
              value={formData.unitKerja}
              onChange={handleInputChange}
              placeholder="Sub Bagian Umum"
            />
            <Input
              label="Nomor Rekening"
              name="rekening"
              value={formData.rekening}
              onChange={handleInputChange}
              placeholder="1234567890"
              required
            />
            <Select
              label="Bank"
              name="bank"
              value={formData.bank}
              onChange={handleInputChange}
              options={BANK_OPTIONS}
              required
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button type="submit" loading={loading}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Pegawai'}
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
          Apakah Anda yakin ingin menghapus data pegawai ini? Tindakan ini tidak dapat dibatalkan.
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
