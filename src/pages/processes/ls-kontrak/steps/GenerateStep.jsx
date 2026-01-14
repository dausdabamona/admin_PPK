import React, { useState, useEffect } from 'react'
import TemplateGenerator from '../../../../components/workflow/TemplateGenerator'
import { LS_KONTRAK_TEMPLATES } from '../config'
import { lsKontrakDocGenerator } from '../../../../utils/lsKontrakDocGenerator'
import { enrichPackageData, validatePackageData } from '../../../../utils/workflow/dataMapper'
import { AlertCircle, CheckCircle } from 'lucide-react'

/**
 * Step 5: Generate Dokumen
 * Generate dokumen otomatis dari single source of truth
 */
const GenerateStep = ({ data = {}, onUpdate, packageData }) => {
  const [enrichedData, setEnrichedData] = useState(null)
  const [validation, setValidation] = useState(null)
  const [isEnriching, setIsEnriching] = useState(false)

  // Enrich data saat component mount
  useEffect(() => {
    enrichData()
  }, [packageData])

  const enrichData = async () => {
    setIsEnriching(true)
    try {
      // Enrich package data dengan master data
      const enriched = await enrichPackageData(packageData)
      setEnrichedData(enriched)

      // Validate
      const validationResult = validatePackageData(enriched)
      setValidation(validationResult)
    } catch (error) {
      console.error('Error enriching data:', error)
    } finally {
      setIsEnriching(false)
    }
  }

  const handleGenerate = async (template, data, format) => {
    try {
      // Ensure data is enriched
      const dataToUse = enrichedData || packageData

      // Generate document
      const result = await lsKontrakDocGenerator.generateSingle(
        template.code,
        dataToUse,
        dataToUse.settings || {}
      )

      // Track generated document
      const generatedDocs = data.generatedDocuments || []
      generatedDocs.push({
        templateCode: template.code,
        filename: result.filename,
        generatedAt: new Date(),
        format
      })

      onUpdate({
        ...data,
        generatedDocuments: generatedDocs
      })

      return { success: true, ...result }
    } catch (error) {
      console.error('Generate failed:', error)
      return { success: false, error: error.message }
    }
  }

  const handleGenerateAll = async (templates, data, format) => {
    try {
      const dataToUse = enrichedData || packageData

      // Generate all documents
      const results = await lsKontrakDocGenerator.generateAll(
        dataToUse,
        dataToUse.settings || {},
        templates.map(t => t.code)
      )

      // Track all generated documents
      const generatedDocs = results
        .filter(r => r.success)
        .map(r => ({
          templateCode: r.templateCode,
          filename: r.filename,
          generatedAt: new Date(),
          format
        }))

      onUpdate({
        ...data,
        generatedDocuments: generatedDocs,
        lastGeneratedAt: new Date()
      })

      return results
    } catch (error) {
      console.error('Generate all failed:', error)
      return []
    }
  }

  if (isEnriching) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Mempersiapkan data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Validation Status */}
      {validation && (
        <div className={`rounded-lg p-4 ${
          validation.isValid
            ? 'bg-green-50 border border-green-200'
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-start gap-3">
            {validation.isValid ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-medium mb-2 ${
                validation.isValid ? 'text-green-900' : 'text-yellow-900'
              }`}>
                {validation.isValid
                  ? '✓ Data lengkap untuk generate dokumen'
                  : '⚠️ Beberapa data sebaiknya dilengkapi'
                }
              </h4>

              {/* Errors */}
              {validation.errors.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-red-900 mb-1">Data yang wajib diisi:</p>
                  <ul className="space-y-1 text-sm text-red-800">
                    {validation.errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {validation.warnings.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-yellow-900 mb-1">Rekomendasi:</p>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    {validation.warnings.map((warning, idx) => (
                      <li key={idx}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.canGenerate && validation.warnings.length > 0 && (
                <p className="text-sm text-gray-700 mt-3">
                  💡 Anda tetap bisa generate dokumen, namun sebaiknya data dilengkapi
                  untuk hasil yang lebih baik.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Summary */}
      {enrichedData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">Ringkasan Data (Single Source of Truth)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-blue-700">Kegiatan:</span>
              <div className="font-medium text-blue-900">{enrichedData.kegiatan?.nama || '-'}</div>
            </div>
            <div>
              <span className="text-blue-700">Kontrak:</span>
              <div className="font-medium text-blue-900">{enrichedData.kontrak?.nomor || '-'}</div>
            </div>
            <div>
              <span className="text-blue-700">Penyedia:</span>
              <div className="font-medium text-blue-900">{enrichedData.penyedia?.nama || '-'}</div>
            </div>
            <div>
              <span className="text-blue-700">Nilai:</span>
              <div className="font-medium text-blue-900">
                {enrichedData.perhitungan?.netto
                  ? formatRupiah(enrichedData.perhitungan.netto)
                  : '-'
                }
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <p className="text-xs text-blue-700">
              💡 Data dari {Object.keys(packageData).length} sumber terintegrasi akan mengisi semua template dokumen.
            </p>
          </div>
        </div>
      )}

      {/* Generator Component */}
      <TemplateGenerator
        processType="ls-kontrak"
        packageData={enrichedData || packageData}
        templates={LS_KONTRAK_TEMPLATES}
        onGenerate={handleGenerate}
        onGenerateAll={handleGenerateAll}
        outputFormat="pdf"
      />

      {/* Generated Documents List */}
      {data.generatedDocuments && data.generatedDocuments.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">
            Dokumen yang Telah Di-Generate ({data.generatedDocuments.length})
          </h4>
          <div className="space-y-2">
            {data.generatedDocuments.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{doc.filename}</span>
                </div>
                <span className="text-gray-500 text-xs">
                  {new Date(doc.generatedAt).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

export default GenerateStep
