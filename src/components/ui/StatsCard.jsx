export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'primary'
}) {
  const colorClasses = {
    primary: {
      bg: 'bg-primary-50',
      icon: 'text-primary-600',
      text: 'text-primary-600'
    },
    success: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      text: 'text-green-600'
    },
    warning: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      text: 'text-yellow-600'
    },
    danger: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      text: 'text-red-600'
    },
    info: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      text: 'text-blue-600'
    }
  }

  const colors = colorClasses[color] || colorClasses.primary

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className={`mt-2 flex items-center text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? (
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>
        )}
      </div>
    </div>
  )
}
