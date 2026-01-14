import React, { useState, useEffect } from 'react'
import DocumentChecklist from '../../../../components/workflow/DocumentChecklist'
import { LS_KONTRAK_CHECKLIST } from '../config'
import { Info } from 'lucide-react'

/**
 * Step 4: Checklist Dokumen
 * Non-blocking checklist untuk kelengkapan dokumen
 */
const ChecklistStep = ({ data = {}, onUpdate, packageData }) => {
  const [checklist, setChecklist] = useState(LS_KONTRAK_CHECKLIST)

  useEffect(() => {
    // Load existing checklist status dari data
    if (data.checklistItems) {
      const updatedChecklist = LS_KONTRAK_CHECKLIST.map(item => {
        const existing = data.checklistItems.find(i => i.code === item.code)
        return existing ? { ...item, ...existing } : item
      })
      setChecklist(updatedChecklist)
    }
  }, [data])

  const handleUpload = async (item, file) => {
    try {
      // TODO: Implement actual file upload
      console.log('Uploading file for', item.code, file)

      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update checklist item status
      const updatedChecklist = checklist.map(i =>
        i.code === item.code
          ? { ...i, status: 'completed', uploadedAt: new Date(), filename: file.name }
          : i
      )

      setChecklist(updatedChecklist)

      // Update step data
      onUpdate({
        ...data,
        checklistItems: updatedChecklist
      })

      return true
    } catch (error) {
      console.error('Upload failed:', error)
      throw error
    }
  }

  const handleDelete = async (item) => {
    try {
      // Update checklist item status
      const updatedChecklist = checklist.map(i =>
        i.code === item.code
          ? { ...i, status: 'pending', uploadedAt: null, filename: null }
          : i
      )

      setChecklist(updatedChecklist)

      // Update step data
      onUpdate({
        ...data,
        checklistItems: updatedChecklist
      })

      return true
    } catch (error) {
      console.error('Delete failed:', error)
      throw error
    }
  }

  const handleStatusChange = (status) => {
    onUpdate({
      ...data,
      checklistStatus: status
    })
  }

  return (
    <div className="space-y-6">
      {/* Info Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Langkah 4: Checklist Dokumen</p>
            <p>
              Berikut adalah daftar dokumen yang biasanya dibutuhkan untuk pembayaran LS Kontrak.
              Anda dapat mengunggah dokumen yang sudah ada, atau melengkapinya nanti.
              <strong> Sistem tidak akan menghalangi Anda untuk melanjutkan</strong>, hanya memberi rekomendasi.
            </p>
          </div>
        </div>
      </div>

      {/* Checklist Component */}
      <DocumentChecklist
        checklist={checklist}
        packageId={packageData.id}
        mode="non-blocking"
        onUpload={handleUpload}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}

export default ChecklistStep
