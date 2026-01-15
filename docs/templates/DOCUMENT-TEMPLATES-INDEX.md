# DOCUMENT TEMPLATES INDEX
## Admin PPK - Kementerian Kelautan dan Perikanan

---

## 📋 Overview

Sistem document generation Admin PPK menyediakan template-template resmi sesuai format
Kementerian Kelautan dan Perikanan untuk keperluan pertanggungjawaban keuangan (SPJ).

Semua template:
- ✅ Format resmi KKP dengan kop satker lengkap
- ✅ Siap cetak A4 (print-ready)
- ✅ Mendukung tanda tangan elektronik (TTE)
- ✅ Audit-ready sesuai standar BPK
- ✅ Auto-watermark untuk rekonstruksi (FASE 4.5)
- ✅ Integrasi fiscal year context

---

## 📄 Document Templates

### 1. SPR (Surat Pendebitan Rekening)

**File**: `src/templates/documents/SPR.template.html`

**Purpose**: Surat perintah dari PPK kepada Bendahara untuk melakukan pendebitan rekening melalui teller bank.

**Key Fields**:
- `nomor_spr` - Nomor surat pendebitan
- `nama_ppk`, `nip_ppk`, `jabatan_ppk` - Data PPK
- `nama_bank`, `cabang_bank`, `nomor_rekening`, `nama_rekening` - Data rekening
- `jumlah_angka`, `jumlah_terbilang` - Nilai pembayaran
- `uraian_keperluan` - Keperluan pembayaran
- `hari_tanggal_pelaksanaan` - Waktu pelaksanaan

**Tanda Tangan**:
- PPK (kanan)
- Bendahara Pengeluaran (kiri)

**Generator**: `SPRGenerator.js`

---

### 2. SPPR (Surat Perintah Pendebitan Rekening)

**File**: `src/templates/documents/SPPR.template.html`

**Purpose**: Surat perintah pendebitan rekening menggunakan Kartu Debit Pemerintah atau transfer bank, dengan dasar pembayaran SPBy.

**Key Fields**:
- Semua field dari SPR
- `nomor_spby`, `tanggal_spby` - Dasar pembayaran (Surat Perintah Bayar)

**Difference from SPR**:
- SPPR memiliki field "Dasar Pembayaran" yang merujuk ke SPBy
- Metode: Kartu Debit Pemerintah / transfer bank

**Tanda Tangan**:
- PPK (kanan)
- Bendahara Pengeluaran (kiri)

---

### 3. Berita Acara Pembayaran

**File**: `src/templates/documents/BeritaAcaraPembayaran.template.html`

**Purpose**: Berita acara yang menyatakan bahwa pembayaran telah dilaksanakan antara PPK dan penyedia barang/jasa.

**Key Fields**:
- `nomor_ba_pembayaran` - Nomor berita acara
- `hari`, `tanggal`, `kota` - Waktu dan tempat
- `nama_ppk`, `nip_ppk` - Data PPK
- `nama_penyedia`, `jabatan_penyedia`, `alamat_penyedia` - Data penyedia
- `nama_kegiatan`, `nomor_kontrak`, `tanggal_kontrak` - Data kontrak
- `nilai_kontrak`, `nilai_dibayar` - Nilai pembayaran
- `termin_pembayaran` - Termin (1st, 2nd, final, dst)

**Tanda Tangan**:
- Pihak Kedua / Penerima Pembayaran (kiri)
- Pihak Pertama / PPK (kanan)
- Bendahara Pengeluaran (tengah bawah)

---

### 4. Paket SPJ - Cover

**File**: `src/templates/documents/SPJPackageCover.template.html`

**Purpose**: Sampul depan paket pertanggungjawaban keuangan lengkap.

**Key Fields**:
- `tahun_anggaran` - Tahun anggaran
- `nama_kegiatan`, `nama_output`, `kode_kegiatan` - Data kegiatan
- `sumber_dana`, `jenis_pembayaran` - Jenis dan sumber
- `nilai_total`, `nilai_terbilang` - Nilai paket
- `nama_ppk`, `nip_ppk`, `nama_kpa`, `nip_kpa` - Data pejabat

**Design**: Full-page cover dengan logo KKP besar di tengah

---

### 5. Paket SPJ - Lembar Pengesahan

