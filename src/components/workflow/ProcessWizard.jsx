import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Save, Check, AlertCircle } from 'lucide-react'
import WizardProgress from './WizardProgress'
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '../ui/Card'
import { Button } from '../ui/Button'
import { db } from '../../db/database'

/**
 * ProcessWizard - Komponen inti untuk workflow berbasis step
 *
 * Prinsip:
 * - Non-blocking: User bisa navigasi bebas antar step
 * - Auto-save: Data tersimpan otomatis setiap 10 detik
 * - Resumable: Bisa lanjut dari step terakhir
 * - Forgiving: Tidak ada validasi yang memblokir
 */
const ProcessWizard = ({
  processType,      // 'ls-kontrak', 'up-tup', 'swakelola', dll
  packageId,        // ID paket SPJ (null untuk baru)
  steps,            // Array of step configs
  initialData = {}, // Data awal
  onComplete,       // Callback saat selesai
  onSave,           // Callback saat auto-save
  children          // WizardStep components
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [packageData, setPackageData] = useState(initialData)
  const [packageRecord, setPackageRecord] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [validationWarnings, setValidationWarnings] = useState([])

  // Load existing package jika ada packageId
  useEffect(() => {
    if (packageId) {
      loadPackage()
    }
  }, [packageId])

  const loadPackage = async () => {
    try {
      const pkg = await db.spjPackages?.get(packageId)
      if (pkg) {
        setPackageRecord(pkg)
        setPackageData(pkg.data || {})
        setCurrentStepIndex(pkg.currentStep || 0)
      }
    } catch (error) {
      console.error('Failed to load package:', error)
    }
  }

  // Auto-save setiap 10 detik
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(packageData).length > 0) {
        handleSave(true) // silent save
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [packageData])

  // Update package data
  const updateData = useCallback((stepName, stepData) => {
    setPackageData(prev => ({
      ...prev,
      [stepName]: {
        ...prev[stepName],
        ...stepData
      }
    }))
  }, [])

  // Save package ke database
  const handleSave = async (silent = false) => {
    if (!silent) setIsSaving(true)

    try {
      const now = new Date()
      const dataToSave = {
        processType,
        currentStep: currentStepIndex,
        data: packageData,
        status: currentStepIndex === steps.length - 1 ? 'completed' : 'in-progress',
        updatedAt: now
      }

      if (packageId) {
        // Update existing
        await db.spjPackages?.update(packageId, dataToSave)
      } else {
        // Create new
        const newId = await db.spjPackages?.add({
          ...dataToSave,
          packageCode: `${processType.toUpperCase()}-${Date.now()}`,
          year: new Date().getFullYear(),
          createdAt: now,
          createdBy: 'admin'
        })
        // Update packageId untuk save berikutnya
        if (newId) {
          // Reload to get ID
          await loadPackage()
        }
      }

      setLastSaved(now)
      if (!silent) {
        setIsSaving(false)
      }

      if (onSave) {
        onSave(packageData)
      }
    } catch (error) {
      console.error('Failed to save package:', error)
      if (!silent) setIsSaving(false)
    }
  }

  // Navigate to step
  const goToStep = (index) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index)
      // Clear warnings saat pindah step
      setValidationWarnings([])
    }
  }

  // Next step
  const handleNext = async () => {
    // Validate current step (soft validation, tidak memblokir)
    const currentStep = steps[currentStepIndex]
    if (currentStep.validate) {
      const warnings = currentStep.validate(packageData[currentStep.name])
      setValidationWarnings(warnings)

      // Tampilkan warning tapi tetap bisa lanjut
      if (warnings.length > 0) {
        console.warn('Validation warnings:', warnings)
      }
    }

    // Save dulu sebelum next
    await handleSave(true)

    // Lanjut ke step berikutnya
    if (currentStepIndex < steps.length - 1) {
      goToStep(currentStepIndex + 1)
    }
  }

  // Previous step
  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1)
    }
  }

  // Complete wizard
  const handleComplete = async () => {
    await handleSave()

    if (onComplete) {
      onComplete(packageData, packageId)
    }
  }

  // Render current step
  const renderCurrentStep = () => {
    const currentStep = steps[currentStepIndex]
    const childArray = React.Children.toArray(children)
    const stepComponent = childArray[currentStepIndex]

    if (!stepComponent) {
      return <div className="text-center text-gray-500">Step tidak ditemukan</div>
    }

    // Clone element dengan props tambahan
    return React.cloneElement(stepComponent, {
      data: packageData[currentStep.name] || {},
      onUpdate: (data) => updateData(currentStep.name, data),
      packageData: packageData, // Full package data untuk referensi
      isActive: true
    })
  }

  const currentStep = steps[currentStepIndex]
  const isLastStep = currentStepIndex === steps.length - 1

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Progress Bar */}
      <WizardProgress
        steps={steps}
        currentStep={currentStepIndex}
        onStepClick={goToStep}
      />

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{currentStep.title}</CardTitle>
              {currentStep.description && (
                <CardDescription>{currentStep.description}</CardDescription>
              )}
            </div>

            {/* Auto-save indicator */}
            {lastSaved && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Save className="w-4 h-4" />
                <span>
                  Tersimpan {lastSaved.toLocaleTimeString('id-ID')}
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardBody>
          {/* Validation Warnings (Non-blocking) */}
          {validationWarnings.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-900 mb-2">
                    Perhatian (Anda tetap bisa melanjutkan)
                  </h4>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    {validationWarnings.map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="min-h-[400px]">
            {renderCurrentStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t">
            <div>
              {currentStepIndex > 0 && (
                <Button
                  variant="secondary"
                  onClick={handlePrevious}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Kembali
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Manual Save Button */}
              <Button
                variant="secondary"
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </Button>

              {/* Next / Complete Button */}
              {isLastStep ? (
                <Button
                  onClick={handleComplete}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4" />
                  Selesai & Arsipkan
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2"
                >
                  Simpan & Lanjut
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Helper Text */}
      <div className="text-center text-sm text-gray-500">
        💾 Data tersimpan otomatis setiap 10 detik • Anda bisa menutup dan melanjutkan kapan saja
      </div>
    </div>
  )
}

// WizardStep wrapper component (untuk type-checking)
export const WizardStep = ({ name, children, data, onUpdate, packageData }) => {
  return (
    <div className="wizard-step" data-step-name={name}>
      {typeof children === 'function'
        ? children({ data, onUpdate, packageData })
        : children
      }
    </div>
  )
}

export default ProcessWizard
