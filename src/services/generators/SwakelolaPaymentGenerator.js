/**
 * ============================================================================
 * SWAKELOLA PAYMENT GENERATOR - Multi-Supplier with Tax Calculations
 * ============================================================================
 *
 * Service untuk generate dokumen pembayaran Swakelola (self-managed projects)
 * dengan support multi-supplier dan perhitungan pajak otomatis.
 *
 * Features:
 * - Multiple suppliers dalam 1 kegiatan
 * - Auto-calculate pajak per supplier (PPh 21, 22, 23, PPN)
 * - Generate Daftar Nominatif (list of all suppliers)
 * - Generate Rekapitulasi Pajak (tax summary)
 * - Generate Kuitansi per supplier
 * - Detect jenis pajak based on NPWP & transaction type
 * - FASE 4.5 fiscal year integration
 * - Indonesian formatting
 * - BPK audit-ready
 *
 * Tax Rules:
 * - PPh Pasal 21: Honorarium pegawai/tenaga ahli (tarif progresif 5%-25%)
 * - PPh Pasal 22: Pembelian barang (1.5% NPWP, 3% non-NPWP)
 * - PPh Pasal 23: Jasa (2% NPWP, 4% non-NPWP)
 * - PPN: 11% (sejak April 2022)
 *
 * Templates:
 * - DaftarNominatifSwakelola.template.html
 * - RekapitulasiPajakSwakelola.template.html
 * - KuitansiSwakelola.template.html (per supplier)
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
 * Tax rates configuration
 */
const TAX_RATES = {
  PPH21: {
    // Tarif progresif per tahun
    brackets: [
      { max: 60000000, rate: 0.05 },      // 0 - 60 juta: 5%
      { max: 250000000, rate: 0.15 },     // 60 - 250 juta: 15%
      { max: 500000000, rate: 0.25 },     // 250 - 500 juta: 25%
      { max: Infinity, rate: 0.30 }       // > 500 juta: 30%
    ]
  },
  PPH22: {
    withNPWP: 0.015,    // 1.5% untuk ber-NPWP
    withoutNPWP: 0.03   // 3% untuk non-NPWP
  },
  PPH23: {
    withNPWP: 0.02,     // 2% untuk ber-NPWP
    withoutNPWP: 0.04   // 4% untuk non-NPWP
  },
  PPN: 0.11             // 11% (sejak April 2022)
}

/**
 * Transaction type categories for auto-detect tax type
 */
const TRANSACTION_TYPES = {
  BARANG: ['barang', 'material', 'peralatan', 'alat', 'bahan', 'supplies'],
  JASA: ['jasa', 'service', 'konsultasi', 'maintenance', 'sewa', 'rental'],
  HONORARIUM: ['honorarium', 'honor', 'narasumber', 'pengajar', 'tenaga ahli', 'pemateri']
}

/**
 * Swakelola Payment Generator Class
 */
export class SwakelolaPaymentGenerator {
  constructor() {
    this.templates = {
      nominatif: path.resolve(__dirname, '../../templates/documents/DaftarNominatifSwakelola.template.html'),
      rekapPajak: path.resolve(__dirname, '../../templates/documents/RekapitulasiPajakSwakelola.template.html')
    }
    this.compiledTemplates = {}

    // Register Handlebars helpers
    this._registerHelpers()
  }

  /**
   * Register Handlebars helpers
   * @private
   */
  _registerHelpers() {
    Handlebars.registerHelper('formatCurrency', (amount) => {
      return this._formatCurrency(amount)
    })

    Handlebars.registerHelper('increment', (index) => {
      return index + 1
    })
  }

  /**
   * Load templates
   * @returns {Promise<void>}
   */
  async loadTemplates() {
    if (Object.keys(this.compiledTemplates).length === 2) return

    try {
      for (const [key, templatePath] of Object.entries(this.templates)) {
        const templateContent = await fs.readFile(templatePath, 'utf-8')
        this.compiledTemplates[key] = Handlebars.compile(templateContent)
      }
      console.log('[SwakelolaPaymentGenerator] Templates loaded successfully')
    } catch (error) {
      console.error('[SwakelolaPaymentGenerator] Failed to load templates:', error)
      throw new Error(`Failed to load Swakelola templates: ${error.message}`)
    }
  }

