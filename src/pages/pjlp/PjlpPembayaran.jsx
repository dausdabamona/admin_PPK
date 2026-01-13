import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Trash2, Search, Wallet, Eye, Printer, CheckCircle, Clock
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, CurrencyInput, TextArea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, { BULAN_INDONESIA, STATUS_PEMBAYARAN_PJLP, TARIF_PPH_PJLP, TARIF_BPJS, calculatePphPjlp, calculateBpjs } from '../../db/database'
import { formatTanggal, formatDateInput, formatRupiah, terbilangRupiah } from '../../utils/formatters'
import { generateKwitansiPjlpPDF } from '../../utils/pjlpDocGenerator'

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const initialFormData = {
  pjlpId: '',
  kontrakId: '',
  bulan: currentMonth.toString(),
  tahun: currentYear.toString(),
  honorBruto: '',
  potonganLain: '0',
  keterangan: ''
}

export default function PjlpPembayaran() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [filterBulan, setFilterBulan] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allPembayaran = useLiveQuery(async () => {
    const pembayaran = await db.pjlpPembayaran.orderBy('createdAt').reverse().toArray()
    return Promise.all(pembayaran.map(async (p) => {
      const pjlp = await db.pjlpMaster.get(p.pjlpId)
      const kontrak = p.kontrakId ? await db.pjlpKontrak.get(p.kontrakId) : null
      return { ...p, pjlp, kontrak }
    }))
  }) || []

  const allPjlp = useLiveQuery(() =>
    db.pjlpMaster.where('statusAktif').equals('aktif').toArray()
  ) || []

  const allKontrak = useLiveQuery(() =>
    db.pjlpKontrak.where('status').equals('aktif').toArray()
  ) || []

  // Filter
  const filteredPembayaran = allPembayaran.filter(p => {
    const matchSearch = p.pjlp?.nama?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchBulan = !filterBulan || p.bulan === parseInt(filterBulan)
    const matchStatus = !filterStatus || p.status === filterStatus
    return matchSearch && matchBulan && matchStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredPembayaran.length / itemsPerPage)
  const paginatedPembayaran = filteredPembayaran.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Options
  const pjlpOptions = allPjlp.map(p => ({
    value: p.id.toString(),
    label: `${p.nama} (${p.nik})`
  }))

  const kontrakOptions = allKontrak
    .filter(k => !formData.pjlpId || k.pjlpId === parseInt(formData.pjlpId))
    .map(k => ({
      value: k.id.toString(),
      label: k.nomorKontrak
    }))

  const bulanOptions = BULAN_INDONESIA.map(b => ({
    value: b.value.toString(),
    label: b.label
  }))

  const tahunOptions = Array.from({ length: 5 }, (_, i) => ({
    value: (currentYear - 2 + i).toString(),
    label: (currentYear - 2 + i).toString()
  }))

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'siap_bayar', label: 'Siap Bayar' },
    { value: 'dibayar', label: 'Dibayar' }
  ]

  // Calculate totals
  const calculateTotals = (honorBruto, pjlp, potonganLain = 0) => {
    const bruto = parseInt(honorBruto) || 0
    const hasNpwp = !!pjlp?.npwp
    const pph = calculatePphPjlp(bruto, hasNpwp)
    const bpjs = calculateBpjs(bruto)
    const totalPotongan = pph + bpjs.kesehatan + bpjs.ketenagakerjaan + (parseInt(potonganLain) || 0)
    const netto = bruto - totalPotongan

    return {
      honorBruto: bruto,
      potonganPph: pph,
      tarifPph: hasNpwp ? TARIF_PPH_PJLP.withNpwp : TARIF_PPH_PJLP.withoutNpwp,
      potonganBpjsKesehatan: bpjs.kesehatan,
      potonganBpjsKetenagakerjaan: bpjs.ketenagakerjaan,
      potonganLain: parseInt(potonganLain) || 0,
      totalPotongan,
      honorNetto: netto
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Auto-fill honor from PJLP or Kontrak
    if (name === 'pjlpId' && value) {
      const pjlp = allPjlp.find(p => p.id === parseInt(value))
      if (pjlp) {
        setFormData(prev => ({
          ...prev,
          pjlpId: value,
          honorBruto: pjlp.honorBulanan?.toString() || ''
        }))
      }
    }

    if (name === 'kontrakId' && value) {
      const kontrak = allKontrak.find(k => k.id === parseInt(value))
      if (kontrak) {
        setFormData(prev => ({
          ...prev,
          kontrakId: value,
          honorBruto: kontrak.honorBulanan?.toString() || prev.honorBruto
        }))
      }
    }
  }

  const generateNomorKwitansi = async (bulan, tahun) => {
    const count = await db.pjlpKwitansi.count()
    return `KWT-PJLP/${String(count + 1).padStart(4, '0')}/${bulan}/${tahun}`
  }

  const handleOpenModal = async (pembayaran = null) => {
    if (pembayaran) {
      setEditingId(pembayaran.id)
      setFormData({
        pjlpId: pembayaran.pjlpId?.toString() || '',
        kontrakId: pembayaran.kontrakId?.toString() || '',
        bulan: pembayaran.bulan?.toString() || currentMonth.toString(),
        tahun: pembayaran.tahun?.toString() || currentYear.toString(),
        honorBruto: pembayaran.honorBruto?.toString() || '',
        potonganLain: pembayaran.potonganLain?.toString() || '0',
        keterangan: pembayaran.keterangan || ''
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
      const pjlp = allPjlp.find(p => p.id === parseInt(formData.pjlpId))
      const totals = calculateTotals(formData.honorBruto, pjlp, formData.potonganLain)

      const data = {
        pjlpId: parseInt(formData.pjlpId),
        kontrakId: formData.kontrakId ? parseInt(formData.kontrakId) : null,
        bulan: parseInt(formData.bulan),
        tahun: parseInt(formData.tahun),
        ...totals,
        rekening: pjlp?.rekening || '',
        bank: pjlp?.bank || '',
        tanggalBayar: null,
        status: 'draft',
        keterangan: formData.keterangan,
        updatedAt: new Date()
      }

      if (editingId) {
        await db.pjlpPembayaran.update(editingId, data)
      } else {
        data.createdAt = new Date()
        await db.pjlpPembayaran.add(data)
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
      await db.pjlpPembayaran.delete(deletingId)
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

  const confirmDelete = (id) => {
    setDeletingId(id)
    setIsDeleteModalOpen(true)
  }

  const handleSetSiapBayar = async (id) => {
    await db.pjlpPembayaran.update(id, { status: 'siap_bayar' })
  }

  const handleSetDibayar = async (pembayaran) => {
    const nomorKwitansi = await generateNomorKwitansi(pembayaran.bulan, pembayaran.tahun)

    await db.pjlpPembayaran.update(pembayaran.id, {
      status: 'dibayar',
      tanggalBayar: new Date()
    })

    // Create kwitansi
    await db.pjlpKwitansi.add({
      pembayaranId: pembayaran.id,
      pjlpId: pembayaran.pjlpId,
      nomorKwitansi,
      tanggal: new Date(),
      jumlah: pembayaran.honorNetto,
      terbilang: terbilangRupiah(pembayaran.honorNetto),
      keterangan: `Pembayaran Honor PJLP Bulan ${getBulanLabel(pembayaran.bulan)} ${pembayaran.tahun}`,
      createdAt: new Date()
    })
  }

  const handlePrint = async (pembayaran) => {
    try {
      await generateKwitansiPjlpPDF(pembayaran, pembayaran.pjlp)
    } catch (error) {
      alert('Gagal mencetak kwitansi: ' + error.message)
    }
  }

  const getBulanLabel = (bulan) => {
    return BULAN_INDONESIA.find(b => b.value === bulan)?.label || bulan
  }

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'default',
      siap_bayar: 'warning',
      dibayar: 'success'
    }
    const labels = {
      draft: 'Draft',
      siap_bayar: 'Siap Bayar',
      dibayar: 'Dibayar'
    }
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  // Preview calculation
  const selectedPjlp = allPjlp.find(p => p.id === parseInt(formData.pjlpId))
  const previewTotals = formData.honorBruto ? calculateTotals(formData.honorBruto, selectedPjlp, formData.potonganLain) : null

  // Stats
  const totalSiapBayar = allPembayaran.filter(p => p.status === 'siap_bayar').length
  const totalDibayarBulanIni = allPembayaran.filter(p =>
    p.status === 'dibayar' && p.bulan === currentMonth && p.tahun === currentYear
  ).reduce((sum, p) => sum + (p.honorNetto || 0), 0)

  return (
    <Layout title="Pembayaran PJLP">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Siap Bayar</p>
            <p className="text-2xl font-bold">{totalSiapBayar} PJLP</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Dibayar Bulan Ini</p>
            <p className="text-2xl font-bold">{formatRupiah(totalDibayarBulanIni)}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Pembayaran</p>
            <p className="text-2xl font-bold">{allPembayaran.length}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary-600" />
              Pembayaran Bulanan PJLP
            </CardTitle>
            <CardDescription>
              Kelola pembayaran honor bulanan PJLP dengan auto-calculate PPh dan BPJS
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={filterBulan}
              onChange={(e) => {
                setFilterBulan(e.target.value)
                setCurrentPage(1)
              }}
              options={bulanOptions}
              placeholder="Semua Bulan"
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
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="input pl-10 w-full sm:w-40"
              />
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>
              Input Pembayaran
            </Button>
          </div>
        </CardHeader>

        <CardBody className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>No</TableHeader>
                <TableHeader>Bulan/Tahun</TableHeader>
                <TableHeader>PJLP</TableHeader>
                <TableHeader>Honor Bruto</TableHeader>
                <TableHeader>Potongan</TableHeader>
                <TableHeader>Honor Netto</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Aksi</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPembayaran.length > 0 ? (
                paginatedPembayaran.map((pembayaran, index) => (
                  <TableRow key={pembayaran.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      {getBulanLabel(pembayaran.bulan)} {pembayaran.tahun}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{pembayaran.pjlp?.nama}</p>
                      <p className="text-xs text-gray-500">{pembayaran.pjlp?.nik}</p>
                    </TableCell>
                    <TableCell>
                      {formatRupiah(pembayaran.honorBruto)}
                    </TableCell>
                    <TableCell className="text-red-600">
                      - {formatRupiah(pembayaran.totalPotongan)}
                    </TableCell>
                    <TableCell className="font-bold text-green-600">
                      {formatRupiah(pembayaran.honorNetto)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(pembayaran.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleView(pembayaran)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {pembayaran.status === 'draft' && (
                          <button
                            onClick={() => handleSetSiapBayar(pembayaran.id)}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Set Siap Bayar"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                        {pembayaran.status === 'siap_bayar' && (
                          <button
                            onClick={() => handleSetDibayar(pembayaran)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Set Dibayar"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {pembayaran.status === 'dibayar' && (
                          <button
                            onClick={() => handlePrint(pembayaran)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Cetak Kwitansi"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        {pembayaran.status === 'draft' && (
                          <>
                            <button
                              onClick={() => handleOpenModal(pembayaran)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => confirmDelete(pembayaran.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableEmpty
                  message={searchQuery ? 'Tidak ada data yang sesuai pencarian' : 'Belum ada pembayaran'}
                  colSpan={8}
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
        title={editingId ? 'Edit Pembayaran' : 'Input Pembayaran Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Select
              label="PJLP"
              name="pjlpId"
              value={formData.pjlpId}
              onChange={handleInputChange}
              options={pjlpOptions}
              required
            />

            <Select
              label="Kontrak (Opsional)"
              name="kontrakId"
              value={formData.kontrakId}
              onChange={handleInputChange}
              options={kontrakOptions}
              placeholder="Pilih kontrak terkait"
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Bulan"
                name="bulan"
                value={formData.bulan}
                onChange={handleInputChange}
                options={bulanOptions}
                required
              />
              <Select
                label="Tahun"
                name="tahun"
                value={formData.tahun}
                onChange={handleInputChange}
                options={tahunOptions}
                required
              />
            </div>

            <CurrencyInput
              label="Honor Bruto"
              name="honorBruto"
              value={formData.honorBruto}
              onChange={handleInputChange}
              required
            />

            <CurrencyInput
              label="Potongan Lain-lain"
              name="potonganLain"
              value={formData.potonganLain}
              onChange={handleInputChange}
            />

            {/* Preview Calculation */}
            {previewTotals && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <h4 className="font-medium text-gray-700 mb-3">Rincian Perhitungan:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>Honor Bruto:</span>
                  <span className="text-right">{formatRupiah(previewTotals.honorBruto)}</span>

                  <span>PPh 21 ({(previewTotals.tarifPph * 100).toFixed(1)}%):</span>
                  <span className="text-right text-red-600">- {formatRupiah(previewTotals.potonganPph)}</span>

                  <span>BPJS Kesehatan (1%):</span>
                  <span className="text-right text-red-600">- {formatRupiah(previewTotals.potonganBpjsKesehatan)}</span>

                  <span>BPJS Ketenagakerjaan (2%):</span>
                  <span className="text-right text-red-600">- {formatRupiah(previewTotals.potonganBpjsKetenagakerjaan)}</span>

                  <span>Potongan Lain:</span>
                  <span className="text-right text-red-600">- {formatRupiah(previewTotals.potonganLain)}</span>

                  <span className="font-bold border-t pt-2">Total Potongan:</span>
                  <span className="text-right font-bold text-red-600 border-t pt-2">- {formatRupiah(previewTotals.totalPotongan)}</span>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between">
                    <span className="font-bold text-lg">Honor Netto (Diterima):</span>
                    <span className="font-bold text-lg text-green-600">{formatRupiah(previewTotals.honorNetto)}</span>
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
        title="Detail Pembayaran"
        size="lg"
      >
        {viewingData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Periode</label>
                <p className="font-medium">{getBulanLabel(viewingData.bulan)} {viewingData.tahun}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(viewingData.status)}</div>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500">PJLP</label>
              <p className="text-lg font-bold">{viewingData.pjlp?.nama}</p>
              <p className="text-sm text-gray-500">NIK: {viewingData.pjlp?.nik}</p>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full">
                <tbody className="divide-y">
                  <tr>
                    <td className="px-4 py-2 text-sm">Honor Bruto</td>
                    <td className="px-4 py-2 text-sm text-right">{formatRupiah(viewingData.honorBruto)}</td>
                  </tr>
                  <tr className="bg-red-50">
                    <td className="px-4 py-2 text-sm text-red-700">PPh 21 ({(viewingData.tarifPph * 100).toFixed(1)}%)</td>
                    <td className="px-4 py-2 text-sm text-right text-red-600">- {formatRupiah(viewingData.potonganPph)}</td>
                  </tr>
                  <tr className="bg-red-50">
                    <td className="px-4 py-2 text-sm text-red-700">BPJS Kesehatan</td>
                    <td className="px-4 py-2 text-sm text-right text-red-600">- {formatRupiah(viewingData.potonganBpjsKesehatan)}</td>
                  </tr>
                  <tr className="bg-red-50">
                    <td className="px-4 py-2 text-sm text-red-700">BPJS Ketenagakerjaan</td>
                    <td className="px-4 py-2 text-sm text-right text-red-600">- {formatRupiah(viewingData.potonganBpjsKetenagakerjaan)}</td>
                  </tr>
                  <tr className="bg-red-50">
                    <td className="px-4 py-2 text-sm text-red-700">Potongan Lain</td>
                    <td className="px-4 py-2 text-sm text-right text-red-600">- {formatRupiah(viewingData.potonganLain)}</td>
                  </tr>
                  <tr className="bg-green-50 font-bold">
                    <td className="px-4 py-3 text-green-700">Honor Netto</td>
                    <td className="px-4 py-3 text-right text-green-600">{formatRupiah(viewingData.honorNetto)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Rekening Tujuan</label>
                <p className="font-mono">{viewingData.rekening}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Bank</label>
                <p>{viewingData.bank}</p>
              </div>
            </div>

            {viewingData.tanggalBayar && (
              <div>
                <label className="text-xs text-gray-500">Tanggal Bayar</label>
                <p>{formatTanggal(viewingData.tanggalBayar)}</p>
              </div>
            )}

            {viewingData.status === 'dibayar' && (
              <div className="pt-4 border-t">
                <Button
                  onClick={() => handlePrint(viewingData)}
                  icon={Printer}
                  className="w-full"
                >
                  Cetak Kwitansi
                </Button>
              </div>
            )}
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
          Apakah Anda yakin ingin menghapus pembayaran ini?
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
