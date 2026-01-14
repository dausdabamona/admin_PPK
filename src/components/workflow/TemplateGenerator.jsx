import React, { useState } from 'react'
import {
  FileText,
  Download,
  Check,
  Loader2,
  Eye,
  Settings,
  FileDown
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

/**
 * TemplateGenerator - Generate dokumen otomatis dari data yang diinput
 *
 * Prinsip:
 * - Input sekali, generate semua template
 * - Support PDF & DOCX
 * - Preview sebelum download
 * - Batch generation (generate semua sekaligus)
 */
const TemplateGenerator = ({
  processType,
  packageData,
  templates = [],
  onGenerate,
  onGenerateAll,
  onPreview,
  outputFormat = 'pdf' // 'pdf' | 'docx'
}) => {
  const [generatingTemplates, setGeneratingTemplates] = useState(new Set())
  const [generatedTemplates, setGeneratedTemplates] = useState(new Set())
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState(outputFormat)

  const handleGenerate = async (template) => {
    setGeneratingTemplates(prev => new Set(prev).add(template.code))

    try {
      if (onGenerate) {
        const result = await onGenerate(template, packageData, selectedFormat)

        if (result.success) {
          setGeneratedTemplates(prev => new Set(prev).add(template.code))
        }
      }
    } catch (error) {
      console.error('Generate failed:', error)
      alert(`Gagal membuat ${template.label}: ${error.message}`)
    } finally {
      setGeneratingTemplates(prev => {
        const next = new Set(prev)
        next.delete(template.code)
        return next
      })
    }
  }

  const handleGenerateAll = async () => {
    setIsGeneratingAll(true)

    try {
      if (onGenerateAll) {
        const results = await onGenerateAll(templates, packageData, selectedFormat)

        // Update generated status
        const successful = results
          .filter(r => r.success)
          .map(r => r.templateCode)

        setGeneratedTemplates(new Set(successful))

        // Show summary
        const total = results.length
        const success = results.filter(r => r.success).length
        const failed = total - success

        if (failed === 0) {
          alert(`✅ Berhasil membuat ${success} dokumen!`)
        } else {
          alert(`⚠️ ${success} dokumen berhasil, ${failed} gagal. Periksa konsol untuk detail.`)
        }
      }
    } catch (error) {
      console.error('Generate all failed:', error)
      alert(`Gagal membuat dokumen: ${error.message}`)
    } finally {
      setIsGeneratingAll(false)
    }
  }

  const handlePreview = async (template) => {
    if (onPreview) {
      await onPreview(template, packageData)
    }
  }

  const isGenerated = (template) => generatedTemplates.has(template.code)
  const isGenerating = (template) => generatingTemplates.has(template.code)

  const groupedTemplates = templates.reduce((acc, template) => {
    const group = template.group || 'Lainnya'
    if (!acc[group]) acc[group] = []
    acc[group].push(template)
    return acc
  }, {})

  const totalTemplates = templates.length
  const totalGenerated = generatedTemplates.size
  const progressPercentage = totalTemplates > 0
    ? Math.round((totalGenerated / totalTemplates) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-1">
              Generate Dokumen Otomatis
            </h3>
            <p className="text-sm text-blue-800">
              Berdasarkan data yang telah Anda input, sistem dapat membuat dokumen-dokumen berikut.
              Pilih dokumen yang ingin Anda buat, atau klik <strong>"Generate Semua"</strong> untuk membuat semuanya sekaligus.
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      {totalGenerated > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress Generate
            </span>
            <span className="text-sm font-bold text-gray-900">
              {totalGenerated} / {totalTemplates} dokumen
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Format Selection */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Format Output:</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={selectedFormat === 'pdf' ? 'primary' : 'secondary'}
            onClick={() => setSelectedFormat('pdf')}
          >
            PDF (Print-ready)
          </Button>
          <Button
            size="sm"
            variant={selectedFormat === 'docx' ? 'primary' : 'secondary'}
            onClick={() => setSelectedFormat('docx')}
          >
            DOCX (Editable)
          </Button>
        </div>
      </div>

      {/* Generate All Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleGenerateAll}
          disabled={isGeneratingAll}
          className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
        >
          {isGeneratingAll ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4" />
              Generate Semua ({totalTemplates} dokumen)
            </>
          )}
        </Button>
      </div>

      {/* Template Groups */}
      {Object.entries(groupedTemplates).map(([groupName, groupTemplates]) => (
        <div key={groupName}>
          <h3 className="font-semibold text-gray-900 mb-3">
            {groupName}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupTemplates.map(template => {
              const generated = isGenerated(template)
              const generating = isGenerating(template)

              return (
                <Card
                  key={template.code}
                  className={`
                    transition-all
                    ${generated
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {generated ? (
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <h4 className="font-medium text-gray-900 truncate">
                            {template.label}
                          </h4>
                        </div>

                        {template.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {template.description}
                          </p>
                        )}

                        {/* Template metadata */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {template.required && (
                            <Badge color="red" size="sm">Wajib</Badge>
                          )}
                          {template.basedOn && (
                            <Badge color="blue" size="sm">
                              {template.basedOn}
                            </Badge>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {generated ? (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleGenerate(template)}
                                disabled={generating}
                                title="Generate ulang"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handlePreview(template)}
                                title="Preview"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleGenerate(template)}
                              disabled={generating}
                            >
                              {generating ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <FileDown className="w-4 h-4 mr-1" />
                                  Generate
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      {/* Footer Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          💡 <strong>Tips:</strong> Setelah dokumen dibuat, Anda dapat mengunduhnya kembali kapan saja dari menu <strong>Arsip SPJ</strong>.
          Dokumen akan tersimpan dalam satu paket lengkap dan dapat diunduh sebagai ZIP.
        </p>
      </div>
    </div>
  )
}

export default TemplateGenerator