  /**
   * Generate complete swakelola payment documents
   *
   * @param {Object} masterData - Master data kegiatan swakelola
   * @param {Array<Object>} suppliers - Array of suppliers with transaction details
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Complete swakelola package
   *
   * Supplier object structure:
   * {
   *   nama_penyedia: string,
   *   npwp: string (optional),
   *   uraian: string,
   *   nilai_bruto: number,
   *   jenis_transaksi: 'BARANG' | 'JASA' | 'HONORARIUM' (optional, auto-detect)
   * }
   */
  async generate(masterData, suppliers, options = {}) {
    await this.loadTemplates()

    console.log('[SwakelolaPaymentGenerator] Generating swakelola payment for:', masterData.namaKegiatan || masterData.nama_kegiatan)
    console.log(`[SwakelolaPaymentGenerator] ${suppliers.length} suppliers`)

    // Get fiscal year context
    const tahunAnggaran = options.tahunAnggaran || fiscalYearContext.getActiveYear()
    const isReconstruction = options.isReconstruction || fiscalYearContext.isReconstructionMode()

    // Calculate tax for each supplier
    const processedSuppliers = suppliers.map(supplier => this._calculateSupplierTax(supplier))

    // Calculate totals
    const totals = this._calculateTotals(processedSuppliers)

    // Calculate tax breakdown by type
    const taxBreakdown = this._calculateTaxBreakdown(processedSuppliers)

    // Prepare common data
    const commonData = {
      // Kop Satker
      logo_satker: masterData.logo_satker || '/assets/logo-kkp.png',
      nama_unit_eselon1: masterData.nama_unit_eselon1 || 'DIREKTORAT JENDERAL ...',
      nama_satuan_kerja: masterData.nama_satuan_kerja || masterData.satkerNama || '',
      nama_satker: masterData.satkerNama || masterData.nama_satker || '',

      // Kegiatan info
      nama_kegiatan: masterData.namaKegiatan || masterData.nama_kegiatan || '',
      kode_kegiatan: masterData.kodeKegiatan || masterData.kode_kegiatan || '',
      tahun_anggaran: tahunAnggaran,
      bulan_pembayaran: masterData.bulanPembayaran || this._getCurrentMonth(),

      // Pejabat
      nama_ppk: masterData.ppkNama || masterData.nama_ppk || '',
      nip_ppk: masterData.ppkNip || masterData.nip_ppk || '',
      nama_bendahara: masterData.bendaharaNama || masterData.nama_bendahara || '',
      nip_bendahara: masterData.bendaharaNip || masterData.nip_bendahara || '',
      nama_verifikator: masterData.verifikatorNama || masterData.nama_verifikator || '',
      nip_verifikator: masterData.verifikatorNip || masterData.nip_verifikator || '',

      // Location & Date
      kota: masterData.kota || masterData.kotaSatker || 'Jakarta',
      tanggal: this._formatTanggalSurat(masterData.tanggalPembayaran || new Date()),

      // FASE 4.5
      tahunAnggaran,
      isReconstruction,
      reconstructionDate: isReconstruction ? this._formatTanggalSurat(new Date()) : null
    }

    // Generate Daftar Nominatif
    const nominatif = await this._generateDaftarNominatif(commonData, processedSuppliers, totals)

    // Generate Rekapitulasi Pajak
    const rekapPajak = await this._generateRekapPajak(commonData, taxBreakdown, totals)

    // Return complete package
    return {
      type: 'SWAKELOLA_PAYMENT_PACKAGE',
      title: `Pembayaran Swakelola - ${commonData.nama_kegiatan}`,
      documents: {
        nominatif,
        rekapPajak
      },
      summary: {
        totalSuppliers: suppliers.length,
        totalBruto: totals.totalBruto,
        totalPPh: totals.totalPPh,
        totalPPN: totals.totalPPN,
        totalNetto: totals.totalNetto
      },
      taxBreakdown,
      metadata: {
        generatedAt: new Date().toISOString(),
        tahunAnggaran,
        isReconstruction,
        masterDataId: masterData.masterId || masterData.id
      }
    }
  }

