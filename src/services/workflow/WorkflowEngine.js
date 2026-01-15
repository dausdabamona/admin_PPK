/**
 * ============================================================================
 * WORKFLOW ENGINE - Process Workflow Executor
 * ============================================================================
 *
 * Service untuk me-load dan mengeksekusi workflow berbasis proses.
 *
 * Features:
 * - Load workflow definitions dari JSON
 * - Track progress per step
 * - Validate step completion
 * - Calculate overall progress
 * - Provide next step suggestions
 * - Check dependencies
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import * as path from 'path'
import { fileURLToPath } from 'url'
import fiscalYearContext from '../fiscal/FiscalYearContext.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Available workflow types
 */
export const WORKFLOW_TYPES = {
  LS_KONTRAK: 'LS_KONTRAK',
  UP: 'UP',
  TUP: 'TUP',
  SWAKELOLA: 'SWAKELOLA',
  PERJADIN: 'PERJADIN',
  HONORARIUM: 'HONORARIUM'
}

/**
 * Workflow Engine
 */
export class WorkflowEngine {
  constructor() {
    this.workflows = new Map()
    this.loaded = false
  }

  /**
   * Load all workflow definitions
   * @returns {Promise<void>}
   */
  async loadWorkflows() {
    if (this.loaded) return

    try {
      const workflowFiles = {
        LS_KONTRAK: '../../../workflows/LS.workflow.json',
        UP: '../../../workflows/UP.workflow.json',
        TUP: '../../../workflows/TUP.workflow.json',
        SWAKELOLA: '../../../workflows/Swakelola.workflow.json',
        PERJADIN: '../../../workflows/Perjadin.workflow.json',
        HONORARIUM: '../../../workflows/Honorarium.workflow.json'
      }

      for (const [type, filePath] of Object.entries(workflowFiles)) {
        try {
          const fullPath = path.resolve(__dirname, filePath)
          const workflow = await import(fullPath, { assert: { type: 'json' } })
          this.workflows.set(type, workflow.default)
        } catch (error) {
          console.error(`Failed to load workflow ${type}:`, error.message)
        }
      }

      this.loaded = true
      console.log(`[WorkflowEngine] Loaded ${this.workflows.size} workflows`)
    } catch (error) {
      console.error('[WorkflowEngine] Failed to load workflows:', error)
      throw error
    }
  }

  /**
   * Get workflow by type
   * @param {string} workflowType - Workflow type (LS_KONTRAK, UP, etc)
   * @returns {Object} Workflow definition
   */
  async getWorkflow(workflowType) {
    if (!this.loaded) {
      await this.loadWorkflows()
    }

    const workflow = this.workflows.get(workflowType)
    if (!workflow) {
      throw new Error(`Workflow ${workflowType} not found`)
    }

    return workflow
  }

  /**
   * Get all available workflows
   * @returns {Array} List of workflows with metadata
   */
  async getAllWorkflows() {
    if (!this.loaded) {
      await this.loadWorkflows()
    }

    return Array.from(this.workflows.values()).map(wf => ({
      process: wf.process,
      processName: wf.processName,
      description: wf.description,
      category: wf.category,
      applicableTo: wf.applicableTo,
      requiredDocuments: wf.requiredDocuments,
      optionalDocuments: wf.optionalDocuments,
      totalSteps: wf.steps.length
    }))
  }

