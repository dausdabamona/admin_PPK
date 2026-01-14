import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  MapPin,
  UserCog,
  FileText,
  Plane,
  Wallet,
  ClipboardCheck,
  CheckSquare,
  Settings,
  Database,
  ChevronDown,
  ChevronRight,
  Building2,
  FolderKanban,
  UsersRound,
  Banknote,
  Receipt,
  Calculator,
  ListChecks,
  UserCheck,
  FileSignature,
  CalendarDays,
  ClipboardList,
  Star,
  FolderArchive,
  Shield,
  Package,
  Store,
  FileSearch,
  HeartHandshake,
  Truck,
  Award,
  BarChart3
} from 'lucide-react'
import { useState, useEffect } from 'react'

const menuItems = [
  {
    name: 'Dashboard',
    path: '/',
    icon: LayoutDashboard
  },
  {
    name: 'Master Data',
    icon: Database,
    submenu: [
      { name: 'Pegawai', path: '/master/pegawai', icon: Users },
      { name: 'Kota & SBM', path: '/master/kota', icon: MapPin },
      { name: 'Pejabat', path: '/master/pejabat', icon: UserCog }
    ]
  },
  {
    name: 'Perjalanan Dinas',
    icon: Plane,
    submenu: [
      { name: 'Surat Tugas', path: '/surat-tugas', icon: FileText },
      { name: 'SPPD', path: '/sppd', icon: FileText },
      { name: 'Pembayaran LS', path: '/pembayaran-ls', icon: Wallet },
      { name: 'Rampung', path: '/rampung', icon: ClipboardCheck },
      { name: 'Checklist SPJ', path: '/checklist', icon: CheckSquare }
    ]
  },
  {
    name: 'Swakelola',
    icon: FolderKanban,
    submenu: [
      { name: 'Data Kegiatan', path: '/swakelola/kegiatan', icon: FolderKanban },
      { name: 'Tim Swakelola', path: '/swakelola/tim', icon: UsersRound },
      { name: 'Uang Muka', path: '/swakelola/uang-muka', icon: Banknote },
      { name: 'Realisasi', path: '/swakelola/realisasi', icon: Receipt },
      { name: 'Rampung', path: '/swakelola/rampung', icon: Calculator }
    ]
  },
  {
    name: 'PJLP',
    icon: UserCheck,
    submenu: [
      { name: 'Data PJLP', path: '/pjlp/master', icon: Users },
      { name: 'Perencanaan', path: '/pjlp/perencanaan', icon: ClipboardList },
      { name: 'Kontrak', path: '/pjlp/kontrak', icon: FileSignature },
      { name: 'Presensi', path: '/pjlp/presensi', icon: CalendarDays },
      { name: 'Pembayaran', path: '/pjlp/pembayaran', icon: Wallet },
      { name: 'Penilaian Triwulan', path: '/pjlp/penilaian', icon: Star },
      { name: 'Checklist SPJ', path: '/pjlp/checklist', icon: ListChecks },
      { name: 'Arsip Dokumen', path: '/pjlp/arsip', icon: FolderArchive }
    ]
  },
  {
    name: 'Pengadaan Langsung',
    icon: Package,
    submenu: [
      { name: 'Master Paket', path: '/pengadaan/paket', icon: Package },
      { name: 'Master Penyedia', path: '/pengadaan/penyedia', icon: Store },
      { name: 'Perencanaan', path: '/pengadaan/perencanaan', icon: FileSearch },
      { name: 'Kontrak & SPMK', path: '/pengadaan/kontrak', icon: HeartHandshake },
      { name: 'Serah Terima', path: '/pengadaan/serah-terima', icon: Truck },
      { name: 'Pembayaran', path: '/pengadaan/pembayaran', icon: Wallet },
      { name: 'Checklist SPJ', path: '/pengadaan/checklist', icon: ListChecks }
    ]
  },
  {
    name: 'Honorarium',
    icon: Award,
    submenu: [
      { name: 'Master Penerima', path: '/honorarium/master', icon: Users },
      { name: 'Dasar Penugasan', path: '/honorarium/penugasan', icon: FileSignature },
      { name: 'Daftar Nominatif', path: '/honorarium/nominatif', icon: ClipboardList },
      { name: 'Kwitansi', path: '/honorarium/kwitansi', icon: Receipt },
      { name: 'Rekap Pembayaran', path: '/honorarium/rekap', icon: BarChart3 }
    ]
  },
  {
    name: 'Audit Control',
    path: '/audit',
    icon: Shield
  },
  {
    name: 'Pengaturan',
    path: '/settings',
    icon: Settings
  }
]

// Check if any submenu item is active
const isSubmenuActive = (submenu, currentPath) => {
  return submenu?.some(item => currentPath.startsWith(item.path))
}

// Find which menu should be open based on current path
const getActiveMenuName = (currentPath) => {
  for (const item of menuItems) {
    if (item.submenu && isSubmenuActive(item.submenu, currentPath)) {
      return item.name
    }
  }
  return null
}

function MenuItem({ item, isOpen, onToggle, currentPath }) {
  const hasSubmenu = item.submenu && item.submenu.length > 0
  const Icon = item.icon
  const isActive = hasSubmenu && isSubmenuActive(item.submenu, currentPath)

  if (hasSubmenu) {
    return (
      <div className="mb-1">
        <button
          onClick={onToggle}
          className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
            isActive
              ? 'text-primary-700 bg-primary-50'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : ''}`} />
            <span>{item.name}</span>
          </div>
          {isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Only show submenu if open */}
        {isOpen && (
          <div className="ml-4 mt-1 space-y-1">
            {item.submenu.map((subItem) => {
              const SubIcon = subItem.icon
              return (
                <NavLink
                  key={subItem.path}
                  to={subItem.path}
                  className={({ isActive }) =>
                    isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
                  }
                >
                  <SubIcon className="w-4 h-4" />
                  <span>{subItem.name}</span>
                </NavLink>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
      }
    >
      <Icon className="w-5 h-5" />
      <span>{item.name}</span>
    </NavLink>
  )
}

export default function Sidebar() {
  const location = useLocation()
  const currentPath = location.pathname

  // Initialize with only the active menu open
  const [openMenus, setOpenMenus] = useState(() => {
    const activeMenu = getActiveMenuName(currentPath)
    const initial = {}
    menuItems.forEach(item => {
      if (item.submenu) {
        initial[item.name] = item.name === activeMenu
      }
    })
    return initial
  })

  // Update open menus when route changes
  useEffect(() => {
    const activeMenu = getActiveMenuName(currentPath)
    if (activeMenu) {
      setOpenMenus(prev => {
        // Close all others, open only the active one
        const newState = {}
        menuItems.forEach(item => {
          if (item.submenu) {
            newState[item.name] = item.name === activeMenu
          }
        })
        return newState
      })
    }
  }, [currentPath])

  const toggleMenu = (menuName) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName]
    }))
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo / Header */}
      <div className="px-4 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">SIPBJ & SPJ</h1>
            <p className="text-xs text-gray-500">PKP Sorong</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <MenuItem
              key={item.name}
              item={item}
              isOpen={openMenus[item.name]}
              onToggle={() => toggleMenu(item.name)}
              currentPath={currentPath}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Offline Ready</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">v5.0.0</p>
      </div>
    </aside>
  )
}
