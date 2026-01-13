import Dexie from 'dexie'

// Create database instance
export const db = new Dexie('SIPBJ_SPJ_Database')

// Database schema version 4 - Added audit trail and document history
db.version(4).stores({
  // ==================== EXISTING TABLES ====================
  // Master Data: Pegawai
  pegawai: '++id, nip, nama, jabatan, golongan, pangkat, rekening, bank, unitKerja, createdAt, createdBy, updatedAt, revision',

  // Master Data: Kota (dengan SBM tarif untuk Dalam Kota dan Luar Kota)
  kota: '++id, namaKota, provinsi, tarifHarianDalamKota, tarifHarianLuarKota, tarifPenginapan, tarifTransportLokal, tarifTransportAntarKota, createdAt',

  // Master Data: Pejabat (PPK, KPA)
  pejabat: '++id, nip, nama, jabatan, jenisPejabat, pangkat, golongan, createdAt',

  // Surat Tugas
  suratTugas: '++id, nomor, tanggal, perihal, dasar, tujuanKegiatan, pegawaiIds, kotaAsal, kotaTujuan, tanggalMulai, tanggalSelesai, transportasi, jenisPerjadin, status, createdAt, createdBy, updatedAt, revision, archivePath',

  // SPPD
  sppd: '++id, nomor, suratTugasId, pegawaiId, tanggal, jenisPerjadin, kotaAsal, kotaTujuan, tanggalBerangkat, tanggalKembali, maksudPerjalanan, tingkatBiaya, keteranganLain, ppkId, kpaId, status, createdAt, createdBy, updatedAt, revision, archivePath',

  // Pembayaran LS (Awal)
  pembayaranLS: '++id, sppdId, pegawaiId, tanggal, uangHarian, jumlahHari, totalUangHarian, transport, penginapan, jumlahMalam, totalPenginapan, totalLS, keterangan, createdAt, createdBy, updatedAt, revision',

  // Rampung Perjalanan Dinas
  rampung: '++id, sppdId, pegawaiId, jenisPerjadin, tanggal, realisasiUangHarian, jumlahHariRealisasi, totalRealisasiUangHarian, realisasiTransport, realisasiPenginapan, jumlahMalamRealisasi, totalRealisasiPenginapan, totalPengeluaranRiil, totalRealisasi, nilaiLS, selisih, statusSelisih, keterangan, createdAt, createdBy, updatedAt, revision, archivePath',

  // Detail Pengeluaran Riil
  pengeluaranRiil: '++id, rampungId, tanggal, uraian, jumlah, bukti, createdAt',

  // Rincian Biaya (untuk dokumen)
  rincianBiaya: '++id, rampungId, jenisBiaya, uraian, volume, satuan, hargaSatuan, jumlah, createdAt',

  // Kwitansi SPPD
  kwitansiSPPD: '++id, rampungId, sppdId, pegawaiId, nomor, tanggal, jumlah, terbilang, keterangan, ttdPegawai, ttdPPK, createdAt',

  // Checklist SPJ SPPD
  checklistSPJ: '++id, sppdId, jenisPerjadin, items, statusKelengkapan, totalItem, itemLengkap, namaPemeriksa, tanggalPemeriksaan, catatan, createdAt, createdBy, updatedAt, revision',

  // Settings / Konfigurasi
  settings: '++id, key, value, updatedAt',

  // Nomor Urut (untuk auto numbering)
  nomorUrut: '++id, jenis, tahun, bulan, nomorTerakhir',

  // ==================== SWAKELOLA TABLES ====================
  // Master Data: Kegiatan Swakelola
  swakelolaKegiatan: '++id, kode, nama, tahun, sumberDana, akun, pagu, deskripsi, tanggalMulai, tanggalSelesai, status, createdAt, createdBy, updatedAt, revision, archivePath',

  // Tim Swakelola
  swakelolaTim: '++id, kegiatanId, nomorSK, tanggalSK, pegawaiId, peran, honorPerBulan, jumlahBulan, totalHonor, rekening, bank, createdAt',

  // Uang Muka / Panjar Swakelola
  swakelolaUangMuka: '++id, kegiatanId, nomorKwitansi, tanggal, penerimaId, tipePenerima, jumlah, terbilang, keterangan, rekeningTujuan, bankTujuan, status, createdAt, createdBy, updatedAt, revision',

  // Realisasi Biaya Swakelola
  swakelolaRealisasi: '++id, kegiatanId, uangMukaId, tanggal, items, totalRealisasi, keterangan, createdAt, createdBy, updatedAt, revision',

  // Item Realisasi Detail
  swakelolaRealisasiItem: '++id, realisasiId, kategori, uraian, volume, satuan, hargaSatuan, jumlah, tanggal, noBukti, createdAt',

  // Rampung Swakelola
  swakelolaRampung: '++id, kegiatanId, uangMukaId, realisasiId, tanggal, totalUangMuka, totalRealisasi, selisih, statusSelisih, nomorKwitansi, keterangan, createdAt, createdBy, updatedAt, revision, archivePath',

  // Checklist SPJ Swakelola
  swakelolaChecklist: '++id, kegiatanId, rampungId, items, statusKelengkapan, totalItem, itemLengkap, namaPemeriksa, tanggalPemeriksaan, catatan, createdAt, createdBy, updatedAt, revision',

  // ==================== PJLP TABLES ====================
  // Master Data PJLP
  pjlpMaster: '++id, nik, npwp, nama, posisi, unitKerja, rekening, bank, bpjsKesehatan, bpjsKetenagakerjaan, honorBulanan, masaKontrakMulai, masaKontrakSelesai, statusAktif, createdAt, createdBy, updatedAt, revision',

  // Perencanaan PJLP
  pjlpPerencanaan: '++id, tahun, nomorDokumen, tanggal, analisisKebutuhan, analisisBebanKerja, torKak, posisiDibutuhkan, jumlahOrang, honorBulanan, durasiKontrak, totalNilai, biayaBpjsKesehatan, biayaBpjsKetenagakerjaan, biayaThr, estimasiPph, totalHps, keterangan, status, createdAt, createdBy, updatedAt, revision, archivePath',

  // Kontrak PJLP
  pjlpKontrak: '++id, pjlpId, nomorKontrak, tanggalKontrak, periodeAwal, periodeAkhir, honorBulanan, nilaiKontrak, posisi, lokasiKerja, lingkupPekerjaan, outputPekerjaan, status, createdAt, createdBy, updatedAt, revision, archivePath',

  // SPK (Surat Perintah Kerja)
  pjlpSpk: '++id, kontrakId, pjlpId, nomorSpk, tanggalSpk, periodeAwal, periodeAkhir, nilaiKontrak, keterangan, createdAt',

  // SPMK (Surat Perintah Mulai Kerja)
  pjlpSpmk: '++id, kontrakId, pjlpId, spkId, nomorSpmk, tanggalSpmk, tanggalMulaiKerja, keterangan, createdAt',

  // Presensi Bulanan
  pjlpPresensi: '++id, pjlpId, kontrakId, bulan, tahun, hariKerja, hadir, izin, sakit, alpa, terlambat, keterangan, createdAt, createdBy, updatedAt, revision',

  // Laporan Bulanan
  pjlpLaporanBulanan: '++id, pjlpId, kontrakId, bulan, tahun, uraianPekerjaan, outputDicapai, kendala, solusi, tanggalLaporan, status, createdAt',

  // Pembayaran Bulanan
  pjlpPembayaran: '++id, pjlpId, kontrakId, bulan, tahun, honorBruto, potonganPph, tarifPph, potonganBpjsKesehatan, potonganBpjsKetenagakerjaan, potonganLain, totalPotongan, honorNetto, rekening, bank, tanggalBayar, status, keterangan, createdAt, createdBy, updatedAt, revision, archivePath',

  // Kwitansi PJLP
  pjlpKwitansi: '++id, pembayaranId, pjlpId, nomorKwitansi, tanggal, jumlah, terbilang, keterangan, createdAt',

  // Penilaian Kinerja Triwulan
  pjlpPenilaian: '++id, pjlpId, kontrakId, tahun, triwulan, nilaiKualitas, bobotKualitas, nilaiWaktu, bobotWaktu, nilaiBiaya, bobotBiaya, nilaiLayanan, bobotLayanan, nilaiAkhir, kategori, catatanPenilai, namaPenilai, tanggalPenilaian, createdAt, createdBy, updatedAt, revision',

  // Checklist SPJ PJLP
  pjlpChecklist: '++id, pjlpId, kontrakId, bulan, tahun, items, statusKelengkapan, totalItem, itemLengkap, namaPemeriksa, tanggalPemeriksaan, catatan, createdAt, createdBy, updatedAt, revision',

  // Arsip Digital PJLP
  pjlpArsip: '++id, pjlpId, tahun, jenisDokumen, bulan, triwulan, namaDokumen, namaFile, ukuranFile, pathArsip, keterangan, createdAt',

  // ==================== AUDIT TRAIL TABLE ====================
  // Document History / Audit Trail
  documentHistory: '++id, tableName, recordId, action, fieldChanges, previousData, newData, createdBy, createdAt, ipAddress, userAgent, archivePath'
})

