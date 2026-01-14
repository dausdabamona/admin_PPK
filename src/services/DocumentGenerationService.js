/**
 * ============================================================================
 * DOCUMENT GENERATION SERVICE - One-Click Document Bundle Generator
 * ============================================================================
 *
 * Service untuk menghasilkan SELURUH paket dokumen SPJ dari satu Master Data.
 *
 * Target: "Satu Klik → Semua Dokumen Resmi + Paket Audit PDF"
 *
 * Features:
 * - Generate 10 dokumen resmi otomatis (SPR, SPPR, SPTJB, BAST, BAP, RPD,
 *   Kuitansi, Nominatif, Cover, Kontrak)
 * - Merge semua PDF menjadi satu file kronologis
 * - Buat struktur folder terorganisir
 * - Generate ZIP archive lengkap
 * - Audit trail metadata
 * - Validasi sebelum generate
 *
 * Output Structure:
 * /Paket_SPJ_MDK-2024-000001/
 *   ├── Paket_SPJ_Complete.pdf        ← Merged PDF
 *   ├── Paket_SPJ_Complete.zip         ← ZIP archive
 *   ├── 01_Cover/
 *   │   ├── Cover.html
 *   │   └── Cover.pdf
 *   ├── 02_RPD/
 *   ├── 03_SPR/
 *   ├── 04_SPPR/
 *   ├── 05_SPTJB/
 *   ├── 06_BAST/
 *   ├── 07_BAP/
 *   ├── 08_Nominatif/
 *   ├── 09_Kuitansi/
 *   ├── 10_Kontrak/
 *   └── metadata.json                  ← Audit trail
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { validateForDocument } from '../utils/masterDataValidator.js'
import { DocumentRenderService } from './DocumentRenderService.js'

// Document generators will be imported as they're created
// import { SPRGenerator } from '../generators/SPRGenerator.js'
// import { SPPRGenerator } from '../generators/SPPRGenerator.js'
// import { SPTJBGenerator } from '../generators/SPTJBGenerator.js'
// import { BASTGenerator } from '../generators/BASTGenerator.js'
// import { BAPGenerator } from '../generators/BAPGenerator.js'
// import { RPDGenerator } from '../generators/RPDGenerator.js'
// import { KuitansiGenerator } from '../generators/KuitansiGenerator.js'
// import { NominatifGenerator } from '../generators/NominatifGenerator.js'
// import { CoverSPJGenerator } from '../generators/CoverSPJGenerator.js'
// import { KontrakGenerator } from '../generators/KontrakGenerator.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Document order configuration
 * Urutan dokumen sesuai standar audit SPJ Kementerian Keuangan
 */
const DOCUMENT_ORDER = [
  {
    code: 'COVER',
    title: 'Cover Paket SPJ',
    folder: '01_Cover',
    filename: 'Cover',
    required: true
  },
  {
    code: 'RPD',
    title: 'Rincian Paket Dokumen',
    folder: '02_RPD',
    filename: 'RPD',
    required: true
  },
  {
    code: 'SPR',
    title: 'Surat Permintaan Pembayaran',
    folder: '03_SPR',
    filename: 'SPR',
    required: true
  },
  {
    code: 'SPPR',
    title: 'Surat Pernyataan Penyelesaian Pekerjaan',
    folder: '04_SPPR',
    filename: 'SPPR',
    required: true
  },
  {
    code: 'SPTJB',
    title: 'Surat Pernyataan Tanggung Jawab Belanja',
    folder: '05_SPTJB',
    filename: 'SPTJB',
    required: true
  },
  {
    code: 'BAST',
    title: 'Berita Acara Serah Terima',
    folder: '06_BAST',
    filename: 'BAST',
    required: true
  },
  {
    code: 'BAP',
    title: 'Berita Acara Pemeriksaan',
    folder: '07_BAP',
    filename: 'BAP',
    required: true
  },
  {
    code: 'NOMINATIF',
    title: 'Daftar Nominatif',
    folder: '08_Nominatif',
    filename: 'Nominatif',
    required: false // Optional for non-personel
  },
  {
    code: 'KUITANSI',
    title: 'Kuitansi Pembayaran',
    folder: '09_Kuitansi',
    filename: 'Kuitansi',
    required: true
  },
  {
    code: 'KONTRAK',
    title: 'Surat Perjanjian Kerja',
    folder: '10_Kontrak',
    filename: 'Kontrak',
    required: true
  }
]

