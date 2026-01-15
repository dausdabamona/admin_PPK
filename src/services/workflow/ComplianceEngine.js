/**
 * ============================================================================
 * COMPLIANCE ENGINE - Audit Readiness & Compliance Scorer
 * ============================================================================
 *
 * Service untuk menghitung tingkat kesiapan audit (audit readiness score)
 * dan compliance level berdasarkan kelengkapan dokumen, validasi, dan
 * business rules.
 *
 * Features:
 * - Calculate audit readiness score (0-100)
 * - Determine compliance level (GREEN/YELLOW/RED)
 * - Run audit checks
 * - Validate business rules
 * - Provide actionable recommendations
 * - Generate compliance report
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import workflowEngine from './WorkflowEngine.js'
import { validateForDocument, validateMasterData } from '../../utils/masterDataValidator.js'
import fiscalYearContext from '../fiscal/FiscalYearContext.js'

/**
 * Compliance levels
 */
export const COMPLIANCE_LEVELS = {
  GREEN: 'GREEN',
  YELLOW: 'YELLOW',
  RED: 'RED'
}

/**
 * Compliance Engine
 */
export class ComplianceEngine {
  constructor() {
    this.workflowEngine = workflowEngine
  }

  /**
   * Calculate audit readiness score
   *
   * @param {Object} workflowInstance - Workflow instance
   * @param {Object} masterData - Master data
   * @returns {Promise<Object>} Compliance report
   *
   * Score breakdown:
   * - Required documents complete: 40 points
   * - All steps complete: 30 points
   * - Critical checks passed: 20 points
   * - No warnings: 10 points
   * Total: 100 points
   */
  async calculateAuditReadiness(workflowInstance, masterData) {
    const { workflow, completedSteps } = workflowInstance

    let score = 0
    const issues = {
      critical: [],
      warnings: [],
      missing: []
    }

    // 1. Check required documents (40 points)
    const documentScore = await this._checkRequiredDocuments(
      workflow,
      masterData,
      issues
    )
    score += documentScore

    // 2. Check step completion (30 points)
    const stepScore = this._checkStepCompletion(
      workflow,
      completedSteps,
      issues
    )
    score += stepScore

    // 3. Run audit checks (20 points)
    const auditCheckScore = await this._runAuditChecks(
      workflow,
      masterData,
      issues
    )
    score += auditCheckScore

    // 4. Check for warnings (10 points)
    const warningScore = this._checkWarnings(issues)
    score += warningScore

    // Determine compliance level
    const complianceLevel = this._determineComplianceLevel(
      score,
      workflow.complianceLevel
    )

    // Generate recommendations
    const recommendations = this._generateRecommendations(issues, workflow)

    // FASE 4.5: Add fiscal year context
    const fiscalYearInfo = {
      tahunAnggaran: workflowInstance.tahunAnggaran || fiscalYearContext.getActiveYear(),
      fiscalYearMode: workflowInstance.fiscalYearMode || fiscalYearContext.getMode(),
      isReconstruction: workflowInstance.isReconstruction || false
    }

    return {
      score: Math.round(score),
      complianceLevel,
      status: complianceLevel.label,
      icon: complianceLevel.icon,
      color: complianceLevel.color,
      issues,
      recommendations,
      breakdown: {
        documentsScore: Math.round(documentScore),
        stepsScore: Math.round(stepScore),
        auditChecksScore: Math.round(auditCheckScore),
        warningsScore: Math.round(warningScore)
      },
      summary: this._generateSummary(score, issues, complianceLevel),
      timestamp: new Date().toISOString(),
      // FASE 4.5: Fiscal Year Context
      ...fiscalYearInfo
    }
  }

