import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { formatTanggal, formatRupiah, terbilangRupiah } from './formatters'
import db, { POSISI_PJLP, BOBOT_PENILAIAN_PJLP, BULAN_INDONESIA } from '../db/database'

// Get settings helper
async function getSettings() {
  const settings = await db.settings.toArray()
  return settings.reduce((acc, s) => {
    acc[s.key] = s.value
    return acc
  }, {})
}

// Common header for documents
function addHeader(doc, title, settings) {
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(settings.nama_instansi || 'POLITEKNIK KELAUTAN DAN PERIKANAN SORONG', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(settings.alamat_instansi || 'Jl. Kapitan Pattimura, Sorong, Papua Barat Daya', pageWidth / 2, 26, { align: 'center' })

  doc.setLineWidth(0.5)
  doc.line(20, 30, pageWidth - 20, 30)
  doc.setLineWidth(0.2)
  doc.line(20, 31, pageWidth - 20, 31)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageWidth / 2, 40, { align: 'center' })

  return 45
}

// Get posisi label
function getPosisiLabel(posisiId) {
  return POSISI_PJLP.find(p => p.id === posisiId)?.nama || posisiId
}

// Get bulan label
function getBulanLabel(bulan) {
  return BULAN_INDONESIA.find(b => b.value === bulan)?.label || bulan
}

