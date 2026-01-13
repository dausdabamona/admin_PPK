import Dexie from 'dexie'

// Create database instance
export const db = new Dexie('SIPBJ_SPJ_Database')

// Database schema version 6 - Added Honorarium & Jasa Profesi tables
db.version(6).stores({
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

  // ==================== PENGADAAN LANGSUNG TABLES ====================
  // Master Paket Pengadaan
  procurementPackage: '++id, kodePaket, namaPaket, jenisPengadaan, unitPengusul, nilaiPagu, sumberDana, akun, tahun, metode, workflowStatus, createdAt, createdBy, updatedAt, revision, archivePath',

  // Link Lembar Permintaan ke Paket (many-to-many)
  procurementRequestLink: '++id, paketId, namaFile, filePath, tanggalUpload, keterangan, createdAt',

  // Perencanaan - KAK
  procurementKak: '++id, paketId, latarBelakang, maksudTujuan, sasaran, ruangLingkup, outputPekerjaan, spesifikasiTeknis, waktuPelaksanaan, lokasi, tenagaAhli, metodePelaksanaan, laporanPenyerahan, keterangan, createdAt, createdBy, updatedAt, revision, archivePath',

  // Perencanaan - HPS
  procurementHps: '++id, paketId, tanggal, items, subtotal, ppn, pph, overhead, totalHps, sumberData, metodePerhitungan, keterangan, createdAt, createdBy, updatedAt, revision, archivePath',

  // HPS Items
  procurementHpsItem: '++id, hpsId, uraian, volume, satuan, hargaSatuan, jumlah, keterangan, createdAt',

  // Master Penyedia
  procurementVendor: '++id, nama, npwp, alamat, telepon, email, direktur, jabatanDirektur, rekening, bank, bidangUsaha, kualifikasi, createdAt, createdBy, updatedAt, revision',

  // Kontrak / SPK
  procurementContract: '++id, paketId, vendorId, nomorKontrak, tanggalKontrak, nilaiKontrak, jangkaWaktu, tanggalMulai, tanggalSelesai, denda, jenisKontrak, lingkupPekerjaan, syaratPembayaran, jenisPembayaran, jumlahTermin, keterangan, status, createdAt, createdBy, updatedAt, revision, archivePath',

  // SPMK Pengadaan
  procurementSpmk: '++id, contractId, paketId, nomorSpmk, tanggalSpmk, tanggalMulaiKerja, keterangan, createdAt, createdBy, updatedAt, revision, archivePath',

  // Progress Pekerjaan (untuk Konstruksi)
  procurementProgress: '++id, contractId, paketId, tanggal, progresKumulatif, uraianPekerjaan, kendalaPekerjaan, keterangan, createdAt, createdBy, updatedAt, revision',

  // BAP (Berita Acara Pemeriksaan)
  procurementBap: '++id, contractId, paketId, nomorBap, tanggalBap, terminKe, hasilPemeriksaan, catatan, statusPemeriksaan, timPemeriksa, createdAt, createdBy, updatedAt, revision, archivePath',

  // BAST (Berita Acara Serah Terima) - untuk Barang & Jasa
  procurementBast: '++id, contractId, paketId, nomorBast, tanggalBast, terminKe, nilaiSerahTerima, kondisiBarang, catatanSerahTerima, createdAt, createdBy, updatedAt, revision, archivePath',

  // PHO (Provisional Hand Over) - untuk Konstruksi
  procurementPho: '++id, contractId, paketId, nomorPho, tanggalPho, progresAkhir, catatanPho, masaPemeliharaan, tanggalMulaiPemeliharaan, tanggalSelesaiPemeliharaan, createdAt, createdBy, updatedAt, revision, archivePath',

  // FHO (Final Hand Over) - untuk Konstruksi
  procurementFho: '++id, contractId, paketId, phoId, nomorFho, tanggalFho, kondisiAkhir, catatanFho, createdAt, createdBy, updatedAt, revision, archivePath',

  // Pembayaran Termin
  procurementPayment: '++id, contractId, paketId, bastId, phoId, fhoId, terminKe, jenisPembayaran, nilaiTagihan, ppn, pph, potonganDenda, potonganLain, nilaiNetto, nomorKwitansi, tanggalKwitansi, tanggalBayar, rekening, bank, status, keterangan, createdAt, createdBy, updatedAt, revision, archivePath',

  // Checklist SPJ Pengadaan
  procurementChecklist: '++id, paketId, contractId, paymentId, terminKe, items, statusKelengkapan, totalItem, itemLengkap, namaPemeriksa, tanggalPemeriksaan, catatan, createdAt, createdBy, updatedAt, revision',

  // Arsip Digital Pengadaan
  procurementArchive: '++id, paketId, tahun, jenisDokumen, terminKe, namaDokumen, namaFile, ukuranFile, pathArsip, keterangan, createdAt',

  // ==================== HONORARIUM & JASA PROFESI TABLES ====================
  // Master Penerima Honor
  honorRecipient: '++id, nik, npwp, nama, golongan, pangkat, jabatan, unitKerja, rekening, bank, statusPns, statusAktif, createdAt, createdBy, updatedAt, revision',

  // Dasar Penugasan (SK)
  honorAssignment: '++id, nomorSK, tanggalSK, perihal, dasarHukum, jenisHonor, kegiatanId, tahun, pagu, sumberDana, akun, tanggalMulai, tanggalSelesai, keterangan, status, createdAt, createdBy, updatedAt, revision, archivePath',

  // Daftar Nominatif (header)
  honorNominatif: '++id, assignmentId, nomorNominatif, tanggal, bulan, tahun, jenisHonor, totalBruto, totalPph, totalNetto, status, createdAt, createdBy, updatedAt, revision, archivePath',

  // Daftar Nominatif Items
  honorNominatifItem: '++id, nominatifId, recipientId, uraianTugas, volume, satuan, tarifHonor, jumlahBruto, tarifPph, pphDipotong, jumlahNetto, keterangan, createdAt',

  // Kwitansi Honor
  honorReceipt: '++id, nominatifId, nominatifItemId, recipientId, nomorKwitansi, tanggal, jumlahBruto, pph, jumlahNetto, terbilang, keterangan, status, createdAt, createdBy, updatedAt, revision, archivePath',

  // Checklist SPJ Honor
  honorChecklist: '++id, assignmentId, nominatifId, items, statusKelengkapan, totalItem, itemLengkap, namaPemeriksa, tanggalPemeriksaan, catatan, documentPaths, createdAt, createdBy, updatedAt, revision',

  // Arsip Digital Honorarium
  honorArchive: '++id, assignmentId, nominatifId, tahun, bulan, jenisDokumen, namaDokumen, namaFile, ukuranFile, pathArsip, keterangan, createdAt',

  // ==================== AUDIT TRAIL TABLE ====================
  // Document History / Audit Trail
  documentHistory: '++id, tableName, recordId, action, fieldChanges, previousData, newData, createdBy, createdAt, ipAddress, userAgent, archivePath'
})

