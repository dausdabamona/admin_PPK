import React from 'react'
import { Check } from 'lucide-react'

/**
 * WizardProgress - Progress indicator untuk wizard
 * Menampilkan semua steps dengan visual progress
 */
const WizardProgress = ({ steps, currentStep, onStepClick }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep
          const isClickable = index <= currentStep // Bisa klik ke step sebelumnya

          return (
            <React.Fragment key={step.name}>
              {/* Step Circle */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => isClickable && onStepClick && onStepClick(index)}
                  disabled={!isClickable}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    text-sm font-semibold transition-all duration-200
                    ${isActive
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110'
                      : isCompleted
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-200 text-gray-500'
                    }
                    ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Step Label */}
                <div className="text-center max-w-[120px]">
                  <div className={`
                    text-xs font-medium
                    ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}
                  `}>
                    {step.label || step.title}
                  </div>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={`
                  flex-1 h-1 mx-2 rounded transition-all duration-300
                  ${index < currentStep ? 'bg-green-600' : 'bg-gray-200'}
                `} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Mobile Progress Bar (Alternative untuk layar kecil) */}
      <div className="mt-4 md:hidden">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Langkah {currentStep + 1} dari {steps.length}</span>
          <span>{Math.round((currentStep / (steps.length - 1)) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default WizardProgress
