import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, AlignmentType, WidthType } from 'docx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { formatRupiah, formatTanggal, terbilangRupiah } from '../formatters'

/**
 * DocumentGenerationEngine - Multi-Format Document Generator
 *
 * Supports:
 * - HTML (print-ready A4)
 * - DOCX (editable MS Word)
 * - PDF (final document)
 *
 * Architecture:
 * - Template Registry
 * - Data Mapper
 * - Format-specific Generators
 * - Output Manager
 */

class DocumentGenerationEngine {
  constructor() {
    this.templates = new Map()
    this.registerDefaultTemplates()
  }

  // ==================== TEMPLATE REGISTRY ====================

  registerDefaultTemplates() {
    // Register all standard templates
    this.registerTemplate('spp', {
      name: 'Surat Permintaan Pembayaran (SPP)',
      formats: ['html', 'docx', 'pdf'],
      requiredFields: [
        'kegiatan.nama',
        'kontrak.nomor',
        'kontrak.nilai',
        'penyedia.nama',
        'pejabat.ppk.nama'
      ],
      generator: this.generateSPP.bind(this)
    })

    this.registerTemplate('sppr', {
      name: 'Surat Pernyataan Pertanggungjawaban (SPPR)',
      formats: ['html', 'docx', 'pdf'],
      requiredFields: ['kegiatan.nama', 'kegiatan.pagu', 'pejabat.ppk.nama'],
      generator: this.generateSPPR.bind(this)
    })

    this.registerTemplate('tanda-terima', {
      name: 'Tanda Terima',
      formats: ['html', 'docx', 'pdf'],
      requiredFields: ['penyedia.nama', 'kontrak.nilai'],
      generator: this.generateTandaTerima.bind(this)
    })

    this.registerTemplate('kwitansi', {
      name: 'Kwitansi',
      formats: ['html', 'docx', 'pdf'],
      requiredFields: ['penyedia.nama', 'kontrak.nilai', 'kontrak.nomor'],
      generator: this.generateKwitansi.bind(this)
    })

    this.registerTemplate('bast', {
      name: 'Berita Acara Serah Terima',
      formats: ['html', 'docx', 'pdf'],
      requiredFields: [
        'kegiatan.nama',
        'kontrak.nomor',
        'penyedia.nama',
        'pejabat.ppk.nama'
      ],
      generator: this.generateBAST.bind(this)
    })
  }

  registerTemplate(code, config) {
    this.templates.set(code, config)
  }

  getTemplate(code) {
    return this.templates.get(code)
  }

  // ==================== MAIN GENERATE METHOD ====================

  async generate(templateCode, data, format = 'pdf', options = {}) {
    const template = this.getTemplate(templateCode)
    if (!template) {
      throw new Error(`Template ${templateCode} not found`)
    }

    if (!template.formats.includes(format)) {
      throw new Error(`Format ${format} not supported for template ${templateCode}`)
    }

    // Validate required fields
    this.validateData(template.requiredFields, data)

    // Enrich data if needed
    const enrichedData = await this.enrichData(data)

    // Generate based on format
    return await template.generator(enrichedData, format, options)
  }

  // ==================== DATA VALIDATION & ENRICHMENT ====================

