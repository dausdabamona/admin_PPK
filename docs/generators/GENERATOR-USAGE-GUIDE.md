# GENERATOR USAGE GUIDE
## Admin PPK - Document Generation System

---

## 📋 Overview

Sistem generator Admin PPK menyediakan layanan otomatis untuk menghasilkan dokumen-dokumen resmi KKP sesuai format yang telah disetujui, terintegrasi dengan FASE 4.5 (Multi-Year Management) dan SSOT (Single Source of Truth).

**Available Generators**:
1. **SPRGenerator** - Surat Pendebitan Rekening
2. **KuitansiPerdinGenerator** - Perjalanan Dinas (3 dokumen: UM, Rampung, Rincian)
3. **SPJPackageGenerator** - Complete SPJ Package Bundler

---

## 🚀 Quick Start

### 1. SPRGenerator - Basic Usage

```javascript
import sprGenerator from './services/generators/SPRGenerator.js'

const masterData = {
  // Satker info
  satkerNama: 'Balai Penelitian Perikanan Laut',
  satkerKode: '413010',
  kotaSatker: 'Jakarta',

  // PPK info
  ppkNama: 'Dr. Ahmad Yani, S.Pi, M.Si',
  ppkNip: '197001011990031001',

  // Bank info
  namaBank: 'Bank BRI',
  cabangBank: 'Jakarta Sudirman',
  nomorRekening: '0123456789',
  namaRekening: 'Bendahara Pengeluaran',

  // Payment info
  nilaiTagihan: 50000000, // Rp 50 juta
  kegiatanNama: 'Pembayaran Honorarium Workshop Perikanan',

  // Bendahara info
  bendaharaNama: 'Siti Aminah, S.E',
  bendaharaNip: '198001012000032001'
}

// Generate SPR
const sprDocument = await sprGenerator.generate(masterData)

// Access HTML
console.log(sprDocument.html) // HTML content
console.log(sprDocument.title) // "Surat Pendebitan Rekening - SPR-001/413010/I/2026"

// Save to file
await sprGenerator.save(sprDocument, '/output/SPR-001.html')
```

---

### 2. KuitansiPerdinGenerator - Complete Package

**Auto-Generate ALL 3 Documents (Uang Muka + Rincian + Rampung)**

```javascript
import kuitansiPerdinGenerator from './services/generators/KuitansiPerdinGenerator.js'

const perdinMasterData = {
  // Satker info
  satkerNama: 'Balai Penelitian Perikanan Laut',
  satkerKode: '413010',
  kotaSatker: 'Jakarta',

  // Pegawai info
  namaPegawai: 'Dr. Budi Santoso, S.Pi, M.Si',
  nipPegawai: '197505051999031002',
  jabatanPegawai: 'Peneliti Madya',
  golongan: 'III', // For tarif calculation

  // Perjalanan info
  tujuan: 'Makassar',
  tanggalBerangkat: '2026-02-15',
  tanggalKembali: '2026-02-18',
  nomorSuratTugas: 'ST-001/BRL/II/2026',
  tanggalSuratTugas: '2026-02-10',

  // Pejabat
  ppkNama: 'Dr. Ahmad Yani, S.Pi, M.Si',
  ppkNip: '197001011990031001',
  bendaharaNama: 'Siti Aminah, S.E',
  bendaharaNip: '198001012000032001',

  // Auto-calculate will fill these:
  // - uangMuka (80% of estimated total)
  // - totalBiayaRiil (actual expenses)
  // - rincianBiaya (breakdown)
}

// Generate COMPLETE package (1 click!)
const perdinPackage = await kuitansiPerdinGenerator.generateComplete(perdinMasterData)

console.log(perdinPackage.documents.uangMuka.html)     // Kuitansi UM HTML
console.log(perdinPackage.documents.rincian.html)      // Rincian Biaya HTML
console.log(perdinPackage.documents.rampung.html)      // Kuitansi Rampung HTML

// Save all 3 documents
await kuitansiPerdinGenerator.save(perdinPackage.documents.uangMuka, '/output/kuitansi-um.html')
await kuitansiPerdinGenerator.save(perdinPackage.documents.rincian, '/output/rincian-biaya.html')
await kuitansiPerdinGenerator.save(perdinPackage.documents.rampung, '/output/kuitansi-rampung.html')
```

**Or Generate Individual Documents**

```javascript
// Generate only Uang Muka
const uangMukaDoc = await kuitansiPerdinGenerator.generateUangMuka(perdinMasterData)

// Generate only Rincian
const rincianDoc = await kuitansiPerdinGenerator.generateRincian(perdinMasterData)

// Generate only Rampung (with settlement calculation)
const rampungDoc = await kuitansiPerdinGenerator.generateRampung({
  ...perdinMasterData,
  totalBiayaRiil: 8500000,  // Actual expenses
  uangMuka: 7200000          // Advance payment received
  // Settlement: Rp 1.300.000 (to be paid to employee)
})
```

---

### 3. SPJPackageGenerator - Complete SPJ Bundle

**Bundle ALL documents into one SPJ Package**