// Database schema version 3 - Added PJLP tables (kept for migration)
db.version(3).stores({
  // ==================== EXISTING TABLES ====================
  // Master Data: Pegawai
  pegawai: '++id, nip, nama, jabatan, golongan, pangkat, rekening, bank, unitKerja, createdAt',

  // Master Data: Kota (dengan SBM tarif untuk Dalam Kota dan Luar Kota)
  kota: '++id, namaKota, provinsi, tarifHarianDalamKota, tarifHarianLuarKota, tarifPenginapan, tarifTransportLokal, tarifTransportAntarKota, createdAt',

  // Master Data: Pejabat (PPK, KPA)
  pejabat: '++id, nip, nama, jabatan, jenisPejabat, pangkat, golongan, createdAt',

  // Surat Tugas
  suratTugas: '++id, nomor, tanggal, perihal, dasar, tujuanKegiatan, pegawaiIds, kotaAsal, kotaTujuan, tanggalMulai, tanggalSelesai, transportasi, jenisPerjadin, status, createdAt',

  // SPPD
  sppd: '++id, nomor, suratTugasId, pegawaiId, tanggal, jenisPerjadin, kotaAsal, kotaTujuan, tanggalBerangkat, tanggalKembali, maksudPerjalanan, tingkatBiaya, keteranganLain, ppkId, kpaId, status, createdAt',

  // Pembayaran LS (Awal)
  pembayaranLS: '++id, sppdId, pegawaiId, tanggal, uangHarian, jumlahHari, totalUangHarian, transport, penginapan, jumlahMalam, totalPenginapan, totalLS, keterangan, createdAt',

  // Rampung Perjalanan Dinas
  rampung: '++id, sppdId, pegawaiId, jenisPerjadin, tanggal, realisasiUangHarian, jumlahHariRealisasi, totalRealisasiUangHarian, realisasiTransport, realisasiPenginapan, jumlahMalamRealisasi, totalRealisasiPenginapan, totalPengeluaranRiil, totalRealisasi, nilaiLS, selisih, statusSelisih, keterangan, createdAt',

  // Detail Pengeluaran Riil
  pengeluaranRiil: '++id, rampungId, tanggal, uraian, jumlah, bukti, createdAt',

  // Rincian Biaya (untuk dokumen)
  rincianBiaya: '++id, rampungId, jenisBiaya, uraian, volume, satuan, hargaSatuan, jumlah, createdAt',

  // Kwitansi SPPD
  kwitansiSPPD: '++id, rampungId, sppdId, pegawaiId, nomor, tanggal, jumlah, terbilang, keterangan, ttdPegawai, ttdPPK, createdAt',

  // Checklist SPJ SPPD
  checklistSPJ: '++id, sppdId, jenisPerjadin, items, statusKelengkapan, totalItem, itemLengkap, namaPemeriksa, tanggalPemeriksaan, catatan, createdAt',

  // Settings / Konfigurasi
  settings: '++id, key, value, updatedAt',

  // Nomor Urut (untuk auto numbering)
  nomorUrut: '++id, jenis, tahun, bulan, nomorTerakhir',

  // ==================== SWAKELOLA TABLES ====================
  // Master Data: Kegiatan Swakelola
  swakelolaKegiatan: '++id, kode, nama, tahun, sumberDana, akun, pagu, deskripsi, tanggalMulai, tanggalSelesai, status, createdAt',

  // Tim Swakelola
  swakelolaTim: '++id, kegiatanId, nomorSK, tanggalSK, pegawaiId, peran, honorPerBulan, jumlahBulan, totalHonor, rekening, bank, createdAt',

  // Uang Muka / Panjar Swakelola
  swakelolaUangMuka: '++id, kegiatanId, nomorKwitansi, tanggal, penerimaId, tipePenerima, jumlah, terbilang, keterangan, rekeningTujuan, bankTujuan, status, createdAt',

  // Realisasi Biaya Swakelola
  swakelolaRealisasi: '++id, kegiatanId, uangMukaId, tanggal, items, totalRealisasi, keterangan, createdAt',

  // Item Realisasi Detail
  swakelolaRealisasiItem: '++id, realisasiId, kategori, uraian, volume, satuan, hargaSatuan, jumlah, tanggal, noBukti, createdAt',

  // Rampung Swakelola
  swakelolaRampung: '++id, kegiatanId, uangMukaId, realisasiId, tanggal, totalUangMuka, totalRealisasi, selisih, statusSelisih, nomorKwitansi, keterangan, createdAt',

  // Checklist SPJ Swakelola
  swakelolaChecklist: '++id, kegiatanId, rampungId, items, statusKelengkapan, totalItem, itemLengkap, namaPemeriksa, tanggalPemeriksaan, catatan, createdAt',

  // ==================== PJLP TABLES ====================
  // Master Data PJLP
  pjlpMaster: '++id, nik, npwp, nama, posisi, unitKerja, rekening, bank, bpjsKesehatan, bpjsKetenagakerjaan, honorBulanan, masaKontrakMulai, masaKontrakSelesai, statusAktif, createdAt',

  // Perencanaan PJLP
  pjlpPerencanaan: '++id, tahun, nomorDokumen, tanggal, analisisKebutuhan, analisisBebanKerja, torKak, posisiDibutuhkan, jumlahOrang, honorBulanan, durasiKontrak, totalNilai, biayaBpjsKesehatan, biayaBpjsKetenagakerjaan, biayaThr, estimasiPph, totalHps, keterangan, status, createdAt',

  // Kontrak PJLP
  pjlpKontrak: '++id, pjlpId, nomorKontrak, tanggalKontrak, periodeAwal, periodeAkhir, honorBulanan, nilaiKontrak, posisi, lokasiKerja, lingkupPekerjaan, outputPekerjaan, status, createdAt',

  // SPK (Surat Perintah Kerja)
  pjlpSpk: '++id, kontrakId, pjlpId, nomorSpk, tanggalSpk, periodeAwal, periodeAkhir, nilaiKontrak, keterangan, createdAt',

  // SPMK (Surat Perintah Mulai Kerja)
  pjlpSpmk: '++id, kontrakId, pjlpId, spkId, nomorSpmk, tanggalSpmk, tanggalMulaiKerja, keterangan, createdAt',

  // Presensi Bulanan
  pjlpPresensi: '++id, pjlpId, kontrakId, bulan, tahun, hariKerja, hadir, izin, sakit, alpa, terlambat, keterangan, createdAt',

  // Laporan Bulanan
  pjlpLaporanBulanan: '++id, pjlpId, kontrakId, bulan, tahun, uraianPekerjaan, outputDicapai, kendala, solusi, tanggalLaporan, status, createdAt',

  // Pembayaran Bulanan
  pjlpPembayaran: '++id, pjlpId, kontrakId, bulan, tahun, honorBruto, potonganPph, tarifPph, potonganBpjsKesehatan, potonganBpjsKetenagakerjaan, potonganLain, totalPotongan, honorNetto, rekening, bank, tanggalBayar, status, keterangan, createdAt',

  // Kwitansi PJLP
  pjlpKwitansi: '++id, pembayaranId, pjlpId, nomorKwitansi, tanggal, jumlah, terbilang, keterangan, createdAt',

  // Penilaian Kinerja Triwulan
  pjlpPenilaian: '++id, pjlpId, kontrakId, tahun, triwulan, nilaiKualitas, bobotKualitas, nilaiWaktu, bobotWaktu, nilaiBiaya, bobotBiaya, nilaiLayanan, bobotLayanan, nilaiAkhir, kategori, catatanPenilai, namaPenilai, tanggalPenilaian, createdAt',

  // Checklist SPJ PJLP
  pjlpChecklist: '++id, pjlpId, kontrakId, bulan, tahun, items, statusKelengkapan, totalItem, itemLengkap, namaPemeriksa, tanggalPemeriksaan, catatan, createdAt',

  // Arsip Digital PJLP
  pjlpArsip: '++id, pjlpId, tahun, jenisDokumen, bulan, triwulan, namaDokumen, namaFile, ukuranFile, pathArsip, keterangan, createdAt'
})