  validateData(requiredFields, data) {
    const missing = []

    requiredFields.forEach(field => {
      const value = this.getNestedValue(data, field)
      if (!value) {
        missing.push(field)
      }
    })

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`)
    }
  }

  async enrichData(data) {
    // Add computed fields
    const enriched = { ...data }

    // Calculate financial values if not present
    if (data.kontrak?.nilai && !data.perhitungan) {
      const nilai = parseFloat(data.kontrak.nilai)
      const ppn = data.kontrak.ppn || 11
      const pph = data.kontrak.pph || 2

      enriched.perhitungan = {
        nilaiKontrak: nilai,
        ppnPersen: ppn,
        pphPersen: pph,
        nilaiPpn: nilai * (ppn / 100),
        bruto: nilai * (1 + ppn / 100),
        nilaiPph: nilai * (pph / 100),
        netto: nilai * (1 + ppn / 100) - nilai * (pph / 100)
      }
    }

    // Add timestamp if not present
    if (!enriched.generatedAt) {
      enriched.generatedAt = new Date()
    }

    return enriched
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj)
  }

  // ==================== SPP GENERATOR ====================

  async generateSPP(data, format, options) {
    const content = {
      title: 'SURAT PERMINTAAN PEMBAYARAN (SPP)',
      subtitle: 'PEMBAYARAN LANGSUNG (LS)',
      sections: [
        {
          type: 'header',
          content: {
            nomor: this.generateNomorSurat('SPP-LS', data),
            tanggal: formatTanggal(new Date(), 'long')
          }
        },
        {
          type: 'paragraph',
          content: 'Yang bertanda tangan di bawah ini:'
        },
        {
          type: 'table',
          content: [
            ['Nama', ':', data.pejabat?.ppk?.nama || '[Nama PPK]'],
            ['NIP', ':', data.pejabat?.ppk?.nip || '[NIP PPK]'],
            ['Jabatan', ':', 'Pejabat Pembuat Komitmen (PPK)']
          ]
        },
        {
          type: 'paragraph',
          content: 'Mengajukan permintaan pembayaran untuk:'
        },
        {
          type: 'table',
          content: [
            ['Kegiatan', data.kegiatan?.nama || ''],
            ['MAK/Output', data.kegiatan?.kode || ''],
            ['Penyedia', data.penyedia?.nama || ''],
            ['NPWP', data.penyedia?.npwp || ''],
            ['Nomor Kontrak', data.kontrak?.nomor || ''],
            ['Tanggal Kontrak', formatTanggal(data.kontrak?.tanggal, 'long')],
            ['Nilai Kontrak (DPP)', formatRupiah(data.perhitungan?.nilaiKontrak || 0)],
            [`PPN ${data.perhitungan?.ppnPersen || 11}%`, formatRupiah(data.perhitungan?.nilaiPpn || 0)],
            ['Bruto', formatRupiah(data.perhitungan?.bruto || 0)],
            [`PPh ${data.perhitungan?.pphPersen || 2}%`, `(${formatRupiah(data.perhitungan?.nilaiPph || 0)})`],
            ['Jumlah Dibayar (Netto)', formatRupiah(data.perhitungan?.netto || 0)]
          ]
        },
        {
          type: 'paragraph',
          content: `Terbilang: ${terbilangRupiah(data.perhitungan?.netto || 0)}`,
          style: 'italic'
        },
        {
          type: 'signature',
          content: {
            location: data.settings?.kotaSatker || '[Kota]',
            date: formatTanggal(new Date(), 'long'),
            position: 'Pejabat Pembuat Komitmen',
            name: data.pejabat?.ppk?.nama || '[Nama PPK]',
            nip: data.pejabat?.ppk?.nip || '[NIP PPK]'
          }
        }
      ]
    }

    return await this.renderFormat(content, format, 'SPP', data)
  }

  // ==================== KWITANSI GENERATOR ====================

  async generateKwitansi(data, format, options) {
    const content = {
      title: 'KWITANSI',
      sections: [
        {
          type: 'center-text',
          content: `Nomor: ${data.kontrak?.nomor || ''}`
        },
        {
          type: 'paragraph',
          content: `Sudah terima dari: Bendahara Pengeluaran ${data.settings?.satkerNama || '[Nama Satker]'}`
        },
        {
          type: 'paragraph',
          content: `Jumlah: ${formatRupiah(data.perhitungan?.netto || 0)}`,
          style: 'bold'
        },
        {
          type: 'paragraph',
          content: `Terbilang: ${terbilangRupiah(data.perhitungan?.netto || 0)}`,
          style: 'italic'
        },
        {
          type: 'paragraph',
          content: `Untuk pembayaran: ${data.kegiatan?.nama || ''}`
        },
        {
          type: 'paragraph',
          content: `Sesuai Kontrak Nomor: ${data.kontrak?.nomor || ''}`
        },
        {
          type: 'paragraph',
          content: `Tanggal: ${formatTanggal(data.kontrak?.tanggal, 'long')}`
        },
        {
          type: 'signature',
          content: {
            location: data.settings?.kotaSatker || '[Kota]',
            date: formatTanggal(new Date(), 'long'),
            position: 'Yang Menerima',
            name: data.penyedia?.nama || '[Nama Penyedia]',
            nip: `NPWP: ${data.penyedia?.npwp || '[NPWP]'}`,
            materai: true
          }
        }
      ]
    }

    return await this.renderFormat(content, format, 'Kwitansi', data)
  }

  // ==================== FORMAT RENDERERS ====================

  async renderFormat(content, format, filename, data) {
    switch (format) {
      case 'html':
        return this.renderHTML(content, filename, data)
      case 'docx':
        return this.renderDOCX(content, filename, data)
      case 'pdf':
        return this.renderPDF(content, filename, data)
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  }

  // ==================== HTML RENDERER ====================

  renderHTML(content, filename, data) {
    let html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title}</title>
  <style>
    @page {
      size: A4;
      margin: 2.54cm;
    }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.5;
      max-width: 21cm;
      margin: 0 auto;
      padding: 2.54cm;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }
    .title {
      font-size: 14pt;
      font-weight: bold;
      margin: 10px 0;
    }
    .subtitle {
      font-size: 12pt;
      font-weight: bold;
      margin: 5px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    table.bordered {
      border: 1px solid #000;
    }
    table.bordered td, table.bordered th {
      border: 1px solid #000;
      padding: 8px;
    }
    table.simple td {
      padding: 5px;
      vertical-align: top;
    }
    .bold { font-weight: bold; }
    .italic { font-style: italic; }
    .center { text-align: center; }
    .signature {
      margin-top: 50px;
      text-align: right;
      width: 50%;
      float: right;
    }
    .signature-line {
      margin-top: 80px;
      border-top: 1px solid #000;
      padding-top: 5px;
    }
    .materai-box {
      border: 1px solid #000;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
      display: inline-block;
    }
  </style>
</head>
<body>
`

    // Header
    if (data.settings?.satkerNama) {
      html += `
  <div class="header">
    <div class="bold">${data.settings.satkerNama.toUpperCase()}</div>
    <div>REPUBLIK INDONESIA</div>
  </div>
`
    }

    // Title
    if (content.title) {
      html += `  <div class="title center">${content.title}</div>\n`
    }
    if (content.subtitle) {
      html += `  <div class="subtitle center">${content.subtitle}</div>\n`
    }

    // Sections
    content.sections.forEach(section => {
      switch (section.type) {
        case 'header':
          html += `
  <div style="margin: 20px 0;">
    <div>Nomor: ${section.content.nomor}</div>
    <div>Tanggal: ${section.content.tanggal}</div>
  </div>
`
          break

        case 'paragraph':
          const style = section.style || ''
          html += `  <p class="${style}">${section.content}</p>\n`
          break

        case 'center-text':
          html += `  <p class="center">${section.content}</p>\n`
          break

        case 'table':
          html += `  <table class="simple">\n`
          section.content.forEach(row => {
            html += `    <tr>`
            row.forEach((cell, idx) => {
              const width = idx === 1 ? 'width: 20px;' : ''
              html += `<td style="${width}">${cell}</td>`
            })
            html += `</tr>\n`
          })
          html += `  </table>\n`
          break

        case 'signature':
          const sig = section.content
          html += `
  <div class="signature">
    <div>${sig.location}, ${sig.date}</div>
    <div>${sig.position}</div>
`
          if (sig.materai) {
            html += `
    <div class="materai-box">
      Materai<br>Rp 10.000
    </div>
`
          } else {
            html += `    <div style="margin: 60px 0;"></div>\n`
          }
          html += `
    <div class="bold">${sig.name}</div>
    <div>${sig.nip}</div>
  </div>
  <div style="clear: both;"></div>
`
          break

        case 'dual-signature':
          const left = section.content.left
          const right = section.content.right
          html += `
  <div style="margin-top: 50px; display: flex; justify-content: space-between;">
    <div style="width: 45%; text-align: center;">
      <div class="bold">${left.position}</div>
      <div>${left.subPosition}</div>
      <div style="margin: 60px 0;"></div>
      <div class="bold">${left.name}</div>
      <div>${left.nip}</div>
    </div>
    <div style="width: 45%; text-align: center;">
      <div class="bold">${right.position}</div>
      <div>${right.subPosition}</div>
`
          if (right.materai) {
            html += `
      <div class="materai-box" style="margin: 20px auto;">
        Materai<br>Rp 10.000
      </div>
`
          } else {
            html += `      <div style="margin: 60px 0;"></div>\n`
          }
          html += `
      <div class="bold">${right.name}</div>
      <div>${right.nip}</div>
    </div>
  </div>
  <div style="clear: both;"></div>
`
          break
      }
    })

    html += `
  <div class="no-print" style="margin-top: 50px; text-align: center; border-top: 2px dashed #ccc; padding-top: 20px;">
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>
`

    // Create blob and download
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.html`
    a.click()
    URL.revokeObjectURL(url)

    return {
      success: true,
      format: 'html',
      filename: `${filename}.html`,
      content: html
    }
  }

  // ==================== PDF RENDERER ====================

  renderPDF(content, filename, data) {
    const doc = new jsPDF()
    let y = 20

    // Add header if settings present
    if (data.settings?.satkerNama) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(data.settings.satkerNama.toUpperCase(), 105, y, { align: 'center' })
      y += 6
      doc.setFontSize(10)
      doc.text('REPUBLIK INDONESIA', 105, y, { align: 'center' })
      y += 2
      doc.setLineWidth(0.8)
      doc.line(20, y, 190, y)
      y += 8
    }

    // Title
    if (content.title) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(content.title, 105, y, { align: 'center' })
      y += 6
    }

    if (content.subtitle) {
      doc.setFontSize(11)
      doc.text(content.subtitle, 105, y, { align: 'center' })
      y += 10
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    // Render sections
    content.sections.forEach(section => {
      switch (section.type) {
        case 'header':
          doc.text(`Nomor: ${section.content.nomor}`, 20, y)
          y += 5
          doc.text(`Tanggal: ${section.content.tanggal}`, 20, y)
          y += 8
          break

        case 'paragraph':
          if (section.style === 'bold') doc.setFont('helvetica', 'bold')
          if (section.style === 'italic') doc.setFont('helvetica', 'italic')

          const lines = doc.splitTextToSize(section.content, 170)
          doc.text(lines, 20, y)
          y += lines.length * 5 + 5

          doc.setFont('helvetica', 'normal')
          break

        case 'table':
          doc.autoTable({
            startY: y,
            body: section.content,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
              0: { cellWidth: 60 },
              1: { cellWidth: 5 },
              2: { cellWidth: 105, fontStyle: 'bold' }
            }
          })
          y = doc.lastAutoTable.finalY + 8
          break

        case 'signature':
          const sig = section.content
          const sigX = 120
          doc.text(`${sig.location}, ${sig.date}`, sigX, y)
          y += 5
          doc.text(sig.position, sigX, y)
          y += 20
          doc.setFont('helvetica', 'bold')
          doc.text(sig.name, sigX, y)
          y += 4
          doc.setFont('helvetica', 'normal')
          doc.text(sig.nip, sigX, y)
          break
      }
    })

    // Save
    doc.save(`${filename}.pdf`)

    return {
      success: true,
      format: 'pdf',
      filename: `${filename}.pdf`
    }
  }

  // ==================== DOCX RENDERER (Simplified) ====================

  async renderDOCX(content, filename, data) {
    // Simplified DOCX generation
    // For full implementation, use docx library

    const paragraphs = []

    // Title
    if (content.title) {
      paragraphs.push(
        new Paragraph({
          text: content.title,
          alignment: AlignmentType.CENTER,
          bold: true,
          size: 28
        })
      )
    }

    // Add more paragraphs based on content sections
    // ... (implementation details)

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs
      }]
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `${filename}.docx`)

    return {
      success: true,
      format: 'docx',
      filename: `${filename}.docx`
    }
  }

  // ==================== HELPERS ====================

  generateNomorSurat(prefix, data) {
    const bulanRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
    const now = new Date()
    const bulan = bulanRomawi[now.getMonth()]
    const tahun = data.kegiatan?.tahun || now.getFullYear()
    const kodeSatker = data.settings?.kodeSatker || '000000'
    const nomor = data.kontrak?.nomorUrut || '001'

    return `${prefix}/${nomor}/${kodeSatker}/${bulan}/${tahun}`
  }

  // ==================== SPPR GENERATOR ====================

  async generateSPPR(data, format, options) {
    const content = {
      title: 'SURAT PERNYATAAN PERTANGGUNGJAWABAN (SPPR)',
      sections: [
        {
          type: 'header',
          content: {
            nomor: this.generateNomorSurat('SPPR', data),
            tanggal: formatTanggal(new Date(), 'long')
          }
        },
        {
          type: 'paragraph',
          content: 'Yang bertanda tangan di bawah ini:'
        },
        {
          type: 'table',
          content: [
            ['Nama', ':', data.pejabat?.ppk?.nama || '[Nama PPK]'],
            ['NIP', ':', data.pejabat?.ppk?.nip || '[NIP PPK]'],
            ['Jabatan', ':', 'Pejabat Pembuat Komitmen (PPK)'],
            ['Unit Kerja', ':', data.settings?.satkerNama || '[Nama Satker]']
          ]
        },
        {
          type: 'paragraph',
          content: 'Dengan ini menyatakan dengan sebenarnya bahwa:'
        },
        {
          type: 'paragraph',
          content: '1. Pembayaran sebagaimana tersebut dalam Surat Permintaan Pembayaran (SPP) ini adalah benar dan merupakan bagian dari pelaksanaan kegiatan yang telah ditetapkan dalam Dokumen Pelaksanaan Anggaran (DPA).'
        },
        {
          type: 'paragraph',
          content: '2. Barang/jasa yang dibayar telah diterima/diselesaikan dengan lengkap dan sesuai dengan persyaratan yang ditetapkan dalam kontrak.'
        },
        {
          type: 'paragraph',
          content: '3. Segala bukti pengeluaran dan dokumen pendukung telah disimpan dengan baik dan dapat dipertanggungjawabkan.'
        },
        {
          type: 'paragraph',
          content: '4. Apabila dikemudian hari terdapat kelebihan pembayaran, saya bersedia untuk menyetorkan kelebihan tersebut ke Kas Negara.'
        },
        {
          type: 'paragraph',
          content: 'Demikian surat pernyataan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.'
        },
        {
          type: 'signature',
          content: {
            location: data.settings?.kotaSatker || '[Kota]',
            date: formatTanggal(new Date(), 'long'),
            position: 'Pejabat Pembuat Komitmen',
            name: data.pejabat?.ppk?.nama || '[Nama PPK]',
            nip: data.pejabat?.ppk?.nip || '[NIP PPK]'
          }
        }
      ]
    }

    return await this.renderFormat(content, format, 'SPPR', data)
  }

  // ==================== TANDA TERIMA GENERATOR ====================

  async generateTandaTerima(data, format, options) {
    const content = {
      title: 'TANDA TERIMA',
      sections: [
        {
          type: 'paragraph',
          content: 'Yang bertanda tangan di bawah ini:'
        },
        {
          type: 'table',
          content: [
            ['Nama', ':', data.penyedia?.nama || '[Nama Penyedia]'],
            ['NPWP', ':', data.penyedia?.npwp || '[NPWP]'],
            ['Alamat', ':', data.penyedia?.alamat || '[Alamat]'],
            ['Nomor Rekening', ':', `${data.penyedia?.rekening?.nomor || '[Nomor Rekening]'} (${data.penyedia?.rekening?.namaBank || '[Bank]'})`]
          ]
        },
        {
          type: 'paragraph',
          content: 'Telah menerima pembayaran dari:'
        },
        {
          type: 'table',
          content: [
            ['Satuan Kerja', ':', data.settings?.satkerNama || '[Nama Satker]'],
            ['Untuk', ':', data.kegiatan?.nama || '[Nama Kegiatan]'],
            ['Nomor Kontrak', ':', data.kontrak?.nomor || '[Nomor Kontrak]'],
            ['Tanggal Kontrak', ':', formatTanggal(data.kontrak?.tanggal, 'long')]
          ]
        },
        {
          type: 'paragraph',
          content: 'Dengan rincian sebagai berikut:',
          style: 'bold'
        },
        {
          type: 'table',
          content: [
            ['Nilai Kontrak (DPP)', '', formatRupiah(data.perhitungan?.nilaiKontrak || 0)],
            [`PPN ${data.perhitungan?.ppnPersen || 11}%`, '', formatRupiah(data.perhitungan?.nilaiPpn || 0)],
            ['Bruto', '', formatRupiah(data.perhitungan?.bruto || 0)],
            [`PPh ${data.perhitungan?.pphPersen || 2}%`, '', `(${formatRupiah(data.perhitungan?.nilaiPph || 0)})`],
            ['Jumlah Diterima (Netto)', '', formatRupiah(data.perhitungan?.netto || 0)]
          ]
        },
        {
          type: 'paragraph',
          content: `Terbilang: ${terbilangRupiah(data.perhitungan?.netto || 0)}`,
          style: 'italic'
        },
        {
          type: 'paragraph',
          content: 'Demikian tanda terima ini dibuat untuk dapat dipergunakan sebagaimana mestinya.'
        },
        {
          type: 'signature',
          content: {
            location: data.settings?.kotaSatker || '[Kota]',
            date: formatTanggal(new Date(), 'long'),
            position: 'Yang Menerima',
            name: data.penyedia?.nama || '[Nama Penyedia]',
            nip: `NPWP: ${data.penyedia?.npwp || '[NPWP]'}`,
            materai: true
          }
        }
      ]
    }

    return await this.renderFormat(content, format, 'TandaTerima', data)
  }

  // ==================== BAST GENERATOR ====================

  async generateBAST(data, format, options) {
    const content = {
      title: 'BERITA ACARA SERAH TERIMA',
      subtitle: 'PEKERJAAN ' + (data.kegiatan?.nama || '').toUpperCase(),
      sections: [
        {
          type: 'header',
          content: {
            nomor: this.generateNomorSurat('BAST', data),
            tanggal: formatTanggal(new Date(), 'long')
          }
        },
        {
          type: 'paragraph',
          content: 'Pada hari ini, ' + formatTanggal(new Date(), 'full') + ', kami yang bertanda tangan di bawah ini:'
        },
        {
          type: 'paragraph',
          content: 'PIHAK PERTAMA (Pejabat Penerima Hasil Pekerjaan):',
          style: 'bold'
        },
        {
          type: 'table',
          content: [
            ['Nama', ':', data.pejabat?.ppk?.nama || '[Nama PPK]'],
            ['NIP', ':', data.pejabat?.ppk?.nip || '[NIP PPK]'],
            ['Jabatan', ':', 'Pejabat Pembuat Komitmen (PPK)'],
            ['Unit Kerja', ':', data.settings?.satkerNama || '[Nama Satker]']
          ]
        },
        {
          type: 'paragraph',
          content: 'PIHAK KEDUA (Penyedia Barang/Jasa):',
          style: 'bold'
        },
        {
          type: 'table',
          content: [
            ['Nama', ':', data.penyedia?.nama || '[Nama Penyedia]'],
            ['NPWP', ':', data.penyedia?.npwp || '[NPWP]'],
            ['Alamat', ':', data.penyedia?.alamat || '[Alamat]']
          ]
        },
        {
          type: 'paragraph',
          content: 'Dengan ini PIHAK PERTAMA menyatakan bahwa:'
        },
        {
          type: 'paragraph',
          content: '1. PIHAK KEDUA telah menyelesaikan pekerjaan sebagaimana dimaksud dalam:'
        },
        {
          type: 'table',
          content: [
            ['Nomor Kontrak', ':', data.kontrak?.nomor || '[Nomor Kontrak]'],
            ['Tanggal', ':', formatTanggal(data.kontrak?.tanggal, 'long')],
            ['Pekerjaan', ':', data.kegiatan?.nama || '[Nama Kegiatan]'],
            ['Nilai Kontrak', ':', formatRupiah(data.kontrak?.nilai || 0)]
          ]
        },
        {
          type: 'paragraph',
          content: '2. Barang/jasa yang diserahkan telah sesuai dengan spesifikasi teknis yang dipersyaratkan dalam kontrak.'
        },
        {
          type: 'paragraph',
          content: '3. Barang/jasa yang diserahkan dalam kondisi baik dan dapat berfungsi sebagaimana mestinya.'
        },
        {
          type: 'paragraph',
          content: '4. Dengan diterimanya hasil pekerjaan ini, maka PIHAK KEDUA berhak menerima pembayaran sesuai dengan ketentuan dalam kontrak.'
        },
        {
          type: 'paragraph',
          content: 'Demikian Berita Acara ini dibuat dalam rangkap 3 (tiga) untuk dipergunakan sebagaimana mestinya.'
        },
        {
          type: 'dual-signature',
          content: {
            left: {
              position: 'PIHAK PERTAMA',
              subPosition: 'Pejabat Pembuat Komitmen',
              name: data.pejabat?.ppk?.nama || '[Nama PPK]',
              nip: data.pejabat?.ppk?.nip || '[NIP PPK]'
            },
            right: {
              position: 'PIHAK KEDUA',
              subPosition: 'Penyedia Barang/Jasa',
              name: data.penyedia?.nama || '[Nama Penyedia]',
              nip: `NPWP: ${data.penyedia?.npwp || '[NPWP]'}`,
              materai: true
            }
          }
        }
      ]
    }

    return await this.renderFormat(content, format, 'BAST', data)
  }
}

// Export singleton
export default new DocumentGenerationEngine()
