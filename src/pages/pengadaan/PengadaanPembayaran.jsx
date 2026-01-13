import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Search, Wallet, Eye, Package, ChevronRight, Save,
  FileText, AlertTriangle, DollarSign, Receipt, CheckCircle, XCircle
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, CurrencyInput, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, {
  JENIS_PENGADAAN,
  STATUS_PEMBAYARAN_PENGADAAN,
  WORKFLOW_STATUS_PENGADAAN,
  getWorkflowStatusLabel,
  withAuditCreate,
  withAuditUpdate,
  recordHistory,
  AUDIT_ACTIONS,
  calculatePphPengadaan,
  calculatePpnPengadaan
} from '../../db/database'
import { formatRupiah, formatDateInput, formatTanggal } from '../../utils/formatters'

// Payment Form
const initialPaymentData = {
  terminKe: '1',
  jenisPembayaran: 'sekaligus',
  nilaiTagihan: '',
  ppn: '',
  pph: '',
  potonganDenda: '0',
  potonganLain: '0',
  nomorKwitansi: '',
  tanggalKwitansi: formatDateInput(new Date()),
  tanggalBayar: '',
  rekening: '',
  bank: '',
  keterangan: ''
}

export default function PengadaanPembayaran() {
  const [selectedPaket, setSelectedPaket] = useState(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [paymentData, setPaymentData] = useState(initialPaymentData)
  const [editingPaymentId, setEditingPaymentId] = useState(null)
  const [viewingPayment, setViewingPayment] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString())
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch paket data (with serah terima)
  const allPaket = useLiveQuery(() =>
    db.procurementPackage
      .where('workflowStatus')
      .anyOf([
        WORKFLOW_STATUS_PENGADAAN.SERAH_TERIMA,
        WORKFLOW_STATUS_PENGADAAN.PEMBAYARAN,
        WORKFLOW_STATUS_PENGADAAN.SELESAI
      ])
      .reverse()
      .toArray()
  ) || []

  // Fetch kontrak for selected paket
  const existingKontrak = useLiveQuery(
    () => selectedPaket ? db.procurementContract.where('paketId').equals(selectedPaket.id).first() : null,
    [selectedPaket]
  )

  // Fetch vendor for kontrak
  const kontrakVendor = useLiveQuery(
    () => existingKontrak?.vendorId ? db.procurementVendor.get(existingKontrak.vendorId) : null,
    [existingKontrak]
  )

  // Fetch BAST list for kontrak
  const bastList = useLiveQuery(
    () => existingKontrak ? db.procurementBast.where('contractId').equals(existingKontrak.id).toArray() : [],
    [existingKontrak]
  )

  // Fetch payments for kontrak
  const paymentList = useLiveQuery(
    () => existingKontrak ? db.procurementPayment.where('contractId').equals(existingKontrak.id).toArray() : [],
    [existingKontrak]
  )

  // Filter paket
  const filteredPaket = allPaket.filter(p => {
    const matchSearch = p.namaPaket?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kodePaket?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchTahun = !filterTahun || p.tahun === filterTahun
    return matchSearch && matchTahun
  })

  const tahunOptions = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y >= currentYear - 3; y--) {
    tahunOptions.push({ value: y.toString(), label: y.toString() })
  }

  const statusPembayaranOptions = [
    { value: STATUS_PEMBAYARAN_PENGADAAN.DRAFT, label: 'Draft' },
    { value: STATUS_PEMBAYARAN_PENGADAAN.SIAP_BAYAR, label: 'Siap Bayar' },
    { value: STATUS_PEMBAYARAN_PENGADAAN.DIBAYAR, label: 'Dibayar' }
  ]

  const bankOptions = [
    { value: 'BRI', label: 'BRI' },
    { value: 'BNI', label: 'BNI' },
    { value: 'Mandiri', label: 'Mandiri' },
    { value: 'BCA', label: 'BCA' },
    { value: 'BTN', label: 'BTN' },
    { value: 'Bank Papua', label: 'Bank Papua' },
    { value: 'Lainnya', label: 'Lainnya' }
  ]

  const getJenisLabel = (jenisId) => {
    return JENIS_PENGADAAN.find(j => j.id === jenisId)?.nama || jenisId
  }

  const handleSelectPaket = (paket) => {
    setSelectedPaket(paket)
  }

  // Calculate totals
  const calculateTotals = () => {
    const nilaiTagihan = parseInt(paymentData.nilaiTagihan) || 0
    const ppn = parseInt(paymentData.ppn) || 0
    const pph = parseInt(paymentData.pph) || 0
    const potonganDenda = parseInt(paymentData.potonganDenda) || 0
    const potonganLain = parseInt(paymentData.potonganLain) || 0

    const totalPotongan = pph + potonganDenda + potonganLain
    const nilaiNetto = nilaiTagihan + ppn - totalPotongan

    return { nilaiTagihan, ppn, pph, potonganDenda, potonganLain, totalPotongan, nilaiNetto }
  }

  // Auto calculate taxes
  const handleNilaiTagihanChange = (e) => {
    const nilai = parseInt(e.target.value) || 0
    const ppn = calculatePpnPengadaan(nilai)
    const pph = calculatePphPengadaan(nilai, selectedPaket?.jenisPengadaan)

    setPaymentData(prev => ({
      ...prev,
      nilaiTagihan: e.target.value,
      ppn: ppn.toString(),
      pph: pph.toString()
    }))
  }

  const handleOpenPaymentModal = (payment = null) => {
    if (payment) {
      setEditingPaymentId(payment.id)
      setPaymentData({
        terminKe: payment.terminKe?.toString() || '1',
        jenisPembayaran: payment.jenisPembayaran || 'sekaligus',
        nilaiTagihan: payment.nilaiTagihan?.toString() || '',
        ppn: payment.ppn?.toString() || '',
        pph: payment.pph?.toString() || '',
        potonganDenda: payment.potonganDenda?.toString() || '0',
        potonganLain: payment.potonganLain?.toString() || '0',
        nomorKwitansi: payment.nomorKwitansi || '',
        tanggalKwitansi: payment.tanggalKwitansi ? formatDateInput(payment.tanggalKwitansi) : formatDateInput(new Date()),
        tanggalBayar: payment.tanggalBayar ? formatDateInput(payment.tanggalBayar) : '',
        rekening: payment.rekening || kontrakVendor?.rekening || '',
        bank: payment.bank || kontrakVendor?.bank || '',
        keterangan: payment.keterangan || ''
      })
    } else {
      setEditingPaymentId(null)
      const nextTermin = (paymentList?.length || 0) + 1
      const nilaiDefault = existingKontrak?.nilaiKontrak || 0
      const ppnDefault = calculatePpnPengadaan(nilaiDefault)
      const pphDefault = calculatePphPengadaan(nilaiDefault, selectedPaket?.jenisPengadaan)

      setPaymentData({
        ...initialPaymentData,
        terminKe: nextTermin.toString(),
        jenisPembayaran: existingKontrak?.jenisPembayaran || 'sekaligus',
        nilaiTagihan: nilaiDefault.toString(),
        ppn: ppnDefault.toString(),
        pph: pphDefault.toString(),
        rekening: kontrakVendor?.rekening || '',
        bank: kontrakVendor?.bank || ''
      })
    }
    setIsPaymentModalOpen(true)
  }

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target
    setPaymentData(prev => ({ ...prev, [name]: value }))
  }

  const handleSavePayment = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const totals = calculateTotals()

      // Get related BAST
      const terminBast = bastList?.find(b => b.terminKe === parseInt(paymentData.terminKe))

      const data = {
        contractId: existingKontrak.id,
        paketId: selectedPaket.id,
        bastId: terminBast?.id || null,
        phoId: null,
        fhoId: null,
        terminKe: parseInt(paymentData.terminKe) || 1,
        jenisPembayaran: paymentData.jenisPembayaran,
        nilaiTagihan: totals.nilaiTagihan,
        ppn: totals.ppn,
        pph: totals.pph,
        potonganDenda: totals.potonganDenda,
        potonganLain: totals.potonganLain,
        nilaiNetto: totals.nilaiNetto,
        nomorKwitansi: paymentData.nomorKwitansi,
        tanggalKwitansi: paymentData.tanggalKwitansi ? new Date(paymentData.tanggalKwitansi) : new Date(),
        tanggalBayar: paymentData.tanggalBayar ? new Date(paymentData.tanggalBayar) : null,
        rekening: paymentData.rekening,
        bank: paymentData.bank,
        status: paymentData.tanggalBayar ? STATUS_PEMBAYARAN_PENGADAAN.DIBAYAR : STATUS_PEMBAYARAN_PENGADAAN.DRAFT,
        keterangan: paymentData.keterangan,
        archivePath: selectedPaket.archivePath
      }

      if (editingPaymentId) {
        const existing = await db.procurementPayment.get(editingPaymentId)
        const updated = withAuditUpdate(data, existing?.revision || 0)
        await db.procurementPayment.update(editingPaymentId, updated)
        await recordHistory('procurementPayment', editingPaymentId, AUDIT_ACTIONS.UPDATE, existing, { ...existing, ...updated })
      } else {
        const newData = withAuditCreate(data)
        const newId = await db.procurementPayment.add(newData)
        await recordHistory('procurementPayment', newId, AUDIT_ACTIONS.CREATE, null, newData)

        // Update workflow status
        await db.procurementPackage.update(selectedPaket.id, {
          workflowStatus: WORKFLOW_STATUS_PENGADAAN.PEMBAYARAN,
          updatedAt: new Date()
        })
      }

      setIsPaymentModalOpen(false)
    } catch (error) {
      alert('Gagal menyimpan pembayaran: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsPaid = async (payment) => {
    if (!confirm('Tandai pembayaran ini sebagai sudah dibayar?')) return

    try {
      await db.procurementPayment.update(payment.id, {
        status: STATUS_PEMBAYARAN_PENGADAAN.DIBAYAR,
        tanggalBayar: new Date(),
        updatedAt: new Date()
      })
      await recordHistory('procurementPayment', payment.id, AUDIT_ACTIONS.STATUS_CHANGE, payment, { ...payment, status: STATUS_PEMBAYARAN_PENGADAAN.DIBAYAR })
    } catch (error) {
      alert('Gagal update status: ' + error.message)
    }
  }

  const handleViewPayment = (payment) => {
    setViewingPayment(payment)
    setIsViewModalOpen(true)
  }

  const getStatusBadge = (status) => {
    const variants = {
      [WORKFLOW_STATUS_PENGADAAN.SERAH_TERIMA]: 'warning',
      [WORKFLOW_STATUS_PENGADAAN.PEMBAYARAN]: 'info',
      [WORKFLOW_STATUS_PENGADAAN.SELESAI]: 'success'
    }
    return <Badge variant={variants[status] || 'default'}>{getWorkflowStatusLabel(status)}</Badge>
  }

  const getPaymentStatusBadge = (status) => {
    const variants = {
      [STATUS_PEMBAYARAN_PENGADAAN.DRAFT]: 'default',
      [STATUS_PEMBAYARAN_PENGADAAN.MENUNGGU_BAP]: 'warning',
      [STATUS_PEMBAYARAN_PENGADAAN.MENUNGGU_BAST]: 'warning',
      [STATUS_PEMBAYARAN_PENGADAAN.SIAP_BAYAR]: 'info',
      [STATUS_PEMBAYARAN_PENGADAAN.DIBAYAR]: 'success',
      [STATUS_PEMBAYARAN_PENGADAAN.BATAL]: 'danger'
    }
    const labels = {
      [STATUS_PEMBAYARAN_PENGADAAN.DRAFT]: 'Draft',
      [STATUS_PEMBAYARAN_PENGADAAN.MENUNGGU_BAP]: 'Menunggu BAP',
      [STATUS_PEMBAYARAN_PENGADAAN.MENUNGGU_BAST]: 'Menunggu BAST',
      [STATUS_PEMBAYARAN_PENGADAAN.SIAP_BAYAR]: 'Siap Bayar',
      [STATUS_PEMBAYARAN_PENGADAAN.DIBAYAR]: 'Dibayar',
      [STATUS_PEMBAYARAN_PENGADAAN.BATAL]: 'Batal'
    }
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  // Stats
  const totalNilaiKontrak = allPaket.reduce((sum, p) => sum + (p.nilaiPagu || 0), 0)

  return (
    <Layout title="Pembayaran Pengadaan">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Paket (Siap Bayar)</p>
            <p className="text-2xl font-bold">{allPaket.length}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Nilai</p>
            <p className="text-xl font-bold">{formatRupiah(totalNilaiKontrak)}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Proses Pembayaran</p>
            <p className="text-2xl font-bold">
              {allPaket.filter(p => p.workflowStatus === WORKFLOW_STATUS_PENGADAAN.PEMBAYARAN).length}
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Paket List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary-600" />
                Pilih Paket
              </CardTitle>
              <div className="mt-3 space-y-2">
                <Select
                  value={filterTahun}
                  onChange={(e) => setFilterTahun(e.target.value)}
                  options={tahunOptions}
                  placeholder="Tahun"
                />
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari paket..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0 max-h-[500px] overflow-y-auto">
              {filteredPaket.length > 0 ? (
                <div className="divide-y">
                  {filteredPaket.map(paket => (
                    <div
                      key={paket.id}
                      onClick={() => handleSelectPaket(paket)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedPaket?.id === paket.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs text-gray-500">{paket.kodePaket}</p>
                          <p className="font-medium text-sm truncate">{paket.namaPaket}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(paket.workflowStatus)}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Tidak ada paket siap bayar
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          {selectedPaket && existingKontrak ? (
            <div className="space-y-4">
              {/* Paket & Kontrak Info */}
              <Card>
                <CardBody className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm text-gray-500">{selectedPaket.kodePaket}</p>
                      <h3 className="text-lg font-bold">{selectedPaket.namaPaket}</h3>
                      <p className="text-sm text-gray-600">Kontrak: {existingKontrak.nomorKontrak}</p>
                      <p className="text-sm text-gray-600">Penyedia: {kontrakVendor?.nama}</p>
                    </div>
                    {getStatusBadge(selectedPaket.workflowStatus)}
                  </div>
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">Nilai Kontrak</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatRupiah(existingKontrak.nilaiKontrak)}
                    </p>
                  </div>
                </CardBody>
              </Card>

              {/* Payments List */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="w-5 h-5" />
                      Daftar Pembayaran
                    </CardTitle>
                    <CardDescription>
                      {paymentList?.length || 0} pembayaran tercatat
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => handleOpenPaymentModal()} icon={Plus}>
                    Tambah Pembayaran
                  </Button>
                </CardHeader>
                <CardBody className="pt-0">
                  {paymentList && paymentList.length > 0 ? (
                    <div className="space-y-3">
                      {paymentList.map(payment => (
                        <div key={payment.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Termin {payment.terminKe}</span>
                                {getPaymentStatusBadge(payment.status)}
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {payment.nomorKwitansi} - {formatTanggal(payment.tanggalKwitansi)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">
                                {formatRupiah(payment.nilaiNetto)}
                              </p>
                              <p className="text-xs text-gray-500">Nilai Netto</p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              <span>Tagihan: {formatRupiah(payment.nilaiTagihan)}</span>
                              <span className="mx-2">|</span>
                              <span>PPN: {formatRupiah(payment.ppn)}</span>
                              <span className="mx-2">|</span>
                              <span>PPh: {formatRupiah(payment.pph)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewPayment(payment)}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                                title="Lihat Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenPaymentModal(payment)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              {payment.status !== STATUS_PEMBAYARAN_PENGADAAN.DIBAYAR && (
                                <button
                                  onClick={() => handleMarkAsPaid(payment)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                  title="Tandai Dibayar"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">Belum ada pembayaran</p>
                  )}

                  {/* Summary */}
                  {paymentList && paymentList.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Ringkasan Pembayaran</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Total Dibayar</p>
                          <p className="font-bold text-green-600">
                            {formatRupiah(paymentList
                              .filter(p => p.status === STATUS_PEMBAYARAN_PENGADAAN.DIBAYAR)
                              .reduce((sum, p) => sum + (p.nilaiNetto || 0), 0)
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Sisa Kontrak</p>
                          <p className="font-bold text-blue-600">
                            {formatRupiah(
                              existingKontrak.nilaiKontrak -
                              paymentList.reduce((sum, p) => sum + (p.nilaiTagihan || 0), 0)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          ) : selectedPaket && !existingKontrak ? (
            <Card>
              <CardBody className="p-8 text-center text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-400" />
                <p>Paket ini belum memiliki kontrak</p>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Pilih paket pengadaan dari daftar untuk mengelola pembayaran</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={editingPaymentId ? 'Edit Pembayaran' : 'Buat Pembayaran'}
        size="lg"
      >
        <form onSubmit={handleSavePayment}>
          <div className="space-y-4">
            {/* Termin & Kwitansi */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Termin Ke"
                name="terminKe"
                type="number"
                value={paymentData.terminKe}
                onChange={handlePaymentInputChange}
                min="1"
                required
              />
              <Input
                label="Nomor Kwitansi"
                name="nomorKwitansi"
                value={paymentData.nomorKwitansi}
                onChange={handlePaymentInputChange}
                placeholder="KWT/001/2024"
                required
              />
            </div>

            <Input
              label="Tanggal Kwitansi"
              name="tanggalKwitansi"
              type="date"
              value={paymentData.tanggalKwitansi}
              onChange={handlePaymentInputChange}
              required
            />

            {/* Nilai */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Nilai Pembayaran</h4>
              <CurrencyInput
                label="Nilai Tagihan (DPP)"
                name="nilaiTagihan"
                value={paymentData.nilaiTagihan}
                onChange={handleNilaiTagihanChange}
                required
              />
              <div className="grid grid-cols-2 gap-4 mt-3">
                <CurrencyInput
                  label="PPN (11%)"
                  name="ppn"
                  value={paymentData.ppn}
                  onChange={handlePaymentInputChange}
                />
                <CurrencyInput
                  label="PPh"
                  name="pph"
                  value={paymentData.pph}
                  onChange={handlePaymentInputChange}
                />
              </div>
            </div>

            {/* Potongan */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Potongan</h4>
              <div className="grid grid-cols-2 gap-4">
                <CurrencyInput
                  label="Denda Keterlambatan"
                  name="potonganDenda"
                  value={paymentData.potonganDenda}
                  onChange={handlePaymentInputChange}
                />
                <CurrencyInput
                  label="Potongan Lain"
                  name="potonganLain"
                  value={paymentData.potonganLain}
                  onChange={handlePaymentInputChange}
                />
              </div>
            </div>

            {/* Total */}
            <div className="p-4 bg-green-50 rounded-lg">
              {(() => {
                const totals = calculateTotals()
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Nilai Tagihan (DPP)</span>
                      <span>{formatRupiah(totals.nilaiTagihan)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>PPN</span>
                      <span>+ {formatRupiah(totals.ppn)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Total Potongan</span>
                      <span>- {formatRupiah(totals.totalPotongan)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Nilai Netto</span>
                      <span className="text-green-600">{formatRupiah(totals.nilaiNetto)}</span>
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Rekening */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Rekening Pembayaran</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nomor Rekening"
                  name="rekening"
                  value={paymentData.rekening}
                  onChange={handlePaymentInputChange}
                  required
                />
                <Select
                  label="Bank"
                  name="bank"
                  value={paymentData.bank}
                  onChange={handlePaymentInputChange}
                  options={bankOptions}
                  required
                />
              </div>
            </div>

            {/* Tanggal Bayar */}
            <Input
              label="Tanggal Bayar (isi jika sudah dibayar)"
              name="tanggalBayar"
              type="date"
              value={paymentData.tanggalBayar}
              onChange={handlePaymentInputChange}
            />

            <Textarea
              label="Keterangan"
              name="keterangan"
              value={paymentData.keterangan}
              onChange={handlePaymentInputChange}
              rows={2}
            />
          </div>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={loading} icon={Save}>
              Simpan
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Payment Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail Pembayaran"
        size="md"
      >
        {viewingPayment && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Termin {viewingPayment.terminKe}</p>
                <p className="font-bold">{viewingPayment.nomorKwitansi}</p>
              </div>
              {getPaymentStatusBadge(viewingPayment.status)}
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">Nilai Netto (Yang Dibayarkan)</p>
              <p className="text-2xl font-bold text-green-600">{formatRupiah(viewingPayment.nilaiNetto)}</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nilai Tagihan (DPP)</span>
                <span>{formatRupiah(viewingPayment.nilaiTagihan)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">PPN</span>
                <span>+ {formatRupiah(viewingPayment.ppn)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>PPh</span>
                <span>- {formatRupiah(viewingPayment.pph)}</span>
              </div>
              {viewingPayment.potonganDenda > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Denda</span>
                  <span>- {formatRupiah(viewingPayment.potonganDenda)}</span>
                </div>
              )}
            </div>

            <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Tanggal Kwitansi</p>
                <p>{formatTanggal(viewingPayment.tanggalKwitansi)}</p>
              </div>
              <div>
                <p className="text-gray-500">Tanggal Bayar</p>
                <p>{viewingPayment.tanggalBayar ? formatTanggal(viewingPayment.tanggalBayar) : '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Rekening</p>
                <p className="font-mono">{viewingPayment.rekening}</p>
              </div>
              <div>
                <p className="text-gray-500">Bank</p>
                <p>{viewingPayment.bank}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}
