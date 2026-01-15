/**
 * ============================================================================
 * COMPLIANCE CHECKLIST - Real-time Audit Checklist
 * ============================================================================
 *
 * Checklist real-time yang auto-update berdasarkan ComplianceEngine.
 *
 * Features:
 * - Grouped by: Required docs, Optional docs, Audit rules, Business rules
 * - Color-coded: ✅ green (done), ⚠️ yellow (warning), ❌ red (missing/critical)
 * - Human-readable messages
 * - Links to relevant forms/steps
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import React, { useState } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  Accordion,
  AccordionItem,
  Chip,
  Button,
  Divider
} from '@nextui-org/react'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Shield,
  Briefcase,
  ChevronRight,
  ExternalLink
} from 'lucide-react'

/**
 * Checklist Item Component
 */
const ChecklistItem = ({ item, onActionClick }) => {
  const getIcon = () => {
    switch (item.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
      case 'critical':
      case 'missing':
        return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400 flex-shrink-0" />
    }
  }

  const getBackgroundColor = () => {
    switch (item.status) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'critical':
      case 'missing':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getTextColor = () => {
    switch (item.status) {
      case 'completed':
        return 'text-gray-700'
      case 'warning':
        return 'text-gray-700'
      case 'critical':
      case 'missing':
        return 'text-gray-800'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className={`p-3 rounded-lg border ${getBackgroundColor()} transition-all`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${getTextColor()}`}>{item.message}</p>
          {item.detail && (
            <p className="text-sm text-gray-600 mt-1">{item.detail}</p>
          )}
          {item.helpText && (
            <p className="text-xs text-gray-500 mt-2 italic">💡 {item.helpText}</p>
          )}
        </div>
        {item.actionLabel && (
          <Button
            size="sm"
            variant="flat"
            color={item.status === 'completed' ? 'default' : 'primary'}
            endContent={<ExternalLink className="w-3 h-3" />}
            onPress={() => onActionClick && onActionClick(item)}
          >
            {item.actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Checklist Section Component
 */
const ChecklistSection = ({
  title,
  icon: Icon,
  items,
  totalCount,
  completedCount,
  onActionClick
}) => {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const getSectionColor = () => {
    if (percentage === 100) return 'success'
    if (percentage >= 70) return 'warning'
    return 'danger'
  }

  return (
    <AccordionItem
      key={title}
      title={
        <div className="flex items-center justify-between w-full pr-2">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            <span className="font-semibold">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Chip size="sm" color={getSectionColor()} variant="flat">
              {completedCount}/{totalCount}
            </Chip>
            <span className="text-xs text-gray-500">{percentage}%</span>
          </div>
        </div>
      }
      indicator={<ChevronRight className="w-4 h-4" />}
    >
      <div className="space-y-2 pb-4">
        {items.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            Tidak ada item dalam kategori ini
          </div>
        ) : (
          items.map((item, index) => (
            <ChecklistItem
              key={index}
              item={item}
              onActionClick={onActionClick}
            />
          ))
        )}
      </div>
    </AccordionItem>
  )
}

/**
 * MAIN COMPONENT: Compliance Checklist
 */
const ComplianceChecklist = ({
  complianceReport,
  workflow,
  onActionClick
}) => {
  const [expandedKeys, setExpandedKeys] = useState(['required-docs'])

  if (!complianceReport || !workflow) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <p className="text-gray-500">Memuat checklist...</p>
        </CardBody>
      </Card>
    )
  }

  const { issues } = complianceReport

  // Transform issues into checklist items
  const requiredDocs = workflow.requiredDocuments.map(doc => {
    const missing = issues.missing.find(
      i => i.type === 'DOCUMENT' && i.document === doc
    )

    if (missing) {
      return {
        status: 'missing',
        message: `Dokumen ${doc} belum lengkap`,
        detail: missing.message || `Silakan lengkapi data untuk ${doc}`,
        helpText: `Dokumen ini wajib untuk proses ${workflow.processName}`,
        actionLabel: 'Lengkapi',
        actionType: 'document',
        actionTarget: doc
      }
    }

    return {
      status: 'completed',
      message: `Dokumen ${doc}`,
      detail: 'Sudah lengkap dan valid ✓'
    }
  })

  const optionalDocs = workflow.optionalDocuments.map(doc => {
    const missing = issues.missing.find(
      i => i.type === 'DOCUMENT' && i.document === doc
    )

    if (missing) {
      return {
        status: 'warning',
        message: `Dokumen ${doc} (Opsional)`,
        detail: 'Belum dilengkapi, tapi tidak wajib',
        actionLabel: 'Lengkapi',
        actionType: 'document',
        actionTarget: doc
      }
    }

    return {
      status: 'completed',
      message: `Dokumen ${doc} (Opsional)`,
      detail: 'Sudah lengkap ✓'
    }
  })

  const auditChecks = workflow.auditChecks.map(check => {
    const critical = issues.critical.find(i => i.check === check.id)
    const warning = issues.warnings.find(i => i.check === check.id)

    if (critical) {
      return {
        status: 'critical',
        message: check.rule,
        detail: check.message,
        helpText: 'Aturan ini bersifat WAJIB dan akan diperiksa auditor',
        severity: 'critical',
        actionLabel: 'Perbaiki',
        actionType: 'audit-check',
        actionTarget: check.id
      }
    }

    if (warning) {
      return {
        status: 'warning',
        message: check.rule,
        detail: check.message,
        helpText: 'Sebaiknya diperbaiki untuk menghindari pertanyaan auditor',
        severity: 'warning',
        actionLabel: 'Periksa',
        actionType: 'audit-check',
        actionTarget: check.id
      }
    }

    return {
      status: 'completed',
      message: check.rule,
      detail: 'Terpenuhi ✓'
    }
  })

  // Count completed items
  const requiredDocsCompleted = requiredDocs.filter(
    i => i.status === 'completed'
  ).length

  const optionalDocsCompleted = optionalDocs.filter(
    i => i.status === 'completed'
  ).length

  const auditChecksCompleted = auditChecks.filter(
    i => i.status === 'completed'
  ).length

  // Overall stats
  const totalItems = requiredDocs.length + auditChecks.length
  const completedItems = requiredDocsCompleted + auditChecksCompleted
  const overallPercentage = totalItems > 0
    ? Math.round((completedItems / totalItems) * 100)
    : 0

  return (
    <div className="w-full space-y-6">
      {/* Summary Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-bold">Checklist Compliance</h2>
            <Chip
              color={overallPercentage === 100 ? 'success' : 'warning'}
              variant="flat"
              size="lg"
            >
              {overallPercentage}% Lengkap
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress Keseluruhan</span>
              <span className="font-semibold">
                {completedItems}/{totalItems} Item
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  overallPercentage === 100
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                }`}
                style={{ width: `${overallPercentage}%` }}
              />
            </div>
          </div>

          <Divider className="my-4" />

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-500">
                {completedItems}
              </div>
              <div className="text-xs text-gray-500">Selesai</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">
                {issues.warnings.length}
              </div>
              <div className="text-xs text-gray-500">Perhatian</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">
                {issues.critical.length + issues.missing.length}
              </div>
              <div className="text-xs text-gray-500">Perlu Perbaikan</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Checklist Items */}
      <Card className="shadow-lg">
        <CardBody className="p-0">
          <Accordion
            variant="splitted"
            selectedKeys={expandedKeys}
            onSelectionChange={setExpandedKeys}
          >
            {/* Required Documents */}
            <ChecklistSection
              title="Dokumen Wajib"
              icon={FileText}
              items={requiredDocs}
              totalCount={requiredDocs.length}
              completedCount={requiredDocsCompleted}
              onActionClick={onActionClick}
            />

            {/* Optional Documents */}
            {optionalDocs.length > 0 && (
              <ChecklistSection
                title="Dokumen Opsional"
                icon={FileText}
                items={optionalDocs}
                totalCount={optionalDocs.length}
                completedCount={optionalDocsCompleted}
                onActionClick={onActionClick}
              />
            )}

            {/* Audit Checks */}
            <ChecklistSection
              title="Aturan Audit"
              icon={Shield}
              items={auditChecks}
              totalCount={auditChecks.length}
              completedCount={auditChecksCompleted}
              onActionClick={onActionClick}
            />
          </Accordion>
        </CardBody>
      </Card>

      {/* Encouragement Message */}
      {overallPercentage < 100 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-none">
          <CardBody className="text-center py-6">
            <p className="text-gray-700">
              {overallPercentage >= 80
                ? '💪 Hampir selesai! Tinggal beberapa item lagi.'
                : overallPercentage >= 50
                ? '👍 Progres bagus! Mari kita lanjutkan.'
                : '🌟 Mari kita lengkapi satu per satu. Tidak perlu terburu-buru.'}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Success Message */}
      {overallPercentage === 100 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardBody className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-lg font-semibold text-green-700">
              Semua item checklist sudah lengkap! 🎉
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Pekerjaan Anda sangat rapi dan siap untuk audit.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

export default ComplianceChecklist
