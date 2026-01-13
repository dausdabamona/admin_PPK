import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Search, Eye, Package, ChevronRight, Save,
  FileCheck, CheckCircle2, Clock, AlertTriangle, FileSignature,
  Archive, Printer, Building2
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, {
  JENIS_PENGADAAN,
  WORKFLOW_STATUS_PENGADAAN,
  STATUS_BAST_KPA,
  STATUS_BMN,
  getWorkflowStatusLabel,
  withAuditCreate,
  withAuditUpdate,
  recordHistory,
  AUDIT_ACTIONS
} from '../../db/database'
import { formatRupiah, formatDateInput, formatTanggal } from '../../utils/formatters'

// Initial form data for BAST KPA
const initialBastKpaData = {
  nomorBast: '',
  tanggalBast: formatDateInput(new Date()),
  jenisBarang: '',
  uraianBarang: '',
  jumlah: '',
  satuan: 'unit',
  nilai: '',
  lokasiPenempatan: '',
  unitPengguna: '',
  namaKpa: '',
  nipKpa: '',
  namaPpk: '',
  nipPpk: '',
  namaPengurusBarang: '',
  nipPengurusBarang: '',
  statusBmn: STATUS_BMN.SIAP_DICATAT,
  status: STATUS_BAST_KPA.DRAFT
}