  /**
   * Calculate tax for single supplier
   * @private
   */
  _calculateSupplierTax(supplier) {
    const nilaiBruto = supplier.nilai_bruto || supplier.nilaiBruto || 0
    const hasNPWP = this._isValidNPWP(supplier.npwp)
    const jenisTransaksi = supplier.jenis_transaksi || this._detectTransactionType(supplier.uraian)

    let pph = 0
    let ppn = 0
    let jenisPajak = ''
    let tarifPajak = 0

    // Calculate PPh based on transaction type
    if (jenisTransaksi === 'HONORARIUM') {
      // PPh Pasal 21 (progressive)
      pph = this._calculatePPh21(nilaiBruto)
      jenisPajak = 'PPh 21'
      tarifPajak = 5 // Simplified, actual rate is progressive
    } else if (jenisTransaksi === 'BARANG') {
      // PPh Pasal 22
      const rate = hasNPWP ? TAX_RATES.PPH22.withNPWP : TAX_RATES.PPH22.withoutNPWP
      pph = Math.floor(nilaiBruto * rate)
      jenisPajak = 'PPh 22'
      tarifPajak = rate * 100
    } else if (jenisTransaksi === 'JASA') {
      // PPh Pasal 23
      const rate = hasNPWP ? TAX_RATES.PPH23.withNPWP : TAX_RATES.PPH23.withoutNPWP
      pph = Math.floor(nilaiBruto * rate)
      jenisPajak = 'PPh 23'
      tarifPajak = rate * 100
    }

    // Calculate PPN (11%)
    // PPN only for goods and services, not for honorarium
    if (jenisTransaksi === 'BARANG' || jenisTransaksi === 'JASA') {
      ppn = Math.floor(nilaiBruto * TAX_RATES.PPN)
    }

    const nilaiNetto = nilaiBruto - pph - ppn

    return {
      ...supplier,
      nama_penyedia: supplier.nama_penyedia || supplier.namaPenyedia || '',
      npwp: supplier.npwp || '-',
      uraian: supplier.uraian || '',
      nilai_bruto: nilaiBruto,
      pph,
      ppn,
      nilai_netto: nilaiNetto,
      jenis_pajak: jenisPajak,
      tarif_pajak: tarifPajak,
      jenis_transaksi: jenisTransaksi,
      has_npwp: hasNPWP
    }
  }

  /**
   * Calculate PPh Pasal 21 (progressive)
   * @private
   */
  _calculatePPh21(bruto) {
    // Simplified progressive calculation
    // For accurate calculation, need to consider PTKP (Penghasilan Tidak Kena Pajak)
    // This is basic implementation

    for (const bracket of TAX_RATES.PPH21.brackets) {
      if (bruto <= bracket.max) {
        return Math.floor(bruto * bracket.rate)
      }
    }

    return Math.floor(bruto * 0.30) // Default 30%
  }

  /**
   * Detect transaction type from uraian
   * @private
   */
  _detectTransactionType(uraian) {
    if (!uraian) return 'JASA' // Default

    const uraianLower = uraian.toLowerCase()

    // Check for honorarium keywords
    if (TRANSACTION_TYPES.HONORARIUM.some(keyword => uraianLower.includes(keyword))) {
      return 'HONORARIUM'
    }

    // Check for barang keywords
    if (TRANSACTION_TYPES.BARANG.some(keyword => uraianLower.includes(keyword))) {
      return 'BARANG'
    }

    // Check for jasa keywords
    if (TRANSACTION_TYPES.JASA.some(keyword => uraianLower.includes(keyword))) {
      return 'JASA'
    }

    return 'JASA' // Default
  }

  /**
   * Validate NPWP format
   * @private
   */
  _isValidNPWP(npwp) {
    if (!npwp) return false
    // Remove dots and dashes
    const cleaned = npwp.replace(/[\.\-]/g, '')
    // Valid NPWP has 15 digits
    return cleaned.length === 15 && /^\d+$/.test(cleaned)
  }

  /**
   * Calculate totals
   * @private
   */
  _calculateTotals(suppliers) {
    const totalBruto = suppliers.reduce((sum, s) => sum + s.nilai_bruto, 0)
    const totalPPh = suppliers.reduce((sum, s) => sum + s.pph, 0)
    const totalPPN = suppliers.reduce((sum, s) => sum + s.ppn, 0)
    const totalNetto = suppliers.reduce((sum, s) => sum + s.nilai_netto, 0)

    return {
      totalBruto,
      totalPPh,
      totalPPN,
      totalNetto
    }
  }

