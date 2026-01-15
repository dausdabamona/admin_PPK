#!/usr/bin/env node

/**
 * Server Setup Verification Script
 *
 * Checks if all required files and directories are present
 * before starting the server.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath)
  const status = exists ? '✓' : '✗'
  const color = exists ? 'green' : 'red'
  log(`  ${status} ${description}`, color)
  return exists
}

function checkDirectory(dirPath, description) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()
  const status = exists ? '✓' : '✗'
  const color = exists ? 'green' : 'red'
  log(`  ${status} ${description}`, color)
  return exists
}

console.log('')
log('═'.repeat(60), 'cyan')
log('  Server Setup Verification', 'cyan')
log('═'.repeat(60), 'cyan')
console.log('')

let allChecksPass = true

// Check required files
log('Required Files:', 'cyan')
allChecksPass &= checkFile(path.join(__dirname, 'package.json'), 'package.json')
allChecksPass &= checkFile(path.join(__dirname, '.env.example'), '.env.example')
allChecksPass &= checkFile(path.join(__dirname, 'src/server.js'), 'src/server.js')
console.log('')

// Check configuration
log('Configuration:', 'cyan')
allChecksPass &= checkFile(path.join(__dirname, 'src/config/database.js'), 'Database config')
allChecksPass &= checkFile(path.join(__dirname, 'src/config/logger.js'), 'Logger config')
console.log('')

// Check models
log('Models:', 'cyan')
allChecksPass &= checkFile(path.join(__dirname, 'src/models/User.js'), 'User model')
allChecksPass &= checkFile(path.join(__dirname, 'src/models/MasterDipa.js'), 'MasterDipa model')
allChecksPass &= checkFile(path.join(__dirname, 'src/models/DipaRevision.js'), 'DipaRevision model')
allChecksPass &= checkFile(path.join(__dirname, 'src/models/SPJPackage.js'), 'SPJPackage model')
allChecksPass &= checkFile(path.join(__dirname, 'src/models/index.js'), 'Models index')
console.log('')

// Check controllers
log('Controllers:', 'cyan')
allChecksPass &= checkFile(path.join(__dirname, 'src/controllers/auth.controller.js'), 'Auth controller')
allChecksPass &= checkFile(path.join(__dirname, 'src/controllers/dipa.controller.js'), 'DIPA controller')
allChecksPass &= checkFile(path.join(__dirname, 'src/controllers/upload.controller.js'), 'Upload controller')
console.log('')

// Check routes
log('Routes:', 'cyan')
allChecksPass &= checkFile(path.join(__dirname, 'src/routes/auth.routes.js'), 'Auth routes')
allChecksPass &= checkFile(path.join(__dirname, 'src/routes/dipa.routes.js'), 'DIPA routes')
allChecksPass &= checkFile(path.join(__dirname, 'src/routes/upload.routes.js'), 'Upload routes')
allChecksPass &= checkFile(path.join(__dirname, 'src/routes/index.js'), 'Routes index')
console.log('')

// Check middleware
log('Middleware:', 'cyan')
allChecksPass &= checkFile(path.join(__dirname, 'src/middleware/auth.middleware.js'), 'Auth middleware')
allChecksPass &= checkFile(path.join(__dirname, 'src/middleware/upload.middleware.js'), 'Upload middleware')
allChecksPass &= checkFile(path.join(__dirname, 'src/middleware/validation.middleware.js'), 'Validation middleware')
allChecksPass &= checkFile(path.join(__dirname, 'src/middleware/errorHandler.middleware.js'), 'Error handler')
console.log('')

// Check directories
log('Directories:', 'cyan')
allChecksPass &= checkDirectory(path.join(__dirname, 'src'), 'src/')
allChecksPass &= checkDirectory(path.join(__dirname, 'uploads'), 'uploads/')
allChecksPass &= checkDirectory(path.join(__dirname, 'uploads/documents'), 'uploads/documents/')
allChecksPass &= checkDirectory(path.join(__dirname, 'uploads/photos'), 'uploads/photos/')
console.log('')

// Check .env
log('Environment:', 'cyan')
const envExists = checkFile(path.join(__dirname, '.env'), '.env file')
if (!envExists) {
  log('  ⚠️  Please create .env file from .env.example', 'yellow')
  log('     cp .env.example .env', 'yellow')
}
console.log('')

// Final result
log('═'.repeat(60), 'cyan')
if (allChecksPass && envExists) {
  log('  ✓ All checks passed! Server is ready to start.', 'green')
  log('  Run: npm install && npm start', 'cyan')
} else if (allChecksPass && !envExists) {
  log('  ⚠️  Setup incomplete. Create .env file to continue.', 'yellow')
} else {
  log('  ✗ Some checks failed. Please review the errors above.', 'red')
}
log('═'.repeat(60), 'cyan')
console.log('')

process.exit(allChecksPass ? 0 : 1)
