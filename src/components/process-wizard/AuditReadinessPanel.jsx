/**
 * ============================================================================
 * AUDIT READINESS PANEL - Dashboard Kesiapan Audit
 * ============================================================================
 *
 * Komponen utama yang menampilkan skor kesiapan audit dan membimbing PPK
 * dengan pendekatan yang calming, encouraging, dan guiding.
 *
 * UX Principles:
 * - Helpful, not blaming
 * - Calming, not intimidating
 * - Guiding, not commanding
 * - Human language, not technical
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Progress,
  Button,
  Chip,
  Divider,
  Accordion,
  AccordionItem
} from '@nextui-org/react'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  FileText,
  ListChecks,
  Shield,
  AlertCircle,
  Download,
  Sparkles,
  Info
} from 'lucide-react'

/**
 * Circular Progress Score Display
 */
const CircularScore = ({ score, size = 200 }) => {
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  // Color based on score
  const getColor = () => {
    if (score >= 95) return '#22c55e' // green-500
    if (score >= 80) return '#eab308' // yellow-500
    return '#ef4444' // red-500
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="12"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Score text in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-5xl font-bold" style={{ color: getColor() }}>
          {score}%
        </div>
        <div className="text-sm text-gray-500 mt-1">Kesiapan Audit</div>
      </div>
    </div>
  )
}

/**
 * Compliance Level Badge
 */
const ComplianceBadge = ({ level, icon, label, color }) => {
  const getColorClass = () => {
    if (color === '#22c55e') return 'success'
    if (color === '#eab308') return 'warning'
    return 'danger'
  }

  return (
    <Chip
      size="lg"
      variant="flat"
      color={getColorClass()}
      startContent={<span className="text-xl">{icon}</span>}
      className="px-4 py-6 text-base font-semibold"
    >
      {label}
    </Chip>
  )
}

/**
 * Score Breakdown
 */
const ScoreBreakdown = ({ breakdown }) => {
  const items = [
    {
      label: 'Dokumen Lengkap',
      score: breakdown.documentsScore || 0,
      max: 40,
      icon: <FileText className="w-4 h-4" />
    },
    {
      label: 'Langkah Selesai',
      score: breakdown.stepsScore || 0,
      max: 30,
      icon: <ListChecks className="w-4 h-4" />
    },
    {
      label: 'Aturan Audit',
      score: breakdown.auditChecksScore || 0,
      max: 20,
      icon: <Shield className="w-4 h-4" />
    },
    {
      label: 'Tanpa Warning',
      score: breakdown.warningsScore || 0,
      max: 10,
      icon: <AlertCircle className="w-4 h-4" />
    }
  ]

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </div>
            <span className="font-semibold text-gray-700">
              {item.score}/{item.max}
            </span>
          </div>
          <Progress
            value={(item.score / item.max) * 100}
            color={item.score === item.max ? 'success' : 'warning'}
            size="sm"
            className="w-full"
          />
        </div>
      ))}
    </div>
  )
}

/**
 * Recommendations List
 */