// Database schema version 5 - Added Procurement (Pengadaan Langsung) tables
db.version(5).stores({
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

  // ==================== PENGADAAN LANGSUNG TABLES ====================
  // Master Paket Pengadaan
  procurementPackage: '++id, kodePaket, namaPaket, jenisPengadaan, unitPengusul, nilaiPagu, sumberDana, akun, tahun, metode, workflowStatus, createdAt, createdBy, updatedAt, revision, archivePath',

  // Link Lembar Permintaan ke Paket (many-to-many)
  procurementRequestLink: '++id, paketId, namaFile, filePath, tanggalUpload, keterangan, createdAt',

  // Perencanaan - KAK
  procurementKak: '++id, paketId, latarBelakang, maksudTujuan, sasaran, ruangLingkup, outputPekerjaan, spesifikasiTeknis, waktuPelaksanaan, lokasi, tenagaAhli, metodePelaksanaan, laporanPenyerahan, keterangan, createdAt, createdBy, updatedAt, revision, archivePath',

  // Perencanaan - HPS
  procurementHps: '++id, paketId, tanggal, items, subtotal, ppn, pph, overhead, totalHps, sumberData, metodePerhitungan, keterangan, createdAt, createdBy, updatedAt, revision, archivePath',

  // HPS Items
  procurementHpsItem: '++id, hpsId, uraian, volume, satuan, hargaSatuan, jumlah, keterangan, createdAt',

  // Master Penyedia
  procurementVendor: '++id, nama, npwp, alamat, telepon, email, direktur, jabatanDirektur, rekening, bank, bidangUsaha, kualifikasi, createdAt, createdBy, updatedAt, revision',

  // Kontrak / SPK
  procurementContract: '++id, paketId, vendorId, nomorKontrak, tanggalKontrak, nilaiKontrak, jangkaWaktu, tanggalMulai, tanggalSelesai, denda, jenisKontrak, lingkupPekerjaan, syaratPembayaran, jenisPembayaran, jumlahTermin, keterangan, status, createdAt, createdBy, updatedAt, revision, archivePath',

  // SPMK Pengadaan
  procurementSpmk: '++id, contractId, paketId, nomorSpmk, tanggalSpmk, tanggalMulaiKerja, keterangan, createdAt, createdBy, updatedAt, revision, archivePath',

  // Progress Pekerjaan (untuk Konstruksi)
  procurementProgress: '++id, contractId, paketId, tanggal, progresKumulatif, uraianPekerjaan, kendalaPekerjaan, keterangan, createdAt, createdBy, updatedAt, revision',

  // BAP (Berita Acara Pemeriksaan)
  procurementBap: '++id, contractId, paketId, nomorBap, tanggalBap, terminKe, hasilPemeriksaan, catatan, statusPemeriksaan, timPemeriksa, createdAt, createdBy, updatedAt, revision, archivePath',

  // BAST (Berita Acara Serah Terima) - untuk Barang & Jasa
  procurementBast: '++id, contractId, paketId, nomorBast, tanggalBast, terminKe, nilaiSerahTerima, kondisiBarang, catatanSerahTerima, createdAt, createdBy, updatedAt, revision, archivePath',

  // PHO (Provisional Hand Over) - untuk Konstruksi
  procurementPho: '++id, contractId, paketId, nomorPho, tanggalPho, progresAkhir, catatanPho, masaPemeliharaan, tanggalMulaiPemeliharaan, tanggalSelesaiPemeliharaan, createdAt, createdBy, updatedAt, revision, archivePath',

  // FHO (Final Hand Over) - untuk Konstruksi
  procurementFho: '++id, contractId, paketId, phoId, nomorFho, tanggalFho, kondisiAkhir, catatanFho, createdAt, createdBy, updatedAt, revision, archivePath',

  // Pembayaran Termin
  procurementPayment: '++id, contractId, paketId, bastId, phoId, fhoId, terminKe, jenisPembayaran, nilaiTagihan, ppn, pph, potonganDenda, potonganLain, nilaiNetto, nomorKwitansi, tanggalKwitansi, tanggalBayar, rekening, bank, status, keterangan, createdAt, createdBy, updatedAt, revision, archivePath',

  // Checklist SPJ Pengadaan
  procurementChecklist: '++id, paketId, contractId, paymentId, terminKe, items, statusKelengkapan, totalItem, itemLengkap, namaPemeriksa, tanggalPemeriksaan, catatan, createdAt, createdBy, updatedAt, revision',

  // Arsip Digital Pengadaan
  procurementArchive: '++id, paketId, tahun, jenisDokumen, terminKe, namaDokumen, namaFile, ukuranFile, pathArsip, keterangan, createdAt',

  // ==================== AUDIT TRAIL TABLE ====================
  // Document History / Audit Trail
  documentHistory: '++id, tableName, recordId, action, fieldChanges, previousData, newData, createdBy, createdAt, ipAddress, userAgent, archivePath'
})

