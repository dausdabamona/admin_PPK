import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, Calculator, Eye, Printer
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, TextArea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db from '../../db/database'
import { formatTanggal, formatDateInput, formatRupiah, terbilangRupiah } from '../../utils/formatters'
import { generateKwitansiRampungSwakelolaPDF } from '../../utils/swakelolaDocGenerator'

const initialFormData = {
  kegiatanId: '',
  uangMukaId: '',
  realisasiId: '',
  tanggal: '',
  nomorKwitansi: '',
  keterangan: ''
}

export default function SwakelolaRampung() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [selectedKegiatan, setSelectedKegiatan] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)

  // Calculated values
  const [totalUangMuka, setTotalUangMuka] = useState(0)
  const [totalRealisasi, setTotalRealisasi] = useState(0)
  const itemsPerPage = 10

  // Fetch data
  const allRampung = useLiveQuery(async () => {
    const rampung = await db.swakelolaRampung.orderBy('createdAt').reverse().toArray()
    return Promise.all(rampung.map(async (r) => {
      const kegiatan = await db.swakelolaKegiatan.get(r.kegiatanId)
      const uangMuka = r.uangMukaId ? await db.swakelolaUangMuka.get(r.uangMukaId) : null
      const realisasi = r.realisasiId ? await db.swakelolaRealisasi.get(r.realisasiId) : null

      // Get bendahara
      let bendahara = null
      if (r.kegiatanId) {
        const tim = await db.swakelolaTim.where({ kegiatanId: r.kegiatanId, peran: 'bendahara' }).first()
        if (tim) {
          bendahara = await db.pegawai.get(tim.pegawaiId)
        }
      }

      return { ...r, kegiatan, uangMuka, realisasi, bendahara }
    }))
  }) || []

  const allKegiatan = useLiveQuery(() => db.swakelolaKegiatan.toArray()) || []
  const allUangMuka = useLiveQuery(() => db.swakelolaUangMuka.toArray()) || []
  const allRealisasi = useLiveQuery(() => db.swakelolaRealisasi.toArray()) || []

  // Filter by kegiatan and search
  const filteredRampung = allRampung.filter(r => {
    const matchSearch = r.kegiatan?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.nomorKwitansi?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchKegiatan = !selectedKegiatan || r.kegiatanId === parseInt(selectedKegiatan)
    return matchSearch && matchKegiatan
  })

  // Pagination
  const totalPages = Math.ceil(filteredRampung.length / itemsPerPage)
  const paginatedRampung = filteredRampung.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Options
  const kegiatanOptions = allKegiatan.map(k => ({
    value: k.id.toString(),
    label: `${k.kode} - ${k.nama}`
  }))

  const uangMukaOptions = allUangMuka
    .filter(um => !formData.kegiatanId || um.kegiatanId === parseInt(formData.kegiatanId))
    .filter(um => um.status === 'aktif')
    .map(um => ({
      value: um.id.toString(),
      label: `${um.nomorKwitansi} - ${formatRupiah(um.jumlah)}`
    }))

  const realisasiOptions = allRealisasi
    .filter(r => !formData.kegiatanId || r.kegiatanId === parseInt(formData.kegiatanId))
    .map(r => ({
      value: r.id.toString(),
      label: `${formatTanggal(r.tanggal, 'short')} - ${formatRupiah(r.totalRealisasi)}`
    }))

  const handleInputChange = async (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Calculate totals when uang muka or realisasi changes
    if (name === 'uangMukaId' && value) {
      const um = allUangMuka.find(u => u.id === parseInt(value))
      setTotalUangMuka(um?.jumlah || 0)
    }

    if (name === 'realisasiId' && value) {
      const r = allRealisasi.find(rel => rel.id === parseInt(value))
      setTotalRealisasi(r?.totalRealisasi || 0)
    }

    if (name === 'kegiatanId') {
      setFormData(prev => ({ ...prev, kegiatanId: value, uangMukaId: '', realisasiId: '' }))
      setTotalUangMuka(0)
      setTotalRealisasi(0)
    }
  }

  const generateNomorKwitansi = async () => {
    const currentYear = new Date().getFullYear()
    const count = await db.swakelolaRampung.count()
    return `KWT-RMP/${String(count + 1).padStart(4, '0')}/${currentYear}`
  }

  const handleOpenModal = async (rampung = null) => {
    if (rampung) {
      setEditingId(rampung.id)
      setFormData({
        kegiatanId: rampung.kegiatanId?.toString() || '',
        uangMukaId: rampung.uangMukaId?.toString() || '',
        realisasiId: rampung.realisasiId?.toString() || '',
        tanggal: formatDateInput(rampung.tanggal),
        nomorKwitansi: rampung.nomorKwitansi || '',
        keterangan: rampung.keterangan || ''
      })
      setTotalUangMuka(rampung.totalUangMuka || 0)
      setTotalRealisasi(rampung.totalRealisasi || 0)
    } else {
      setEditingId(null)
      const nomorKwitansi = await generateNomorKwitansi()
      setFormData({
        ...initialFormData,
        nomorKwitansi,
        tanggal: formatDateInput(new Date())
      })
      setTotalUangMuka(0)
      setTotalRealisasi(0)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData(initialFormData)
    setTotalUangMuka(0)
    setTotalRealisasi(0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selisih = totalUangMuka - totalRealisasi
      let statusSelisih = 'nihil'
      if (selisih > 0) {
        statusSelisih = 'lebih_bayar' // Uang muka > realisasi = kelebihan, harus setor
      } else if (selisih < 0) {
        statusSelisih = 'kurang_bayar' // Uang muka < realisasi = kekurangan, perlu bayar tambahan
      }

      const data = {
        kegiatanId: parseInt(formData.kegiatanId),
        uangMukaId: formData.uangMukaId ? parseInt(formData.uangMukaId) : null,
        realisasiId: formData.realisasiId ? parseInt(formData.realisasiId) : null,
        tanggal: formData.tanggal ? new Date(formData.tanggal) : new Date(),
        totalUangMuka,
        totalRealisasi,
        selisih: Math.abs(selisih),
        statusSelisih,
        nomorKwitansi: formData.nomorKwitansi,
        keterangan: formData.keterangan,
        updatedAt: new Date()
      }

      if (editingId) {
        await db.swakelolaRampung.update(editingId, data)
      } else {
        data.createdAt = new Date()
        await db.swakelolaRampung.add(data)

        // Update status uang muka to selesai
        if (formData.uangMukaId) {
          await db.swakelolaUangMuka.update(parseInt(formData.uangMukaId), { status: 'selesai' })
        }
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
      const rampung = await db.swakelolaRampung.get(deletingId)

      // Revert uang muka status if needed
      if (rampung?.uangMukaId) {
        await db.swakelolaUangMuka.update(rampung.uangMukaId, { status: 'aktif' })
      }

      await db.swakelolaRampung.delete(deletingId)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (rampung) => {
    setViewingData(rampung)
    setIsViewModalOpen(true)
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  const handlePrint = async (rampung) => {
    try {
      await generateKwitansiRampungSwakelolaPDF(rampung)
    } catch (error) {
      alert('Gagal mencetak kwitansi: ' + error.message)
    }
  }

  // Calculated selisih for form
  const selisih = totalUangMuka - totalRealisasi
  const statusSelisih = selisih > 0 ? 'lebih_bayar' : selisih < 0 ? 'kurang_bayar' : 'nihil'

  const getStatusBadge = (status) => {
    const variants = {
      lebih_bayar: 'warning',
      kurang_bayar: 'danger',
      nihil: 'success'
    }
    const labels = {
      lebih_bayar: 'Lebih Bayar',
      kurang_bayar: 'Kurang Bayar',
      nihil: 'Nihil'
    }
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  return (
    <Layout title="Rampung Swakelola">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary-600" />
              Rampung Swakelola
            </CardTitle>
            <CardDescription>
              Penyelesaian dan pertanggungjawaban kegiatan swakelola
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={selectedKegiatan}
              onChange={(e) => {
                setSelectedKegiatan(e.target.value)
                setCurrentPage(1)
              }}
              options={kegiatanOptions}
              placeholder="Semua Kegiatan"
              className="w-full sm:w-48"
            />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-48"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Buat Rampung
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>No. Kwitansi</TableHeader>
                <TableHeader>Tanggal</TableHeader>
                <TableHeader>Kegiatan</TableHeader>
                <TableHeader>Uang Muka</TableHeader>
                <TableHeader>Realisasi</TableHeader>
                <TableHeader>Selisih</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRampung.length > 0 ? (
                paginatedRampung.map((r, index) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {r.nomorKwitansi}
                    </TableCell>
                    <TableCell>
                      {formatTanggal(r.tanggal)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-mono text-xs">{r.kegiatan?.kode}</p>
                        <p className="text-xs text-gray-500 truncate">{r.kegiatan?.nama}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatRupiah(r.totalUangMuka)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatRupiah(r.totalRealisasi)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatRupiah(r.selisih)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(r.statusSelisih)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(r)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(r)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Cetak"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(r)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(r.id)}
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
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada rampung'}
                  colSpan={9}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredRampung.length}
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
        title={editingId ? 'Edit Rampung' : 'Buat Rampung'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Select
              label="Kegiatan Swakelola"
              name="kegiatanId"
              value={formData.kegiatanId}
              onChange={handleInputChange}
              options={kegiatanOptions}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nomor Kwitansi Rampung"
                name="nomorKwitansi"
                value={formData.nomorKwitansi}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Tanggal Rampung"
                name="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={handleInputChange}
                required
              />
            </div>

            <Select
              label="Uang Muka"
              name="uangMukaId"
              value={formData.uangMukaId}
              onChange={handleInputChange}
              options={uangMukaOptions}
              placeholder="Pilih uang muka yang dirampungkan"
              required
            />

            <Select
              label="Realisasi Biaya"
              name="realisasiId"
              value={formData.realisasiId}
              onChange={handleInputChange}
              options={realisasiOptions}
              placeholder="Pilih realisasi biaya"
              required
            />

            {/* Calculation Summary */}
            {(formData.uangMukaId || formData.realisasiId) && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <h4 className="font-medium text-gray-700">Perhitungan Rampung</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Total Uang Muka</label>
                    <p className="text-lg font-bold text-blue-600">{formatRupiah(totalUangMuka)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Total Realisasi</label>
                    <p className="text-lg font-bold text-orange-600">{formatRupiah(totalRealisasi)}</p>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-xs text-gray-500">Selisih</label>
                      <p className={`text-xl font-bold ${statusSelisih === 'nihil' ? 'text-green-600' : statusSelisih === 'lebih_bayar' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {formatRupiah(Math.abs(selisih))}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(statusSelisih)}
                      <p className="text-xs text-gray-500 mt-1">
                        {statusSelisih === 'lebih_bayar' && 'Harus disetorkan ke kas negara'}
                        {statusSelisih === 'kurang_bayar' && 'Perlu pembayaran tambahan'}
                        {statusSelisih === 'nihil' && 'Uang muka = Realisasi'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <TextArea
              label="Keterangan"
              name="keterangan"
              value={formData.keterangan}
              onChange={handleInputChange}
              rows={2}
              placeholder="Keterangan tambahan..."
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

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail Rampung"
        size="md"
      >
        {viewingData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Nomor Kwitansi</label>
                <p className="font-mono">{viewingData.nomorKwitansi}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tanggal</label>
                <p>{formatTanggal(viewingData.tanggal)}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Kegiatan</label>
              <p className="font-mono text-sm">{viewingData.kegiatan?.kode}</p>
              <p className="font-medium">{viewingData.kegiatan?.nama}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">No. Uang Muka</label>
                <p className="font-mono text-sm">{viewingData.uangMuka?.nomorKwitansi || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Bendahara</label>
                <p>{viewingData.bendahara?.nama || '-'}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Total Uang Muka</label>
                  <p className="text-lg font-bold text-blue-600">{formatRupiah(viewingData.totalUangMuka)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Total Realisasi</label>
                  <p className="text-lg font-bold text-orange-600">{formatRupiah(viewingData.totalRealisasi)}</p>
                </div>
              </div>

              <div className="pt-3 border-t flex justify-between items-center">
                <div>
                  <label className="text-xs text-gray-500">Selisih</label>
                  <p className="text-xl font-bold">{formatRupiah(viewingData.selisih)}</p>
                  <p className="text-sm text-gray-500">{terbilangRupiah(viewingData.selisih)}</p>
                </div>
                <div>
                  {getStatusBadge(viewingData.statusSelisih)}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Keterangan</label>
              <p>{viewingData.keterangan || '-'}</p>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={() => handlePrint(viewingData)}
                icon={Printer}
                className="w-full"
              >
                Cetak Kwitansi Rampung
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
          Apakah Anda yakin ingin menghapus rampung ini?
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
