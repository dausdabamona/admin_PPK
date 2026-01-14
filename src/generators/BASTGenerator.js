/**
 * ============================================================================
 * BAST GENERATOR - Berita Acara Serah Terima
 * ============================================================================
 *
 * Generator untuk Berita Acara Serah Terima.
 *
 * BAST adalah berita acara resmi yang mendokumentasikan serah terima hasil
 * pekerjaan/barang/jasa dari penyedia kepada PPK.
 *
 * Ditandatangani oleh:
 * - Pihak Pertama: Penyedia (yang menyerahkan)
 * - Pihak Kedua: PPK (yang menerima)
 * - Disaksikan oleh: Tim PPHP (Penerima Hasil Pekerjaan)
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
 * BAST Generator
 * Extends BaseDocumentGenerator dengan data spesifik BAST
 */
export class BASTGenerator extends BaseDocumentGenerator {
  /**
   * Get document type
   * @returns {string}
   */
  getDocumentType() {
    return 'BAST'
  }

  /**
   * Get template path
   * @returns {string}
   */
  getTemplatePath() {
    return path.join(__dirname, '../../templates/bast/bast.html')
  }

  /**
   * Populate template with BAST-specific data
   *
   * @param {string} template - HTML template
   * @returns {string} Populated HTML
   */
  populateTemplate(template) {
    const commonData = this.getCommonData()

    // BAST-specific data
    const bastData = {
      ...commonData,

      // Document header
      judulDokumen: 'BERITA ACARA SERAH TERIMA',
      nomorSurat: commonData.bastNomor,
      tanggalSurat: commonData.bastTanggalPanjang,

      // Parties
      // Pihak Pertama: Penyedia (yang menyerahkan)
      pihakPertamaNama: commonData.penyediaNama,
      pihakPertamaAlamat: commonData.penyediaAlamat,
      pihakPertamaNpwp: commonData.penyediaNpwp,
      pihakPertamaPimpinan: commonData.penyediaPimpinan || commonData.penyediaNama,

      // Pihak Kedua: PPK (yang menerima)
      pihakKeduaNama: commonData.ppkNama,
      pihakKeduaNip: commonData.ppkNip,
      pihakKeduaJabatan: commonData.ppkJabatan,

      // Tim PPHP (witnesses)
      pphpKetua: this.getPPHPKetua(),
      pphpAnggota: this.getPPHPAnggota(),

      // Work details
      kegiatanUraian: commonData.kegiatanUraian,
      kontrakNomor: commonData.kontrakNomor,
      kontrakTanggalPanjang: commonData.kontrakTanggalPanjang,
      nilaiKontrak: commonData.nilaiKontrakFormat,
      nilaiKontrakTerbilang: commonData.terbilang,
      kegiatanTanggalMulai: commonData.kegiatanTanggalMulai,
      kegiatanTanggalSelesai: commonData.kegiatanTanggalSelesai,
      bastTanggal: commonData.bastTanggalPanjang,

      // Hasil pekerjaan
      hasilPekerjaan: this.generateHasilPekerjaan(),
      spesifikasi: this.generateSpesifikasi(),

      // Kondisi
      kondisiPenerimaan: 'Baik dan sesuai dengan spesifikasi kontrak'
    }

    return this.replacePlaceholders(template, bastData)
  }

  /**
   * Get PPHP Ketua from master data
   * @returns {Object}
   * @private
   */
  getPPHPKetua() {
    const pphp = this.masterData.pphp || []
    const ketua = pphp.find(p => p.jabatan === 'Ketua') || pphp[0]

    return ketua ? {
      nama: ketua.nama,
      nip: ketua.nip,
      jabatan: ketua.jabatan || 'Ketua'
    } : {
      nama: '[Nama Ketua PPHP]',
      nip: '[NIP Ketua PPHP]',
      jabatan: 'Ketua'
    }
  }

  /**
   * Get PPHP Anggota list
   * @returns {Array}
   * @private
   */
  getPPHPAnggota() {
    const pphp = this.masterData.pphp || []
    const anggota = pphp.filter(p => p.jabatan !== 'Ketua')

    if (anggota.length > 0) {
      return anggota.map(a => ({
        nama: a.nama,
        nip: a.nip,
        jabatan: a.jabatan || 'Anggota'
      }))
    }

    // Default jika tidak ada
    return [
      { nama: '[Nama Anggota 1 PPHP]', nip: '[NIP Anggota 1]', jabatan: 'Anggota' },
      { nama: '[Nama Anggota 2 PPHP]', nip: '[NIP Anggota 2]', jabatan: 'Anggota' }
    ]
  }

  /**
   * Generate hasil pekerjaan description
   * @returns {string}
   * @private
   */
  generateHasilPekerjaan() {
    const uraian = this.masterData.kegiatanUraian || 'pekerjaan'
    return `Hasil pelaksanaan ${uraian} sebagaimana tercantum dalam kontrak.`
  }

  /**
   * Generate spesifikasi/scope description
   * @returns {string}
   * @private
   */
  generateSpesifikasi() {
    // Could be customized based on master data
    return 'Sesuai dengan spesifikasi teknis dan ruang lingkup pekerjaan yang tercantum dalam kontrak.'
  }

  /**
   * Main generation method
   * @returns {Promise<Object>} Generation result
   */
  async generateBAST() {
    const fs = await import('fs/promises')
    const template = await fs.readFile(this.getTemplatePath(), 'utf-8')
    return await this.generate(template)
  }
}

/**
 * Static helper: Generate BAST from master data
 *
 * @param {Object} masterData - Master data object
 * @returns {Promise<Object>} { success, html, metadata, errors }
 *
 * @example
 * const result = await BASTGenerator.generate(masterData)
 * if (result.success) {
 *   console.log('BAST HTML:', result.html)
 * }
 */
BASTGenerator.generate = async function(masterData) {
  const generator = new BASTGenerator(masterData)
  return await generator.generateBAST()
}

export default BASTGenerator
