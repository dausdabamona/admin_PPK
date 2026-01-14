import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Plus, Pencil, Search, Eye, Save, Trash2, FileText, Users,
  CheckCircle, Clock, Archive, Printer, ChevronRight, AlertTriangle,
  FileSignature, Download
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty, TablePagination } from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal, { ModalFooter } from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import db, {
  JENIS_HONOR,
  STATUS_SK_KPA,
  PERAN_DALAM_TIM,
  SATUAN_HONOR,
  getStatusSkKpaLabel,
  getPeranDalamTimLabel,
  generatePathArsipSkKpa,
  generateNomorSkKpa,
  withAuditCreate,
  withAuditUpdate,
  recordHistory,
  AUDIT_ACTIONS
} from '../../db/database'
import { formatRupiah, formatDateInput, formatTanggal } from '../../utils/formatters'

// Initial form data
const initialSkKpaData = {
  nomorSk: '',
  tanggalSk: formatDateInput(new Date()),
  tahunAnggaran: new Date().getFullYear().toString(),
  judulSk: '',
  dasarDipa: '',
  menimbang: '',
  mengingat: '',
  memperhatikan: '',
  diktumKesatu: '',
  diktumKedua: '',
  diktumKetiga: '',
  diktumKeempat: '',
  namaKpa: '',
  nipKpa: '',
  jabatanKpa: '',
  jenisHonor: '',
  totalPagu: '',
  status: STATUS_SK_KPA.DRAFT
}

const initialLampiranData = {
  recipientId: '',
  jabatanKedinasan: '',
  peranDalamTim: '',
  satuan: 'ok',
  tarif: '',
  akunBelanja: '521213',
  dasarSbm: '',
  keterangan: ''
}

