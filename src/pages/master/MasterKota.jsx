import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Pencil, Trash2, Search, MapPin } from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, CurrencyInput } from '../../components/ui/Input'
import db from '../../db/database'
import { formatRupiah } from '../../utils/formatters'

const initialFormData = {
  namaKota: '',
  provinsi: '',
  tarifHarianDalamKota: '',
  tarifHarianLuarKota: '',
  tarifPenginapan: '',
  tarifTransportLokal: '',
  tarifTransportAntarKota: ''
}

export default function MasterKota() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch kota data with live query
  const allKota = useLiveQuery(() => db.kota.toArray()) || []

  // Filter by search query
  const filteredKota = allKota.filter(k =>
    k.namaKota?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.provinsi?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredKota.length / itemsPerPage)
  const paginatedKota = filteredKota.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleOpenModal = (kota = null) => {
    if (kota) {
      setEditingId(kota.id)
      setFormData({
        namaKota: kota.namaKota || '',
        provinsi: kota.provinsi || '',
        tarifHarianDalamKota: kota.tarifHarianDalamKota?.toString() || '',
        tarifHarianLuarKota: kota.tarifHarianLuarKota?.toString() || '',
        tarifPenginapan: kota.tarifPenginapan?.toString() || '',
        tarifTransportLokal: kota.tarifTransportLokal?.toString() || '',
        tarifTransportAntarKota: kota.tarifTransportAntarKota?.toString() || ''
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
        namaKota: formData.namaKota,
        provinsi: formData.provinsi,
        tarifHarianDalamKota: parseInt(formData.tarifHarianDalamKota) || 0,
        tarifHarianLuarKota: parseInt(formData.tarifHarianLuarKota) || 0,
        tarifPenginapan: parseInt(formData.tarifPenginapan) || 0,
        tarifTransportLokal: parseInt(formData.tarifTransportLokal) || 0,
        tarifTransportAntarKota: parseInt(formData.tarifTransportAntarKota) || 0,
        updatedAt: new Date()
      }

      if (editingId) {
        await db.kota.update(editingId, data)
      } else {
        data.createdAt = new Date()
        await db.kota.add(data)
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
      await db.kota.delete(deletingId)
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
    <Layout title="Master Kota & SBM">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" />
              Data Kota & Tarif SBM
            </CardTitle>
            <CardDescription>
              Kelola data kota dan Standar Biaya Masukan (SBM) untuk perjalanan dinas
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kota..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-64"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Tambah Kota
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>Kota</TableHeader>
                <TableHeader>Provinsi</TableHeader>
                <TableHeader>Uang Harian (Dalam)</TableHeader>
                <TableHeader>Uang Harian (Luar)</TableHeader>
                <TableHeader>Penginapan</TableHeader>
                <TableHeader>Transport</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedKota.length > 0 ? (
                paginatedKota.map((kota, index) => (
                  <TableRow key={kota.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {kota.namaKota}
                    </TableCell>
                    <TableCell>{kota.provinsi}</TableCell>
                    <TableCell className="text-xs">
                      {formatRupiah(kota.tarifHarianDalamKota)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatRupiah(kota.tarifHarianLuarKota)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatRupiah(kota.tarifPenginapan)}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>
                        <span className="text-gray-500">Lokal:</span> {formatRupiah(kota.tarifTransportLokal)}
                      </div>
                      <div>
                        <span className="text-gray-500">Antar:</span> {formatRupiah(kota.tarifTransportAntarKota)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(kota)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(kota.id)}
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
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada data kota'}
                  colSpan={8}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredKota.length}
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
        title={editingId ? 'Edit Kota & SBM' : 'Tambah Kota & SBM'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Kota"
              name="namaKota"
              value={formData.namaKota}
              onChange={handleInputChange}
              placeholder="Jakarta"
              required
            />
            <Input
              label="Provinsi"
              name="provinsi"
              value={formData.provinsi}
              onChange={handleInputChange}
              placeholder="DKI Jakarta"
              required
            />
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Tarif Uang Harian</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CurrencyInput
                label="Uang Harian Dalam Kota"
                name="tarifHarianDalamKota"
                value={formData.tarifHarianDalamKota}
                onChange={handleInputChange}
                placeholder="150000"
                helper="Tarif untuk perjalanan dinas dalam kota"
              />
              <CurrencyInput
                label="Uang Harian Luar Kota"
                name="tarifHarianLuarKota"
                value={formData.tarifHarianLuarKota}
                onChange={handleInputChange}
                placeholder="430000"
                helper="Tarif untuk perjalanan dinas luar kota"
              />
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Tarif Penginapan</h4>
            <CurrencyInput
              label="Tarif Penginapan per Malam"
              name="tarifPenginapan"
              value={formData.tarifPenginapan}
              onChange={handleInputChange}
              placeholder="700000"
              helper="Tarif maksimal penginapan untuk perjalanan luar kota"
            />
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Tarif Transport</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CurrencyInput
                label="Transport Lokal"
                name="tarifTransportLokal"
                value={formData.tarifTransportLokal}
                onChange={handleInputChange}
                placeholder="150000"
                helper="Tarif transport dalam kota (per hari)"
              />
              <CurrencyInput
                label="Transport Antar Kota"
                name="tarifTransportAntarKota"
                value={formData.tarifTransportAntarKota}
                onChange={handleInputChange}
                placeholder="3500000"
                helper="Estimasi transport PP ke kota ini"
              />
            </div>
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button type="submit" loading={loading}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Kota'}
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
          Apakah Anda yakin ingin menghapus data kota ini?
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
