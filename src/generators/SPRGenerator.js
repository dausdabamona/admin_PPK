/**
 * ============================================================================
 * SPR GENERATOR - Surat Permintaan Pembayaran
 * ============================================================================
 *
 * Generator untuk dokumen SPR (Surat Permintaan Pembayaran) sesuai dengan
 * format resmi pemerintahan.
 *
 * SPR adalah dokumen yang dibuat oleh PPK untuk mengajukan permintaan
 * pembayaran kepada Bendahara atas pekerjaan yang telah selesai dilaksanakan.
 *
 * Fields yang digunakan (dari field-mapping.json):
 * - dokumen.spr (nomor, tanggal)
 * - satker (nama, kode, alamat)
 * - pejabat.ppk (nama, nip, jabatan)
 * - tahunAnggaran
 * - kegiatan (program, kegiatan, output, akun, uraian)
 * - anggaran (sumberDana, nilaiKontrak, nilaiDibayar, terbilang, potongan)
 * - penyedia (nama, alamat, npwp)
 * - bank (namaBank, cabang, nomorRekening, atasNama)
 * - dokumen.kontrak (nomor, tanggal)
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import { BaseDocumentGenerator } from './BaseDocumentGenerator.js'
import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * SPR Document Generator
 *
 * @extends BaseDocumentGenerator
 */
export class SPRGenerator extends BaseDocumentGenerator {
  constructor(masterData) {
    super(masterData)
  }

  /**
   * Get document type
   *
   * @override
   * @returns {string} 'SPR'
   */
  getDocumentType() {
    return 'SPR'
  }

  /**
   * Get template path
   *
   * @override
   * @returns {string} Path to SPR template
   */
  getTemplatePath() {
    return path.join(__dirname, '../../templates/spr/spr.html')
  }

  /**
   * Populate SPR template dengan data
   *
   * @override
   * @param {string} template - Template content
   * @returns {string} Populated HTML
   */
  populateTemplate(template) {
    // Get common data dari parent class
    const commonData = this.getCommonData()

    // Add SPR-specific data
    const sprData = {
      ...commonData,

      // Header SPR
      judulDokumen: 'SURAT PERMINTAAN PEMBAYARAN',
      nomorSurat: commonData.sprNomor,
      tanggalSurat: commonData.sprTanggalPanjang,

      // Lampiran info
      lampiranJumlah: '1 (satu) berkas',

      // Perihal
      perihal: `Permintaan Pembayaran ${commonData.kegiatanUraian}`,

      // Keterangan tambahan
      keteranganTambahan: `Berdasarkan Surat Perjanjian Kerja Nomor ${commonData.kontrakNomor} tanggal ${commonData.kontrakTanggalPanjang}`,

      // Sisa pagu setelah potongan
      sisaPagu: this.formatCurrency(
        (commonData.pagu || 0) - (commonData.nilaiKontrak || 0)
      ),

      // Status NPWP
      npwpStatus: commonData.penyediaNpwp ? `NPWP: ${commonData.penyediaNpwp}` : 'Tidak ber-NPWP'
    }

    // Replace all placeholders
    return this.replacePlaceholders(template, sprData)
  }

  /**
   * Generate SPR document
   *
   * @returns {Promise<Object>} Generated document
   */
  async generateSPR() {
    try {
      // Load template
      const template = await fs.readFile(this.templatePath, 'utf-8')

      // Generate
      return await this.generate(template)
    } catch (error) {
      throw new Error(`Failed to generate SPR: ${error.message}`)
    }
  }
}

/**
 * Static helper method untuk generate SPR langsung
 *
 * @param {Object} masterData - Master data kegiatan
 * @returns {Promise<Object>} Generated SPR
 *
 * @example
 * const spr = await SPRGenerator.generate(masterData)
 * console.log(spr.html) // HTML content
 * console.log(spr.metadata) // Document metadata
 */
SPRGenerator.generate = async function(masterData) {
  const generator = new SPRGenerator(masterData)
  return await generator.generateSPR()
}

export default SPRGenerator
