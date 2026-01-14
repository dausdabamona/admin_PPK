import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import ProcessWizard, { WizardStep } from '../../../components/workflow/ProcessWizard'
import { LS_KONTRAK_STEPS } from './config'
import { db } from '../../../db/database'

// Import all step components
import DataKegiatanStep from './steps/DataKegiatanStep'
import DataKontrakStep from './steps/DataKontrakStep'
import DataPenyediaStep from './steps/DataPenyediaStep'
import ChecklistStep from './steps/ChecklistStep'
import GenerateStep from './steps/GenerateStep'
import UploadStep from './steps/UploadStep'
import ReviewStep from './steps/ReviewStep'

/**
 * LS Kontrak Process - Main Component
 *
 * Workflow lengkap pembayaran LS Kontrak dari input data sampai arsip
 * Prinsip: Single Source of Truth - satu data untuk semua dokumen
 */
const LsKontrakProcess = () => {
  const { id } = useParams() // Package ID dari URL (null untuk baru)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [initialData, setInitialData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [packageId, setPackageId] = useState(id || null)

  useEffect(() => {
    loadPackageData()
  }, [id])

  const loadPackageData = async () => {
    setIsLoading(true)
    try {
      if (id) {
        // Load existing package
        const pkg = await db.spjPackages?.get(id)
        if (pkg) {
          setInitialData(pkg.data || {})
          setPackageId(id)
        } else {
          console.error('Package not found:', id)
          // Buat baru jika tidak ditemukan
          setInitialData({})
          setPackageId(null)
        }
      } else {
        // Buat package baru
        setInitialData({})
        setPackageId(null)
      }
    } catch (error) {
      console.error('Error loading package:', error)
      setInitialData({})
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async (packageData, pkgId) => {
    try {
      // Update status menjadi 'archived'
      if (pkgId) {
        await db.spjPackages?.update(pkgId, {
          status: 'archived',
          completedAt: new Date(),
          archivedAt: new Date()
        })
      }

      // Show success message
      alert('✅ Paket SPJ berhasil diarsipkan!\n\nAnda dapat melihat dan mengunduh paket lengkap dari menu Arsip SPJ.')

      // Redirect ke arsip atau dashboard
      const destination = searchParams.get('from') || '/arsip'
      navigate(destination)
    } catch (error) {
      console.error('Error completing package:', error)
      alert('Gagal mengarsipkan paket: ' + error.message)
    }
  }

  const handleSave = (packageData) => {
    console.log('Auto-saved package data:', packageData)
    // Auto-save handler - ProcessWizard sudah handle save ke DB
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2 text-sm"
          >
            ← Kembali
          </button>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  📄 Pembayaran LS Kontrak
                </h1>
                <p className="text-gray-600 mt-1">
                  Proses pembayaran Langsung (LS) untuk kontrak pengadaan barang/jasa
                </p>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Single Source of Truth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Auto-generate Dokumen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600">Non-blocking</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Process Wizard */}
        <ProcessWizard
          processType="ls-kontrak"
          packageId={packageId}
          steps={LS_KONTRAK_STEPS}
          initialData={initialData}
          onComplete={handleComplete}
          onSave={handleSave}
        >
          {/* Step 1: Data Kegiatan */}
          <WizardStep name="data-kegiatan">
            {({ data, onUpdate, packageData }) => (
              <DataKegiatanStep
                data={data}
                onUpdate={onUpdate}
                packageData={packageData}
              />
            )}
          </WizardStep>

          {/* Step 2: Data Kontrak */}
          <WizardStep name="data-kontrak">
            {({ data, onUpdate, packageData }) => (
              <DataKontrakStep
                data={data}
                onUpdate={onUpdate}
                packageData={packageData}
              />
            )}
          </WizardStep>

          {/* Step 3: Data Penyedia */}
          <WizardStep name="data-penyedia">
            {({ data, onUpdate, packageData }) => (
              <DataPenyediaStep
                data={data}
                onUpdate={onUpdate}
                packageData={packageData}
              />
            )}
          </WizardStep>

          {/* Step 4: Checklist */}
          <WizardStep name="checklist">
            {({ data, onUpdate, packageData }) => (
              <ChecklistStep
                data={data}
                onUpdate={onUpdate}
                packageData={packageData}
              />
            )}
          </WizardStep>

          {/* Step 5: Generate */}
          <WizardStep name="generate">
            {({ data, onUpdate, packageData }) => (
              <GenerateStep
                data={data}
                onUpdate={onUpdate}
                packageData={packageData}
              />
            )}
          </WizardStep>

          {/* Step 6: Upload */}
          <WizardStep name="upload">
            {({ data, onUpdate, packageData }) => (
              <UploadStep
                data={data}
                onUpdate={onUpdate}
                packageData={packageData}
              />
            )}
          </WizardStep>

          {/* Step 7: Review */}
          <WizardStep name="review">
            {({ data, onUpdate, packageData }) => (
              <ReviewStep
                data={data}
                onUpdate={onUpdate}
                packageData={packageData}
              />
            )}
          </WizardStep>
        </ProcessWizard>
      </div>
    </div>
  )
}

export default LsKontrakProcess
