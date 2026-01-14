import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { formatRupiah, formatTanggal, terbilangRupiah } from './formatters'

/**
 * Document Generator untuk LS Kontrak
 * Sesuai Kepmen KP No. 56 Tahun 2024
 *
 * Single Source of Truth: Semua dokumen di-generate dari 1 data source
 */

// ==================== HELPER FUNCTIONS ====================

const addKopSurat = (doc, satker = 'KEMENTERIAN KELAUTAN DAN PERIKANAN') => {
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(satker, 105, 15, { align: 'center' })
  doc.setFontSize(10)
  doc.text('REPUBLIK INDONESIA', 105, 21, { align: 'center' })

  // Line separator
  doc.setLineWidth(0.8)
  doc.line(20, 25, 190, 25)
  doc.setLineWidth(0.3)
  doc.line(20, 26, 190, 26)

  return 32 // Starting Y position
}

const addFooter = (doc, pageNumber, totalPages) => {
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Halaman ${pageNumber} dari ${totalPages}`,
    105,
    pageHeight - 10,
    { align: 'center' }
  )
}

const formatNomorSurat = (prefix, nomor, satker, bulan, tahun) => {
  const bulanRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  return `${prefix}/${nomor}/${satker}/${bulanRomawi[bulan - 1]}/${tahun}`
}

// ==================== 1. SPP (Surat Permintaan Pembayaran) ====================

export const generateSppPDF = (packageData, settings = {}) => {
  const doc = new jsPDF()
  const { kegiatan, kontrak, penyedia, pejabat } = packageData

  let y = addKopSurat(doc, settings.satkerNama || 'KEMENTERIAN KELAUTAN DAN PERIKANAN')

  // Title
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('SURAT PERMINTAAN PEMBAYARAN (SPP)', 105, y, { align: 'center' })
  doc.text('PEMBAYARAN LANGSUNG (LS)', 105, y + 6, { align: 'center' })
  y += 18

  // Nomor SPP
  const nomorSpp = formatNomorSurat(
    'SPP-LS',
    kontrak.nomorUrut || '001',
    settings.kodeSatker || '000000',
    new Date().getMonth() + 1,
    kegiatan.tahun
  )

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nomor: ${nomorSpp}`, 20, y)
  doc.text(`Tanggal: ${formatTanggal(new Date(), 'long')}`, 20, y + 6)
  y += 16

  // Isi Surat
  doc.text('Kepada Yth.', 20, y)
  y += 5
  doc.text('Pejabat Penguji dan Penandatangan SPM (PPSPM)', 20, y)
  y += 5
  doc.text(pejabat?.ppspm?.satker || settings.satkerNama, 20, y)
  y += 10

  doc.text('Dengan hormat,', 20, y)
  y += 6
  doc.text('Yang bertanda tangan di bawah ini:', 20, y)
  y += 8

  // Data PPK
  const ppkData = [
    ['Nama', ':', pejabat?.ppk?.nama || '[Nama PPK]'],
    ['NIP', ':', pejabat?.ppk?.nip || '[NIP PPK]'],
    ['Jabatan', ':', 'Pejabat Pembuat Komitmen (PPK)']
  ]

  ppkData.forEach(row => {
    doc.text(row[0], 30, y)
    doc.text(row[1], 70, y)
    doc.text(row[2], 75, y)
    y += 5
  })
  y += 5

  doc.text('Mengajukan permintaan pembayaran untuk:', 20, y)
  y += 8

  // Tabel Data Pembayaran
  const nilaiKontrak = parseFloat(kontrak.nilai) || 0
  const ppn = kontrak.ppn || 11
  const pph = kontrak.pph || 2
  const nilaiPpn = nilaiKontrak * (ppn / 100)
  const nilaiPph = nilaiKontrak * (pph / 100)
  const bruto = nilaiKontrak + nilaiPpn
  const netto = bruto - nilaiPph

  doc.autoTable({
    startY: y,
    head: [['Uraian', 'Keterangan']],
    body: [
      ['Kegiatan', kegiatan.nama || ''],
      ['MAK/Output', kegiatan.kode || ''],
      ['Penyedia/Rekanan', penyedia.nama || ''],
      ['NPWP', penyedia.npwp || ''],
      ['Nomor Kontrak', kontrak.nomor || ''],
      ['Tanggal Kontrak', formatTanggal(kontrak.tanggal, 'long')],
      ['Nilai Kontrak (DPP)', formatRupiah(nilaiKontrak)],
      [`PPN ${ppn}%`, formatRupiah(nilaiPpn)],
      ['Bruto', formatRupiah(bruto)],
      [`PPh Pasal 22 ${pph}%`, `(${formatRupiah(nilaiPph)})`],
      ['Jumlah Dibayar (Netto)', formatRupiah(netto)]
    ],
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 110 }
    }
  })

  y = doc.lastAutoTable.finalY + 10

  // Terbilang
  doc.setFont('helvetica', 'italic')
  const terbilang = terbilangRupiah(netto)
  const terbilangLines = doc.splitTextToSize(`Terbilang: ${terbilang}`, 170)
  doc.text(terbilangLines, 20, y)
  y += (terbilangLines.length * 5) + 8

  doc.setFont('helvetica', 'normal')
  doc.text('Demikian SPP ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.', 20, y)
  y += 10

  // TTD PPK
  doc.text(`${settings.kotaSatker || '[Kota]'}, ${formatTanggal(new Date(), 'long')}`, 120, y)
  y += 5
  doc.text('Pejabat Pembuat Komitmen,', 120, y)
  y += 20
  doc.setFont('helvetica', 'bold')
  doc.text(pejabat?.ppk?.nama || '[Nama PPK]', 120, y)
  y += 4
  doc.setFont('helvetica', 'normal')
  doc.text(`NIP. ${pejabat?.ppk?.nip || '[NIP PPK]'}`, 120, y)

  addFooter(doc, 1, 1)

  const filename = `SPP-LS-${kontrak.nomor?.replace(/\//g, '-')}.pdf`
  doc.save(filename)

  return {
    success: true,
    filename,
    documentType: 'SPP',
    generatedAt: new Date()
  }
}

