/**
 * ============================================================================
 * SPPR GENERATOR - Surat Pernyataan Penyelesaian Pekerjaan
 * ============================================================================
 *
 * Generator untuk Surat Pernyataan Penyelesaian Pekerjaan.
 *
 * SPPR adalah surat pernyataan dari penyedia/pelaksana yang menyatakan bahwa
 * pekerjaan telah selesai dilaksanakan sesuai kontrak.
 *
 * Ditandatangani oleh: Penyedia/Pelaksana
 * Diketahui oleh: PPK
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import { BaseDocumentGenerator } from './BaseDocumentGenerator.js'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * SPPR Generator
 * Extends BaseDocumentGenerator dengan data spesifik SPPR
 */
export class SPPRGenerator extends BaseDocumentGenerator {
  /**
   * Get document type
   * @returns {string}
   */
  getDocumentType() {
    return 'SPPR'
  }

  /**
   * Get template path
   * @returns {string}
   */
  getTemplatePath() {
    return path.join(__dirname, '../../templates/sppr/sppr.html')
  }

  /**
   * Populate template with SPPR-specific data
   *
   * @param {string} template - HTML template
   * @returns {string} Populated HTML
   */
  populateTemplate(template) {
    const commonData = this.getCommonData()

    // SPPR-specific data
    const spprData = {
      ...commonData,

      // Document header
      judulDokumen: 'SURAT PERNYATAAN PENYELESAIAN PEKERJAAN',
      nomorSurat: commonData.spprNomor,
      tanggalSurat: commonData.spprTanggalPanjang,

      // Pernyataan content
      pernyataan: this.generatePernyataan(),

      // Penyedia signature section
      penyediaNama: commonData.penyediaNama,
      penyediaAlamat: commonData.penyediaAlamat,
      penyediaNpwp: commonData.penyediaNpwp,
      penyediaJenis: commonData.penyediaJenis,
      penyediaPimpinan: commonData.penyediaPimpinan || commonData.penyediaNama,

      // PPK sebagai saksi/penerima
      ppkNama: commonData.ppkNama,
      ppkNip: commonData.ppkNip,
      ppkJabatan: commonData.ppkJabatan,

      // Kegiatan details
      kegiatanUraian: commonData.kegiatanUraian,
      kontrakNomor: commonData.kontrakNomor,
      kontrakTanggalPanjang: commonData.kontrakTanggalPanjang,
      kegiatanTanggalMulai: commonData.kegiatanTanggalMulai,
      kegiatanTanggalSelesai: commonData.kegiatanTanggalSelesai,
      nilaiKontrak: commonData.nilaiKontrakFormat,
      nilaiKontrakTerbilang: commonData.terbilang,

      // Lokasi kegiatan
      kegiatanLokasi: commonData.kegiatanLokasi || commonData.satkerAlamat
    }

    return this.replacePlaceholders(template, spprData)
  }

  /**
   * Generate pernyataan text
   * @returns {string}
   * @private
   */
  generatePernyataan() {
    const penyedia = this.masterData.penyediaNama
    const kegiatan = this.masterData.kegiatanUraian
    const kontrakNomor = this.masterData.kontrakNomor
    const tanggalSelesai = this.formatDateLong(this.masterData.kegiatanTanggalSelesai)

    return `
Yang bertanda tangan di bawah ini, ${penyedia}, dengan ini menyatakan bahwa:

1. Pekerjaan "${kegiatan}" berdasarkan Surat Perjanjian Nomor ${kontrakNomor} telah diselesaikan seluruhnya pada tanggal ${tanggalSelesai}.

2. Seluruh hasil pekerjaan telah diserahkan kepada Pejabat Pembuat Komitmen (PPK) dan telah diterima dengan baik sesuai ketentuan dalam kontrak.

3. Tidak ada lagi kewajiban yang harus dipenuhi terkait pelaksanaan pekerjaan tersebut.

4. Pernyataan ini dibuat dengan sebenarnya tanpa ada paksaan dari pihak manapun.
    `.trim()
  }

  /**
   * Main generation method
   * @returns {Promise<Object>} Generation result
   */
  async generateSPPR() {
    const fs = await import('fs/promises')
    const template = await fs.readFile(this.getTemplatePath(), 'utf-8')
    return await this.generate(template)
  }
}

/**
 * Static helper: Generate SPPR from master data
 *
 * @param {Object} masterData - Master data object
 * @returns {Promise<Object>} { success, html, metadata, errors }
 *
 * @example
 * const result = await SPPRGenerator.generate(masterData)
 * if (result.success) {
 *   console.log('SPPR HTML:', result.html)
 * }
 */
SPPRGenerator.generate = async function(masterData) {
  const generator = new SPPRGenerator(masterData)
  return await generator.generateSPPR()
}

export default SPPRGenerator
