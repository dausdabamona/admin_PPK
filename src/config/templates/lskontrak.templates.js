/**
 * Template Configuration untuk LS Kontrak
 * Daftar dokumen yang dapat di-generate otomatis
 */

export const LS_KONTRAK_TEMPLATES = [
  // Dokumen Pembayaran
  {
    code: 'spp',
    label: 'SPP (Surat Permintaan Pembayaran)',
    description: 'Surat Permintaan Pembayaran untuk kontrak ini',
    group: 'Dokumen Pembayaran',
    required: true,
    basedOn: 'Kepmen KP 56/2024',
    generator: 'generateSppPDF'
  },
  {
    code: 'ringkasan-kontrak',
    label: 'Ringkasan Kontrak',
    description: 'Ringkasan data kontrak untuk lampiran SPP',
    group: 'Dokumen Pembayaran',
    required: true,
    generator: 'generateRingkasanKontrakPDF'
  },
  {
    code: 'rincian-pembayaran',
    label: 'Rincian Pembayaran',
    description: 'Rincian perhitungan pembayaran (bruto, PPN, PPh, netto)',
    group: 'Dokumen Pembayaran',
    required: true,
    generator: 'generateRincianPembayaranPDF'
  },

  // Dokumen Administrasi
  {
    code: 'kwitansi',
    label: 'Kwitansi',
    description: 'Kwitansi pembayaran (template untuk ditandatangani penyedia)',
    group: 'Dokumen Administrasi',
    required: true,
    generator: 'generateKwitansiPDF'
  },
  {
    code: 'tanda-terima',
    label: 'Tanda Terima',
    description: 'Tanda terima pembayaran',
    group: 'Dokumen Administrasi',
    required: true,
    generator: 'generateTandaTerimaPDF'
  },
  {
    code: 'daftar-nominatif',
    label: 'Daftar Nominatif',
    description: 'Daftar nominatif pembayaran',
    group: 'Dokumen Administrasi',
    required: false,
    generator: 'generateDaftarNominatifPDF'
  },

  // Dokumen Pelaporan
  {
    code: 'bast',
    label: 'Berita Acara Serah Terima',
    description: 'Template BAST (untuk diisi dan ditandatangani)',
    group: 'Dokumen Pelaporan',
    required: true,
    basedOn: 'Format Standar KKP',
    generator: 'generateBastPDF'
  },
  {
    code: 'laporan-realisasi',
    label: 'Laporan Realisasi',
    description: 'Laporan realisasi kontrak',
    group: 'Dokumen Pelaporan',
    required: false,
    generator: 'generateLaporanRealisasiPDF'
  },
  {
    code: 'kartu-pengawasan',
    label: 'Kartu Pengawasan',
    description: 'Kartu pengawasan pelaksanaan kontrak',
    group: 'Dokumen Pelaporan',
    required: false,
    generator: 'generateKartuPengawasanPDF'
  }
]

export default LS_KONTRAK_TEMPLATES
