/**
 * ============================================================================
 * PROCESS WIZARD - Complete Integration Example
 * ============================================================================
 *
 * Contoh lengkap integrasi semua Process Wizard components:
 * - ProcessSelector
 * - ProcessStepper
 * - ComplianceChecklist
 * - AuditReadinessPanel
 * - useWorkflow hook
 *
 * Flow:
 * 1. User selects process type → ProcessSelector
 * 2. System initializes workflow → useWorkflow
 * 3. User sees stepper & progress → ProcessStepper
 * 4. User fills data, completes steps
 * 5. System calculates compliance → ComplianceEngine
 * 6. User sees audit readiness → AuditReadinessPanel & ComplianceChecklist
 * 7. When ready (score ≥95%), user generates SPJ package
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import React, { useState } from 'react'
import { Card, CardBody, Tabs, Tab, Button, Divider } from '@nextui-org/react'
import {
  Home,
  List,
  CheckSquare,
  BarChart3,
  ArrowLeft
} from 'lucide-react'

import ProcessSelector from './ProcessSelector.jsx'
import ProcessStepper from './ProcessStepper.jsx'
import ComplianceChecklist from './ComplianceChecklist.jsx'
import AuditReadinessPanel from './AuditReadinessPanel.jsx'
import { useWorkflow } from '../../hooks/useWorkflow.js'

/**
 * Main Process Wizard Container
 */