/**
 * Document Generation Service
 */
export class DocumentGenerationService {
  constructor(masterData, options = {}) {
    this.masterData = masterData
    this.options = {
      outputDir: options.outputDir || path.join(__dirname, '../../output'),
      includePDFs: options.includePDFs !== false, // Default: true
      includeHTML: options.includeHTML !== false, // Default: true
      createZIP: options.createZIP !== false, // Default: true
      addPageNumbers: options.addPageNumbers !== false, // Default: true
      ...options
    }

    // Package info
    this.packageId = masterData.masterId || `MDK-${Date.now()}`
    this.packageDir = path.join(this.options.outputDir, `Paket_SPJ_${this.packageId}`)
    this.renderService = new DocumentRenderService({
      outputDir: this.packageDir,
      tempDir: path.join(this.packageDir, 'temp')
    })

    // Generation results
    this.results = {
      success: false,
      documents: [],
      errors: [],
      warnings: [],
      packagePath: null,
      zipPath: null,
      metadata: null
    }
  }

  /**
   * Validate master data before generation
   * @returns {Object} { valid, errors }
   */
  validate() {
    console.log(`[DocumentGenerationService] Validating master data...`)

    const allErrors = []

    // Validate for each required document
    for (const doc of DOCUMENT_ORDER) {
      if (!doc.required) continue

      try {
        const validation = validateForDocument(this.masterData, doc.code)
        if (!validation.valid) {
          allErrors.push({
            document: doc.code,
            errors: validation.errors
          })
        }
      } catch (error) {
        allErrors.push({
          document: doc.code,
          errors: { general: [error.message] }
        })
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors
    }
  }

  /**
   * Ensure all directories exist
   * @private
   */
  async ensureDirectories() {
    console.log(`[DocumentGenerationService] Creating directory structure...`)

    // Create main package directory
    await fs.mkdir(this.packageDir, { recursive: true })

    // Create temp directory
    await fs.mkdir(path.join(this.packageDir, 'temp'), { recursive: true })

    // Create document folders
    for (const doc of DOCUMENT_ORDER) {
      const folderPath = path.join(this.packageDir, doc.folder)
      await fs.mkdir(folderPath, { recursive: true })
    }
  }

  /**
   * Generate a single document
   *
   * @param {string} docType - Document type code (SPR, SPPR, etc.)
   * @param {Class} GeneratorClass - Generator class
   * @returns {Promise<Object>} Generation result
   * @private
   */
  async generateDocument(docType, GeneratorClass) {
    console.log(`[DocumentGenerationService] Generating ${docType}...`)

    try {
      const generator = new GeneratorClass(this.masterData)
      const result = await generator.generate()

      if (!result.success) {
        throw new Error(`Failed to generate ${docType}: ${JSON.stringify(result.errors)}`)
      }

      // Find document config
      const docConfig = DOCUMENT_ORDER.find(d => d.code === docType)
      const folderPath = path.join(this.packageDir, docConfig.folder)

      // Save HTML
      if (this.options.includeHTML && result.html) {
        const htmlPath = path.join(folderPath, `${docConfig.filename}.html`)
        await fs.writeFile(htmlPath, result.html, 'utf-8')
      }

      // Generate PDF
      let pdfPath = null
      if (this.options.includePDFs && result.html) {
        pdfPath = await this.renderService.renderToPDF(result.html, {
          filename: `${docConfig.filename}.pdf`,
          format: 'A4'
        })

        // Move PDF to document folder
        const targetPdfPath = path.join(folderPath, `${docConfig.filename}.pdf`)
        await fs.rename(pdfPath, targetPdfPath)
        pdfPath = targetPdfPath
      }

      return {
        success: true,
        docType,
        htmlPath: this.options.includeHTML ? path.join(folderPath, `${docConfig.filename}.html`) : null,
        pdfPath,
        metadata: result.metadata
      }
    } catch (error) {
      console.error(`[DocumentGenerationService] Error generating ${docType}:`, error.message)
      return {
        success: false,
        docType,
        error: error.message
      }
    }
  }

  /**
   * Generate all documents
   * @returns {Promise<Array>} Array of generation results
   * @private
   */
  async generateAllDocuments() {
    console.log(`[DocumentGenerationService] Generating all documents...`)

    const results = []

    // NOTE: For now, only SPR is implemented
    // As we create more generators, we'll add them here

    // Import SPR generator if available
    try {
      const { SPRGenerator } = await import('../generators/SPRGenerator.js')
      const sprResult = await this.generateDocument('SPR', SPRGenerator)
      results.push(sprResult)
    } catch (error) {
      console.error('[DocumentGenerationService] SPR generator not available:', error.message)
      results.push({
        success: false,
        docType: 'SPR',
        error: 'Generator not implemented yet'
      })
    }

    // TODO: Add other generators as they're created
    // const { SPPRGenerator } = await import('../generators/SPPRGenerator.js')
    // results.push(await this.generateDocument('SPPR', SPPRGenerator))
    //
    // const { SPTJBGenerator } = await import('../generators/SPTJBGenerator.js')
    // results.push(await this.generateDocument('SPTJB', SPTJBGenerator))
    //
    // ... etc for all 10 documents

    // For documents not yet implemented, add placeholder results
    const notImplemented = ['COVER', 'RPD', 'SPPR', 'SPTJB', 'BAST', 'BAP', 'NOMINATIF', 'KUITANSI', 'KONTRAK']
    for (const docType of notImplemented) {
      results.push({
        success: false,
        docType,
        error: 'Generator not implemented yet'
      })
    }

    return results
  }

  /**
   * Generate Cover and Table of Contents
   * @returns {Promise<Object>} Generation result
   * @private
   */
  async generateCoverAndTOC() {
    console.log(`[DocumentGenerationService] Generating Cover and Table of Contents...`)

    // Prepare TOC data
    const documents = DOCUMENT_ORDER.map((doc, index) => ({
      title: doc.title,
      page: index + 1 // Placeholder page numbers
    }))

    try {
      // Generate TOC HTML
      const tocHtml = this.renderService.generateTableOfContents(documents)

      // Save TOC
      const tocPath = path.join(this.packageDir, '02_RPD', 'RPD.html')
      await fs.writeFile(tocPath, tocHtml, 'utf-8')

      // Generate TOC PDF
      if (this.options.includePDFs) {
        await this.renderService.renderToPDF(tocHtml, {
          filename: path.join(this.packageDir, '02_RPD', 'RPD.pdf'),
          format: 'A4'
        })
      }

      return {
        success: true,
        tocPath
      }
    } catch (error) {
      console.error('[DocumentGenerationService] Error generating TOC:', error.message)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Merge all PDFs into one chronological file
   * @returns {Promise<string>} Path to merged PDF
   * @private
   */
  async mergeAllPDFs() {
    console.log(`[DocumentGenerationService] Merging all PDFs...`)

    try {
      // Collect all PDF paths in order
      const pdfPaths = []

      for (const doc of DOCUMENT_ORDER) {
        const pdfPath = path.join(this.packageDir, doc.folder, `${doc.filename}.pdf`)

        // Check if file exists
        try {
          await fs.access(pdfPath)
          pdfPaths.push(pdfPath)
        } catch (error) {
          console.warn(`[DocumentGenerationService] PDF not found: ${pdfPath}`)
        }
      }

      if (pdfPaths.length === 0) {
        throw new Error('No PDFs to merge')
      }

      // Merge PDFs
      const mergedPath = await this.renderService.mergePDFs(pdfPaths, {
        filename: `Paket_SPJ_Complete_${this.packageId}.pdf`,
        addPageNumbers: this.options.addPageNumbers
      })

      // Move merged PDF to package root
      const targetPath = path.join(this.packageDir, `Paket_SPJ_Complete.pdf`)
      await fs.rename(mergedPath, targetPath)

      return targetPath
    } catch (error) {
      console.error('[DocumentGenerationService] Error merging PDFs:', error.message)
      throw error
    }
  }

  /**
   * Generate metadata for audit trail
   * @returns {Object} Metadata object
   * @private
   */
  generateMetadata() {
    return {
      packageId: this.packageId,
      masterDataId: this.masterData.masterId,
      generatedAt: new Date().toISOString(),
      generatedBy: this.masterData.ppkNama,
      satker: {
        kode: this.masterData.satkerKode,
        nama: this.masterData.satkerNama
      },
      kegiatan: {
        uraian: this.masterData.kegiatanUraian,
        pagu: this.masterData.kegiatanPagu,
        nilaiKontrak: this.masterData.kegiatanNilaiKontrak
      },
      documents: this.results.documents.map(doc => ({
        type: doc.docType,
        success: doc.success,
        generated: doc.success,
        htmlPath: doc.htmlPath,
        pdfPath: doc.pdfPath,
        error: doc.error || null
      })),
      statistics: {
        totalDocuments: DOCUMENT_ORDER.length,
        successfulDocuments: this.results.documents.filter(d => d.success).length,
        failedDocuments: this.results.documents.filter(d => !d.success).length
      },
      options: this.options,
      version: '1.0.0'
    }
  }

  /**
   * Save metadata to JSON file
   * @param {Object} metadata - Metadata object
   * @private
   */
  async saveMetadata(metadata) {
    const metadataPath = path.join(this.packageDir, 'metadata.json')
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8')
    return metadataPath
  }

  /**
   * Create ZIP archive of package
   * @returns {Promise<string>} Path to ZIP file
   * @private
   */
  async createZIPArchive() {
    console.log(`[DocumentGenerationService] Creating ZIP archive...`)

    // NOTE: In production, you would use a library like 'archiver' or 'adm-zip'
    // For now, this is a placeholder

    const zipPath = path.join(this.options.outputDir, `Paket_SPJ_${this.packageId}.zip`)

    console.log(`[DocumentGenerationService] ZIP would be created at: ${zipPath}`)
    console.log(`[DocumentGenerationService] Contents: ${this.packageDir}`)

    // Placeholder: Create a marker file
    const zipInfo = {
      message: 'ZIP creation placeholder - implement with archiver library',
      source: this.packageDir,
      target: zipPath,
      timestamp: new Date().toISOString()
    }

    await fs.writeFile(
      zipPath.replace('.zip', '.json'),
      JSON.stringify(zipInfo, null, 2),
      'utf-8'
    )

    return zipPath
  }

  /**
   * MAIN METHOD: Generate complete SPJ package
   *
   * This is the ONE-CLICK function that does everything:
   * 1. Validate master data
   * 2. Create directory structure
   * 3. Generate all 10 documents
   * 4. Generate cover & TOC
   * 5. Merge all PDFs
   * 6. Create ZIP archive
   * 7. Generate metadata
   *
   * @returns {Promise<Object>} Complete generation result
   */
  async generate() {
    const startTime = Date.now()
    console.log(`[DocumentGenerationService] ========================================`)
    console.log(`[DocumentGenerationService] Starting SPJ Package Generation`)
    console.log(`[DocumentGenerationService] Package ID: ${this.packageId}`)
    console.log(`[DocumentGenerationService] ========================================`)

    try {
      // Step 1: Validate
      console.log(`[DocumentGenerationService] Step 1/7: Validating master data...`)
      const validation = this.validate()
      if (!validation.valid) {
        this.results.success = false
        this.results.errors = validation.errors
        console.error('[DocumentGenerationService] Validation failed:', validation.errors)
        return this.results
      }

      // Step 2: Create directories
      console.log(`[DocumentGenerationService] Step 2/7: Creating directories...`)
      await this.ensureDirectories()

      // Step 3: Generate all documents
      console.log(`[DocumentGenerationService] Step 3/7: Generating documents...`)
      const docResults = await this.generateAllDocuments()
      this.results.documents = docResults

      // Step 4: Generate Cover & TOC
      console.log(`[DocumentGenerationService] Step 4/7: Generating Cover & TOC...`)
      await this.generateCoverAndTOC()

      // Step 5: Merge PDFs
      if (this.options.includePDFs) {
        console.log(`[DocumentGenerationService] Step 5/7: Merging PDFs...`)
        try {
          const mergedPdfPath = await this.mergeAllPDFs()
          this.results.packagePath = mergedPdfPath
        } catch (error) {
          console.warn('[DocumentGenerationService] PDF merging failed:', error.message)
          this.results.warnings.push(`PDF merging failed: ${error.message}`)
        }
      } else {
        console.log(`[DocumentGenerationService] Step 5/7: Skipping PDF merge (disabled)`)
      }

      // Step 6: Create ZIP
      if (this.options.createZIP) {
        console.log(`[DocumentGenerationService] Step 6/7: Creating ZIP archive...`)
        try {
          const zipPath = await this.createZIPArchive()
          this.results.zipPath = zipPath
        } catch (error) {
          console.warn('[DocumentGenerationService] ZIP creation failed:', error.message)
          this.results.warnings.push(`ZIP creation failed: ${error.message}`)
        }
      } else {
        console.log(`[DocumentGenerationService] Step 6/7: Skipping ZIP creation (disabled)`)
      }

      // Step 7: Generate metadata
      console.log(`[DocumentGenerationService] Step 7/7: Generating metadata...`)
      const metadata = this.generateMetadata()
      const metadataPath = await this.saveMetadata(metadata)
      this.results.metadata = metadata
      this.results.metadataPath = metadataPath

      // Success!
      this.results.success = true

      const duration = ((Date.now() - startTime) / 1000).toFixed(2)
      console.log(`[DocumentGenerationService] ========================================`)
      console.log(`[DocumentGenerationService] Package Generation Complete!`)
      console.log(`[DocumentGenerationService] Duration: ${duration} seconds`)
      console.log(`[DocumentGenerationService] Package Path: ${this.packageDir}`)
      console.log(`[DocumentGenerationService] Successful Documents: ${this.results.documents.filter(d => d.success).length}/${DOCUMENT_ORDER.length}`)
      console.log(`[DocumentGenerationService] ========================================`)

      return this.results
    } catch (error) {
      console.error('[DocumentGenerationService] Fatal error:', error)
      this.results.success = false
      this.results.errors.push({
        type: 'FATAL',
        message: error.message,
        stack: error.stack
      })
      return this.results
    }
  }

  /**
   * Clean up temp files
   */
  async cleanup() {
    try {
      const tempDir = path.join(this.packageDir, 'temp')
      await fs.rm(tempDir, { recursive: true, force: true })
      console.log('[DocumentGenerationService] Cleanup complete')
    } catch (error) {
      console.error('[DocumentGenerationService] Cleanup error:', error.message)
    }
  }
}

/**
 * Static helper: Generate SPJ package from master data
 *
 * @param {Object} masterData - Master data object
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generation result
 *
 * @example
 * const result = await DocumentGenerationService.generate(masterData, {
 *   includePDFs: true,
 *   createZIP: true,
 *   addPageNumbers: true
 * })
 *
 * if (result.success) {
 *   console.log('Package generated at:', result.packagePath)
 * }
 */
DocumentGenerationService.generate = async function(masterData, options = {}) {
  const service = new DocumentGenerationService(masterData, options)
  return await service.generate()
}

/**
 * Get document order configuration
 * @returns {Array} Document order array
 */
DocumentGenerationService.getDocumentOrder = function() {
  return DOCUMENT_ORDER
}

export default DocumentGenerationService
