import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children, title = 'Dashboard' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:ml-64">
        <Header
          title={title}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
