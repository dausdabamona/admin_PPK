const variants = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  default: 'badge bg-gray-100 text-gray-800'
}

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

// Status badge with predefined mappings
export function StatusBadge({ status }) {
  const statusConfig = {
    draft: { label: 'Draft', variant: 'default' },
    pending: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Disetujui', variant: 'success' },
    rejected: { label: 'Ditolak', variant: 'danger' },
    completed: { label: 'Selesai', variant: 'success' },
    proses: { label: 'Proses', variant: 'info' },
    kurang: { label: 'Kurang Bayar', variant: 'danger' },
    lebih: { label: 'Lebih Bayar', variant: 'warning' },
    nihil: { label: 'Nihil', variant: 'success' },
    lengkap: { label: 'Lengkap', variant: 'success' },
    belum_lengkap: { label: 'Belum Lengkap', variant: 'warning' }
  }

  const config = statusConfig[status] || { label: status, variant: 'default' }

  return <Badge variant={config.variant}>{config.label}</Badge>
}
