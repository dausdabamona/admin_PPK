/**
 * ============================================================================
 * DOCUMENT TEMPLATES INDEX
 * ============================================================================
 *
 * Central export untuk semua template dokumen resmi KKP.
 *
 * Template yang tersedia:
 * - SPR (Surat Pendebitan Rekening)
 * - SPPR (Surat Perintah Pendebitan Rekening)
 * - Berita Acara Pembayaran
 * - PPHP (Pemeriksaan Hasil Pekerjaan)
 * - BAST (Berita Acara Serah Terima)
 * - Tanda Terima UP/TUP
 * - RPD Bulanan (Rencana Penarikan Dana)
 * - Kuitansi Uang Muka Perjalanan Dinas
 * - Kuitansi Rampung Perjalanan Dinas
 * - Rincian Biaya Perjalanan Dinas
 * - Daftar Nominatif Swakelola (Multi-Supplier)
 * - Rekapitulasi Pajak Swakelola (Tax Summary)
 * - SPJ Package Cover
 * - SPJ Package Lembar Pengesahan
 *
 * @author Admin PPK Development Team
 * @version 1.2.0
 */

import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Template paths registry
 */
export const TEMPLATE_PATHS = {
  SPR: path.resolve(__dirname, 'SPR.template.html'),
  SPPR: path.resolve(__dirname, 'SPPR.template.html'),
  BA_PEMBAYARAN: path.resolve(__dirname, 'BeritaAcaraPembayaran.template.html'),
  PPHP: path.resolve(__dirname, 'PPHP.template.html'),
  BAST: path.resolve(__dirname, 'BAST.template.html'),
  TANDA_TERIMA_UPTUP: path.resolve(__dirname, 'TandaTerimaUPTUP.template.html'),
  RPD: path.resolve(__dirname, 'RPD.template.html'),
  KUITANSI_UM_PERDIN: path.resolve(__dirname, 'KuitansiUangMukaPerdin.template.html'),
  KUITANSI_RAMPUNG_PERDIN: path.resolve(__dirname, 'KuitansiRampungPerdin.template.html'),
  RINCIAN_BIAYA_PERDIN: path.resolve(__dirname, 'RincianBiayaPerdin.template.html'),
  DAFTAR_NOMINATIF_SWAKELOLA: path.resolve(__dirname, 'DaftarNominatifSwakelola.template.html'),
  REKAP_PAJAK_SWAKELOLA: path.resolve(__dirname, 'RekapitulasiPajakSwakelola.template.html'),
  SPJ_COVER: path.resolve(__dirname, 'SPJPackageCover.template.html'),
  SPJ_PENGESAHAN: path.resolve(__dirname, 'SPJPackagePengesahan.template.html')
}

/**
 * Template metadata registry
 */
