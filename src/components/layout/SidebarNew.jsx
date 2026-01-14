// Sidebar Navigation Component - Workflow-Oriented
import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  DollarSign,
  FileText,
  Building2,
  Plane,
  Users,
  Archive,
  Settings,
  Database,
  WifiOff,
  ChevronRight
} from 'lucide-react'

/**
 * Sidebar Baru - Berbasis Jenis Pekerjaan
 *
 * Prinsip:
 * - Sederhana: 5 jenis pekerjaan utama + utilitas
 * - Tidak ada submenu berlapis
 * - Fokus pada workflow, bukan CRUD
 */
const SidebarNew = () => {
  const location = useLocation()

  const menuItems = [
    {
      section: 'Beranda',
      items: [
        {
          name: 'Beranda',
          path: '/',
          icon: Home,
          description: 'Dashboard utama'
        }
      ]
    },
    {
      section: 'Jenis Pekerjaan',
      items: [
        {
          name: 'UP / TUP',
          path: '/proses/up-tup',
          icon: DollarSign,
          description: 'Uang Persediaan & TUP'
        },
        {
          name: 'LS Kontrak',
          path: '/proses/ls-kontrak',
          icon: FileText,
          description: 'Pembayaran LS Kontrak'
        },
        {
          name: 'Swakelola',
          path: '/proses/swakelola',
          icon: Building2,
          description: 'Belanja Swakelola'
        },
        {
          name: 'Perjalanan Dinas',
          path: '/proses/perjalanan-dinas',
          icon: Plane,
          description: 'Perjalanan Dinas'
        },
        {
          name: 'Honor / PJLP',
          path: '/proses/honor-pjlp',
          icon: Users,
          description: 'Honorarium & PJLP'
        }
      ]
    },
    {
      section: 'Utilitas',
      items: [
        {
          name: 'Arsip SPJ',
          path: '/arsip',
          icon: Archive,
          description: 'Arsip paket SPJ'
        },
        {
          name: 'Master Data',
          path: '/master',
          icon: Database,
          description: 'Data pegawai, kota, pejabat'
        },
        {
          name: 'Pengaturan',
          path: '/settings',
          icon: Settings,
          description: 'Pengaturan aplikasi'
        }
      ]
    }
  ]

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="w-64 bg-white shadow-lg h-screen sticky top-0 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Asisten Digital</h1>
        <p className="text-sm text-gray-600">PPK</p>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-6">
        {menuItems.map((section, idx) => (
          <div key={idx} className="mb-6">
            {/* Section Header */}
            <div className="px-6 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.section}
              </h3>
            </div>

            {/* Section Items */}
            <div className="space-y-1 px-3">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive: navIsActive }) => {
                    const active = navIsActive || isActive(item.path)
                    return `
                      group flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-200
                      ${active
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `
                  }}
                >
                  {({ isActive: navIsActive }) => {
                    const active = navIsActive || isActive(item.path)
                    const IconComponent = item.icon

                    return (
                      <>
                        <IconComponent
                          className={`w-5 h-5 flex-shrink-0 ${
                            active ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm truncate ${
                            active ? 'text-white' : ''
                          }`}>
                            {item.name}
                          </div>
                          {item.description && (
                            <div className={`text-xs truncate ${
                              active ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {item.description}
                            </div>
                          )}
                        </div>
                        {active && (
                          <ChevronRight className="w-4 h-4 text-white flex-shrink-0" />
                        )}
                      </>
                    )
                  }}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {/* Offline Indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Mode Offline Aktif</span>
        </div>

        {/* Version */}
        <div className="text-xs text-gray-400">
          Versi 6.0.0 - Workflow Edition
        </div>
      </div>
    </aside>
  )
}

export default SidebarNew
