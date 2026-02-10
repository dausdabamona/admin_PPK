/**
 * Checklist Validation Utility
 * Links Kepmen KP No.56/2024 checklist with payment workflow
 * Payment and Kwitansi actions require 100% checklist completion
 */

import db from '../db/database'

/**
 * Get checklist status for SPPD
 * @param {number} sppdId - SPPD ID
 * @returns {Promise<{isComplete: boolean, checklist: object|null, missingDocs: string[]}>}
 */
export async function getSppdChecklistStatus(sppdId) {
  const checklist = await db.checklistSPJ.where('sppdId').equals(sppdId).first()

  if (!checklist) {
    return {
      isComplete: false,
      checklist: null,
      missingDocs: ['Checklist SPJ belum dibuat'],
      completionPercent: 0
    }
  }

  const missingDocs = []
  if (checklist.items && Array.isArray(checklist.items)) {
    checklist.items.forEach(item => {
      if (item.wajib && !item.checked) {
        missingDocs.push(item.nama)
      }
    })
  }

  const isComplete = checklist.statusKelengkapan === 'lengkap'
  const completionPercent = checklist.totalItem > 0
    ? Math.round((checklist.itemLengkap / checklist.totalItem) * 100)
    : 0

  return {
    isComplete,
    checklist,
    missingDocs,
    completionPercent
  }
}

/**
 * Get checklist status for Swakelola Kegiatan
 * @param {number} kegiatanId - Kegiatan Swakelola ID
 * @param {number} rampungId - Optional Rampung ID for more specific check
 * @returns {Promise<{isComplete: boolean, checklist: object|null, missingDocs: string[]}>}
 */
export async function getSwakelolaChecklistStatus(kegiatanId, rampungId = null) {
  let query = db.swakelolaChecklist.where('kegiatanId').equals(kegiatanId)
  let checklist = await query.first()

  // If rampungId provided, try to find specific checklist for that rampung
  if (rampungId) {
    const specificChecklist = await db.swakelolaChecklist
      .where('rampungId')
      .equals(rampungId)
      .first()
    if (specificChecklist) {
      checklist = specificChecklist
    }
  }

  if (!checklist) {
    return {
      isComplete: false,
      checklist: null,
      missingDocs: ['Checklist SPJ Swakelola belum dibuat'],
      completionPercent: 0
    }
  }

  const missingDocs = []
  if (checklist.items && Array.isArray(checklist.items)) {
    checklist.items.forEach(item => {
      if (item.wajib && !item.ada) {
        missingDocs.push(item.nama)
      }
    })
  }

  const isComplete = checklist.statusKelengkapan === 'lengkap'
  const completionPercent = checklist.totalItem > 0
    ? Math.round((checklist.itemLengkap / checklist.totalItem) * 100)
    : 0

  return {
    isComplete,
    checklist,
    missingDocs,
    completionPercent
  }
}

/**
 * Get checklist status for PJLP
 * @param {number} pjlpId - PJLP Master ID
 * @param {number} kontrakId - Kontrak ID
 * @param {number} bulan - Month (1-12)
 * @param {number} tahun - Year
 * @returns {Promise<{isComplete: boolean, checklist: object|null, missingDocs: string[]}>}
 */
export async function getPjlpChecklistStatus(pjlpId, kontrakId, bulan, tahun) {
  const checklist = await db.pjlpChecklist
    .where('[pjlpId+kontrakId+bulan+tahun]')
    .equals([pjlpId, kontrakId, bulan, tahun])
    .first()

  // Fallback: try simpler query if compound index fails
  if (!checklist) {
    const allChecklists = await db.pjlpChecklist
      .where('pjlpId')
      .equals(pjlpId)
      .toArray()

    const matchingChecklist = allChecklists.find(c =>
      c.kontrakId === kontrakId &&
      c.bulan === bulan &&
      c.tahun === tahun
    )

    if (!matchingChecklist) {
      return {
        isComplete: false,
        checklist: null,
        missingDocs: ['Checklist SPJ PJLP belum dibuat untuk bulan ini'],
        completionPercent: 0
      }
    }

    return processChecklistResult(matchingChecklist)
  }

  return processChecklistResult(checklist)
}

function processChecklistResult(checklist) {
  const missingDocs = []
  if (checklist.items && Array.isArray(checklist.items)) {
    checklist.items.forEach(item => {
      if (item.wajib && !item.ada && !item.checked) {
        missingDocs.push(item.nama)
      }
    })
  }

  const isComplete = checklist.statusKelengkapan === 'lengkap'
  const completionPercent = checklist.totalItem > 0
    ? Math.round((checklist.itemLengkap / checklist.totalItem) * 100)
    : 0

  return {
    isComplete,
    checklist,
    missingDocs,
    completionPercent
  }
}

/**
 * React component helper - Missing Documents Warning
 */
export function MissingDocsWarning({ missingDocs, completionPercent }) {
  if (!missingDocs || missingDocs.length === 0) return null

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="text-yellow-600 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-yellow-800">
            Checklist SPJ Belum Lengkap ({completionPercent}%)
          </h4>
          <p className="text-sm text-yellow-700 mt-1">
            Pembayaran dan cetak kwitansi tidak dapat dilakukan sampai checklist 100% lengkap.
          </p>
          <div className="mt-2">
            <p className="text-sm font-medium text-yellow-800">Dokumen yang belum lengkap:</p>
            <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
              {missingDocs.slice(0, 5).map((doc, idx) => (
                <li key={idx}>{doc}</li>
              ))}
              {missingDocs.length > 5 && (
                <li className="text-yellow-600">...dan {missingDocs.length - 5} dokumen lainnya</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Checklist completion badge component
 */
export function ChecklistBadge({ isComplete, completionPercent }) {
  if (isComplete) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        SPJ Lengkap
      </span>
    )
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      SPJ {completionPercent}%
    </span>
  )
}