  /**
   * Check required documents (40 points max)
   * @private
   */
  async _checkRequiredDocuments(workflow, masterData, issues) {
    const requiredDocs = workflow.requiredDocuments || []

    if (requiredDocs.length === 0) {
      return 40 // No required docs, full score
    }

    let completedDocs = 0

    for (const docType of requiredDocs) {
      try {
        const validation = validateForDocument(masterData, docType)

        if (validation.valid) {
          completedDocs++
        } else {
          issues.missing.push({
            type: 'DOCUMENT',
            document: docType,
            message: `Dokumen ${docType} belum lengkap`,
            errors: validation.errors
          })
        }
      } catch (error) {
        issues.missing.push({
          type: 'DOCUMENT',
          document: docType,
          message: `Dokumen ${docType} belum dapat divalidasi`,
          error: error.message
        })
      }
    }

    const percentage = completedDocs / requiredDocs.length
    return percentage * 40
  }

  /**
   * Check step completion (30 points max)
   * @private
   */
  _checkStepCompletion(workflow, completedSteps, issues) {
    const requiredSteps = workflow.steps.filter(s => s.required)

    if (requiredSteps.length === 0) {
      return 30 // No required steps, full score
    }

    const completedRequired = requiredSteps.filter(s =>
      completedSteps.includes(s.id)
    ).length

    const incompleteSteps = requiredSteps.filter(
      s => !completedSteps.includes(s.id)
    )

    for (const step of incompleteSteps) {
      issues.missing.push({
        type: 'STEP',
        step: step.id,
        label: step.label,
        message: `Step "${step.label}" belum selesai`,
        helpText: step.helpText
      })
    }

    const percentage = completedRequired / requiredSteps.length
    return percentage * 30
  }

  /**
   * Run audit checks (20 points max)
   * @private
   */
  async _runAuditChecks(workflow, masterData, issues) {
    const auditChecks = workflow.auditChecks || []

    if (auditChecks.length === 0) {
      return 20 // No audit checks, full score
    }

    let passedChecks = 0
    let criticalFailed = 0

    for (const check of auditChecks) {
      const result = this._evaluateAuditCheck(check, masterData)

      if (result.passed) {
        passedChecks++
      } else {
        const issue = {
          type: check.severity === 'critical' ? 'CRITICAL' : 'WARNING',
          check: check.id,
          rule: check.rule,
          message: check.message,
          field: check.field,
          severity: check.severity
        }

        if (check.severity === 'critical') {
          issues.critical.push(issue)
          criticalFailed++
        } else {
          issues.warnings.push(issue)
        }
      }
    }

    // Critical checks are weighted more heavily
    if (criticalFailed > 0) {
      return 0 // Any critical failure = 0 points
    }

    const percentage = passedChecks / auditChecks.length
    return percentage * 20
  }

  /**
   * Evaluate single audit check
   * @private
   */
  _evaluateAuditCheck(check, masterData) {
    try {
      // Handle different types of checks
      if (check.comparison) {
        return this._evaluateComparison(check, masterData)
      }

      if (check.validation) {
        return this._evaluateValidation(check, masterData)
      }

      if (check.formula) {
        return this._evaluateFormula(check, masterData)
      }

      // Default: assume passed if field exists
      return {
        passed: !!masterData[check.field],
        value: masterData[check.field]
      }
    } catch (error) {
      console.error(`Audit check failed: ${check.id}`, error)
      return { passed: false, error: error.message }
    }
  }

  /**
   * Evaluate comparison check (e.g., date1 >= date2)
   * @private
   */
  _evaluateComparison(check, masterData) {
    const value1 = masterData[check.field]
    const value2 = masterData[check.compareWith]

    if (!value1 || !value2) {
      return { passed: false, reason: 'Missing values' }
    }

    // Convert to dates if needed
    const val1 = value1 instanceof Date ? value1 : new Date(value1)
    const val2 = value2 instanceof Date ? value2 : new Date(value2)

    let passed = false

    switch (check.comparison) {
      case 'gte':
        passed = val1 >= val2
        break
      case 'lte':
        passed = val1 <= val2
        break
      case 'gt':
        passed = val1 > val2
        break
      case 'lt':
        passed = val1 < val2
        break
      case 'eq':
        passed = val1.getTime() === val2.getTime()
        break
      default:
        passed = false
    }

    return { passed, value1, value2 }
  }

