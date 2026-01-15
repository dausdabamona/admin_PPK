# FASE 4.5 - Database Schema Migration
## Multi Tahun Anggaran & Arsip Audit Hidup

---

## 📋 Overview

Migration ini menambahkan field `tahun_anggaran` ke semua tabel utama untuk mendukung:
- Multi-year data management
- Fiscal year isolation
- Archive and reconstruction capabilities
- Cross-year audit compliance

**Target**: Semua entity harus memiliki fiscal year context untuk query filtering yang efisien.

---

## 🎯 Core Requirements

### 1. Field Specification
```javascript
tahunAnggaran: {
  type: Number,
  required: true,
  index: true,           // CRITICAL: Must be indexed for performance
  min: 2015,
  max: 2100,
  default: () => new Date().getFullYear()
}
```

### 2. Compound Indexes
Untuk query performa optimal, buat compound index:
```javascript
// Example untuk Master Data
masterDataSchema.index({ tahunAnggaran: 1, masterId: 1 })
masterDataSchema.index({ tahunAnggaran: 1, status: 1 })
masterDataSchema.index({ tahunAnggaran: 1, satkerKode: 1 })
```

---

## 📦 Tables to Modify

### TIER 1: CRITICAL ENTITIES (MUST HAVE)

#### 1. **MasterData** (Master Data Kegiatan)
```javascript
{
  masterId: String,                    // Existing
  tahunAnggaran: Number,               // NEW - REQUIRED
  satkerKode: String,
  ppkNama: String,
  // ... existing fields
}

// Indexes
masterDataSchema.index({ tahunAnggaran: 1, masterId: 1 }, { unique: true })
masterDataSchema.index({ tahunAnggaran: 1, status: 1 })
masterDataSchema.index({ tahunAnggaran: 1, satkerKode: 1 })
```

**Migration Strategy**:
- Set existing records to appropriate year based on `createdAt` or `tanggalKegiatan`
- Or prompt user to assign year manually for existing data

---

#### 2. **WorkflowInstances** (Workflow State)
```javascript
{
  instanceId: String,
  workflowType: String,
  tahunAnggaran: Number,               // NEW - REQUIRED
  masterDataId: String,
  status: String,
  // ... existing fields
}

// Indexes
workflowInstanceSchema.index({ tahunAnggaran: 1, instanceId: 1 }, { unique: true })
workflowInstanceSchema.index({ tahunAnggaran: 1, workflowType: 1 })
workflowInstanceSchema.index({ tahunAnggaran: 1, status: 1 })
```

---

#### 3. **Documents** (Generated Documents)
```javascript
{
  documentId: String,
  tahunAnggaran: Number,               // NEW - REQUIRED
  masterDataId: String,
  documentType: String,
  filePath: String,
  // ... existing fields
}

// Indexes
documentSchema.index({ tahunAnggaran: 1, documentId: 1 }, { unique: true })
documentSchema.index({ tahunAnggaran: 1, masterDataId: 1 })
documentSchema.index({ tahunAnggaran: 1, documentType: 1 })
```

---

#### 4. **ComplianceReports** (Audit Readiness Reports)
```javascript
{
  reportId: String,
  tahunAnggaran: Number,               // NEW - REQUIRED
  masterDataId: String,
  workflowInstanceId: String,
  score: Number,
  // ... existing fields
}

// Indexes
complianceReportSchema.index({ tahunAnggaran: 1, reportId: 1 }, { unique: true })
complianceReportSchema.index({ tahunAnggaran: 1, masterDataId: 1 })
complianceReportSchema.index({ tahunAnggaran: 1, score: 1 })
```

---

### TIER 2: SUPPORTING ENTITIES

#### 5. **Pegawai** (Employee Data)
```javascript
{
  nip: String,
  nama: String,
  tahunAnggaran: Number,               // NEW - OPTIONAL (for historis data)
  // ... existing fields
}

// Indexes
pegawaiSchema.index({ tahunAnggaran: 1, nip: 1 })
```

**Note**: Pegawai bisa shared across years, atau versioned per-year jika ada perubahan data.

---

#### 6. **AuditTrails** (Activity Logs)
```javascript
{
  trailId: String,
  tahunAnggaran: Number,               // NEW - REQUIRED
  action: String,
  userId: String,
  timestamp: Date,
  // ... existing fields
}

// Indexes
auditTrailSchema.index({ tahunAnggaran: 1, timestamp: -1 })
auditTrailSchema.index({ tahunAnggaran: 1, userId: 1 })
```

---

