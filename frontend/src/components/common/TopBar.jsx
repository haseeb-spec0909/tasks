import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Search, Plus, Bell, Menu } from 'lucide-react'
import clsx from 'clsx'

/**
 * Top bar component with search, actions, and user menu
 */
export default function TopBar({ onMenuToggle, sidebarOpen }) {
  const { user, signOut } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = user?.displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
        {/* Left section - Menu toggle + Search */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="hidden md:flex items-center gap-2 flex-1 max-w-sm">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks, projects..."
              className="flex-1 bg-transparent border-0 text-sm placeholder-gray-400 focus:ring-0"
            />
          </div>
        </div>

        {/* Right section - Actions + User menu */}
        <div className="flex items-center gap-4">
          {/* New Task button */}
          <button className="hidden sm:flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            <Plus size={18} />
            New Task
          </button>

          {/* Notifications */}
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-2 py-1 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <div className="hidden sm:block text-sm text-right">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {user?.displayName || 'User'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </div>
              </div>
            </button>

            {/* User menu dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {user?.displayName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </div>
                </div>

                <a
                  href="/settings"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Settings
                </a>

                <button
                  onClick={() => {
                    signOut()
                    setUserMenuOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