// Generate SPK PJLP PDF
export async function generateSpkPjlpPDF(kontrak) {
  const settings = await getSettings()
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  let y = addHeader(doc, 'SURAT PERINTAH KERJA (SPK)', settings)

  // SPK Number
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nomor: ${kontrak.spk?.nomorSpk || kontrak.nomorKontrak}`, pageWidth / 2, y, { align: 'center' })
  y += 10

  // Dasar
  doc.setFont('helvetica', 'bold')
  doc.text('DASAR:', 20, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text('1. Undang-Undang Nomor 17 Tahun 2003 tentang Keuangan Negara', 25, y)
  y += 5
  doc.text('2. Peraturan Presiden tentang Pengadaan Barang/Jasa Pemerintah', 25, y)
  y += 5
  doc.text('3. DIPA Satuan Kerja Tahun Anggaran Berjalan', 25, y)
  y += 10

  // Memerintahkan
  doc.setFont('helvetica', 'bold')
  doc.text('MEMERINTAHKAN:', 20, y)
  y += 7

  // Kepada
  doc.setFont('helvetica', 'normal')
  doc.text('Kepada:', 20, y)
  y += 5
  doc.setFont('helvetica', 'bold')
  doc.text(`Nama     : ${kontrak.pjlp?.nama || '-'}`, 30, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`NIK      : ${kontrak.pjlp?.nik || '-'}`, 30, y)
  y += 5
  doc.text(`NPWP     : ${kontrak.pjlp?.npwp || '-'}`, 30, y)
  y += 5
  doc.text(`Alamat   : ${kontrak.pjlp?.unitKerja || '-'}`, 30, y)
  y += 10

  // Untuk
  doc.text('Untuk:', 20, y)
  y += 5
  doc.text(`1. Melaksanakan pekerjaan sebagai ${getPosisiLabel(kontrak.posisi)}`, 30, y)
  y += 5
  doc.text(`   di ${kontrak.lokasiKerja || settings.nama_instansi}`, 30, y)
  y += 5
  doc.text(`2. Periode kerja: ${formatTanggal(kontrak.periodeAwal)} s/d ${formatTanggal(kontrak.periodeAkhir)}`, 30, y)
  y += 5
  doc.text(`3. Honor bulanan: ${formatRupiah(kontrak.honorBulanan)}`, 30, y)
  y += 10

  // Nilai Kontrak
  doc.setFillColor(240, 240, 240)
  doc.rect(20, y, pageWidth - 40, 15, 'F')
  doc.setFont('helvetica', 'bold')
  doc.text('NILAI KONTRAK:', 25, y + 6)
  doc.setFontSize(12)
  doc.text(formatRupiah(kontrak.nilaiKontrak), 25, y + 12)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`(${terbilangRupiah(kontrak.nilaiKontrak)})`, 25 + doc.getTextWidth(formatRupiah(kontrak.nilaiKontrak)) + 5, y + 12)
  y += 25

  // Lingkup Pekerjaan
  if (kontrak.lingkupPekerjaan) {
    doc.setFont('helvetica', 'bold')
    doc.text('Lingkup Pekerjaan:', 20, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(kontrak.lingkupPekerjaan, pageWidth - 50)
    doc.text(lines, 25, y)
    y += lines.length * 5 + 5
  }

  // Signature
  y += 10
  doc.text(`${settings.alamat_instansi?.split(',')[0] || 'Sorong'}, ${formatTanggal(kontrak.tanggalKontrak)}`, pageWidth - 70, y)
  y += 5
  doc.text('Pejabat Pembuat Komitmen,', pageWidth - 70, y)
  y += 25
  doc.setFont('helvetica', 'bold')
  doc.text(settings.nama_ppk || '............................', pageWidth - 70, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`NIP. ${settings.nip_ppk || '............................'}`, pageWidth - 70, y)

  doc.save(`SPK_PJLP_${kontrak.pjlp?.nama?.replace(/\s/g, '_') || 'PJLP'}.pdf`)
}

// Generate SPMK PJLP PDF
export async function generateSpmkPjlpPDF(kontrak) {
  const settings = await getSettings()
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  let y = addHeader(doc, 'SURAT PERINTAH MULAI KERJA (SPMK)', settings)

  // SPMK Number
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nomor: ${kontrak.spmk?.nomorSpmk || '-'}`, pageWidth / 2, y, { align: 'center' })
  y += 10

  // Content
  doc.text('Berdasarkan Surat Perintah Kerja (SPK):', 20, y)
  y += 5
  doc.text(`Nomor : ${kontrak.spk?.nomorSpk || kontrak.nomorKontrak}`, 30, y)
  y += 5
  doc.text(`Tanggal : ${formatTanggal(kontrak.spk?.tanggalSpk || kontrak.tanggalKontrak)}`, 30, y)
  y += 10

  doc.text('Dengan ini memerintahkan kepada:', 20, y)
  y += 7

  doc.setFont('helvetica', 'bold')
  doc.text(`Nama     : ${kontrak.pjlp?.nama || '-'}`, 30, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`NIK      : ${kontrak.pjlp?.nik || '-'}`, 30, y)
  y += 5
  doc.text(`Jabatan  : ${getPosisiLabel(kontrak.posisi)}`, 30, y)
  y += 10

  doc.text('Untuk segera mulai melaksanakan pekerjaan terhitung mulai tanggal:', 20, y)
  y += 7
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(formatTanggal(kontrak.spmk?.tanggalMulaiKerja || kontrak.periodeAwal), 30, y)
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Demikian Surat Perintah Mulai Kerja ini diterbitkan untuk dilaksanakan', 20, y)
  y += 5
  doc.text('dengan penuh tanggung jawab.', 20, y)
  y += 15

  // Signature
  doc.text(`${settings.alamat_instansi?.split(',')[0] || 'Sorong'}, ${formatTanggal(kontrak.spmk?.tanggalSpmk || new Date())}`, pageWidth - 70, y)
  y += 5
  doc.text('Pejabat Pembuat Komitmen,', pageWidth - 70, y)
  y += 25
  doc.setFont('helvetica', 'bold')
  doc.text(settings.nama_ppk || '............................', pageWidth - 70, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`NIP. ${settings.nip_ppk || '............................'}`, pageWidth - 70, y)

  // Penerima
  y += 15
  doc.text('Yang menerima perintah,', 30, y - 40)
  doc.setFont('helvetica', 'bold')
  doc.text(kontrak.pjlp?.nama || '............................', 30, y - 15)
  doc.setFont('helvetica', 'normal')
  doc.text(`NIK. ${kontrak.pjlp?.nik || '............................'}`, 30, y - 10)

  doc.save(`SPMK_PJLP_${kontrak.pjlp?.nama?.replace(/\s/g, '_') || 'PJLP'}.pdf`)
}