#### 7. **SPJPackages** (SPJ Archives)
```javascript
{
  packageId: String,
  tahunAnggaran: Number,               // NEW - REQUIRED
  masterDataId: String,
  status: String,  // 'FINAL', 'RECONSTRUCTED', 'DRAFT'
  isReconstruction: Boolean,           // NEW - Flag for reconstructed data
  reconstructionDate: Date,            // NEW - When was it reconstructed
  // ... existing fields
}

// Indexes
spjPackageSchema.index({ tahunAnggaran: 1, packageId: 1 }, { unique: true })
spjPackageSchema.index({ tahunAnggaran: 1, status: 1 })
spjPackageSchema.index({ tahunAnggaran: 1, isReconstruction: 1 })
```

---

## 🔄 Migration Scripts

### Migration Script 1: Add tahunAnggaran to Existing Records

```javascript
/**
 * migration-add-tahun-anggaran.js
 *
 * Adds tahunAnggaran field to all existing records
 */

const mongoose = require('mongoose')

async function migrateMasterData() {
  const MasterData = mongoose.model('MasterData')

  // Strategy 1: Derive from tanggalKegiatan
  const records = await MasterData.find({ tahunAnggaran: { $exists: false } })

  for (const record of records) {
    let year = new Date().getFullYear() // Default to current year

    if (record.tanggalKegiatan) {
      year = new Date(record.tanggalKegiatan).getFullYear()
    } else if (record.createdAt) {
      year = new Date(record.createdAt).getFullYear()
    }

    record.tahunAnggaran = year
    await record.save()

    console.log(`Migrated MasterData ${record.masterId} to TA ${year}`)
  }

  console.log(`✅ Migrated ${records.length} MasterData records`)
}

async function migrateWorkflowInstances() {
  const WorkflowInstance = mongoose.model('WorkflowInstance')
  const MasterData = mongoose.model('MasterData')

  const instances = await WorkflowInstance.find({ tahunAnggaran: { $exists: false } })

  for (const instance of instances) {
    // Get year from related MasterData
    const masterData = await MasterData.findOne({ masterId: instance.masterDataId })

    if (masterData && masterData.tahunAnggaran) {
      instance.tahunAnggaran = masterData.tahunAnggaran
    } else {
      instance.tahunAnggaran = new Date(instance.createdAt).getFullYear()
    }

    await instance.save()
    console.log(`Migrated WorkflowInstance ${instance.instanceId} to TA ${instance.tahunAnggaran}`)
  }

  console.log(`✅ Migrated ${instances.length} WorkflowInstance records`)
}

async function migrateDocuments() {
  const Document = mongoose.model('Document')
  const MasterData = mongoose.model('MasterData')

  const documents = await Document.find({ tahunAnggaran: { $exists: false } })

  for (const doc of documents) {
    const masterData = await MasterData.findOne({ masterId: doc.masterDataId })

    if (masterData && masterData.tahunAnggaran) {
      doc.tahunAnggaran = masterData.tahunAnggaran
    } else {
      doc.tahunAnggaran = new Date(doc.createdAt).getFullYear()
    }

    await doc.save()
  }

  console.log(`✅ Migrated ${documents.length} Document records`)
}

async function runMigration() {
  try {
    console.log('🚀 Starting FASE 4.5 Database Migration...\n')

    await migrateMasterData()
    await migrateWorkflowInstances()
    await migrateDocuments()
    // Add more migrations as needed...

    console.log('\n✅ FASE 4.5 Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

module.exports = { runMigration }
```

---

### Migration Script 2: Create Indexes

```javascript
/**
 * migration-create-indexes.js
 *
 * Creates all required indexes for fiscal year queries
 */

async function createIndexes() {
  const db = mongoose.connection.db

  // MasterData indexes
  await db.collection('masterdata').createIndex(
    { tahunAnggaran: 1, masterId: 1 },
    { unique: true, name: 'idx_tahun_masterid' }
  )

  await db.collection('masterdata').createIndex(
    { tahunAnggaran: 1, status: 1 },
    { name: 'idx_tahun_status' }
  )

  await db.collection('masterdata').createIndex(
    { tahunAnggaran: 1, satkerKode: 1 },
    { name: 'idx_tahun_satker' }
  )

  // WorkflowInstance indexes
  await db.collection('workflowinstances').createIndex(
    { tahunAnggaran: 1, instanceId: 1 },
    { unique: true, name: 'idx_tahun_instanceid' }
  )

  await db.collection('workflowinstances').createIndex(
    { tahunAnggaran: 1, workflowType: 1 },
    { name: 'idx_tahun_workflowtype' }
  )

  // Document indexes
  await db.collection('documents').createIndex(
    { tahunAnggaran: 1, documentId: 1 },
    { unique: true, name: 'idx_tahun_documentid' }
  )

  await db.collection('documents').createIndex(
    { tahunAnggaran: 1, masterDataId: 1 },
    { name: 'idx_tahun_masterdataid' }
  )

  console.log('✅ All fiscal year indexes created successfully')
}

module.exports = { createIndexes }
```

---

## 🔍 Query Pattern Updates