```javascript
import spjPackageGenerator from './services/generators/SPJPackageGenerator.js'
import sprGenerator from './services/generators/SPRGenerator.js'
import kuitansiPerdinGenerator from './services/generators/KuitansiPerdinGenerator.js'

// Step 1: Generate individual documents
const spr = await sprGenerator.generate(sprMasterData)
const perdinDocs = await kuitansiPerdinGenerator.generateComplete(perdinMasterData)

// Step 2: Prepare master data for SPJ package
const spjMasterData = {
  // Kegiatan info
  namaKegiatan: 'Workshop Perikanan Berkelanjutan 2026',
  namaOutput: 'Laporan Hasil Workshop',
  kodeKegiatan: 'WP-2026-001',

  // Satker & pejabat (same as above)
  satkerNama: 'Balai Penelitian Perikanan Laut',
  satkerKode: '413010',
  ppkNama: 'Dr. Ahmad Yani, S.Pi, M.Si',
  ppkNip: '197001011990031001',
  kpaNama: 'Prof. Dr. Ir. Subagyo, M.Sc',
  kpaNip: '196505051988031001',
  bendaharaNama: 'Siti Aminah, S.E',
  bendaharaNip: '198001012000032001',

  // Financial info
  sumberDana: 'APBN',
  jenisPembayaran: 'UP',
  nilaiTotal: 58500000 // Will be calculated from documents if not provided
}

// Step 3: Generate complete SPJ package
const documents = [
  spr,
  perdinDocs.documents.uangMuka,
  perdinDocs.documents.rincian,
  perdinDocs.documents.rampung
]

const spjPackage = await spjPackageGenerator.generate(spjMasterData, documents, {
  includeCover: true,          // Include cover page
  includePengesahan: true,     // Include approval sheet
  includeDaftarIsi: true,      // Include table of contents
  includeKronologi: true,      // Include timeline
  format: 'bundle'             // 'bundle' | 'zip' | 'pdf'
})

console.log(`SPJ Package: ${spjPackage.documents.length} documents`)
// Output: SPJ Package: 8 documents
// 1. Cover
// 2. Lembar Pengesahan
// 3. Daftar Isi
// 4. Kronologi Administratif
// 5. SPR
// 6. Kuitansi UM Perdin
// 7. Rincian Biaya Perdin
// 8. Kuitansi Rampung Perdin

// Save package to directory
await spjPackageGenerator.save(spjPackage, '/output/spj-package', { format: 'directory' })
```

---

## 🎯 Advanced Features

### FASE 4.5 Integration - Multi-Year & Reconstruction

```javascript
import fiscalYearContext from './services/fiscal/FiscalYearContext.js'

// Switch to previous year for reconstruction
await fiscalYearContext.switchYear(2023)
fiscalYearContext.setMode('RECONSTRUCTION')

// Generate document - auto-includes watermark
const reconstructedSPR = await sprGenerator.generate(masterData, {
  tahunAnggaran: 2023,
  isReconstruction: true
})

// Result: Document dengan watermark "REKONSTRUKSI ADMINISTRASI TA 2023"
```

### Custom Tarif Calculation

```javascript
// Override auto-calculated tarif with custom values
const customPerdinData = {
  ...perdinMasterData,
  rincianBiaya: {
    tarifHarian: 570000,          // Custom daily allowance
    totalHarian: 2280000,         // 4 days x 570k
    tarifTransportBerangkat: 1500000,
    totalTransportBerangkat: 1500000,
    tarifTransportKembali: 1500000,
    totalTransportKembali: 1500000,
    tarifPenginapan: 750000,      // Custom hotel rate
    totalPenginapan: 2250000,     // 3 nights x 750k
    totalBiayaLain: 200000        // Misc expenses
  }
}

const customPerdin = await kuitansiPerdinGenerator.generateComplete(customPerdinData)
// Total: Rp 7.730.000
```

### Settlement Calculation (Rampung)

```javascript
// Case 1: Employee needs additional payment
const needsPayment = await kuitansiPerdinGenerator.generateRampung({
  ...perdinMasterData,
  totalBiayaRiil: 8500000,  // Actual expenses
  uangMuka: 7200000          // Advance received
})
// Settlement: Rp 1.300.000 (employee receives)

// Case 2: Employee must return excess
const needsReturn = await kuitansiPerdinGenerator.generateRampung({
  ...perdinMasterData,
  totalBiayaRiil: 6800000,  // Actual expenses
  uangMuka: 7200000          // Advance received
})
// Settlement: -Rp 400.000 (employee must return to treasury)
// Document includes warning box: "KELEBIHAN UANG MUKA: Rp 400.000 (Disetor kembali ke Kas Negara)"
```

### Auto-Numbering

```javascript
// Auto-generate document numbers with sequence
const sprWithSequence = await sprGenerator.generate({
  ...masterData,
  sequence: '042', // Custom sequence number
  satkerKode: '413010'
})
// Result: SPR-042/413010/II/2026

// Let generator auto-increment from database
const sprAutoNumber = await sprGenerator.generate({
  ...masterData,
  // sequence will be fetched from database or default to '001'
})
```

---