// ==================== 2. RINGKASAN KONTRAK ====================

export const generateRingkasanKontrakPDF = (packageData, settings = {}) => {
  const doc = new jsPDF()
  const { kegiatan, kontrak, penyedia } = packageData

  let y = addKopSurat(doc, settings.satkerNama)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('RINGKASAN KONTRAK', 105, y, { align: 'center' })
  y += 12

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const data = [
    ['Nama Kegiatan', kegiatan.nama],
    ['Kode MAK/Output', kegiatan.kode],
    ['Tahun Anggaran', kegiatan.tahun],
    ['', ''],
    ['Nomor Kontrak', kontrak.nomor],
    ['Tanggal Kontrak', formatTanggal(kontrak.tanggal, 'long')],
    ['Jenis Pengadaan', kontrak.jenisKontrak],
    ['', ''],
    ['Nama Penyedia', penyedia.nama],
    ['NPWP', penyedia.npwp],
    ['Alamat', penyedia.alamat],
    ['', ''],
    ['Nilai Kontrak', formatRupiah(kontrak.nilai)],
    ['Jangka Waktu', `${kontrak.jangkaWaktu || '-'} hari`],
    ['Tanggal Mulai', formatTanggal(kontrak.tanggalMulai || kontrak.tanggal, 'long')],
    ['Tanggal Selesai', formatTanggal(kontrak.tanggalSelesai, 'long')]
  ]

  doc.autoTable({
    startY: y,
    body: data,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 110 }
    }
  })

  addFooter(doc, 1, 1)

  const filename = `Ringkasan-Kontrak-${kontrak.nomor?.replace(/\//g, '-')}.pdf`
  doc.save(filename)

  return { success: true, filename, documentType: 'Ringkasan Kontrak' }
}

// ==================== 3. KWITANSI ====================