export const TEMPLATE_METADATA = {
  SPR: {
    name: 'Surat Pendebitan Rekening',
    code: 'SPR',
    category: 'PAYMENT',
    description: 'Surat perintah dari PPK untuk pendebitan rekening via teller',
    requiredFields: [
      'nama_ppk',
      'nip_ppk',
      'nama_bank',
      'nomor_rekening',
      'nama_rekening',
      'jumlah_angka',
      'nama_bendahara',
      'nip_bendahara'
    ],
    signatures: ['PPK', 'Bendahara']
  },

  SPPR: {
    name: 'Surat Perintah Pendebitan Rekening',
    code: 'SPPR',
    category: 'PAYMENT',
    description: 'Surat perintah pendebitan via Kartu Debit/transfer dengan dasar SPBy',
    requiredFields: [
      'nama_ppk',
      'nip_ppk',
      'nama_bank',
      'nomor_rekening',
      'nama_rekening',
      'jumlah_angka',
      'nomor_spby',
      'tanggal_spby',
      'nama_bendahara',
      'nip_bendahara'
    ],
    signatures: ['PPK', 'Bendahara']
  },

  BA_PEMBAYARAN: {
    name: 'Berita Acara Pembayaran',
    code: 'BA_PEMBAYARAN',
    category: 'BERITA_ACARA',
    description: 'BA pembayaran antara PPK dan penyedia barang/jasa',
    requiredFields: [
      'nama_ppk',
      'nip_ppk',
      'nama_penyedia',
      'jabatan_penyedia',
      'nama_kegiatan',
      'nomor_kontrak',
      'nilai_dibayar',
      'nama_bendahara',
      'nip_bendahara'
    ],
    signatures: ['Penyedia', 'PPK', 'Bendahara']
  },

  PPHP: {
    name: 'Berita Acara Pemeriksaan Hasil Pekerjaan',
    code: 'PPHP',
    category: 'BERITA_ACARA',
    description: 'BA pemeriksaan hasil pekerjaan oleh PPHP',
    requiredFields: [
      'nama_pphp',
      'nip_pphp',
      'nama_penyedia',
      'jabatan_penyedia',
      'nama_kegiatan',
      'nomor_kontrak',
      'nilai_kontrak',
      'ruang_lingkup_pekerjaan'
    ],
    signatures: ['Penyedia', 'PPHP']
  },

  BAST: {
    name: 'Berita Acara Serah Terima',
    code: 'BAST',
    category: 'BERITA_ACARA',
    description: 'BA serah terima hasil pekerjaan dari penyedia ke PPK',
    requiredFields: [
      'nama_penyedia',
      'jabatan_penyedia',
      'nama_ppk',
      'nip_ppk',
      'nama_kegiatan',
      'nomor_kontrak',
      'nilai_kontrak',
      'nama_pphp',
      'nip_pphp'
    ],
    signatures: ['Penyedia', 'PPK', 'PPHP']
  },

  TANDA_TERIMA_UPTUP: {
    name: 'Tanda Terima Uang Persediaan/Tambahan Uang Persediaan',
    code: 'TANDA_TERIMA_UPTUP',
    category: 'RECEIPT',
    description: 'Tanda terima UP/TUP dari bendahara',
    requiredFields: [
      'nama_penerima',
      'nip_penerima',
      'jabatan_penerima',
      'nama_bendahara',
      'nip_bendahara',
      'jumlah_angka',
      'jenis_uang',
      'uraian_keperluan'
    ],
    signatures: ['Penerima', 'Bendahara']
  },

  RPD: {
    name: 'Rencana Penarikan Dana Bulanan',
    code: 'RPD',
    category: 'PLANNING',
    description: 'Rencana penarikan dana per bulan untuk satu tahun anggaran',
    requiredFields: [
      'nama_satker',
      'kode_satker',
      'nama_program',
      'nama_kegiatan',
      'nama_output',
      'nama_ppk',
      'nip_ppk',
      'nama_kpa',
      'nip_kpa',
      'items'
    ],
    signatures: ['PPK', 'KPA'],
    format: 'landscape'
  },

  SPJ_COVER: {
    name: 'Cover Paket SPJ',
    code: 'SPJ_COVER',
    category: 'SPJ_PACKAGE',
    description: 'Sampul depan paket pertanggungjawaban keuangan',
    requiredFields: [
      'tahun_anggaran',
      'nama_kegiatan',
      'nama_output',
      'kode_kegiatan',
      'sumber_dana',
      'jenis_pembayaran',
      'nilai_total',
      'nama_ppk',
      'nip_ppk',
      'nama_kpa',
      'nip_kpa'
    ],
    signatures: []
  },

  SPJ_PENGESAHAN: {
    name: 'Lembar Pengesahan Paket SPJ',
    code: 'SPJ_PENGESAHAN',
    category: 'SPJ_PACKAGE',
    description: 'Lembar pengesahan resmi paket SPJ',
    requiredFields: [
      'tahun_anggaran',
      'nama_kegiatan',
      'nama_satker',
      'jenis_pembayaran',
      'nilai_total',
      'nama_ppk',
      'nip_ppk',
      'nama_kpa',
      'nip_kpa',
      'nama_bendahara',
      'nip_bendahara'
    ],
    signatures: ['PPK', 'KPA', 'Bendahara']
  },

  KUITANSI_UM_PERDIN: {
    name: 'Kuitansi Uang Muka Perjalanan Dinas',
    code: 'KUITANSI_UM_PERDIN',
    category: 'PERJALANAN_DINAS',
    description: 'Kuitansi uang muka biaya perjalanan dinas',
    requiredFields: [
      'nama_pegawai',
      'nip_pegawai',
      'jabatan_pegawai',
      'tujuan',
      'tanggal_berangkat',
      'tanggal_kembali',
      'nomor_surat_tugas',
      'tanggal_surat_tugas',
      'jumlah_uang_muka',
      'terbilang_uang_muka',
      'kode_akun',
      'nama_ppk',
      'nip_ppk',
      'nama_bendahara',
      'nip_bendahara'
    ],
    signatures: ['Penerima', 'PPK', 'Bendahara'],
    materai: true
  },

  KUITANSI_RAMPUNG_PERDIN: {
    name: 'Kuitansi Rampung Perjalanan Dinas',
    code: 'KUITANSI_RAMPUNG_PERDIN',
    category: 'PERJALANAN_DINAS',
    description: 'Kuitansi pelunasan biaya perjalanan dinas (rampung)',
    requiredFields: [
      'nama_pegawai',
      'nip_pegawai',
      'jabatan_pegawai',
      'tujuan',
      'tanggal_berangkat',
      'tanggal_kembali',
      'nomor_surat_tugas',
      'tanggal_surat_tugas',
      'jumlah_rampung',
      'terbilang_rampung',
      'total_biaya_riil',
      'uang_muka',
      'kode_akun',
      'nama_ppk',
      'nip_ppk',
      'nama_bendahara',
      'nip_bendahara'
    ],
    signatures: ['Penerima', 'PPK', 'Bendahara'],
    materai: true
  },

  RINCIAN_BIAYA_PERDIN: {
    name: 'Rincian Biaya Perjalanan Dinas',
    code: 'RINCIAN_BIAYA_PERDIN',
    category: 'PERJALANAN_DINAS',
    description: 'Rincian biaya perjalanan dinas dengan breakdown per item',
    requiredFields: [
      'nama_pegawai',
      'nip_pegawai',
      'jabatan_pegawai',
      'tujuan',
      'tanggal_berangkat',
      'tanggal_kembali',
      'nomor_surat_tugas',
      'tanggal_surat_tugas',
      'grand_total',
      'terbilang_grand_total',
      'nama_ppk',
      'nip_ppk'
    ],
    signatures: ['PPK', 'Pegawai']
  },

  DAFTAR_NOMINATIF_SWAKELOLA: {
    name: 'Daftar Nominatif Pembayaran Swakelola',
    code: 'DAFTAR_NOMINATIF_SWAKELOLA',
    category: 'SWAKELOLA',
    description: 'Daftar pembayaran multi-supplier swakelola dengan perhitungan pajak',
    requiredFields: [
      'nama_kegiatan',
      'kode_kegiatan',
      'nama_satker',
      'bulan_pembayaran',
      'suppliers', // Array of suppliers
      'nama_ppk',
      'nip_ppk',
      'nama_bendahara',
      'nip_bendahara'
    ],
    signatures: ['PPK', 'Bendahara'],
    multiSupplier: true,
    taxCalculation: true
  },

  REKAP_PAJAK_SWAKELOLA: {
    name: 'Rekapitulasi Pajak Swakelola',
    code: 'REKAP_PAJAK_SWAKELOLA',
    category: 'SWAKELOLA',
    description: 'Rekapitulasi pajak pembayaran swakelola (PPh & PPN)',
    requiredFields: [
      'nama_kegiatan',
      'kode_kegiatan',
      'nama_satker',
      'bulan_pembayaran',
      'nama_ppk',
      'nip_ppk',
      'nama_bendahara',
      'nip_bendahara',
      'nama_verifikator',
      'nip_verifikator'
    ],
    signatures: ['Verifikator', 'PPK', 'Bendahara'],
    taxSummary: true
  }
}