  /**
   * Initialize workflow instance for master data
   * @param {string} workflowType - Workflow type
   * @param {Object} masterData - Master data object
   * @param {Object} options - Additional options { tahunAnggaran, isReconstruction }
   * @returns {Promise<Object>} Workflow instance
   */
  async initializeWorkflow(workflowType, masterData = {}, options = {}) {
    const workflow = await this.getWorkflow(workflowType)

    // Get fiscal year context
    const tahunAnggaran = options.tahunAnggaran || fiscalYearContext.getActiveYear()
    const fiscalYearMode = options.fiscalYearMode || fiscalYearContext.getMode()
    const isReconstruction = options.isReconstruction || fiscalYearContext.isReconstructionMode()

    return {
      workflowType,
      workflow,
      masterData,
      currentStep: 0,
      completedSteps: [],
      progress: {
        totalSteps: workflow.steps.length,
        completedSteps: 0,
        percentage: 0
      },
      status: 'NOT_STARTED',
      // FASE 4.5: Fiscal Year Context
      tahunAnggaran,
      fiscalYearMode,
      isReconstruction,
      reconstructionDate: isReconstruction ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Get current step info
   * @param {Object} workflowInstance - Workflow instance
   * @returns {Object} Current step info
   */
  getCurrentStep(workflowInstance) {
    const { workflow, currentStep } = workflowInstance

    if (currentStep >= workflow.steps.length) {
      return null // Workflow completed
    }

    return workflow.steps[currentStep]
  }

  /**
   * Get next step info
   * @param {Object} workflowInstance - Workflow instance
   * @returns {Object|null} Next step info or null if completed
   */
  getNextStep(workflowInstance) {
    const { workflow, currentStep } = workflowInstance

    if (currentStep + 1 >= workflow.steps.length) {
      return null // No more steps
    }

    return workflow.steps[currentStep + 1]
  }

  /**
   * Check if step can be started (dependencies met)
   * @param {Object} workflowInstance - Workflow instance
   * @param {string} stepId - Step ID to check
   * @returns {Object} { canStart, missingDependencies }
   */
  canStartStep(workflowInstance, stepId) {
    const { workflow, completedSteps } = workflowInstance

    const step = workflow.steps.find(s => s.id === stepId)
    if (!step) {
      throw new Error(`Step ${stepId} not found`)
    }

    if (!step.dependencies || step.dependencies.length === 0) {
      return { canStart: true, missingDependencies: [] }
    }

    const missingDependencies = step.dependencies.filter(
      depId => !completedSteps.includes(depId)
    )

    return {
      canStart: missingDependencies.length === 0,
      missingDependencies
    }
  }

  /**
   * Mark step as completed
   * @param {Object} workflowInstance - Workflow instance
   * @param {string} stepId - Step ID to complete
   * @returns {Object} Updated workflow instance
   */
  completeStep(workflowInstance, stepId) {
    const { workflow, completedSteps } = workflowInstance

    // Check if step exists
    const stepIndex = workflow.steps.findIndex(s => s.id === stepId)
    if (stepIndex === -1) {
      throw new Error(`Step ${stepId} not found`)
    }

    // Check if already completed
    if (completedSteps.includes(stepId)) {
      return workflowInstance // Already completed
    }

    // Check dependencies
    const check = this.canStartStep(workflowInstance, stepId)
    if (!check.canStart) {
      throw new Error(
        `Cannot complete step ${stepId}: missing dependencies ${check.missingDependencies.join(', ')}`
      )
    }

    // Mark as completed
    completedSteps.push(stepId)

    // Update progress
    const totalSteps = workflow.steps.filter(s => s.required).length
    const completedRequired = workflow.steps.filter(
      s => s.required && completedSteps.includes(s.id)
    ).length

    const percentage = Math.round((completedRequired / totalSteps) * 100)

    // Update current step
    let currentStep = stepIndex + 1

    // Determine status
    let status = 'IN_PROGRESS'
    if (completedRequired === totalSteps) {
      status = 'COMPLETED'
    } else if (completedRequired === 0) {
      status = 'NOT_STARTED'
    }

    return {
      ...workflowInstance,
      completedSteps,
      currentStep,
      progress: {
        totalSteps: workflow.steps.length,
        completedSteps: completedSteps.length,
        percentage
      },
      status,
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Get workflow progress summary
   * @param {Object} workflowInstance - Workflow instance
   * @returns {Object} Progress summary
   */
  getProgressSummary(workflowInstance) {
    const { workflow, completedSteps, currentStep } = workflowInstance

    const requiredSteps = workflow.steps.filter(s => s.required)
    const optionalSteps = workflow.steps.filter(s => !s.required)

    const completedRequired = requiredSteps.filter(s =>
      completedSteps.includes(s.id)
    ).length

    const completedOptional = optionalSteps.filter(s =>
      completedSteps.includes(s.id)
    ).length

    const currentStepInfo = this.getCurrentStep(workflowInstance)
    const nextStepInfo = this.getNextStep(workflowInstance)

    return {
      totalSteps: workflow.steps.length,
      requiredSteps: requiredSteps.length,
      optionalSteps: optionalSteps.length,
      completedSteps: completedSteps.length,
      completedRequired,
      completedOptional,
      percentage: workflowInstance.progress.percentage,
      currentStep: currentStepInfo,
      nextStep: nextStepInfo,
      status: workflowInstance.status
    }
  }

  /**
   * Get recommended next actions
   * @param {Object} workflowInstance - Workflow instance
   * @returns {Array<string>} List of recommended actions
   */
  getRecommendedActions(workflowInstance) {
    const currentStep = this.getCurrentStep(workflowInstance)
    const nextStep = this.getNextStep(workflowInstance)

    const actions = []

    if (currentStep) {
      actions.push(
        `Selesaikan step saat ini: "${currentStep.label}"`
      )

      if (currentStep.helpText) {
        actions.push(`💡 Tip: ${currentStep.helpText}`)
      }
    }

    if (nextStep) {
      actions.push(
        `Siapkan untuk step berikutnya: "${nextStep.label}"`
      )

      if (nextStep.estimatedDuration) {
        actions.push(
          `⏱️ Estimasi waktu: ${nextStep.estimatedDuration}`
        )
      }
    }

    if (!currentStep && !nextStep) {
      actions.push(
        '✅ Semua step selesai! Anda bisa generate Paket SPJ sekarang.'
      )
    }

    return actions
  }

  /**
   * Validate step completion against master data
   * @param {Object} workflowInstance - Workflow instance
   * @param {string} stepId - Step ID
   * @param {Object} masterData - Master data
   * @returns {Object} { valid, errors }
   */
  validateStepCompletion(workflowInstance, stepId, masterData) {
    const { workflow } = workflowInstance

    const step = workflow.steps.find(s => s.id === stepId)
    if (!step) {
      throw new Error(`Step ${stepId} not found`)
    }

    const errors = []

    // Check validations
    if (step.validations && step.validations.length > 0) {
      for (const validation of step.validations) {
        // This would integrate with masterDataValidator
        // For now, just a placeholder
        const isValid = this._checkValidation(validation, masterData)
        if (!isValid) {
          errors.push(`Validation failed: ${validation}`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Check validation (placeholder - will integrate with masterDataValidator)
   * @param {string} validation - Validation rule
   * @param {Object} masterData - Master data
   * @returns {boolean}
   * @private
   */
  _checkValidation(validation, masterData) {
    // TODO: Integrate with masterDataValidator
    // For now, return true
    return true
  }

  /**
   * Get all required documents for workflow
   * @param {string} workflowType - Workflow type
   * @returns {Promise<Array>} List of required documents
   */
  async getRequiredDocuments(workflowType) {
    const workflow = await this.getWorkflow(workflowType)
    return workflow.requiredDocuments || []
  }

  /**
   * Get all optional documents for workflow
   * @param {string} workflowType - Workflow type
   * @returns {Promise<Array>} List of optional documents
   */
  async getOptionalDocuments(workflowType) {
    const workflow = await this.getWorkflow(workflowType)
    return workflow.optionalDocuments || []
  }

  /**
   * Get document order for workflow
   * @param {string} workflowType - Workflow type
   * @returns {Promise<Array>} Document order
   */
  async getDocumentOrder(workflowType) {
    const workflow = await this.getWorkflow(workflowType)
    return workflow.documentOrder || []
  }

  /**
   * Get audit checks for workflow
   * @param {string} workflowType - Workflow type
   * @returns {Promise<Array>} Audit checks
   */
  async getAuditChecks(workflowType) {
    const workflow = await this.getWorkflow(workflowType)
    return workflow.auditChecks || []
  }

  /**
   * Get tips for workflow
   * @param {string} workflowType - Workflow type
   * @returns {Promise<Array>} Tips
   */
  async getTips(workflowType) {
    const workflow = await this.getWorkflow(workflowType)
    return workflow.tips || []
  }

  /**
   * Get common mistakes for workflow
   * @param {string} workflowType - Workflow type
   * @returns {Promise<Array>} Common mistakes
   */
  async getCommonMistakes(workflowType) {
    const workflow = await this.getWorkflow(workflowType)
    return workflow.commonMistakes || []
  }

  /**
   * FASE 4.5: Get workflow instances for specific fiscal year
   * @param {number} tahunAnggaran - Fiscal year
   * @returns {Promise<Array>} Workflow instances for that year
   */
  async getInstancesByFiscalYear(tahunAnggaran) {
    // TODO: Integrate with database query
    // return await WorkflowInstanceModel.find({ tahunAnggaran })
    console.log(`[WorkflowEngine] Query instances for TA ${tahunAnggaran}`)
    return []
  }

  /**
   * FASE 4.5: Create workflow filter with fiscal year context
   * @param {Object} additionalFilters - Additional filters
   * @returns {Object} Filter object with fiscal year
   */
  createFiscalYearFilter(additionalFilters = {}) {
    return fiscalYearContext.createFilter(additionalFilters)
  }

  /**
   * FASE 4.5: Wrap workflow instance with fiscal year context
   * @param {Object} instance - Workflow instance
   * @returns {Object} Instance with fiscal year context
   */
  wrapWithFiscalYearContext(instance) {
    return fiscalYearContext.wrapWithContext(instance)
  }

  /**
   * FASE 4.5: Check if workflow is in reconstruction mode
   * @param {Object} workflowInstance - Workflow instance
   * @returns {boolean}
   */
  isReconstructionWorkflow(workflowInstance) {
    return workflowInstance.isReconstruction === true
  }

  /**
   * FASE 4.5: Get reconstruction metadata
   * @param {Object} workflowInstance - Workflow instance
   * @returns {Object|null} Reconstruction metadata
   */
  getReconstructionMetadata(workflowInstance) {
    if (!workflowInstance.isReconstruction) {
      return null
    }

    return {
      isReconstruction: true,
      reconstructionDate: workflowInstance.reconstructionDate,
      tahunAnggaran: workflowInstance.tahunAnggaran,
      fiscalYearMode: workflowInstance.fiscalYearMode
    }
  }
}

/**
 * Singleton instance
 */
const workflowEngine = new WorkflowEngine()

export default workflowEngine