## 📊 Tarif Reference (Perjalanan Dinas)

Generator automatically calculates tarif based on:
- **Golongan**: I, II, III, IV
- **Tujuan**: dalam_kota, luar_kota, luar_negeri
- **Durasi**: jumlah hari & malam
- **Transport**: dalam_kota, luar_kota_provinsi, antar_provinsi, pesawat

**Default Tarif (based on PMK SBM)**:

| Golongan | Uang Harian Luar Kota | Transport Antar Provinsi | Penginapan (Hotel ⭐⭐⭐) |
|----------|----------------------|--------------------------|------------------------|
| I        | Rp 390.000          | Rp 1.200.000            | Rp 550.000            |
| II       | Rp 410.000          | Rp 1.200.000            | Rp 550.000            |
| III      | Rp 470.000          | Rp 1.200.000            | Rp 550.000            |
| IV       | Rp 570.000          | Rp 1.200.000            | Rp 750.000            |

---

## 🔧 Validation & Error Handling

Generators automatically validate required fields:

```javascript
try {
  const doc = await sprGenerator.generate({
    // Missing required fields
  })
} catch (error) {
  console.error(error.message)
  // "SPR validation failed. Missing required fields: nama_ppk, nip_ppk, nama_bank, ..."
}
```

**Required Fields by Generator**:

**SPRGenerator**:
- `nama_ppk`, `nip_ppk`
- `nama_bank`, `nomor_rekening`, `nama_rekening`
- `jumlah_angka`
- `nama_bendahara`, `nip_bendahara`

**KuitansiPerdinGenerator (Uang Muka)**:
- `nama_pegawai`, `nip_pegawai`, `jabatan_pegawai`
- `tujuan`, `tanggal_berangkat`, `tanggal_kembali`
- `nomor_surat_tugas`, `tanggal_surat_tugas`
- `jumlah_uang_muka`, `kode_akun`
- `nama_ppk`, `nip_ppk`
- `nama_bendahara`, `nip_bendahara`

**SPJPackageGenerator**:
- `nama_kegiatan`, `nama_satker`
- `nama_ppk`, `nip_ppk`
- `nama_kpa`, `nip_kpa`
- `nama_bendahara`, `nip_bendahara`

---

## 📄 Output Formats

All generators support:
- ✅ **HTML** - Ready for browser preview
- ✅ **Save to File** - HTML files
- 🚧 **PDF** - Via Puppeteer (planned)
- 🚧 **ZIP Bundle** - Multiple documents (planned)

```javascript
// HTML output
const doc = await generator.generate(masterData)
console.log(doc.html) // HTML string

// Save to file
await generator.save(doc, '/path/to/output.html')

// PDF export (planned)
const pdfDoc = await generator.generate(masterData, { format: 'pdf' })
```

---

## 🎨 Customization

### Custom Templates

Create custom templates following Handlebars syntax:

```html
<!-- In template -->
<div>Nama: {{nama_pegawai}}</div>
<div>Total: Rp {{jumlah_angka}}</div>

{{#if isReconstruction}}
  <div class="watermark">REKONSTRUKSI TA {{tahunAnggaran}}</div>
{{/if}}
```

### Custom Helpers

Register custom Handlebars helpers:

```javascript
Handlebars.registerHelper('uppercase', (str) => {
  return str.toUpperCase()
})

// In template: {{uppercase nama_pegawai}}
```

---

## 🧪 Testing

```javascript
import { describe, it, expect } from 'vitest'
import sprGenerator from './services/generators/SPRGenerator.js'

describe('SPRGenerator', () => {
  it('should generate SPR with valid data', async () => {
    const doc = await sprGenerator.generate(validMasterData)

    expect(doc.type).toBe('SPR')
    expect(doc.html).toContain('SURAT PENDEBITAN REKENING')
    expect(doc.html).toContain(validMasterData.ppkNama)
    expect(doc.html).toContain('Rp 50.000.000')
  })

  it('should throw error with missing fields', async () => {
    await expect(sprGenerator.generate({}))
      .rejects.toThrow('Missing required fields')
  })
})
```

---

## 📚 Related Documentation

- [Document Templates Index](../templates/DOCUMENT-TEMPLATES-INDEX.md)
- [FASE 4.5 Multi-Year Architecture](../FASE-4.5-Multi-Year-Architecture.md)
- [Workflow Engine Integration](../WORKFLOW-ENGINE.md)
- [SPJ Package Guide](../SPJ-PACKAGE-GUIDE.md)

---

## ✅ Checklist for Production Use

Before deploying generators to production:

- [ ] Load test with 1000+ documents
- [ ] Validate all required fields
- [ ] Test watermark rendering for reconstruction
- [ ] Test fiscal year switching
- [ ] Verify PDF export quality
- [ ] Test Indonesian formatting (currency, dates, terbilang)
- [ ] Verify materai indicators
- [ ] Test signature layouts (2-party, 3-party)
- [ ] Validate against BPK audit requirements
- [ ] Test integration with SAKTI (for non-SAKTI documents only)

---

**Last Updated**: January 2026
**Author**: Admin PPK Development Team
**Version**: 1.0.0
