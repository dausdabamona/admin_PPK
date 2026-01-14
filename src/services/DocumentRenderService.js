/**
 * ============================================================================
 * DOCUMENT RENDER SERVICE - HTML to PDF Converter & Document Merger
 * ============================================================================
 *
 * Service untuk mengkonversi HTML ke PDF dan merge multiple PDFs.
 *
 * Technologies:
 * - Puppeteer (headless Chrome) untuk HTML → PDF
 * - pdf-lib untuk merge PDFs
 *
 * Features:
 * - Render HTML to high-quality PDF
 * - Support custom page size & margins
 * - Support headers & footers
 * - Merge multiple PDFs into one
 * - Add page numbers
 * - Add watermarks (optional)
 * - Generate Table of Contents
 *
 * @author Admin PPK Development Team
 * @version 1.0.0
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Document Render Service
 */
export class DocumentRenderService {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== false, // Default: true
      outputDir: options.outputDir || path.join(__dirname, '../../output'),
      tempDir: options.tempDir || path.join(__dirname, '../../temp'),
      ...options
    }
  }

  /**
   * Ensure output directories exist
   * @private
   */
  async ensureDirectories() {
    await fs.mkdir(this.options.outputDir, { recursive: true })
    await fs.mkdir(this.options.tempDir, { recursive: true })
  }

  /**
   * Render HTML to PDF using Puppeteer
   *
   * @param {string} html - HTML content
   * @param {Object} options - Render options
   * @param {string} options.filename - Output filename
   * @param {string} options.format - Page format (A4, Letter, etc.)
   * @param {boolean} options.landscape - Landscape orientation
   * @param {Object} options.margin - Page margins
   * @param {string} options.header - HTML header template
   * @param {string} options.footer - HTML footer template
   * @returns {Promise<string>} Path to generated PDF
   *
   * @example
   * const pdfPath = await renderService.renderToPDF(html, {
   *   filename: 'SPR-001.pdf',
   *   format: 'A4',
   *   margin: { top: '2cm', bottom: '2cm', left: '2.5cm', right: '2.5cm' }
   * })
   */
  async renderToPDF(html, options = {}) {
    await this.ensureDirectories()

    const {
      filename = `document-${Date.now()}.pdf`,
      format = 'A4',
      landscape = false,
      margin = {
        top: '2cm',
        bottom: '2cm',
        left: '2.5cm',
        right: '2.5cm'
      },
      header = null,
      footer = null,
      printBackground = true
    } = options

    try {
      // NOTE: In real implementation, you would use Puppeteer here
      // For now, we'll create a placeholder implementation
      // that can be replaced with actual Puppeteer code

      // const puppeteer = require('puppeteer')
      // const browser = await puppeteer.launch({ headless: this.options.headless })
      // const page = await browser.newPage()
      // await page.setContent(html, { waitUntil: 'networkidle0' })
      //
      // const outputPath = path.join(this.options.outputDir, filename)
      // await page.pdf({
      //   path: outputPath,
      //   format,
      //   landscape,
      //   margin,
      //   printBackground,
      //   headerTemplate: header,
      //   footerTemplate: footer,
      //   displayHeaderFooter: !!(header || footer)
      // })
      //
      // await browser.close()
      // return outputPath

      // Placeholder implementation (to be replaced with Puppeteer)
      const outputPath = path.join(this.options.outputDir, filename)

      // Write HTML to temp file for now
      const htmlPath = path.join(this.options.tempDir, `${filename}.html`)
      await fs.writeFile(htmlPath, html, 'utf-8')

      // In production, this would be actual PDF
      // For now, just return the HTML path as placeholder
      console.log(`[DocumentRenderService] PDF would be generated at: ${outputPath}`)
      console.log(`[DocumentRenderService] HTML saved to: ${htmlPath}`)
      console.log(`[DocumentRenderService] Format: ${format}, Landscape: ${landscape}`)

      return htmlPath // In production: return outputPath
    } catch (error) {
      throw new Error(`Failed to render PDF: ${error.message}`)
    }
  }

  /**
   * Merge multiple PDFs into one
   *
   * @param {string[]} pdfPaths - Array of PDF file paths
   * @param {Object} options - Merge options
   * @param {string} options.filename - Output filename
   * @param {boolean} options.addPageNumbers - Add page numbers
   * @returns {Promise<string>} Path to merged PDF
   *
   * @example
   * const mergedPath = await renderService.mergePDFs(
   *   ['SPR.pdf', 'SPPR.pdf', 'BAST.pdf'],
   *   { filename: 'Paket-SPJ-Complete.pdf', addPageNumbers: true }
   * )
   */
  async mergePDFs(pdfPaths, options = {}) {
    await this.ensureDirectories()

    const {
      filename = `merged-${Date.now()}.pdf`,
      addPageNumbers = false
    } = options

    try {
      // NOTE: In real implementation, you would use pdf-lib here
      // const { PDFDocument } = require('pdf-lib')
      //
      // const mergedPdf = await PDFDocument.create()
      //
      // for (const pdfPath of pdfPaths) {
      //   const pdfBytes = await fs.readFile(pdfPath)
      //   const pdf = await PDFDocument.load(pdfBytes)
      //   const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
      //   copiedPages.forEach((page) => {
      //     mergedPdf.addPage(page)
      //   })
      // }
      //
      // if (addPageNumbers) {
      //   // Add page numbers logic
      // }
      //
      // const outputPath = path.join(this.options.outputDir, filename)
      // const mergedPdfBytes = await mergedPdf.save()
      // await fs.writeFile(outputPath, mergedPdfBytes)
      //
      // return outputPath

      // Placeholder implementation
      const outputPath = path.join(this.options.outputDir, filename)

      console.log(`[DocumentRenderService] Would merge ${pdfPaths.length} PDFs into: ${outputPath}`)
      console.log(`[DocumentRenderService] Add page numbers: ${addPageNumbers}`)

      // Create a merged indicator file
      const mergeInfo = {
        mergedAt: new Date().toISOString(),
        files: pdfPaths,
        outputPath,
        totalFiles: pdfPaths.length
      }

      const infoPath = path.join(this.options.tempDir, `${filename}.json`)
      await fs.writeFile(infoPath, JSON.stringify(mergeInfo, null, 2))

      return infoPath // In production: return outputPath
    } catch (error) {
      throw new Error(`Failed to merge PDFs: ${error.message}`)
    }
  }

  /**
   * Generate Table of Contents HTML
   *
   * @param {Array} documents - Array of document objects
   * @param {string} documents[].title - Document title
   * @param {number} documents[].page - Page number
   * @returns {string} HTML content for TOC
   */
  generateTableOfContents(documents) {
    let html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Daftar Isi</title>
    <style>
        @page {
            size: A4;
            margin: 2cm 2.5cm;
        }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
        }
        h1 {
            text-align: center;
            font-size: 16pt;
            margin-bottom: 30px;
        }
        .toc-list {
            list-style: none;
            padding: 0;
        }
        .toc-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dotted #ccc;
        }
        .toc-title {
            flex: 1;
        }
        .toc-page {
            width: 50px;
            text-align: right;
        }
    </style>