export const generateKwitansiPDF = (packageData, settings = {}) => {
  const doc = new jsPDF()
  const { kegiatan, kontrak, penyedia } = packageData

  let y = 30

  // Title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('KWITANSI', 105, y, { align: 'center' })
  y += 10

  // Nomor Kwitansi
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nomor: ${kontrak.nomor}`, 105, y, { align: 'center' })
  y += 15

  // Nilai
  const nilaiKontrak = parseFloat(kontrak.nilai) || 0
  const ppn = kontrak.ppn || 11
  const pph = kontrak.pph || 2
  const netto = nilaiKontrak * (1 + ppn/100) - (nilaiKontrak * pph/100)

  doc.setFontSize(11)
  doc.text('Sudah terima dari:', 20, y)
  y += 6
  doc.setFont('helvetica', 'bold')
  doc.text(`Bendahara Pengeluaran ${settings.satkerNama || '[Nama Satker]'}`, 20, y)
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.text('Jumlah:', 20, y)
  y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(formatRupiah(netto), 20, y)
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'italic')
  const terbilang = terbilangRupiah(netto)
  const terbilangLines = doc.splitTextToSize(`# ${terbilang} #`, 170)
  doc.text(terbilangLines, 20, y)
  y += (terbilangLines.length * 5) + 8

  doc.setFont('helvetica', 'normal')
  doc.text('Untuk pembayaran:', 20, y)
  y += 6
  const uraianLines = doc.splitTextToSize(kegiatan.nama, 170)
  doc.text(uraianLines, 20, y)
  y += (uraianLines.length * 5) + 6
  doc.text(`Sesuai Kontrak Nomor: ${kontrak.nomor}`, 20, y)
  y += 6
  doc.text(`Tanggal: ${formatTanggal(kontrak.tanggal, 'long')}`, 20, y)
  y += 15

  // TTD Penyedia
  doc.text(`${settings.kotaSatker || '[Kota]'}, ${formatTanggal(new Date(), 'long')}`, 120, y)
  y += 5
  doc.text('Yang Menerima,', 120, y)
  y += 3

  // Materai box
  doc.setDrawColor(0)
  doc.setLineWidth(0.5)
  doc.rect(125, y, 30, 15)
  doc.setFontSize(8)
  doc.text('Materai', 132, y + 7.5, { align: 'left' })
  doc.text('Rp 10.000', 132, y + 11, { align: 'left' })
  y += 18

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(penyedia.nama, 120, y)
  y += 4
  doc.setFont('helvetica', 'normal')
  doc.text(`NPWP: ${penyedia.npwp}`, 120, y)

  const filename = `Kwitansi-${kontrak.nomor?.replace(/\//g, '-')}.pdf`
  doc.save(filename)

  return { success: true, filename, documentType: 'Kwitansi' }
}

// ==================== 4. BERITA ACARA SERAH TERIMA (BAST) ====================

