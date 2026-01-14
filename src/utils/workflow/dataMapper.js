import { db } from '../../db/database'

/**
 * Data Mapper - Single Source of Truth
 *
 * Fungsi ini meng-enrich data dari wizard steps dengan data master
 * sehingga semua template mendapat data lengkap dari satu sumber
 */

/**
 * Map package data ke format lengkap dengan master data
 * @param {Object} packageData - Data dari wizard
 * @returns {Promise<Object>} - Enriched data
 */
export const enrichPackageData = async (packageData) => {
  try {
    const enriched = { ...packageData }

    // 1. Enrich data pejabat
    if (enriched.kegiatan) {
      // Load PPK
      if (enriched.kegiatan.ppkId) {
        const ppk = await db.pejabat?.get(enriched.kegiatan.ppkId)
        if (ppk) {
          enriched.pejabat = enriched.pejabat || {}
          enriched.pejabat.ppk = ppk
        }
      }

      // Load PPSPM
      if (enriched.kegiatan.ppspmId) {
        const ppspm = await db.pejabat?.get(enriched.kegiatan.ppspmId)
        if (ppspm) {
          enriched.pejabat = enriched.pejabat || {}
          enriched.pejabat.ppspm = ppspm
        }
      }

      // Load Bendahara
      if (enriched.kegiatan.bendaharaId) {
        const bendahara = await db.pejabat?.get(enriched.kegiatan.bendaharaId)
        if (bendahara) {
          enriched.pejabat = enriched.pejabat || {}
          enriched.pejabat.bendahara = bendahara
        }
      }
    }

    // 2. Load settings satker
    const settings = await db.settings?.get(1)
    enriched.settings = settings || {
      satkerNama: 'KEMENTERIAN KELAUTAN DAN PERIKANAN',
      kodeSatker: '000000',
      kotaSatker: 'Jakarta'
    }

    // 3. Hitung nilai-nilai otomatis
    if (enriched.kontrak?.nilai) {
      const nilaiKontrak = parseFloat(enriched.kontrak.nilai) || 0
      const ppn = enriched.kontrak.ppn || 11
      const pph = enriched.kontrak.pph || 2

      enriched.perhitungan = {
        nilaiKontrak,
        ppnPersen: ppn,
        pphPersen: pph,
        nilaiPpn: nilaiKontrak * (ppn / 100),
        bruto: nilaiKontrak * (1 + ppn / 100),
        nilaiPph: nilaiKontrak * (pph / 100),
        netto: nilaiKontrak * (1 + ppn / 100) - (nilaiKontrak * pph / 100)
      }
    }

    // 4. Tambahkan metadata
    enriched.metadata = {
      enrichedAt: new Date(),
      version: '1.0'
    }

    return enriched
  } catch (error) {
    console.error('Error enriching package data:', error)
    return packageData // Return original jika error
  }
}

/**
 * Validate package data untuk document generation
 * @param {Object} packageData - Package data
 * @returns {Object} - Validation result
 */
export const validatePackageData = (packageData) => {
  const errors = []
  const warnings = []

  // Required fields for document generation
  const requiredFields = {
    'kegiatan.nama': 'Nama kegiatan',
    'kegiatan.kode': 'Kode kegiatan',
    'kegiatan.tahun': 'Tahun anggaran',
    'kontrak.nomor': 'Nomor kontrak',
    'kontrak.tanggal': 'Tanggal kontrak',
    'kontrak.nilai': 'Nilai kontrak',
    'penyedia.nama': 'Nama penyedia',
    'penyedia.npwp': 'NPWP penyedia'
  }

  // Check required fields
  Object.entries(requiredFields).forEach(([path, label]) => {
    const value = getNestedValue(packageData, path)
    if (!value) {
      errors.push(`${label} belum diisi`)
    }
  })

  // Recommended fields
  const recommendedFields = {
    'kegiatan.ppkId': 'PPK',
    'kegiatan.ppspmId': 'PPSPM',
    'kegiatan.bendaharaId': 'Bendahara',
    'penyedia.alamat': 'Alamat penyedia',
    'penyedia.rekening': 'Rekening penyedia'
  }

  Object.entries(recommendedFields).forEach(([path, label]) => {
    const value = getNestedValue(packageData, path)
    if (!value) {
      warnings.push(`${label} sebaiknya dilengkapi untuk dokumen yang lebih baik`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    canGenerate: errors.length === 0 // Bisa generate walau ada warnings
  }
}

/**
 * Get nested object value by path
 * @param {Object} obj - Object
 * @param {String} path - Path (e.g., 'kegiatan.nama')
 * @returns {*} - Value
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}

/**
 * Prepare data untuk specific template
 * @param {Object} enrichedData - Enriched package data
 * @param {String} templateCode - Template code
 * @returns {Object} - Template-specific data
 */
export const prepareTemplateData = (enrichedData, templateCode) => {
  // Base data yang dibutuhkan semua template
  const baseData = {
    kegiatan: enrichedData.kegiatan || {},
    kontrak: enrichedData.kontrak || {},
    penyedia: enrichedData.penyedia || {},
    pejabat: enrichedData.pejabat || {},
    settings: enrichedData.settings || {},
    perhitungan: enrichedData.perhitungan || {}
  }

  // Template-specific preparation
  switch (templateCode) {
    case 'spp':
      return {
        ...baseData,
        nomorSpp: generateNomorSurat('SPP-LS', enrichedData)
      }

    case 'bast':
      return {
        ...baseData,
        nomorBast: generateNomorSurat('BA', enrichedData),
        tanggalBast: new Date()
      }

    default:
      return baseData
  }
}

/**
 * Generate nomor surat otomatis
 * @param {String} prefix - Prefix (SPP-LS, BA, dll)
 * @param {Object} data - Package data
 * @returns {String} - Nomor surat
 */
const generateNomorSurat = (prefix, data) => {
  const bulanRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  const now = new Date()
  const bulan = bulanRomawi[now.getMonth()]
  const tahun = data.kegiatan?.tahun || now.getFullYear()
  const kodeSatker = data.settings?.kodeSatker || '000000'
  const nomorUrut = data.kontrak?.nomorUrut || '001'

  return `${prefix}/${nomorUrut}/${kodeSatker}/${bulan}/${tahun}`
}

/**
 * Extract summary untuk archive metadata
 * @param {Object} packageData - Package data
 * @returns {Object} - Summary
 */
export const extractSummary = (packageData) => {
  return {
    kegiatanNama: packageData.kegiatan?.nama || '',
    kegiatanKode: packageData.kegiatan?.kode || '',
    kontrakNomor: packageData.kontrak?.nomor || '',
    kontrakNilai: packageData.kontrak?.nilai || 0,
    penyediaNama: packageData.penyedia?.nama || '',
    penyediaNpwp: packageData.penyedia?.npwp || '',
    ppkNama: packageData.pejabat?.ppk?.nama || '',
    tahun: packageData.kegiatan?.tahun || new Date().getFullYear(),
    tanggalKontrak: packageData.kontrak?.tanggal || null,
    tanggalSelesai: packageData.kontrak?.tanggalSelesai || null
  }
}

export default {
  enrichPackageData,
  validatePackageData,
  prepareTemplateData,
  extractSummary
}