// Generate Kwitansi Pembayaran PJLP PDF
export async function generateKwitansiPjlpPDF(pembayaran, pjlp) {
  const settings = await getSettings()
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  let y = addHeader(doc, 'KWITANSI PEMBAYARAN PJLP', settings)

  // Kwitansi Number
  doc.setFontSize(10)
  doc.text(`Nomor: ${pembayaran.nomorKwitansi || '-'}`, pageWidth / 2, y, { align: 'center' })
  y += 10

  const leftMargin = 20
  const labelWidth = 45

  doc.setFont('helvetica', 'normal')
  doc.text('Sudah terima dari', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.text(settings.nama_instansi || 'PKP Sorong', leftMargin + labelWidth + 5, y)
  y += 7

  doc.text('Uang sebanyak', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatRupiah(pembayaran.honorNetto), leftMargin + labelWidth + 5, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.text('Terbilang', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  const terbilangText = terbilangRupiah(pembayaran.honorNetto)
  const terbilangLines = doc.splitTextToSize(terbilangText, pageWidth - leftMargin - labelWidth - 30)
  doc.text(terbilangLines, leftMargin + labelWidth + 5, y)
  y += (terbilangLines.length * 5) + 7

  doc.text('Untuk Pembayaran', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.text(`Honor PJLP Bulan ${getBulanLabel(pembayaran.bulan)} ${pembayaran.tahun}`, leftMargin + labelWidth + 5, y)
  y += 7

  doc.text('Nama PJLP', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.text(pjlp?.nama || '-', leftMargin + labelWidth + 5, y)
  y += 7

  doc.text('Jabatan', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.text(getPosisiLabel(pjlp?.posisi), leftMargin + labelWidth + 5, y)
  y += 10

  // Rincian
  doc.autoTable({
    startY: y,
    head: [['Uraian', 'Jumlah']],
    body: [
      ['Honor Bruto', formatRupiah(pembayaran.honorBruto)],
      [`Potongan PPh 21 (${(pembayaran.tarifPph * 100).toFixed(1)}%)`, `- ${formatRupiah(pembayaran.potonganPph)}`],
      ['Potongan BPJS Kesehatan', `- ${formatRupiah(pembayaran.potonganBpjsKesehatan)}`],
      ['Potongan BPJS Ketenagakerjaan', `- ${formatRupiah(pembayaran.potonganBpjsKetenagakerjaan)}`],
      ['Potongan Lain-lain', `- ${formatRupiah(pembayaran.potonganLain || 0)}`]
    ],
    foot: [['Honor Netto (Diterima)', formatRupiah(pembayaran.honorNetto)]],
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 139, 202] },
    footStyles: { fillColor: [40, 167, 69], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 1: { halign: 'right' } }
  })

  y = doc.lastAutoTable.finalY + 15

  // Signatures
  doc.setFont('helvetica', 'normal')

  // Left signature (Penerima)
  doc.text('Yang Menerima,', leftMargin + 20, y, { align: 'center' })
  y += 25
  doc.setFont('helvetica', 'bold')
  doc.text(pjlp?.nama || '............................', leftMargin + 20, y, { align: 'center' })

  // Right signature (PPK)
  const rightX = pageWidth - 60
  doc.setFont('helvetica', 'normal')
  doc.text(`${settings.alamat_instansi?.split(',')[0] || 'Sorong'}, ${formatTanggal(pembayaran.tanggalBayar || new Date())}`, rightX, y - 25, { align: 'center' })
  doc.text('Pejabat Pembuat Komitmen,', rightX, y - 20, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.text(settings.nama_ppk || '............................', rightX, y, { align: 'center' })

  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`NIK. ${pjlp?.nik || '............................'}`, leftMargin + 20, y, { align: 'center' })
  doc.text(`NIP. ${settings.nip_ppk || '............................'}`, rightX, y, { align: 'center' })

  doc.save(`Kwitansi_PJLP_${pjlp?.nama?.replace(/\s/g, '_')}_${pembayaran.bulan}_${pembayaran.tahun}.pdf`)
}

// Generate Penilaian Kinerja Triwulan PDF
export async function generatePenilaianPjlpPDF(penilaian, pjlp, kontrak) {
  const settings = await getSettings()
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  let y = addHeader(doc, 'FORM PENILAIAN KINERJA PJLP', settings)

  // Subtitle
  doc.setFontSize(10)
  doc.text(`Triwulan ${penilaian.triwulan} Tahun ${penilaian.tahun}`, pageWidth / 2, y, { align: 'center' })
  y += 10

  // Info PJLP
  doc.setFont('helvetica', 'normal')
  doc.text(`Nama PJLP    : ${pjlp?.nama || '-'}`, 20, y)
  y += 5
  doc.text(`NIK          : ${pjlp?.nik || '-'}`, 20, y)
  y += 5
  doc.text(`Jabatan      : ${getPosisiLabel(kontrak?.posisi || pjlp?.posisi)}`, 20, y)
  y += 5
  doc.text(`No. Kontrak  : ${kontrak?.nomorKontrak || '-'}`, 20, y)
  y += 10

  // Penilaian Table
  doc.autoTable({
    startY: y,
    head: [['No', 'Aspek Penilaian', 'Bobot (%)', 'Nilai (0-100)', 'Skor']],
    body: [
      ['1', 'Kualitas Pekerjaan', BOBOT_PENILAIAN_PJLP.kualitas, penilaian.nilaiKualitas, ((penilaian.nilaiKualitas * BOBOT_PENILAIAN_PJLP.kualitas) / 100).toFixed(2)],
      ['2', 'Ketepatan Waktu', BOBOT_PENILAIAN_PJLP.waktu, penilaian.nilaiWaktu, ((penilaian.nilaiWaktu * BOBOT_PENILAIAN_PJLP.waktu) / 100).toFixed(2)],
      ['3', 'Efisiensi Biaya', BOBOT_PENILAIAN_PJLP.biaya, penilaian.nilaiBiaya, ((penilaian.nilaiBiaya * BOBOT_PENILAIAN_PJLP.biaya) / 100).toFixed(2)],
      ['4', 'Layanan / Disiplin', BOBOT_PENILAIAN_PJLP.layanan, penilaian.nilaiLayanan, ((penilaian.nilaiLayanan * BOBOT_PENILAIAN_PJLP.layanan) / 100).toFixed(2)]
    ],
    foot: [['', 'TOTAL', '100', '', penilaian.nilaiAkhir?.toFixed(2)]],
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [66, 139, 202] },
    footStyles: { fillColor: [40, 167, 69], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' }
    }
  })

  y = doc.lastAutoTable.finalY + 10

  // Kategori
  const kategoriColors = {
    'Kurang': [220, 53, 69],
    'Cukup': [255, 193, 7],
    'Baik': [40, 167, 69],
    'Sangat Baik': [0, 123, 255]
  }
  const kategoriColor = kategoriColors[penilaian.kategori] || [128, 128, 128]

  doc.setFillColor(...kategoriColor)
  doc.rect(20, y, pageWidth - 40, 15, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(`KATEGORI: ${penilaian.kategori?.toUpperCase() || 'N/A'}`, pageWidth / 2, y + 10, { align: 'center' })
  doc.setTextColor(0, 0, 0)
  y += 25

  // Catatan
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  if (penilaian.catatanPenilai) {
    doc.text('Catatan Penilai:', 20, y)
    y += 5
    const catatanLines = doc.splitTextToSize(penilaian.catatanPenilai, pageWidth - 40)
    doc.text(catatanLines, 20, y)
    y += catatanLines.length * 5 + 10
  }

  // Signature
  doc.text(`${settings.alamat_instansi?.split(',')[0] || 'Sorong'}, ${formatTanggal(penilaian.tanggalPenilaian)}`, pageWidth - 70, y)
  y += 5
  doc.text('Penilai,', pageWidth - 70, y)
  y += 25
  doc.setFont('helvetica', 'bold')
  doc.text(penilaian.namaPenilai || '............................', pageWidth - 70, y)

  doc.save(`Penilaian_PJLP_${pjlp?.nama?.replace(/\s/g, '_')}_TW${penilaian.triwulan}_${penilaian.tahun}.pdf`)
}

// Generate Checklist SPJ PJLP PDF
export async function generateChecklistPjlpPDF(checklist, pjlp, kontrak) {
  const settings = await getSettings()
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  let y = addHeader(doc, 'CHECKLIST KELENGKAPAN SPJ PJLP', settings)

  // Subtitle
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.text('Berdasarkan Kepmen KP No.56 Tahun 2024', pageWidth / 2, y, { align: 'center' })
  y += 10

  // Info
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Nama PJLP        : ${pjlp?.nama || '-'}`, 20, y)
  y += 5
  doc.text(`No. Kontrak      : ${kontrak?.nomorKontrak || '-'}`, 20, y)
  y += 5
  doc.text(`Bulan/Tahun      : ${getBulanLabel(checklist.bulan)} ${checklist.tahun}`, 20, y)
  y += 5
  doc.text(`Tanggal Periksa  : ${formatTanggal(checklist.tanggalPemeriksaan)}`, 20, y)
  y += 5
  doc.text(`Pemeriksa        : ${checklist.namaPemeriksa || '-'}`, 20, y)
  y += 10

  // Checklist table
  const tableBody = (checklist.items || []).map((item, i) => [
    i + 1,
    item.nama,
    item.wajib ? 'Ya' : 'Tidak',
    item.ada ? '✓' : '✗',
    item.catatan || '-'
  ])

  doc.autoTable({
    startY: y,
    head: [['No', 'Dokumen', 'Wajib', 'Ada', 'Catatan']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 139, 202] },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' }
    }
  })

  y = doc.lastAutoTable.finalY + 10

  // Summary
  const statusColor = checklist.statusKelengkapan === 'lengkap' ? [0, 128, 0] : [200, 50, 0]
  doc.setTextColor(...statusColor)
  doc.setFont('helvetica', 'bold')
  doc.text(`Status: ${checklist.statusKelengkapan === 'lengkap' ? 'LENGKAP' : 'BELUM LENGKAP'}`, 20, y)
  doc.setTextColor(0, 0, 0)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.text(`Kelengkapan: ${checklist.itemLengkap} / ${checklist.totalItem} dokumen`, 20, y)
  y += 10

  if (checklist.catatan) {
    doc.text(`Catatan: ${checklist.catatan}`, 20, y)
    y += 10
  }

  // Signature
  y += 5
  doc.text(`${settings.alamat_instansi?.split(',')[0] || 'Sorong'}, ${formatTanggal(checklist.tanggalPemeriksaan)}`, pageWidth - 70, y)
  y += 5
  doc.text('Pemeriksa,', pageWidth - 70, y)
  y += 25
  doc.setFont('helvetica', 'bold')
  doc.text(checklist.namaPemeriksa || '............................', pageWidth - 70, y)

  doc.save(`Checklist_SPJ_PJLP_${pjlp?.nama?.replace(/\s/g, '_')}_${checklist.bulan}_${checklist.tahun}.pdf`)
}

// Generate Daftar Hadir/Presensi PDF
export async function generatePresensiPjlpPDF(presensi, pjlp) {
  const settings = await getSettings()
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  let y = addHeader(doc, 'REKAP PRESENSI PJLP', settings)

  // Info
  doc.setFontSize(10)
  doc.text(`Bulan/Tahun : ${getBulanLabel(presensi.bulan)} ${presensi.tahun}`, pageWidth / 2, y, { align: 'center' })
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.text(`Nama PJLP   : ${pjlp?.nama || '-'}`, 20, y)
  y += 5
  doc.text(`NIK         : ${pjlp?.nik || '-'}`, 20, y)
  y += 5
  doc.text(`Jabatan     : ${getPosisiLabel(pjlp?.posisi)}`, 20, y)
  y += 10

  // Presensi table
  doc.autoTable({
    startY: y,
    head: [['Keterangan', 'Jumlah Hari']],
    body: [
      ['Total Hari Kerja', presensi.hariKerja],
      ['Hadir', presensi.hadir],
      ['Izin', presensi.izin],
      ['Sakit', presensi.sakit],
      ['Alpa (Tanpa Keterangan)', presensi.alpa],
      ['Terlambat', presensi.terlambat]
    ],
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [66, 139, 202] },
    columnStyles: { 1: { halign: 'center' } }
  })

  y = doc.lastAutoTable.finalY + 10

  // Persentase kehadiran
  const persentaseHadir = presensi.hariKerja > 0 ? ((presensi.hadir / presensi.hariKerja) * 100).toFixed(1) : 0
  doc.setFont('helvetica', 'bold')
  doc.text(`Persentase Kehadiran: ${persentaseHadir}%`, 20, y)
  y += 10

  if (presensi.keterangan) {
    doc.setFont('helvetica', 'normal')
    doc.text(`Keterangan: ${presensi.keterangan}`, 20, y)
  }

  doc.save(`Presensi_PJLP_${pjlp?.nama?.replace(/\s/g, '_')}_${presensi.bulan}_${presensi.tahun}.pdf`)
}

// ==================== KAK (KERANGKA ACUAN KERJA) PJLP ====================
/**
 * Generate KAK (Kerangka Acuan Kerja) PJLP
 * Berdasarkan Panduan Teknis Pengadaan PJLP KKP 2024
 */
export async function generateKakPjlpPDF(perencanaan, settings = null) {
  if (!settings) {
    settings = await getSettings()
  }
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const leftMargin = 20
  const rightMargin = pageWidth - 20

  // Header
  let y = addHeader(doc, 'KERANGKA ACUAN KERJA (KAK)', settings)

  // Nomor & Dasar Hukum
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nomor: ${perencanaan.nomorDokumen || '-'}`, pageWidth / 2, y, { align: 'center' })
  y += 10

  // 1. Latar Belakang
  doc.setFont('helvetica', 'bold')
  doc.text('1. LATAR BELAKANG', leftMargin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  const latarBelakang = perencanaan.latarBelakang ||
    `Dalam rangka mendukung pelaksanaan tugas dan fungsi ${settings.nama_instansi || 'Satuan Kerja'}, ` +
    `diperlukan tenaga ${getPosisiLabel(perencanaan.posisiDibutuhkan)} yang kompeten untuk memastikan ` +
    `kelancaran operasional sehari-hari.`
  const latarLines = doc.splitTextToSize(latarBelakang, rightMargin - leftMargin)
  doc.text(latarLines, leftMargin, y)
  y += latarLines.length * 5 + 5

  // 2. Dasar Hukum
  doc.setFont('helvetica', 'bold')
  doc.text('2. DASAR HUKUM', leftMargin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  const dasarHukum = [
    'a. Undang-Undang Nomor 17 Tahun 2003 tentang Keuangan Negara;',
    'b. Perpres 16/2018 jo 12/2021 tentang Pengadaan Barang/Jasa Pemerintah;',
    'c. PerLKPP 12/2021 tentang Pedoman Pengadaan melalui Penyedia;',
    'd. SE Menteri KP No. 1946/MEN-KP/XI/2023;',
    'e. DIPA Satuan Kerja Tahun Anggaran ' + (perencanaan.tahun || new Date().getFullYear()) + '.'
  ]
  dasarHukum.forEach(item => {
    doc.text(item, leftMargin + 3, y)
    y += 5
  })
  y += 3

  // 3. Maksud dan Tujuan
  doc.setFont('helvetica', 'bold')
  doc.text('3. MAKSUD DAN TUJUAN', leftMargin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  const maksudTujuan = perencanaan.maksudTujuan ||
    `Pengadaan Penyedia Jasa Lainnya Perseorangan (PJLP) sebagai ${getPosisiLabel(perencanaan.posisiDibutuhkan)} ` +
    `bertujuan untuk mendukung kelancaran pelaksanaan tugas dan fungsi ${settings.nama_instansi || 'Satuan Kerja'}.`
  const maksudLines = doc.splitTextToSize(maksudTujuan, rightMargin - leftMargin)
  doc.text(maksudLines, leftMargin, y)
  y += maksudLines.length * 5 + 5

  // 4. Ruang Lingkup Pekerjaan
  doc.setFont('helvetica', 'bold')
  doc.text('4. RUANG LINGKUP PEKERJAAN', leftMargin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  const lingkupPekerjaan = perencanaan.lingkupPekerjaan || perencanaan.analisisKebutuhan ||
    'Melaksanakan tugas sesuai dengan posisi yang ditentukan.'
  const lingkupLines = doc.splitTextToSize(lingkupPekerjaan, rightMargin - leftMargin)
  doc.text(lingkupLines, leftMargin, y)
  y += lingkupLines.length * 5 + 5

  // 5. Output Pekerjaan
  doc.setFont('helvetica', 'bold')
  doc.text('5. OUTPUT/KELUARAN', leftMargin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  const outputPekerjaan = perencanaan.outputPekerjaan ||
    'Laporan bulanan pelaksanaan pekerjaan sesuai dengan tugas dan fungsi yang ditetapkan.'
  const outputLines = doc.splitTextToSize(outputPekerjaan, rightMargin - leftMargin)
  doc.text(outputLines, leftMargin, y)
  y += outputLines.length * 5 + 5

  // 6. Waktu Pelaksanaan
  doc.setFont('helvetica', 'bold')
  doc.text('6. WAKTU PELAKSANAAN', leftMargin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.text(`Jangka waktu pelaksanaan: ${perencanaan.durasiKontrak || 12} (${terbilangAngka(perencanaan.durasiKontrak || 12)}) bulan`, leftMargin, y)
  y += 5
  doc.text(`Periode: Tahun Anggaran ${perencanaan.tahun || new Date().getFullYear()}`, leftMargin, y)
  y += 8

  // 7. Kualifikasi Penyedia
  doc.setFont('helvetica', 'bold')
  doc.text('7. KUALIFIKASI PENYEDIA', leftMargin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  const kualifikasi = [
    'a. Warga Negara Indonesia (WNI);',
    'b. Sehat jasmani dan rohani;',
    'c. Berkelakuan baik;',
    'd. Memiliki kemampuan sesuai dengan bidang pekerjaan;',
    'e. Tidak berstatus sebagai ASN/TNI/Polri;',
    'f. Memiliki NPWP.'
  ]
  kualifikasi.forEach(item => {
    doc.text(item, leftMargin + 3, y)
    y += 5
  })
  y += 3

  // 8. Perkiraan Biaya / HPS
  doc.setFont('helvetica', 'bold')
  doc.text('8. PERKIRAAN BIAYA', leftMargin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.text(`Jumlah Personil   : ${perencanaan.jumlahOrang || 1} orang`, leftMargin, y)
  y += 5
  doc.text(`Honor per bulan   : ${formatRupiah(perencanaan.honorBulanan || 0)}`, leftMargin, y)
  y += 5
  doc.text(`Durasi Kontrak    : ${perencanaan.durasiKontrak || 12} bulan`, leftMargin, y)
  y += 5
  doc.text(`Total Nilai       : ${formatRupiah(perencanaan.totalNilai || perencanaan.totalHps || 0)}`, leftMargin, y)
  y += 8

  // Check if need new page
  if (y > 250) {
    doc.addPage()
    y = 20
  }

  // Tanda Tangan PPK
  y += 10
  const ttdX = pageWidth - 80
  doc.text(`${settings.kota_instansi || 'Sorong'}, ${formatTanggal(perencanaan.tanggal || new Date())}`, ttdX, y)
  y += 5
  doc.text('Pejabat Pembuat Komitmen,', ttdX, y)
  y += 25
  doc.setFont('helvetica', 'bold')
  doc.text(settings.nama_ppk || '________________________', ttdX, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`NIP. ${settings.nip_ppk || '________________________'}`, ttdX, y)

  doc.save(`KAK_PJLP_${perencanaan.posisiDibutuhkan || 'dokumen'}_${perencanaan.tahun || new Date().getFullYear()}.pdf`)
}

// ==================== BAST (BERITA ACARA SERAH TERIMA) PJLP ====================
/**
 * Generate BAST (Berita Acara Serah Terima) PJLP
 * Berdasarkan Panduan Teknis Pengadaan PJLP KKP 2024
 */
export async function generateBastPjlpPDF(data) {
  const settings = await getSettings()
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const leftMargin = 20
  const rightMargin = pageWidth - 20

  const { kontrak, pjlp, bulan, tahun, nomorBast } = data

  // Header
  let y = addHeader(doc, 'BERITA ACARA SERAH TERIMA', settings)

  // Nomor
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nomor: ${nomorBast || '-'}`, pageWidth / 2, y, { align: 'center' })
  y += 10

  // Pembukaan
  const tanggalHariIni = formatTanggal(new Date())
  const hari = getHariIndonesia(new Date())
  const pembukaan = `Pada hari ini, ${hari}, tanggal ${tanggalHariIni}, kami yang bertanda tangan di bawah ini:`
  doc.text(pembukaan, leftMargin, y)
  y += 10

  // Pihak Pertama (PPK)
  doc.setFont('helvetica', 'bold')
  doc.text('PIHAK PERTAMA:', leftMargin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.text(`Nama       : ${settings.nama_ppk || '-'}`, leftMargin + 5, y)
  y += 5
  doc.text(`NIP        : ${settings.nip_ppk || '-'}`, leftMargin + 5, y)
  y += 5
  doc.text(`Jabatan    : Pejabat Pembuat Komitmen`, leftMargin + 5, y)
  y += 5
  doc.text(`Instansi   : ${settings.nama_instansi || '-'}`, leftMargin + 5, y)
  y += 5
  doc.text('Selanjutnya disebut sebagai PIHAK PERTAMA', leftMargin + 5, y)
  y += 10

  // Pihak Kedua (PJLP)
  doc.setFont('helvetica', 'bold')
  doc.text('PIHAK KEDUA:', leftMargin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.text(`Nama       : ${pjlp?.nama || '-'}`, leftMargin + 5, y)
  y += 5
  doc.text(`NIK        : ${pjlp?.nik || '-'}`, leftMargin + 5, y)
  y += 5
  doc.text(`NPWP       : ${pjlp?.npwp || '-'}`, leftMargin + 5, y)
  y += 5
  doc.text(`Alamat     : ${pjlp?.alamat || pjlp?.unitKerja || '-'}`, leftMargin + 5, y)
  y += 5
  doc.text('Selanjutnya disebut sebagai PIHAK KEDUA', leftMargin + 5, y)
  y += 10

  // Isi Berita Acara
  doc.text('Dengan ini menyatakan bahwa:', leftMargin, y)
  y += 7

  const pernyataan = [
    `1. PIHAK KEDUA telah menyelesaikan pekerjaan sebagai ${getPosisiLabel(kontrak?.posisi)}`,
    `   sesuai dengan Surat Perintah Kerja (SPK) Nomor: ${kontrak?.nomorKontrak || '-'}`,
    `   untuk periode bulan ${getBulanLabel(bulan)} ${tahun}.`,
    '',
    '2. PIHAK PERTAMA telah menerima hasil pekerjaan dari PIHAK KEDUA',
    '   dan menyatakan bahwa pekerjaan telah dilaksanakan dengan baik.',
    '',
    `3. Nilai pekerjaan yang diserahterimakan adalah sebesar:`,
    `   ${formatRupiah(kontrak?.honorBulanan || 0)} (${terbilangRupiah(kontrak?.honorBulanan || 0)})`
  ]

  pernyataan.forEach(line => {
    doc.text(line, leftMargin, y)
    y += 5
  })
  y += 5

  // Penutup
  const penutup = 'Demikian Berita Acara Serah Terima ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.'
  const penutupLines = doc.splitTextToSize(penutup, rightMargin - leftMargin)
  doc.text(penutupLines, leftMargin, y)
  y += penutupLines.length * 5 + 10

  // Tanda Tangan
  const col1X = 30
  const col2X = pageWidth - 80

  doc.text('PIHAK KEDUA,', col1X, y)
  doc.text('PIHAK PERTAMA,', col2X, y)
  y += 5
  doc.text('Yang Menyerahkan', col1X, y)
  doc.text('Yang Menerima', col2X, y)
  y += 25

  doc.setFont('helvetica', 'bold')
  doc.text(pjlp?.nama || '________________________', col1X, y)
  doc.text(settings.nama_ppk || '________________________', col2X, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`NIK. ${pjlp?.nik || '________________________'}`, col1X, y)
  doc.text(`NIP. ${settings.nip_ppk || '________________________'}`, col2X, y)

  // Mengetahui KPA
  y += 15
  doc.text('Mengetahui,', pageWidth / 2, y, { align: 'center' })
  y += 5
  doc.text('Kuasa Pengguna Anggaran', pageWidth / 2, y, { align: 'center' })
  y += 25
  doc.setFont('helvetica', 'bold')
  doc.text(settings.nama_kpa || '________________________', pageWidth / 2, y, { align: 'center' })
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`NIP. ${settings.nip_kpa || '________________________'}`, pageWidth / 2, y, { align: 'center' })

  doc.save(`BAST_PJLP_${pjlp?.nama?.replace(/\s/g, '_') || 'dokumen'}_${bulan}_${tahun}.pdf`)
}

// ==================== HPS (HARGA PERKIRAAN SENDIRI) PJLP ====================
/**
 * Generate HPS (Harga Perkiraan Sendiri) PJLP
 */
export async function generateHpsPjlpPDF(perencanaan) {
  const settings = await getSettings()
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const leftMargin = 20

  let y = addHeader(doc, 'HARGA PERKIRAAN SENDIRI (HPS)', settings)

  // Info
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Pekerjaan    : Pengadaan PJLP ${getPosisiLabel(perencanaan.posisiDibutuhkan)}`, leftMargin, y)
  y += 5
  doc.text(`Tahun        : ${perencanaan.tahun || new Date().getFullYear()}`, leftMargin, y)
  y += 10

  // Tabel Rincian
  const tableData = [
    ['Honor Bulanan', `${perencanaan.jumlahOrang || 1} org x ${perencanaan.durasiKontrak || 12} bln x ${formatRupiah(perencanaan.honorBulanan || 0)}`, formatRupiah((perencanaan.jumlahOrang || 1) * (perencanaan.durasiKontrak || 12) * (perencanaan.honorBulanan || 0))],
    ['BPJS Kesehatan (4%)', `${perencanaan.jumlahOrang || 1} org x ${perencanaan.durasiKontrak || 12} bln`, formatRupiah(perencanaan.biayaBpjsKesehatan || 0)],
    ['BPJS Ketenagakerjaan', `${perencanaan.jumlahOrang || 1} org x ${perencanaan.durasiKontrak || 12} bln`, formatRupiah(perencanaan.biayaBpjsKetenagakerjaan || 0)],
    ['THR', `${perencanaan.jumlahOrang || 1} org`, formatRupiah(perencanaan.biayaThr || 0)]
  ]

  doc.autoTable({
    startY: y,
    head: [['Komponen', 'Perhitungan', 'Jumlah (Rp)']],
    body: tableData,
    foot: [['', 'TOTAL HPS', formatRupiah(perencanaan.totalHps || 0)]],
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [51, 122, 183] },
    footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' }
  })

  y = doc.lastAutoTable.finalY + 15

  // Terbilang
  doc.setFont('helvetica', 'italic')
  doc.text(`Terbilang: ${terbilangRupiah(perencanaan.totalHps || 0)}`, leftMargin, y)
  y += 15

  // Tanda Tangan
  const ttdX = pageWidth - 80
  doc.setFont('helvetica', 'normal')
  doc.text(`${settings.kota_instansi || 'Sorong'}, ${formatTanggal(new Date())}`, ttdX, y)
  y += 5
  doc.text('Pejabat Pembuat Komitmen,', ttdX, y)
  y += 25
  doc.setFont('helvetica', 'bold')
  doc.text(settings.nama_ppk || '________________________', ttdX, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`NIP. ${settings.nip_ppk || '________________________'}`, ttdX, y)

  doc.save(`HPS_PJLP_${perencanaan.posisiDibutuhkan || 'dokumen'}_${perencanaan.tahun || new Date().getFullYear()}.pdf`)
}

// Helper function: Get hari Indonesia
function getHariIndonesia(date) {
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  return hari[date.getDay()]
}

// Helper function: Terbilang angka (untuk bulan)
function terbilangAngka(n) {
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas', 'dua belas']
  if (n <= 12) return satuan[n]
  return n.toString()
}

