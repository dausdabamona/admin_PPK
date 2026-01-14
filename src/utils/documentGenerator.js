import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { formatTanggal, formatRupiah, terbilangRupiah, hitungHari } from './formatters'
import { getSetting } from '../db/database'

// Helper to download blob
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ==================== SURAT TUGAS ====================

export async function generateSuratTugasDocx(data) {
  const namaInstansi = await getSetting('nama_instansi') || 'Politeknik Kelautan dan Perikanan Sorong'
  const alamatInstansi = await getSetting('alamat_instansi') || ''

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Header
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'KEMENTERIAN KELAUTAN DAN PERIKANAN',
              bold: true,
              size: 28
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: namaInstansi.toUpperCase(),
              bold: true,
              size: 24
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: alamatInstansi,
              size: 20
            })
          ]
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 12 }
          },
          children: []
        }),
        new Paragraph({ text: '' }),
        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'SURAT TUGAS',
              bold: true,
              size: 28,
              underline: {}
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Nomor: ${data.nomor}`,
              size: 22
            })
          ]
        }),
        new Paragraph({ text: '' }),
        // Body
        new Paragraph({
          children: [
            new TextRun({
              text: 'Dasar:',
              bold: true,
              size: 22
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: data.dasar,
              size: 22
            })
          ]
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Menugaskan kepada:',
              bold: true,
              size: 22
            })
          ]
        }),
        // Pegawai list
        ...data.pegawaiList.map((p, i) =>
          new Paragraph({
            children: [
              new TextRun({
                text: `${i + 1}. ${p.nama}`,
                size: 22
              }),
              new TextRun({
                text: `\n    NIP: ${p.nip}`,
                size: 20
              }),
              new TextRun({
                text: `\n    Jabatan: ${p.jabatan}`,
                size: 20
              })
            ]
          })
        ),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Untuk:',
              bold: true,
              size: 22
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: data.tujuanKegiatan || data.perihal,
              size: 22
            })
          ]
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Tempat: ${data.kotaTujuan}`,
              size: 22
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Waktu: ${formatTanggal(data.tanggalMulai)} s.d. ${formatTanggal(data.tanggalSelesai)}`,
              size: 22
            })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Transportasi: ${data.transportasi}`,
              size: 22
            })
          ]
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        // Signature
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: `Sorong, ${formatTanggal(data.tanggal)}`,
              size: 22
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: 'Direktur,',
              size: 22
            })
          ]
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: '____________________',
              size: 22
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({
              text: 'NIP. ',
              size: 20
            })
          ]
        })
      ]
    }]
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `Surat_Tugas_${data.nomor.replace(/\//g, '-')}.docx`)
}

