/**
 * Sidebar del panel de administración — Rediseño Estilo Municipal.
 * Navegación organizada en categorías con estética institucional.
 */

import { memo } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  PawPrint,
  Hourglass,
  Heart,
  Users,
  UserPlus,
  LogOut,
  ChevronLeft,
  Menu,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/constants'
import { useState } from 'react'

const navGroups = [
  {
    title: 'GENERAL',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Panel de Control', end: true },
    ],
  },
  {
    title: 'ADMINISTRACIÓN',
    items: [
      { to: '/admin/pets', icon: PawPrint, label: 'Gestión de mascotas', end: false },
      { to: '/admin/in-process', icon: Hourglass, label: 'En proceso de adopción', end: false },
      { to: '/admin/adopted', icon: Heart, label: 'Mascotas adoptadas', end: false },
    ],
  },
]

const userGroups = [
  {
    title: 'USUARIOS',
    items: [
      { to: '/admin/users', icon: Users, label: 'Usuarios', end: true },
      { to: '/admin/users/new', icon: UserPlus, label: 'Nuevo Usuario', end: false },
    ],
  },
]

function AdminSidebarInner() {
  const { profile, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const NavItem = ({ to, icon: Icon, label, end }: { to: string; icon: any; label: string; end: boolean }) => (
    <NavLink 
      to={to} 
      end={end}
      onClick={() => setIsMobileOpen(false)}
      className={({ isActive }) => `
        group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300
        ${isActive 
          ? 'active gradient-molina text-white shadow-md shadow-primary-600/20' 
          : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'}
      `}
    >
      <div className={`
        flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300
        ${isCollapsed ? 'mx-auto' : ''}
        group-[.active]:bg-white/10
        group-[:not(.active)]:bg-surface-100 group-[:not(.active)]:text-surface-500
      `}>
        <Icon className="h-4 w-4" />
      </div>
      {!isCollapsed && <span className="text-[13px] font-medium">{label}</span>}
    </NavLink>
  )

  const sidebarContent = (
    <div className="flex min-h-0 h-full flex-col">
      {/* Header con Logo */}
      <div className="flex h-28 items-center justify-center border-b border-surface-100 px-6">
        <img 
          src="/logo-login.png" 
          alt="Molina" 
          className={`h-20 w-auto object-contain transition-all duration-300 ${isCollapsed ? 'scale-75' : ''}`}
        />
      </div>

      {/* Navegación Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-7 last:mb-0">
            {!isCollapsed && (
              <p className="mb-4 px-3 text-[11px] font-bold tracking-[0.15em] text-surface-400">
                {group.title}
              </p>
            )}
            <div className="space-y-2">
              {group.items.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </div>
          </div>
        ))}

        {isAdmin && userGroups.map((group) => (
          <div key={group.title} className="mt-8 mb-8 last:mb-0">
            {!isCollapsed && (
              <p className="mb-4 px-3 text-[11px] font-bold tracking-[0.15em] text-surface-400">
                {group.title}
              </p>
            )}
            <div className="space-y-2">
              {group.items.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer: User Profile Card */}
      <div className="border-t border-surface-100 p-4">
        <div className={`
          flex items-center gap-3 rounded-2xl border border-surface-100 bg-white p-3 shadow-sm
          ${isCollapsed ? 'justify-center' : ''}
        `}>
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-600 shadow-md">
            <span className="text-xs font-medium text-white uppercase">
              {profile?.first_name?.charAt(0)}
              {profile?.last_name?.charAt(0)}
            </span>
          </div>

          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-primary-900 leading-tight">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-[10px] font-medium text-surface-400 uppercase tracking-tight">
                  {ROLE_LABELS[profile?.role || 'staff']}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
        
        {/* Toggle Collapse Desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-4 hidden w-full items-center justify-center gap-2 rounded-xl py-2 text-[11px] font-medium uppercase tracking-wider text-surface-300 transition-colors hover:bg-surface-50 hover:text-surface-500 lg:flex"
        >
          {isCollapsed ? <ChevronLeft className="h-4 w-4 rotate-180" /> : <ChevronLeft className="h-4 w-4" />}
          {!isCollapsed && <span>Contraer menú</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-2xl bg-white p-3 shadow-xl lg:hidden border border-surface-100"
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6 text-surface-700" />
      </button>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-surface-900/60 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col border-r border-surface-100 bg-white transition-all duration-500 ease-in-out
          ${isCollapsed ? 'w-[72px]' : 'w-[255px]'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:h-full lg:max-h-none lg:shrink-0 lg:translate-x-0`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}

export const AdminSidebar = memo(AdminSidebarInner)
