/**
 * ============================================================================
 * SPTJB GENERATOR - Surat Pernyataan Tanggung Jawab Belanja
 * ============================================================================
 *
 * Generator untuk Surat Pernyataan Tanggung Jawab Belanja.
 *
 * SPTJB adalah surat pernyataan dari PPK yang menyatakan bahwa belanja
 * telah dilakukan sesuai ketentuan peraturan perundang-undangan dan
 * PPK bertanggung jawab penuh atas kebenaran belanja tersebut.
 *
 * Ditandatangani oleh: PPK
 * Diketahui oleh: Kepala Satker (opsional)
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
 * SPTJB Generator
 * Extends BaseDocumentGenerator dengan data spesifik SPTJB
 */
export class SPTJBGenerator extends BaseDocumentGenerator {
  /**
   * Get document type
   * @returns {string}
   */
  getDocumentType() {
    return 'SPTJB'
  }

  /**
   * Get template path
   * @returns {string}
   */
  getTemplatePath() {
    return path.join(__dirname, '../../templates/sptjb/sptjb.html')
  }

  /**
   * Populate template with SPTJB-specific data
   *
   * @param {string} template - HTML template
   * @returns {string} Populated HTML
   */
  populateTemplate(template) {
    const commonData = this.getCommonData()

    // SPTJB-specific data
    const sptjbData = {
      ...commonData,

      // Document header
      judulDokumen: 'SURAT PERNYATAAN TANGGUNG JAWAB BELANJA',
      nomorSurat: commonData.sptjbNomor,
      tanggalSurat: commonData.sptjbTanggalPanjang,

      // Pernyataan content
      pernyataanItems: this.generatePernyataanItems(),

      // PPK signature section
      ppkNama: commonData.ppkNama,
      ppkNip: commonData.ppkNip,
      ppkJabatan: commonData.ppkJabatan,

      // Kepala Satker (optional)
      kepalaSatkerNama: commonData.kepalaSatkerNama || '[Nama Kepala Satker]',
      kepalaSatkerNip: commonData.kepalaSatkerNip || '[NIP Kepala Satker]',

      // Kegiatan details
      kegiatanUraian: commonData.kegiatanUraian,
      tahunAnggaran: commonData.tahunAnggaran,
      nilaiKontrak: commonData.nilaiKontrakFormat,
      nilaiKontrakTerbilang: commonData.terbilang,

      // Budget details
      kegiatanKode: commonData.kegiatanKode,
      programKode: commonData.programKode || '[Kode Program]',
      programNama: commonData.programNama || '[Nama Program]',
      kegiatanKode: commonData.kegiatanKode || '[Kode Kegiatan]',
      kegiatanNama: commonData.kegiatanNama || commonData.kegiatanUraian,

      // Payment details
      kontrakNomor: commonData.kontrakNomor,
      kontrakTanggalPanjang: commonData.kontrakTanggalPanjang,
      penyediaNama: commonData.penyediaNama
    }

    return this.replacePlaceholders(template, sptjbData)
  }

  /**
   * Generate pernyataan items (numbered list)
   * @returns {Array<string>}
   * @private
   */
  generatePernyataanItems() {
    return [
      'Belanja sebagaimana tersebut di atas dibebankan pada DIPA yang sah dan mencukupi.',
      'Belanja dimaksud merupakan pengeluaran yang sah dan menjadi tanggung jawab kami.',
      'Belanja tersebut telah dilaksanakan sesuai dengan ketentuan peraturan perundang-undangan.',
      'Barang/jasa yang dibeli/diterima telah sesuai dengan spesifikasi yang ditetapkan.',
      'Harga yang dibayarkan tidak melebihi harga yang berlaku di pasaran.',
      'Pembayaran tersebut belum pernah diajukan sebelumnya untuk penerbitan SPM.',
      'Keseluruhan data/dokumen yang kami sampaikan adalah benar dan dapat dipertanggungjawabkan.'
    ]
  }

  /**
   * Main generation method
   * @returns {Promise<Object>} Generation result
   */
  async generateSPTJB() {
    const fs = await import('fs/promises')
    const template = await fs.readFile(this.getTemplatePath(), 'utf-8')
    return await this.generate(template)
  }
}

/**
 * Static helper: Generate SPTJB from master data
 *
 * @param {Object} masterData - Master data object
 * @returns {Promise<Object>} { success, html, metadata, errors }
 *
 * @example
 * const result = await SPTJBGenerator.generate(masterData)
 * if (result.success) {
 *   console.log('SPTJB HTML:', result.html)
 * }
 */
SPTJBGenerator.generate = async function(masterData) {
  const generator = new SPTJBGenerator(masterData)
  return await generator.generateSPTJB()
}

export default SPTJBGenerator