// Checklist templates for SPPD
export const CHECKLIST_DALAM_KOTA = [
  { id: 'surat_tugas', nama: 'Surat Tugas', wajib: true },
  { id: 'sppd', nama: 'SPPD Dalam Kota', wajib: true },
  { id: 'rincian_biaya', nama: 'Rincian Biaya Perjalanan Dinas', wajib: true },
  { id: 'pengeluaran_riil', nama: 'Daftar Pengeluaran Riil', wajib: true },
  { id: 'kwitansi_rampung', nama: 'Kwitansi Rampung', wajib: true },
  { id: 'ssp_pph', nama: 'SSP PPh (jika ada)', wajib: false },
  { id: 'laporan_perjadin', nama: 'Laporan Perjalanan Dinas', wajib: true }
]

export const CHECKLIST_LUAR_KOTA = [
  { id: 'surat_tugas', nama: 'Surat Tugas', wajib: true },
  { id: 'sppd', nama: 'SPPD Luar Kota', wajib: true },
  { id: 'rincian_biaya', nama: 'Rincian Biaya Perjalanan Dinas', wajib: true },
  { id: 'pengeluaran_riil', nama: 'Daftar Pengeluaran Riil', wajib: true },
  { id: 'boarding_pass', nama: 'Boarding Pass / Tiket', wajib: true },
  { id: 'kwitansi_rampung', nama: 'Kwitansi Rampung', wajib: true },
  { id: 'ssp_pph', nama: 'SSP PPh', wajib: false },
  { id: 'laporan_perjadin', nama: 'Laporan Perjalanan Dinas', wajib: true }
]