const ProcessWizard = ({ masterData, onMasterDataUpdate }) => {
  // State
  const [selectedProcessType, setSelectedProcessType] = useState(null)
  const [activeTab, setActiveTab] = useState('stepper')

  // Workflow hook
  const {
    workflow,
    workflowInstance,
    progressSummary,
    complianceReport,
    recommendations,
    currentStep,
    nextStep,
    isLoading,
    error,
    completeStep,
    isCompleted,
    isReady,
    completionPercentage,
    complianceScore,
    hasErrors,
    hasWarnings
  } = useWorkflow(selectedProcessType, masterData)

  /**
   * Handle process selection
   */
  const handleProcessSelect = (processType) => {
    setSelectedProcessType(processType)
    setActiveTab('stepper')
  }

  /**
   * Handle step completion
   */
  const handleStepComplete = async (stepId) => {
    const result = await completeStep(stepId)

    if (result.success) {
      console.log('[ProcessWizard] Step completed:', stepId)
      // You can show a toast notification here
    } else {
      console.error('[ProcessWizard] Step completion failed:', result.error)
      // Show error notification
    }
  }

  /**
   * Handle Generate Package
   */
  const handleGeneratePackage = async () => {
    console.log('[ProcessWizard] Generating SPJ package...')

    // TODO: Integrate with DocumentGenerationService
    // const result = await DocumentGenerationService.generate(masterData, {
    //   workflowType: selectedProcessType,
    //   includePDFs: true,
    //   createZIP: true
    // })

    alert('Generate Paket SPJ akan diintegrasikan dengan DocumentGenerationService!')
  }

  /**
   * Handle action from checklist
   */
  const handleChecklistAction = (item) => {
    console.log('[ProcessWizard] Checklist action:', item)

    // Navigate to relevant form/step
    if (item.actionType === 'document') {
      // Find step that generates this document
      const step = workflow?.steps.find(s =>
        s.documents && s.documents.includes(item.actionTarget)
      )
      if (step) {
        setActiveTab('stepper')
        // Scroll to step or highlight it
      }
    }

    if (item.actionType === 'audit-check') {
      // Navigate to form field that needs fixing
      alert(`Navigasi ke field: ${item.actionTarget}`)
    }
  }

  /**
   * Handle back to process selection
   */
  const handleBackToSelection = () => {
    setSelectedProcessType(null)
    setActiveTab('stepper')
  }

  // Show process selector if no process selected
  if (!selectedProcessType) {
    return <ProcessSelector onProcessSelect={handleProcessSelect} />
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <p className="text-gray-500">Memuat workflow...</p>
        </CardBody>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <p className="text-red-500">Error: {error}</p>
          <Button
            color="primary"
            variant="flat"
            onPress={handleBackToSelection}
            className="mt-4"
          >
            Kembali ke Pilihan Proses
          </Button>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header with Back Button */}
      <Card className="shadow-lg">
        <CardBody className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              isIconOnly
              variant="light"
              onPress={handleBackToSelection}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{workflow?.processName}</h1>
              <p className="text-sm text-gray-500">{workflow?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-500">
                {completionPercentage}%
              </div>
              <div className="text-xs text-gray-500">Progress</div>
            </div>
            <Divider orientation="vertical" className="h-12" />
            <div className="text-right">
              <div className="text-2xl font-bold text-green-500">
                {complianceScore}%
              </div>
              <div className="text-xs text-gray-500">Compliance</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tabs (Stepper & Checklist) */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardBody className="p-0">
              <Tabs
                aria-label="Process tabs"
                selectedKey={activeTab}
                onSelectionChange={setActiveTab}
                fullWidth
                size="lg"
                className="px-4 pt-4"
              >
                <Tab
                  key="stepper"
                  title={
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4" />
                      <span>Langkah-Langkah</span>
                    </div>
                  }
                >
                  <div className="p-4">
                    <ProcessStepper
                      workflow={workflow}
                      workflowInstance={workflowInstance}
                      onStepComplete={handleStepComplete}
                    />
                  </div>
                </Tab>

                <Tab
                  key="checklist"
                  title={
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" />
                      <span>Checklist</span>
                      {hasErrors && (
                        <span className="w-2 h-2 bg-red-500 rounded-full" />
                      )}
                      {!hasErrors && hasWarnings && (
                        <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                      )}
                    </div>
                  }
                >
                  <div className="p-4">
                    <ComplianceChecklist
                      complianceReport={complianceReport}
                      workflow={workflow}
                      onActionClick={handleChecklistAction}
                    />
                  </div>
                </Tab>
              </Tabs>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Audit Readiness Panel */}
        <div className="lg:col-span-1">
          <AuditReadinessPanel
            complianceReport={complianceReport}
            workflowInstance={workflowInstance}
            onGeneratePackage={handleGeneratePackage}
            isLoading={false}
          />
        </div>
      </div>

      {/* Quick Actions Footer */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-none">
        <CardBody className="flex flex-row items-center justify-between">
          <div>
            <p className="font-semibold">
              {currentStep
                ? `Langkah saat ini: ${currentStep.label}`
                : isCompleted
                ? 'Semua langkah selesai!'
                : 'Belum ada langkah yang dimulai'}
            </p>
            {nextStep && (
              <p className="text-sm text-gray-600">
                Berikutnya: {nextStep.label}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {recommendations.length > 0 && (
              <Button
                color="primary"
                variant="flat"
                onPress={() => setActiveTab('checklist')}
              >
                Lihat Rekomendasi ({recommendations.length})
              </Button>
            )}
            {isReady && (
              <Button
                color="success"
                onPress={handleGeneratePackage}
              >
                Generate Paket SPJ
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export default ProcessWizard

/**
 * =============================================================================
 * USAGE EXAMPLE
 * =============================================================================
 *
 * import ProcessWizard from './components/process-wizard/ProcessWizard.example.jsx'
 *
 * function App() {
 *   const [masterData, setMasterData] = useState({
 *     // Your master data structure
 *     masterId: 'MDK-2024-000001',
 *     satkerNama: 'Dit. Sistem Perbendaharaan',
 *     ppkNama: 'John Doe',
 *     // ... etc
 *   })
 *
 *   const handleMasterDataUpdate = (newData) => {
 *     setMasterData(newData)
 *   }
 *
 *   return (
 *     <ProcessWizard
 *       masterData={masterData}
 *       onMasterDataUpdate={handleMasterDataUpdate}
 *     />
 *   )
 * }
 *
 * =============================================================================
 */
