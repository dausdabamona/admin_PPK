import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Search, CheckSquare, Package, ChevronRight, Save, CheckCircle, XCircle,
  AlertTriangle, FileCheck, Lock, Unlock
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, {
  WORKFLOW_STATUS_PENGADAAN,
  STATUS_BMN,
  getWorkflowStatusLabel,
  getChecklistPengadaan,
  withAuditCreate,
  withAuditUpdate,
  recordHistory,
  AUDIT_ACTIONS
} from '../../db/database'
import { formatDateInput, formatTanggal } from '../../utils/formatters'

export default function PengadaanChecklist() {
  const [selectedPaket, setSelectedPaket] = useState(null)
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false)
  const [checklistItems, setChecklistItems] = useState([])
  const [checklistMeta, setChecklistMeta] = useState({
    namaPemeriksa: '',
    tanggalPemeriksaan: formatDateInput(new Date()),
    catatan: ''
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(false)

  // Fetch paket data (with kontrak)
  const allPaket = useLiveQuery(() =>
    db.procurementPackage
      .where('workflowStatus')
      .anyOf([
        WORKFLOW_STATUS_PENGADAAN.KONTRAK,
        WORKFLOW_STATUS_PENGADAAN.PELAKSANAAN,
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

  // Fetch existing checklist for selected paket
  const existingChecklist = useLiveQuery(
    () => selectedPaket ? db.procurementChecklist.where('paketId').equals(selectedPaket.id).first() : null,
    [selectedPaket]
  )

  // Fetch BAST from penyedia for selected paket (for Barang workflow lock)
  const existingBast = useLiveQuery(
    () => selectedPaket ? db.procurementBast.where('paketId').equals(selectedPaket.id).first() : null,
    [selectedPaket]
  )

  // Fetch BAST KPA for selected paket (for Barang workflow lock)
  const existingBastKpa = useLiveQuery(
    () => selectedPaket ? db.procurementBastToKpa.where('paketId').equals(selectedPaket.id).first() : null,
    [selectedPaket]
  )

  // Check if it's a Barang package (needs BAST workflow)
  const isBarangPackage = selectedPaket?.jenisPengadaan === 'barang'

  // Check BAST workflow requirements for Barang packages
  const bastWorkflowStatus = useMemo(() => {
    if (!isBarangPackage) return { complete: true, missing: [] }

    const missing = []
    if (!existingBast) missing.push('BAST Penyedia → PPK')
    if (!existingBastKpa) missing.push('BAST PPK → KPA')
    if (existingBastKpa && existingBastKpa.statusBmn !== STATUS_BMN.SIAP_DICATAT && existingBastKpa.statusBmn !== STATUS_BMN.SUDAH_DICATAT) {
      missing.push('Status BMN belum valid')
    }

    return {
      complete: missing.length === 0,
      missing,
      hasBast: !!existingBast,
      hasBastKpa: !!existingBastKpa,
      bmnReady: existingBastKpa?.statusBmn === STATUS_BMN.SIAP_DICATAT || existingBastKpa?.statusBmn === STATUS_BMN.SUDAH_DICATAT
    }
  }, [isBarangPackage, existingBast, existingBastKpa])

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

  const handleSelectPaket = (paket) => {
    setSelectedPaket(paket)
  }

  const handleOpenChecklistModal = () => {
    const template = getChecklistPengadaan(selectedPaket?.jenisPengadaan)

    if (existingChecklist?.items) {
      // Load existing checklist items
      const existingItems = JSON.parse(existingChecklist.items)
      const mergedItems = template.map(item => {
        const existing = existingItems.find(e => e.id === item.id)
        return {
          ...item,
          checked: existing?.checked || false,
          catatan: existing?.catatan || ''
        }
      })
      setChecklistItems(mergedItems)
      setChecklistMeta({
        namaPemeriksa: existingChecklist.namaPemeriksa || '',
        tanggalPemeriksaan: formatDateInput(existingChecklist.tanggalPemeriksaan),
        catatan: existingChecklist.catatan || ''
      })
    } else {
      // New checklist
      setChecklistItems(template.map(item => ({
        ...item,
        checked: false,
        catatan: ''
      })))
      setChecklistMeta({
        namaPemeriksa: '',
        tanggalPemeriksaan: formatDateInput(new Date()),
        catatan: ''
      })
    }

    setIsChecklistModalOpen(true)
  }

  const handleItemCheck = (index, checked) => {
    setChecklistItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], checked }
      return updated
    })
  }

  const handleItemCatatan = (index, catatan) => {
    setChecklistItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], catatan }
      return updated
    })
  }

  const handleSaveChecklist = async () => {
    setLoading(true)

    try {
      const itemLengkap = checklistItems.filter(item => item.checked).length
      const totalItem = checklistItems.length

      // Check BAST workflow for Barang packages before allowing "lengkap" status
      let statusKelengkapan
      if (itemLengkap === totalItem) {
        // For Barang packages, verify BAST workflow is complete
        if (isBarangPackage && !bastWorkflowStatus.complete) {
          alert(`Tidak dapat menyelesaikan checklist untuk paket Barang.\n\nDokumen yang masih kurang:\n- ${bastWorkflowStatus.missing.join('\n- ')}\n\nSilakan lengkapi BAST di menu Serah Terima terlebih dahulu.`)
          setLoading(false)
          return
        }
        statusKelengkapan = 'lengkap'
      } else if (itemLengkap >= totalItem * 0.8) {
        statusKelengkapan = 'hampir_lengkap'
      } else {
        statusKelengkapan = 'belum_lengkap'
      }

      const data = {
        paketId: selectedPaket.id,
        contractId: existingKontrak?.id,
        paymentId: null,
        terminKe: 1,
        items: JSON.stringify(checklistItems),
        statusKelengkapan,
        totalItem,
        itemLengkap,
        namaPemeriksa: checklistMeta.namaPemeriksa,
        tanggalPemeriksaan: new Date(checklistMeta.tanggalPemeriksaan),
        catatan: checklistMeta.catatan
      }

      if (existingChecklist) {
        const updated = withAuditUpdate(data, existingChecklist.revision || 0)
        await db.procurementChecklist.update(existingChecklist.id, updated)
        await recordHistory('procurementChecklist', existingChecklist.id, AUDIT_ACTIONS.UPDATE, existingChecklist, { ...existingChecklist, ...updated })
      } else {
        const newData = withAuditCreate(data)
        const newId = await db.procurementChecklist.add(newData)
        await recordHistory('procurementChecklist', newId, AUDIT_ACTIONS.CREATE, null, newData)
      }

      setIsChecklistModalOpen(false)
    } catch (error) {
      alert('Gagal menyimpan checklist: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      [WORKFLOW_STATUS_PENGADAAN.KONTRAK]: 'primary',
      [WORKFLOW_STATUS_PENGADAAN.PELAKSANAAN]: 'info',
      [WORKFLOW_STATUS_PENGADAAN.SERAH_TERIMA]: 'warning',
      [WORKFLOW_STATUS_PENGADAAN.PEMBAYARAN]: 'success',
      [WORKFLOW_STATUS_PENGADAAN.SELESAI]: 'success'
    }
    return <Badge variant={variants[status] || 'default'}>{getWorkflowStatusLabel(status)}</Badge>
  }

  const getChecklistStatusBadge = (status) => {
    const variants = {
      lengkap: 'success',
      hampir_lengkap: 'warning',
      belum_lengkap: 'danger'
    }
    const labels = {
      lengkap: 'Lengkap',
      hampir_lengkap: 'Hampir Lengkap',
      belum_lengkap: 'Belum Lengkap'
    }
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  // Calculate checklist progress
  const checklistProgress = useMemo(() => {
    if (!existingChecklist) return null
    const percentage = existingChecklist.totalItem > 0
      ? Math.round((existingChecklist.itemLengkap / existingChecklist.totalItem) * 100)
      : 0
    return {
      itemLengkap: existingChecklist.itemLengkap,
      totalItem: existingChecklist.totalItem,
      percentage,
      status: existingChecklist.statusKelengkapan
    }
  }, [existingChecklist])

  // Check if payment is locked (checklist not complete)
  const isPaymentLocked = !existingChecklist || existingChecklist.statusKelengkapan !== 'lengkap'

  // Stats
  const totalLengkap = allPaket.filter(p => {
    // Would need to join with checklist - simplified here
    return false
  }).length

  return (
    <Layout title="Checklist SPJ Pengadaan">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total Paket</p>
            <p className="text-2xl font-bold">{allPaket.length}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Checklist Lengkap</p>
            <p className="text-2xl font-bold">-</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Belum Lengkap</p>
            <p className="text-2xl font-bold">-</p>
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
                  Tidak ada paket
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          {selectedPaket ? (
            <div className="space-y-4">
              {/* Paket Info */}
              <Card>
                <CardBody className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm text-gray-500">{selectedPaket.kodePaket}</p>
                      <h3 className="text-lg font-bold">{selectedPaket.namaPaket}</h3>
                      <p className="text-sm text-gray-600">
                        Jenis: {selectedPaket.jenisPengadaan?.replace('_', ' ')}
                      </p>
                    </div>
                    {getStatusBadge(selectedPaket.workflowStatus)}
                  </div>
                </CardBody>
              </Card>

              {/* Checklist Status */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckSquare className="w-5 h-5" />
                      Checklist SPJ
                    </CardTitle>
                    <CardDescription>
                      Kepmen KP No.56 Tahun 2024
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={handleOpenChecklistModal}>
                    {existingChecklist ? 'Edit Checklist' : 'Isi Checklist'}
                  </Button>
                </CardHeader>
                <CardBody className="pt-0">
                  {checklistProgress ? (
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Kelengkapan Dokumen</span>
                          <span className="text-sm font-medium">
                            {checklistProgress.itemLengkap}/{checklistProgress.totalItem} ({checklistProgress.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              checklistProgress.percentage === 100 ? 'bg-green-500' :
                              checklistProgress.percentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${checklistProgress.percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {checklistProgress.status === 'lengkap' ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-6 h-6 text-yellow-500" />
                          )}
                          <div>
                            <p className="font-medium">Status Checklist</p>
                            {getChecklistStatusBadge(checklistProgress.status)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isPaymentLocked ? (
                            <div className="flex items-center gap-1 text-red-600 text-sm">
                              <Lock className="w-4 h-4" />
                              <span>Pembayaran Terkunci</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-green-600 text-sm">
                              <Unlock className="w-4 h-4" />
                              <span>Siap Bayar</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Pemeriksa</p>
                          <p className="font-medium">{existingChecklist.namaPemeriksa || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tanggal Pemeriksaan</p>
                          <p className="font-medium">
                            {existingChecklist.tanggalPemeriksaan
                              ? formatTanggal(existingChecklist.tanggalPemeriksaan)
                              : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Belum ada checklist. Klik tombol di atas untuk mengisi.</p>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* BAST Workflow Status for Barang packages */}
              {isBarangPackage && (
                <Card className={bastWorkflowStatus.complete ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
                  <CardBody className="p-4">
                    <div className="flex items-start gap-3">
                      {bastWorkflowStatus.complete ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className={`font-medium ${bastWorkflowStatus.complete ? 'text-green-800' : 'text-amber-800'}`}>
                          Workflow BAST Pengadaan Barang
                        </p>
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center gap-2 text-sm">
                            {bastWorkflowStatus.hasBast ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={bastWorkflowStatus.hasBast ? 'text-green-700' : 'text-red-700'}>
                              BAST Penyedia → PPK
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            {bastWorkflowStatus.hasBastKpa ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={bastWorkflowStatus.hasBastKpa ? 'text-green-700' : 'text-red-700'}>
                              BAST PPK → KPA/Unit Pengguna
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            {bastWorkflowStatus.bmnReady ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={bastWorkflowStatus.bmnReady ? 'text-green-700' : 'text-red-700'}>
                              BMN Siap Dicatat ke SIMAK
                            </span>
                          </div>
                        </div>
                        {!bastWorkflowStatus.complete && (
                          <p className="text-xs text-amber-600 mt-2">
                            Lengkapi semua BAST di menu Serah Terima sebelum checklist dapat diselesaikan
                          </p>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Payment Lock Warning */}
              {isPaymentLocked && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardBody className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Pembayaran Terkunci</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Checklist SPJ belum lengkap. Lengkapi semua dokumen wajib sebelum dapat melakukan pembayaran.
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardBody className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Pilih paket pengadaan untuk melihat atau mengisi checklist SPJ</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Checklist Modal */}
      <Modal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        title="Checklist SPJ Pengadaan"
        size="xl"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b">
            <Input
              label="Nama Pemeriksa"
              value={checklistMeta.namaPemeriksa}
              onChange={(e) => setChecklistMeta(prev => ({ ...prev, namaPemeriksa: e.target.value }))}
              required
            />
            <Input
              label="Tanggal Pemeriksaan"
              type="date"
              value={checklistMeta.tanggalPemeriksaan}
              onChange={(e) => setChecklistMeta(prev => ({ ...prev, tanggalPemeriksaan: e.target.value }))}
              required
            />
          </div>

          {/* Checklist Items */}
          <div className="space-y-2">
            {checklistItems.map((item, index) => (
              <div
                key={item.id}
                className={`p-3 border rounded-lg ${item.checked ? 'bg-green-50 border-green-200' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`item-${item.id}`}
                    checked={item.checked}
                    onChange={(e) => handleItemCheck(index, e.target.checked)}
                    className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <label htmlFor={`item-${item.id}`} className="font-medium cursor-pointer">
                      {item.nama}
                      {item.wajib && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {!item.checked && item.wajib && (
                      <p className="text-xs text-red-500 mt-1">Dokumen wajib</p>
                    )}
                    <input
                      type="text"
                      placeholder="Catatan (opsional)"
                      value={item.catatan}
                      onChange={(e) => handleItemCatatan(index, e.target.value)}
                      className="input mt-2 text-sm"
                    />
                  </div>
                  {item.checked ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-300" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Kelengkapan</span>
              <span className="font-bold">
                {checklistItems.filter(i => i.checked).length} / {checklistItems.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${
                  checklistItems.every(i => i.checked) ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{
                  width: `${(checklistItems.filter(i => i.checked).length / checklistItems.length) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Catatan Umum */}
          <Textarea
            label="Catatan Umum"
            value={checklistMeta.catatan}
            onChange={(e) => setChecklistMeta(prev => ({ ...prev, catatan: e.target.value }))}
            rows={2}
          />
        </div>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={() => setIsChecklistModalOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSaveChecklist} loading={loading} icon={Save}>
            Simpan Checklist
          </Button>
        </ModalFooter>
      </Modal>
    </Layout>
  )
}
