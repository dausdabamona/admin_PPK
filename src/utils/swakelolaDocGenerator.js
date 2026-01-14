import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { formatTanggal, formatRupiah, terbilangRupiah } from './formatters'
import db, { PERAN_TIM_SWAKELOLA, KATEGORI_REALISASI_SWAKELOLA } from '../db/database'

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

  // Logo area (placeholder)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(settings.nama_instansi || 'POLITEKNIK KELAUTAN DAN PERIKANAN SORONG', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(settings.alamat_instansi || 'Jl. Kapitan Pattimura, Sorong, Papua Barat Daya', pageWidth / 2, 26, { align: 'center' })

  // Line separator
  doc.setLineWidth(0.5)
  doc.line(20, 30, pageWidth - 20, 30)
  doc.setLineWidth(0.2)
  doc.line(20, 31, pageWidth - 20, 31)

  // Title
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageWidth / 2, 40, { align: 'center' })

  return 45
}

// Generate SK Tim Swakelola PDF
export async function generateSKTimSwakelolaPDF({ kegiatan, tim }) {
  const settings = await getSettings()
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  let y = addHeader(doc, 'SURAT KEPUTUSAN TIM SWAKELOLA', settings)

  // SK Number
  const nomorSK = tim[0]?.nomorSK || `SK/SWK/${new Date().getFullYear()}`
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nomor: ${nomorSK}`, pageWidth / 2, y, { align: 'center' })
  y += 5
  doc.text(`Tanggal: ${tim[0]?.tanggalSK ? formatTanggal(tim[0].tanggalSK) : formatTanggal(new Date())}`, pageWidth / 2, y, { align: 'center' })
  y += 10

  // Kegiatan info
  doc.setFont('helvetica', 'bold')
  doc.text('TENTANG', pageWidth / 2, y, { align: 'center' })
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`PENETAPAN TIM PELAKSANA KEGIATAN SWAKELOLA`, pageWidth / 2, y, { align: 'center' })
  y += 5
  doc.text(`"${kegiatan?.nama || '-'}"`, pageWidth / 2, y, { align: 'center' })
  y += 10

  // Kegiatan Details
  doc.text(`Kode Kegiatan: ${kegiatan?.kode || '-'}`, 20, y)
  y += 5
  doc.text(`Sumber Dana: ${kegiatan?.sumberDana || '-'}`, 20, y)
  y += 5
  doc.text(`Akun: ${kegiatan?.akun || '-'}`, 20, y)
  y += 5
  doc.text(`Pagu: ${formatRupiah(kegiatan?.pagu)}`, 20, y)
  y += 10

  // Tim table
  const tableBody = tim.map((t, i) => {
    const peranLabel = PERAN_TIM_SWAKELOLA.find(p => p.id === t.peran)?.nama || t.peran
    return [
      i + 1,
      t.pegawai?.nama || '-',
      t.pegawai?.nip || '-',
      t.pegawai?.jabatan || '-',
      peranLabel,
      formatRupiah(t.honorPerBulan),
      t.jumlahBulan,
      formatRupiah(t.totalHonor)
    ]
  })

  doc.autoTable({
    startY: y,
    head: [['No', 'Nama', 'NIP', 'Jabatan', 'Peran', 'Honor/Bln', 'Bulan', 'Total']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
    columnStyles: {
      0: { cellWidth: 10 },
      5: { halign: 'right' },
      6: { halign: 'center' },
      7: { halign: 'right' }
    }
  })

  y = doc.lastAutoTable.finalY + 10

  // Total Honor
  const totalHonor = tim.reduce((acc, t) => acc + (t.totalHonor || 0), 0)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total Honor Tim: ${formatRupiah(totalHonor)}`, 20, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`Terbilang: ${terbilangRupiah(totalHonor)}`, 20, y)
  y += 15

  // Signature
  doc.text(`${settings.alamat_instansi?.split(',')[0] || 'Sorong'}, ${formatTanggal(new Date())}`, pageWidth - 70, y)
  y += 5
  doc.text('Pejabat Pembuat Komitmen,', pageWidth - 70, y)
  y += 25
  doc.setFont('helvetica', 'bold')
  doc.text(settings.nama_ppk || '............................', pageWidth - 70, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`NIP. ${settings.nip_ppk || '............................'}`, pageWidth - 70, y)

  doc.save(`SK_Tim_${kegiatan?.kode || 'Swakelola'}.pdf`)
}

