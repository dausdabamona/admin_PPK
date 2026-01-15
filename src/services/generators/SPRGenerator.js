/**
 * ============================================================================
 * SPR GENERATOR - Surat Pendebitan Rekening Generator
 * ============================================================================
 *
 * Service untuk generate Surat Pendebitan Rekening (SPR) sesuai format
 * resmi Kementerian Kelautan dan Perikanan.
 *
 * Features:
 * - Generate SPR dari master data
 * - Support kop satker lengkap dengan logo
 * - Format resmi sesuai tata naskah dinas KKP
 * - Export ke PDF/HTML
 * - Auto-watermark untuk rekonstruksi
 * - Integrasi dengan fiscal year context
 *
 * Template: src/templates/documents/SPR.template.html
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import Handlebars from 'handlebars'
import fiscalYearContext from '../fiscal/FiscalYearContext.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * SPR Generator Class
 */
export class SPRGenerator {
  constructor() {
    this.templatePath = path.resolve(
      __dirname,
      '../../templates/documents/SPR.template.html'
    )
    this.template = null
  }

  /**
   * Load template HTML
   * @returns {Promise<void>}
   */
  async loadTemplate() {
    if (this.template) return

    try {
      const templateContent = await fs.readFile(this.templatePath, 'utf-8')
      this.template = Handlebars.compile(templateContent)
      console.log('[SPRGenerator] Template loaded successfully')
    } catch (error) {
      console.error('[SPRGenerator] Failed to load template:', error)
      throw new Error(`Failed to load SPR template: ${error.message}`)
    }
  }

  /**
   * Generate SPR document
   *
   * @param {Object} masterData - Master data object
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated document
   *
   * Options:
   * - format: 'html' | 'pdf' (default: 'html')
   * - includeWatermark: boolean (auto-detect from fiscal year context)
   * - tahunAnggaran: number (optional, defaults to active year)
   */
  async generate(masterData, options = {}) {
    await this.loadTemplate()

    // Get fiscal year context
    const tahunAnggaran = options.tahunAnggaran || fiscalYearContext.getActiveYear()
    const isReconstruction = options.isReconstruction || fiscalYearContext.isReconstructionMode()

    // Extract data from masterData
    const data = this._extractData(masterData, tahunAnggaran, isReconstruction)

    // Validate required fields
    this._validateData(data)

    // Generate HTML
    const html = this.template(data)

    // Generate document object
    const document = {
      type: 'SPR',
      title: `Surat Pendebitan Rekening - ${data.nomor_spr}`,
      html,
      data,
      metadata: {
        generatedAt: new Date().toISOString(),
        tahunAnggaran,
        isReconstruction,
        masterDataId: masterData.masterId || masterData.id
      }
    }

    // Convert to PDF if requested
    if (options.format === 'pdf') {
      document.pdf = await this._convertToPDF(html)
    }

    console.log('[SPRGenerator] Document generated:', document.type, document.title)

    return document
  }

  /**
   * Extract and format data from masterData
   * @param {Object} masterData - Master data
   * @param {number} tahunAnggaran - Fiscal year
   * @param {boolean} isReconstruction - Reconstruction flag
   * @returns {Object} Formatted data
   * @private
   */
  _extractData(masterData, tahunAnggaran, isReconstruction) {
    const now = new Date()

    return {
      // Kop Satker
      logo_satker: masterData.logo_satker || '/assets/logo-kkp.png',
      nama_unit_eselon1: masterData.nama_unit_eselon1 || 'DIREKTORAT JENDERAL ...',
      nama_satuan_kerja: masterData.nama_satuan_kerja || masterData.satkerNama || 'SATUAN KERJA ...',
      alamat_satker: masterData.alamat_satker || masterData.alamatSatker || '',
      telepon: masterData.telepon || masterData.telpSatker || '',
      email: masterData.email || masterData.emailSatker || '',

      // Nomor Surat
      nomor_spr: this._generateNomorSPR(masterData, tahunAnggaran),

      // Identitas Pejabat
      nama_ppk: masterData.ppkNama || masterData.nama_ppk || '',
      nip_ppk: masterData.ppkNip || masterData.nip_ppk || '',
      jabatan_ppk: masterData.ppkJabatan || masterData.jabatan_ppk || 'Pejabat Pembuat Komitmen',
      nama_satker: masterData.satkerNama || masterData.nama_satker || '',

      // Rincian Pendebitan
      nama_bank: masterData.namaBank || masterData.nama_bank || '',
      cabang_bank: masterData.cabangBank || masterData.cabang_bank || '',
      nomor_rekening: masterData.nomorRekening || masterData.nomor_rekening || '',
      nama_rekening: masterData.namaRekening || masterData.nama_rekening || '',
      jumlah_angka: this._formatCurrency(masterData.nilaiTagihan || masterData.jumlah || 0),
      jumlah_terbilang: this._numberToWords(masterData.nilaiTagihan || masterData.jumlah || 0),
      uraian_keperluan: masterData.uraianKeperluan || masterData.kegiatanNama || '',

      // Waktu
      hari_tanggal_pelaksanaan: this._formatHariTanggal(
        masterData.tanggalPelaksanaan || masterData.tanggalKegiatan || now
      ),
      kota: masterData.kota || masterData.kotaSatker || 'Jakarta',
      tanggal_surat: this._formatTanggalSurat(masterData.tanggalSurat || now),

      // Bendahara
      nama_bendahara: masterData.bendaharaNama || masterData.nama_bendahara || '',
      nip_bendahara: masterData.bendaharaNip || masterData.nip_bendahara || '',

      // FASE 4.5: Fiscal Year Context & Watermark
      tahunAnggaran,
      isReconstruction,
      reconstructionDate: isReconstruction
        ? this._formatTanggalSurat(new Date())
        : null
    }
  }

