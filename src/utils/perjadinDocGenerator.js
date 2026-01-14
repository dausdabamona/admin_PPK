import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { formatTanggal, formatRupiah, terbilangRupiah } from './formatters'
import db from '../db/database'

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

// Generate Kartu Kendali Kelengkapan Dokumen untuk Pembayaran LS Perjalanan Dinas
export async function generateKartuKendaliPerjadinPDF(pembayaran, checklistItems) {
  const settings = await getSettings()
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  let y = addHeader(doc, 'KARTU KENDALI KELENGKAPAN DOKUMEN SPJ', settings)

  // Subtitle
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.text('(Diberikan kepada Pelaksana Perjalanan Dinas)', pageWidth / 2, y, { align: 'center' })
  y += 10

  const leftMargin = 20
  const labelWidth = 45

  // Info Perjalanan Dinas
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  doc.text('Nomor SPPD', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.setFont('helvetica', 'bold')
  doc.text(pembayaran.sppd?.nomor || '-', leftMargin + labelWidth + 5, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.text('Pelaksana', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.setFont('helvetica', 'bold')
  doc.text(pembayaran.pegawai?.nama || '-', leftMargin + labelWidth + 5, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.text('NIP', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.text(pembayaran.pegawai?.nip || '-', leftMargin + labelWidth + 5, y)
  y += 6

  doc.text('Tujuan', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.text(pembayaran.sppd?.kotaTujuan || '-', leftMargin + labelWidth + 5, y)
  y += 6

  doc.text('Tanggal Perjalanan', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.text(`${formatTanggal(pembayaran.sppd?.tanggalBerangkat)} s/d ${formatTanggal(pembayaran.sppd?.tanggalKembali)}`, leftMargin + labelWidth + 5, y)
  y += 6

  doc.text('Jenis Perjadin', leftMargin, y)
  doc.text(':', leftMargin + labelWidth, y)
  doc.setFont('helvetica', 'bold')
  doc.text(pembayaran.sppd?.jenisPerjadin === 'dalam_kota' ? 'Dalam Kota' : 'Luar Kota', leftMargin + labelWidth + 5, y)
  y += 10

  // Financial Info Box
  doc.setFillColor(240, 249, 255)
  doc.rect(leftMargin, y, pageWidth - 40, 30, 'F')
  doc.setDrawColor(59, 130, 246)
  doc.rect(leftMargin, y, pageWidth - 40, 30)

  y += 7
  doc.setFont('helvetica', 'normal')
  doc.text('Uang Harian', leftMargin + 5, y)
  doc.text(':', leftMargin + 50, y)
  doc.text(`${formatRupiah(pembayaran.uangHarian)} x ${pembayaran.jumlahHari} hari = ${formatRupiah(pembayaran.totalUangHarian)}`, leftMargin + 55, y)
  y += 5

  doc.text('Transport', leftMargin + 5, y)
  doc.text(':', leftMargin + 50, y)
  doc.text(formatRupiah(pembayaran.transport), leftMargin + 55, y)
  y += 5

  if (pembayaran.totalPenginapan > 0) {
    doc.text('Penginapan', leftMargin + 5, y)
    doc.text(':', leftMargin + 50, y)
    doc.text(`${formatRupiah(pembayaran.penginapan)} x ${pembayaran.jumlahMalam} malam = ${formatRupiah(pembayaran.totalPenginapan)}`, leftMargin + 55, y)
    y += 5
  }

  doc.setFont('helvetica', 'bold')
  doc.text('Total Pembayaran LS', leftMargin + 5, y)
  doc.text(':', leftMargin + 50, y)
  doc.text(formatRupiah(pembayaran.totalLS), leftMargin + 55, y)
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
  doc.text('Siapkan dokumen-dokumen berikut untuk SPJ setelah perjalanan dinas selesai.', leftMargin + 30, y + 6)
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
  doc.text('1. Dokumen dengan status WAJIB harus dilengkapi untuk pertanggungjawaban SPJ', leftMargin + 5, y)
  y += 5
  doc.text('2. Boarding Pass/Tiket wajib untuk perjalanan luar kota', leftMargin + 5, y)
  y += 5
  doc.text('3. Simpan semua bukti pengeluaran riil dengan baik', leftMargin + 5, y)
  y += 5
  doc.text('4. SPJ harus diserahkan paling lambat 5 hari setelah perjalanan selesai', leftMargin + 5, y)
  y += 15

  // Tanda Terima
  doc.setFont('helvetica', 'bold')
  doc.text('TANDA TERIMA KARTU KENDALI:', leftMargin, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.text('Yang bertanda tangan di bawah ini menyatakan telah menerima kartu kendali', leftMargin, y)
  y += 5
  doc.text('kelengkapan dokumen SPJ dan akan mempertanggungjawabkan perjalanan dinas sesuai ketentuan.', leftMargin, y)
  y += 15

  // Signatures
  const colWidth = (pageWidth - 40) / 2

  // Left - Pelaksana Perjadin
  doc.text(`${settings.alamat_instansi?.split(',')[0] || 'Sorong'}, ${formatTanggal(pembayaran.tanggal)}`, leftMargin + colWidth / 2, y, { align: 'center' })
  y += 5
  doc.text('Pelaksana Perjalanan Dinas,', leftMargin + colWidth / 2, y, { align: 'center' })
  y += 25
  doc.setFont('helvetica', 'bold')
  doc.text(pembayaran.pegawai?.nama || '............................', leftMargin + colWidth / 2, y, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  y += 5
  doc.text(`NIP. ${pembayaran.pegawai?.nip || '............................'}`, leftMargin + colWidth / 2, y, { align: 'center' })

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

  doc.save(`Kartu_Kendali_${pembayaran.sppd?.nomor?.replace(/\//g, '_') || 'SPPD'}.pdf`)
}