// Checklist template for Swakelola (Kepmen KP No.56 Tahun 2024)
export const CHECKLIST_SWAKELOLA = [
  { id: 'sk_tim', nama: 'SK / Surat Tugas Tim Swakelola', wajib: true },
  { id: 'rab', nama: 'RAB Swakelola', wajib: true },
  { id: 'kwitansi_uang_muka', nama: 'Kwitansi Uang Muka', wajib: true },
  { id: 'bukti_realisasi', nama: 'Bukti Realisasi (Nota, Kuitansi)', wajib: true },
  { id: 'rincian_biaya', nama: 'Rincian Biaya Realisasi', wajib: true },
  { id: 'kwitansi_rampung', nama: 'Kwitansi Rampung Swakelola', wajib: true },
  { id: 'ssp_setoran', nama: 'SSP Setoran Sisa (jika lebih bayar)', wajib: false },
  { id: 'laporan_kegiatan', nama: 'Laporan Pelaksanaan Kegiatan', wajib: true }
]

// Kategori Realisasi Swakelola
export const KATEGORI_REALISASI_SWAKELOLA = [
  { id: 'belanja_bahan', nama: 'Belanja Bahan', kode: '521211' },
  { id: 'honor_tim', nama: 'Honor Tim Pelaksana', kode: '521213' },
  { id: 'transport_lokal', nama: 'Transport Lokal', kode: '524119' },
  { id: 'sewa_alat', nama: 'Sewa Peralatan', kode: '522141' },
  { id: 'konsumsi', nama: 'Konsumsi Rapat/Kegiatan', kode: '521211' },
  { id: 'pengeluaran_riil', nama: 'Pengeluaran Riil Lainnya', kode: '521219' },
  { id: 'fotocopy', nama: 'Fotocopy/ATK', kode: '521211' },
  { id: 'dokumentasi', nama: 'Dokumentasi', kode: '521219' }
]