export default function PengadaanBastKpa() {
  const [selectedPaket, setSelectedPaket] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [bastKpaData, setBastKpaData] = useState(initialBastKpaData)
  const [editingId, setEditingId] = useState(null)
  const [viewingData, setViewingData] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(false)

  // Fetch paket data (only Barang type with BAST from penyedia)
  const allPaket = useLiveQuery(() =>
    db.procurementPackage
      .where('jenisPengadaan')
      .equals('barang')
      .filter(p => [
        WORKFLOW_STATUS_PENGADAAN.SERAH_TERIMA,
        WORKFLOW_STATUS_PENGADAAN.PEMBAYARAN,
        WORKFLOW_STATUS_PENGADAAN.SELESAI
      ].includes(p.workflowStatus))
      .reverse()
      .toArray()
  ) || []

  // Fetch BAST from penyedia for selected paket
  const existingBast = useLiveQuery(
    () => selectedPaket ? db.procurementBast.where('paketId').equals(selectedPaket.id).first() : null,
    [selectedPaket]
  )

  // Fetch existing BAST KPA for selected paket
  const bastKpaList = useLiveQuery(
    () => selectedPaket ? db.procurementBastToKpa.where('paketId').equals(selectedPaket.id).toArray() : [],
    [selectedPaket]
  )

  // Fetch pejabat for dropdowns
  const allPejabat = useLiveQuery(() => db.pejabat.toArray()) || []

  const kpaList = allPejabat.filter(p => p.jenisPejabat === 'kpa')
  const ppkList = allPejabat.filter(p => p.jenisPejabat === 'ppk')

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

  const satuanOptions = [
    { value: 'unit', label: 'Unit' },
    { value: 'set', label: 'Set' },
    { value: 'paket', label: 'Paket' },
    { value: 'buah', label: 'Buah' },
    { value: 'pcs', label: 'Pcs' },
    { value: 'lembar', label: 'Lembar' },
    { value: 'rim', label: 'Rim' },
    { value: 'box', label: 'Box' },
    { value: 'dus', label: 'Dus' },
    { value: 'kg', label: 'Kg' },
    { value: 'liter', label: 'Liter' }
  ]

  const statusBmnOptions = [
    { value: STATUS_BMN.SIAP_DICATAT, label: 'Siap Dicatat ke SIMAK' },
    { value: STATUS_BMN.SUDAH_DICATAT, label: 'Sudah Dicatat ke SIMAK' }
  ]

  const handleSelectPaket = (paket) => {
    setSelectedPaket(paket)
  }

  const handleOpenModal = (bastKpa = null) => {
    if (bastKpa) {
      setEditingId(bastKpa.id)
      setBastKpaData({
        nomorBast: bastKpa.nomorBast || '',
        tanggalBast: formatDateInput(bastKpa.tanggalBast),
        jenisBarang: bastKpa.jenisBarang || '',
        uraianBarang: bastKpa.uraianBarang || '',
        jumlah: bastKpa.jumlah?.toString() || '',
        satuan: bastKpa.satuan || 'unit',
        nilai: bastKpa.nilai?.toString() || '',
        lokasiPenempatan: bastKpa.lokasiPenempatan || '',
        unitPengguna: bastKpa.unitPengguna || '',
        namaKpa: bastKpa.namaKpa || '',
        nipKpa: bastKpa.nipKpa || '',
        namaPpk: bastKpa.namaPpk || '',
        nipPpk: bastKpa.nipPpk || '',
        namaPengurusBarang: bastKpa.namaPengurusBarang || '',
        nipPengurusBarang: bastKpa.nipPengurusBarang || '',
        statusBmn: bastKpa.statusBmn || STATUS_BMN.SIAP_DICATAT,
        status: bastKpa.status || STATUS_BAST_KPA.DRAFT
      })
    } else {
      setEditingId(null)
      // Auto-fill from BAST penyedia
      setBastKpaData({
        ...initialBastKpaData,
        jenisBarang: selectedPaket?.namaPaket || '',
        uraianBarang: selectedPaket?.namaPaket || '',
        nilai: existingBast?.nilaiSerahTerima?.toString() || ''
      })
    }
    setIsModalOpen(true)
  }

  const handleView = (bastKpa) => {
    setViewingData(bastKpa)
    setIsViewModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!existingBast) {
      alert('BAST dari Penyedia belum ada. Buat BAST Penyedia → PPK terlebih dahulu.')
      return
    }

    setLoading(true)
    try {
      const archivePath = `ARSIP/${selectedPaket.tahun}/PENGADAAN/${selectedPaket.kodePaket}/BAST_KPA/`

      const data = {
        paketId: selectedPaket.id,
        bastId: existingBast.id,
        nomorBast: bastKpaData.nomorBast,
        tanggalBast: new Date(bastKpaData.tanggalBast),
        jenisBarang: bastKpaData.jenisBarang,
        uraianBarang: bastKpaData.uraianBarang,
        jumlah: parseInt(bastKpaData.jumlah) || 1,
        satuan: bastKpaData.satuan,
        nilai: parseInt(bastKpaData.nilai) || 0,
        lokasiPenempatan: bastKpaData.lokasiPenempatan,
        unitPengguna: bastKpaData.unitPengguna,
        namaKpa: bastKpaData.namaKpa,
        nipKpa: bastKpaData.nipKpa,
        namaPpk: bastKpaData.namaPpk,
        nipPpk: bastKpaData.nipPpk,
        namaPengurusBarang: bastKpaData.namaPengurusBarang,
        nipPengurusBarang: bastKpaData.nipPengurusBarang,
        statusBmn: bastKpaData.statusBmn,
        status: bastKpaData.status,
        archivePath
      }

      if (editingId) {
        const existing = await db.procurementBastToKpa.get(editingId)
        const updated = withAuditUpdate(data, existing?.revision || 0)
        await db.procurementBastToKpa.update(editingId, updated)
        await recordHistory('procurementBastToKpa', editingId, AUDIT_ACTIONS.UPDATE, existing, { ...existing, ...updated })
      } else {
        const newData = withAuditCreate(data)
        const newId = await db.procurementBastToKpa.add(newData)
        await recordHistory('procurementBastToKpa', newId, AUDIT_ACTIONS.CREATE, null, newData)
      }

      setIsModalOpen(false)
      setBastKpaData(initialBastKpaData)
    } catch (error) {
      alert('Gagal menyimpan BAST KPA: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (bastKpa, newStatus) => {
    try {
      const updated = withAuditUpdate({ status: newStatus }, bastKpa.revision || 0)
      await db.procurementBastToKpa.update(bastKpa.id, updated)
      await recordHistory('procurementBastToKpa', bastKpa.id, AUDIT_ACTIONS.UPDATE, bastKpa, { ...bastKpa, ...updated })
    } catch (error) {
      alert('Gagal mengubah status: ' + error.message)
    }
  }

  const handleUpdateBmnStatus = async (bastKpa, newStatus) => {
    try {
      const updated = withAuditUpdate({ statusBmn: newStatus }, bastKpa.revision || 0)
      await db.procurementBastToKpa.update(bastKpa.id, updated)
      await recordHistory('procurementBastToKpa', bastKpa.id, AUDIT_ACTIONS.UPDATE, bastKpa, { ...bastKpa, ...updated })
    } catch (error) {
      alert('Gagal mengubah status BMN: ' + error.message)
    }
  }

  const handleSelectPejabat = (field, pejabat) => {
    if (field === 'kpa') {
      setBastKpaData(prev => ({
        ...prev,
        namaKpa: pejabat.nama,
        nipKpa: pejabat.nip
      }))
    } else if (field === 'ppk') {
      setBastKpaData(prev => ({
        ...prev,
        namaPpk: pejabat.nama,
        nipPpk: pejabat.nip
      }))
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      [STATUS_BAST_KPA.DRAFT]: 'default',
      [STATUS_BAST_KPA.FINAL]: 'success',
      [STATUS_BAST_KPA.ARSIP]: 'info'
    }
    const labels = {
      [STATUS_BAST_KPA.DRAFT]: 'Draft',
      [STATUS_BAST_KPA.FINAL]: 'Final',
      [STATUS_BAST_KPA.ARSIP]: 'Arsip'
    }
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  const getBmnStatusBadge = (status) => {
    const variants = {
      [STATUS_BMN.SIAP_DICATAT]: 'warning',
      [STATUS_BMN.SUDAH_DICATAT]: 'success'
    }
    const labels = {
      [STATUS_BMN.SIAP_DICATAT]: 'Siap Dicatat',
      [STATUS_BMN.SUDAH_DICATAT]: 'Sudah Dicatat'
    }
    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>
  }

  // Stats
  const totalBastKpa = bastKpaList?.length || 0
  const totalDraft = bastKpaList?.filter(b => b.status === STATUS_BAST_KPA.DRAFT).length || 0
  const totalFinal = bastKpaList?.filter(b => b.status === STATUS_BAST_KPA.FINAL).length || 0

  return (
    <Layout title="BAST PPK ke KPA">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Paket Barang (Siap BAST KPA)</p>
            <p className="text-2xl font-bold">{allPaket.length}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">BAST KPA Draft</p>
            <p className="text-2xl font-bold">{totalDraft}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">BAST KPA Final</p>
            <p className="text-2xl font-bold">{totalFinal}</p>
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
                Pilih Paket Barang
              </CardTitle>
              <CardDescription>
                Paket pengadaan barang yang sudah ada BAST
              </CardDescription>
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
                            <Badge variant="info">Barang</Badge>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Tidak ada paket barang dengan BAST
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
                      {existingBast && (
                        <p className="text-sm text-gray-600">
                          BAST Penyedia: {existingBast.nomorBast} ({formatTanggal(existingBast.tanggalBast)})
                        </p>
                      )}
                    </div>
                    <Badge variant="info">Barang</Badge>
                  </div>
                  {existingBast && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-medium">BAST Penyedia → PPK sudah ada</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Nilai: {formatRupiah(existingBast.nilaiSerahTerima)}
                      </p>
                    </div>
                  )}
                  {!existingBast && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">BAST Penyedia → PPK belum ada</span>
                      </div>
                      <p className="text-sm text-amber-600 mt-1">
                        Buat BAST di menu Serah Terima terlebih dahulu
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* BAST KPA List */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary-600" />
                      BAST PPK → KPA/Unit Pengguna
                    </CardTitle>
                    <CardDescription>
                      Berita Acara Serah Terima untuk pencatatan BMN
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleOpenModal()}
                    icon={Plus}
                    disabled={!existingBast}
                  >
                    Buat BAST KPA
                  </Button>
                </CardHeader>
                <CardBody className="pt-0">
                  {bastKpaList && bastKpaList.length > 0 ? (
                    <div className="space-y-3">
                      {bastKpaList.map(bastKpa => (
                        <div key={bastKpa.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{bastKpa.nomorBast}</p>
                              <p className="text-sm text-gray-500">
                                {formatTanggal(bastKpa.tanggalBast)}
                              </p>
                              <p className="text-sm mt-1">{bastKpa.uraianBarang}</p>
                              <p className="text-sm text-gray-600">
                                {bastKpa.jumlah} {bastKpa.satuan} - {formatRupiah(bastKpa.nilai)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Lokasi: {bastKpa.lokasiPenempatan || '-'}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(bastKpa.status)}
                                {getBmnStatusBadge(bastKpa.statusBmn)}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleView(bastKpa)}
                                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                                  title="Lihat"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenModal(bastKpa)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Edit"
                                  disabled={bastKpa.status === STATUS_BAST_KPA.ARSIP}
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                  title="Cetak PDF"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">
                            {bastKpa.status === STATUS_BAST_KPA.DRAFT && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleUpdateStatus(bastKpa, STATUS_BAST_KPA.FINAL)}
                              >
                                Finalkan
                              </Button>
                            )}
                            {bastKpa.status === STATUS_BAST_KPA.FINAL && (
                              <Button
                                size="sm"
                                variant="secondary"
                                icon={Archive}
                                onClick={() => handleUpdateStatus(bastKpa, STATUS_BAST_KPA.ARSIP)}
                              >
                                Simpan Arsip
                              </Button>
                            )}
                            {bastKpa.statusBmn === STATUS_BMN.SIAP_DICATAT && bastKpa.status === STATUS_BAST_KPA.FINAL && (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleUpdateBmnStatus(bastKpa, STATUS_BMN.SUDAH_DICATAT)}
                              >
                                Tandai Sudah Dicatat SIMAK
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileSignature className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Belum ada BAST PPK → KPA</p>
                      {existingBast && (
                        <p className="text-sm mt-1">Klik tombol "Buat BAST KPA" untuk membuat</p>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          ) : (
            <Card>
              <CardBody className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Pilih paket pengadaan barang dari daftar untuk mengelola BAST KPA</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit BAST PPK ke KPA' : 'Buat BAST PPK ke KPA'}
        size="lg"
      >
        <form onSubmit={handleSave}>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Nomor dan Tanggal */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nomor BAST"
                name="nomorBast"
                value={bastKpaData.nomorBast}
                onChange={(e) => setBastKpaData(prev => ({ ...prev, nomorBast: e.target.value }))}
                placeholder="BAST-KPA/001/2024"
                required
              />
              <Input
                label="Tanggal BAST"
                name="tanggalBast"
                type="date"
                value={bastKpaData.tanggalBast}
                onChange={(e) => setBastKpaData(prev => ({ ...prev, tanggalBast: e.target.value }))}
                required
              />
            </div>

            {/* Informasi Barang */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Informasi Barang</h4>
              <div className="space-y-3">
                <Input
                  label="Jenis Barang"
                  name="jenisBarang"
                  value={bastKpaData.jenisBarang}
                  onChange={(e) => setBastKpaData(prev => ({ ...prev, jenisBarang: e.target.value }))}
                  placeholder="Peralatan Komputer"
                  required
                />
                <Textarea
                  label="Uraian Barang"
                  name="uraianBarang"
                  value={bastKpaData.uraianBarang}
                  onChange={(e) => setBastKpaData(prev => ({ ...prev, uraianBarang: e.target.value }))}
                  rows={2}
                  required
                />
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Jumlah"
                    name="jumlah"
                    type="number"
                    value={bastKpaData.jumlah}
                    onChange={(e) => setBastKpaData(prev => ({ ...prev, jumlah: e.target.value }))}
                    min="1"
                    required
                  />
                  <Select
                    label="Satuan"
                    name="satuan"
                    value={bastKpaData.satuan}
                    onChange={(e) => setBastKpaData(prev => ({ ...prev, satuan: e.target.value }))}
                    options={satuanOptions}
                  />
                  <Input
                    label="Nilai (Rp)"
                    name="nilai"
                    type="number"
                    value={bastKpaData.nilai}
                    onChange={(e) => setBastKpaData(prev => ({ ...prev, nilai: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Lokasi dan Unit Pengguna */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Penempatan Barang</h4>
              <div className="space-y-3">
                <Input
                  label="Lokasi Penempatan"
                  name="lokasiPenempatan"
                  value={bastKpaData.lokasiPenempatan}
                  onChange={(e) => setBastKpaData(prev => ({ ...prev, lokasiPenempatan: e.target.value }))}
                  placeholder="Ruang Server Lt. 2"
                  required
                />
                <Input
                  label="Unit Pengguna"
                  name="unitPengguna"
                  value={bastKpaData.unitPengguna}
                  onChange={(e) => setBastKpaData(prev => ({ ...prev, unitPengguna: e.target.value }))}
                  placeholder="Bagian Tata Usaha"
                  required
                />
              </div>
            </div>

            {/* Pejabat KPA */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700 mb-3">Kuasa Pengguna Anggaran (KPA)</h4>
              <div className="space-y-3">
                {kpaList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {kpaList.map(kpa => (
                      <button
                        key={kpa.id}
                        type="button"
                        onClick={() => handleSelectPejabat('kpa', kpa)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        {kpa.nama}
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Nama KPA"
                    name="namaKpa"
                    value={bastKpaData.namaKpa}
                    onChange={(e) => setBastKpaData(prev => ({ ...prev, namaKpa: e.target.value }))}
                    required
                  />
                  <Input
                    label="NIP KPA"
                    name="nipKpa"
                    value={bastKpaData.nipKpa}
                    onChange={(e) => setBastKpaData(prev => ({ ...prev, nipKpa: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Pejabat PPK */}
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-700 mb-3">Pejabat Pembuat Komitmen (PPK)</h4>
              <div className="space-y-3">
                {ppkList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {ppkList.map(ppk => (
                      <button
                        key={ppk.id}
                        type="button"
                        onClick={() => handleSelectPejabat('ppk', ppk)}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        {ppk.nama}
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Nama PPK"
                    name="namaPpk"
                    value={bastKpaData.namaPpk}
                    onChange={(e) => setBastKpaData(prev => ({ ...prev, namaPpk: e.target.value }))}
                    required
                  />
                  <Input
                    label="NIP PPK"
                    name="nipPpk"
                    value={bastKpaData.nipPpk}
                    onChange={(e) => setBastKpaData(prev => ({ ...prev, nipPpk: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Pengurus Barang */}
            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="text-sm font-medium text-purple-700 mb-3">Pengurus Barang</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Nama Pengurus Barang"
                  name="namaPengurusBarang"
                  value={bastKpaData.namaPengurusBarang}
                  onChange={(e) => setBastKpaData(prev => ({ ...prev, namaPengurusBarang: e.target.value }))}
                  required
                />
                <Input
                  label="NIP Pengurus Barang"
                  name="nipPengurusBarang"
                  value={bastKpaData.nipPengurusBarang}
                  onChange={(e) => setBastKpaData(prev => ({ ...prev, nipPengurusBarang: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Status BMN */}
            <Select
              label="Status BMN"
              name="statusBmn"
              value={bastKpaData.statusBmn}
              onChange={(e) => setBastKpaData(prev => ({ ...prev, statusBmn: e.target.value }))}
              options={statusBmnOptions}
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={loading} icon={Save}>
              Simpan BAST KPA
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail BAST PPK ke KPA"
        size="lg"
      >
        {viewingData && (
          <div className="space-y-4">
            {/* Document Preview */}
            <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold uppercase">Berita Acara Serah Terima</h3>
                <h4 className="text-base font-semibold">Barang Milik Negara</h4>
                <p className="text-sm text-gray-500 mt-1">No: {viewingData.nomorBast}</p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500">Tanggal</p>
                    <p className="font-medium">{formatTanggal(viewingData.tanggalBast)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(viewingData.status)}
                      {getBmnStatusBadge(viewingData.statusBmn)}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-gray-500 mb-1">Jenis Barang</p>
                  <p className="font-medium">{viewingData.jenisBarang}</p>
                  <p className="text-gray-500 mt-2 mb-1">Uraian</p>
                  <p>{viewingData.uraianBarang}</p>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-gray-500">Jumlah</p>
                      <p className="font-medium">{viewingData.jumlah} {viewingData.satuan}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Nilai</p>
                      <p className="font-medium text-green-600">{formatRupiah(viewingData.nilai)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Lokasi</p>
                      <p className="font-medium">{viewingData.lokasiPenempatan || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 border rounded">
                    <p className="text-xs text-gray-500 mb-2">Pihak Pertama (PPK)</p>
                    <div className="h-16"></div>
                    <p className="font-medium text-sm border-t pt-1">{viewingData.namaPpk}</p>
                    <p className="text-xs text-gray-500">NIP. {viewingData.nipPpk}</p>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <p className="text-xs text-gray-500 mb-2">Pihak Kedua (KPA)</p>
                    <div className="h-16"></div>
                    <p className="font-medium text-sm border-t pt-1">{viewingData.namaKpa}</p>
                    <p className="text-xs text-gray-500">NIP. {viewingData.nipKpa}</p>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <p className="text-xs text-gray-500 mb-2">Pengurus Barang</p>
                    <div className="h-16"></div>
                    <p className="font-medium text-sm border-t pt-1">{viewingData.namaPengurusBarang}</p>
                    <p className="text-xs text-gray-500">NIP. {viewingData.nipPengurusBarang}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                Tutup
              </Button>
              <Button icon={Printer}>
                Cetak PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}