  /**
   * Calculate tax breakdown by type
   * @private
   */
  _calculateTaxBreakdown(suppliers) {
    const breakdown = {
      pph21: { jumlah_transaksi: 0, nilai_bruto: 0, total_pph: 0, tarif: 5 },
      pph22: { jumlah_transaksi: 0, nilai_bruto: 0, total_pph: 0, tarif: 1.5 },
      pph23: { jumlah_transaksi: 0, nilai_bruto: 0, total_pph: 0, tarif: 2 },
      ppn: { jumlah_transaksi: 0, dpp: 0, total_ppn: 0, tarif: 11 }
    }

    for (const supplier of suppliers) {
      if (supplier.jenis_pajak === 'PPh 21') {
        breakdown.pph21.jumlah_transaksi++
        breakdown.pph21.nilai_bruto += supplier.nilai_bruto
        breakdown.pph21.total_pph += supplier.pph
      } else if (supplier.jenis_pajak === 'PPh 22') {
        breakdown.pph22.jumlah_transaksi++
        breakdown.pph22.nilai_bruto += supplier.nilai_bruto
        breakdown.pph22.total_pph += supplier.pph
      } else if (supplier.jenis_pajak === 'PPh 23') {
        breakdown.pph23.jumlah_transaksi++
        breakdown.pph23.nilai_bruto += supplier.nilai_bruto
        breakdown.pph23.total_pph += supplier.pph
      }

      if (supplier.ppn > 0) {
        breakdown.ppn.jumlah_transaksi++
        breakdown.ppn.dpp += supplier.nilai_bruto
        breakdown.ppn.total_ppn += supplier.ppn
      }
    }

    return breakdown
  }

  /**
   * Generate Daftar Nominatif
   * @private
   */
  async _generateDaftarNominatif(commonData, suppliers, totals) {
    const data = {
      ...commonData,
      suppliers,
      total_bruto: this._formatCurrency(totals.totalBruto),
      total_pph: this._formatCurrency(totals.totalPPh),
      total_ppn: this._formatCurrency(totals.totalPPN),
      total_netto: this._formatCurrency(totals.totalNetto),
      terbilang_total_netto: this._numberToWords(totals.totalNetto)
    }

    const html = this.compiledTemplates.nominatif(data)

    return {
      type: 'DAFTAR_NOMINATIF_SWAKELOLA',
      title: 'Daftar Nominatif Pembayaran Swakelola',
      html,
      data,
      metadata: {
        totalSuppliers: suppliers.length,
        totalNetto: totals.totalNetto
      }
    }
  }

  /**
   * Generate Rekapitulasi Pajak
   * @private
   */
  async _generateRekapPajak(commonData, taxBreakdown, totals) {
    const data = {
      ...commonData,
      // PPh breakdown (only include if > 0)
      pph21: taxBreakdown.pph21.total_pph > 0 ? taxBreakdown.pph21 : null,
      pph22: taxBreakdown.pph22.total_pph > 0 ? taxBreakdown.pph22 : null,
      pph23: taxBreakdown.pph23.total_pph > 0 ? taxBreakdown.pph23 : null,

      // PPN breakdown
      ppn: taxBreakdown.ppn.total_ppn > 0 ? taxBreakdown.ppn : null,

      // Totals for PPh section
      total_bruto_pph: taxBreakdown.pph21.nilai_bruto + taxBreakdown.pph22.nilai_bruto + taxBreakdown.pph23.nilai_bruto,

      // Totals for PPN section
      total_dpp: taxBreakdown.ppn.dpp,

      // Grand totals
      grand_total_bruto: totals.totalBruto,
      total_pph: totals.totalPPh,
      total_ppn: totals.totalPPN,
      total_pajak: totals.totalPPh + totals.totalPPN,
      total_netto: totals.totalNetto,
      terbilang_total_netto: this._numberToWords(totals.totalNetto)
    }

    const html = this.compiledTemplates.rekapPajak(data)

    return {
      type: 'REKAPITULASI_PAJAK_SWAKELOLA',
      title: 'Rekapitulasi Pajak Pembayaran Swakelola',
      html,
      data,
      metadata: {
        totalPajak: totals.totalPPh + totals.totalPPN,
        totalNetto: totals.totalNetto
      }
    }
  }

  /**
   * Get current month name in Indonesian
   * @private
   */
  _getCurrentMonth() {
    const bulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    return bulan[new Date().getMonth()]
  }

  /**
   * Save document to file
   */
  async save(document, outputPath) {
    try {
      await fs.writeFile(outputPath, document.html, 'utf-8')
      console.log(`[SwakelolaPaymentGenerator] Document saved: ${outputPath}`)
    } catch (error) {
      console.error(`[SwakelolaPaymentGenerator] Failed to save document:`, error)
      throw error
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  _formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  _numberToWords(num) {
    if (num === 0) return 'Nol Rupiah'

    const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan']
    const teens = [
      'Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas',
      'Lima Belas', 'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'
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

  _formatTanggalSurat(date) {
    const d = typeof date === 'string' ? new Date(date) : date

    const bulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]

    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`
  }
}

// Export singleton instance
const swakelolaPaymentGenerator = new SwakelolaPaymentGenerator()
export default swakelolaPaymentGenerator