// Peran dalam Tim Swakelola
export const PERAN_TIM_SWAKELOLA = [
  { id: 'ketua', nama: 'Ketua Tim' },
  { id: 'sekretaris', nama: 'Sekretaris' },
  { id: 'bendahara', nama: 'Bendahara' },
  { id: 'anggota', nama: 'Anggota' },
  { id: 'pelaksana', nama: 'Pelaksana' }
]

// Jenis Perjadin constants
export const JENIS_PERJADIN = {
  DALAM_KOTA: 'dalam_kota',
  LUAR_KOTA: 'luar_kota'
}

// Status Swakelola
export const STATUS_SWAKELOLA = {
  DRAFT: 'draft',
  AKTIF: 'aktif',
  PROSES: 'proses',
  SELESAI: 'selesai'
}

// ==================== PJLP CONSTANTS ====================

// Checklist SPJ PJLP (Kepmen KP No.56 Tahun 2024)
export const CHECKLIST_PJLP = [
  { id: 'kontrak_spk', nama: 'Surat Perintah Kerja (SPK)', wajib: true },
  { id: 'spmk', nama: 'Surat Perintah Mulai Kerja (SPMK)', wajib: true },
  { id: 'presensi', nama: 'Daftar Hadir/Presensi Bulanan', wajib: true },
  { id: 'laporan_bulanan', nama: 'Laporan Pekerjaan Bulanan', wajib: true },
  { id: 'bap', nama: 'Berita Acara Pemeriksaan', wajib: true },
  { id: 'penilaian_triwulan', nama: 'Form Penilaian Kinerja Triwulan', wajib: false },
  { id: 'kwitansi', nama: 'Kwitansi Pembayaran', wajib: true },
  { id: 'ssp_pph', nama: 'SSP PPh 21', wajib: true },
  { id: 'bukti_bpjs', nama: 'Bukti Pembayaran BPJS', wajib: false },
  { id: 'bast', nama: 'Berita Acara Serah Terima', wajib: false }
]

// Posisi/Jabatan PJLP
export const POSISI_PJLP = [
  { id: 'tenaga_keamanan', nama: 'Tenaga Keamanan' },
  { id: 'tenaga_kebersihan', nama: 'Tenaga Kebersihan' },
  { id: 'pengemudi', nama: 'Pengemudi' },
  { id: 'resepsionis', nama: 'Resepsionis' },
  { id: 'petugas_arsip', nama: 'Petugas Arsip' },
  { id: 'operator_komputer', nama: 'Operator Komputer' },
  { id: 'teknisi', nama: 'Teknisi' },
  { id: 'pramusaji', nama: 'Pramusaji' },
  { id: 'juru_taman', nama: 'Juru Taman' },
  { id: 'lainnya', nama: 'Lainnya' }
]

// Status PJLP
export const STATUS_PJLP = {
  AKTIF: 'aktif',
  NON_AKTIF: 'non_aktif',
  SELESAI_KONTRAK: 'selesai_kontrak'
}