const RecommendationsList = ({ recommendations }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'danger'
      case 'HIGH':
        return 'warning'
      case 'MEDIUM':
        return 'primary'
      default:
        return 'default'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return <XCircle className="w-5 h-5" />
      case 'HIGH':
        return <AlertTriangle className="w-5 h-5" />
      case 'MEDIUM':
        return <Info className="w-5 h-5" />
      default:
        return <Sparkles className="w-5 h-5" />
    }
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-gray-600">Semua terlihat sempurna! ✨</p>
      </div>
    )
  }

  return (
    <Accordion variant="splitted" className="px-0">
      {recommendations.map((rec, index) => (
        <AccordionItem
          key={index}
          title={
            <div className="flex items-center gap-2">
              {getPriorityIcon(rec.priority)}
              <span className="font-semibold">{rec.title}</span>
            </div>
          }
          indicator={<span className="text-xs text-gray-500">{rec.items.length}</span>}
        >
          <ul className="space-y-2 pl-4">
            {rec.items.map((item, i) => (
              <li key={i} className="text-sm text-gray-700 list-disc ml-4">
                {item}
              </li>
            ))}
          </ul>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

/**
 * MAIN COMPONENT: Audit Readiness Panel
 */
const AuditReadinessPanel = ({
  complianceReport,
  workflowInstance,
  onGeneratePackage,
  isLoading = false
}) => {
  const [animatedScore, setAnimatedScore] = useState(0)

  // Animate score on mount/update
  useEffect(() => {
    if (complianceReport?.score) {
      let start = 0
      const end = complianceReport.score
      const duration = 1000 // 1 second
      const increment = end / (duration / 16) // 60fps

      const timer = setInterval(() => {
        start += increment
        if (start >= end) {
          setAnimatedScore(end)
          clearInterval(timer)
        } else {
          setAnimatedScore(Math.floor(start))
        }
      }, 16)

      return () => clearInterval(timer)
    }
  }, [complianceReport?.score])

  if (!complianceReport) {
    return (
      <Card className="w-full">
        <CardBody className="text-center py-12">
          <p className="text-gray-500">Memuat data kesiapan audit...</p>
        </CardBody>
      </Card>
    )
  }

  const {
    score,
    complianceLevel,
    status,
    icon,
    color,
    issues,
    recommendations,
    breakdown,
    summary
  } = complianceReport

  const canGenerate = score >= 95

  return (
    <div className="w-full space-y-6">
      {/* Main Score Card */}
      <Card className="w-full shadow-lg">
        <CardHeader className="flex flex-col gap-3 pb-0">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-2xl font-bold">Kesiapan Audit</h2>
            <ComplianceBadge
              level={complianceLevel}
              icon={icon}
              label={status}
              color={color}
            />
          </div>
        </CardHeader>

        <CardBody className="gap-6 pt-6">
          {/* Circular Score */}
          <div className="flex justify-center">
            <CircularScore score={animatedScore} size={220} />
          </div>

          {/* Summary Message */}
          <div
            className={`p-4 rounded-lg ${
              summary.tone === 'positive'
                ? 'bg-green-50 border border-green-200'
                : summary.tone === 'encouraging'
                ? 'bg-yellow-50 border border-yellow-200'
                : summary.tone === 'guiding'
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <p className="font-semibold text-lg mb-2">{summary.message}</p>
            <p className="text-gray-700">{summary.detail}</p>
          </div>

          <Divider />

          {/* Score Breakdown */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Rincian Skor
            </h3>
            <ScoreBreakdown breakdown={breakdown} />
          </div>

          {/* Issues Summary */}
          {(issues.critical.length > 0 ||
            issues.warnings.length > 0 ||
            issues.missing.length > 0) && (
            <>
              <Divider />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-red-500">
                    {issues.critical.length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Kritis</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-yellow-500">
                    {issues.warnings.length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Perhatian</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-500">
                    {issues.missing.length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Belum Lengkap</div>
                </div>
              </div>
            </>
          )}
        </CardBody>

        <CardFooter className="flex flex-col gap-3">
          <Button
            color={canGenerate ? 'success' : 'default'}
            size="lg"
            fullWidth
            startContent={canGenerate ? <Download className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            isDisabled={!canGenerate || isLoading}
            isLoading={isLoading}
            onPress={onGeneratePackage}
            className="font-semibold"
          >
            {canGenerate
              ? '✨ Generate Paket SPJ Sekarang'
              : `Lengkapi Data (${score}% → 95%+)`}
          </Button>

          {!canGenerate && (
            <p className="text-xs text-center text-gray-500">
              Paket SPJ dapat di-generate setelah skor mencapai 95% atau lebih
            </p>
          )}
        </CardFooter>
      </Card>

      {/* Recommendations Card */}
      {recommendations && recommendations.length > 0 && (
        <Card className="w-full shadow-lg">
          <CardHeader>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Rekomendasi
            </h3>
          </CardHeader>
          <CardBody>
            <RecommendationsList recommendations={recommendations} />
          </CardBody>
        </Card>
      )}

      {/* Motivational Footer */}
      <Card className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-none">
        <CardBody className="text-center py-6">
          <p className="text-gray-700 italic">
            {score >= 95
              ? '🎉 Luar biasa! Pekerjaan Anda sudah sangat rapi dan profesional.'
              : score >= 80
              ? '💪 Anda sudah sangat dekat! Tinggal sedikit lagi untuk sempurna.'
              : score >= 60
              ? '👍 Progres yang bagus! Mari kita selesaikan bersama-sama.'
              : '🌟 Tidak apa-apa, kita kerjakan langkah demi langkah.'}
          </p>
        </CardBody>
      </Card>
    </div>
  )
}

export default AuditReadinessPanel
