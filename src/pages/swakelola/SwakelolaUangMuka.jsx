import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, Banknote, Eye, Printer, CheckCircle, ClipboardList, ChevronDown
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, CurrencyInput, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, { CHECKLIST_SWAKELOLA } from '../../db/database'
import { formatTanggal, formatDateInput, formatRupiah, angkaTerbilang } from '../../utils/formatters'
import { generateKwitansiUangMukaPDF, generateKartuKendaliPUMSwakeolaPDF } from '../../utils/swakelolaDocGenerator'

const initialFormData = {
  kegiatanId: '',
  nomorKwitansi: '',
  tanggal: '',
  penerimaId: '',
  tipePenerima: 'pegawai',
  jumlah: '',
  keterangan: '',
  rekeningTujuan: '',
  bankTujuan: ''
}

export default function SwakelolaUangMuka() {
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
  const itemsPerPage = 10

  // Fetch data
  const allUangMuka = useLiveQuery(async () => {
    const uangMuka = await db.swakelolaUangMuka.orderBy('createdAt').reverse().toArray()
    return Promise.all(uangMuka.map(async (um) => {
      const kegiatan = await db.swakelolaKegiatan.get(um.kegiatanId)
      let penerima = null
      if (um.tipePenerima === 'pegawai' && um.penerimaId) {
        penerima = await db.pegawai.get(um.penerimaId)
      } else if (um.tipePenerima === 'bendahara' && um.penerimaId) {
        const tim = await db.swakelolaTim.get(um.penerimaId)
        if (tim) {
          penerima = await db.pegawai.get(tim.pegawaiId)
        }
      }
      return { ...um, kegiatan, penerima }
    }))
  }) || []

  const allKegiatan = useLiveQuery(() => db.swakelolaKegiatan.toArray()) || []
  const allPegawai = useLiveQuery(() => db.pegawai.toArray()) || []

  // Get bendahara from swakelola tim
  const allBendahara = useLiveQuery(async () => {
    const tim = await db.swakelolaTim.where('peran').equals('bendahara').toArray()
    return Promise.all(tim.map(async (t) => {
      const pegawai = await db.pegawai.get(t.pegawaiId)
      const kegiatan = await db.swakelolaKegiatan.get(t.kegiatanId)
      return { ...t, pegawai, kegiatan }
    }))
  }) || []

  // Filter by kegiatan and search
  const filteredUangMuka = allUangMuka.filter(um => {
    const matchSearch = um.penerima?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      um.kegiatan?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      um.nomorKwitansi?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchKegiatan = !selectedKegiatan || um.kegiatanId === parseInt(selectedKegiatan)
    return matchSearch && matchKegiatan
  })

  // Pagination
  const totalPages = Math.ceil(filteredUangMuka.length / itemsPerPage)
  const paginatedUangMuka = filteredUangMuka.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Options
  const kegiatanOptions = allKegiatan.map(k => ({
    value: k.id.toString(),
    label: `${k.kode} - ${k.nama}`
  }))

  const pegawaiOptions = allPegawai.map(p => ({
    value: p.id.toString(),
    label: `${p.nama} (${p.nip})`
  }))

  const bendaharaOptions = allBendahara.map(b => ({
    value: b.id.toString(),
    label: `${b.pegawai?.nama} - ${b.kegiatan?.kode}`
  }))

  const tipePenerimaOptions = [
    { value: 'pegawai', label: 'Pegawai' },
    { value: 'bendahara', label: 'Bendahara Kegiatan' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Auto-fill rekening when penerima changes
    if (name === 'penerimaId' && value) {
      if (formData.tipePenerima === 'pegawai') {
        const pegawai = allPegawai.find(p => p.id === parseInt(value))
        if (pegawai) {
          setFormData(prev => ({
            ...prev,
            penerimaId: value,
            rekeningTujuan: pegawai.rekening || '',
            bankTujuan: pegawai.bank || ''
          }))
        }
      } else if (formData.tipePenerima === 'bendahara') {
        const bendahara = allBendahara.find(b => b.id === parseInt(value))
        if (bendahara?.pegawai) {
          setFormData(prev => ({
            ...prev,
            penerimaId: value,
            rekeningTujuan: bendahara.pegawai.rekening || '',
            bankTujuan: bendahara.pegawai.bank || ''
          }))
        }
      }
    }

    // Reset penerima when type changes
    if (name === 'tipePenerima') {
      setFormData(prev => ({
        ...prev,
        tipePenerima: value,
        penerimaId: '',
        rekeningTujuan: '',
        bankTujuan: ''
      }))
    }
  }

  const generateNomorKwitansi = async () => {
    const currentYear = new Date().getFullYear()
    const count = await db.swakelolaUangMuka.count()
    return `KWT-UM/${String(count + 1).padStart(4, '0')}/${currentYear}`
  }

  const handleOpenModal = async (uangMuka = null) => {
    if (uangMuka) {
      setEditingId(uangMuka.id)
      setFormData({
        kegiatanId: uangMuka.kegiatanId?.toString() || '',
        nomorKwitansi: uangMuka.nomorKwitansi || '',
        tanggal: formatDateInput(uangMuka.tanggal),
        penerimaId: uangMuka.penerimaId?.toString() || '',
        tipePenerima: uangMuka.tipePenerima || 'pegawai',
        jumlah: uangMuka.jumlah?.toString() || '',
        keterangan: uangMuka.keterangan || '',
        rekeningTujuan: uangMuka.rekeningTujuan || '',
        bankTujuan: uangMuka.bankTujuan || ''
      })
    } else {
      setEditingId(null)
      const nomorKwitansi = await generateNomorKwitansi()
      setFormData({
        ...initialFormData,
        nomorKwitansi,
        tanggal: formatDateInput(new Date())
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
      const jumlah = parseInt(formData.jumlah) || 0
      const terbilang = angkaTerbilang(jumlah) + ' rupiah'

      const data = {
        kegiatanId: parseInt(formData.kegiatanId),
        nomorKwitansi: formData.nomorKwitansi,
        tanggal: formData.tanggal ? new Date(formData.tanggal) : new Date(),
        penerimaId: parseInt(formData.penerimaId),
        tipePenerima: formData.tipePenerima,
        jumlah,
        terbilang,
        keterangan: formData.keterangan,
        rekeningTujuan: formData.rekeningTujuan,
        bankTujuan: formData.bankTujuan,
        status: 'aktif',
        updatedAt: new Date()
      }

      if (editingId) {
        await db.swakelolaUangMuka.update(editingId, data)
      } else {
        data.createdAt = new Date()
        await db.swakelolaUangMuka.add(data)
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
      await db.swakelolaUangMuka.delete(deletingId)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (uangMuka) => {
    setViewingData(uangMuka)
    setIsViewModalOpen(true)
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  const handlePrint = async (uangMuka) => {
    try {
      await generateKwitansiUangMukaPDF(uangMuka)
    } catch (error) {
      alert('Gagal mencetak kwitansi: ' + error.message)
    }
  }

  const handlePrintKartuKendali = async (uangMuka) => {
    try {
      await generateKartuKendaliPUMSwakeolaPDF(uangMuka, CHECKLIST_SWAKELOLA)
    } catch (error) {
      alert('Gagal mencetak kartu kendali: ' + error.message)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      aktif: 'warning',
      selesai: 'success',
      batal: 'danger'
    }
    const labels = {
      aktif: 'Belum Dirampungkan',
      selesai: 'Sudah Dirampungkan',
      batal: 'Dibatalkan'
    }
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  return (
    <Layout title="Uang Muka Swakelola">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-primary-600" />
              Uang Muka (Panjar) Swakelola
            </CardTitle>
            <CardDescription>
              Kelola pembayaran uang muka kegiatan swakelola
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
              Tambah Uang Muka
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
                <TableHeader>Penerima</TableHeader>
                <TableHeader>Jumlah</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUangMuka.length > 0 ? (
                paginatedUangMuka.map((um, index) => (
                  <TableRow key={um.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {um.nomorKwitansi}
                    </TableCell>
                    <TableCell>
                      {formatTanggal(um.tanggal)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-mono text-xs">{um.kegiatan?.kode}</p>
                        <p className="text-xs text-gray-500 truncate">{um.kegiatan?.nama}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{um.penerima?.nama}</p>
                        <p className="text-xs text-gray-500 capitalize">{um.tipePenerima}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatRupiah(um.jumlah)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(um.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(um)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Dropdown for document printing */}
                        <div className="relative group">
                          <button
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-0.5"
                            title="Cetak Dokumen"
                          >
                            <Printer className="w-4 h-4" />
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 hidden group-hover:block">
                            <button
                              onClick={() => handlePrint(um)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Printer className="w-4 h-4 text-green-600" />
                              Kwitansi Uang Muka
                            </button>
                            <button
                              onClick={() => handlePrintSPR(um)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Building2 className="w-4 h-4 text-blue-600" />
                              SPR (Tunai Teller)
                            </button>
                            <button
                              onClick={() => handlePrintSPPR(um)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <CreditCard className="w-4 h-4 text-purple-600" />
                              SPPR (Kartu Debit)
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePrintKartuKendali(um)}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg"
                          title="Cetak Kartu Kendali SPJ"
                        >
                          <ClipboardList className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(um)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(um.id)}
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
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada uang muka'}
                  colSpan={8}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredUangMuka.length}
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
        title={editingId ? 'Edit Uang Muka' : 'Tambah Uang Muka'}
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
                label="Nomor Kwitansi"
                name="nomorKwitansi"
                value={formData.nomorKwitansi}
                onChange={handleInputChange}
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
              label="Tipe Penerima"
              name="tipePenerima"
              value={formData.tipePenerima}
              onChange={handleInputChange}
              options={tipePenerimaOptions}
              required
            />

            <Select
              label="Penerima"
              name="penerimaId"
              value={formData.penerimaId}
              onChange={handleInputChange}
              options={formData.tipePenerima === 'pegawai' ? pegawaiOptions : bendaharaOptions}
              required
            />

            <CurrencyInput
              label="Jumlah Uang Muka"
              name="jumlah"
              value={formData.jumlah}
              onChange={handleInputChange}
              required
            />

            {/* Terbilang Preview */}
            {formData.jumlah && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-700">Terbilang:</p>
                <p className="text-sm font-medium text-yellow-800 capitalize">
                  {angkaTerbilang(parseInt(formData.jumlah) || 0)} rupiah
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Rekening Tujuan"
                name="rekeningTujuan"
                value={formData.rekeningTujuan}
                onChange={handleInputChange}
                placeholder="123456789"
              />
              <Input
                label="Bank"
                name="bankTujuan"
                value={formData.bankTujuan}
                onChange={handleInputChange}
                placeholder="BRI"
              />
            </div>

            <Textarea
              label="Keterangan"
              name="keterangan"
              value={formData.keterangan}
              onChange={handleInputChange}
              rows={3}
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
        title="Detail Uang Muka"
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

            <div>
              <label className="text-xs text-gray-500">Penerima ({viewingData.tipePenerima})</label>
              <p className="font-medium">{viewingData.penerima?.nama}</p>
              <p className="text-sm text-gray-500">{viewingData.penerima?.jabatan}</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <label className="text-xs text-green-700">Jumlah</label>
              <p className="text-2xl font-bold text-green-600">{formatRupiah(viewingData.jumlah)}</p>
              <p className="text-sm text-green-700 capitalize">{viewingData.terbilang}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Rekening Tujuan</label>
                <p className="font-mono">{viewingData.rekeningTujuan || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Bank</label>
                <p>{viewingData.bankTujuan || '-'}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Keterangan</label>
              <p>{viewingData.keterangan || '-'}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500">Status</label>
              <p>{getStatusBadge(viewingData.status)}</p>
            </div>

            <div className="pt-4 border-t space-y-2">
              <Button
                onClick={() => handlePrint(viewingData)}
                icon={Printer}
                className="w-full"
              >
                Kwitansi Uang Muka
              </Button>
              <Button
                onClick={() => handlePrintKartuKendali(viewingData)}
                icon={ClipboardList}
                variant="secondary"
                className="w-full"
              >
                Cetak Kartu Kendali SPJ
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
          Apakah Anda yakin ingin menghapus uang muka ini?
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
