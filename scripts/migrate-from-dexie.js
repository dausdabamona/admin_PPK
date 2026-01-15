#!/usr/bin/env node

/**
 * Dexie to PostgreSQL Migration Script
 *
 * Migrates data from IndexedDB (Dexie) to PostgreSQL server
 * Preserves all existing data during architecture upgrade
 *
 * Usage:
 *   node scripts/migrate-from-dexie.js
 *
 * Requirements:
 *   - Browser console access untuk export Dexie data
 *   - PostgreSQL server running
 *   - Server API running
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'
import FormData from 'form-data'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../server/.env') })

const API_BASE_URL = process.env.API_URL || 'https://localhost:8443/api'
const EXPORT_DATA_PATH = path.join(__dirname, '../migration/dexie-export.json')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('')
  log('═'.repeat(60), 'cyan')
  log(`  ${title}`, 'bright')
  log('═'.repeat(60), 'cyan')
  console.log('')
}

/**
 * Step 1: Export data from Dexie (run in browser console)
 */
function generateExportScript() {
  return `
// ============================================
// DEXIE EXPORT SCRIPT
// Run this in browser console (F12)
// ============================================

async function exportDexieData() {
  try {
    console.log('🔄 Exporting Dexie data...');

    // Get all tables
    const db = window.db; // Assuming db is globally accessible

    const tables = [
      // Master Data
      'pegawai',
      'masterPejabat',
      'masterKota',

      // DIPA
      'masterDipa',
      'dipaRevisions',

      // SPJ
      'sppd',
      'checklistSPJ',
      'swakelolaKegiatan',
      'swakelolaRampung',
      'swakelolaChecklist',
      'pjlpMaster',
      'pjlpKontrak',
      'pjlpBulanPembayaran',
      'pjlpChecklist',

      // SPJ Packages
      'spjPackages',

      // Honorarium
      'masterHonor',
      'honorKontrak',
      'honorAssignment',
      'honorPayment',

      // Other
      'systemSettings'
    ];

    const exportData = {
      exportDate: new Date().toISOString(),
      version: 1,
      tables: {}
    };

    for (const tableName of tables) {
      if (db[tableName]) {
        console.log(\`  📦 Exporting \${tableName}...\`);
        const data = await db[tableName].toArray();
        exportData.tables[tableName] = data;
        console.log(\`  ✓ Exported \${data.length} records from \${tableName}\`);
      } else {
        console.log(\`  ⚠️  Table \${tableName} not found, skipping...\`);
      }
    }

    // Convert to JSON
    const jsonData = JSON.stringify(exportData, null, 2);

    // Download as file
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`dexie-export-\${new Date().toISOString().split('T')[0]}.json\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ Export complete! File downloaded.');
    console.log(\`📊 Total tables: \${Object.keys(exportData.tables).length}\`);
    console.log(\`📦 Total records: \${Object.values(exportData.tables).reduce((sum, arr) => sum + arr.length, 0)}\`);

    return exportData;
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  }
}

// Run export
exportDexieData();
`;
}

/**
 * Step 2: Read exported data
 */
function readExportedData() {
  try {
    if (!fs.existsSync(EXPORT_DATA_PATH)) {
      log('❌ Export file not found!', 'red')
      log(`   Expected location: ${EXPORT_DATA_PATH}`, 'yellow')
      log('')
      log('Please follow these steps:', 'cyan')
      log('1. Open your app in browser', 'yellow')
      log('2. Open DevTools Console (F12)', 'yellow')
      log('3. Run the export script (shown below)', 'yellow')
      log('4. Save the downloaded file to: migration/dexie-export.json', 'yellow')
      log('')
      log('='.repeat(60), 'cyan')
      log('EXPORT SCRIPT:', 'bright')
      log('='.repeat(60), 'cyan')
      console.log(generateExportScript())
      log('='.repeat(60), 'cyan')
      process.exit(1)
    }

    const data = JSON.parse(fs.readFileSync(EXPORT_DATA_PATH, 'utf8'))
    return data
  } catch (error) {
    log(`❌ Error reading export file: ${error.message}`, 'red')
    process.exit(1)
  }
}

/**
 * Step 3: Authenticate to server
 */
async function authenticate() {
  try {
    log('🔐 Authenticating to server...', 'cyan')

    // Use admin credentials (should be configured in .env or prompt user)
    const credentials = {
      email: process.env.ADMIN_EMAIL || 'admin@admin.com',
      password: process.env.ADMIN_PASSWORD || 'admin123'
    }

    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials, {
      httpsAgent: new (await import('https')).Agent({
        rejectUnauthorized: false // For self-signed cert
      })
    })

    if (response.data.success) {
      log('✓ Authentication successful', 'green')
      return response.data.data.token
    } else {
      throw new Error('Authentication failed')
    }
  } catch (error) {
    log(`❌ Authentication error: ${error.message}`, 'red')
    log('   Please check your credentials in .env file', 'yellow')
    process.exit(1)
  }
}

/**
 * Step 4: Migrate tables
 */
