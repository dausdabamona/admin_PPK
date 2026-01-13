import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Table({ children, className = '' }) {
  return (
    <div className="table-container">
      <table className={`table ${className}`}>
        {children}
      </table>
    </div>
  )
}

export function TableHead({ children }) {
  return <thead className="bg-gray-50">{children}</thead>
}

export function TableBody({ children }) {
  return <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
}

export function TableRow({ children, className = '', onClick }) {
  return (
    <tr
      className={`${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function TableHeader({ children, className = '' }) {
  return <th className={className}>{children}</th>
}

export function TableCell({ children, className = '' }) {
  return <td className={className}>{children}</td>
}

// Empty state component
export function TableEmpty({ message = 'Tidak ada data', colSpan = 1 }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-gray-500">
        <div className="flex flex-col items-center">
          <svg
            className="w-12 h-12 text-gray-300 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm">{message}</p>
        </div>
      </td>
    </tr>
  )
}

// Pagination component
export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      <div className="text-sm text-gray-500">
        Menampilkan <span className="font-medium">{startItem}</span> -{' '}
        <span className="font-medium">{endItem}</span> dari{' '}
        <span className="font-medium">{totalItems}</span> data
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm text-gray-600">
          Halaman {currentPage} dari {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