// Database schema version 4 - Added audit trail and document history
db.version(4).stores({
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

// ==================== PENGADAAN LANGSUNG CONSTANTS ====================

// Jenis Pengadaan
export const JENIS_PENGADAAN = [
  { id: 'barang', nama: 'Barang' },
  { id: 'jasa_konsultansi', nama: 'Jasa Konsultansi' },
  { id: 'jasa_lainnya', nama: 'Jasa Lainnya' },
  { id: 'konstruksi', nama: 'Konstruksi' }
]

// Metode Pengadaan Langsung
export const METODE_PENGADAAN = [
  { id: 'pengadaan_langsung', nama: 'Pengadaan Langsung', batasNilai: 200000000 },
  { id: 'penunjukan_langsung', nama: 'Penunjukan Langsung', batasNilai: null },
  { id: 'e_purchasing', nama: 'E-Purchasing', batasNilai: null }
]

// Sumber Dana Pengadaan
export const SUMBER_DANA_PENGADAAN = [
  { id: 'apbn', nama: 'APBN' },
  { id: 'pnbp', nama: 'PNBP' },
  { id: 'blud', nama: 'BLU/BLUD' },
  { id: 'hibah', nama: 'Hibah' }
]

// Workflow Status Paket Pengadaan
export const WORKFLOW_STATUS_PENGADAAN = {
  DRAFT: 'draft',
  PERENCANAAN: 'perencanaan',
  PEMILIHAN_PENYEDIA: 'pemilihan_penyedia',
  KONTRAK: 'kontrak',
  PELAKSANAAN: 'pelaksanaan',
  SERAH_TERIMA: 'serah_terima',
  PEMBAYARAN: 'pembayaran',
  SELESAI: 'selesai',
  BATAL: 'batal'
}

// Status Kontrak Pengadaan
export const STATUS_KONTRAK_PENGADAAN = {
  DRAFT: 'draft',
  AKTIF: 'aktif',
  DALAM_PELAKSANAAN: 'dalam_pelaksanaan',
  SERAH_TERIMA: 'serah_terima',
  SELESAI: 'selesai',
  BATAL: 'batal'
}

// Jenis Kontrak
export const JENIS_KONTRAK_PENGADAAN = [
  { id: 'lumsum', nama: 'Lumsum' },
  { id: 'harga_satuan', nama: 'Harga Satuan' },
  { id: 'gabungan', nama: 'Gabungan Lumsum & Harga Satuan' },
  { id: 'terima_jadi', nama: 'Terima Jadi (Turnkey)' },
  { id: 'kontrak_payung', nama: 'Kontrak Payung' }
]

// Jenis Pembayaran
export const JENIS_PEMBAYARAN_PENGADAAN = [
  { id: 'sekaligus', nama: 'Pembayaran Sekaligus (100%)' },
  { id: 'termin', nama: 'Pembayaran Termin' },
  { id: 'bulanan', nama: 'Pembayaran Bulanan' }
]

// Status Pembayaran Pengadaan
export const STATUS_PEMBAYARAN_PENGADAAN = {
  DRAFT: 'draft',
  MENUNGGU_BAP: 'menunggu_bap',
  MENUNGGU_BAST: 'menunggu_bast',
  SIAP_BAYAR: 'siap_bayar',
  DIBAYAR: 'dibayar',
  BATAL: 'batal'
}

// Status Pemeriksaan BAP
export const STATUS_PEMERIKSAAN_BAP = {
  SESUAI: 'sesuai',
  SESUAI_DENGAN_CATATAN: 'sesuai_dengan_catatan',
  TIDAK_SESUAI: 'tidak_sesuai'
}

// Kualifikasi Penyedia
export const KUALIFIKASI_PENYEDIA = [
  { id: 'kecil', nama: 'Usaha Kecil' },
  { id: 'menengah', nama: 'Usaha Menengah' },
  { id: 'besar', nama: 'Usaha Besar' },
  { id: 'perseorangan', nama: 'Perseorangan' }
]

// Bidang Usaha Penyedia
export const BIDANG_USAHA_PENYEDIA = [
  { id: 'perdagangan', nama: 'Perdagangan Umum' },
  { id: 'jasa_konsultansi', nama: 'Jasa Konsultansi' },
  { id: 'konstruksi', nama: 'Konstruksi' },
  { id: 'pengadaan_barang', nama: 'Pengadaan Barang' },
  { id: 'jasa_lainnya', nama: 'Jasa Lainnya' },
  { id: 'teknologi_informasi', nama: 'Teknologi Informasi' },
  { id: 'percetakan', nama: 'Percetakan' },
  { id: 'catering', nama: 'Katering/Konsumsi' },
  { id: 'sewa_kendaraan', nama: 'Sewa Kendaraan' },
  { id: 'alat_laboratorium', nama: 'Alat Laboratorium' },
  { id: 'perikanan', nama: 'Perikanan & Kelautan' }
]

// Tarif PPh Pengadaan
export const TARIF_PPH_PENGADAAN = {
  pph21: 0.025, // 2.5% Jasa (perseorangan)
  pph22: 0.015, // 1.5% Barang
  pph23: 0.02,  // 2% Jasa (badan usaha)
  pph4_2: 0.03  // 3% Konstruksi
}

// Tarif PPN
export const TARIF_PPN = 0.11 // 11%

// Checklist SPJ Pengadaan Barang
export const CHECKLIST_PENGADAAN_BARANG = [
  { id: 'lembar_permintaan', nama: 'Lembar Permintaan Pembelian', wajib: true },
  { id: 'kak', nama: 'Kerangka Acuan Kerja (KAK)', wajib: true },
  { id: 'hps', nama: 'Harga Perkiraan Sendiri (HPS)', wajib: true },
  { id: 'undangan_penawaran', nama: 'Undangan/Permintaan Penawaran', wajib: true },
  { id: 'surat_penawaran', nama: 'Surat Penawaran Harga', wajib: true },
  { id: 'pakta_integritas', nama: 'Pakta Integritas Penyedia', wajib: true },
  { id: 'ba_negosiasi', nama: 'BA Negosiasi Harga', wajib: true },
  { id: 'sppbj', nama: 'Surat Penetapan Penyedia (SPPBJ)', wajib: true },
  { id: 'kontrak_spk', nama: 'Kontrak/SPK', wajib: true },
  { id: 'spmk', nama: 'Surat Perintah Mulai Kerja (SPMK)', wajib: true },
  { id: 'bap', nama: 'Berita Acara Pemeriksaan (BAP)', wajib: true },
  { id: 'bast', nama: 'Berita Acara Serah Terima (BAST)', wajib: true },
  { id: 'faktur_invoice', nama: 'Faktur/Invoice', wajib: true },
  { id: 'kwitansi', nama: 'Kwitansi', wajib: true },
  { id: 'faktur_pajak', nama: 'Faktur Pajak', wajib: false },
  { id: 'ssp_ppn', nama: 'SSP PPN', wajib: false },
  { id: 'ssp_pph', nama: 'SSP PPh', wajib: true }
]

// Checklist SPJ Pengadaan Jasa
export const CHECKLIST_PENGADAAN_JASA = [
  { id: 'lembar_permintaan', nama: 'Lembar Permintaan', wajib: true },
  { id: 'kak', nama: 'Kerangka Acuan Kerja (KAK)', wajib: true },
  { id: 'hps', nama: 'Harga Perkiraan Sendiri (HPS)', wajib: true },
  { id: 'undangan_penawaran', nama: 'Undangan/Permintaan Penawaran', wajib: true },
  { id: 'surat_penawaran', nama: 'Surat Penawaran Harga', wajib: true },
  { id: 'pakta_integritas', nama: 'Pakta Integritas Penyedia', wajib: true },
  { id: 'ba_negosiasi', nama: 'BA Negosiasi Harga', wajib: true },
  { id: 'sppbj', nama: 'Surat Penetapan Penyedia (SPPBJ)', wajib: true },
  { id: 'kontrak_spk', nama: 'Kontrak/SPK', wajib: true },
  { id: 'spmk', nama: 'Surat Perintah Mulai Kerja (SPMK)', wajib: true },
  { id: 'laporan_pekerjaan', nama: 'Laporan Hasil Pekerjaan', wajib: true },
  { id: 'bap', nama: 'Berita Acara Pemeriksaan (BAP)', wajib: true },
  { id: 'bast', nama: 'Berita Acara Serah Terima (BAST)', wajib: true },
  { id: 'kwitansi', nama: 'Kwitansi', wajib: true },
  { id: 'ssp_pph', nama: 'SSP PPh 21/23', wajib: true }
]

// Checklist SPJ Pengadaan Konstruksi
export const CHECKLIST_PENGADAAN_KONSTRUKSI = [
  { id: 'lembar_permintaan', nama: 'Lembar Permintaan', wajib: true },
  { id: 'kak', nama: 'Kerangka Acuan Kerja (KAK)', wajib: true },
  { id: 'gambar_desain', nama: 'Gambar/Desain Teknis', wajib: true },
  { id: 'rab', nama: 'Rencana Anggaran Biaya (RAB)', wajib: true },
  { id: 'hps', nama: 'Harga Perkiraan Sendiri (HPS)', wajib: true },
  { id: 'undangan_penawaran', nama: 'Undangan/Permintaan Penawaran', wajib: true },
  { id: 'surat_penawaran', nama: 'Surat Penawaran Harga', wajib: true },
  { id: 'pakta_integritas', nama: 'Pakta Integritas Penyedia', wajib: true },
  { id: 'ba_negosiasi', nama: 'BA Negosiasi Harga', wajib: true },
  { id: 'sppbj', nama: 'Surat Penetapan Penyedia (SPPBJ)', wajib: true },
  { id: 'kontrak_spk', nama: 'Kontrak/SPK', wajib: true },
  { id: 'spmk', nama: 'Surat Perintah Mulai Kerja (SPMK)', wajib: true },
  { id: 'jaminan_pelaksanaan', nama: 'Jaminan Pelaksanaan', wajib: false },
  { id: 'laporan_progres', nama: 'Laporan Progress Pekerjaan', wajib: true },
  { id: 'bap', nama: 'Berita Acara Pemeriksaan (BAP)', wajib: true },
  { id: 'pho', nama: 'PHO (Provisional Hand Over)', wajib: true },
  { id: 'fho', nama: 'FHO (Final Hand Over)', wajib: true },
  { id: 'kwitansi', nama: 'Kwitansi', wajib: true },
  { id: 'faktur_pajak', nama: 'Faktur Pajak', wajib: false },
  { id: 'ssp_pph', nama: 'SSP PPh 4(2)', wajib: true }
]

// Jenis Dokumen Arsip Pengadaan
export const JENIS_DOKUMEN_PENGADAAN = [
  { id: 'permintaan', nama: 'Lembar Permintaan' },
  { id: 'kak', nama: 'KAK' },
  { id: 'hps', nama: 'HPS' },
  { id: 'penawaran', nama: 'Surat Penawaran' },
  { id: 'negosiasi', nama: 'BA Negosiasi' },
  { id: 'kontrak', nama: 'Kontrak/SPK' },
  { id: 'spmk', nama: 'SPMK' },
  { id: 'bap', nama: 'BAP' },
  { id: 'bast', nama: 'BAST' },
  { id: 'pho', nama: 'PHO' },
  { id: 'fho', nama: 'FHO' },
  { id: 'kwitansi', nama: 'Kwitansi' },
  { id: 'faktur', nama: 'Faktur/Invoice' },
  { id: 'ssp', nama: 'SSP Pajak' },
  { id: 'lainnya', nama: 'Dokumen Lainnya' }
]

// Helper: Get checklist by jenis pengadaan
export function getChecklistPengadaan(jenisPengadaan) {
  if (jenisPengadaan === 'konstruksi') return CHECKLIST_PENGADAAN_KONSTRUKSI
  if (jenisPengadaan === 'barang') return CHECKLIST_PENGADAAN_BARANG
  return CHECKLIST_PENGADAAN_JASA
}

// Helper: Calculate PPh for Pengadaan
export function calculatePphPengadaan(nilai, jenisPengadaan, isPKP = true) {
  let tarif = TARIF_PPH_PENGADAAN.pph22 // Default barang
  if (jenisPengadaan === 'konstruksi') tarif = TARIF_PPH_PENGADAAN.pph4_2
  else if (jenisPengadaan === 'jasa_konsultansi' || jenisPengadaan === 'jasa_lainnya') tarif = TARIF_PPH_PENGADAAN.pph23
  return Math.round(nilai * tarif)
}

// Helper: Calculate PPN
export function calculatePpnPengadaan(nilai) {
  return Math.round(nilai * TARIF_PPN)
}

// Helper: Generate archive path for Pengadaan
export function generatePathArsipPengadaan(tahun, kodePaket) {
  const kodeClean = kodePaket.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()
  return `ARSIP/${tahun}/PENGADAAN/${kodeClean}/`
}

// Helper: Get workflow status label
export function getWorkflowStatusLabel(status) {
  const labels = {
    [WORKFLOW_STATUS_PENGADAAN.DRAFT]: 'Draft',
    [WORKFLOW_STATUS_PENGADAAN.PERENCANAAN]: 'Perencanaan',
    [WORKFLOW_STATUS_PENGADAAN.PEMILIHAN_PENYEDIA]: 'Pemilihan Penyedia',
    [WORKFLOW_STATUS_PENGADAAN.KONTRAK]: 'Kontrak',
    [WORKFLOW_STATUS_PENGADAAN.PELAKSANAAN]: 'Pelaksanaan',
    [WORKFLOW_STATUS_PENGADAAN.SERAH_TERIMA]: 'Serah Terima',
    [WORKFLOW_STATUS_PENGADAAN.PEMBAYARAN]: 'Pembayaran',
    [WORKFLOW_STATUS_PENGADAAN.SELESAI]: 'Selesai',
    [WORKFLOW_STATUS_PENGADAAN.BATAL]: 'Batal'
  }
  return labels[status] || status
}

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

// ==================== HONORARIUM & JASA PROFESI CONSTANTS ====================

// Jenis Honorarium (sesuai SBK/SBM)
export const JENIS_HONOR = [
  { id: 'narasumber', nama: 'Narasumber/Pemateri', kode: '521213' },
  { id: 'moderator', nama: 'Moderator', kode: '521213' },
  { id: 'panitia', nama: 'Panitia Kegiatan', kode: '521213' },
  { id: 'tim_pelaksana', nama: 'Tim Pelaksana Kegiatan', kode: '521213' },
  { id: 'penguji', nama: 'Penguji/Penilai', kode: '521213' },
  { id: 'pembimbing', nama: 'Pembimbing/Pendamping', kode: '521213' },
  { id: 'juri', nama: 'Juri/Dewan Juri', kode: '521213' },
  { id: 'petugas_teknis', nama: 'Petugas Teknis', kode: '521213' },
  { id: 'editor', nama: 'Editor/Reviewer', kode: '521213' },
  { id: 'penulis', nama: 'Penulis/Kontributor', kode: '521213' },
  { id: 'peneliti', nama: 'Peneliti', kode: '521213' },
  { id: 'jasa_profesi', nama: 'Jasa Profesi Lainnya', kode: '522151' }
]

// Status Penugasan Honor
export const STATUS_HONOR_ASSIGNMENT = {
  DRAFT: 'draft',
  AKTIF: 'aktif',
  PROSES: 'proses',
  SELESAI: 'selesai',
  BATAL: 'batal'
}

// Status Nominatif Honor
export const STATUS_HONOR_NOMINATIF = {
  DRAFT: 'draft',
  SIAP_BAYAR: 'siap_bayar',
  DIBAYAR: 'dibayar',
  BATAL: 'batal'
}

// Tarif PPh 21 Honorarium (PP 58/2023 & PMK terkait)
export const TARIF_PPH_HONOR = {
  // PNS/ASN Golongan I-II (5%)
  pnsGolI_II: 0.05,
  // PNS/ASN Golongan III (5%)
  pnsGolIII: 0.05,
  // PNS/ASN Golongan IV (15%)
  pnsGolIV: 0.15,
  // Non-PNS dengan NPWP (5% tarif efektif rata-rata)
  nonPnsWithNpwp: 0.05,
  // Non-PNS tanpa NPWP (6% - lebih tinggi 20%)
  nonPnsWithoutNpwp: 0.06
}

// Golongan untuk penentuan tarif PPh
export const GOLONGAN_OPTIONS = [
  { id: 'I/a', nama: 'I/a', grup: 'I-II' },
  { id: 'I/b', nama: 'I/b', grup: 'I-II' },
  { id: 'I/c', nama: 'I/c', grup: 'I-II' },
  { id: 'I/d', nama: 'I/d', grup: 'I-II' },
  { id: 'II/a', nama: 'II/a', grup: 'I-II' },
  { id: 'II/b', nama: 'II/b', grup: 'I-II' },
  { id: 'II/c', nama: 'II/c', grup: 'I-II' },
  { id: 'II/d', nama: 'II/d', grup: 'I-II' },
  { id: 'III/a', nama: 'III/a', grup: 'III' },
  { id: 'III/b', nama: 'III/b', grup: 'III' },
  { id: 'III/c', nama: 'III/c', grup: 'III' },
  { id: 'III/d', nama: 'III/d', grup: 'III' },
  { id: 'IV/a', nama: 'IV/a', grup: 'IV' },
  { id: 'IV/b', nama: 'IV/b', grup: 'IV' },
  { id: 'IV/c', nama: 'IV/c', grup: 'IV' },
  { id: 'IV/d', nama: 'IV/d', grup: 'IV' },
  { id: 'IV/e', nama: 'IV/e', grup: 'IV' }
]

// Satuan volume untuk honorarium
export const SATUAN_HONOR = [
  { id: 'ok', nama: 'Orang/Kegiatan' },
  { id: 'oh', nama: 'Orang/Hari' },
  { id: 'oj', nama: 'Orang/Jam' },
  { id: 'ob', nama: 'Orang/Bulan' },
  { id: 'paket', nama: 'Paket' },
  { id: 'kali', nama: 'Kali' },
  { id: 'sesi', nama: 'Sesi' },
  { id: 'materi', nama: 'Materi' },
  { id: 'naskah', nama: 'Naskah' },
  { id: 'halaman', nama: 'Halaman' }
]

// Checklist SPJ Honorarium (Kepmen KP No.56 Tahun 2024)
export const CHECKLIST_HONOR = [
  { id: 'sk_penugasan', nama: 'SK/Surat Tugas Penugasan', wajib: true },
  { id: 'undangan', nama: 'Surat Undangan Kegiatan', wajib: true },
  { id: 'daftar_hadir', nama: 'Daftar Hadir Kegiatan', wajib: true },
  { id: 'dokumentasi', nama: 'Dokumentasi Kegiatan (Foto)', wajib: true },
  { id: 'nominatif', nama: 'Daftar Nominatif Penerima Honor', wajib: true },
  { id: 'kwitansi', nama: 'Kwitansi Penerima Honor', wajib: true },
  { id: 'fotocopy_ktp', nama: 'Fotocopy KTP Penerima', wajib: false },
  { id: 'fotocopy_npwp', nama: 'Fotocopy NPWP Penerima', wajib: false },
  { id: 'fotocopy_rekening', nama: 'Fotocopy Buku Rekening', wajib: false },
  { id: 'ssp_pph', nama: 'SSP PPh 21', wajib: true },
  { id: 'laporan_kegiatan', nama: 'Laporan Pelaksanaan Kegiatan', wajib: true }
]

// Jenis Dokumen Arsip Honorarium
export const JENIS_DOKUMEN_HONOR = [
  { id: 'sk', nama: 'SK/Surat Tugas' },
  { id: 'undangan', nama: 'Undangan' },
  { id: 'daftar_hadir', nama: 'Daftar Hadir' },
  { id: 'nominatif', nama: 'Daftar Nominatif' },
  { id: 'kwitansi', nama: 'Kwitansi' },
  { id: 'ssp', nama: 'SSP PPh' },
  { id: 'laporan', nama: 'Laporan Kegiatan' },
  { id: 'dokumentasi', nama: 'Dokumentasi' },
  { id: 'lainnya', nama: 'Dokumen Lainnya' }
]

// Helper: Calculate PPh for Honorarium
export function calculatePphHonor(jumlahBruto, golongan = null, hasNpwp = true, isPns = false) {
  let tarif

  if (isPns && golongan) {
    // PNS - tarif berdasarkan golongan
    const gol = GOLONGAN_OPTIONS.find(g => g.id === golongan)
    if (gol) {
      if (gol.grup === 'IV') {
        tarif = TARIF_PPH_HONOR.pnsGolIV
      } else if (gol.grup === 'III') {
        tarif = TARIF_PPH_HONOR.pnsGolIII
      } else {
        tarif = TARIF_PPH_HONOR.pnsGolI_II
      }
    } else {
      tarif = TARIF_PPH_HONOR.pnsGolIII // Default
    }
  } else {
    // Non-PNS
    tarif = hasNpwp ? TARIF_PPH_HONOR.nonPnsWithNpwp : TARIF_PPH_HONOR.nonPnsWithoutNpwp
  }

  return {
    tarif,
    pph: Math.round(jumlahBruto * tarif)
  }
}

// Helper: Get tarif PPh label
export function getTarifPphLabel(tarif) {
  return `${(tarif * 100).toFixed(0)}%`
}

// Helper: Generate path arsip Honorarium
export function generatePathArsipHonor(tahun, nomorSK) {
  const nomorClean = nomorSK.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()
  return `ARSIP/${tahun}/HONORARIUM/${nomorClean}/`
}

// Helper: Generate nama file arsip Honorarium
export function generateNamaFileArsipHonor(tahun, jenis, bulan, nomorSK, ext = 'pdf') {
  const nomorClean = nomorSK.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()
  const bulanStr = bulan ? `-${String(bulan).padStart(2, '0')}` : ''
  return `${tahun}-HONOR-${jenis.toUpperCase()}${bulanStr}-${nomorClean}.${ext}`
}

// Helper: Get status label for Honor Assignment
export function getStatusHonorLabel(status) {
  const labels = {
    [STATUS_HONOR_ASSIGNMENT.DRAFT]: 'Draft',
    [STATUS_HONOR_ASSIGNMENT.AKTIF]: 'Aktif',
    [STATUS_HONOR_ASSIGNMENT.PROSES]: 'Dalam Proses',
    [STATUS_HONOR_ASSIGNMENT.SELESAI]: 'Selesai',
    [STATUS_HONOR_ASSIGNMENT.BATAL]: 'Batal'
  }
  return labels[status] || status
}

// Helper: Get status label for Nominatif
export function getStatusNominatifLabel(status) {
  const labels = {
    [STATUS_HONOR_NOMINATIF.DRAFT]: 'Draft',
    [STATUS_HONOR_NOMINATIF.SIAP_BAYAR]: 'Siap Bayar',
    [STATUS_HONOR_NOMINATIF.DIBAYAR]: 'Sudah Dibayar',
    [STATUS_HONOR_NOMINATIF.BATAL]: 'Batal'
  }
  return labels[status] || status
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
