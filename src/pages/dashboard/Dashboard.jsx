import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Users,
  FileText,
  Plane,
  Wallet,
  ClipboardCheck,
  CheckSquare,
  ArrowRight,
  AlertCircle,
  Clock,
  FolderKanban,
  Banknote,
  Receipt,
  UserCheck,
  FileSignature,
  CalendarDays,
  Star,
  Package,
  Store,
  FileSearch,
  Handshake
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import StatsCard from '../../components/ui/StatsCard'
import { Card, CardHeader, CardBody, CardTitle } from '../../components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/Badge'
import Badge from '../../components/ui/Badge'
import db, { initializeDatabase } from '../../db/database'
import { formatTanggal, formatRupiah } from '../../utils/formatters'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)

  // Initialize database on first load
  useEffect(() => {
    initializeDatabase().then(() => setLoading(false))
  }, [])

  // Live queries for dashboard stats - with safety guards
  const pegawaiCount = useLiveQuery(async () => {
    try { return await db.pegawai.count() } catch { return 0 }
  }) || 0
  const suratTugasCount = useLiveQuery(async () => {
    try { return await db.suratTugas.count() } catch { return 0 }
  }) || 0
  const sppdCount = useLiveQuery(async () => {
    try { return await db.sppd.count() } catch { return 0 }
  }) || 0
  const rampungCount = useLiveQuery(async () => {
    try { return await db.rampung.count() } catch { return 0 }
  }) || 0

  // Recent SPPD (last 5) - with safety guard
  const recentSPPD = useLiveQuery(async () => {
    try {
      const sppds = await db.sppd.orderBy('createdAt').reverse().limit(5).toArray()

      // Fetch related pegawai data
      const withPegawai = await Promise.all(
        sppds.map(async (sppd) => {
          const pegawai = await db.pegawai.get(sppd.pegawaiId)
          return { ...sppd, pegawai }
        })
      )

      return withPegawai
    } catch {
      return []
    }
  }) || []

  // Pending checklist (incomplete) - with safety guard
  const pendingChecklist = useLiveQuery(async () => {
    try {
      const checklists = await db.checklistSPJ
        .filter(c => c.itemLengkap < c.totalItem)
        .limit(5)
        .toArray()

      const withSPPD = await Promise.all(
        checklists.map(async (checklist) => {
          const sppd = await db.sppd.get(checklist.sppdId)
          const pegawai = sppd ? await db.pegawai.get(sppd.pegawaiId) : null
          return { ...checklist, sppd, pegawai }
        })
      )

      return withSPPD
    } catch {
      return []
    }
  }) || []

  // Calculate total LS this month - with safety guard
  const totalLS = useLiveQuery(async () => {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const payments = await db.pembayaranLS
        .filter(p => new Date(p.tanggal) >= startOfMonth)
        .toArray()

      return payments.reduce((sum, p) => sum + (p.totalLS || 0), 0)
    } catch {
      return 0
    }
  }) || 0

  // Swakelola stats - with safety guards
  const swakelolaKegiatanCount = useLiveQuery(async () => {
    try { return await db.swakelolaKegiatan.count() } catch { return 0 }
  }) || 0

  const swakelolaUangMukaAktif = useLiveQuery(async () => {
    try { return await db.swakelolaUangMuka.where('status').equals('aktif').count() } catch { return 0 }
  }) || 0

  // Total Swakelola Uang Muka aktif - with safety guard
  const totalSwakelolaUangMuka = useLiveQuery(async () => {
    try {
      const uangMuka = await db.swakelolaUangMuka.where('status').equals('aktif').toArray()
      return uangMuka.reduce((sum, um) => sum + (um.jumlah || 0), 0)
    } catch {
      return 0
    }
  }) || 0

  // Recent Swakelola Kegiatan - with safety guard
  const recentSwakelolaKegiatan = useLiveQuery(async () => {
    try {
      const kegiatan = await db.swakelolaKegiatan.orderBy('createdAt').reverse().limit(5).toArray()
      return Promise.all(kegiatan.map(async (k) => {
        const timCount = await db.swakelolaTim.where('kegiatanId').equals(k.id).count()
        const uangMukaTotal = await db.swakelolaUangMuka.where('kegiatanId').equals(k.id).toArray()
        const realisasiTotal = await db.swakelolaRealisasi.where('kegiatanId').equals(k.id).toArray()
        return {
          ...k,
          timCount,
          totalUangMuka: uangMukaTotal.reduce((sum, um) => sum + (um.jumlah || 0), 0),
          totalRealisasi: realisasiTotal.reduce((sum, r) => sum + (r.totalRealisasi || 0), 0)
        }
      }))
    } catch {
      return []
    }
  }) || []

  // PJLP stats - use lowercase 'aktif' to match data
  const pjlpAktifCount = useLiveQuery(async () => {
    try {
      return await db.pjlpMaster.where('statusAktif').equals('aktif').count()
    } catch {
      return 0
    }
  }) || 0

  const pjlpKontrakAktifCount = useLiveQuery(async () => {
    try {
      return await db.pjlpKontrak.where('status').equals('aktif').count()
    } catch {
      return 0
    }
  }) || 0

  // Total PJLP Pembayaran bulan ini - fixed without compound index
  const totalPjlpBulanIni = useLiveQuery(async () => {
    try {
      const now = new Date()
      const bulan = now.getMonth() + 1
      const tahun = now.getFullYear()

      const pembayaran = await db.pjlpPembayaran
        .filter(p => p.bulan === bulan && p.tahun === tahun)
        .toArray()

      return pembayaran.reduce((sum, p) => sum + (p.honorNetto || 0), 0)
    } catch {
      return 0
    }
  }) || 0

  // PJLP dengan penilaian terbaru - with safety guard
  const pjlpPenilaianTerbaru = useLiveQuery(async () => {
    try {
      const penilaian = await db.pjlpPenilaian.orderBy('createdAt').reverse().limit(5).toArray()
      return Promise.all(penilaian.map(async (p) => {
        const pjlp = await db.pjlpMaster.get(p.pjlpId)
        return { ...p, pjlp }
      }))
    } catch {
      return []
    }
  }) || []

  // Pengadaan stats - with safety guards
  const pengadaanPaketCount = useLiveQuery(async () => {
    try { return await db.pengadaanPaket.count() } catch { return 0 }
  }) || 0

  const pengadaanPenyediaCount = useLiveQuery(async () => {
    try { return await db.pengadaanPenyedia.count() } catch { return 0 }
  }) || 0

  const pengadaanKontrakAktifCount = useLiveQuery(async () => {
    try {
      return await db.pengadaanKontrak.where('status').equals('aktif').count()
    } catch {
      return 0
    }
  }) || 0

  // Total nilai kontrak aktif Pengadaan
  const totalPengadaanKontrak = useLiveQuery(async () => {
    try {
      const kontrak = await db.pengadaanKontrak.where('status').equals('aktif').toArray()
      return kontrak.reduce((sum, k) => sum + (k.nilaiKontrak || 0), 0)
    } catch {
      return 0
    }
  }) || 0

  // Recent Pengadaan Paket - with safety guard
  const recentPengadaanPaket = useLiveQuery(async () => {
    try {
      const paket = await db.pengadaanPaket.orderBy('createdAt').reverse().limit(5).toArray()
      return Promise.all(paket.map(async (p) => {
        const kontrak = await db.pengadaanKontrak.where('paketId').equals(p.id).first()
        const penyedia = kontrak ? await db.pengadaanPenyedia.get(kontrak.penyediaId) : null
        return { ...p, kontrak, penyedia }
      }))
    } catch {
      return []
    }
  }) || []

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Dashboard">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 mb-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Selamat Datang di SIPBJ & SPJ Offline
        </h1>
        <p className="text-primary-100">
          Sistem Informasi Perjalanan Dinas - Politeknik Kelautan dan Perikanan Sorong
        </p>
      </div>

      {/* Stats Cards - Perjalanan Dinas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total Pegawai"
          value={pegawaiCount}
          subtitle="Data pegawai terdaftar"
          icon={Users}
          color="primary"
        />
        <StatsCard
          title="Surat Tugas"
          value={suratTugasCount}
          subtitle="Total surat tugas"
          icon={FileText}
          color="info"
        />
        <StatsCard
          title="SPPD"
          value={sppdCount}
          subtitle="Total SPPD dibuat"
          icon={Plane}
          color="success"
        />
        <StatsCard
          title="Total LS Bulan Ini"
          value={formatRupiah(totalLS)}
          subtitle="Pembayaran langsung"
          icon={Wallet}
          color="warning"
        />
      </div>

      {/* Stats Cards - Swakelola */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Kegiatan Swakelola"
          value={swakelolaKegiatanCount}
          subtitle="Total kegiatan aktif"
          icon={FolderKanban}
          color="primary"
        />
        <StatsCard
          title="Uang Muka Aktif"
          value={swakelolaUangMukaAktif}
          subtitle="Belum dirampungkan"
          icon={Banknote}
          color="warning"
        />
        <StatsCard
          title="Total Panjar Aktif"
          value={formatRupiah(totalSwakelolaUangMuka)}
          subtitle="Uang muka berjalan"
          icon={Receipt}
          color="info"
        />
        <StatsCard
          title="Rampung"
          value={rampungCount}
          subtitle="Total SPJ selesai"
          icon={ClipboardCheck}
          color="success"
        />
      </div>

      {/* Stats Cards - PJLP */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="PJLP Aktif"
          value={pjlpAktifCount}
          subtitle="Tenaga PJLP aktif"
          icon={UserCheck}
          color="primary"
        />
        <StatsCard
          title="Kontrak Aktif"
          value={pjlpKontrakAktifCount}
          subtitle="Kontrak berjalan"
          icon={FileSignature}
          color="info"
        />
        <StatsCard
          title="Pembayaran Bulan Ini"
          value={formatRupiah(totalPjlpBulanIni)}
          subtitle="Total honor PJLP"
          icon={Wallet}
          color="success"
        />
        <StatsCard
          title="Penilaian"
          value={pjlpPenilaianTerbaru?.length || 0}
          subtitle="Penilaian triwulan"
          icon={Star}
          color="warning"
        />
      </div>

      {/* Stats Cards - Pengadaan Langsung */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Paket Pengadaan"
          value={pengadaanPaketCount}
          subtitle="Total paket"
          icon={Package}
          color="primary"
        />
        <StatsCard
          title="Penyedia"
          value={pengadaanPenyediaCount}
          subtitle="Vendor terdaftar"
          icon={Store}
          color="info"
        />
        <StatsCard
          title="Kontrak Aktif"
          value={pengadaanKontrakAktifCount}
          subtitle="Kontrak berjalan"
          icon={Handshake}
          color="success"
        />
        <StatsCard
          title="Nilai Kontrak"
          value={formatRupiah(totalPengadaanKontrak)}
          subtitle="Total kontrak aktif"
          icon={Wallet}
          color="warning"
        />
      </div>

      {/* Quick Actions - Perjalanan Dinas */}
      <h3 className="text-sm font-medium text-gray-500 mb-3">Perjalanan Dinas</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Link
          to="/surat-tugas"
          className="card p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <FileText className="w-8 h-8 text-primary-600 mb-2" />
              <p className="font-medium text-gray-900">Surat Tugas</p>
              <p className="text-xs text-gray-500">Buat surat tugas baru</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </div>
        </Link>
        <Link
          to="/sppd"
          className="card p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <Plane className="w-8 h-8 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">SPPD</p>
              <p className="text-xs text-gray-500">Kelola SPPD</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
          </div>
        </Link>
        <Link
          to="/rampung"
          className="card p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <ClipboardCheck className="w-8 h-8 text-yellow-600 mb-2" />
              <p className="font-medium text-gray-900">Rampung</p>
              <p className="text-xs text-gray-500">Input realisasi</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-yellow-600 transition-colors" />
          </div>
        </Link>
        <Link
          to="/checklist"
          className="card p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <CheckSquare className="w-8 h-8 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">Checklist</p>
              <p className="text-xs text-gray-500">Verifikasi SPJ</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Quick Actions - Swakelola */}
      <h3 className="text-sm font-medium text-gray-500 mb-3">Swakelola</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Link
          to="/swakelola/kegiatan"
          className="card p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <FolderKanban className="w-8 h-8 text-indigo-600 mb-2" />
              <p className="font-medium text-gray-900">Kegiatan</p>
              <p className="text-xs text-gray-500">Kelola kegiatan</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
          </div>
        </Link>
        <Link
          to="/swakelola/uang-muka"
          className="card p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <Banknote className="w-8 h-8 text-emerald-600 mb-2" />
              <p className="font-medium text-gray-900">Uang Muka</p>
              <p className="text-xs text-gray-500">Panjar swakelola</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
          </div>
        </Link>
        <Link
          to="/swakelola/realisasi"
          className="card p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <Receipt className="w-8 h-8 text-amber-600 mb-2" />
              <p className="font-medium text-gray-900">Realisasi</p>
              <p className="text-xs text-gray-500">Input pengeluaran</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
          </div>
        </Link>
        <Link
          to="/swakelola/rampung"
          className="card p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <ClipboardCheck className="w-8 h-8 text-teal-600 mb-2" />
              <p className="font-medium text-gray-900">Rampung</p>
              <p className="text-xs text-gray-500">Selesaikan SPJ</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Quick Actions - PJLP */}
      <h3 className="text-sm font-medium text-gray-500 mb-3">PJLP (Penyedia Jasa Lainnya Perseorangan)</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Link
          to="/pjlp/master"
          className="card p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <UserCheck className="w-8 h-8 text-violet-600 mb-2" />
              <p className="font-medium text-gray-900">Data PJLP</p>
              <p className="text-xs text-gray-500">Kelola data PJLP</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-violet-600 transition-colors" />
          </div>
        </Link>
        <Link
          to="/pjlp/kontrak"
          className="card p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <FileSignature className="w-8 h-8 text-cyan-600 mb-2" />
              <p className="font-medium text-gray-900">Kontrak</p>
              <p className="text-xs text-gray-500">SPK & SPMK</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-cyan-600 transition-colors" />
          </div>
        </Link>
        <Link
          to="/pjlp/pembayaran"
          className="card p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <Wallet className="w-8 h-8 text-rose-600 mb-2" />
              <p className="font-medium text-gray-900">Pembayaran</p>
              <p className="text-xs text-gray-500">Honor bulanan</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-rose-600 transition-colors" />
          </div>
        </Link>
        <Link
          to="/pjlp/penilaian"
          className="card p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <Star className="w-8 h-8 text-orange-600 mb-2" />
              <p className="font-medium text-gray-900">Penilaian</p>
              <p className="text-xs text-gray-500">Evaluasi triwulan</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Quick Actions - Pengadaan Langsung */}
      <h3 className="text-sm font-medium text-gray-500 mb-3">Pengadaan Langsung (Non-Tender)</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Link
          to="/pengadaan/paket"
          className="card p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <Package className="w-8 h-8 text-sky-600 mb-2" />
              <p className="font-medium text-gray-900">Master Paket</p>
              <p className="text-xs text-gray-500">Kelola paket pengadaan</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-sky-600 transition-colors" />
          </div>
        </Link>
        <Link
          to="/pengadaan/perencanaan"
          className="card p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <FileSearch className="w-8 h-8 text-lime-600 mb-2" />
              <p className="font-medium text-gray-900">Perencanaan</p>
              <p className="text-xs text-gray-500">KAK & HPS</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-lime-600 transition-colors" />
          </div>
        </Link>
        <Link
          to="/pengadaan/kontrak"
          className="card p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <Handshake className="w-8 h-8 text-fuchsia-600 mb-2" />
              <p className="font-medium text-gray-900">Kontrak</p>
              <p className="text-xs text-gray-500">SPK & SPMK</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-fuchsia-600 transition-colors" />
          </div>
        </Link>
        <Link
          to="/pengadaan/pembayaran"
          className="card p-4 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div>
              <Wallet className="w-8 h-8 text-pink-600 mb-2" />
              <p className="font-medium text-gray-900">Pembayaran</p>
              <p className="text-xs text-gray-500">Termin pembayaran</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-pink-600 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Recent Activity & Pending Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent SPPD */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>SPPD Terbaru</CardTitle>
            <Link to="/sppd" className="text-sm text-primary-600 hover:text-primary-700">
              Lihat Semua
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Nomor</TableHeader>
                  <TableHeader>Pegawai</TableHeader>
                  <TableHeader>Tujuan</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentSPPD.length > 0 ? (
                  recentSPPD.map((sppd) => (
                    <TableRow key={sppd.id}>
                      <TableCell className="font-medium">{sppd.nomor || '-'}</TableCell>
                      <TableCell>{sppd.pegawai?.nama || '-'}</TableCell>
                      <TableCell>{sppd.kotaTujuan || '-'}</TableCell>
                      <TableCell>
                        <StatusBadge status={sppd.status || 'draft'} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableEmpty message="Belum ada data SPPD" colSpan={4} />
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        {/* Pending Checklist */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Checklist Belum Lengkap
            </CardTitle>
            <Link to="/checklist" className="text-sm text-primary-600 hover:text-primary-700">
              Lihat Semua
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>SPPD</TableHeader>
                  <TableHeader>Pegawai</TableHeader>
                  <TableHeader>Kelengkapan</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingChecklist.length > 0 ? (
                  pendingChecklist.map((checklist) => (
                    <TableRow key={checklist.id}>
                      <TableCell className="font-medium">
                        {checklist.sppd?.nomor || '-'}
                      </TableCell>
                      <TableCell>{checklist.pegawai?.nama || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full"
                              style={{
                                width: `${(checklist.itemLengkap / checklist.totalItem) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {checklist.itemLengkap}/{checklist.totalItem}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableEmpty message="Semua checklist sudah lengkap" colSpan={3} />
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      {/* Swakelola Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-indigo-500" />
              Kegiatan Swakelola Terbaru
            </CardTitle>
            <Link to="/swakelola/kegiatan" className="text-sm text-primary-600 hover:text-primary-700">
              Lihat Semua
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Kode</TableHeader>
                  <TableHeader>Nama Kegiatan</TableHeader>
                  <TableHeader>Tim</TableHeader>
                  <TableHeader>Uang Muka</TableHeader>
                  <TableHeader>Realisasi</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentSwakelolaKegiatan.length > 0 ? (
                  recentSwakelolaKegiatan.map((kegiatan) => (
                    <TableRow key={kegiatan.id}>
                      <TableCell className="font-mono text-sm">{kegiatan.kode}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">{kegiatan.nama}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">{kegiatan.timCount} orang</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatRupiah(kegiatan.totalUangMuka)}</TableCell>
                      <TableCell className="text-right">{formatRupiah(kegiatan.totalRealisasi)}</TableCell>
                      <TableCell>
                        <Badge variant={kegiatan.status === 'aktif' ? 'success' : kegiatan.status === 'selesai' ? 'default' : 'warning'}>
                          {kegiatan.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableEmpty message="Belum ada kegiatan swakelola" colSpan={6} />
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      {/* Pengadaan Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-sky-500" />
              Paket Pengadaan Terbaru
            </CardTitle>
            <Link to="/pengadaan/paket" className="text-sm text-primary-600 hover:text-primary-700">
              Lihat Semua
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Kode RUP</TableHeader>
                  <TableHeader>Nama Paket</TableHeader>
                  <TableHeader>Jenis</TableHeader>
                  <TableHeader>Penyedia</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentPengadaanPaket.length > 0 ? (
                  recentPengadaanPaket.map((paket) => (
                    <TableRow key={paket.id}>
                      <TableCell className="font-mono text-sm">{paket.kodeRup || '-'}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">{paket.namaPaket}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">{paket.jenisPengadaan}</Badge>
                      </TableCell>
                      <TableCell>{paket.penyedia?.nama || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          paket.workflowStatus === 'selesai' ? 'success' :
                          paket.workflowStatus === 'kontrak' || paket.workflowStatus === 'pelaksanaan' ? 'info' :
                          'warning'
                        }>
                          {paket.workflowStatus || 'perencanaan'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableEmpty message="Belum ada paket pengadaan" colSpan={5} />
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      {/* Info Banner */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Aplikasi Berjalan Offline
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Semua data tersimpan secara lokal di browser Anda. Jangan lupa untuk melakukan backup secara berkala melalui menu Pengaturan.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