async function migrateTables(exportData, token) {
  const httpsAgent = new (await import('https')).Agent({
    rejectUnauthorized: false
  })

  const config = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    httpsAgent
  }

  const stats = {
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  }

  const tables = exportData.tables

  for (const [tableName, records] of Object.entries(tables)) {
    logSection(`Migrating ${tableName}`)

    if (records.length === 0) {
      log('  ⚠️  No records to migrate', 'yellow')
      continue
    }

    log(`  📦 ${records.length} records to migrate`, 'cyan')

    // Map table names to API endpoints
    const endpointMap = {
      'pegawai': '/master/pegawai',
      'masterPejabat': '/master/pejabat',
      'masterKota': '/master/kota',
      'masterDipa': '/dipa/items',
      'dipaRevisions': '/dipa/revisions',
      'sppd': '/spj/sppd',
      'checklistSPJ': '/spj/checklist',
      'swakelolaKegiatan': '/spj/swakelola/kegiatan',
      'swakelolaRampung': '/spj/swakelola/rampung',
      'swakelolaChecklist': '/spj/swakelola/checklist',
      'pjlpMaster': '/spj/pjlp/master',
      'pjlpKontrak': '/spj/pjlp/kontrak',
      'pjlpBulanPembayaran': '/spj/pjlp/pembayaran',
      'pjlpChecklist': '/spj/pjlp/checklist',
      'spjPackages': '/packages',
      'masterHonor': '/honorarium/master',
      'honorKontrak': '/honorarium/kontrak',
      'honorAssignment': '/honorarium/assignment',
      'honorPayment': '/honorarium/payment',
      'systemSettings': '/settings'
    }

    const endpoint = endpointMap[tableName]

    if (!endpoint) {
      log(`  ⚠️  No API endpoint mapped for ${tableName}, skipping...`, 'yellow')
      continue
    }

    // Migrate records in batches
    const batchSize = 50
    let successCount = 0
    let failedCount = 0

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)

      try {
        // Try bulk import first
        const response = await axios.post(
          `${API_BASE_URL}${endpoint}/bulk`,
          { data: batch },
          config
        )

        if (response.data.success) {
          successCount += batch.length
          log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records migrated`, 'green')
        } else {
          // If bulk fails, try one by one
          log(`  ⚠️  Bulk import failed, trying one by one...`, 'yellow')

          for (const record of batch) {
            try {
              await axios.post(`${API_BASE_URL}${endpoint}`, record, config)
              successCount++
            } catch (err) {
              failedCount++
              stats.errors.push({
                table: tableName,
                record: record.id || record.nama || 'unknown',
                error: err.message
              })
            }
          }
        }
      } catch (error) {
        // Bulk endpoint might not exist, try one by one
        log(`  ⚠️  Bulk endpoint not available, migrating one by one...`, 'yellow')

        for (const record of batch) {
          try {
            await axios.post(`${API_BASE_URL}${endpoint}`, record, config)
            successCount++
            process.stdout.write('.')
          } catch (err) {
            failedCount++
            stats.errors.push({
              table: tableName,
              record: record.id || record.nama || 'unknown',
              error: err.message
            })
            process.stdout.write('x')
          }
        }
        console.log('') // New line after dots
      }

      // Small delay to avoid overwhelming server
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    stats.total += records.length
    stats.success += successCount
    stats.failed += failedCount

    log(`  ✅ ${successCount} records migrated successfully`, 'green')
    if (failedCount > 0) {
      log(`  ❌ ${failedCount} records failed`, 'red')
    }
  }

  return stats
}

/**
 * Step 5: Generate migration report
 */
function generateReport(stats, exportData) {
  logSection('Migration Summary')

  log(`📊 Total Records: ${stats.total}`, 'cyan')
  log(`✅ Successful:    ${stats.success}`, 'green')
  log(`❌ Failed:        ${stats.failed}`, 'red')
  log(`📈 Success Rate:  ${((stats.success / stats.total) * 100).toFixed(2)}%`, 'cyan')

  if (stats.errors.length > 0) {
    log('')
    log('⚠️  Errors:', 'yellow')
    stats.errors.slice(0, 10).forEach(err => {
      log(`   [${err.table}] ${err.record}: ${err.error}`, 'red')
    })

    if (stats.errors.length > 10) {
      log(`   ... and ${stats.errors.length - 10} more errors`, 'yellow')
    }

    // Save full error log
    const errorLogPath = path.join(__dirname, '../migration/migration-errors.json')
    fs.writeFileSync(errorLogPath, JSON.stringify(stats.errors, null, 2))
    log(`   Full error log saved to: ${errorLogPath}`, 'yellow')
  }

  log('')
  log('=' .repeat(60), 'cyan')

  if (stats.failed === 0) {
    log('🎉 Migration completed successfully!', 'green')
  } else {
    log('⚠️  Migration completed with errors. Please review the error log.', 'yellow')
  }

  log('=' .repeat(60), 'cyan')
}

/**
 * Main migration process
 */
async function main() {
  console.clear()

  log('╔═══════════════════════════════════════════════════════════╗', 'cyan')
  log('║                                                           ║', 'cyan')
  log('║   🔄 Dexie to PostgreSQL Migration Tool                 ║', 'cyan')
  log('║                                                           ║', 'cyan')
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan')

  try {
    // Step 1: Read exported data
    logSection('Step 1: Reading Exported Data')
    const exportData = readExportedData()
    log(`✓ Export file loaded`, 'green')
    log(`  Export date: ${exportData.exportDate}`, 'cyan')
    log(`  Tables: ${Object.keys(exportData.tables).length}`, 'cyan')
    log(`  Total records: ${Object.values(exportData.tables).reduce((sum, arr) => sum + arr.length, 0)}`, 'cyan')

    // Step 2: Authenticate
    logSection('Step 2: Authenticating')
    const token = await authenticate()

    // Step 3: Migrate tables
    logSection('Step 3: Migrating Data')
    const stats = await migrateTables(exportData, token)

    // Step 4: Generate report
    generateReport(stats, exportData)

  } catch (error) {
    log(`❌ Migration failed: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  }
}

// Run migration
main()