### BEFORE (Without Fiscal Year Context)
```javascript
// ❌ Old way - returns data from all years mixed
const masterData = await MasterData.find({ satkerKode: 'SATKER123' })
```

### AFTER (With Fiscal Year Context)
```javascript
// ✅ New way - returns data for specific year only
import fiscalYearContext from './services/fiscal/FiscalYearContext.js'

const filter = fiscalYearContext.createFilter({ satkerKode: 'SATKER123' })
const masterData = await MasterData.find(filter)
// Result: { tahunAnggaran: 2024, satkerKode: 'SATKER123' }
```

---

## 🎯 Service Layer Integration

### Example: MasterDataService
```javascript
/**
 * services/MasterDataService.js - Updated for Fiscal Year Context
 */

import fiscalYearContext from './fiscal/FiscalYearContext.js'
import MasterData from '../models/MasterData.js'

class MasterDataService {
  /**
   * Get all master data for active fiscal year
   */
  async getAll() {
    const filter = fiscalYearContext.createFilter()
    return await MasterData.find(filter).sort({ createdAt: -1 })
  }

  /**
   * Get master data by ID (automatically scoped to active year)
   */
  async getById(masterId) {
    const filter = fiscalYearContext.createFilter({ masterId })
    return await MasterData.findOne(filter)
  }

  /**
   * Create new master data (automatically tagged with active year)
   */
  async create(data) {
    const contextData = fiscalYearContext.wrapWithContext(data)
    const masterData = new MasterData(contextData)
    return await masterData.save()
  }

  /**
   * Get cross-year summary (for dashboard)
   */
  async getCrossYearSummary() {
    return await MasterData.aggregate([
      {
        $group: {
          _id: '$tahunAnggaran',
          totalRecords: { $sum: 1 },
          completedRecords: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: -1 } }
    ])
  }
}

export default new MasterDataService()
```

---

## 📊 Data Validation

### Mongoose Schema Validation
```javascript
const masterDataSchema = new mongoose.Schema({
  masterId: {
    type: String,
    required: true
  },
  tahunAnggaran: {
    type: Number,
    required: [true, 'Tahun Anggaran wajib diisi'],
    min: [2015, 'Tahun Anggaran tidak boleh kurang dari 2015'],
    max: [2100, 'Tahun Anggaran tidak valid'],
    validate: {
      validator: Number.isInteger,
      message: 'Tahun Anggaran harus berupa angka bulat'
    }
  },
  // ... other fields
})

// Compound unique index
masterDataSchema.index(
  { tahunAnggaran: 1, masterId: 1 },
  { unique: true }
)
```

---

## 🔒 Data Isolation Rules

### 1. **Default Behavior: Auto-Scoped**
Semua query otomatis di-scope ke active fiscal year:
```javascript
// Automatically returns only TA 2024 data
const data = await MasterDataService.getAll()
```

### 2. **Cross-Year Access: Explicit Only**
Jika perlu akses cross-year, harus eksplisit:
```javascript
// Dashboard: show summary of all years
const summary = await MasterDataService.getCrossYearSummary()
```

### 3. **Archive Mode: Read-Only**
Saat di Archive mode, write operations harus dicegah:
```javascript
if (fiscalYearContext.isArchiveMode()) {
  throw new Error('Cannot modify data in Archive mode')
}
```

### 4. **Reconstruction Mode: Flagged Writes**
Saat di Reconstruction mode, tandai data sebagai "reconstructed":
```javascript
if (fiscalYearContext.isReconstructionMode()) {
  data.isReconstruction = true
  data.reconstructionDate = new Date()
}
```

---

## 🧪 Testing Checklist

- [ ] All models have `tahunAnggaran` field
- [ ] All indexes created successfully
- [ ] Existing data migrated with correct years
- [ ] Query performance is acceptable (< 100ms for typical queries)
- [ ] Data isolation working (no cross-year leakage)
- [ ] Archive mode prevents writes
- [ ] Reconstruction mode adds proper flags
- [ ] Cross-year queries work for dashboards
- [ ] Fiscal year context switch updates all queries

---

## 📝 Rollback Plan

Jika migration gagal:

```javascript
// Rollback script
async function rollback() {
  await db.collection('masterdata').updateMany(
    {},
    { $unset: { tahunAnggaran: '' } }
  )

  await db.collection('masterdata').dropIndex('idx_tahun_masterid')
  await db.collection('masterdata').dropIndex('idx_tahun_status')

  console.log('✅ Rollback completed')
}
```

---

## 📚 References

- [Mongoose Indexes Documentation](https://mongoosejs.com/docs/guide.html#indexes)
- [MongoDB Compound Indexes](https://docs.mongodb.com/manual/core/index-compound/)
- Admin PPK FASE 4.5 Architecture Document

---

**Last Updated**: 2024
**Author**: Admin PPK Development Team
**Version**: 1.0.0
