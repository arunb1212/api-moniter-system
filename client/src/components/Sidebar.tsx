import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Activity, LayoutDashboard, LogOut, PlusCircle, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: PlusCircle, label: 'Add API', path: '/add' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { username, email, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-slate-950/90 backdrop-blur-xl border-r border-white/[0.06] flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/20">
          <Activity className="h-5 w-5 text-white" />
          <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
        </div>
        <div>
          <p className="font-bold text-sm text-white leading-tight">API Monitor</p>
          <p className="text-[10px] text-slate-500 leading-tight">Performance Tracker</p>
        </div>
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-cyan-400' : 'text-slate-500')} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + Footer */}
      <div className="px-3 pb-4">
        <Separator className="mb-3" />

        {/* Interval hint */}
        <div className="flex items-center gap-2 px-3 mb-3">
          <Zap className="h-3.5 w-3.5 text-cyan-500" />
          <span className="text-xs text-slate-500">Per-API ping intervals</span>
        </div>

        {/* User info + logout */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase">
              {username?.[0] ?? 'A'}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-200 leading-tight">{username ?? 'Admin'}</p>
              <p className="text-[10px] text-slate-500 leading-tight truncate max-w-28">{email ?? 'Administrator'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
            id="btn-logout"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