export default function HonorSkKpa() {
  const [selectedSkKpa, setSelectedSkKpa] = useState(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isLampiranModalOpen, setIsLampiranModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [skKpaData, setSkKpaData] = useState(initialSkKpaData)
  const [lampiranData, setLampiranData] = useState(initialLampiranData)
  const [editingSkKpaId, setEditingSkKpaId] = useState(null)
  const [editingLampiranId, setEditingLampiranId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString())
  const [filterStatus, setFilterStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const itemsPerPage = 10

  // Fetch data
  const allSkKpa = useLiveQuery(() =>
    db.honorSkKpa.orderBy('createdAt').reverse().toArray()
  ) || []

  const allRecipients = useLiveQuery(() =>
    db.honorRecipient.where('statusAktif').equals(true).toArray()
  ) || []

  const allPejabat = useLiveQuery(() =>
    db.pejabat.toArray()
  ) || []

  // Lampiran for selected SK KPA
  const lampiranList = useLiveQuery(
    () => selectedSkKpa ? db.honorSkKpaLampiran.where('skKpaId').equals(selectedSkKpa.id).toArray() : [],
    [selectedSkKpa]
  )

  const kpaList = allPejabat.filter(p => p.jenisPejabat === 'kpa')

  // Filter SK KPA
  const filteredSkKpa = allSkKpa.filter(sk => {
    const matchSearch = sk.nomorSk?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sk.judulSk?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchTahun = !filterTahun || sk.tahunAnggaran === filterTahun
    const matchStatus = !filterStatus || sk.status === filterStatus
    return matchSearch && matchTahun && matchStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredSkKpa.length / itemsPerPage)
  const paginatedSkKpa = filteredSkKpa.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Options
  const tahunOptions = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y >= currentYear - 3; y--) {
    tahunOptions.push({ value: y.toString(), label: y.toString() })
  }

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: STATUS_SK_KPA.DRAFT, label: 'Draft' },
    { value: STATUS_SK_KPA.DITETAPKAN, label: 'Ditetapkan' },
    { value: STATUS_SK_KPA.DIGUNAKAN, label: 'Digunakan' },
    { value: STATUS_SK_KPA.ARSIP_FINAL, label: 'Arsip Final' }
  ]

  const jenisHonorOptions = JENIS_HONOR.map(j => ({
    value: j.id,
    label: j.nama
  }))

  const recipientOptions = allRecipients.map(r => ({
    value: r.id.toString(),
    label: `${r.nama} - ${r.jabatan || 'N/A'}`
  }))

  const peranOptions = PERAN_DALAM_TIM.map(p => ({
    value: p.id,
    label: p.nama
  }))

  const satuanOptions = SATUAN_HONOR.map(s => ({
    value: s.id,
    label: s.nama
  }))

  const getRecipientById = (id) => allRecipients.find(r => r.id === id)

  // Handlers
  const handleOpenFormModal = async (skKpa = null) => {
    if (skKpa) {
      setEditingSkKpaId(skKpa.id)
      setSkKpaData({
        nomorSk: skKpa.nomorSk || '',
        tanggalSk: formatDateInput(skKpa.tanggalSk),
        tahunAnggaran: skKpa.tahunAnggaran || new Date().getFullYear().toString(),
        judulSk: skKpa.judulSk || '',
        dasarDipa: skKpa.dasarDipa || '',
        menimbang: skKpa.menimbang || '',
        mengingat: skKpa.mengingat || '',
        memperhatikan: skKpa.memperhatikan || '',
        diktumKesatu: skKpa.diktumKesatu || '',
        diktumKedua: skKpa.diktumKedua || '',
        diktumKetiga: skKpa.diktumKetiga || '',
        diktumKeempat: skKpa.diktumKeempat || '',
        namaKpa: skKpa.namaKpa || '',
        nipKpa: skKpa.nipKpa || '',
        jabatanKpa: skKpa.jabatanKpa || '',
        jenisHonor: skKpa.jenisHonor || '',
        totalPagu: skKpa.totalPagu?.toString() || '',
        status: skKpa.status || STATUS_SK_KPA.DRAFT
      })
    } else {
      setEditingSkKpaId(null)
      const newNomor = await generateNomorSkKpa(currentYear.toString())
      setSkKpaData({
        ...initialSkKpaData,
        nomorSk: newNomor,
        tahunAnggaran: currentYear.toString()
      })
    }
    setIsFormModalOpen(true)
  }

  const handleSaveSkKpa = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const archivePath = generatePathArsipSkKpa(skKpaData.tahunAnggaran)

      const data = {
        nomorSk: skKpaData.nomorSk,
        tanggalSk: new Date(skKpaData.tanggalSk),
        tahunAnggaran: skKpaData.tahunAnggaran,
        judulSk: skKpaData.judulSk,
        dasarDipa: skKpaData.dasarDipa,
        menimbang: skKpaData.menimbang,
        mengingat: skKpaData.mengingat,
        memperhatikan: skKpaData.memperhatikan,
        diktumKesatu: skKpaData.diktumKesatu,
        diktumKedua: skKpaData.diktumKedua,
        diktumKetiga: skKpaData.diktumKetiga,
        diktumKeempat: skKpaData.diktumKeempat,
        namaKpa: skKpaData.namaKpa,
        nipKpa: skKpaData.nipKpa,
        jabatanKpa: skKpaData.jabatanKpa,
        jenisHonor: skKpaData.jenisHonor,
        totalPagu: parseInt(skKpaData.totalPagu) || 0,
        status: skKpaData.status,
        archivePath
      }

      if (editingSkKpaId) {
        const existing = await db.honorSkKpa.get(editingSkKpaId)
        const updated = withAuditUpdate(data, existing?.revision || 0)
        await db.honorSkKpa.update(editingSkKpaId, updated)
        await recordHistory('honorSkKpa', editingSkKpaId, AUDIT_ACTIONS.UPDATE, existing, { ...existing, ...updated })
      } else {
        const newData = withAuditCreate(data)
        const newId = await db.honorSkKpa.add(newData)
        await recordHistory('honorSkKpa', newId, AUDIT_ACTIONS.CREATE, null, newData)
      }

      setIsFormModalOpen(false)
      setSkKpaData(initialSkKpaData)
    } catch (error) {
      alert('Gagal menyimpan SK KPA: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSkKpa = (skKpa) => {
    setSelectedSkKpa(skKpa)
  }

  const handleView = (skKpa) => {
    setSelectedSkKpa(skKpa)
    setIsViewModalOpen(true)
  }

  const handleUpdateStatus = async (skKpa, newStatus) => {
    try {
      const updated = withAuditUpdate({ status: newStatus }, skKpa.revision || 0)
      await db.honorSkKpa.update(skKpa.id, updated)
      await recordHistory('honorSkKpa', skKpa.id, AUDIT_ACTIONS.UPDATE, skKpa, { ...skKpa, ...updated })

      // If status becomes "digunakan", also update linked documents
      if (newStatus === STATUS_SK_KPA.DIGUNAKAN) {
        // Update related nominatifs
        await db.honorNominatif.where('skKpaId').equals(skKpa.id).modify({ skKpaStatus: newStatus })
      }
    } catch (error) {
      alert('Gagal mengubah status: ' + error.message)
    }
  }

  const handleSelectKpa = (kpa) => {
    setSkKpaData(prev => ({
      ...prev,
      namaKpa: kpa.nama,
      nipKpa: kpa.nip,
      jabatanKpa: kpa.jabatan
    }))
  }

  // Lampiran handlers
  const handleOpenLampiranModal = (lampiran = null) => {
    if (lampiran) {
      setEditingLampiranId(lampiran.id)
      setLampiranData({
        recipientId: lampiran.recipientId?.toString() || '',
        jabatanKedinasan: lampiran.jabatanKedinasan || '',
        peranDalamTim: lampiran.peranDalamTim || '',
        satuan: lampiran.satuan || 'ok',
        tarif: lampiran.tarif?.toString() || '',
        akunBelanja: lampiran.akunBelanja || '521213',
        dasarSbm: lampiran.dasarSbm || '',
        keterangan: lampiran.keterangan || ''
      })
    } else {
      setEditingLampiranId(null)
      setLampiranData(initialLampiranData)
    }
    setIsLampiranModalOpen(true)
  }

  const handleSaveLampiran = async (e) => {
    e.preventDefault()
    if (!selectedSkKpa) return

    setLoading(true)
    try {
      const data = {
        skKpaId: selectedSkKpa.id,
        recipientId: parseInt(lampiranData.recipientId),
        jabatanKedinasan: lampiranData.jabatanKedinasan,
        peranDalamTim: lampiranData.peranDalamTim,
        satuan: lampiranData.satuan,
        tarif: parseInt(lampiranData.tarif) || 0,
        akunBelanja: lampiranData.akunBelanja,
        dasarSbm: lampiranData.dasarSbm,
        keterangan: lampiranData.keterangan
      }

      if (editingLampiranId) {
        const existing = await db.honorSkKpaLampiran.get(editingLampiranId)
        await db.honorSkKpaLampiran.update(editingLampiranId, {
          ...data,
          revision: (existing?.revision || 0) + 1
        })
      } else {
        await db.honorSkKpaLampiran.add({
          ...data,
          createdAt: new Date(),
          revision: 0
        })
      }

      // Update total pagu on SK KPA
      const allLampiran = await db.honorSkKpaLampiran.where('skKpaId').equals(selectedSkKpa.id).toArray()
      const totalPagu = allLampiran.reduce((sum, l) => sum + (l.tarif || 0), 0)
      await db.honorSkKpa.update(selectedSkKpa.id, { totalPagu })

      setIsLampiranModalOpen(false)
      setLampiranData(initialLampiranData)
    } catch (error) {
      alert('Gagal menyimpan lampiran: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLampiran = async (lampiranId) => {
    if (!confirm('Hapus penerima ini dari lampiran?')) return

    try {
      await db.honorSkKpaLampiran.delete(lampiranId)

      // Update total pagu
      const allLampiran = await db.honorSkKpaLampiran.where('skKpaId').equals(selectedSkKpa.id).toArray()
      const totalPagu = allLampiran.reduce((sum, l) => sum + (l.tarif || 0), 0)
      await db.honorSkKpa.update(selectedSkKpa.id, { totalPagu })
    } catch (error) {
      alert('Gagal menghapus: ' + error.message)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      [STATUS_SK_KPA.DRAFT]: 'default',
      [STATUS_SK_KPA.DITETAPKAN]: 'primary',
      [STATUS_SK_KPA.DIGUNAKAN]: 'success',
      [STATUS_SK_KPA.ARSIP_FINAL]: 'info'
    }
    return <Badge variant={variants[status] || 'default'}>{getStatusSkKpaLabel(status)}</Badge>
  }

  // Calculate lampiran totals
  const lampiranTotals = useMemo(() => {
    if (!lampiranList) return { count: 0, totalTarif: 0 }
    return {
      count: lampiranList.length,
      totalTarif: lampiranList.reduce((sum, l) => sum + (l.tarif || 0), 0)
    }
  }, [lampiranList])

  // Stats
  const totalSkKpa = allSkKpa.length
  const totalDraft = allSkKpa.filter(sk => sk.status === STATUS_SK_KPA.DRAFT).length
  const totalDitetapkan = allSkKpa.filter(sk => sk.status === STATUS_SK_KPA.DITETAPKAN).length

  return (
    <Layout title="SK KPA Penetapan Honorarium">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Total SK KPA</p>
            <p className="text-2xl font-bold">{totalSkKpa}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Draft</p>
            <p className="text-2xl font-bold">{totalDraft}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Ditetapkan</p>
            <p className="text-2xl font-bold">{totalDitetapkan}</p>
          </CardBody>
        </Card>
        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <CardBody className="p-4">
            <p className="text-sm opacity-80">Digunakan</p>
            <p className="text-2xl font-bold">
              {allSkKpa.filter(sk => sk.status === STATUS_SK_KPA.DIGUNAKAN).length}
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SK KPA List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="w-5 h-5 text-primary-600" />
                  Daftar SK KPA
                </CardTitle>
                <Button size="sm" onClick={() => handleOpenFormModal()} icon={Plus}>
                  Buat SK
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                <Select
                  value={filterTahun}
                  onChange={(e) => setFilterTahun(e.target.value)}
                  options={tahunOptions}
                  placeholder="Tahun"
                />
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  options={statusOptions}
                  placeholder="Status"
                />
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nomor/judul..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0 max-h-[500px] overflow-y-auto">
              {paginatedSkKpa.length > 0 ? (
                <div className="divide-y">
                  {paginatedSkKpa.map(sk => (
                    <div
                      key={sk.id}
                      onClick={() => handleSelectSkKpa(sk)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedSkKpa?.id === sk.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs text-gray-500">{sk.nomorSk}</p>
                          <p className="font-medium text-sm truncate">{sk.judulSk || 'Untitled'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTanggal(sk.tanggalSk, 'short')}
                          </p>
                          <div className="mt-1">
                            {getStatusBadge(sk.status)}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Tidak ada SK KPA
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2">
          {selectedSkKpa ? (
            <div className="space-y-4">
              {/* SK KPA Info */}
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <p className="font-mono text-sm text-gray-500">{selectedSkKpa.nomorSk}</p>
                    <CardTitle>{selectedSkKpa.judulSk || 'SK KPA Penetapan Honorarium'}</CardTitle>
                    <CardDescription>
                      Tanggal: {formatTanggal(selectedSkKpa.tanggalSk)} | TA {selectedSkKpa.tahunAnggaran}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(selectedSkKpa.status)}
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleView(selectedSkKpa)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Lihat"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {selectedSkKpa.status === STATUS_SK_KPA.DRAFT && (
                        <button
                          onClick={() => handleOpenFormModal(selectedSkKpa)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Cetak PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">KPA</p>
                      <p className="font-medium">{selectedSkKpa.namaKpa}</p>
                      <p className="text-xs text-gray-500">NIP. {selectedSkKpa.nipKpa}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total Pagu</p>
                      <p className="font-bold text-green-600">{formatRupiah(selectedSkKpa.totalPagu)}</p>
                    </div>
                  </div>

                  {/* Status Actions */}
                  <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                    {selectedSkKpa.status === STATUS_SK_KPA.DRAFT && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedSkKpa, STATUS_SK_KPA.DITETAPKAN)}
                        disabled={lampiranTotals.count === 0}
                      >
                        Tetapkan SK
                      </Button>
                    )}
                    {selectedSkKpa.status === STATUS_SK_KPA.DITETAPKAN && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUpdateStatus(selectedSkKpa, STATUS_SK_KPA.DRAFT)}
                        >
                          Kembali ke Draft
                        </Button>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleUpdateStatus(selectedSkKpa, STATUS_SK_KPA.DIGUNAKAN)}
                        >
                          Tandai Digunakan
                        </Button>
                      </>
                    )}
                    {selectedSkKpa.status === STATUS_SK_KPA.DIGUNAKAN && (
                      <Button
                        size="sm"
                        icon={Archive}
                        onClick={() => handleUpdateStatus(selectedSkKpa, STATUS_SK_KPA.ARSIP_FINAL)}
                      >
                        Arsip Final
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Lampiran Penerima */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Lampiran Penerima Honorarium
                    </CardTitle>
                    <CardDescription>
                      {lampiranTotals.count} penerima | Total: {formatRupiah(lampiranTotals.totalTarif)}
                    </CardDescription>
                  </div>
                  {selectedSkKpa.status === STATUS_SK_KPA.DRAFT && (
                    <Button size="sm" onClick={() => handleOpenLampiranModal()} icon={Plus}>
                      Tambah Penerima
                    </Button>
                  )}
                </CardHeader>
                <CardBody className="p-0">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>No</TableHeader>
                        <TableHeader>Nama Penerima</TableHeader>
                        <TableHeader>Peran</TableHeader>
                        <TableHeader>Tarif</TableHeader>
                        <TableHeader>Aksi</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lampiranList && lampiranList.length > 0 ? (
                        lampiranList.map((lampiran, index) => {
                          const recipient = getRecipientById(lampiran.recipientId)
                          return (
                            <TableRow key={lampiran.id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{recipient?.nama || '-'}</p>
                                  <p className="text-xs text-gray-500">{lampiran.jabatanKedinasan}</p>
                                </div>
                              </TableCell>
                              <TableCell>{getPeranDalamTimLabel(lampiran.peranDalamTim)}</TableCell>
                              <TableCell className="font-medium text-green-600">
                                {formatRupiah(lampiran.tarif)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {selectedSkKpa.status === STATUS_SK_KPA.DRAFT && (
                                    <>
                                      <button
                                        onClick={() => handleOpenLampiranModal(lampiran)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        title="Edit"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteLampiran(lampiran.id)}
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
                          )
                        })
                      ) : (
                        <TableEmpty
                          message="Belum ada penerima. Tambahkan penerima untuk lampiran SK."
                          colSpan={5}
                        />
                      )}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>

              {/* Warning if no lampiran */}
              {lampiranTotals.count === 0 && selectedSkKpa.status === STATUS_SK_KPA.DRAFT && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardBody className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800">Lampiran Kosong</p>
                        <p className="text-sm text-amber-700 mt-1">
                          Tambahkan minimal satu penerima honorarium sebelum SK dapat ditetapkan.
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
                <FileSignature className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Pilih SK KPA dari daftar untuk melihat detail dan lampiran</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingSkKpaId ? 'Edit SK KPA' : 'Buat SK KPA Baru'}
        size="xl"
      >
        <form onSubmit={handleSaveSkKpa}>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Nomor SK"
                name="nomorSk"
                value={skKpaData.nomorSk}
                onChange={(e) => setSkKpaData(prev => ({ ...prev, nomorSk: e.target.value }))}
                required
              />
              <Input
                label="Tanggal SK"
                name="tanggalSk"
                type="date"
                value={skKpaData.tanggalSk}
                onChange={(e) => setSkKpaData(prev => ({ ...prev, tanggalSk: e.target.value }))}
                required
              />
              <Select
                label="Tahun Anggaran"
                name="tahunAnggaran"
                value={skKpaData.tahunAnggaran}
                onChange={(e) => setSkKpaData(prev => ({ ...prev, tahunAnggaran: e.target.value }))}
                options={tahunOptions}
                required
              />
            </div>

            <Input
              label="Judul SK"
              name="judulSk"
              value={skKpaData.judulSk}
              onChange={(e) => setSkKpaData(prev => ({ ...prev, judulSk: e.target.value }))}
              placeholder="PENETAPAN PENERIMA DAN BESARAN HONORARIUM..."
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Jenis Honorarium"
                name="jenisHonor"
                value={skKpaData.jenisHonor}
                onChange={(e) => setSkKpaData(prev => ({ ...prev, jenisHonor: e.target.value }))}
                options={jenisHonorOptions}
                placeholder="Pilih jenis..."
                required
              />
              <Input
                label="Dasar DIPA"
                name="dasarDipa"
                value={skKpaData.dasarDipa}
                onChange={(e) => setSkKpaData(prev => ({ ...prev, dasarDipa: e.target.value }))}
                placeholder="DIPA Nomor..."
              />
            </div>

            {/* Konsideran */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <h4 className="font-medium text-gray-700">Konsideran</h4>
              <Textarea
                label="Menimbang"
                name="menimbang"
                value={skKpaData.menimbang}
                onChange={(e) => setSkKpaData(prev => ({ ...prev, menimbang: e.target.value }))}
                rows={3}
                placeholder="a. bahwa dalam rangka..."
              />
              <Textarea
                label="Mengingat"
                name="mengingat"
                value={skKpaData.mengingat}
                onChange={(e) => setSkKpaData(prev => ({ ...prev, mengingat: e.target.value }))}
                rows={3}
                placeholder="1. Undang-Undang Nomor..."
              />
              <Textarea
                label="Memperhatikan"
                name="memperhatikan"
                value={skKpaData.memperhatikan}
                onChange={(e) => setSkKpaData(prev => ({ ...prev, memperhatikan: e.target.value }))}
                rows={2}
                placeholder="Surat/Nota Dinas..."
              />
            </div>

            {/* Diktum */}
            <div className="p-4 bg-blue-50 rounded-lg space-y-4">
              <h4 className="font-medium text-blue-700">Diktum</h4>
              <Textarea
                label="KESATU"
                name="diktumKesatu"
                value={skKpaData.diktumKesatu}
                onChange={(e) => setSkKpaData(prev => ({ ...prev, diktumKesatu: e.target.value }))}
                rows={2}
                placeholder="Menetapkan penerima honorarium..."
              />
              <Textarea
                label="KEDUA"
                name="diktumKedua"
                value={skKpaData.diktumKedua}
                onChange={(e) => setSkKpaData(prev => ({ ...prev, diktumKedua: e.target.value }))}
                rows={2}
                placeholder="Besaran honorarium sebagaimana tercantum dalam lampiran..."
              />
              <Textarea
                label="KETIGA"
                name="diktumKetiga"
                value={skKpaData.diktumKetiga}
                onChange={(e) => setSkKpaData(prev => ({ ...prev, diktumKetiga: e.target.value }))}
                rows={2}
                placeholder="Biaya yang timbul dibebankan pada DIPA..."
              />
              <Textarea
                label="KEEMPAT"
                name="diktumKeempat"
                value={skKpaData.diktumKeempat}
                onChange={(e) => setSkKpaData(prev => ({ ...prev, diktumKeempat: e.target.value }))}
                rows={2}
                placeholder="Keputusan ini berlaku sejak tanggal ditetapkan..."
              />
            </div>

            {/* KPA */}
            <div className="p-4 bg-green-50 rounded-lg space-y-4">
              <h4 className="font-medium text-green-700">Kuasa Pengguna Anggaran</h4>
              {kpaList.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {kpaList.map(kpa => (
                    <button
                      key={kpa.id}
                      type="button"
                      onClick={() => handleSelectKpa(kpa)}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      {kpa.nama}
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Nama KPA"
                  name="namaKpa"
                  value={skKpaData.namaKpa}
                  onChange={(e) => setSkKpaData(prev => ({ ...prev, namaKpa: e.target.value }))}
                  required
                />
                <Input
                  label="NIP KPA"
                  name="nipKpa"
                  value={skKpaData.nipKpa}
                  onChange={(e) => setSkKpaData(prev => ({ ...prev, nipKpa: e.target.value }))}
                  required
                />
                <Input
                  label="Jabatan KPA"
                  name="jabatanKpa"
                  value={skKpaData.jabatanKpa}
                  onChange={(e) => setSkKpaData(prev => ({ ...prev, jabatanKpa: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsFormModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={loading} icon={Save}>
              Simpan SK KPA
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Lampiran Modal */}
      <Modal
        isOpen={isLampiranModalOpen}
        onClose={() => setIsLampiranModalOpen(false)}
        title={editingLampiranId ? 'Edit Penerima' : 'Tambah Penerima'}
        size="md"
      >
        <form onSubmit={handleSaveLampiran}>
          <div className="space-y-4">
            <Select
              label="Penerima"
              name="recipientId"
              value={lampiranData.recipientId}
              onChange={(e) => {
                const recipient = allRecipients.find(r => r.id === parseInt(e.target.value))
                setLampiranData(prev => ({
                  ...prev,
                  recipientId: e.target.value,
                  jabatanKedinasan: recipient?.jabatan || ''
                }))
              }}
              options={recipientOptions}
              placeholder="Pilih penerima..."
              required
            />

            <Input
              label="Jabatan Kedinasan"
              name="jabatanKedinasan"
              value={lampiranData.jabatanKedinasan}
              onChange={(e) => setLampiranData(prev => ({ ...prev, jabatanKedinasan: e.target.value }))}
              required
            />

            <Select
              label="Peran dalam Tim"
              name="peranDalamTim"
              value={lampiranData.peranDalamTim}
              onChange={(e) => setLampiranData(prev => ({ ...prev, peranDalamTim: e.target.value }))}
              options={peranOptions}
              placeholder="Pilih peran..."
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Satuan"
                name="satuan"
                value={lampiranData.satuan}
                onChange={(e) => setLampiranData(prev => ({ ...prev, satuan: e.target.value }))}
                options={satuanOptions}
              />
              <Input
                label="Tarif (Rp)"
                name="tarif"
                type="number"
                value={lampiranData.tarif}
                onChange={(e) => setLampiranData(prev => ({ ...prev, tarif: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Akun Belanja"
                name="akunBelanja"
                value={lampiranData.akunBelanja}
                onChange={(e) => setLampiranData(prev => ({ ...prev, akunBelanja: e.target.value }))}
                placeholder="521213"
              />
              <Input
                label="Dasar SBM"
                name="dasarSbm"
                value={lampiranData.dasarSbm}
                onChange={(e) => setLampiranData(prev => ({ ...prev, dasarSbm: e.target.value }))}
                placeholder="PMK 49/2023"
              />
            </div>

            <Input
              label="Keterangan"
              name="keterangan"
              value={lampiranData.keterangan}
              onChange={(e) => setLampiranData(prev => ({ ...prev, keterangan: e.target.value }))}
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setIsLampiranModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={loading} icon={Save}>
              Simpan
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Preview SK KPA"
        size="xl"
      >
        {selectedSkKpa && (
          <div className="space-y-4">
            {/* Document Preview */}
            <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg">
              <div className="text-center mb-6">
                <p className="text-sm font-medium">KEPUTUSAN</p>
                <p className="text-sm font-medium">KUASA PENGGUNA ANGGARAN</p>
                <p className="text-sm text-gray-600 mt-1">Nomor: {selectedSkKpa.nomorSk}</p>
                <p className="text-sm font-medium mt-4 uppercase">TENTANG</p>
                <p className="text-sm font-bold mt-1">{selectedSkKpa.judulSk}</p>
              </div>

              {selectedSkKpa.menimbang && (
                <div className="mb-4">
                  <p className="font-medium mb-1">Menimbang:</p>
                  <p className="text-sm whitespace-pre-wrap pl-4">{selectedSkKpa.menimbang}</p>
                </div>
              )}

              {selectedSkKpa.mengingat && (
                <div className="mb-4">
                  <p className="font-medium mb-1">Mengingat:</p>
                  <p className="text-sm whitespace-pre-wrap pl-4">{selectedSkKpa.mengingat}</p>
                </div>
              )}

              {selectedSkKpa.memperhatikan && (
                <div className="mb-4">
                  <p className="font-medium mb-1">Memperhatikan:</p>
                  <p className="text-sm whitespace-pre-wrap pl-4">{selectedSkKpa.memperhatikan}</p>
                </div>
              )}

              <div className="text-center my-4">
                <p className="font-bold">MEMUTUSKAN:</p>
              </div>

              {selectedSkKpa.diktumKesatu && (
                <div className="mb-3">
                  <p className="font-medium">KESATU:</p>
                  <p className="text-sm pl-4">{selectedSkKpa.diktumKesatu}</p>
                </div>
              )}

              {selectedSkKpa.diktumKedua && (
                <div className="mb-3">
                  <p className="font-medium">KEDUA:</p>
                  <p className="text-sm pl-4">{selectedSkKpa.diktumKedua}</p>
                </div>
              )}

              {selectedSkKpa.diktumKetiga && (
                <div className="mb-3">
                  <p className="font-medium">KETIGA:</p>
                  <p className="text-sm pl-4">{selectedSkKpa.diktumKetiga}</p>
                </div>
              )}

              {selectedSkKpa.diktumKeempat && (
                <div className="mb-3">
                  <p className="font-medium">KEEMPAT:</p>
                  <p className="text-sm pl-4">{selectedSkKpa.diktumKeempat}</p>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <div className="text-center">
                  <p className="text-sm">Ditetapkan di Sorong</p>
                  <p className="text-sm">pada tanggal {formatTanggal(selectedSkKpa.tanggalSk)}</p>
                  <p className="text-sm font-medium mt-2">KUASA PENGGUNA ANGGARAN,</p>
                  <div className="h-16"></div>
                  <p className="font-bold border-b">{selectedSkKpa.namaKpa}</p>
                  <p className="text-xs">NIP. {selectedSkKpa.nipKpa}</p>
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