**File**: `src/templates/documents/SPJPackagePengesahan.template.html`

**Purpose**: Lembar pengesahan resmi yang menyatakan bahwa seluruh dokumen dalam paket SPJ telah diperiksa dan dipertanggungjawabkan.

**Key Fields**:
- `nama_kegiatan`, `nama_satker` - Identitas
- `jenis_pembayaran`, `nilai_total` - Detail pembayaran

**Tanda Tangan**:
- PPK (kiri)
- KPA (kanan)
- Bendahara Pengeluaran (tengah bawah)

**Legal Weight**: Dokumen ini mengikat secara hukum sebagai pernyataan kebenaran administrasi

---

## 🚀 Template Usage

### Basic Generation

```javascript
import sprGenerator from './services/generators/SPRGenerator.js'

const masterData = {
  ppkNama: 'Dr. John Doe',
  ppkNip: '197001011990031001',
  namaBank: 'Bank BRI',
  nomorRekening: '1234567890',
  namaRekening: 'Bendahara Pengeluaran',
  nilaiTagihan: 50000000,
  kegiatanNama: 'Pembayaran Honorarium Workshop',
  bendaharaNama: 'Jane Doe',
  bendaharaNip: '198001012000032001'
}

// Generate HTML
const document = await sprGenerator.generate(masterData)
console.log(document.html)

// Generate PDF
const pdfDoc = await sprGenerator.generate(masterData, { format: 'pdf' })

// Save to file
await sprGenerator.save(document, '/output/SPR-001.html')
```

### With Fiscal Year Context (FASE 4.5)

```javascript
import fiscalYearContext from './services/fiscal/FiscalYearContext.js'
import sprGenerator from './services/generators/SPRGenerator.js'

// Switch to previous year for reconstruction
await fiscalYearContext.switchYear(2023)
fiscalYearContext.setMode('RECONSTRUCTION')

// Generate document - automatically includes watermark
const document = await sprGenerator.generate(masterData)
// Result: Document dengan watermark "REKONSTRUKSI ADMINISTRASI TA 2023"
```

### Generate Complete SPJ Package

```javascript
import spjPackageGenerator from './services/generators/SPJPackageGenerator.js'

const package = await spjPackageGenerator.generateComplete(masterData, {
  includeCover: true,
  includePengesahan: true,
  includeDaftarIsi: true,
  includeKronologi: true,
  format: 'pdf'  // or 'zip' for multi-file
})

// Result: Complete SPJ package with:
// - Cover
// - Lembar Pengesahan
// - Daftar Isi
// - SPR
// - SPPR
// - Berita Acara Pembayaran
// - etc.
```

---

## 🔧 Template Customization

### Adding Custom Fields

All templates use Handlebars syntax for variable substitution:

```html
<!-- In template -->
{{custom_field_name}}

<!-- In data -->
{
  custom_field_name: 'Custom Value'
}
```

### Conditional Rendering

```html
<!-- Only show if condition is true -->
{{#if isReconstruction}}
  <div class="watermark">REKONSTRUKSI</div>
{{/if}}

<!-- Show different content based on condition -->
{{#if isPaid}}
  <span>LUNAS</span>
{{else}}
  <span>BELUM LUNAS</span>
{{/if}}
```

### Loops

```html
<!-- Iterate over array -->
{{#each documents}}
  <li>{{this.name}} - {{this.type}}</li>
{{/each}}
```

---

## 📐 Design Guidelines

### Typography

- **Font**: Times New Roman
- **Body**: 12pt
- **Headings**: 14-16pt
- **Line Height**: 1.5-1.6

### Layout

- **Page Size**: A4 (210mm x 297mm)
- **Margins**: 2.5cm all sides
- **Kop Logo Height**: 80px
- **Signature Space**: 80px

### Colors

- **Text**: #000 (pure black)
- **Borders**: #000 (3px solid for kop line)
- **Watermark**: rgba(255, 0, 0, 0.15) - Red at 15% opacity

### Spacing

- **Section Spacing**: 20-30px
- **Signature Top Margin**: 50-60px
- **Kop Bottom Margin**: 20px

---

## 🎯 Best Practices

### 1. Data Validation

Always validate required fields before generation:

