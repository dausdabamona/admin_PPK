import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Pencil, Trash2, Search, UserCog } from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db from '../../db/database'

const JENIS_PEJABAT_OPTIONS = [
  { value: 'PPK', label: 'Pejabat Pembuat Komitmen (PPK)' },
  { value: 'KPA', label: 'Kuasa Pengguna Anggaran (KPA)' },
  { value: 'BENDAHARA', label: 'Bendahara Pengeluaran' },
  { value: 'PPSPM', label: 'Pejabat Penandatangan SPM (PPSPM)' }
]

const GOLONGAN_OPTIONS = [
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

const initialFormData = {
  nip: '',
  nama: '',
  jabatan: '',
  jenisPejabat: '',
  pangkat: '',
  golongan: ''
}

export default function MasterPejabat() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch pejabat data with live query
  const allPejabat = useLiveQuery(() => db.pejabat.toArray()) || []

  // Filter by search query
  const filteredPejabat = allPejabat.filter(p =>
    p.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.nip?.includes(searchQuery) ||
    p.jenisPejabat?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get pangkat based on golongan
  const getPangkat = (golongan) => {
    const pangkatMap = {
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
      if (name === 'golongan') {
        updated.pangkat = getPangkat(value)
      }
      return updated
    })
  }

  const handleOpenModal = (pejabat = null) => {
    if (pejabat) {
      setEditingId(pejabat.id)
      setFormData({
        nip: pejabat.nip || '',
        nama: pejabat.nama || '',
        jabatan: pejabat.jabatan || '',
        jenisPejabat: pejabat.jenisPejabat || '',
        pangkat: pejabat.pangkat || '',
        golongan: pejabat.golongan || ''
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
        await db.pejabat.update(editingId, data)
      } else {
        data.createdAt = new Date()
        await db.pejabat.add(data)
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
      await db.pejabat.delete(deletingId)
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

  const getJenisBadgeVariant = (jenis) => {
    switch (jenis) {
      case 'PPK': return 'info'
      case 'KPA': return 'success'
      case 'BENDAHARA': return 'warning'
      case 'PPSPM': return 'default'
      default: return 'default'
    }
  }

  return (
    <Layout title="Master Pejabat">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary-600" />
              Data Pejabat
            </CardTitle>
            <CardDescription>
              Kelola data PPK, KPA, Bendahara, dan pejabat lainnya
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari pejabat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full sm:w-64"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Tambah Pejabat
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
                <TableHeader>Jenis Pejabat</TableHeader>
                <TableHeader>Golongan</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPejabat.length > 0 ? (
                filteredPejabat.map((pejabat, index) => (
                  <TableRow key={pejabat.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {pejabat.nip}
                    </TableCell>
                    <TableCell className="font-medium">
                      {pejabat.nama}
                    </TableCell>
                    <TableCell>{pejabat.jabatan}</TableCell>
                    <TableCell>
                      <Badge variant={getJenisBadgeVariant(pejabat.jenisPejabat)}>
                        {pejabat.jenisPejabat}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">
                        {pejabat.golongan} - {pejabat.pangkat}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(pejabat)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(pejabat.id)}
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
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada data pejabat'}
                  colSpan={7}
                />
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Edit Pejabat' : 'Tambah Pejabat'}
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
              placeholder="Direktur"
              required
            />
            <Select
              label="Jenis Pejabat"
              name="jenisPejabat"
              value={formData.jenisPejabat}
              onChange={handleInputChange}
              options={JENIS_PEJABAT_OPTIONS}
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
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button type="submit" loading={loading}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Pejabat'}
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
          Apakah Anda yakin ingin menghapus data pejabat ini?
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
