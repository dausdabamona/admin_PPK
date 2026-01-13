import { forwardRef } from 'react'

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helper,
    className = '',
    required = false,
    ...props
  },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={`input ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
      {helper && !error && (
        <p className="mt-1 text-xs text-gray-500">{helper}</p>
      )}
    </div>
  )
})

export const Select = forwardRef(function Select(
  {
    label,
    error,
    helper,
    options = [],
    placeholder = 'Pilih...',
    className = '',
    required = false,
    ...props
  },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`select ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
      {helper && !error && (
        <p className="mt-1 text-xs text-gray-500">{helper}</p>
      )}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helper,
    className = '',
    required = false,
    rows = 3,
    ...props
  },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`input ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
      {helper && !error && (
        <p className="mt-1 text-xs text-gray-500">{helper}</p>
      )}
    </div>
  )
})

export const Checkbox = forwardRef(function Checkbox(
  {
    label,
    error,
    className = '',
    ...props
  },
  ref
) {
  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          ref={ref}
          type="checkbox"
          className={`w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 focus:ring-2 ${className}`}
          {...props}
        />
      </div>
      {label && (
        <label className="ml-2 text-sm text-gray-700">
          {label}
        </label>
      )}
      {error && (
        <p className="ml-2 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
})

export const CurrencyInput = forwardRef(function CurrencyInput(
  {
    label,
    error,
    helper,
    className = '',
    required = false,
    value,
    onChange,
    name,
    ...props
  },
  ref
) {
  const formatCurrency = (val) => {
    if (!val || val === '0' || val === 0) return ''
    const num = val.toString().replace(/[^0-9]/g, '')
    if (!num || num === '0') return ''
    return new Intl.NumberFormat('id-ID').format(num)
  }

  const handleChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '')
    // Use name from props to ensure it's always available
    const fieldName = name || e.target.name
    onChange && onChange({
      target: {
        name: fieldName,
        value: rawValue
      }
    })
  }

  return (
    <div className="w-full">
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
          Rp
        </span>
        <input
          ref={ref}
          type="text"
          name={name}
          value={formatCurrency(value)}
          onChange={handleChange}
          className={`input pl-10 ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
      {helper && !error && (
        <p className="mt-1 text-xs text-gray-500">{helper}</p>
      )}
    </div>
  )
})