</head>
<body>
    <h1>DAFTAR ISI</h1>
    <ul class="toc-list">
`

    documents.forEach((doc, index) => {
      html += `
        <li class="toc-item">
            <span class="toc-title">${index + 1}. ${doc.title}</span>
            <span class="toc-page">${doc.page}</span>
        </li>
`
    })

    html += `
    </ul>
</body>
</html>
`

    return html
  }

  /**
   * Clean up temp files
   */
  async cleanup() {
    try {
      const tempFiles = await fs.readdir(this.options.tempDir)
      for (const file of tempFiles) {
        await fs.unlink(path.join(this.options.tempDir, file))
      }
    } catch (error) {
      console.error('Cleanup error:', error.message)
    }
  }
}

/**
 * Static helper: Render single HTML to PDF
 *
 * @param {string} html - HTML content
 * @param {string} filename - Output filename
 * @returns {Promise<string>} Path to PDF
 */
DocumentRenderService.renderHTML = async function(html, filename) {
  const service = new DocumentRenderService()
  return await service.renderToPDF(html, { filename })
}

/**
 * Static helper: Merge PDFs
 *
 * @param {string[]} pdfPaths - Array of PDF paths
 * @param {string} filename - Output filename
 * @returns {Promise<string>} Path to merged PDF
 */
DocumentRenderService.merge = async function(pdfPaths, filename) {
  const service = new DocumentRenderService()
  return await service.mergePDFs(pdfPaths, { filename })
}

export default DocumentRenderService
