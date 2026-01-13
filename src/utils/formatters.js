// Format currency to Indonesian Rupiah
export function formatRupiah(number) {
  if (number === null || number === undefined) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number)
}

// Format number with thousand separator
export function formatNumber(number) {
  if (number === null || number === undefined) return '0'
  return new Intl.NumberFormat('id-ID').format(number)
}

// Parse Indonesian currency string to number
export function parseRupiah(str) {
  if (!str) return 0
  return parseInt(str.replace(/[^0-9]/g, ''), 10) || 0
}

// Format date to Indonesian format
export function formatTanggal(date, format = 'long') {
  if (!date) return '-'

  const d = new Date(date)
  const options = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  }

  return d.toLocaleDateString('id-ID', options[format] || options.long)
}

// Format date to YYYY-MM-DD for input fields
export function formatDateInput(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

// Terbilang - Convert number to Indonesian words
export function terbilang(angka) {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima',
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ]

  if (angka < 12) {
    return bilangan[angka]
  } else if (angka < 20) {
    return terbilang(angka - 10) + ' Belas'
  } else if (angka < 100) {
    return terbilang(Math.floor(angka / 10)) + ' Puluh ' + terbilang(angka % 10)
  } else if (angka < 200) {
    return 'Seratus ' + terbilang(angka - 100)
  } else if (angka < 1000) {
    return terbilang(Math.floor(angka / 100)) + ' Ratus ' + terbilang(angka % 100)
  } else if (angka < 2000) {
    return 'Seribu ' + terbilang(angka - 1000)
  } else if (angka < 1000000) {
    return terbilang(Math.floor(angka / 1000)) + ' Ribu ' + terbilang(angka % 1000)
  } else if (angka < 1000000000) {
    return terbilang(Math.floor(angka / 1000000)) + ' Juta ' + terbilang(angka % 1000000)
  } else if (angka < 1000000000000) {
    return terbilang(Math.floor(angka / 1000000000)) + ' Milyar ' + terbilang(angka % 1000000000)
  } else if (angka < 1000000000000000) {
    return terbilang(Math.floor(angka / 1000000000000)) + ' Triliun ' + terbilang(angka % 1000000000000)
  }

  return ''
}

// Terbilang dengan format Rupiah
export function terbilangRupiah(angka) {
  if (angka === 0) return 'Nol Rupiah'
  return terbilang(angka).trim().replace(/\s+/g, ' ') + ' Rupiah'
}

// Calculate days between two dates
export function hitungHari(tanggalMulai, tanggalSelesai) {
  if (!tanggalMulai || !tanggalSelesai) return 0
  const start = new Date(tanggalMulai)
  const end = new Date(tanggalSelesai)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays
}

// Generate random ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Capitalize first letter
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Truncate text
export function truncate(str, length = 50) {
  if (!str) return ''
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}

// Get current year
export function getCurrentYear() {
  return new Date().getFullYear()
}

// Get current month (1-12)
export function getCurrentMonth() {
  return new Date().getMonth() + 1
}

// Pad number with zeros
export function padNumber(num, length = 3) {
  return String(num).padStart(length, '0')
}

// Alias for terbilang (angkaTerbilang)
export function angkaTerbilang(angka) {
  if (angka === 0) return 'nol'
  return terbilang(angka).trim().replace(/\s+/g, ' ').toLowerCase()
}
