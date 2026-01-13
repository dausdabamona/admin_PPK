import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, Building2, Eye, FileText, Phone, Mail
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, {
  KUALIFIKASI_PENYEDIA,
  BIDANG_USAHA_PENYEDIA,
  withAuditCreate,
  withAuditUpdate,
  recordHistory,
  AUDIT_ACTIONS
} from '../../db/database'

const initialFormData = {
  nama: '',
  npwp: '',
  alamat: '',
  telepon: '',
  email: '',
  direktur: '',
  jabatanDirektur: 'Direktur',
  rekening: '',
  bank: '',
  bidangUsaha: '',
  kualifikasi: ''
}

export default function PengadaanMasterVendor() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBidang, setFilterBidang] = useState('')
  const [filterKualifikasi, setFilterKualifikasi] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allVendor = useLiveQuery(() =>
    db.procurementVendor.orderBy('createdAt').reverse().toArray()
  ) || []

  // Filter
  const filteredVendor = allVendor.filter(v => {
    const matchSearch = v.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.npwp?.includes(searchQuery) ||
      v.direktur?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchBidang = !filterBidang || v.bidangUsaha === filterBidang
    const matchKualifikasi = !filterKualifikasi || v.kualifikasi === filterKualifikasi
    return matchSearch && matchBidang && matchKualifikasi
  })

  // Pagination
  const totalPages = Math.ceil(filteredVendor.length / itemsPerPage)
  const paginatedVendor = filteredVendor.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Options
  const bidangOptions = BIDANG_USAHA_PENYEDIA.map(b => ({ value: b.id, label: b.nama }))
  const kualifikasiOptions = KUALIFIKASI_PENYEDIA.map(k => ({ value: k.id, label: k.nama }))

  const bankOptions = [
    { value: 'BRI', label: 'BRI' },
    { value: 'BNI', label: 'BNI' },
    { value: 'Mandiri', label: 'Mandiri' },
    { value: 'BCA', label: 'BCA' },
    { value: 'BTN', label: 'BTN' },
    { value: 'Bank Papua', label: 'Bank Papua' },
    { value: 'Bank Sulselbar', label: 'Bank Sulselbar' },
    { value: 'Lainnya', label: 'Lainnya' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleOpenModal = (vendor = null) => {
    if (vendor) {
      setEditingId(vendor.id)
      setFormData({
        nama: vendor.nama || '',
        npwp: vendor.npwp || '',
        alamat: vendor.alamat || '',
        telepon: vendor.telepon || '',
        email: vendor.email || '',
        direktur: vendor.direktur || '',
        jabatanDirektur: vendor.jabatanDirektur || 'Direktur',
        rekening: vendor.rekening || '',
        bank: vendor.bank || '',
        bidangUsaha: vendor.bidangUsaha || '',
        kualifikasi: vendor.kualifikasi || ''
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
        nama: formData.nama,
        npwp: formData.npwp,
        alamat: formData.alamat,
        telepon: formData.telepon,
        email: formData.email,
        direktur: formData.direktur,
        jabatanDirektur: formData.jabatanDirektur,
        rekening: formData.rekening,
        bank: formData.bank,
        bidangUsaha: formData.bidangUsaha,
        kualifikasi: formData.kualifikasi
      }

      if (editingId) {
        const existingVendor = await db.procurementVendor.get(editingId)
        const updatedData = withAuditUpdate(data, existingVendor?.revision || 0)
        await db.procurementVendor.update(editingId, updatedData)
        await recordHistory('procurementVendor', editingId, AUDIT_ACTIONS.UPDATE, existingVendor, { ...existingVendor, ...updatedData })
      } else {
        const newData = withAuditCreate(data)
        const newId = await db.procurementVendor.add(newData)
        await recordHistory('procurementVendor', newId, AUDIT_ACTIONS.CREATE, null, newData)
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
      // Check if vendor is used in any contract
      const usedInContract = await db.procurementContract.where('vendorId').equals(deletingId).count()
      if (usedInContract > 0) {
        alert('Penyedia tidak dapat dihapus karena sudah digunakan dalam kontrak')
        setLoading(false)
        return
      }

      const existingVendor = await db.procurementVendor.get(deletingId)
      await db.procurementVendor.delete(deletingId)
      await recordHistory('procurementVendor', deletingId, AUDIT_ACTIONS.DELETE, existingVendor, null)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (vendor) => {
    setViewingData(vendor)
    setIsViewModalOpen(true)
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  const getBidangLabel = (bidangId) => {
    return BIDANG_USAHA_PENYEDIA.find(b => b.id === bidangId)?.nama || bidangId
  }

  const getKualifikasiLabel = (kualifikasiId) => {
    return KUALIFIKASI_PENYEDIA.find(k => k.id === kualifikasiId)?.nama || kualifikasiId
  }

  const getKualifikasiBadge = (kualifikasi) => {
    const variants = {
      kecil: 'info',
      menengah: 'warning',
      besar: 'success',
      perseorangan: 'default'
    }
    return <Badge variant={variants[kualifikasi] || 'default'}>{getKualifikasiLabel(kualifikasi)}</Badge>
  }

  // Stats by bidang
  const statsByBidang = BIDANG_USAHA_PENYEDIA.slice(0, 4).map(bidang => ({
    ...bidang,
    count: allVendor.filter(v => v.bidangUsaha === bidang.id).length
  }))

  return (
    <Layout title="Master Penyedia">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Penyedia</p>
            <p className="text-2xl font-bold">{allVendor.length}</p>
          </CardBody>
        </Card>
        {statsByBidang.slice(0, 3).map((stat, idx) => (
          <Card key={stat.id} className={`bg-gradient-to-r ${
            idx === 0 ? 'from-green-500 to-green-600' :
            idx === 1 ? 'from-purple-500 to-purple-600' :
            'from-orange-500 to-orange-600'
          } text-white`}>
            <CardBody className="p-4">
              <p className="text-sm opacity-80">{stat.nama}</p>
              <p className="text-2xl font-bold">{stat.count}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-600" />
              Daftar Penyedia
            </CardTitle>
            <CardDescription>
              Kelola data penyedia barang/jasa
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <Select
              value={filterBidang}
              onChange={(e) => {
                setFilterBidang(e.target.value)
                setCurrentPage(1)
              }}
              options={bidangOptions}
              placeholder="Semua Bidang"
              className="w-full sm:w-40"
            />
            <Select
              value={filterKualifikasi}
              onChange={(e) => {
                setFilterKualifikasi(e.target.value)
                setCurrentPage(1)
              }}
              options={kualifikasiOptions}
              placeholder="Semua Kualifikasi"
              className="w-full sm:w-36"
            />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari penyedia..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-48"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Tambah Penyedia
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>Nama Perusahaan</TableHeader>
                <TableHeader>NPWP</TableHeader>
                <TableHeader>Bidang Usaha</TableHeader>
                <TableHeader>Kualifikasi</TableHeader>
                <TableHeader>Kontak</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedVendor.length > 0 ? (
                paginatedVendor.map((vendor, index) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{vendor.nama}</p>
                        <p className="text-xs text-gray-500">{vendor.direktur} ({vendor.jabatanDirektur})</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {vendor.npwp || '-'}
                    </TableCell>
                    <TableCell>
                      {getBidangLabel(vendor.bidangUsaha)}
                    </TableCell>
                    <TableCell>
                      {getKualifikasiBadge(vendor.kualifikasi)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {vendor.telepon && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Phone className="w-3 h-3" />
                            {vendor.telepon}
                          </div>
                        )}
                        {vendor.email && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail className="w-3 h-3" />
                            {vendor.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(vendor)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(vendor)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(vendor.id)}
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
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada data penyedia'}
                  colSpan={7}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredVendor.length}
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
        title={editingId ? 'Edit Data Penyedia' : 'Tambah Data Penyedia'}
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Identitas Perusahaan */}
            <div className="border-b pb-3">
              <h4 className="font-medium text-gray-700 mb-3">Identitas Perusahaan</h4>
              <Input
                label="Nama Perusahaan"
                name="nama"
                value={formData.nama}
                onChange={handleInputChange}
                placeholder="CV. Contoh Sejahtera"
                required
              />
              <div className="grid grid-cols-2 gap-4 mt-3">
                <Input
                  label="NPWP"
                  name="npwp"
                  value={formData.npwp}
                  onChange={handleInputChange}
                  placeholder="XX.XXX.XXX.X-XXX.XXX"
                />
                <Select
                  label="Kualifikasi"
                  name="kualifikasi"
                  value={formData.kualifikasi}
                  onChange={handleInputChange}
                  options={kualifikasiOptions}
                  required
                />
              </div>
              <Select
                label="Bidang Usaha"
                name="bidangUsaha"
                value={formData.bidangUsaha}
                onChange={handleInputChange}
                options={bidangOptions}
                className="mt-3"
                required
              />
              <Textarea
                label="Alamat"
                name="alamat"
                value={formData.alamat}
                onChange={handleInputChange}
                rows={2}
                className="mt-3"
              />
            </div>

            {/* Penanggung Jawab */}
            <div className="border-b pb-3">
              <h4 className="font-medium text-gray-700 mb-3">Penanggung Jawab</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nama Direktur/Pemilik"
                  name="direktur"
                  value={formData.direktur}
                  onChange={handleInputChange}
                  required
                />
                <Input
                  label="Jabatan"
                  name="jabatanDirektur"
                  value={formData.jabatanDirektur}
                  onChange={handleInputChange}
                  placeholder="Direktur"
                />
              </div>
            </div>

            {/* Kontak */}
            <div className="border-b pb-3">
              <h4 className="font-medium text-gray-700 mb-3">Kontak</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Telepon"
                  name="telepon"
                  value={formData.telepon}
                  onChange={handleInputChange}
                  placeholder="0812-xxxx-xxxx"
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="info@perusahaan.com"
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
        title="Detail Penyedia"
        size="lg"
      >
        {viewingData && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500">Nama Perusahaan</label>
              <p className="text-lg font-bold">{viewingData.nama}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">NPWP</label>
                <p className="font-mono">{viewingData.npwp || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Kualifikasi</label>
                <div className="mt-1">{getKualifikasiBadge(viewingData.kualifikasi)}</div>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Bidang Usaha</label>
              <p>{getBidangLabel(viewingData.bidangUsaha)}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500">Alamat</label>
              <p>{viewingData.alamat || '-'}</p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Penanggung Jawab</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Nama</label>
                  <p className="font-medium">{viewingData.direktur}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Jabatan</label>
                  <p>{viewingData.jabatanDirektur}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Kontak</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Telepon</label>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {viewingData.telepon || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Email</label>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {viewingData.email || '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Rekening</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Nomor Rekening</label>
                  <p className="font-mono">{viewingData.rekening}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Bank</label>
                  <p>{viewingData.bank}</p>
                </div>
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
          Apakah Anda yakin ingin menghapus data penyedia ini? Pastikan penyedia tidak digunakan dalam kontrak apapun.
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