export async function generateSuratTugasPDF(data) {
  const namaInstansi = await getSetting('nama_instansi') || 'Politeknik Kelautan dan Perikanan Sorong'

  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()

  // Header
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('KEMENTERIAN KELAUTAN DAN PERIKANAN', pageWidth / 2, 20, { align: 'center' })

  pdf.setFontSize(12)
  pdf.text(namaInstansi.toUpperCase(), pageWidth / 2, 28, { align: 'center' })

  pdf.setLineWidth(0.5)
  pdf.line(20, 35, pageWidth - 20, 35)

  // Title
  pdf.setFontSize(14)
  pdf.text('SURAT TUGAS', pageWidth / 2, 50, { align: 'center' })

  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Nomor: ${data.nomor}`, pageWidth / 2, 58, { align: 'center' })

  // Body
  let y = 75
  pdf.setFont('helvetica', 'bold')
  pdf.text('Dasar:', 20, y)

  pdf.setFont('helvetica', 'normal')
  const dasarLines = pdf.splitTextToSize(data.dasar, pageWidth - 40)
  pdf.text(dasarLines, 20, y + 7)
  y += 7 + (dasarLines.length * 5)

  y += 10
  pdf.setFont('helvetica', 'bold')
  pdf.text('Menugaskan kepada:', 20, y)

  y += 7
  pdf.setFont('helvetica', 'normal')
  data.pegawaiList.forEach((p, i) => {
    pdf.text(`${i + 1}. ${p.nama}`, 25, y)
    pdf.setFontSize(10)
    pdf.text(`    NIP: ${p.nip} | Jabatan: ${p.jabatan}`, 25, y + 5)
    pdf.setFontSize(11)
    y += 12
  })

  y += 5
  pdf.setFont('helvetica', 'bold')
  pdf.text('Untuk:', 20, y)
  pdf.setFont('helvetica', 'normal')
  const tujuanLines = pdf.splitTextToSize(data.tujuanKegiatan || data.perihal, pageWidth - 40)
  pdf.text(tujuanLines, 20, y + 7)
  y += 7 + (tujuanLines.length * 5)

  y += 10
  pdf.text(`Tempat: ${data.kotaTujuan}`, 20, y)
  y += 7
  pdf.text(`Waktu: ${formatTanggal(data.tanggalMulai)} s.d. ${formatTanggal(data.tanggalSelesai)}`, 20, y)
  y += 7
  pdf.text(`Transportasi: ${data.transportasi}`, 20, y)

  // Signature
  y += 25
  pdf.text(`Sorong, ${formatTanggal(data.tanggal)}`, pageWidth - 70, y)
  pdf.text('Direktur,', pageWidth - 70, y + 7)
  pdf.text('____________________', pageWidth - 70, y + 40)
  pdf.text('NIP. ', pageWidth - 70, y + 47)

  pdf.save(`Surat_Tugas_${data.nomor.replace(/\//g, '-')}.pdf`)
}

// ==================== SPPD ====================

export async function generateSPPDPDF(data) {
  const namaInstansi = await getSetting('nama_instansi') || 'Politeknik Kelautan dan Perikanan Sorong'

  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()

  // Header
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('SURAT PERJALANAN DINAS (SPPD)', pageWidth / 2, 20, { align: 'center' })

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Nomor: ${data.nomor}`, pageWidth / 2, 27, { align: 'center' })

  // Table content
  const tableData = [
    ['1', 'Pejabat Pembuat Komitmen', data.ppk?.nama || '-'],
    ['2', 'Nama/NIP Pegawai yang melaksanakan perjalanan dinas', `${data.pegawai?.nama || '-'}\nNIP. ${data.pegawai?.nip || '-'}`],
    ['3', 'a. Pangkat dan Golongan\nb. Jabatan', `a. ${data.pegawai?.pangkat || '-'} (${data.pegawai?.golongan || '-'})\nb. ${data.pegawai?.jabatan || '-'}`],
    ['4', 'Maksud Perjalanan Dinas', data.maksudPerjalanan],
    ['5', 'Alat angkutan yang dipergunakan', data.transportasi || '-'],
    ['6', 'a. Tempat berangkat\nb. Tempat tujuan', `a. ${data.kotaAsal}\nb. ${data.kotaTujuan}`],
    ['7', 'a. Lamanya Perjalanan Dinas\nb. Tanggal berangkat\nc. Tanggal harus kembali', `a. ${hitungHari(data.tanggalBerangkat, data.tanggalKembali)} hari\nb. ${formatTanggal(data.tanggalBerangkat)}\nc. ${formatTanggal(data.tanggalKembali)}`],
    ['8', 'Pengikut: Nama', '-'],
    ['9', 'Pembebanan Anggaran', `a. Instansi: ${namaInstansi}\nb. Akun: 524111`],
    ['10', 'Keterangan lain-lain', data.keteranganLain || '-']
  ]

  pdf.autoTable({
    startY: 35,
    head: [['No', 'Uraian', 'Keterangan']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 60 },
      2: { cellWidth: 'auto' }
    }
  })

  // Signature
  const finalY = pdf.lastAutoTable.finalY + 15

  pdf.setFontSize(10)
  pdf.text('Dikeluarkan di: Sorong', 20, finalY)
  pdf.text(`Tanggal: ${formatTanggal(data.tanggal)}`, 20, finalY + 5)

  pdf.text('Pejabat Pembuat Komitmen,', pageWidth - 70, finalY)
  pdf.text('____________________', pageWidth - 70, finalY + 30)
  pdf.text(`${data.ppk?.nama || ''}`, pageWidth - 70, finalY + 37)
  pdf.text(`NIP. ${data.ppk?.nip || ''}`, pageWidth - 70, finalY + 42)

  pdf.save(`SPPD_${data.nomor.replace(/\//g, '-')}.pdf`)
}

// ==================== RINCIAN BIAYA ====================

export async function generateRincianBiayaPDF(data) {
  const namaInstansi = await getSetting('nama_instansi') || 'Politeknik Kelautan dan Perikanan Sorong'

  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()

  // Header
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('RINCIAN BIAYA PERJALANAN DINAS', pageWidth / 2, 20, { align: 'center' })

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Lampiran SPPD Nomor: ${data.sppd?.nomor || '-'}`, pageWidth / 2, 27, { align: 'center' })

  let y = 40
  pdf.text(`Nama: ${data.pegawai?.nama || '-'}`, 20, y)
  pdf.text(`NIP: ${data.pegawai?.nip || '-'}`, 120, y)
  y += 7
  pdf.text(`Jabatan: ${data.pegawai?.jabatan || '-'}`, 20, y)

  // Table
  const tableData = []

  // Uang Harian
  if (data.totalRealisasiUangHarian > 0) {
    tableData.push([
      'Uang Harian',
      `${data.jumlahHariRealisasi} hari x ${formatRupiah(data.realisasiUangHarian)}`,
      formatRupiah(data.totalRealisasiUangHarian)
    ])
  }

  // Transport
  if (data.realisasiTransport > 0) {
    tableData.push([
      'Transport',
      data.jenisPerjadin === 'dalam_kota' ? 'Transport Lokal' : 'Transport Antar Kota (PP)',
      formatRupiah(data.realisasiTransport)
    ])
  }

  // Penginapan (only for luar kota)
  if (data.jenisPerjadin === 'luar_kota' && data.totalRealisasiPenginapan > 0) {
    tableData.push([
      'Penginapan',
      `${data.jumlahMalamRealisasi} malam x ${formatRupiah(data.realisasiPenginapan)}`,
      formatRupiah(data.totalRealisasiPenginapan)
    ])
  }

  // Pengeluaran Riil
  if (data.totalPengeluaranRiil > 0) {
    tableData.push([
      'Pengeluaran Riil',
      'Sesuai daftar pengeluaran riil',
      formatRupiah(data.totalPengeluaranRiil)
    ])
  }

  // Total
  tableData.push([
    { content: 'TOTAL REALISASI', styles: { fontStyle: 'bold' } },
    '',
    { content: formatRupiah(data.totalRealisasi), styles: { fontStyle: 'bold' } }
  ])

  pdf.autoTable({
    startY: y + 10,
    head: [['Jenis Biaya', 'Perhitungan', 'Jumlah']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 70 },
      2: { cellWidth: 40, halign: 'right' }
    }
  })

  const finalY = pdf.lastAutoTable.finalY + 10

  // Terbilang
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'italic')
  pdf.text(`Terbilang: ${terbilangRupiah(data.totalRealisasi)}`, 20, finalY)

  // Selisih info
  if (data.selisih !== 0) {
    pdf.setFont('helvetica', 'bold')
    const selisihText = data.statusSelisih === 'kurang'
      ? `Kurang Bayar: ${formatRupiah(Math.abs(data.selisih))}`
      : `Lebih Bayar (dikembalikan): ${formatRupiah(Math.abs(data.selisih))}`
    pdf.text(selisihText, 20, finalY + 10)
  }

  // Signature
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Sorong, ${formatTanggal(data.tanggal)}`, pageWidth - 70, finalY + 25)
  pdf.text('Yang menerima,', pageWidth - 70, finalY + 32)
  pdf.text('____________________', pageWidth - 70, finalY + 55)
  pdf.text(`${data.pegawai?.nama || ''}`, pageWidth - 70, finalY + 62)

  pdf.save(`Rincian_Biaya_${data.sppd?.nomor?.replace(/\//g, '-') || 'SPPD'}.pdf`)
}

// ==================== KWITANSI RAMPUNG ====================

export async function generateKwitansiPDF(data) {
  const namaInstansi = await getSetting('nama_instansi') || 'Politeknik Kelautan dan Perikanan Sorong'

  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()

  // Header
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('KWITANSI', pageWidth / 2, 25, { align: 'center' })

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Nomor: ${data.nomor || '-'}`, pageWidth / 2, 32, { align: 'center' })

  let y = 50

  // Sudah terima dari
  pdf.text('Sudah terima dari', 20, y)
  pdf.text(`: ${namaInstansi}`, 70, y)

  y += 10
  pdf.text('Uang sejumlah', 20, y)

  // Terbilang box
  pdf.rect(70, y - 5, pageWidth - 90, 15)
  const terbilang = terbilangRupiah(data.jumlah)
  const terbilangLines = pdf.splitTextToSize(terbilang, pageWidth - 95)
  pdf.setFont('helvetica', 'italic')
  pdf.text(terbilangLines, 72, y + 2)
  pdf.setFont('helvetica', 'normal')

  y += 20
  pdf.text('Untuk pembayaran', 20, y)
  pdf.text(`: Biaya Perjalanan Dinas`, 70, y)

  y += 7
  pdf.text('', 20, y)
  pdf.text(`  SPPD Nomor: ${data.sppd?.nomor || '-'}`, 70, y)

  y += 7
  pdf.text('', 20, y)
  pdf.text(`  Tujuan: ${data.sppd?.kotaTujuan || '-'}`, 70, y)

  y += 7
  pdf.text('', 20, y)
  pdf.text(`  Tanggal: ${formatTanggal(data.sppd?.tanggalBerangkat)} s.d. ${formatTanggal(data.sppd?.tanggalKembali)}`, 70, y)

  // Amount box
  y += 15
  pdf.setFont('helvetica', 'bold')
  pdf.rect(20, y - 5, 50, 12)
  pdf.text(formatRupiah(data.jumlah), 25, y + 3)
  pdf.setFont('helvetica', 'normal')

  // Transfer info
  y += 20
  pdf.text('Dibayarkan melalui:', 20, y)
  y += 7
  pdf.text(`Bank: ${data.pegawai?.bank || '-'}`, 30, y)
  y += 5
  pdf.text(`No. Rekening: ${data.pegawai?.rekening || '-'}`, 30, y)
  y += 5
  pdf.text(`Atas Nama: ${data.pegawai?.nama || '-'}`, 30, y)

  // Signatures
  y += 20
  pdf.text(`Sorong, ${formatTanggal(data.tanggal)}`, pageWidth / 2, y, { align: 'center' })

  y += 10
  // Three column signatures: Bendahara Pengeluaran, PPK, Yang Menerima
  const col1X = 15
  const col2X = pageWidth / 2 - 25
  const col3X = pageWidth - 65

  // Column 1 - Bendahara Pengeluaran
  pdf.text('Bendahara Pengeluaran,', col1X, y)
  pdf.text('____________________', col1X, y + 30)
  pdf.text(`${data.bendahara?.nama || ''}`, col1X, y + 37)
  pdf.text(`NIP. ${data.bendahara?.nip || ''}`, col1X, y + 42)

  // Column 2 - PPK
  pdf.text('Pejabat Pembuat Komitmen,', col2X, y)
  pdf.text('____________________', col2X, y + 30)
  pdf.text(`${data.ppk?.nama || ''}`, col2X, y + 37)
  pdf.text(`NIP. ${data.ppk?.nip || ''}`, col2X, y + 42)

  // Column 3 - Yang Menerima (Penerima)
  pdf.text('Yang Menerima,', col3X, y)
  pdf.text('____________________', col3X, y + 30)
  pdf.text(`${data.pegawai?.nama || ''}`, col3X, y + 37)
  pdf.text(`NIP. ${data.pegawai?.nip || ''}`, col3X, y + 42)

  pdf.save(`Kwitansi_${data.nomor?.replace(/\//g, '-') || 'SPPD'}.pdf`)
}

// ==================== DAFTAR PENGELUARAN RIIL ====================

export async function generatePengeluaranRiilPDF(data) {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()

  // Header
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('DAFTAR PENGELUARAN RIIL', pageWidth / 2, 20, { align: 'center' })

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Lampiran SPPD Nomor: ${data.sppd?.nomor || '-'}`, pageWidth / 2, 27, { align: 'center' })

  let y = 40
  pdf.text(`Nama: ${data.pegawai?.nama || '-'}`, 20, y)
  pdf.text(`NIP: ${data.pegawai?.nip || '-'}`, 120, y)

  // Statement
  y += 15
  pdf.text('Yang bertanda tangan di bawah ini menyatakan dengan sesungguhnya bahwa:', 20, y)
  y += 7
  const statement = '1. Biaya transport dan/atau pengeluaran lain di bawah ini yang tidak dapat diperoleh bukti pengeluarannya, meliputi:'
  const statementLines = pdf.splitTextToSize(statement, pageWidth - 40)
  pdf.text(statementLines, 20, y)

  // Table
  const tableData = (data.items || []).map((item, i) => [
    i + 1,
    formatTanggal(item.tanggal, 'short'),
    item.uraian,
    formatRupiah(item.jumlah)
  ])

  // Add total row
  const total = (data.items || []).reduce((sum, item) => sum + (item.jumlah || 0), 0)
  tableData.push([
    { content: 'JUMLAH', colSpan: 3, styles: { fontStyle: 'bold', halign: 'center' } },
    { content: formatRupiah(total), styles: { fontStyle: 'bold' } }
  ])

  pdf.autoTable({
    startY: y + 15,
    head: [['No', 'Tanggal', 'Uraian', 'Jumlah']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 35, halign: 'right' }
    }
  })

  const finalY = pdf.lastAutoTable.finalY + 10

  // Statement 2
  pdf.text('2. Jumlah uang tersebut di atas benar-benar dikeluarkan untuk pelaksanaan perjalanan dinas.', 20, finalY)

  // Signature
  pdf.text(`Sorong, ${formatTanggal(new Date())}`, pageWidth - 70, finalY + 20)
  pdf.text('Yang membuat pernyataan,', pageWidth - 70, finalY + 27)
  pdf.text('____________________', pageWidth - 70, finalY + 50)
  pdf.text(`${data.pegawai?.nama || ''}`, pageWidth - 70, finalY + 57)
  pdf.text(`NIP. ${data.pegawai?.nip || ''}`, pageWidth - 70, finalY + 62)

  pdf.save(`Pengeluaran_Riil_${data.sppd?.nomor?.replace(/\//g, '-') || 'SPPD'}.pdf`)
}

// ==================== CHECKLIST SPJ ====================

export async function generateChecklistPDF(data) {
  const namaInstansi = await getSetting('nama_instansi') || 'Politeknik Kelautan dan Perikanan Sorong'

  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()

  // Header
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  const title = data.jenisPerjadin === 'dalam_kota'
    ? 'CHECKLIST KELENGKAPAN SPJ PERJALANAN DINAS DALAM KOTA'
    : 'CHECKLIST KELENGKAPAN SPJ PERJALANAN DINAS LUAR KOTA'
  pdf.text(title, pageWidth / 2, 20, { align: 'center' })

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Berdasarkan Kepmen KP No. 56 Tahun 2024`, pageWidth / 2, 27, { align: 'center' })

  let y = 40
  pdf.text(`SPPD Nomor: ${data.sppd?.nomor || '-'}`, 20, y)
  pdf.text(`Nama: ${data.pegawai?.nama || '-'}`, 20, y + 7)
  pdf.text(`Tujuan: ${data.sppd?.kotaTujuan || '-'}`, 20, y + 14)

  // Checklist table
  const tableData = (data.items || []).map((item, i) => [
    i + 1,
    item.nama,
    item.checked ? 'V' : '-',
    item.keterangan || ''
  ])

  pdf.autoTable({
    startY: y + 25,
    head: [['No', 'Kelengkapan Dokumen', 'Ada', 'Keterangan']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 'auto' }
    }
  })

  const finalY = pdf.lastAutoTable.finalY + 10

  // Status
  pdf.setFont('helvetica', 'bold')
  pdf.text(`Status Kelengkapan: ${data.itemLengkap}/${data.totalItem} dokumen lengkap`, 20, finalY)

  // Checker info
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Pemeriksa: ${data.namaPemeriksa || '-'}`, 20, finalY + 10)
  pdf.text(`Tanggal Pemeriksaan: ${formatTanggal(data.tanggalPemeriksaan)}`, 20, finalY + 17)

  if (data.catatan) {
    pdf.text(`Catatan: ${data.catatan}`, 20, finalY + 24)
  }

  // Signature
  pdf.text(`Sorong, ${formatTanggal(data.tanggalPemeriksaan)}`, pageWidth - 70, finalY + 35)
  pdf.text('Pemeriksa,', pageWidth - 70, finalY + 42)
  pdf.text('____________________', pageWidth - 70, finalY + 65)
  pdf.text(`${data.namaPemeriksa || ''}`, pageWidth - 70, finalY + 72)

  pdf.save(`Checklist_SPJ_${data.sppd?.nomor?.replace(/\//g, '-') || 'SPPD'}.pdf`)
}