  /**
   * Evaluate validation check
   * @private
   */
  _evaluateValidation(check, masterData) {
    const value = masterData[check.field]

    switch (check.validation) {
      case 'not_empty':
        return { passed: !!value && value !== '' }

      case 'array_min_length':
        return {
          passed: Array.isArray(value) && value.length >= check.minLength
        }

      case 'similar_to':
        const compareValue = masterData[check.compareWith]
        return {
          passed: this._isSimilar(value, compareValue)
        }

      case 'custom':
        // Would call custom validator
        return { passed: true } // Placeholder

      default:
        return { passed: false, reason: 'Unknown validation type' }
    }
  }

  /**
   * Evaluate formula check
   * @private
   */
  _evaluateFormula(check, masterData) {
    // Simple formula evaluation (placeholder)
    // In production, would use a safe formula evaluator
    try {
      const expectedValue = masterData[check.field]
      // TODO: Evaluate check.formula with masterData
      return { passed: true } // Placeholder
    } catch (error) {
      return { passed: false, error: error.message }
    }
  }

  /**
   * Check similarity between two strings
   * @private
   */
  _isSimilar(str1, str2, threshold = 0.5) {
    if (!str1 || !str2) return false

    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()

    if (s1 === s2) return true

    // Simple word overlap check
    const words1 = s1.split(/\s+/)
    const words2 = s2.split(/\s+/)

    const overlap = words1.filter(w => words2.includes(w)).length
    const similarity = overlap / Math.max(words1.length, words2.length)

    return similarity >= threshold
  }

  /**
   * Check warnings (10 points max)
   * @private
   */
  _checkWarnings(issues) {
    if (issues.warnings.length === 0) {
      return 10
    }

    // Lose 2 points per warning, min 0
    const deduction = issues.warnings.length * 2
    return Math.max(0, 10 - deduction)
  }

  /**
   * Determine compliance level based on score
   * @private
   */
  _determineComplianceLevel(score, complianceLevels) {
    if (score >= complianceLevels.GREEN.minScore) {
      return complianceLevels.GREEN
    }

    if (score >= complianceLevels.YELLOW.minScore) {
      return complianceLevels.YELLOW
    }

    return complianceLevels.RED
  }