/**
 * Get template path by code
 * @param {string} code - Template code
 * @returns {string} Template file path
 */
export function getTemplatePath(code) {
  if (!TEMPLATE_PATHS[code]) {
    throw new Error(`Template not found: ${code}`)
  }
  return TEMPLATE_PATHS[code]
}

/**
 * Get template metadata by code
 * @param {string} code - Template code
 * @returns {Object} Template metadata
 */
export function getTemplateMetadata(code) {
  if (!TEMPLATE_METADATA[code]) {
    throw new Error(`Template metadata not found: ${code}`)
  }
  return TEMPLATE_METADATA[code]
}

/**
 * Get all available templates
 * @returns {Array} List of template metadata
 */
export function getAllTemplates() {
  return Object.keys(TEMPLATE_METADATA).map(code => ({
    code,
    path: TEMPLATE_PATHS[code],
    ...TEMPLATE_METADATA[code]
  }))
}

/**
 * Get templates by category
 * @param {string} category - Category name
 * @returns {Array} List of templates in category
 */
export function getTemplatesByCategory(category) {
  return getAllTemplates().filter(t => t.category === category)
}

/**
 * Template categories
 */
export const TEMPLATE_CATEGORIES = {
  PAYMENT: 'PAYMENT',                 // SPR, SPPR
  BERITA_ACARA: 'BERITA_ACARA',       // BA Pembayaran, PPHP, BAST
  RECEIPT: 'RECEIPT',                 // Tanda Terima UP/TUP
  PLANNING: 'PLANNING',               // RPD
  PERJALANAN_DINAS: 'PERJALANAN_DINAS', // Kuitansi UM, Kuitansi Rampung, Rincian Biaya
  SWAKELOLA: 'SWAKELOLA',             // Daftar Nominatif, Rekap Pajak (Multi-Supplier)
  SPJ_PACKAGE: 'SPJ_PACKAGE'          // Cover, Pengesahan
}

export default {
  TEMPLATE_PATHS,
  TEMPLATE_METADATA,
  TEMPLATE_CATEGORIES,
  getTemplatePath,
  getTemplateMetadata,
  getAllTemplates,
  getTemplatesByCategory
}
