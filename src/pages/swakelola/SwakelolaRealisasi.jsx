import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, Receipt, Eye, Printer, X
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, CurrencyInput, TextArea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, { KATEGORI_REALISASI_SWAKELOLA } from '../../db/database'
import { formatTanggal, formatDateInput, formatRupiah } from '../../utils/formatters'
import { generateRealisasiBiayaPDF } from '../../utils/swakelolaDocGenerator'

const initialFormData = {
  kegiatanId: '',
  uangMukaId: '',
  tanggal: '',
  keterangan: ''
}

const initialItemData = {
  kategori: 'belanja_bahan',
  uraian: '',
  volume: '1',
  satuan: 'Paket',
  hargaSatuan: '',
  tanggal: '',
  noBukti: ''
}

export default function SwakelolaRealisasi() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [items, setItems] = useState([])
  const [selectedKegiatan, setSelectedKegiatan] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allRealisasi = useLiveQuery(async () => {
    const realisasi = await db.swakelolaRealisasi.orderBy('createdAt').reverse().toArray()
    return Promise.all(realisasi.map(async (r) => {
      const kegiatan = await db.swakelolaKegiatan.get(r.kegiatanId)
      const uangMuka = r.uangMukaId ? await db.swakelolaUangMuka.get(r.uangMukaId) : null
      const itemsData = await db.swakelolaRealisasiItem.where('realisasiId').equals(r.id).toArray()
      return { ...r, kegiatan, uangMuka, itemsData }
    }))
  }) || []

  const allKegiatan = useLiveQuery(() => db.swakelolaKegiatan.toArray()) || []
  const allUangMuka = useLiveQuery(() => db.swakelolaUangMuka.where('status').equals('aktif').toArray()) || []

  // Filter by kegiatan and search
  const filteredRealisasi = allRealisasi.filter(r => {
    const matchSearch = r.kegiatan?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.keterangan?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchKegiatan = !selectedKegiatan || r.kegiatanId === parseInt(selectedKegiatan)
    return matchSearch && matchKegiatan
  })

  // Pagination
  const totalPages = Math.ceil(filteredRealisasi.length / itemsPerPage)
  const paginatedRealisasi = filteredRealisasi.slice(
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
    .map(um => ({
      value: um.id.toString(),
      label: `${um.nomorKwitansi} - ${formatRupiah(um.jumlah)}`
    }))

  const kategoriOptions = KATEGORI_REALISASI_SWAKELOLA.map(k => ({
    value: k.id,
    label: `${k.nama} (${k.kode})`
  }))

  const satuanOptions = [
    { value: 'Paket', label: 'Paket' },
    { value: 'Unit', label: 'Unit' },
    { value: 'Orang', label: 'Orang' },
    { value: 'Hari', label: 'Hari' },
    { value: 'Bulan', label: 'Bulan' },
    { value: 'Lembar', label: 'Lembar' },
    { value: 'Set', label: 'Set' },
    { value: 'Rim', label: 'Rim' },
    { value: 'Liter', label: 'Liter' },
    { value: 'Kg', label: 'Kg' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Item management
  const [currentItem, setCurrentItem] = useState(initialItemData)

  const handleItemChange = (e) => {
    const { name, value } = e.target
    setCurrentItem(prev => ({ ...prev, [name]: value }))
  }

  const addItem = () => {
    if (!currentItem.uraian || !currentItem.hargaSatuan) {
      alert('Uraian dan Harga Satuan wajib diisi')
      return
    }

    const volume = parseInt(currentItem.volume) || 1
    const hargaSatuan = parseInt(currentItem.hargaSatuan) || 0
    const jumlah = volume * hargaSatuan

    setItems(prev => [...prev, {
      ...currentItem,
      volume,
      hargaSatuan,
      jumlah,
      id: Date.now()
    }])

    setCurrentItem({
      ...initialItemData,
      tanggal: currentItem.tanggal
    })
  }

  const removeItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const totalRealisasi = items.reduce((acc, item) => acc + (item.jumlah || 0), 0)

  const handleOpenModal = async (realisasi = null) => {
    if (realisasi) {
      setEditingId(realisasi.id)
      setFormData({
        kegiatanId: realisasi.kegiatanId?.toString() || '',
        uangMukaId: realisasi.uangMukaId?.toString() || '',
        tanggal: formatDateInput(realisasi.tanggal),
        keterangan: realisasi.keterangan || ''
      })
      // Load existing items
      const existingItems = await db.swakelolaRealisasiItem.where('realisasiId').equals(realisasi.id).toArray()
      setItems(existingItems.map(item => ({ ...item, id: item.id })))
    } else {
      setEditingId(null)
      setFormData({
        ...initialFormData,
        tanggal: formatDateInput(new Date())
      })
      setItems([])
    }
    setCurrentItem({
      ...initialItemData,
      tanggal: formatDateInput(new Date())
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData(initialFormData)
    setItems([])
    setCurrentItem(initialItemData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (items.length === 0) {
      alert('Tambahkan minimal satu item realisasi')
      return
    }

    setLoading(true)

    try {
      const data = {
        kegiatanId: parseInt(formData.kegiatanId),
        uangMukaId: formData.uangMukaId ? parseInt(formData.uangMukaId) : null,
        tanggal: formData.tanggal ? new Date(formData.tanggal) : new Date(),
        totalRealisasi,
        keterangan: formData.keterangan,
        updatedAt: new Date()
      }

      let realisasiId

      if (editingId) {
        await db.swakelolaRealisasi.update(editingId, data)
        realisasiId = editingId
        // Delete existing items
        await db.swakelolaRealisasiItem.where('realisasiId').equals(editingId).delete()
      } else {
        data.createdAt = new Date()
        realisasiId = await db.swakelolaRealisasi.add(data)
      }

      // Add items
      for (const item of items) {
        await db.swakelolaRealisasiItem.add({
          realisasiId,
          kategori: item.kategori,
          uraian: item.uraian,
          volume: item.volume,
          satuan: item.satuan,
          hargaSatuan: item.hargaSatuan,
          jumlah: item.jumlah,
          tanggal: item.tanggal ? new Date(item.tanggal) : null,
          noBukti: item.noBukti,
          createdAt: new Date()
        })
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
      await db.swakelolaRealisasiItem.where('realisasiId').equals(deletingId).delete()
      await db.swakelolaRealisasi.delete(deletingId)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (realisasi) => {
    setViewingData(realisasi)
    setIsViewModalOpen(true)
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  const handlePrint = async (realisasi) => {
    try {
      const itemsData = await db.swakelolaRealisasiItem.where('realisasiId').equals(realisasi.id).toArray()
      await generateRealisasiBiayaPDF(realisasi, itemsData)
    } catch (error) {
      alert('Gagal mencetak dokumen: ' + error.message)
    }
  }

  const getKategoriLabel = (kategoriId) => {
    return KATEGORI_REALISASI_SWAKELOLA.find(k => k.id === kategoriId)?.nama || kategoriId
  }

  return (
    <Layout title="Realisasi Biaya Swakelola">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary-600" />
              Realisasi Biaya Swakelola
            </CardTitle>
            <CardDescription>
              Kelola realisasi pengeluaran kegiatan swakelola
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
              Tambah Realisasi
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>Tanggal</TableHeader>
                <TableHeader>Kegiatan</TableHeader>
                <TableHeader>No. Uang Muka</TableHeader>
                <TableHeader>Jumlah Item</TableHeader>
                <TableHeader>Total Realisasi</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRealisasi.length > 0 ? (
                paginatedRealisasi.map((r, index) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
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
                    <TableCell className="font-mono text-sm">
                      {r.uangMuka?.nomorKwitansi || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">{r.itemsData?.length || 0} item</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatRupiah(r.totalRealisasi)}
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
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada realisasi'}
                  colSpan={7}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredRealisasi.length}
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
        title={editingId ? 'Edit Realisasi' : 'Tambah Realisasi'}
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Kegiatan Swakelola"
                name="kegiatanId"
                value={formData.kegiatanId}
                onChange={handleInputChange}
                options={kegiatanOptions}
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

            <Select
              label="Uang Muka (Opsional)"
              name="uangMukaId"
              value={formData.uangMukaId}
              onChange={handleInputChange}
              options={uangMukaOptions}
              placeholder="Pilih uang muka (jika ada)"
            />

            {/* Item Input Section */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-3">Tambah Item Realisasi</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Select
                  label="Kategori"
                  name="kategori"
                  value={currentItem.kategori}
                  onChange={handleItemChange}
                  options={kategoriOptions}
                />
                <Input
                  label="Uraian"
                  name="uraian"
                  value={currentItem.uraian}
                  onChange={handleItemChange}
                  placeholder="Uraian pengeluaran"
                />
                <Input
                  label="Volume"
                  name="volume"
                  type="number"
                  min="1"
                  value={currentItem.volume}
                  onChange={handleItemChange}
                />
                <Select
                  label="Satuan"
                  name="satuan"
                  value={currentItem.satuan}
                  onChange={handleItemChange}
                  options={satuanOptions}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <CurrencyInput
                  label="Harga Satuan"
                  name="hargaSatuan"
                  value={currentItem.hargaSatuan}
                  onChange={handleItemChange}
                />
                <Input
                  label="Tanggal Bukti"
                  name="tanggal"
                  type="date"
                  value={currentItem.tanggal}
                  onChange={handleItemChange}
                />
                <Input
                  label="No. Bukti"
                  name="noBukti"
                  value={currentItem.noBukti}
                  onChange={handleItemChange}
                  placeholder="Nota/Kwitansi"
                />
                <div className="flex items-end">
                  <Button type="button" onClick={addItem} icon={Plus} className="w-full">
                    Tambah
                  </Button>
                </div>
              </div>

              {/* Preview */}
              {currentItem.hargaSatuan && (
                <div className="mt-2 text-sm text-gray-600">
                  Subtotal: {formatRupiah((parseInt(currentItem.volume) || 1) * (parseInt(currentItem.hargaSatuan) || 0))}
                </div>
              )}
            </div>

            {/* Items List */}
            {items.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Kategori</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Uraian</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Vol</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Harga</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Jumlah</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-sm">{getKategoriLabel(item.kategori)}</td>
                        <td className="px-3 py-2 text-sm">{item.uraian}</td>
                        <td className="px-3 py-2 text-sm text-right">{item.volume} {item.satuan}</td>
                        <td className="px-3 py-2 text-sm text-right">{formatRupiah(item.hargaSatuan)}</td>
                        <td className="px-3 py-2 text-sm text-right font-medium">{formatRupiah(item.jumlah)}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-green-50">
                      <td colSpan="4" className="px-3 py-2 text-sm font-bold text-right">TOTAL:</td>
                      <td className="px-3 py-2 text-sm font-bold text-right text-green-600">
                        {formatRupiah(totalRealisasi)}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
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
            <Button type="submit" loading={loading} disabled={items.length === 0}>
              {editingId ? 'Simpan Perubahan' : 'Simpan'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail Realisasi"
        size="lg"
      >
        {viewingData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Tanggal</label>
                <p>{formatTanggal(viewingData.tanggal)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Uang Muka</label>
                <p className="font-mono">{viewingData.uangMuka?.nomorKwitansi || '-'}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Kegiatan</label>
              <p className="font-mono text-sm">{viewingData.kegiatan?.kode}</p>
              <p className="font-medium">{viewingData.kegiatan?.nama}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-2">Rincian Realisasi</label>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Kategori</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Uraian</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(viewingData.itemsData || []).map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-sm">{getKategoriLabel(item.kategori)}</td>
                        <td className="px-3 py-2 text-sm">
                          {item.uraian}
                          <span className="text-xs text-gray-500 ml-1">
                            ({item.volume} {item.satuan} x {formatRupiah(item.hargaSatuan)})
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-right">{formatRupiah(item.jumlah)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <label className="text-xs text-green-700">Total Realisasi</label>
              <p className="text-2xl font-bold text-green-600">{formatRupiah(viewingData.totalRealisasi)}</p>
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
                Cetak Rincian
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
          Apakah Anda yakin ingin menghapus realisasi ini? Semua item detail juga akan dihapus.
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
