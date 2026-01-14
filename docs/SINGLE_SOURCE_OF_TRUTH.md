# SINGLE SOURCE OF TRUTH (SSOT) - Admin PPK
## Arsitektur Master Data untuk Asisten Digital PPK

**Version:** 1.0.0
**Last Updated:** 2024-01-14
**Author:** Senior Software Architect

---

## 📋 Table of Contents

1. [Konsep SSOT](#konsep-ssot)
2. [Masalah Yang Diselesaikan](#masalah-yang-diselesaikan)
3. [Arsitektur Master Data](#arsitektur-master-data)
4. [File Structure](#file-structure)
5. [Master Data Schema](#master-data-schema)
6. [Field Mapping](#field-mapping)
7. [Form Wizard Implementation](#form-wizard-implementation)
8. [Auto-Generate Fields](#auto-generate-fields)
9. [Validation Rules](#validation-rules)
10. [Integration dengan Document Generator](#integration-document-generator)
11. [Database Implementation](#database-implementation)
12. [Testing](#testing)
13. [Best Practices](#best-practices)

---

## 🎯 Konsep SSOT

### Definisi

**Single Source of Truth (SSOT)** adalah prinsip arsitektur dimana:

> **"Setiap data hanya diinput SATU KALI, disimpan di SATU TEMPAT, dan digunakan oleh SEMUA dokumen tanpa duplikasi."**

### Manfaat Utama

✅ **Konsistensi Data Terjamin**
- Nama pejabat, nilai anggaran, tanggal - SELALU SAMA di semua dokumen
- Tidak ada risiko typo berbeda antara dokumen satu dengan lainnya
- Satu perubahan langsung update ke semua dokumen

✅ **Efisiensi Waktu**
- PPK input data 1x → Generate 10+ dokumen
- Tidak perlu copy-paste antar dokumen
- Tidak perlu ketik ulang nama/NIP/nilai berkali-kali

✅ **Siap Audit**
- Audit trail lengkap dengan history perubahan
- Traceability: setiap field bisa dilacak kapan diisi, oleh siapa
- Data terstruktur, mudah untuk generate laporan

✅ **Mengurangi Error**
- Validasi 1x di awal → semua dokumen otomatis valid
- Auto-calculate (terbilang, durasi, potongan pajak)
- Warning jika data inconsistent

---

## 🔍 Masalah Yang Diselesaikan

### ❌ BEFORE (Tanpa SSOT)

**Workflow Lama:**
1. PPK buat SPR → isi manual semua data (nama, nilai, dll)
2. PPK buat SPPR → isi manual lagi (copy dari SPR)
3. PPK buat BAST → isi manual lagi (copy dari SPPR)
4. PPK buat Kuitansi → isi manual lagi
5. PPK buat Nominatif → isi manual lagi
6. ... 10+ dokumen, semuanya manual entry

**Masalah:**
- ⚠️ Nama PPK di SPR: "Budi Santoso"
- ⚠️ Nama PPK di BAST: "Budhi Santoso" (typo!)
- ⚠️ Nilai di SPR: 45.000.000
- ⚠️ Nilai di Kuitansi: 45.500.000 (salah!)
- ⏱️ Butuh waktu 2-3 jam untuk 1 paket SPJ
- 😓 PPK capek input data berulang-ulang

### ✅ AFTER (Dengan SSOT)

**Workflow Baru:**
1. PPK isi **Master Data Wizard** (1x input, ~20 menit)
2. Klik "Generate SPR" → Auto-fill semua data
3. Klik "Generate SPPR" → Auto-fill dari master
4. Klik "Generate BAST" → Auto-fill dari master
5. Klik "Generate Semua Dokumen" → 10+ dokumen siap dalam 1 menit

**Keunggulan:**
- ✅ Semua dokumen DIJAMIN konsisten (data sama persis)
- ✅ Butuh waktu 20 menit untuk 1 paket SPJ lengkap
- ✅ PPK fokus ke konten, bukan data entry
- ✅ Audit trail otomatis
- ✅ Perubahan data (mis. revisi nilai) → update semua dokumen sekali klik

---

## 🏗️ Arsitektur Master Data

### Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    MASTER DATA KEGIATAN                     │
│                  (Single Source of Truth)                   │
│─────────────────────────────────────────────────────────────│
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   SATKER     │  │   PEJABAT    │  │   KEGIATAN   │    │
│  │─────────────│  │─────────────│  │─────────────│    │
│  │ • Kode       │  │ • KPA        │  │ • Program    │    │
│  │ • Nama       │  │ • PPK        │  │ • Kegiatan   │    │
│  │ • Alamat     │  │ • Bendahara  │  │ • Output     │    │
│  │ • Kontak     │  │ • PPHP       │  │ • MAK        │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   ANGGARAN   │  │   PENYEDIA   │  │   DOKUMEN    │    │
│  │─────────────│  │─────────────│  │─────────────│    │
│  │ • Pagu       │  │ • Nama       │  │ • Nomor      │    │
│  │ • Kontrak    │  │ • Alamat     │  │ • Tanggal    │    │
│  │ • Dibayar    │  │ • NPWP       │  │ • Metadata   │    │
│  │ • Potongan   │  │ • Rekening   │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ PULL DATA (Auto-fill)
                             ▼
    ┌────────────────────────────────────────────────────────┐
    │                 DOCUMENT GENERATORS                    │
    └────────────────────────────────────────────────────────┘
         │         │         │         │         │
         ▼         ▼         ▼         ▼         ▼
      ┌───┐    ┌────┐    ┌────┐    ┌───┐    ┌────┐
      │SPR│    │SPPR│    │BAST│    │BAP│    │RPD │
      └───┘    └────┘    └────┘    └───┘    └────┘
         │         │         │         │         │
         ▼         ▼         ▼         ▼         ▼
      ┌──────────────────────────────────────────┐
      │       KUITANSI, NOMINATIF, COVER, dll    │
      └──────────────────────────────────────────┘
```

### Prinsip Desain

1. **One Source, Many Consumers**
   - Master Data = Source (1 tempat)
   - Dokumen-dokumen = Consumers (10+ dokumen)

2. **Immutable History**
   - Setiap perubahan disimpan di history
   - Audit trail lengkap
   - Dapat roll-back ke versi sebelumnya

3. **Auto-Generate When Possible**
   - Alamat lengkap → auto-concat dari field address
   - Terbilang → auto-convert dari angka
   - Durasi → auto-calculate dari tanggal
   - Potongan total → auto-sum dari PPh + PPN

4. **Validation at Entry**
   - Validasi di Master Data (1x)
   - Semua dokumen otomatis valid

---

## 📁 File Structure

```
admin_PPK/
├── schemas/
│   ├── master-schema.json        # JSON Schema untuk Master Data
│   ├── field-mapping.json        # Mapping field → dokumen
│   └── dummy-data.json           # Contoh data lengkap
│
├── src/
│   ├── components/
│   │   └── wizard/
│   │       ├── MasterDataWizard.jsx         # Main wizard component
│   │       ├── Step1SatkerPejabat.jsx       # Step 1 form
│   │       ├── Step2KegiatanAnggaran.jsx    # Step 2 form
│   │       ├── Step3Penyedia.jsx            # Step 3 form
│   │       ├── Step4BankPembayaran.jsx      # Step 4 form
│   │       ├── Step5Dokumen.jsx             # Step 5 form
│   │       └── Step6Review.jsx              # Review & submit
│   │
│   ├── services/
│   │   └── MasterDataService.js   # API calls untuk CRUD
│   │
│   ├── utils/
│   │   ├── masterDataHelpers.js   # Helper functions
│   │   ├── masterDataValidator.js # Validation logic
│   │   └── terbilangGenerator.js  # Angka → terbilang
│   │
│   ├── generators/
│   │   ├── SPRGenerator.js        # Generate SPR from master
│   │   ├── SPPRGenerator.js       # Generate SPPR from master
│   │   ├── BASTGenerator.js       # Generate BAST from master
│   │   ├── BAPGenerator.js        # Generate BAP from master
│   │   ├── RPDGenerator.js        # Generate RPD from master
│   │   └── KuitansiGenerator.js   # Generate Kuitansi from master
│   │
│   └── db/
│       └── database.js            # Dexie schema untuk Master Data
│
└── docs/
    └── SINGLE_SOURCE_OF_TRUTH.md  # Documentation (this file)
```

---

## 📊 Master Data Schema

### Overview

Schema lengkap ada di file `schemas/master-schema.json` (JSON Schema format).

### Main Sections

#### 1. **Metadata Identifikasi**
```json
{
  "id": "MDK-2024-000001",           // Auto-generated unique ID
  "tahunAnggaran": 2024,
  "status": "draft | active | completed | archived"
}
```

#### 2. **Satker** (Satuan Kerja)
```json
{
  "satker": {
    "kementerian": "Kementerian Keuangan",
    "unitEselon1": "Direktorat Jenderal Perbendaharaan",
    "kode": "123456",
    "nama": "KPPN Jakarta I",
    "alamat": { ... },
    "telepon": "021-xxx",
    "email": "xxx@kemenkeu.go.id"
  }
}
```

#### 3. **Pejabat** (KPA, PPK, Bendahara, PPHP)
```json
{
  "pejabat": {
    "kpa": { "nama": "...", "nip": "...", "jabatan": "...", "ttd": "..." },
    "ppk": { "nama": "...", "nip": "...", "jabatan": "...", "ttd": "..." },
    "bendahara": { "nama": "...", "nip": "...", "ttd": "..." },
    "pphp": [
      { "nama": "...", "nip": "...", "jabatan": "...", "role": "ketua" },
      { "nama": "...", "nip": "...", "jabatan": "...", "role": "anggota" }
    ]
  }
}
```

#### 4. **Kegiatan & Anggaran**
```json
{
  "kegiatan": {
    "program": { "kode": "01", "nama": "..." },
    "kegiatan": { "kode": "01.01", "nama": "..." },
    "output": { "kode": "01.01.001", "nama": "...", "volume": "12", "satuan": "bulan" },
    "akun": { "kode": "521211", "nama": "Belanja Barang Operasional" },
    "uraian": "...",
    "lokasi": "Jakarta",
    "waktu": { "mulai": "2024-01-01", "selesai": "2024-12-31", "durasi": 365 }
  },
  "anggaran": {
    "sumberDana": "APBN",
    "dipaRevisi": 0,
    "pagu": 50000000,
    "nilaiKontrak": 45000000,
    "nilaiDibayar": 44550000,
    "potongan": { "pph23": 450000, "ppn": 0, "total": 450000 },
    "terbilang": "Empat Puluh Empat Juta Lima Ratus Lima Puluh Ribu Rupiah"
  }
}
```

#### 5. **Penyedia & Bank**
```json
{
  "penyedia": {
    "jenis": "badan_usaha | perorangan | pegawai",
    "nama": "PT Maju Jaya Sentosa",
    "pimpinan": "Ir. Bambang Setiawan",
    "alamat": { ... },
    "identitas": { "npwp": "...", "nik": "...", "nomorAkta": "..." }
  },
  "bank": {
    "namaBank": "Bank Mandiri",
    "cabang": "KCP Jakarta Sudirman",
    "nomorRekening": "1370012345678",
    "atasNama": "PT Maju Jaya Sentosa"
  }
}
```

#### 6. **Dokumen Metadata**
```json
{
  "dokumen": {
    "kontrak": { "nomor": "SPK-001/...", "tanggal": "2024-01-15" },
    "spr": { "nomor": "SPR-001/...", "tanggal": "2024-03-31" },
    "sppr": { "nomor": "SPPR-001/...", "tanggal": "2024-03-30" },
    "bast": { "nomor": "BAST-001/...", "tanggal": "2024-03-30" },
    "bap": { "nomor": "BAP-001/...", "tanggal": "2024-03-29" },
    "sptjb": { "nomor": "SPTJB-001/...", "tanggal": "2024-03-31" },
    "rpd": { "nomor": "RPD-001/...", "tanggal": "2024-03-31" },
    "sp2d": { "nomor": "SP2D-12345678/2024", "tanggal": "2024-04-01" },
    "kuitansi": { "nomor": "KWT-001/...", "tanggal": "2024-03-31" }
  }
}
```

---

## 🗺️ Field Mapping

File `schemas/field-mapping.json` memetakan setiap field ke dokumen yang menggunakannya.

### Contoh Mapping

**Field:** `pejabat.ppk.nama`
**Digunakan di:**
- SPR (Surat Permintaan Pembayaran)
- SPPR (Surat Pernyataan Penyelesaian Pekerjaan)
- SPTJB (Surat Pernyataan Tanggung Jawab Belanja)
- BAST (Berita Acara Serah Terima)
- BAP (Berita Acara Pemeriksaan)
- RPD (Rincian Paket Dokumen)
- Nominatif
- Cover SPJ
- Kontrak

**Insight:** 1 field dipakai di 9 dokumen! → Input 1x, pakai 9x.

### Dokumentasi Lengkap

Lihat `field-mapping.json` untuk mapping lengkap semua field.

---

## 🧙 Form Wizard Implementation

### Multi-Step Form Design

Form Wizard menggunakan **6 langkah** untuk mengumpulkan semua data:

#### **Step 1: Data Satker & Pejabat** 🏢
- Identitas satker (kode, nama, alamat)
- Data KPA (nama, NIP, jabatan)
- Data PPK
- Data Bendahara
- Data PPHP (array, bisa tambah/hapus)

**Auto-generate:**
- `satker.alamat.lengkap` (concat dari field address)

#### **Step 2: Data Kegiatan & Anggaran** 📋
- Program, Kegiatan, Output
- MAK (Akun)
- Uraian kegiatan
- Lokasi & waktu pelaksanaan
- Sumber dana, pagu, nilai kontrak
- Potongan pajak (PPh, PPN)

**Auto-generate:**
- `kegiatan.waktu.durasi` (calculate dari mulai-selesai)
- `anggaran.nilaiDibayar` (kontrak - potongan)
- `anggaran.potongan.total` (sum of all potongan)
- `anggaran.terbilang` (convert angka → terbilang)

**Validasi:**
- Nilai kontrak ≤ pagu anggaran
- Tanggal selesai > tanggal mulai

#### **Step 3: Data Penyedia / Penerima** 🏪
- Jenis penyedia (badan usaha / perorangan / pegawai)
- Nama, pimpinan, alamat
- NPWP, NIK, Nomor Akta

**Auto-generate:**
- `penyedia.alamat.lengkap`

#### **Step 4: Data Bank & Pembayaran** 💰
- Nama bank, cabang
- Nomor rekening
- Atas nama

**Validasi:**
- Atas nama harus sesuai dengan nama penyedia

#### **Step 5: Nomor & Tanggal Dokumen** 📄
- Nomor & tanggal kontrak/SPK
- Nomor & tanggal SPR, SPPR, BAST, BAP, SPTJB, RPD
- Nomor & tanggal SP2D (optional, diisi setelah dicairkan)

**Validasi:**
- Tanggal BAST ≥ tanggal selesai kegiatan
- Tanggal SPR ≥ tanggal BAST

#### **Step 6: Review & Submit** ✅
- Tampilkan semua data dalam format terstruktur
- Highlight field yang auto-generated
- Show dokumen apa saja yang bisa di-generate
- Button "Submit Master Data"

### Component Structure

```jsx
<MasterDataWizard>
  <ProgressStepper currentStep={currentStep} />

  {currentStep === 0 && <Step1SatkerPejabat />}
  {currentStep === 1 && <Step2KegiatanAnggaran />}
  {currentStep === 2 && <Step3Penyedia />}
  {currentStep === 3 && <Step4BankPembayaran />}
  {currentStep === 4 && <Step5Dokumen />}
  {currentStep === 5 && <Step6Review />}

  <NavigationButtons
    onPrevious={goToPreviousStep}
    onNext={goToNextStep}
    onSubmit={handleSubmit}
  />
</MasterDataWizard>
```

### State Management

Semua data disimpan dalam 1 state object:

```jsx
const [masterData, setMasterData] = useState({
  id: '',
  tahunAnggaran: 2024,
  status: 'draft',
  satker: { ... },
  pejabat: { ... },
  kegiatan: { ... },
  anggaran: { ... },
  penyedia: { ... },
  bank: { ... },
  dokumen: { ... },
  lampiran: [],
  metadata: { ... }
})
```

**Benefits:**
- Single source of truth dalam React state
- Easy to save/load draft
- Easy to pass to document generators

---

## ⚙️ Auto-Generate Fields

### Fields Yang Auto-Generated

1. **ID Master Data**
   - Format: `MDK-YYYY-NNNNNN`
   - Example: `MDK-2024-000001`
   - Generated on: First render

2. **Alamat Lengkap (Satker & Penyedia)**
   - Formula: `{jalan}, {kelurahan}, {kecamatan}, {kota}, {provinsi} {kodePos}`
   - Generated on: Any address field change

3. **Terbilang**
   - Convert: `44550000` → `"Empat Puluh Empat Juta Lima Ratus Lima Puluh Ribu Rupiah"`
   - Generated on: `nilaiDibayar` change

4. **Durasi Kegiatan**
   - Calculate: `selesai - mulai` (in days)
   - Generated on: `mulai` or `selesai` change

5. **Total Potongan**
   - Formula: `pph21 + pph22 + pph23 + ppn`
   - Generated on: Any potongan field change

6. **Nilai Dibayar**
   - Formula: `nilaiKontrak - totalPotongan`
   - Generated on: `nilaiKontrak` or potongan change

### Implementation

```jsx
// Example: Auto-generate terbilang
useEffect(() => {
  const { nilaiDibayar } = masterData.anggaran
  const terbilang = generateTerbilang(nilaiDibayar)

  setMasterData(prev => ({
    ...prev,
    anggaran: {
      ...prev.anggaran,
      terbilang
    }
  }))
}, [masterData.anggaran.nilaiDibayar])
```

---

## ✅ Validation Rules

### Business Rules

1. **Nilai Kontrak ≤ Pagu**
   ```javascript
   if (anggaran.nilaiKontrak > anggaran.pagu) {
     error('Nilai kontrak tidak boleh melebihi pagu anggaran')
   }
   ```

2. **Nilai Dibayar = Kontrak - Potongan**
   ```javascript
   const expected = nilaiKontrak - totalPotongan
   if (nilaiDibayar !== expected) {
     error('Nilai dibayar harus sama dengan kontrak dikurangi potongan')
   }
   ```

3. **Tanggal Selesai > Tanggal Mulai**
   ```javascript
   if (selesai <= mulai) {
     error('Tanggal selesai harus setelah tanggal mulai')
   }
   ```

4. **Tanggal BAST ≥ Tanggal Selesai Kegiatan**
   ```javascript
   if (dokumen.bast.tanggal < kegiatan.waktu.selesai) {
     error('Tanggal BAST tidak boleh sebelum tanggal selesai kegiatan')
   }
   ```

5. **Tanggal SPR ≥ Tanggal BAST**
   ```javascript
   if (dokumen.spr.tanggal < dokumen.bast.tanggal) {
     error('Tanggal SPR tidak boleh sebelum tanggal BAST')
   }
   ```

### Field-Level Validations

- **NIP:** 18 digit
- **NPWP:** 15 digit
- **NIK:** 16 digit
- **Kode Satker:** 6 digit
- **Email:** Valid email format
- **Kode Pos:** 5 digit
- **Nomor Rekening:** 10-16 digit

---

## 🔗 Integration dengan Document Generator

### Flow

```
Master Data → Document Generator → Generated Document (PDF/DOCX)
```

### Example: Generate SPR

```javascript
import { SPRGenerator } from '../generators/SPRGenerator'
import { MasterDataService } from '../services/MasterDataService'

const generateSPR = async (masterDataId) => {
  // 1. Load master data from database
  const masterData = await MasterDataService.getById(masterDataId)

  // 2. Validate master data
  if (!masterData) {
    throw new Error('Master data not found')
  }

  // 3. Generate SPR document
  const sprDocument = SPRGenerator.generate(masterData)

  // 4. Return PDF atau save to file
  return sprDocument
}
```

### SPRGenerator Implementation

```javascript
// generators/SPRGenerator.js
export class SPRGenerator {
  static generate(masterData) {
    // Pull fields from master data (no manual input!)
    const {
      dokumen,
      satker,
      pejabat,
      tahunAnggaran,
      kegiatan,
      anggaran,
      penyedia,
      bank
    } = masterData

    // Build SPR document structure
    const sprData = {
      nomor: dokumen.spr.nomor,
      tanggal: dokumen.spr.tanggal,
      satkerNama: satker.nama,
      satkerKode: satker.kode,
      satkerAlamat: satker.alamat.lengkap,
      ppkNama: pejabat.ppk.nama,
      ppkNip: pejabat.ppk.nip,
      ppkJabatan: pejabat.ppk.jabatan,
      tahun: tahunAnggaran,
      programNama: kegiatan.program.nama,
      kegiatanNama: kegiatan.kegiatan.nama,
      makKode: kegiatan.akun.kode,
      makNama: kegiatan.akun.nama,
      uraian: kegiatan.uraian,
      nilaiKontrak: anggaran.nilaiKontrak,
      nilaiDibayar: anggaran.nilaiDibayar,
      terbilang: anggaran.terbilang,
      penyediaNama: penyedia.nama,
      penyediaAlamat: penyedia.alamat.lengkap,
      npwp: penyedia.identitas.npwp,
      bankNama: bank.namaBank,
      bankRekening: bank.nomorRekening,
      bankAtasNama: bank.atasNama,
      // ...other fields
    }

    // Generate PDF using template
    return this.renderPDF(sprData)
  }

  static renderPDF(data) {
    // Use PDF library (jsPDF, PDFKit, etc.)
    // to render template with data
    return pdfDocument
  }
}
```

### Benefits of This Approach

✅ **Generator hanya BACA data, tidak INPUT**
✅ **Template konsisten, data konsisten**
✅ **Mudah maintain: ubah template tanpa ubah data**
✅ **Testing mudah: mock master data → test generator**

---

## 💾 Database Implementation

### Dexie Schema

```javascript
// src/db/database.js
db.version(11).stores({
  masterDataKegiatan: '++id, tahunAnggaran, status, [tahunAnggaran+status], createdAt',
  // ... existing tables
})
```

### Service Layer

```javascript
// src/services/MasterDataService.js
import { db } from '../db/database'

export class MasterDataService {
  static async create(masterData) {
    const id = await db.masterDataKegiatan.add(masterData)
    return { ...masterData, id }
  }

  static async getById(id) {
    return await db.masterDataKegiatan.get(id)
  }

  static async update(id, updates) {
    await db.masterDataKegiatan.update(id, {
      ...updates,
      'metadata.updatedAt': new Date().toISOString()
    })
  }

  static async getByYear(tahunAnggaran) {
    return await db.masterDataKegiatan
      .where({ tahunAnggaran })
      .sortBy('createdAt')
  }

  static async getActive() {
    return await db.masterDataKegiatan
      .where('status')
      .equals('active')
      .toArray()
  }
}
```

---

## 🧪 Testing

### Unit Tests

Test individual helper functions:

```javascript
// utils/masterDataHelpers.test.js
import { generateTerbilang, calculateDuration } from './masterDataHelpers'

test('generateTerbilang converts number to words', () => {
  expect(generateTerbilang(45000000)).toBe('Empat Puluh Lima Juta Rupiah')
})

test('calculateDuration returns correct days', () => {
  const durasi = calculateDuration('2024-01-01', '2024-01-31')
  expect(durasi).toBe(30)
})
```

### Integration Tests

Test wizard flow:

```javascript
// components/wizard/MasterDataWizard.test.jsx
import { render, fireEvent, waitFor } from '@testing-library/react'
import MasterDataWizard from './MasterDataWizard'

test('completes wizard flow and submits data', async () => {
  const { getByText, getByLabelText } = render(<MasterDataWizard />)

  // Step 1: Fill satker data
  fireEvent.change(getByLabelText('Nama Satker'), {
    target: { value: 'KPPN Jakarta I' }
  })
  fireEvent.click(getByText('Selanjutnya'))

  // ... continue through all steps

  // Final step: Submit
  fireEvent.click(getByText('Submit Master Data'))

  await waitFor(() => {
    expect(mockSaveFunction).toHaveBeenCalled()
  })
})
```

### Validation Tests

Test business rules:

```javascript
// utils/masterDataValidator.test.js
import { validateMasterData } from './masterDataValidator'

test('rejects when nilaiKontrak exceeds pagu', () => {
  const data = {
    anggaran: {
      pagu: 50000000,
      nilaiKontrak: 60000000
    }
  }

  const errors = validateMasterData(data, 'kegiatan')
  expect(errors).toHaveProperty('anggaran.nilaiKontrak')
})
```

---

## 🎯 Best Practices

### 1. **Always Validate Before Generate**

```javascript
// ❌ BAD
const doc = SPRGenerator.generate(masterData) // Might fail!

// ✅ GOOD
const errors = validateMasterData(masterData)
if (Object.keys(errors).length > 0) {
  throw new Error('Master data invalid')
}
const doc = SPRGenerator.generate(masterData)
```

### 2. **Use History/Audit Trail**

```javascript
// Always log changes
const updateMasterData = async (id, changes) => {
  const current = await MasterDataService.getById(id)

  const history = {
    timestamp: new Date().toISOString(),
    user: getCurrentUser().id,
    action: 'updated',
    changes: {
      description: 'Updated pejabat data',
      fields: Object.keys(changes)
    }
  }

  await MasterDataService.update(id, {
    ...changes,
    'metadata.history': [...current.metadata.history, history]
  })
}
```

### 3. **Separate Concerns**

- **Master Data** = Pure data (no UI logic)
- **Wizard** = UI for data entry
- **Generator** = Logic to transform data → document
- **Service** = Database operations

### 4. **Version Control**

```javascript
// When making breaking changes to schema
const migrate = async () => {
  const allData = await db.masterDataKegiatan.toArray()

  for (const data of allData) {
    if (data.metadata.version === 1) {
      // Migrate from v1 to v2
      data.penyedia.jenis = 'badan_usaha' // new required field
      data.metadata.version = 2
      await db.masterDataKegiatan.put(data)
    }
  }
}
```

### 5. **Defensive Checks in Generators**

```javascript
// Always check for required fields
export class SPRGenerator {
  static generate(masterData) {
    // Defensive checks
    if (!masterData.pejabat?.ppk?.nama) {
      throw new Error('PPK nama is required for SPR')
    }

    if (!masterData.anggaran?.nilaiDibayar) {
      throw new Error('Nilai dibayar is required for SPR')
    }

    // Proceed with generation
    return this.renderPDF(masterData)
  }
}
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (CURRENT)
- ✅ Master Data Schema design
- ✅ Field mapping documentation
- ✅ Form Wizard UI design
- ✅ Dummy data for testing

### Phase 2: Core Implementation (NEXT)
- [ ] Implement helper functions (`terbilangGenerator`, `masterDataValidator`)
- [ ] Build all 6 wizard step components
- [ ] Integrate with Dexie database
- [ ] Create MasterDataService CRUD operations

### Phase 3: Document Generators
- [ ] SPRGenerator
- [ ] SPPRGenerator
- [ ] BASTGenerator
- [ ] BAPGenerator
- [ ] RPDGenerator
- [ ] KuitansiGenerator
- [ ] NominatifGenerator

### Phase 4: Testing & Polish
- [ ] Unit tests for all helpers
- [ ] Integration tests for wizard
- [ ] E2E tests for full flow
- [ ] Performance optimization
- [ ] Error handling improvements

### Phase 5: Advanced Features
- [ ] Template customization (per satker)
- [ ] Bulk import from Excel
- [ ] Export to various formats (PDF, DOCX, XLSX)
- [ ] Approval workflow integration
- [ ] Digital signature support

---

## 📞 Support

Untuk pertanyaan atau issue terkait SSOT architecture:
- Baca dokumentasi ini terlebih dahulu
- Check `schemas/` folder untuk reference
- Test dengan `dummy-data.json`
- Contact: Architecture Team

---

## 📝 Changelog

### v1.0.0 (2024-01-14)
- Initial architecture design
- Complete schema definition
- Field mapping documentation
- Form wizard design
- Dummy data examples

---

**🎯 Remember: "Input Once, Use Everywhere" - Itu adalah filosofi SSOT!**
