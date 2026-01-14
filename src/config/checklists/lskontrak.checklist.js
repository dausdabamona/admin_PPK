/**
 * Checklist Dokumen LS Kontrak
 * Berdasarkan Kepmen KP No. 56 Tahun 2024
 */

export const LS_KONTRAK_CHECKLIST = [
  // WAJIB
  {
    code: 'kontrak',
    label: 'Kontrak / SPK',
    description: 'Surat Perjanjian Kerja atau Kontrak yang telah ditandatangani',
    category: 'mandatory',
    status: 'pending',
    note: 'Dokumen kontrak harus sudah ditandatangani oleh kedua belah pihak'
  },
  {
    code: 'spmk',
    label: 'SPMK',
    description: 'Surat Perintah Mulai Kerja',
    category: 'mandatory',
    status: 'pending',
    note: 'Diterbitkan setelah kontrak ditandatangani'
  },
  {
    code: 'bast-penyedia',
    label: 'BAST Penyedia',
    description: 'Berita Acara Serah Terima dari penyedia kepada PPK',
    category: 'mandatory',
    status: 'pending'
  },
  {
    code: 'faktur',
    label: 'Faktur / Kwitansi',
    description: 'Faktur atau kwitansi pembayaran dari penyedia',
    category: 'mandatory',
    status: 'pending',
    note: 'Bermaterai dan ditandatangani oleh penyedia'
  },
  {
    code: 'bukti-transfer',
    label: 'Bukti Transfer',
    description: 'Bukti transfer pembayaran ke rekening penyedia',
    category: 'mandatory',
    status: 'pending'
  },
  {
    code: 'npwp-penyedia',
    label: 'NPWP Penyedia',
    description: 'Fotokopi NPWP penyedia',
    category: 'mandatory',
    status: 'pending'
  },
  {
    code: 'bap-pemeriksaan',
    label: 'BAP Pemeriksaan',
    description: 'Berita Acara Pemeriksaan hasil pekerjaan',
    category: 'mandatory',
    status: 'pending',
    note: 'Ditandatangani oleh tim pemeriksa'
  },
  {
    code: 'foto-dokumentasi',
    label: 'Foto Dokumentasi',
    description: 'Dokumentasi foto hasil pekerjaan (before-after)',
    category: 'mandatory',
    status: 'pending',
    note: 'Minimal 4 foto (sebelum dan sesudah pekerjaan)'
  },

  // DIANJURKAN
  {
    code: 'surat-penawaran',
    label: 'Surat Penawaran',
    description: 'Surat penawaran dari penyedia',
    category: 'recommended',
    status: 'pending',
    note: 'Dokumen awal proses negosiasi'
  },
  {
    code: 'ba-klarifikasi',
    label: 'Berita Acara Klarifikasi',
    description: 'Berita Acara hasil klarifikasi teknis dan harga',
    category: 'recommended',
    status: 'pending'
  },
  {
    code: 'spesifikasi-teknis',
    label: 'Spesifikasi Teknis',
    description: 'Dokumen spesifikasi teknis pekerjaan',
    category: 'recommended',
    status: 'pending'
  },

  // OPSIONAL
  {
    code: 'foto-progress',
    label: 'Foto Progress Pekerjaan',
    description: 'Dokumentasi foto selama proses pekerjaan',
    category: 'optional',
    status: 'pending',
    note: 'Berguna untuk pemantauan'
  },
  {
    code: 'email-korespondensi',
    label: 'Email Korespondensi',
    description: 'Email korespondensi dengan penyedia',
    category: 'optional',
    status: 'pending'
  },
  {
    code: 'dokumen-pendukung',
    label: 'Dokumen Pendukung Lainnya',
    description: 'Dokumen pendukung tambahan (jika ada)',
    category: 'optional',
    status: 'pending'
  }
]

export default LS_KONTRAK_CHECKLIST