// Status Kontrak PJLP
export const STATUS_KONTRAK_PJLP = {
  DRAFT: 'draft',
  AKTIF: 'aktif',
  SELESAI: 'selesai',
  BATAL: 'batal'
}

// Status Pembayaran PJLP
export const STATUS_PEMBAYARAN_PJLP = {
  DRAFT: 'draft',
  SIAP_BAYAR: 'siap_bayar',
  DIBAYAR: 'dibayar',
  BATAL: 'batal'
}

// Bobot Penilaian Kinerja PJLP (sesuai pedoman KKP/LKPP)
export const BOBOT_PENILAIAN_PJLP = {
  kualitas: 40,
  waktu: 20,
  biaya: 20,
  layanan: 20
}

// Kategori Penilaian Kinerja
export const KATEGORI_PENILAIAN_PJLP = [
  { min: 0, max: 50, kategori: 'Kurang', kode: 'K' },
  { min: 50.01, max: 70, kategori: 'Cukup', kode: 'C' },
  { min: 70.01, max: 85, kategori: 'Baik', kode: 'B' },
  { min: 85.01, max: 100, kategori: 'Sangat Baik', kode: 'SB' }
]

// Tarif PPh 21 Non NPWP (lebih tinggi 20%)
export const TARIF_PPH_PJLP = {
  withNpwp: 0.025, // 2.5% untuk yang punya NPWP
  withoutNpwp: 0.03 // 3% untuk yang tidak punya NPWP (lebih tinggi 20%)
}

// Tarif BPJS
export const TARIF_BPJS = {
  kesehatan: 0.01, // 1% dari gaji (ditanggung pekerja)
  ketenagakerjaan: 0.02 // 2% dari gaji (ditanggung pekerja)
}

// Jenis Dokumen Arsip PJLP
export const JENIS_DOKUMEN_PJLP = [
  { id: 'kontrak', nama: 'Kontrak/SPK' },
  { id: 'spmk', nama: 'SPMK' },
  { id: 'presensi', nama: 'Daftar Hadir' },
  { id: 'laporan', nama: 'Laporan Bulanan' },
  { id: 'kwitansi', nama: 'Kwitansi' },
  { id: 'penilaian', nama: 'Penilaian Triwulan' },
  { id: 'ssp', nama: 'SSP PPh' },
  { id: 'bast', nama: 'BAST' },
  { id: 'lainnya', nama: 'Dokumen Lainnya' }
]

// Bulan Indonesia
export const BULAN_INDONESIA = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
]

// Triwulan
export const TRIWULAN = [
  { value: 1, label: 'Triwulan I (Jan-Mar)', bulan: [1, 2, 3] },
  { value: 2, label: 'Triwulan II (Apr-Jun)', bulan: [4, 5, 6] },
  { value: 3, label: 'Triwulan III (Jul-Sep)', bulan: [7, 8, 9] },
  { value: 4, label: 'Triwulan IV (Okt-Des)', bulan: [10, 11, 12] }
]

// Helper: Get kategori penilaian from nilai
export function getKategoriPenilaian(nilai) {
  const kategori = KATEGORI_PENILAIAN_PJLP.find(k => nilai >= k.min && nilai <= k.max)
  return kategori ? kategori.kategori : 'N/A'
}

// Helper: Calculate PPh PJLP
export function calculatePphPjlp(honorBruto, hasNpwp = false) {
  const tarif = hasNpwp ? TARIF_PPH_PJLP.withNpwp : TARIF_PPH_PJLP.withoutNpwp
  return Math.round(honorBruto * tarif)
}

// Helper: Calculate BPJS
export function calculateBpjs(honorBruto) {
  return {
    kesehatan: Math.round(honorBruto * TARIF_BPJS.kesehatan),
    ketenagakerjaan: Math.round(honorBruto * TARIF_BPJS.ketenagakerjaan)
  }
}

// Helper: Generate path arsip PJLP
export function generatePathArsipPjlp(tahun, namaPjlp) {
  const namaClean = namaPjlp.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()
  return `ARSIP/${tahun}/PJLP/${namaClean}/`
}

// Helper: Generate nama file arsip PJLP
export function generateNamaFileArsipPjlp(tahun, jenis, bulanOrTriwulan, namaPjlp, ext = 'pdf') {
  const namaClean = namaPjlp.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()
  return `${tahun}-PJLP-${jenis.toUpperCase()}-${bulanOrTriwulan}-${namaClean}.${ext}`
}

