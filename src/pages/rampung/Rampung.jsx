import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, ClipboardCheck, Eye, Printer,
  Calculator, TrendingUp, TrendingDown, Minus, FileText
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, Textarea, CurrencyInput } from '../../components/ui/Input'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import db, { JENIS_PERJADIN, recordHistory, AUDIT_ACTIONS, withAuditCreate, withAuditUpdate, generateArchivePath } from '../../db/database'
import { formatTanggal, formatDateInput, formatRupiah, hitungHari, terbilangRupiah } from '../../utils/formatters'
import { generateRincianBiayaPDF, generateKwitansiPDF, generatePengeluaranRiilPDF } from '../../utils/documentGenerator'
import { getSppdChecklistStatus, MissingDocsWarning, ChecklistBadge } from '../../utils/checklistValidator.jsx'
import DocumentHistory, { RevisionBadge, ArchivePathDisplay } from '../../components/ui/DocumentHistory'

const initialFormData = {
  sppdId: '',
  tanggal: formatDateInput(new Date()),
  realisasiUangHarian: '',
  jumlahHariRealisasi: '',
  realisasiTransport: '',
  realisasiPenginapan: '',
  jumlahMalamRealisasi: '',
  keterangan: ''
}

export default function Rampung() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isPengeluaranRiilModalOpen, setIsPengeluaranRiilModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [checklistStatus, setChecklistStatus] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [selectedSPPD, setSelectedSPPD] = useState(null)
  const [selectedPembayaranLS, setSelectedPembayaranLS] = useState(null)
  const [pengeluaranRiilItems, setPengeluaranRiilItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allRampung = useLiveQuery(async () => {
    const rampungs = await db.rampung.orderBy('createdAt').reverse().toArray()
    return Promise.all(rampungs.map(async (r) => {
      const sppd = await db.sppd.get(r.sppdId)
      const pegawai = sppd ? await db.pegawai.get(sppd.pegawaiId) : null
      return { ...r, sppd, pegawai }
    }))
  }) || []

  // Get SPPD that have pembayaran LS but no rampung yet
  const availableSPPD = useLiveQuery(async () => {
    const allPembayaran = await db.pembayaranLS.toArray()
    const existingRampung = await db.rampung.toArray()
    const rampungSPPDIds = existingRampung.map(r => r.sppdId)

    const available = allPembayaran.filter(p => !rampungSPPDIds.includes(p.sppdId))

    return Promise.all(available.map(async (payment) => {
      const sppd = await db.sppd.get(payment.sppdId)
      const pegawai = sppd ? await db.pegawai.get(sppd.pegawaiId) : null
      return { ...sppd, pegawai, pembayaranLS: payment }
    }))
  }) || []

  const allKota = useLiveQuery(() => db.kota.toArray()) || []

  // Filter
  const filteredRampung = allRampung.filter(r =>
    r.sppd?.nomor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.pegawai?.nama?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Pagination
  const totalPages = Math.ceil(filteredRampung.length / itemsPerPage)
  const paginatedRampung = filteredRampung.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const sppdOptions = availableSPPD.map(s => ({
    value: s.id.toString(),
    label: `${s.nomor} - ${s.pegawai?.nama} (${s.kotaTujuan})`
  }))

  // Calculate totals
  const totalRealisasiUangHarian = parseInt(formData.realisasiUangHarian || 0) * parseInt(formData.jumlahHariRealisasi || 0)
  const totalRealisasiPenginapan = parseInt(formData.realisasiPenginapan || 0) * parseInt(formData.jumlahMalamRealisasi || 0)
  const totalPengeluaranRiil = pengeluaranRiilItems.reduce((sum, item) => sum + (parseInt(item.jumlah) || 0), 0)
  const totalRealisasi = totalRealisasiUangHarian + parseInt(formData.realisasiTransport || 0) + totalRealisasiPenginapan + totalPengeluaranRiil
  const nilaiLS = selectedPembayaranLS?.totalLS || 0
  const selisih = totalRealisasi - nilaiLS

  const getStatusSelisih = () => {
    if (selisih > 0) return 'kurang'
    if (selisih < 0) return 'lebih'
    return 'nihil'
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Auto-fill from SPPD
  const handleSPPDChange = async (e) => {
    const sppdId = parseInt(e.target.value)
    setFormData(prev => ({ ...prev, sppdId: e.target.value }))

    if (sppdId) {
      const sppd = availableSPPD.find(s => s.id === sppdId)
      if (sppd) {
        setSelectedSPPD(sppd)
        setSelectedPembayaranLS(sppd.pembayaranLS)

        // Pre-fill with LS values
        const kotaTujuan = allKota.find(k => k.namaKota === sppd.kotaTujuan)
        const jumlahHari = hitungHari(sppd.tanggalBerangkat, sppd.tanggalKembali)
        const jumlahMalam = Math.max(0, jumlahHari - 1)

        const tarifHarian = sppd.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA
          ? kotaTujuan?.tarifHarianDalamKota || 0
          : kotaTujuan?.tarifHarianLuarKota || 0

        setFormData(prev => ({
          ...prev,
          sppdId: e.target.value,
          realisasiUangHarian: tarifHarian.toString(),
          jumlahHariRealisasi: jumlahHari.toString(),
          realisasiTransport: sppd.pembayaranLS?.transport?.toString() || '0',
          realisasiPenginapan: sppd.jenisPerjadin === JENIS_PERJADIN.LUAR_KOTA
            ? (kotaTujuan?.tarifPenginapan || 0).toString()
            : '0',
          jumlahMalamRealisasi: sppd.jenisPerjadin === JENIS_PERJADIN.LUAR_KOTA
            ? jumlahMalam.toString()
            : '0'
        }))
      }
    } else {
      setSelectedSPPD(null)
      setSelectedPembayaranLS(null)
    }
  }

  // Pengeluaran Riil handlers
  const addPengeluaranRiil = () => {
    setPengeluaranRiilItems([
      ...pengeluaranRiilItems,
      { tanggal: formatDateInput(new Date()), uraian: '', jumlah: '' }
    ])
  }

  const updatePengeluaranRiil = (index, field, value) => {
    const updated = [...pengeluaranRiilItems]
    updated[index][field] = value
    setPengeluaranRiilItems(updated)
  }

  const removePengeluaranRiil = (index) => {
    setPengeluaranRiilItems(pengeluaranRiilItems.filter((_, i) => i !== index))
  }

  const handleOpenModal = async (rampung = null) => {
    if (rampung) {
      setEditingId(rampung.id)
      const sppd = await db.sppd.get(rampung.sppdId)
      const pembayaranLS = await db.pembayaranLS.where('sppdId').equals(rampung.sppdId).first()
      const pengeluaranRiil = await db.pengeluaranRiil.where('rampungId').equals(rampung.id).toArray()

      setSelectedSPPD(sppd)
      setSelectedPembayaranLS(pembayaranLS)
      setPengeluaranRiilItems(pengeluaranRiil.map(p => ({
        tanggal: formatDateInput(p.tanggal),
        uraian: p.uraian,
        jumlah: p.jumlah.toString()
      })))

      setFormData({
        sppdId: rampung.sppdId?.toString() || '',
        tanggal: formatDateInput(rampung.tanggal),
        realisasiUangHarian: rampung.realisasiUangHarian?.toString() || '',
        jumlahHariRealisasi: rampung.jumlahHariRealisasi?.toString() || '',
        realisasiTransport: rampung.realisasiTransport?.toString() || '',
        realisasiPenginapan: rampung.realisasiPenginapan?.toString() || '',
        jumlahMalamRealisasi: rampung.jumlahMalamRealisasi?.toString() || '',
        keterangan: rampung.keterangan || ''
      })
    } else {
      setEditingId(null)
      setSelectedSPPD(null)
      setSelectedPembayaranLS(null)
      setPengeluaranRiilItems([])
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
    setSelectedPembayaranLS(null)
    setPengeluaranRiilItems([])
    setFormData(initialFormData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get previous data for audit if editing
      const previousData = editingId ? await db.rampung.get(editingId) : null

      const baseData = {
        sppdId: parseInt(formData.sppdId),
        pegawaiId: selectedSPPD?.pegawaiId,
        jenisPerjadin: selectedSPPD?.jenisPerjadin,
        tanggal: new Date(formData.tanggal),
        realisasiUangHarian: parseInt(formData.realisasiUangHarian) || 0,
        jumlahHariRealisasi: parseInt(formData.jumlahHariRealisasi) || 0,
        totalRealisasiUangHarian: totalRealisasiUangHarian,
        realisasiTransport: parseInt(formData.realisasiTransport) || 0,
        realisasiPenginapan: parseInt(formData.realisasiPenginapan) || 0,
        jumlahMalamRealisasi: parseInt(formData.jumlahMalamRealisasi) || 0,
        totalRealisasiPenginapan: totalRealisasiPenginapan,
        totalPengeluaranRiil: totalPengeluaranRiil,
        totalRealisasi: totalRealisasi,
        nilaiLS: nilaiLS,
        selisih: selisih,
        statusSelisih: getStatusSelisih(),
        keterangan: formData.keterangan
      }

      let rampungId
      let data

      if (editingId) {
        // Update with audit fields
        data = withAuditUpdate(baseData, previousData?.revision || 0)
        await db.rampung.update(editingId, data)
        rampungId = editingId

        // Record history for update
        await recordHistory('rampung', editingId, AUDIT_ACTIONS.UPDATE, previousData, { ...data, id: editingId })

        // Clear old pengeluaran riil
        await db.pengeluaranRiil.where('rampungId').equals(editingId).delete()
      } else {
        // Create with audit fields and archive path
        const year = new Date().getFullYear()
        data = withAuditCreate({
          ...baseData,
          archivePath: generateArchivePath('sppd', year, selectedSPPD?.nomor || 'RAMPUNG')
        })
        rampungId = await db.rampung.add(data)

        // Record history for create
        await recordHistory('rampung', rampungId, AUDIT_ACTIONS.CREATE, null, { ...data, id: rampungId })
      }

      // Save pengeluaran riil items
      if (pengeluaranRiilItems.length > 0) {
        const riilData = pengeluaranRiilItems
          .filter(item => item.uraian && item.jumlah)
          .map(item => ({
            rampungId,
            tanggal: new Date(item.tanggal),
            uraian: item.uraian,
            jumlah: parseInt(item.jumlah) || 0,
            createdAt: new Date()
          }))

        if (riilData.length > 0) {
          await db.pengeluaranRiil.bulkAdd(riilData)
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
      // Get data before delete for audit
      const deletedData = await db.rampung.get(deletingId)

      await db.pengeluaranRiil.where('rampungId').equals(deletingId).delete()
      await db.rampung.delete(deletingId)

      // Record history for delete
      await recordHistory('rampung', deletingId, AUDIT_ACTIONS.DELETE, deletedData, null)

      setIsDeleteModalOpen(false)
      setDeletingId(null)
    } catch (error) {
      alert('Gagal menghapus data: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (rampung) => {
    const pengeluaranRiil = await db.pengeluaranRiil.where('rampungId').equals(rampung.id).toArray()
    const ppk = await db.pejabat.where('jenisPejabat').equals('PPK').first()

    // Check checklist status
    const status = await getSppdChecklistStatus(rampung.sppdId)
    setChecklistStatus(status)

    setViewingData({
      ...rampung,
      pengeluaranRiilItems: pengeluaranRiil,
      ppk
    })
    setIsViewModalOpen(true)
  }

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  const handlePrintRincian = async (rampung) => {
    const pegawai = await db.pegawai.get(rampung.pegawaiId)
    const sppd = await db.sppd.get(rampung.sppdId)

    await generateRincianBiayaPDF({
      ...rampung,
      pegawai,
      sppd
    })
  }

  const handlePrintKwitansi = async (rampung) => {
    const pegawai = await db.pegawai.get(rampung.pegawaiId)
    const sppd = await db.sppd.get(rampung.sppdId)
    const ppk = await db.pejabat.where('jenisPejabat').equals('PPK').first()
    const bendahara = await db.pejabat.where('jenisPejabat').equals('BENDAHARA').first()

    await generateKwitansiPDF({
      ...rampung,
      pegawai,
      sppd,
      ppk,
      bendahara,
      nomor: sppd?.nomor,
      jumlah: rampung.totalRealisasi,
      tanggal: rampung.tanggal
    })
  }

  const handlePrintPengeluaranRiil = async (rampung) => {
    const pegawai = await db.pegawai.get(rampung.pegawaiId)
    const sppd = await db.sppd.get(rampung.sppdId)
    const items = await db.pengeluaranRiil.where('rampungId').equals(rampung.id).toArray()

    await generatePengeluaranRiilPDF({
      pegawai,
      sppd,
      items
    })
  }

  const getSelisihIcon = (status) => {
    switch (status) {
      case 'kurang': return <TrendingUp className="w-4 h-4 text-red-500" />
      case 'lebih': return <TrendingDown className="w-4 h-4 text-yellow-500" />
      default: return <Minus className="w-4 h-4 text-green-500" />
    }
  }

  return (
    <Layout title="Rampung Perjalanan Dinas">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary-600" />
              Rampung Perjalanan Dinas
            </CardTitle>
            <CardDescription>
              Input realisasi biaya perjalanan dinas setelah kembali
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari rampung..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-64"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Input Rampung
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
                <TableHeader>Total Realisasi</TableHeader>
                <TableHeader>Nilai LS</TableHeader>
                <TableHeader>Selisih</TableHeader>
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
                    <TableCell className="font-mono text-xs">
                      {r.sppd?.nomor}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{r.pegawai?.nama}</p>
                        <p className="text-xs text-gray-500">{r.sppd?.kotaTujuan}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatRupiah(r.totalRealisasi)}
                    </TableCell>
                    <TableCell>
                      {formatRupiah(r.nilaiLS)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSelisihIcon(r.statusSelisih)}
                        <span className={`font-medium ${
                          r.statusSelisih === 'kurang' ? 'text-red-600' :
                          r.statusSelisih === 'lebih' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {r.statusSelisih === 'nihil' ? 'Nihil' : formatRupiah(Math.abs(r.selisih))}
                        </span>
                        <StatusBadge status={r.statusSelisih} />
                      </div>
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
                          onClick={() => handleOpenModal(r)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrintRincian(r)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Cetak Rincian"
                        >
                          <Printer className="w-4 h-4" />
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
                  colSpan={7}
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
        title={editingId ? 'Edit Rampung' : 'Input Rampung Perjalanan Dinas'}
        size="xl"
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
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-blue-900">
                      <strong>Jenis:</strong>{' '}
                      <Badge variant={selectedSPPD.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA ? 'info' : 'success'}>
                        {selectedSPPD.jenisPerjadin === JENIS_PERJADIN.DALAM_KOTA ? 'Dalam Kota' : 'Luar Kota'}
                      </Badge>
                    </p>
                    <p className="text-sm text-blue-900 mt-1">
                      <strong>Tujuan:</strong> {selectedSPPD.kotaTujuan}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-600">Nilai LS Dibayar:</p>
                    <p className="text-lg font-bold text-blue-900">{formatRupiah(nilaiLS)}</p>
                  </div>
                </div>
              </div>
            )}

            <Input
              label="Tanggal Rampung"
              name="tanggal"
              type="date"
              value={formData.tanggal}
              onChange={handleInputChange}
              required
            />

            <h4 className="font-medium text-gray-700 pt-2">Realisasi Biaya</h4>

            <div className="grid grid-cols-2 gap-4">
              <CurrencyInput
                label="Uang Harian (per hari)"
                name="realisasiUangHarian"
                value={formData.realisasiUangHarian}
                onChange={handleInputChange}
              />
              <Input
                label="Jumlah Hari"
                name="jumlahHariRealisasi"
                type="number"
                value={formData.jumlahHariRealisasi}
                onChange={handleInputChange}
              />
            </div>

            <div className="p-3 bg-gray-50 rounded">
              <p className="text-sm">
                Subtotal Uang Harian: <strong>{formatRupiah(totalRealisasiUangHarian)}</strong>
              </p>
            </div>

            <CurrencyInput
              label="Transport"
              name="realisasiTransport"
              value={formData.realisasiTransport}
              onChange={handleInputChange}
            />

            {selectedSPPD?.jenisPerjadin === JENIS_PERJADIN.LUAR_KOTA && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <CurrencyInput
                    label="Penginapan (per malam)"
                    name="realisasiPenginapan"
                    value={formData.realisasiPenginapan}
                    onChange={handleInputChange}
                  />
                  <Input
                    label="Jumlah Malam"
                    name="jumlahMalamRealisasi"
                    type="number"
                    value={formData.jumlahMalamRealisasi}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm">
                    Subtotal Penginapan: <strong>{formatRupiah(totalRealisasiPenginapan)}</strong>
                  </p>
                </div>
              </>
            )}

            {/* Pengeluaran Riil */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700">Pengeluaran Riil</h4>
                <Button type="button" variant="secondary" size="sm" onClick={addPengeluaranRiil}>
                  Tambah Item
                </Button>
              </div>

              {pengeluaranRiilItems.length > 0 && (
                <div className="space-y-2">
                  {pengeluaranRiilItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Input
                        type="date"
                        value={item.tanggal}
                        onChange={(e) => updatePengeluaranRiil(index, 'tanggal', e.target.value)}
                        className="w-32"
                      />
                      <Input
                        placeholder="Uraian"
                        value={item.uraian}
                        onChange={(e) => updatePengeluaranRiil(index, 'uraian', e.target.value)}
                        className="flex-1"
                      />
                      <CurrencyInput
                        placeholder="Jumlah"
                        value={item.jumlah}
                        onChange={(e) => updatePengeluaranRiil(index, 'jumlah', e.target.value)}
                        className="w-36"
                      />
                      <button
                        type="button"
                        onClick={() => removePengeluaranRiil(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm">
                      Total Pengeluaran Riil: <strong>{formatRupiah(totalPengeluaranRiil)}</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="p-4 bg-gray-100 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Realisasi</span>
                <span className="font-bold">{formatRupiah(totalRealisasi)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Nilai LS Dibayar</span>
                <span>{formatRupiah(nilaiLS)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-300">
                <span>Selisih</span>
                <span className={`font-bold ${
                  selisih > 0 ? 'text-red-600' :
                  selisih < 0 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {selisih > 0 && 'Kurang Bayar: '}
                  {selisih < 0 && 'Lebih Bayar: '}
                  {selisih === 0 && 'Nihil'}
                  {selisih !== 0 && formatRupiah(Math.abs(selisih))}
                </span>
              </div>
            </div>

            <Textarea
              label="Keterangan"
              name="keterangan"
              value={formData.keterangan}
              onChange={handleInputChange}
              rows={2}
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button type="submit" loading={loading}>
              {editingId ? 'Simpan Perubahan' : 'Simpan Rampung'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail Rampung"
        size="lg"
      >
        {viewingData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">SPPD</label>
                <p className="font-mono">{viewingData.sppd?.nomor}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Tanggal Rampung</label>
                <p>{formatTanggal(viewingData.tanggal)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs text-gray-500">Pegawai</label>
                <p className="font-medium">{viewingData.pegawai?.nama}</p>
              </div>
              <div className="flex items-center gap-2">
                <RevisionBadge
                  revision={viewingData.revision}
                  createdAt={viewingData.createdAt}
                  updatedAt={viewingData.updatedAt}
                  createdBy={viewingData.createdBy}
                />
              </div>
            </div>

            {/* Archive Path */}
            {viewingData.archivePath && (
              <ArchivePathDisplay archivePath={viewingData.archivePath} />
            )}

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3">Rincian Realisasi:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Uang Harian ({viewingData.jumlahHariRealisasi} hari)</span>
                  <span>{formatRupiah(viewingData.totalRealisasiUangHarian)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport</span>
                  <span>{formatRupiah(viewingData.realisasiTransport)}</span>
                </div>
                {viewingData.totalRealisasiPenginapan > 0 && (
                  <div className="flex justify-between">
                    <span>Penginapan ({viewingData.jumlahMalamRealisasi} malam)</span>
                    <span>{formatRupiah(viewingData.totalRealisasiPenginapan)}</span>
                  </div>
                )}
                {viewingData.totalPengeluaranRiil > 0 && (
                  <div className="flex justify-between">
                    <span>Pengeluaran Riil</span>
                    <span>{formatRupiah(viewingData.totalPengeluaranRiil)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total Realisasi</span>
                  <span>{formatRupiah(viewingData.totalRealisasi)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nilai LS</span>
                  <span>{formatRupiah(viewingData.nilaiLS)}</span>
                </div>
                <div className={`flex justify-between font-bold pt-2 border-t ${
                  viewingData.statusSelisih === 'kurang' ? 'text-red-600' :
                  viewingData.statusSelisih === 'lebih' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  <span>Selisih</span>
                  <span>
                    {viewingData.statusSelisih === 'nihil' ? 'Nihil' :
                      `${viewingData.statusSelisih === 'kurang' ? 'Kurang' : 'Lebih'} ${formatRupiah(Math.abs(viewingData.selisih))}`
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 italic">
              Terbilang: {terbilangRupiah(viewingData.totalRealisasi)}
            </div>

            {/* Checklist Status Warning */}
            {checklistStatus && !checklistStatus.isComplete && (
              <MissingDocsWarning
                missingDocs={checklistStatus.missingDocs}
                completionPercent={checklistStatus.completionPercent}
              />
            )}

            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button
                variant="secondary"
                icon={FileText}
                onClick={() => handlePrintRincian(viewingData)}
              >
                Rincian Biaya
              </Button>
              <Button
                variant="secondary"
                icon={FileText}
                onClick={() => handlePrintKwitansi(viewingData)}
                disabled={!checklistStatus?.isComplete}
                title={!checklistStatus?.isComplete ? 'Checklist SPJ harus 100% lengkap' : ''}
              >
                Kwitansi {!checklistStatus?.isComplete && '(Checklist Belum Lengkap)'}
              </Button>
              {viewingData.pengeluaranRiilItems?.length > 0 && (
                <Button
                  variant="secondary"
                  icon={FileText}
                  onClick={() => handlePrintPengeluaranRiil(viewingData)}
                >
                  Pengeluaran Riil
                </Button>
              )}
            </div>

            {/* Document History Panel */}
            <div className="mt-4">
              <DocumentHistory
                tableName="rampung"
                recordId={viewingData.id}
                title="Riwayat Dokumen Rampung"
              />
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
          Apakah Anda yakin ingin menghapus data rampung ini?
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