export const generateBastPDF = (packageData, settings = {}) => {
  const doc = new jsPDF()
  const { kegiatan, kontrak, penyedia, pejabat } = packageData

  let y = addKopSurat(doc, settings.satkerNama)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('BERITA ACARA SERAH TERIMA', 105, y, { align: 'center' })
  doc.text('PEKERJAAN/BARANG/JASA', 105, y + 6, { align: 'center' })
  y += 14

  const nomorBast = formatNomorSurat(
    'BA',
    kontrak.nomorUrut || '001',
    settings.kodeSatker || '000000',
    new Date().getMonth() + 1,
    kegiatan.tahun
  )

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nomor: ${nomorBast}`, 105, y, { align: 'center' })
  y += 12

  // Pembukaan
  const pembukaan = `Pada hari ini ${formatTanggal(new Date(), 'full')}, kami yang bertanda tangan di bawah ini:`
  const pembukaanLines = doc.splitTextToSize(pembukaan, 170)
  doc.text(pembukaanLines, 20, y)
  y += (pembukaanLines.length * 5) + 8

  // PIHAK PERTAMA (PPK)
  doc.setFont('helvetica', 'bold')
  doc.text('PIHAK PERTAMA:', 20, y)
  y += 6
  doc.setFont('helvetica', 'normal')

  const pihakPertama = [
    ['Nama', ':', pejabat?.ppk?.nama || '[Nama PPK]'],
    ['NIP', ':', pejabat?.ppk?.nip || '[NIP PPK]'],
    ['Jabatan', ':', 'Pejabat Pembuat Komitmen (PPK)'],
    ['Satker', ':', settings.satkerNama || '[Nama Satker]']
  ]

  pihakPertama.forEach(row => {
    doc.text(row[0], 30, y)
    doc.text(row[1], 70, y)
    doc.text(row[2], 75, y)
    y += 5
  })
  y += 5

  doc.text('Selanjutnya disebut sebagai PIHAK PERTAMA', 20, y)
  y += 10

  // PIHAK KEDUA (Penyedia)
  doc.setFont('helvetica', 'bold')
  doc.text('PIHAK KEDUA:', 20, y)
  y += 6
  doc.setFont('helvetica', 'normal')

  const pihakKedua = [
    ['Nama/Perusahaan', ':', penyedia.nama],
    ['NPWP', ':', penyedia.npwp],
    ['Alamat', ':', penyedia.alamat]
  ]

  pihakKedua.forEach(row => {
    doc.text(row[0], 30, y)
    doc.text(row[1], 70, y)
    const valueLines = doc.splitTextToSize(row[2], 110)
    doc.text(valueLines, 75, y)
    y += (valueLines.length * 5)
  })
  y += 5

  doc.text('Selanjutnya disebut sebagai PIHAK KEDUA', 20, y)
  y += 10

  // Pasal 1
  doc.setFont('helvetica', 'bold')
  doc.text('Pasal 1', 20, y)
  y += 6
  doc.setFont('helvetica', 'normal')

  const pasal1 = `PIHAK KEDUA telah menyelesaikan pekerjaan ${kegiatan.nama} sesuai dengan Kontrak Nomor ${kontrak.nomor} tanggal ${formatTanggal(kontrak.tanggal, 'long')} dengan nilai kontrak sebesar ${formatRupiah(kontrak.nilai)}.`
  const pasal1Lines = doc.splitTextToSize(pasal1, 170)
  doc.text(pasal1Lines, 20, y)
  y += (pasal1Lines.length * 5) + 8

  // Pasal 2
  doc.setFont('helvetica', 'bold')
  doc.text('Pasal 2', 20, y)
  y += 6
  doc.setFont('helvetica', 'normal')

  const pasal2 = 'PIHAK PERTAMA telah memeriksa dan menerima hasil pekerjaan dari PIHAK KEDUA dalam kondisi baik dan sesuai dengan spesifikasi yang telah ditetapkan.'
  const pasal2Lines = doc.splitTextToSize(pasal2, 170)
  doc.text(pasal2Lines, 20, y)
  y += (pasal2Lines.length * 5) + 8

  // Pasal 3
  doc.setFont('helvetica', 'bold')
  doc.text('Pasal 3', 20, y)
  y += 6
  doc.setFont('helvetica', 'normal')

  const pasal3 = 'Berita Acara ini dibuat sebagai bukti serah terima pekerjaan dan untuk dipergunakan sebagaimana mestinya.'
  const pasal3Lines = doc.splitTextToSize(pasal3, 170)
  doc.text(pasal3Lines, 20, y)
  y += (pasal3Lines.length * 5) + 12

  // TTD
  const ttdY = y

  // PIHAK PERTAMA
  doc.text('PIHAK PERTAMA,', 30, ttdY)
  doc.text('PPK', 30, ttdY + 20)
  doc.setFont('helvetica', 'bold')
  doc.text(pejabat?.ppk?.nama || '[Nama PPK]', 30, ttdY + 26)
  doc.setFont('helvetica', 'normal')
  doc.text(`NIP. ${pejabat?.ppk?.nip || '[NIP PPK]'}`, 30, ttdY + 31)

  // PIHAK KEDUA
  doc.text('PIHAK KEDUA,', 120, ttdY)
  doc.text('Penyedia', 120, ttdY + 20)
  doc.setFont('helvetica', 'bold')
  doc.text(penyedia.nama, 120, ttdY + 26)
  doc.setFont('helvetica', 'normal')
  doc.text(`NPWP. ${penyedia.npwp}`, 120, ttdY + 31)

  addFooter(doc, 1, 1)

  const filename = `BAST-${kontrak.nomor?.replace(/\//g, '-')}.pdf`
  doc.save(filename)

  return { success: true, filename, documentType: 'BAST' }
}

// ==================== 5. RINCIAN PEMBAYARAN ====================

export const generateRincianPembayaranPDF = (packageData, settings = {}) => {
  const doc = new jsPDF()
  const { kegiatan, kontrak, penyedia } = packageData

  let y = addKopSurat(doc, settings.satkerNama)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('RINCIAN PERHITUNGAN PEMBAYARAN', 105, y, { align: 'center' })
  y += 12

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Kegiatan: ${kegiatan.nama}`, 20, y)
  y += 5
  doc.text(`Kontrak: ${kontrak.nomor}`, 20, y)
  y += 5
  doc.text(`Penyedia: ${penyedia.nama}`, 20, y)
  y += 10

  // Perhitungan
  const nilaiKontrak = parseFloat(kontrak.nilai) || 0
  const ppnPersen = kontrak.ppn || 11
  const pphPersen = kontrak.pph || 2
  const nilaiPpn = nilaiKontrak * (ppnPersen / 100)
  const bruto = nilaiKontrak + nilaiPpn
  const nilaiPph = nilaiKontrak * (pphPersen / 100)
  const netto = bruto - nilaiPph

  const dataRincian = [
    ['Nilai Kontrak (DPP)', formatRupiah(nilaiKontrak)],
    [`PPN ${ppnPersen}%`, formatRupiah(nilaiPpn)],
    ['Jumlah Bruto', formatRupiah(bruto)],
    ['', ''],
    ['Potongan:', ''],
    [`PPh Pasal 22 (${pphPersen}%)`, formatRupiah(nilaiPph)],
    ['', ''],
    ['Jumlah yang dibayarkan (Netto)', formatRupiah(netto)]
  ]

  doc.autoTable({
    startY: y,
    body: dataRincian,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 70, halign: 'right', fontStyle: 'bold' }
    }
  })

  y = doc.lastAutoTable.finalY + 8

  doc.setFont('helvetica', 'italic')
  const terbilang = terbilangRupiah(netto)
  const terbilangLines = doc.splitTextToSize(`Terbilang: ${terbilang}`, 170)
  doc.text(terbilangLines, 20, y)
  y += (terbilangLines.length * 5) + 10

  // Rekening tujuan
  doc.setFont('helvetica', 'bold')
  doc.text('REKENING TUJUAN PEMBAYARAN:', 20, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.text(`Bank: ${penyedia.namaBank}`, 20, y)
  y += 5
  doc.text(`No. Rekening: ${penyedia.rekening}`, 20, y)
  y += 5
  doc.text(`Atas Nama: ${penyedia.namaPemilikRekening || penyedia.nama}`, 20, y)

  addFooter(doc, 1, 1)

  const filename = `Rincian-Pembayaran-${kontrak.nomor?.replace(/\//g, '-')}.pdf`
  doc.save(filename)

  return { success: true, filename, documentType: 'Rincian Pembayaran' }
}

// ==================== GENERATE ALL ====================

export const generateAllDocuments = async (packageData, settings = {}, selectedTemplates = null) => {
  const results = []

  try {
    // List dokumen yang akan di-generate
    const generators = [
      { code: 'spp', fn: generateSppPDF, name: 'SPP' },
      { code: 'ringkasan-kontrak', fn: generateRingkasanKontrakPDF, name: 'Ringkasan Kontrak' },
      { code: 'kwitansi', fn: generateKwitansiPDF, name: 'Kwitansi' },
      { code: 'bast', fn: generateBastPDF, name: 'BAST' },
      { code: 'rincian-pembayaran', fn: generateRincianPembayaranPDF, name: 'Rincian Pembayaran' }
    ]

    // Filter jika ada selected templates
    const toGenerate = selectedTemplates
      ? generators.filter(g => selectedTemplates.includes(g.code))
      : generators

    for (const generator of toGenerate) {
      try {
        const result = await generator.fn(packageData, settings)
        results.push({
          ...result,
          templateCode: generator.code,
          templateName: generator.name
        })
      } catch (error) {
        console.error(`Failed to generate ${generator.name}:`, error)
        results.push({
          success: false,
          error: error.message,
          templateCode: generator.code,
          templateName: generator.name
        })
      }
    }

    return results
  } catch (error) {
    console.error('Generate all failed:', error)
    throw error
  }
}

// ==================== SINGLE GENERATOR ====================

export const generateSingleDocument = async (templateCode, packageData, settings = {}) => {
  const generators = {
    'spp': generateSppPDF,
    'ringkasan-kontrak': generateRingkasanKontrakPDF,
    'kwitansi': generateKwitansiPDF,
    'bast': generateBastPDF,
    'rincian-pembayaran': generateRincianPembayaranPDF
  }

  const generator = generators[templateCode]
  if (!generator) {
    throw new Error(`Template ${templateCode} not found`)
  }

  return await generator(packageData, settings)
}

// Export object untuk kemudahan import
export const lsKontrakDocGenerator = {
  generateSingle: generateSingleDocument,
  generateAll: generateAllDocuments,
  generators: {
    spp: generateSppPDF,
    ringkasanKontrak: generateRingkasanKontrakPDF,
    kwitansi: generateKwitansiPDF,
    bast: generateBastPDF,
    rincianPembayaran: generateRincianPembayaranPDF
  }
}

export default lsKontrakDocGenerator