// Initialize default settings
export async function initializeDefaultSettings() {
  const existingSettings = await db.settings.count()

  if (existingSettings === 0) {
    await db.settings.bulkAdd([
      { key: 'nama_instansi', value: 'Politeknik Kelautan dan Perikanan Sorong', updatedAt: new Date() },
      { key: 'alamat_instansi', value: 'Jl. Kapitan Pattimura, Sorong, Papua Barat Daya', updatedAt: new Date() },
      { key: 'kode_satker', value: '032.11.423.585', updatedAt: new Date() },
      { key: 'tahun_anggaran', value: new Date().getFullYear().toString(), updatedAt: new Date() },
      { key: 'prefix_surat_tugas', value: 'ST', updatedAt: new Date() },
      { key: 'prefix_sppd', value: 'SPPD', updatedAt: new Date() },
      { key: 'prefix_swakelola', value: 'SWK', updatedAt: new Date() },
      { key: 'prefix_kwitansi', value: 'KWT', updatedAt: new Date() },
      { key: 'nama_ppk', value: '', updatedAt: new Date() },
      { key: 'nip_ppk', value: '', updatedAt: new Date() },
      { key: 'nama_kpa', value: '', updatedAt: new Date() },
      { key: 'nip_kpa', value: '', updatedAt: new Date() }
    ])
  }
}

// Initialize default kota with SBM tarif
export async function initializeDefaultKota() {
  const existingKota = await db.kota.count()

  if (existingKota === 0) {
    await db.kota.bulkAdd([
      {
        namaKota: 'Sorong',
        provinsi: 'Papua Barat Daya',
        tarifHarianDalamKota: 150000,
        tarifHarianLuarKota: 410000,
        tarifPenginapan: 580000,
        tarifTransportLokal: 150000,
        tarifTransportAntarKota: 0,
        createdAt: new Date()
      },
      {
        namaKota: 'Manokwari',
        provinsi: 'Papua Barat',
        tarifHarianDalamKota: 150000,
        tarifHarianLuarKota: 410000,
        tarifPenginapan: 580000,
        tarifTransportLokal: 150000,
        tarifTransportAntarKota: 1500000,
        createdAt: new Date()
      },
      {
        namaKota: 'Jayapura',
        provinsi: 'Papua',
        tarifHarianDalamKota: 160000,
        tarifHarianLuarKota: 430000,
        tarifPenginapan: 640000,
        tarifTransportLokal: 150000,
        tarifTransportAntarKota: 2500000,
        createdAt: new Date()
      },
      {
        namaKota: 'Makassar',
        provinsi: 'Sulawesi Selatan',
        tarifHarianDalamKota: 160000,
        tarifHarianLuarKota: 430000,
        tarifPenginapan: 710000,
        tarifTransportLokal: 200000,
        tarifTransportAntarKota: 3000000,
        createdAt: new Date()
      },
      {
        namaKota: 'Jakarta',
        provinsi: 'DKI Jakarta',
        tarifHarianDalamKota: 200000,
        tarifHarianLuarKota: 530000,
        tarifPenginapan: 1100000,
        tarifTransportLokal: 250000,
        tarifTransportAntarKota: 4500000,
        createdAt: new Date()
      },
      {
        namaKota: 'Surabaya',
        provinsi: 'Jawa Timur',
        tarifHarianDalamKota: 170000,
        tarifHarianLuarKota: 430000,
        tarifPenginapan: 760000,
        tarifTransportLokal: 200000,
        tarifTransportAntarKota: 3500000,
        createdAt: new Date()
      },
      {
        namaKota: 'Bandung',
        provinsi: 'Jawa Barat',
        tarifHarianDalamKota: 170000,
        tarifHarianLuarKota: 430000,
        tarifPenginapan: 660000,
        tarifTransportLokal: 200000,
        tarifTransportAntarKota: 4000000,
        createdAt: new Date()
      },
      {
        namaKota: 'Yogyakarta',
        provinsi: 'DI Yogyakarta',
        tarifHarianDalamKota: 160000,
        tarifHarianLuarKota: 420000,
        tarifPenginapan: 610000,
        tarifTransportLokal: 180000,
        tarifTransportAntarKota: 3800000,
        createdAt: new Date()
      },
      {
        namaKota: 'Semarang',
        provinsi: 'Jawa Tengah',
        tarifHarianDalamKota: 160000,
        tarifHarianLuarKota: 430000,
        tarifPenginapan: 610000,
        tarifTransportLokal: 180000,
        tarifTransportAntarKota: 3700000,
        createdAt: new Date()
      },
      {
        namaKota: 'Ambon',
        provinsi: 'Maluku',
        tarifHarianDalamKota: 150000,
        tarifHarianLuarKota: 410000,
        tarifPenginapan: 580000,
        tarifTransportLokal: 150000,
        tarifTransportAntarKota: 2800000,
        createdAt: new Date()
      }
    ])
  }
}

// Initialize database
export async function initializeDatabase() {
  await initializeDefaultSettings()
  await initializeDefaultKota()
}