  /**
   * Validate required fields
   * @param {Object} data - Data to validate
   * @throws {Error} If validation fails
   * @private
   */
  _validateData(data) {
    const requiredFields = [
      'nama_ppk',
      'nip_ppk',
      'nama_bank',
      'nomor_rekening',
      'nama_rekening',
      'jumlah_angka',
      'nama_bendahara',
      'nip_bendahara'
    ]

    const missingFields = requiredFields.filter(field => !data[field])

    if (missingFields.length > 0) {
      throw new Error(
        `SPR validation failed. Missing required fields: ${missingFields.join(', ')}`
      )
    }
  }

  /**
   * Generate nomor SPR
   * @param {Object} masterData - Master data
   * @param {number} tahunAnggaran - Fiscal year
   * @returns {string} Nomor SPR
   * @private
   */
  _generateNomorSPR(masterData, tahunAnggaran) {
    if (masterData.nomorSPR || masterData.nomor_spr) {
      return masterData.nomorSPR || masterData.nomor_spr
    }

    // Auto-generate format: SPR-{sequence}/{kode_satker}/{bulan}/{tahun}
    const sequence = masterData.sequence || '001'
    const kodeSatker = masterData.satkerKode || 'XXXX'
    const bulan = this._toRoman(new Date().getMonth() + 1)
    const tahun = tahunAnggaran

    return `SPR-${sequence}/${kodeSatker}/${bulan}/${tahun}`
  }

  /**
   * Format currency (IDR)
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency
   * @private
   */
  _formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Convert number to Indonesian words (terbilang)
   * @param {number} num - Number to convert
   * @returns {string} Number in words
   * @private
   */
  _numberToWords(num) {
    if (num === 0) return 'Nol Rupiah'

    const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan']
    const teens = [
      'Sepuluh',
      'Sebelas',
      'Dua Belas',
      'Tiga Belas',
      'Empat Belas',
      'Lima Belas',
      'Enam Belas',
      'Tujuh Belas',
      'Delapan Belas',
      'Sembilan Belas'
    ]

    const convert = (n) => {
      if (n === 0) return ''
      if (n < 10) return units[n]
      if (n >= 10 && n < 20) return teens[n - 10]
      if (n >= 20 && n < 100) {
        return units[Math.floor(n / 10)] + ' Puluh ' + units[n % 10]
      }
      if (n >= 100 && n < 200) {
        return 'Seratus ' + convert(n - 100)
      }
      if (n >= 200 && n < 1000) {
        return units[Math.floor(n / 100)] + ' Ratus ' + convert(n % 100)
      }
      if (n >= 1000 && n < 2000) {
        return 'Seribu ' + convert(n - 1000)
      }
      if (n >= 2000 && n < 1000000) {
        return convert(Math.floor(n / 1000)) + ' Ribu ' + convert(n % 1000)
      }
      if (n >= 1000000 && n < 1000000000) {
        return convert(Math.floor(n / 1000000)) + ' Juta ' + convert(n % 1000000)
      }
      if (n >= 1000000000 && n < 1000000000000) {
        return convert(Math.floor(n / 1000000000)) + ' Miliar ' + convert(n % 1000000000)
      }
      return n.toString()
    }

    return convert(num).trim() + ' Rupiah'
  }

  /**
   * Format hari & tanggal (e.g., "Senin, 15 Januari 2024")
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date
   * @private
   */
  _formatHariTanggal(date) {
    const d = typeof date === 'string' ? new Date(date) : date

    const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const bulan = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember'
    ]

