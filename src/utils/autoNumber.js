import db from '../db/database'
import { getCurrentYear, getCurrentMonth, padNumber } from './formatters'

// Generate auto number for documents
export async function generateNomor(jenis, settings = {}) {
  const tahun = getCurrentYear()
  const bulan = getCurrentMonth()

  // Get current nomor urut
  let nomorRecord = await db.nomorUrut
    .where({ jenis, tahun, bulan })
    .first()

  let nomorBaru = 1

  if (nomorRecord) {
    nomorBaru = nomorRecord.nomorTerakhir + 1
    await db.nomorUrut.update(nomorRecord.id, {
      nomorTerakhir: nomorBaru
    })
  } else {
    await db.nomorUrut.add({
      jenis,
      tahun,
      bulan,
      nomorTerakhir: nomorBaru
    })
  }

  // Get settings for prefix
  const prefixSetting = await db.settings
    .where('key')
    .equals(`prefix_${jenis.toLowerCase()}`)
    .first()

  const kodeSatkerSetting = await db.settings
    .where('key')
    .equals('kode_satker')
    .first()

  const prefix = prefixSetting?.value || jenis.toUpperCase()
  const kodeSatker = kodeSatkerSetting?.value || '032.11.423.585'

  // Format: PREFIX/NOMOR/SATKER/BULAN/TAHUN
  // Example: ST/001/032.11.423.585/01/2024
  const nomorFormatted = `${prefix}/${padNumber(nomorBaru)}/${kodeSatker}/${padNumber(bulan, 2)}/${tahun}`

  return nomorFormatted
}

// Generate Surat Tugas number
export async function generateNomorSuratTugas() {
  return generateNomor('surat_tugas')
}

// Generate SPPD number
export async function generateNomorSPPD() {
  return generateNomor('sppd')
}

// Reset nomor urut (admin function)
export async function resetNomorUrut(jenis, tahun, bulan) {
  const nomorRecord = await db.nomorUrut
    .where({ jenis, tahun, bulan })
    .first()

  if (nomorRecord) {
    await db.nomorUrut.update(nomorRecord.id, {
      nomorTerakhir: 0
    })
  }
}

// Get last nomor
export async function getLastNomor(jenis) {
  const tahun = getCurrentYear()
  const bulan = getCurrentMonth()

  const nomorRecord = await db.nomorUrut
    .where({ jenis, tahun, bulan })
    .first()

  return nomorRecord?.nomorTerakhir || 0
}