// Get setting value by key
export async function getSetting(key) {
  const setting = await db.settings.where('key').equals(key).first()
  return setting?.value
}

// Update setting value
export async function updateSetting(key, value) {
  const existing = await db.settings.where('key').equals(key).first()
  if (existing) {
    await db.settings.update(existing.id, { value, updatedAt: new Date() })
  } else {
    await db.settings.add({ key, value, updatedAt: new Date() })
  }
}

// ==================== AUDIT TRAIL FUNCTIONS ====================

// Action types for audit trail
export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  PRINT: 'print',
  STATUS_CHANGE: 'status_change',
  APPROVE: 'approve',
  REJECT: 'reject'
}

// Get current user (stored in settings or localStorage)
export function getCurrentUser() {
  try {
    const user = localStorage.getItem('currentUser')
    return user ? JSON.parse(user) : { nama: 'System', nip: '-' }
  } catch {
    return { nama: 'System', nip: '-' }
  }
}

// Set current user
export function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user))
}

// Generate archive path for a document
export function generateArchivePath(module, year, identifier) {
  const moduleMap = {
    sppd: 'SPPD',
    swakelola: 'SWAKELOLA',
    pjlp: 'PJLP'
  }
  const modulePath = moduleMap[module] || module.toUpperCase()
  const cleanIdentifier = String(identifier).replace(/[^a-zA-Z0-9]/g, '_')
  return `ARSIP/${year}/${modulePath}/${cleanIdentifier}/`
}

// Record document history/audit trail
export async function recordHistory(tableName, recordId, action, previousData = null, newData = null, description = '') {
  try {
    const user = getCurrentUser()
    const fieldChanges = []

    // Calculate field changes if both previous and new data exist
    if (previousData && newData && action === AUDIT_ACTIONS.UPDATE) {
      const allKeys = new Set([...Object.keys(previousData), ...Object.keys(newData)])
      allKeys.forEach(key => {
        // Skip internal fields
        if (['id', 'createdAt', 'updatedAt', 'revision'].includes(key)) return

        const oldVal = previousData[key]
        const newVal = newData[key]

        // Compare values (stringify for objects/arrays)
        const oldStr = typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal ?? '')
        const newStr = typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal ?? '')

        if (oldStr !== newStr) {
          fieldChanges.push({
            field: key,
            oldValue: oldVal,
            newValue: newVal
          })
        }
      })
    }

    await db.documentHistory.add({
      tableName,
      recordId,
      action,
      fieldChanges,
      previousData: previousData ? JSON.stringify(previousData) : null,
      newData: newData ? JSON.stringify(newData) : null,
      description,
      createdBy: user.nama,
      createdByNip: user.nip,
      createdAt: new Date(),
      ipAddress: '-', // In PWA, we don't have server-side IP
      userAgent: navigator.userAgent
    })

    return true
  } catch (error) {
    console.error('Failed to record history:', error)
    return false
  }
}

// Get document history for a specific record
export async function getDocumentHistory(tableName, recordId) {
  try {
    const history = await db.documentHistory
      .where({ tableName, recordId })
      .reverse()
      .sortBy('createdAt')

    return history.reverse() // Most recent first
  } catch (error) {
    console.error('Failed to get history:', error)
    return []
  }
}

// Get all history for a table (with optional filters)
export async function getTableHistory(tableName, limit = 50) {
  try {
    const history = await db.documentHistory
      .where('tableName')
      .equals(tableName)
      .reverse()
      .limit(limit)
      .toArray()

    return history
  } catch (error) {
    console.error('Failed to get table history:', error)
    return []
  }
}

// Helper to add audit fields when creating a record
export function withAuditCreate(data) {
  const user = getCurrentUser()
  return {
    ...data,
    createdAt: new Date(),
    createdBy: user.nama,
    updatedAt: new Date(),
    revision: 1
  }
}

// Helper to add audit fields when updating a record
export function withAuditUpdate(data, currentRevision = 0) {
  const user = getCurrentUser()
  return {
    ...data,
    updatedAt: new Date(),
    updatedBy: user.nama,
    revision: currentRevision + 1
  }
}

// Format action for display
export function formatAuditAction(action) {
  const actionLabels = {
    [AUDIT_ACTIONS.CREATE]: 'Dibuat',
    [AUDIT_ACTIONS.UPDATE]: 'Diubah',
    [AUDIT_ACTIONS.DELETE]: 'Dihapus',
    [AUDIT_ACTIONS.PRINT]: 'Dicetak',
    [AUDIT_ACTIONS.STATUS_CHANGE]: 'Status Berubah',
    [AUDIT_ACTIONS.APPROVE]: 'Disetujui',
    [AUDIT_ACTIONS.REJECT]: 'Ditolak'
  }
  return actionLabels[action] || action
}

export default db