    return `${hari[d.getDay()]}, ${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`
  }

  /**
   * Format tanggal surat (e.g., "15 Januari 2024")
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date
   * @private
   */
  _formatTanggalSurat(date) {
    const d = typeof date === 'string' ? new Date(date) : date

    const bulan = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember'
    ]

    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`
  }

  /**
   * Convert number to Roman numerals
   * @param {number} num - Number to convert
   * @returns {string} Roman numeral
   * @private
   */
  _toRoman(num) {
    const lookup = {
      M: 1000,
      CM: 900,
      D: 500,
      CD: 400,
      C: 100,
      XC: 90,
      L: 50,
      XL: 40,
      X: 10,
      IX: 9,
      V: 5,
      IV: 4,
      I: 1
    }

    let roman = ''
    for (let i in lookup) {
      while (num >= lookup[i]) {
        roman += i
        num -= lookup[i]
      }
    }
    return roman
  }

  /**
   * Convert HTML to PDF (placeholder - integrate with puppeteer/pdf lib)
   * @param {string} html - HTML content
   * @returns {Promise<Buffer>} PDF buffer
   * @private
   */
  async _convertToPDF(html) {
    // TODO: Integrate with puppeteer or pdf generation library
    // For now, return null and let caller handle PDF generation

    console.log('[SPRGenerator] PDF conversion requested (not yet implemented)')

    // Example integration with puppeteer:
    // const puppeteer = require('puppeteer')
    // const browser = await puppeteer.launch()
    // const page = await browser.newPage()
    // await page.setContent(html)
    // const pdf = await page.pdf({ format: 'A4', printBackground: true })
    // await browser.close()
    // return pdf

    return null
  }

  /**
   * Save document to file
   * @param {Object} document - Generated document
   * @param {string} outputPath - Output file path
   * @returns {Promise<string>} Saved file path
   */
  async save(document, outputPath) {
    const ext = path.extname(outputPath) || '.html'
    const content = ext === '.pdf' ? document.pdf : document.html

    if (!content) {
      throw new Error(`No content available for format: ${ext}`)
    }

    await fs.writeFile(outputPath, content)
    console.log('[SPRGenerator] Document saved:', outputPath)

    return outputPath
  }

  /**
   * Generate and save SPR in one step
   * @param {Object} masterData - Master data
   * @param {string} outputPath - Output file path
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated document & file path
   */
  async generateAndSave(masterData, outputPath, options = {}) {
    const document = await this.generate(masterData, options)
    const filePath = await this.save(document, outputPath)

    return {
      document,
      filePath
    }
  }
}

/**
 * Singleton instance
 */
const sprGenerator = new SPRGenerator()

export default sprGenerator

/**
 * =============================================================================
 * USAGE EXAMPLES
 * =============================================================================
 *
 * // 1. Generate SPR HTML
 * import sprGenerator from './services/generators/SPRGenerator.js'
 *
 * const masterData = {
 *   masterId: 'MDK-2024-001',
 *   satkerNama: 'POLITEKNIK KP SORONG',
 *   ppkNama: 'Dr. John Doe, S.Pi., M.Si',
 *   ppkNip: '197001011990031001',
 *   namaBank: 'Bank BRI',
 *   cabangBank: 'Sorong',
 *   nomorRekening: '1234567890',
 *   namaRekening: 'Bendahara Pengeluaran Politeknik KP Sorong',
 *   nilaiTagihan: 50000000,
 *   kegiatanNama: 'Pembayaran Honorarium Workshop',
 *   bendaharaNama: 'Jane Doe, S.E.',
 *   bendaharaNip: '198001012000032001'
 * }
 *
 * const document = await sprGenerator.generate(masterData)
 * console.log(document.html)  // HTML content
 *
 * // 2. Generate and save as PDF
 * const result = await sprGenerator.generateAndSave(
 *   masterData,
 *   '/output/SPR-001.pdf',
 *   { format: 'pdf' }
 * )
 *
 * // 3. Generate with reconstruction watermark
 * import fiscalYearContext from './services/fiscal/FiscalYearContext.js'
 *
 * fiscalYearContext.switchYear(2023)
 * fiscalYearContext.setMode('RECONSTRUCTION')
 *
 * const document = await sprGenerator.generate(masterData)
 * // Document will have watermark: "REKONSTRUKSI ADMINISTRASI TA 2023"
 *
 * // 4. Batch generation
 * const masterDataList = await getMasterDataForSPR()
 *
 * for (const data of masterDataList) {
 *   const doc = await sprGenerator.generate(data)
 *   await sprGenerator.save(doc, `/output/SPR-${data.masterId}.html`)
 * }
 *
 * =============================================================================
 */
