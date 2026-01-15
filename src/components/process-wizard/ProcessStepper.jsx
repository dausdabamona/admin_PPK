/**
 * ============================================================================
 * PROCESS STEPPER - Visual Workflow Progress Tracker
 * ============================================================================
 *
 * Komponen stepper yang menampilkan progress workflow secara visual.
 * Menunjukkan PPK: "Saya sudah sampai mana, dan tinggal berapa langkah lagi?"
 *
 * Features:
 * - Visual stepper (vertical layout)
 * - Status: ✓ (done), → (current), ○ (pending)
 * - Clickable untuk detail
 * - Show: documents, audit notes, tips, estimated time
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import React, { useState } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Divider
} from '@nextui-org/react'
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Clock,
  FileText,
  AlertCircle,
  Lightbulb,
  ChevronRight,
  Info
} from 'lucide-react'

/**
 * Step Item Component
 */
const StepItem = ({
  step,
  index,
  status,
  isLast,
  onClick
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />
      case 'current':
        return <ArrowRight className="w-6 h-6 text-blue-500 animate-pulse" />
      default:
        return <Circle className="w-6 h-6 text-gray-300" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50'
      case 'current':
        return 'border-blue-500 bg-blue-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  const getTextColor = () => {
    switch (status) {
      case 'completed':
        return 'text-gray-700'
      case 'current':
        return 'text-blue-900 font-semibold'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="relative flex gap-4">
      {/* Vertical Line */}
      {!isLast && (
        <div
          className={`absolute left-3 top-10 bottom-0 w-0.5 ${
            status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
          }`}
        />
      )}

      {/* Step Icon */}
      <div className="relative z-10 flex-shrink-0">
        {getStatusIcon()}
      </div>

      {/* Step Content */}
      <div className="flex-1 pb-8">
        <button
          onClick={() => onClick(step)}
          className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${getStatusColor()}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-gray-500">
                  STEP {step.order}
                </span>
                {step.required && (
                  <Chip size="sm" color="danger" variant="flat">
                    Wajib
                  </Chip>
                )}
                {!step.required && (
                  <Chip size="sm" color="default" variant="flat">
                    Opsional
                  </Chip>
                )}
              </div>
              <h4 className={`font-semibold mb-1 ${getTextColor()}`}>
                {step.label}
              </h4>
              <p className="text-sm text-gray-600 line-clamp-2">
                {step.description}
              </p>

              {/* Quick Info */}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                {step.estimatedDuration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{step.estimatedDuration}</span>
                  </div>
                )}
                {step.documents && step.documents.length > 0 && (
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>{step.documents.length} dokumen</span>
                  </div>
                )}
              </div>
            </div>

            {/* Arrow Icon */}
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
          </div>
        </button>
      </div>
    </div>
  )
}

/**
 * Step Detail Modal
 */
const StepDetailModal = ({ step, isOpen, onClose, onMarkComplete, isCompleted }) => {
  if (!step) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">STEP {step.order}</span>
            {step.required ? (
              <Chip size="sm" color="danger" variant="flat">
                Wajib
              </Chip>
            ) : (
              <Chip size="sm" color="default" variant="flat">
                Opsional
              </Chip>
            )}
          </div>
          <h3 className="text-xl font-bold">{step.label}</h3>
        </ModalHeader>

        <ModalBody className="gap-4">
          {/* Description */}
          <div>
            <p className="text-gray-700">{step.description}</p>
          </div>

          {/* Estimated Duration */}
          {step.estimatedDuration && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-sm font-semibold">Estimasi Waktu</div>
                <div className="text-sm text-gray-600">{step.estimatedDuration}</div>
              </div>
            </div>
          )}

          <Divider />

          {/* Documents */}
          {step.documents && step.documents.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Dokumen Terkait
              </h4>
              <ul className="space-y-2">
                {step.documents.map((doc, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Help Text */}
          {step.helpText && (
            <>
              <Divider />
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-700">
                  <Lightbulb className="w-4 h-4" />
                  Tips
                </h4>
                <p className="text-sm text-gray-700">{step.helpText}</p>
              </div>
            </>
          )}

          {/* Audit Notes */}
          {step.auditNotes && (
            <>
              <Divider />
              <div className="p-3 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-yellow-700">
                  <AlertCircle className="w-4 h-4" />
                  Catatan Audit
                </h4>
                <p className="text-sm text-gray-700">{step.auditNotes}</p>
              </div>
            </>
          )}

          {/* Business Rules */}
          {step.businessRules && step.businessRules.length > 0 && (
            <>
              <Divider />
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Aturan Bisnis
                </h4>
                <ul className="space-y-1">
                  {step.businessRules.map((rule, i) => (
                    <li key={i} className="text-sm text-gray-700 list-disc ml-5">
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Warning Message */}
          {step.warningMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ {step.warningMessage}
              </p>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Tutup
          </Button>
          {!isCompleted && (
            <Button
              color="primary"
              onPress={() => {
                onMarkComplete(step.id)
                onClose()
              }}
            >
              Tandai Selesai
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

/**
 * MAIN COMPONENT: Process Stepper
 */
const ProcessStepper = ({
  workflow,
  workflowInstance,
  onStepComplete
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedStep, setSelectedStep] = useState(null)

  if (!workflow || !workflowInstance) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <p className="text-gray-500">Memuat workflow...</p>
        </CardBody>
      </Card>
    )
  }

  const { steps } = workflow
  const { completedSteps, currentStep: currentStepIndex } = workflowInstance

  const getStepStatus = (stepIndex, stepId) => {
    if (completedSteps.includes(stepId)) {
      return 'completed'
    }
    if (stepIndex === currentStepIndex) {
      return 'current'
    }
    return 'pending'
  }

  const handleStepClick = (step) => {
    setSelectedStep(step)
    onOpen()
  }

  const handleMarkComplete = (stepId) => {
    if (onStepComplete) {
      onStepComplete(stepId)
    }
  }

  const isStepCompleted = (stepId) => {
    return completedSteps.includes(stepId)
  }

  // Progress stats
  const totalSteps = steps.length
  const completed = completedSteps.length
  const percentage = Math.round((completed / totalSteps) * 100)

  return (
    <div className="w-full space-y-6">
      {/* Progress Summary */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <h2 className="text-xl font-bold">{workflow.processName}</h2>
            <Chip color="primary" variant="flat">
              {completed}/{totalSteps} Selesai
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-semibold">{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Steps List */}
      <Card className="shadow-lg">
        <CardBody className="p-6">
          <div className="space-y-0">
            {steps.map((step, index) => (
              <StepItem
                key={step.id}
                step={step}
                index={index}
                status={getStepStatus(index, step.id)}
                isLast={index === steps.length - 1}
                onClick={handleStepClick}
              />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Step Detail Modal */}
      <StepDetailModal
        step={selectedStep}
        isOpen={isOpen}
        onClose={onClose}
        onMarkComplete={handleMarkComplete}
        isCompleted={selectedStep && isStepCompleted(selectedStep.id)}
      />
    </div>
  )
}

export default ProcessStepper