// Generate Kwitansi Uang Muka PDF
export async function generateKwitansiUangMukaPDF(uangMuka) {
  const settings = await getSettings()
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  let y = addHeader(doc, 'KWITANSI UANG MUKA', settings)

  // Kwitansi Number
  doc.setFontSize(10)
  doc.text(`Nomor: ${uangMuka.nomorKwitansi}`, pageWidth / 2, y, { align: 'center' })
  y += 10

  // Content
  const leftMargin = 20
  const labelWidth = 40

  doc.setFont('helvetica', 'normal')
  doc.text('Sudah terima dari', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.text(settings.nama_instansi || 'PKP Sorong', leftMargin + labelWidth + 5, y)
  y += 7

  doc.text('Uang sebanyak', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatRupiah(uangMuka.jumlah), leftMargin + labelWidth + 5, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.text('Terbilang', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  const terbilangText = uangMuka.terbilang || terbilangRupiah(uangMuka.jumlah)
  const terbilangLines = doc.splitTextToSize(terbilangText, pageWidth - leftMargin - labelWidth - 30)
  doc.text(terbilangLines, leftMargin + labelWidth + 5, y)
  y += (terbilangLines.length * 5) + 7

  doc.text('Untuk Pembayaran', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.text(`Uang Muka Kegiatan Swakelola`, leftMargin + labelWidth + 5, y)
  y += 7

  doc.text('Kegiatan', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.text(`${uangMuka.kegiatan?.kode || ''} - ${uangMuka.kegiatan?.nama || ''}`, leftMargin + labelWidth + 5, y)
  y += 7

  doc.text('Keterangan', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.text(uangMuka.keterangan || '-', leftMargin + labelWidth + 5, y)
  y += 7

  doc.text('Rekening Tujuan', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.text(`${uangMuka.rekeningTujuan || '-'} (${uangMuka.bankTujuan || '-'})`, leftMargin + labelWidth + 5, y)
  y += 15

  // Amount box
  doc.setFillColor(240, 240, 240)
  doc.rect(leftMargin, y, pageWidth - 40, 15, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(formatRupiah(uangMuka.jumlah), pageWidth / 2, y + 10, { align: 'center' })
  y += 25

  // Signatures
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Left signature (Penerima)
  doc.text('Yang Menerima,', leftMargin + 20, y, { align: 'center' })
  y += 25
  doc.setFont('helvetica', 'bold')
  doc.text(uangMuka.penerima?.nama || '............................', leftMargin + 20, y, { align: 'center' })

  // Right signature (PPK)
  const rightX = pageWidth - 60
  doc.setFont('helvetica', 'normal')
  doc.text(`${settings.alamat_instansi?.split(',')[0] || 'Sorong'}, ${formatTanggal(uangMuka.tanggal)}`, rightX, y - 25, { align: 'center' })
  doc.text('Pejabat Pembuat Komitmen,', rightX, y - 20, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.text(settings.nama_ppk || '............................', rightX, y, { align: 'center' })

  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`NIP. ${uangMuka.penerima?.nip || '............................'}`, leftMargin + 20, y, { align: 'center' })
  doc.text(`NIP. ${settings.nip_ppk || '............................'}`, rightX, y, { align: 'center' })

  doc.save(`Kwitansi_UM_${uangMuka.nomorKwitansi.replace(/\//g, '_')}.pdf`)
}

// Generate Realisasi Biaya PDF
export async function generateRealisasiBiayaPDF(realisasi, items) {
  const settings = await getSettings()
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  let y = addHeader(doc, 'RINCIAN REALISASI BIAYA SWAKELOLA', settings)

  // Info
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Kegiatan: ${realisasi.kegiatan?.kode} - ${realisasi.kegiatan?.nama}`, 20, y)
  y += 5
  doc.text(`Tanggal: ${formatTanggal(realisasi.tanggal)}`, 20, y)
  y += 5
  doc.text(`No. Uang Muka: ${realisasi.uangMuka?.nomorKwitansi || '-'}`, 20, y)
  y += 10

  // Items table
  const tableBody = items.map((item, i) => {
    const kategoriLabel = KATEGORI_REALISASI_SWAKELOLA.find(k => k.id === item.kategori)?.nama || item.kategori
    return [
      i + 1,
      kategoriLabel,
      item.uraian,
      item.volume,
      item.satuan,
      formatRupiah(item.hargaSatuan),
      formatRupiah(item.jumlah),
      item.noBukti || '-'
    ]
  })

  doc.autoTable({
    startY: y,
    head: [['No', 'Kategori', 'Uraian', 'Vol', 'Sat', 'Harga Sat.', 'Jumlah', 'No. Bukti']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
    columnStyles: {
      0: { cellWidth: 10 },
      5: { halign: 'right' },
      6: { halign: 'right' }
    },
    foot: [[
      { content: 'TOTAL', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: formatRupiah(realisasi.totalRealisasi), styles: { halign: 'right', fontStyle: 'bold' } },
      ''
    ]]
  })

  y = doc.lastAutoTable.finalY + 10

  // Terbilang
  doc.setFont('helvetica', 'normal')
  doc.text(`Terbilang: ${terbilangRupiah(realisasi.totalRealisasi)}`, 20, y)
  y += 5
  doc.text(`Keterangan: ${realisasi.keterangan || '-'}`, 20, y)
  y += 15

  // Signature
  doc.text(`${settings.alamat_instansi?.split(',')[0] || 'Sorong'}, ${formatTanggal(new Date())}`, pageWidth - 70, y)
  y += 5
  doc.text('Mengetahui,', pageWidth - 70, y)
  y += 5
  doc.text('Pejabat Pembuat Komitmen,', pageWidth - 70, y)
  y += 25
  doc.setFont('helvetica', 'bold')
  doc.text(settings.nama_ppk || '............................', pageWidth - 70, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`NIP. ${settings.nip_ppk || '............................'}`, pageWidth - 70, y)

  doc.save(`Realisasi_${realisasi.kegiatan?.kode || 'SWK'}_${formatTanggal(realisasi.tanggal, 'short').replace(/\//g, '-')}.pdf`)
}

// Generate Kwitansi Rampung Swakelola PDF
export async function generateKwitansiRampungSwakelolaPDF(rampung) {
  const settings = await getSettings()
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  let y = addHeader(doc, 'KWITANSI RAMPUNG SWAKELOLA', settings)

  // Kwitansi Number
  doc.setFontSize(10)
  doc.text(`Nomor: ${rampung.nomorKwitansi}`, pageWidth / 2, y, { align: 'center' })
  y += 10

  const leftMargin = 20
  const labelWidth = 50

  // Content
  doc.setFont('helvetica', 'normal')

  doc.text('Kegiatan', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.text(`${rampung.kegiatan?.kode} - ${rampung.kegiatan?.nama}`, leftMargin + labelWidth + 5, y)
  y += 7

  doc.text('Tanggal Rampung', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.text(formatTanggal(rampung.tanggal), leftMargin + labelWidth + 5, y)
  y += 7

  doc.text('No. Uang Muka', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.text(rampung.uangMuka?.nomorKwitansi || '-', leftMargin + labelWidth + 5, y)
  y += 10

  // Financial Summary Box
  doc.setFillColor(245, 245, 245)
  doc.rect(leftMargin, y, pageWidth - 40, 35, 'F')
  doc.setDrawColor(200, 200, 200)
  doc.rect(leftMargin, y, pageWidth - 40, 35)

  y += 8
  doc.text('Total Uang Muka', leftMargin + 5, y)
  doc.text(':', leftMargin + 55, y)
  doc.text(formatRupiah(rampung.totalUangMuka), leftMargin + 60, y)
  y += 7

  doc.text('Total Realisasi', leftMargin + 5, y)
  doc.text(':', leftMargin + 55, y)
  doc.text(formatRupiah(rampung.totalRealisasi), leftMargin + 60, y)
  y += 7

  doc.setLineWidth(0.5)
  doc.line(leftMargin + 5, y - 2, pageWidth - 25, y - 2)

  doc.setFont('helvetica', 'bold')
  const selisihLabel = rampung.statusSelisih === 'kurang_bayar' ? 'Kurang Bayar' :
                       rampung.statusSelisih === 'lebih_bayar' ? 'Lebih Bayar (Setoran)' : 'Nihil'
  doc.text(selisihLabel, leftMargin + 5, y + 3)
  doc.text(':', leftMargin + 55, y + 3)
  doc.text(formatRupiah(Math.abs(rampung.selisih)), leftMargin + 60, y + 3)
  y += 20

  // Terbilang
  doc.setFont('helvetica', 'normal')
  const terbilangText = terbilangRupiah(Math.abs(rampung.selisih))
  doc.text(`Terbilang: ${terbilangText}`, leftMargin, y)
  y += 7

  doc.text(`Keterangan: ${rampung.keterangan || '-'}`, leftMargin, y)
  y += 15

  // Status message
  if (rampung.statusSelisih === 'lebih_bayar') {
    doc.setFillColor(255, 245, 238)
    doc.rect(leftMargin, y, pageWidth - 40, 12, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(200, 50, 0)
    doc.text('Sisa uang muka harus disetorkan ke kas negara', pageWidth / 2, y + 8, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    y += 18
  } else if (rampung.statusSelisih === 'kurang_bayar') {
    doc.setFillColor(240, 255, 240)
    doc.rect(leftMargin, y, pageWidth - 40, 12, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 128, 0)
    doc.text('Perlu pembayaran tambahan untuk melunasi realisasi', pageWidth / 2, y + 8, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    y += 18
  }

  // Signatures
  doc.setFont('helvetica', 'normal')

  // Left signature (Bendahara)
  doc.text('Yang Bertanggung Jawab,', leftMargin + 20, y, { align: 'center' })
  y += 25
  doc.setFont('helvetica', 'bold')
  doc.text(rampung.bendahara?.nama || '............................', leftMargin + 20, y, { align: 'center' })

  // Right signature (PPK)
  const rightX = pageWidth - 60
  doc.setFont('helvetica', 'normal')
  doc.text(`${settings.alamat_instansi?.split(',')[0] || 'Sorong'}, ${formatTanggal(rampung.tanggal)}`, rightX, y - 25, { align: 'center' })
  doc.text('Pejabat Pembuat Komitmen,', rightX, y - 20, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.text(settings.nama_ppk || '............................', rightX, y, { align: 'center' })

  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`NIP. ${rampung.bendahara?.nip || '............................'}`, leftMargin + 20, y, { align: 'center' })
  doc.text(`NIP. ${settings.nip_ppk || '............................'}`, rightX, y, { align: 'center' })

  doc.save(`Kwitansi_Rampung_${rampung.nomorKwitansi?.replace(/\//g, '_') || 'SWK'}.pdf`)
}

// Generate Checklist SPJ Swakelola PDF
export async function generateChecklistSwakelolaSpjPDF(checklist, kegiatan) {
  const settings = await getSettings()
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  let y = addHeader(doc, 'CHECKLIST KELENGKAPAN SPJ SWAKELOLA', settings)

  // Subtitle
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.text('Berdasarkan Kepmen KP No.56 Tahun 2024', pageWidth / 2, y, { align: 'center' })
  y += 10

  // Kegiatan Info
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Kegiatan: ${kegiatan?.kode} - ${kegiatan?.nama}`, 20, y)
  y += 5
  doc.text(`Tanggal Pemeriksaan: ${formatTanggal(checklist.tanggalPemeriksaan)}`, 20, y)
  y += 5
  doc.text(`Nama Pemeriksa: ${checklist.namaPemeriksa || '-'}`, 20, y)
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

  doc.save(`Checklist_SPJ_${kegiatan?.kode || 'SWK'}.pdf`)
}

// Generate Kartu Kendali Kelengkapan Dokumen untuk PUM (Pemegang Uang Muka) - Swakelola
export async function generateKartuKendaliPUMSwakeolaPDF(uangMuka, checklistItems) {
  const settings = await getSettings()
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  let y = addHeader(doc, 'KARTU KENDALI KELENGKAPAN DOKUMEN SPJ', settings)

  // Subtitle
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.text('(Diberikan kepada Pemegang Uang Muka)', pageWidth / 2, y, { align: 'center' })
  y += 10

  const leftMargin = 20
  const labelWidth = 45

  // Info Kegiatan
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  doc.text('Kegiatan', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.setFont('helvetica', 'bold')
  doc.text(`${uangMuka.kegiatan?.kode || ''} - ${uangMuka.kegiatan?.nama || ''}`, leftMargin + labelWidth + 5, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.text('No. Kwitansi UM', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.text(uangMuka.nomorKwitansi || '-', leftMargin + labelWidth + 5, y)
  y += 6

  doc.text('Tanggal Uang Muka', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.text(formatTanggal(uangMuka.tanggal), leftMargin + labelWidth + 5, y)
  y += 6

  doc.text('Pemegang Uang Muka', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.setFont('helvetica', 'bold')
  doc.text(uangMuka.penerima?.nama || '-', leftMargin + labelWidth + 5, y)
  y += 10

  // Financial Info Box
  doc.setFillColor(240, 249, 255)
  doc.rect(leftMargin, y, pageWidth - 40, 25, 'F')
  doc.setDrawColor(59, 130, 246)
  doc.rect(leftMargin, y, pageWidth - 40, 25)

  y += 7
  doc.setFont('helvetica', 'normal')
  doc.text('Jumlah Uang Muka (80%)', leftMargin + 5, y)
  doc.text(':', leftMargin + 55, y)
  doc.setFont('helvetica', 'bold')
  doc.text(formatRupiah(uangMuka.jumlah), leftMargin + 60, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.text('Sisa SPJ (20%)', leftMargin + 5, y)
  doc.text(':', leftMargin + 55, y)
  const sisaSPJ = Math.round((uangMuka.jumlah / 80) * 20)
  doc.setFont('helvetica', 'bold')
  doc.text(formatRupiah(sisaSPJ), leftMargin + 60, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('*Sisa 20% akan dibayarkan setelah SPJ lengkap', leftMargin + 5, y)
  doc.setTextColor(0, 0, 0)
  y += 12

  // Info Box
  doc.setFillColor(254, 249, 195)
  doc.rect(leftMargin, y, pageWidth - 40, 15, 'F')
  doc.setDrawColor(234, 179, 8)
  doc.rect(leftMargin, y, pageWidth - 40, 15)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('PERHATIAN:', leftMargin + 5, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.text('Siapkan dokumen-dokumen berikut untuk SPJ saat mempertanggungjawabkan uang muka.', leftMargin + 30, y + 6)
  doc.text('Checklist (✓) setiap dokumen yang sudah disiapkan.', leftMargin + 5, y + 12)
  y += 20

  // Checklist Table
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('DAFTAR DOKUMEN YANG HARUS DISIAPKAN:', leftMargin, y)
  y += 7

  const tableBody = checklistItems.map((item, i) => [
    i + 1,
    item.nama,
    item.wajib ? 'WAJIB' : 'Opsional',
    '☐',  // Checkbox for manual tick
    ''    // Catatan
  ])

  doc.autoTable({
    startY: y,
    head: [['No', 'Nama Dokumen', 'Status', '✓', 'Catatan']],
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 40 }
    },
    didParseCell: (data) => {
      if (data.column.index === 2 && data.section === 'body') {
        if (data.cell.raw === 'WAJIB') {
          data.cell.styles.textColor = [220, 38, 38]
          data.cell.styles.fontStyle = 'bold'
        } else {
          data.cell.styles.textColor = [100, 100, 100]
        }
      }
    }
  })

  y = doc.lastAutoTable.finalY + 10

  // Notes
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Catatan:', leftMargin, y)
  y += 5
  doc.text('1. Dokumen dengan status WAJIB harus dilengkapi untuk pencairan sisa 20%', leftMargin + 5, y)
  y += 5
  doc.text('2. Pastikan semua bukti pengeluaran asli dan bermaterai (jika diperlukan)', leftMargin + 5, y)
  y += 5
  doc.text('3. SPJ harus diserahkan paling lambat 5 hari setelah kegiatan selesai', leftMargin + 5, y)
  y += 15

  // Tanda Terima
  doc.setFont('helvetica', 'bold')
  doc.text('TANDA TERIMA KARTU KENDALI:', leftMargin, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.text('Yang bertanda tangan di bawah ini menyatakan telah menerima kartu kendali', leftMargin, y)
  y += 5
  doc.text('kelengkapan dokumen SPJ dan akan mempertanggungjawabkan uang muka sesuai ketentuan.', leftMargin, y)
  y += 15

  // Signatures
  const colWidth = (pageWidth - 40) / 2

  // Left - Penerima UM
  doc.text(`${settings.alamat_instansi?.split(',')[0] || 'Sorong'}, ${formatTanggal(uangMuka.tanggal)}`, leftMargin + colWidth / 2, y, { align: 'center' })
  y += 5
  doc.text('Pemegang Uang Muka,', leftMargin + colWidth / 2, y, { align: 'center' })
  y += 25
  doc.setFont('helvetica', 'bold')
  doc.text(uangMuka.penerima?.nama || '............................', leftMargin + colWidth / 2, y, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  y += 5
  doc.text(`NIP. ${uangMuka.penerima?.nip || '............................'}`, leftMargin + colWidth / 2, y, { align: 'center' })

  // Right - PPK
  const rightX = leftMargin + colWidth + colWidth / 2
  y -= 35
  doc.text('Mengetahui,', rightX, y, { align: 'center' })
  y += 5
  doc.text('Pejabat Pembuat Komitmen,', rightX, y, { align: 'center' })
  y += 25
  doc.setFont('helvetica', 'bold')
  doc.text(settings.nama_ppk || '............................', rightX, y, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  y += 5
  doc.text(`NIP. ${settings.nip_ppk || '............................'}`, rightX, y, { align: 'center' })

  doc.save(`Kartu_Kendali_${uangMuka.nomorKwitansi?.replace(/\//g, '_') || 'UM'}.pdf`)
}