```javascript
const requiredFields = ['nama_ppk', 'nip_ppk', 'nama_bank', 'nomor_rekening']
const missingFields = requiredFields.filter(field => !data[field])

if (missingFields.length > 0) {
  throw new Error(`Missing fields: ${missingFields.join(', ')}`)
}
```

### 2. Number Formatting

Always use proper Indonesian number formatting:

```javascript
// Currency
const formatted = new Intl.NumberFormat('id-ID').format(50000000)
// "50.000.000"

// Terbilang
const terbilang = numberToWords(50000000)
// "Lima Puluh Juta Rupiah"
```

### 3. Date Formatting

Use Indonesian date format:

```javascript
// Full: "Senin, 15 Januari 2024"
formatHariTanggal(new Date())

// Short: "15 Januari 2024"
formatTanggalSurat(new Date())
```

### 4. Watermark for Reconstruction

Always include watermark for reconstructed documents:

```javascript
if (fiscalYearContext.isReconstructionMode()) {
  data.isReconstruction = true
  data.tahunAnggaran = fiscalYearContext.getActiveYear()
  data.reconstructionDate = formatTanggalSurat(new Date())
}
```

---

## 📦 File Structure

```
src/
├── templates/
│   └── documents/
│       ├── SPR.template.html
│       ├── SPPR.template.html
│       ├── BeritaAcaraPembayaran.template.html
│       ├── SPJPackageCover.template.html
│       ├── SPJPackagePengesahan.template.html
│       ├── PPHP.template.html (planned)
│       ├── BAST.template.html (planned)
│       └── Kuitansi.template.html (planned)
├── services/
│   └── generators/
│       ├── SPRGenerator.js
│       ├── SPPRGenerator.js (planned)
│       ├── BeritaAcaraGenerator.js (planned)
│       └── SPJPackageGenerator.js (planned)
└── hooks/
    └── useFiscalYear.js (FASE 4.5 integration)
```

---

## 🔍 Template Testing

### Manual Testing

1. Load template in browser
2. Check responsive layout
3. Verify print preview (Ctrl+P)
4. Test with sample data
5. Verify watermark rendering (for reconstruction)

### Automated Testing

```javascript
describe('SPR Template', () => {
  it('should render all required fields', async () => {
    const document = await sprGenerator.generate(testData)
    expect(document.html).toContain(testData.nama_ppk)
    expect(document.html).toContain(testData.nip_ppk)
    // ... more assertions
  })

  it('should include watermark for reconstruction', async () => {
    fiscalYearContext.setMode('RECONSTRUCTION')
    const document = await sprGenerator.generate(testData)
    expect(document.html).toContain('REKONSTRUKSI ADMINISTRASI')
  })
})
```

---

## 📚 Related Documentation

- [Document Generation Architecture](../DOCUMENT-GENERATION.md)
- [FASE 4.5 Multi-Year Architecture](../FASE-4.5-Multi-Year-Architecture.md)
- [SPJ Package Guide](../SPJ-PACKAGE-GUIDE.md)

---

## ✅ Template Completion Status

### Implemented ✅ (9 templates)
- [x] SPR (Surat Pendebitan Rekening)
- [x] SPPR (Surat Perintah Pendebitan Rekening)
- [x] Berita Acara Pembayaran
- [x] PPHP (Pemeriksaan Hasil Pekerjaan) ⭐ NEW
- [x] BAST (Berita Acara Serah Terima) ⭐ NEW
- [x] Tanda Terima UP/TUP ⭐ NEW
- [x] RPD (Rencana Penarikan Dana) Bulanan ⭐ NEW
- [x] SPJ Package Cover
- [x] SPJ Package Lembar Pengesahan

### In Progress 🚧
- [ ] Template Registry System (index.js) ⭐ NEW - Implemented but needs documentation

### Planned 📋 (5 templates)
- [ ] Kuitansi
- [ ] SPBy (Surat Perintah Bayar)
- [ ] SPTJB (Surat Pernyataan Tanggung Jawab Belanja)
- [ ] SSP (Bukti Setor Pajak)
- [ ] Daftar Isi Otomatis (auto-generated)
- [ ] Kronologi Administratif (auto-generated)

---

**Last Updated**: January 2024
**Author**: Admin PPK Development Team
**Version**: 1.0.0
