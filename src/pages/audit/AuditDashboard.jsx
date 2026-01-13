/**
 * Audit Control Dashboard
 * Centralized view for compliance monitoring and risk assessment
 */

import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Shield, AlertTriangle, CheckCircle, Clock, FileWarning, Archive,
  ChevronRight, TrendingUp, TrendingDown, Users, FileText, Calendar,
  AlertCircle, XCircle, Eye
} from 'lucide-react'
import Layout from '../../components/layout/Layout'
import { Card, CardHeader, CardBody, CardTitle, CardDescription } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import db, { BULAN_INDONESIA } from '../../db/database'
import { formatTanggal, formatRupiah } from '../../utils/formatters'

// Risk level calculation thresholds
const RISK_THRESHOLDS = {
  LOW: { min: 0, max: 20, color: 'green', label: 'Rendah' },
  MEDIUM: { min: 21, max: 50, color: 'yellow', label: 'Sedang' },
  HIGH: { min: 51, max: 80, color: 'orange', label: 'Tinggi' },
  CRITICAL: { min: 81, max: 100, color: 'red', label: 'Kritis' }
}

// Risk Level Indicator Component
function RiskIndicator({ score, label }) {
  const getRiskLevel = (score) => {
    if (score <= RISK_THRESHOLDS.LOW.max) return RISK_THRESHOLDS.LOW
    if (score <= RISK_THRESHOLDS.MEDIUM.max) return RISK_THRESHOLDS.MEDIUM
    if (score <= RISK_THRESHOLDS.HIGH.max) return RISK_THRESHOLDS.HIGH
    return RISK_THRESHOLDS.CRITICAL
  }

  const risk = getRiskLevel(score)
  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-bold" style={{ color: risk.color === 'green' ? '#22c55e' : risk.color === 'yellow' ? '#eab308' : risk.color === 'orange' ? '#f97316' : '#ef4444' }}>
            {score}% - {risk.label}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${colorClasses[risk.color]}`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// Stats Card Component
function AuditStatsCard({ title, value, icon: Icon, trend, trendValue, variant = 'default', onClick }) {
  const variants = {
    default: 'bg-white border',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200',
    success: 'bg-green-50 border-green-200',
    info: 'bg-blue-50 border-blue-200'
  }

  const iconVariants = {
    default: 'text-gray-600 bg-gray-100',
    warning: 'text-yellow-600 bg-yellow-100',
    danger: 'text-red-600 bg-red-100',
    success: 'text-green-600 bg-green-100',
    info: 'text-blue-600 bg-blue-100'
  }

  return (
    <div
      className={`rounded-lg p-4 ${variants[variant]} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg ${iconVariants[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

// Item List Component
function AuditItemList({ title, items, emptyMessage, icon: Icon }) {
  const [expanded, setExpanded] = useState(false)
  const displayItems = expanded ? items : items.slice(0, 5)

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium">{title}</h3>
          <Badge variant={items.length > 0 ? 'warning' : 'success'}>
            {items.length}
          </Badge>
        </div>
      </div>
      <div className="divide-y max-h-80 overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <>
            {displayItems.map((item, idx) => (
              <div key={idx} className="p-3 hover:bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <Badge variant={item.badgeVariant || 'default'} size="sm">
                      {item.badge}
                    </Badge>
                  )}
                  {item.date && (
                    <span className="text-xs text-gray-400">{formatTanggal(item.date)}</span>
                  )}
                </div>
              </div>
            ))}
            {items.length > 5 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-1"
              >
                {expanded ? 'Tampilkan Lebih Sedikit' : `Lihat ${items.length - 5} Lainnya`}
                <ChevronRight className={`w-4 h-4 transform ${expanded ? 'rotate-90' : ''}`} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function AuditDashboard() {
  const [riskScores, setRiskScores] = useState({
    overall: 0,
    spj: 0,
    rampung: 0,
    evaluation: 0,
    archive: 0
  })

  // Fetch all data for audit analysis
  const sppdData = useLiveQuery(() => db.sppd.toArray()) || []
  const rampungData = useLiveQuery(() => db.rampung.toArray()) || []
  const checklistSPJ = useLiveQuery(() => db.checklistSPJ.toArray()) || []
  const swakelolaKegiatan = useLiveQuery(() => db.swakelolaKegiatan.toArray()) || []
  const swakelolaRampung = useLiveQuery(() => db.swakelolaRampung.toArray()) || []
  const swakelolaChecklist = useLiveQuery(() => db.swakelolaChecklist.toArray()) || []
  const pjlpMaster = useLiveQuery(() => db.pjlpMaster.where('statusAktif').equals('aktif').toArray()) || []
  const pjlpPembayaran = useLiveQuery(() => db.pjlpPembayaran.toArray()) || []
  const pjlpChecklist = useLiveQuery(() => db.pjlpChecklist.toArray()) || []
  const pjlpPenilaian = useLiveQuery(() => db.pjlpPenilaian.toArray()) || []
  const pjlpKontrak = useLiveQuery(() => db.pjlpKontrak.where('status').equals('aktif').toArray()) || []

  // Calculate incomplete SPJ items
  const incompleteSPJ = [
    // SPPD with incomplete checklist
    ...checklistSPJ
      .filter(c => c.statusKelengkapan !== 'lengkap')
      .map(c => {
        const sppd = sppdData.find(s => s.id === c.sppdId)
        return {
          title: sppd?.nomor || `SPPD #${c.sppdId}`,
          subtitle: `Kelengkapan: ${c.itemLengkap || 0}/${c.totalItem || 0} item`,
          badge: `${Math.round((c.itemLengkap / c.totalItem) * 100) || 0}%`,
          badgeVariant: 'warning',
          date: c.createdAt,
          type: 'sppd'
        }
      }),
    // Swakelola with incomplete checklist
    ...swakelolaChecklist
      .filter(c => c.statusKelengkapan !== 'lengkap')
      .map(c => {
        const kegiatan = swakelolaKegiatan.find(k => k.id === c.kegiatanId)
        return {
          title: kegiatan?.nama || `Kegiatan #${c.kegiatanId}`,
          subtitle: `Kelengkapan: ${c.itemLengkap || 0}/${c.totalItem || 0} item`,
          badge: `${Math.round((c.itemLengkap / c.totalItem) * 100) || 0}%`,
          badgeVariant: 'warning',
          date: c.createdAt,
          type: 'swakelola'
        }
      }),
    // PJLP with incomplete checklist
    ...pjlpChecklist
      .filter(c => c.statusKelengkapan !== 'lengkap')
      .map(c => {
        const pjlp = pjlpMaster.find(p => p.id === c.pjlpId)
        const bulanLabel = BULAN_INDONESIA.find(b => b.value === c.bulan)?.label || c.bulan
        return {
          title: pjlp?.nama || `PJLP #${c.pjlpId}`,
          subtitle: `${bulanLabel} ${c.tahun} - ${c.itemLengkap || 0}/${c.totalItem || 0} item`,
          badge: `${Math.round((c.itemLengkap / c.totalItem) * 100) || 0}%`,
          badgeVariant: 'warning',
          date: c.createdAt,
          type: 'pjlp'
        }
      })
  ]

  // Calculate pending rampung (SPPD with pembayaran but no rampung)
  const pendingRampung = useLiveQuery(async () => {
    const pembayaranLS = await db.pembayaranLS.toArray()
    const rampungs = await db.rampung.toArray()
    const rampungSppdIds = rampungs.map(r => r.sppdId)

    const pending = []
    for (const p of pembayaranLS) {
      if (!rampungSppdIds.includes(p.sppdId)) {
        const sppd = await db.sppd.get(p.sppdId)
        const pegawai = sppd ? await db.pegawai.get(sppd.pegawaiId) : null
        pending.push({
          title: sppd?.nomor || `SPPD #${p.sppdId}`,
          subtitle: pegawai?.nama || 'Unknown',
          badge: formatRupiah(p.totalLS),
          badgeVariant: 'info',
          date: p.tanggal,
          type: 'sppd'
        })
      }
    }

    // Swakelola with uang muka but no rampung
    const uangMuka = await db.swakelolaUangMuka.where('status').equals('aktif').toArray()
    for (const um of uangMuka) {
      const kegiatan = await db.swakelolaKegiatan.get(um.kegiatanId)
      pending.push({
        title: kegiatan?.nama || `Kegiatan #${um.kegiatanId}`,
        subtitle: `Panjar: ${formatRupiah(um.jumlah)}`,
        badge: 'Belum Rampung',
        badgeVariant: 'warning',
        date: um.tanggal,
        type: 'swakelola'
      })
    }

    return pending
  }) || []

  // Calculate pending evaluation (PJLP without current quarter evaluation)
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3)
  const currentYear = new Date().getFullYear()

  const pendingEvaluation = pjlpKontrak.filter(kontrak => {
    const hasEvaluation = pjlpPenilaian.some(
      p => p.kontrakId === kontrak.id && p.tahun === currentYear && p.triwulan === currentQuarter
    )
    return !hasEvaluation
  }).map(kontrak => {
    const pjlp = pjlpMaster.find(p => p.id === kontrak.pjlpId)
    return {
      title: pjlp?.nama || `PJLP #${kontrak.pjlpId}`,
      subtitle: `Kontrak: ${kontrak.nomorKontrak}`,
      badge: `TW-${currentQuarter}`,
      badgeVariant: 'danger',
      date: kontrak.periodeAwal,
      type: 'pjlp'
    }
  })

  // Calculate pending archive (documents without archive path)
  const pendingArchive = [
    ...rampungData.filter(r => !r.archivePath).map(r => ({
      title: `Rampung #${r.id}`,
      subtitle: 'SPPD - Belum diarsipkan',
      badge: 'No Archive',
      badgeVariant: 'default',
      date: r.createdAt,
      type: 'sppd'
    })),
    ...swakelolaRampung.filter(r => !r.archivePath).map(r => {
      const kegiatan = swakelolaKegiatan.find(k => k.id === r.kegiatanId)
      return {
        title: kegiatan?.nama || `Rampung #${r.id}`,
        subtitle: 'Swakelola - Belum diarsipkan',
        badge: 'No Archive',
        badgeVariant: 'default',
        date: r.createdAt,
        type: 'swakelola'
      }
    }),
    ...pjlpPembayaran.filter(p => p.status === 'dibayar' && !p.archivePath).map(p => {
      const pjlp = pjlpMaster.find(m => m.id === p.pjlpId)
      const bulanLabel = BULAN_INDONESIA.find(b => b.value === p.bulan)?.label || p.bulan
      return {
        title: pjlp?.nama || `PJLP #${p.pjlpId}`,
        subtitle: `${bulanLabel} ${p.tahun} - Belum diarsipkan`,
        badge: 'No Archive',
        badgeVariant: 'default',
        date: p.tanggalBayar,
        type: 'pjlp'
      }
    })
  ]

  // Calculate risk scores
  useEffect(() => {
    const totalTransactions =
      sppdData.length +
      swakelolaKegiatan.length +
      pjlpPembayaran.length

    if (totalTransactions === 0) {
      setRiskScores({ overall: 0, spj: 0, rampung: 0, evaluation: 0, archive: 0 })
      return
    }

    // SPJ Risk: % of incomplete checklists
    const totalChecklists = checklistSPJ.length + swakelolaChecklist.length + pjlpChecklist.length
    const incompleteChecklists = incompleteSPJ.length
    const spjRisk = totalChecklists > 0 ? Math.round((incompleteChecklists / totalChecklists) * 100) : 0

    // Rampung Risk: % of pending rampung
    const totalPembayaran = sppdData.length + swakelolaKegiatan.filter(k => k.status === 'aktif').length
    const rampungRisk = totalPembayaran > 0 ? Math.round((pendingRampung.length / totalPembayaran) * 100) : 0

    // Evaluation Risk: % of pending evaluations
    const evaluationRisk = pjlpKontrak.length > 0
      ? Math.round((pendingEvaluation.length / pjlpKontrak.length) * 100)
      : 0

    // Archive Risk: % of unarchived documents
    const totalArchivable = rampungData.length + swakelolaRampung.length + pjlpPembayaran.filter(p => p.status === 'dibayar').length
    const archiveRisk = totalArchivable > 0 ? Math.round((pendingArchive.length / totalArchivable) * 100) : 0

    // Overall Risk: weighted average
    const overallRisk = Math.round(
      (spjRisk * 0.35) + (rampungRisk * 0.30) + (evaluationRisk * 0.15) + (archiveRisk * 0.20)
    )

    setRiskScores({
      overall: overallRisk,
      spj: spjRisk,
      rampung: rampungRisk,
      evaluation: evaluationRisk,
      archive: archiveRisk
    })
  }, [sppdData, rampungData, checklistSPJ, swakelolaKegiatan, swakelolaRampung, swakelolaChecklist, pjlpMaster, pjlpPembayaran, pjlpChecklist, pjlpPenilaian, pjlpKontrak, incompleteSPJ, pendingRampung, pendingEvaluation, pendingArchive])

  // Get overall risk level
  const getOverallRiskLevel = () => {
    if (riskScores.overall <= 20) return { label: 'Rendah', color: 'success', icon: CheckCircle }
    if (riskScores.overall <= 50) return { label: 'Sedang', color: 'warning', icon: AlertCircle }
    if (riskScores.overall <= 80) return { label: 'Tinggi', color: 'danger', icon: AlertTriangle }
    return { label: 'Kritis', color: 'danger', icon: XCircle }
  }

  const overallRisk = getOverallRiskLevel()

  return (
    <Layout title="Audit Control Dashboard">
      {/* Overall Risk Summary */}
      <Card className="mb-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium opacity-80">Status Kepatuhan Audit</h2>
              <div className="flex items-center gap-3 mt-2">
                <Shield className="w-10 h-10" />
                <div>
                  <p className="text-3xl font-bold">{riskScores.overall}%</p>
                  <p className="text-sm opacity-70">Risk Score</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge
                variant={overallRisk.color}
                className="text-lg px-4 py-2"
              >
                <overallRisk.icon className="w-5 h-5 inline mr-2" />
                Risiko {overallRisk.label}
              </Badge>
              <p className="text-xs opacity-60 mt-2">
                Per Kepmen KP No.56 Tahun 2024
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AuditStatsCard
          title="SPJ Belum Lengkap"
          value={incompleteSPJ.length}
          icon={FileWarning}
          variant={incompleteSPJ.length > 5 ? 'danger' : incompleteSPJ.length > 0 ? 'warning' : 'success'}
        />
        <AuditStatsCard
          title="Pending Rampung"
          value={pendingRampung.length}
          icon={Clock}
          variant={pendingRampung.length > 3 ? 'danger' : pendingRampung.length > 0 ? 'warning' : 'success'}
        />
        <AuditStatsCard
          title="Pending Evaluasi"
          value={pendingEvaluation.length}
          icon={Users}
          variant={pendingEvaluation.length > 5 ? 'danger' : pendingEvaluation.length > 0 ? 'warning' : 'success'}
        />
        <AuditStatsCard
          title="Pending Arsip"
          value={pendingArchive.length}
          icon={Archive}
          variant={pendingArchive.length > 10 ? 'warning' : 'default'}
        />
      </div>

      {/* Risk Indicators */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Risk Level Indicators
          </CardTitle>
          <CardDescription>
            Tingkat risiko per kategori audit
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <RiskIndicator score={riskScores.spj} label="SPJ Compliance Risk" />
          <RiskIndicator score={riskScores.rampung} label="Settlement (Rampung) Risk" />
          <RiskIndicator score={riskScores.evaluation} label="Evaluation Compliance Risk" />
          <RiskIndicator score={riskScores.archive} label="Archive Compliance Risk" />
        </CardBody>
      </Card>

      {/* Detail Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AuditItemList
          title="SPJ Belum Lengkap"
          items={incompleteSPJ}
          emptyMessage="Semua SPJ sudah lengkap"
          icon={FileWarning}
        />
        <AuditItemList
          title="Pending Rampung"
          items={pendingRampung}
          emptyMessage="Tidak ada rampung yang tertunda"
          icon={Clock}
        />
        <AuditItemList
          title="Pending Evaluasi PJLP"
          items={pendingEvaluation}
          emptyMessage="Semua evaluasi sudah dilakukan"
          icon={Users}
        />
        <AuditItemList
          title="Pending Arsip"
          items={pendingArchive}
          emptyMessage="Semua dokumen sudah diarsipkan"
          icon={Archive}
        />
      </div>

      {/* Quick Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Ringkasan Audit
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{sppdData.length}</p>
              <p className="text-sm text-gray-600">Total SPPD</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{swakelolaKegiatan.length}</p>
              <p className="text-sm text-gray-600">Kegiatan Swakelola</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{pjlpMaster.length}</p>
              <p className="text-sm text-gray-600">PJLP Aktif</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
                {checklistSPJ.filter(c => c.statusKelengkapan === 'lengkap').length +
                  swakelolaChecklist.filter(c => c.statusKelengkapan === 'lengkap').length +
                  pjlpChecklist.filter(c => c.statusKelengkapan === 'lengkap').length}
              </p>
              <p className="text-sm text-gray-600">SPJ Lengkap</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </Layout>
  )
}
