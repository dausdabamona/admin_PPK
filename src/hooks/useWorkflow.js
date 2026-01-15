/**
 * ============================================================================
 * useWorkflow - Custom Hook for Workflow State Management
 * ============================================================================
 *
 * Centralized state management untuk Process Wizard.
 * Menghubungkan UI components dengan WorkflowEngine dan ComplianceEngine.
 *
 * Features:
 * - Initialize workflow
 * - Track progress
 * - Complete steps
 * - Calculate compliance
 * - Provide recommendations
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react'
import workflowEngine from '../services/workflow/WorkflowEngine.js'
import complianceEngine from '../services/workflow/ComplianceEngine.js'

/**
 * useWorkflow Hook
 *
 * @param {string} workflowType - Type of workflow (LS_KONTRAK, UP, etc.)
 * @param {Object} masterData - Master data object
 * @returns {Object} Workflow state and methods
 */
export const useWorkflow = (workflowType, masterData) => {
  // State
  const [workflow, setWorkflow] = useState(null)
  const [workflowInstance, setWorkflowInstance] = useState(null)
  const [progressSummary, setProgressSummary] = useState(null)
  const [complianceReport, setComplianceReport] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [currentStep, setCurrentStep] = useState(null)
  const [nextStep, setNextStep] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Initialize workflow
   */
  const initializeWorkflow = useCallback(async () => {
    if (!workflowType || !masterData) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Load workflow definition
      const workflowDef = await workflowEngine.getWorkflow(workflowType)
      setWorkflow(workflowDef)

      // Initialize workflow instance
      const instance = await workflowEngine.initializeWorkflow(
        workflowType,
        masterData
      )
      setWorkflowInstance(instance)

      // Get initial progress
      const progress = workflowEngine.getProgressSummary(instance)
      setProgressSummary(progress)
      setCurrentStep(progress.currentStep)
      setNextStep(progress.nextStep)

      // Calculate initial compliance
      const compliance = await complianceEngine.calculateAuditReadiness(
        instance,
        masterData
      )
      setComplianceReport(compliance)
      setRecommendations(compliance.recommendations || [])

      setIsLoading(false)
    } catch (err) {
      console.error('[useWorkflow] Initialization error:', err)
      setError(err.message)
      setIsLoading(false)
    }
  }, [workflowType, masterData])

  /**
   * Complete a step
   */
  const completeStep = useCallback(
    async (stepId) => {
      if (!workflowInstance) {
        console.error('[useWorkflow] No workflow instance')
        return
      }

      try {
        // Mark step as completed
        const updated = workflowEngine.completeStep(workflowInstance, stepId)
        setWorkflowInstance(updated)

        // Update progress
        const progress = workflowEngine.getProgressSummary(updated)
        setProgressSummary(progress)
        setCurrentStep(progress.currentStep)
        setNextStep(progress.nextStep)

        // Recalculate compliance
        await updateCompliance(updated)

        return { success: true, instance: updated }
      } catch (err) {
        console.error('[useWorkflow] Complete step error:', err)
        return { success: false, error: err.message }
      }
    },
    [workflowInstance, masterData]
  )

  /**
   * Update compliance report
   */
  const updateCompliance = useCallback(
    async (instance = workflowInstance) => {
      if (!instance || !masterData) return

      try {
        const compliance = await complianceEngine.calculateAuditReadiness(
          instance,
          masterData
        )
        setComplianceReport(compliance)
        setRecommendations(compliance.recommendations || [])
      } catch (err) {
        console.error('[useWorkflow] Update compliance error:', err)
      }
    },
    [workflowInstance, masterData]
  )

  /**
   * Get recommended actions
   */
  const getRecommendedActions = useCallback(() => {
    if (!workflowInstance) return []

    return workflowEngine.getRecommendedActions(workflowInstance)
  }, [workflowInstance])

  /**
   * Check if can start step
   */
  const canStartStep = useCallback(
    (stepId) => {
      if (!workflowInstance) return { canStart: false, missingDependencies: [] }

      return workflowEngine.canStartStep(workflowInstance, stepId)
    },
    [workflowInstance]
  )

  /**
   * Validate step completion
   */
  const validateStepCompletion = useCallback(
    (stepId) => {
      if (!workflowInstance || !masterData) {
        return { valid: false, errors: ['No workflow instance or master data'] }
      }

      return workflowEngine.validateStepCompletion(
        workflowInstance,
        stepId,
        masterData
      )
    },
    [workflowInstance, masterData]
  )

  /**
   * Reset workflow
   */
  const resetWorkflow = useCallback(async () => {
    await initializeWorkflow()
  }, [initializeWorkflow])

  /**
   * Update master data and recalculate
   */
  const updateMasterData = useCallback(
    async (newMasterData) => {
      if (!workflowInstance) return

      // Recalculate compliance with new data
      const compliance = await complianceEngine.calculateAuditReadiness(
        workflowInstance,
        newMasterData
      )
      setComplianceReport(compliance)
      setRecommendations(compliance.recommendations || [])
    },
    [workflowInstance]
  )

  // Initialize on mount or when workflowType/masterData changes
  useEffect(() => {
    initializeWorkflow()
  }, [initializeWorkflow])

  // Auto-update compliance when masterData changes
  useEffect(() => {
    if (workflowInstance && masterData) {
      updateCompliance()
    }
  }, [masterData])

  return {
    // State
    workflow,
    workflowInstance,
    progressSummary,
    complianceReport,
    recommendations,
    currentStep,
    nextStep,
    isLoading,
    error,

    // Methods
    completeStep,
    updateCompliance,
    getRecommendedActions,
    canStartStep,
    validateStepCompletion,
    resetWorkflow,
    updateMasterData,

    // Computed values
    isCompleted: progressSummary?.status === 'COMPLETED',
    isReady: complianceReport?.score >= 95,
    completionPercentage: progressSummary?.percentage || 0,
    complianceScore: complianceReport?.score || 0,
    complianceLevel: complianceReport?.complianceLevel,
    hasErrors: complianceReport?.issues?.critical?.length > 0,
    hasWarnings: complianceReport?.issues?.warnings?.length > 0
  }
}

export default useWorkflow