  /**
   * Generate recommendations
   * @private
   */
  _generateRecommendations(issues, workflow) {
    const recommendations = []

    // Critical issues first
    if (issues.critical.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        title: '⚠️ Perbaiki masalah kritis berikut:',
        items: issues.critical.map(i => i.message)
      })
    }

    // Missing documents/steps
    if (issues.missing.length > 0) {
      const missingDocs = issues.missing.filter(i => i.type === 'DOCUMENT')
      const missingSteps = issues.missing.filter(i => i.type === 'STEP')

      if (missingDocs.length > 0) {
        recommendations.push({
          priority: 'HIGH',
          title: '📄 Lengkapi dokumen berikut:',
          items: missingDocs.map(i => i.message)
        })
      }

      if (missingSteps.length > 0) {
        recommendations.push({
          priority: 'HIGH',
          title: '✅ Selesaikan step berikut:',
          items: missingSteps.map(i => i.message)
        })
      }
    }

    // Warnings
    if (issues.warnings.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        title: '💡 Perhatian:',
        items: issues.warnings.map(i => i.message)
      })
    }

    // Add tips if available
    if (workflow.tips && workflow.tips.length > 0) {
      recommendations.push({
        priority: 'INFO',
        title: '💡 Tips:',
        items: workflow.tips
      })
    }

    return recommendations
  }

  /**
   * Generate human-readable summary
   * @private
   */
  _generateSummary(score, issues, complianceLevel) {
    const totalIssues =
      issues.critical.length +
      issues.warnings.length +
      issues.missing.length

    if (score >= 95) {
      return {
        message: 'Data Anda sudah sangat rapi dan siap untuk audit! 🎉',
        detail: 'Semua dokumen lengkap, semua validasi terpenuhi. Anda bisa generate Paket SPJ dengan percaya diri.',
        tone: 'positive'
      }
    }

    if (score >= 80) {
      return {
        message: 'Hampir sempurna! Tinggal sedikit lagi.',
        detail: `Ada ${totalIssues} hal yang perlu diperhatikan. Setelah diperbaiki, paket ini akan benar-benar siap diperiksa.`,
        tone: 'encouraging'
      }
    }

    if (score >= 60) {
      return {
        message: 'Progres bagus, tapi masih ada yang perlu dilengkapi.',
        detail: `${issues.missing.length} dokumen/step masih kurang. Mari kita selesaikan satu per satu.`,
        tone: 'guiding'
      }
    }

    return {
      message: 'Mari kita lengkapi data secara bertahap.',
      detail: `Masih ada ${issues.missing.length} dokumen/step yang perlu diselesaikan. Tidak apa-apa, kita kerjakan step by step.`,
      tone: 'supportive'
    }
  }

  /**
   * Get quick status
   * @param {number} score - Audit readiness score
   * @returns {Object} Quick status
   */
  getQuickStatus(score) {
    if (score >= 95) {
      return {
        label: 'Siap Audit',
        icon: '✅',
        color: '#22c55e',
        message: 'Paket SPJ Anda siap untuk audit!'
      }
    }

    if (score >= 80) {
      return {
        label: 'Hampir Lengkap',
        icon: '⚠️',
        color: '#eab308',
        message: 'Tinggal beberapa hal lagi'
      }
    }

    return {
      label: 'Perlu Perbaikan',
      icon: '❌',
      color: '#ef4444',
      message: 'Ada beberapa hal yang perlu dilengkapi'
    }
  }

  /**
   * FASE 4.5: Get compliance reports for specific fiscal year
   * @param {number} tahunAnggaran - Fiscal year
   * @returns {Promise<Array>} Compliance reports for that year
   */
  async getReportsByFiscalYear(tahunAnggaran) {
    // TODO: Integrate with database query
    // return await ComplianceReportModel.find({ tahunAnggaran })
    console.log(`[ComplianceEngine] Query reports for TA ${tahunAnggaran}`)
    return []
  }

  /**
   * FASE 4.5: Calculate cross-year compliance summary
   * @returns {Promise<Array>} Summary per fiscal year
   */
  async getCrossYearSummary() {
    // TODO: Integrate with database aggregation
    // return await ComplianceReportModel.aggregate([
    //   { $group: { _id: '$tahunAnggaran', avgScore: { $avg: '$score' } } }
    // ])
    console.log('[ComplianceEngine] Query cross-year summary')
    return []
  }

  /**
   * FASE 4.5: Add reconstruction watermark to compliance report
   * @param {Object} report - Compliance report
   * @returns {Object} Report with watermark
   */
  addReconstructionWatermark(report) {
    if (!report.isReconstruction) {
      return report
    }

    return {
      ...report,
      watermark: {
        text: `REKONSTRUKSI ADMINISTRASI TAHUN ANGGARAN ${report.tahunAnggaran}`,
        timestamp: new Date().toISOString(),
        originalCalculation: true,
        note: 'Dokumen ini hasil dari rekonstruksi administrasi dan bukan dari proses asli tahun berjalan'
      },
      summary: {
        ...report.summary,
        message: `[REKONSTRUKSI] ${report.summary.message}`,
        detail: `Data ini hasil rekonstruksi. ${report.summary.detail}`
      }
    }
  }

  /**
   * FASE 4.5: Create compliance filter with fiscal year context
   * @param {Object} additionalFilters - Additional filters
   * @returns {Object} Filter object with fiscal year
   */
  createFiscalYearFilter(additionalFilters = {}) {
    return fiscalYearContext.createFilter(additionalFilters)
  }
}

/**
 * Singleton instance
 */
const complianceEngine = new ComplianceEngine()

export default complianceEngine
