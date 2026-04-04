import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  Home,
  CheckSquare,
  BarChart3,
  Zap,
  Flame,
  TrendingUp,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import clsx from 'clsx'

/**
 * Sidebar navigation component
 */
export default function Sidebar({ open, onToggle, isMobile }) {
  const location = useLocation()
  const { signOut } = useAuth()

  const navItems = [
    { href: '/', label: 'Planner', icon: Home },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/priorities', label: 'Priorities', icon: BarChart3 },
    { href: '/focus', label: 'Focus', icon: Zap },
    { href: '/habits', label: 'Habits', icon: Flame },
    { href: '/stats', label: 'Stats', icon: TrendingUp },
    { href: '/team', label: 'Team', icon: Users, role: 'manager' },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  const isActive = (href) => location.pathname === href

  return (
    <>
      {/* Sidebar overlay for mobile */}
      {isMobile && open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed md:relative top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 z-50 flex flex-col',
          open ? 'w-64' : 'w-20',
          isMobile && !open && '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          {open && <h1 className="text-xl font-bold text-blue-600">TimeIntel</h1>}
          {!isMobile && (
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              {open ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive(item.href)
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
              title={!open ? item.label : ''}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {open && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            title={!open ? 'Sign out' : ''}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {open && <span className="text-sm font-medium">Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
