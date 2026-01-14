import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, Wallet, Eye, Calculator, ClipboardList
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, CurrencyInput } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, { JENIS_PERJADIN, CHECKLIST_DALAM_KOTA, CHECKLIST_LUAR_KOTA } from '../../db/database'
import { formatTanggal, formatDateInput, formatRupiah, hitungHari } from '../../utils/formatters'
import { generateKartuKendaliPerjadinPDF } from '../../utils/perjadinDocGenerator'

const initialFormData = {
  sppdId: '',
  tanggal: formatDateInput(new Date()),
  uangHarian: '',
  jumlahHari: '',
  transport: '',
  penginapan: '',
  jumlahMalam: '',
  uangMuka: '',
  keterangan: ''
}

export default function PembayaranLS() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [selectedSPPD, setSelectedSPPD] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allPembayaran = useLiveQuery(async () => {
    const payments = await db.pembayaranLS.orderBy('createdAt').reverse().toArray()
    return Promise.all(payments.map(async (p) => {
      const sppd = await db.sppd.get(p.sppdId)
      const pegawai = sppd ? await db.pegawai.get(sppd.pegawaiId) : null
      return { ...p, sppd, pegawai }
    }))
  }) || []

  // Get SPPD that don't have pembayaran yet
  const availableSPPD = useLiveQuery(async () => {
    const allSPPD = await db.sppd.toArray()
    const existingPayments = await db.pembayaranLS.toArray()
    const paidSPPDIds = existingPayments.map(p => p.sppdId)

    const available = allSPPD.filter(s => !paidSPPDIds.includes(s.id))

    return Promise.all(available.map(async (sppd) => {
      const pegawai = await db.pegawai.get(sppd.pegawaiId)
      return { ...sppd, pegawai }
    }))
  }) || []

  const allKota = useLiveQuery(() => db.kota.toArray()) || []

  // Filter
  const filteredPembayaran = allPembayaran.filter(p =>
    p.sppd?.nomor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.pegawai?.nama?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredPembayaran.length / itemsPerPage)
  const paginatedPembayaran = filteredPembayaran.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const sppdOptions = availableSPPD.map(s => ({
    value: s.id.toString(),
    label: `${s.nomor} - ${s.pegawai?.nama} (${s.kotaTujuan})`
  }))

  // Calculate totals
  const totalUangHarian = parseInt(formData.uangHarian || 0) * parseInt(formData.jumlahHari || 0)
  const totalPenginapan = parseInt(formData.penginapan || 0) * parseInt(formData.jumlahMalam || 0)
  const subtotalBiaya = totalUangHarian + parseInt(formData.transport || 0) + totalPenginapan
  const uangMuka = parseInt(formData.uangMuka || 0)
  const totalLS = subtotalBiaya - uangMuka

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Auto-fill from SPPD
  const handleSPPDChange = async (e) => {
    const sppdId = parseInt(e.target.value)
    setFormData(prev => ({ ...prev, sppdId: e.target.value }))

    if (sppdId) {
      const sppd = await db.sppd.get(sppdId)
      if (sppd) {
        setSelectedSPPD(sppd)

        // Get tarif from kota tujuan
        const kotaTujuan = allKota.find(k => k.namaKota === sppd.kotaTujuan)
        const jumlahHari = hitungHari(sppd.tanggalBerangkat, sppd.tanggalKembali)
        const jumlahMalam = Math.max(0, jumlahHari - 1)

        // Select tarif based on jenis perjadin
        const tarifHarian = sppd.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA
          ? kotaTujuan?.tarifHarianDalamKota || 0
          : kotaTujuan?.tarifHarianLuarKota || 0

        const transport = sppd.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA
          ? kotaTujuan?.tarifTransportLokal || 0
          : kotaTujuan?.tarifTransportAntarKota || 0

        setFormData(prev => ({
          ...prev,
          sppdId: e.target.value,
          uangHarian: tarifHarian.toString(),
          jumlahHari: jumlahHari.toString(),
          transport: transport.toString(),
          penginapan: sppd.jenisPerjadin === JENIS_PERJADIN.LUAR_KOTA
            ? (kotaTujuan?.tarifPenginapan || 0).toString()
            : '0',
          jumlahMalam: sppd.jenisPerjadin === JENIS_PERJADIN.LUAR_KOTA
            ? jumlahMalam.toString()
            : '0'
        }))
      }
    } else {
      setSelectedSPPD(null)
    }
  }

  const handleOpenModal = async (pembayaran = null) => {
    if (pembayaran) {
      setEditingId(pembayaran.id)
      const sppd = await db.sppd.get(pembayaran.sppdId)
      setSelectedSPPD(sppd)
      setFormData({
        sppdId: pembayaran.sppdId?.toString() || '',
        tanggal: formatDateInput(pembayaran.tanggal),
        uangHarian: pembayaran.uangHarian?.toString() || '',
        jumlahHari: pembayaran.jumlahHari?.toString() || '',
        transport: pembayaran.transport?.toString() || '',
        penginapan: pembayaran.penginapan?.toString() || '',
        jumlahMalam: pembayaran.jumlahMalam?.toString() || '',
        uangMuka: pembayaran.uangMuka?.toString() || '',
        keterangan: pembayaran.keterangan || ''
      })
    } else {
      setEditingId(null)
      setSelectedSPPD(null)
      setFormData({
        ...initialFormData,
        tanggal: formatDateInput(new Date())
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setSelectedSPPD(null)
    setFormData(initialFormData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const sppd = await db.sppd.get(parseInt(formData.sppdId))

      const data = {
        sppdId: parseInt(formData.sppdId),
        pegawaiId: sppd?.pegawaiId,
        tanggal: new Date(formData.tanggal),
        uangHarian: parseInt(formData.uangHarian) || 0,
        jumlahHari: parseInt(formData.jumlahHari) || 0,
        totalUangHarian: totalUangHarian,
        transport: parseInt(formData.transport) || 0,
        penginapan: parseInt(formData.penginapan) || 0,
        jumlahMalam: parseInt(formData.jumlahMalam) || 0,
        totalPenginapan: totalPenginapan,
        subtotalBiaya: subtotalBiaya,
        uangMuka: uangMuka,
        totalLS: totalLS,
        keterangan: formData.keterangan,
        updatedAt: new Date()
      }

      if (editingId) {
        await db.pembayaranLS.update(editingId, data)
      } else {
        data.createdAt = new Date()
        await db.pembayaranLS.add(data)
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
      await db.pembayaranLS.delete(deletingId)
      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = (pembayaran) => {
    setViewingData(pembayaran)
    setIsViewModalOpen(true)
  }

  const handlePrintKartuKendali = async (pembayaran) => {
    try {
      // Select checklist based on jenis perjadin
      const checklistItems = pembayaran.sppd?.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA
        ? CHECKLIST_DALAM_KOTA
        : CHECKLIST_LUAR_KOTA
      await generateKartuKendaliPerjadinPDF(pembayaran, checklistItems)
    } catch (error) {
      alert('Gagal mencetak kartu kendali: ' + error.message)
    }
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  return (
    <Layout title="Pembayaran LS">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary-600" />
              Pembayaran LS (Langsung)
            </CardTitle>
            <CardDescription>
              Input pembayaran awal perjalanan dinas ke rekening pegawai
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari pembayaran..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-64"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Input Pembayaran LS
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>SPPD</TableHeader>
                <TableHeader>Pegawai</TableHeader>
                <TableHeader>Tanggal</TableHeader>
                <TableHeader>Total LS</TableHeader>
                <TableHeader>Rekening</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPembayaran.length > 0 ? (
                paginatedPembayaran.map((p, index) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.sppd?.nomor}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{p.pegawai?.nama}</p>
                        <p className="text-xs text-gray-500">{p.pegawai?.jabatan}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatTanggal(p.tanggal, 'short')}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatRupiah(p.totalLS)}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p className="font-mono">{p.pegawai?.rekening}</p>
                        <p className="text-gray-500">{p.pegawai?.bank}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(p)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintKartuKendali(p)}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg"
                          title="Cetak Kartu Kendali SPJ"
                        >
                          <ClipboardList className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(p)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(p.id)}
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
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada pembayaran LS'}
                  colSpan={7}
                />
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredPembayaran.length}
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
        title={editingId ? 'Edit Pembayaran LS' : 'Input Pembayaran LS'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!editingId && (
              <Select
                label="Pilih SPPD"
                name="sppdId"
                value={formData.sppdId}
                onChange={handleSPPDChange}
                options={sppdOptions}
                required
              />
            )}

            {selectedSPPD && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Jenis:</strong>{' '}
                  <Badge variant={selectedSPPD.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA ? 'info' : 'success'}>
                    {selectedSPPD.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA ? 'Dalam Kota' : 'Luar Kota'}
                  </Badge>
                </p>
                <p className="text-sm text-blue-900 mt-1">
                  <strong>Tujuan:</strong> {selectedSPPD.kotaTujuan}
                </p>
                <p className="text-sm text-blue-900 mt-1">
                  <strong>Tanggal:</strong> {formatTanggal(selectedSPPD.tanggalBerangkat, 'short')} - {formatTanggal(selectedSPPD.tanggalKembali, 'short')}
                </p>
              </div>
            )}

            <Input
              label="Tanggal Pembayaran"
              name="tanggal"
              type="date"
              value={formData.tanggal}
              onChange={handleInputChange}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <CurrencyInput
                label="Uang Harian (per hari)"
                name="uangHarian"
                value={formData.uangHarian}
                onChange={handleInputChange}
                placeholder="Masukkan tarif"
                helper="Dapat diedit manual sesuai SBM tujuan"
              />
              <Input
                label="Jumlah Hari"
                name="jumlahHari"
                type="number"
                value={formData.jumlahHari}
                onChange={handleInputChange}
              />
            </div>

            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm">
                Subtotal Uang Harian: <strong>{formatRupiah(totalUangHarian)}</strong>
              </p>
            </div>

            <CurrencyInput
              label="Transport"
              name="transport"
              value={formData.transport}
              onChange={handleInputChange}
              helper={selectedSPPD?.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA
                ? 'Transport lokal dalam kota'
                : 'Transport antar kota (PP)'
              }
            />

            {selectedSPPD?.jenisPerjadin === JENIS_PERJADIN.LUAR_KOTA && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <CurrencyInput
                    label="Penginapan (per malam)"
                    name="penginapan"
                    value={formData.penginapan}
                    onChange={handleInputChange}
                    placeholder="Masukkan tarif"
                    helper="Dapat diedit manual sesuai SBM tujuan"
                  />
                  <Input
                    label="Jumlah Malam"
                    name="jumlahMalam"
                    type="number"
                    value={formData.jumlahMalam}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm">
                    Subtotal Penginapan: <strong>{formatRupiah(totalPenginapan)}</strong>
                  </p>
                </div>
              </>
            )}

            {/* Subtotal Biaya */}
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <div className="flex justify-between text-sm">
                <span className="text-blue-900">Subtotal Biaya Perjalanan</span>
                <strong className="text-blue-700">{formatRupiah(subtotalBiaya)}</strong>
              </div>
            </div>

            {/* Uang Muka */}
            <CurrencyInput
              label="Uang Muka / Panjar (jika ada)"
              name="uangMuka"
              value={formData.uangMuka}
              onChange={handleInputChange}
              placeholder="Masukkan jika ada uang muka"
              helper="Uang muka yang sudah diterima sebelumnya (akan dikurangi dari total)"
            />

            {/* Total */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-800">Subtotal Biaya</span>
                  <span className="text-green-700">{formatRupiah(subtotalBiaya)}</span>
                </div>
                {uangMuka > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-800">Dikurangi Uang Muka</span>
                    <span className="text-orange-600">- {formatRupiah(uangMuka)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-green-200">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Total Pembayaran LS</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">
                    {formatRupiah(totalLS)}
                  </span>
                </div>
              </div>
            </div>

            <Input
              label="Keterangan"
              name="keterangan"
              value={formData.keterangan}
              onChange={handleInputChange}
              placeholder="Keterangan tambahan..."
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button type="submit" loading={loading}>
              {editingId ? 'Simpan Perubahan' : 'Simpan Pembayaran'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail Pembayaran LS"
        size="md"
      >
        {viewingData && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500">SPPD</label>
              <p className="font-mono">{viewingData.sppd?.nomor}</p>
            </div>

            <div>
              <label className="text-xs text-gray-500">Pegawai</label>
              <p className="font-medium">{viewingData.pegawai?.nama}</p>
              <p className="text-sm text-gray-500">{viewingData.pegawai?.jabatan}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Tanggal Bayar</label>
                <p>{formatTanggal(viewingData.tanggal)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Total LS</label>
                <p className="font-bold text-green-600">{formatRupiah(viewingData.totalLS)}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Rincian:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Uang Harian ({viewingData.jumlahHari} hari)</span>
                  <span>{formatRupiah(viewingData.totalUangHarian)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport</span>
                  <span>{formatRupiah(viewingData.transport)}</span>
                </div>
                {viewingData.totalPenginapan > 0 && (
                  <div className="flex justify-between">
                    <span>Penginapan ({viewingData.jumlahMalam} malam)</span>
                    <span>{formatRupiah(viewingData.totalPenginapan)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Subtotal Biaya</span>
                  <span>{formatRupiah(viewingData.subtotalBiaya || viewingData.totalLS + (viewingData.uangMuka || 0))}</span>
                </div>
                {viewingData.uangMuka > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Dikurangi Uang Muka</span>
                    <span>- {formatRupiah(viewingData.uangMuka)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total Pembayaran LS</span>
                  <span className="text-green-600">{formatRupiah(viewingData.totalLS)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">Transfer ke Rekening</label>
              <p className="font-mono">{viewingData.pegawai?.rekening}</p>
              <p className="text-sm text-gray-500">{viewingData.pegawai?.bank} a.n. {viewingData.pegawai?.nama}</p>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={() => handlePrintKartuKendali(viewingData)}
                icon={ClipboardList}
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
          Apakah Anda yakin ingin menghapus data pembayaran ini?
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
