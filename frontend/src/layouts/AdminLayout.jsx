import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Monitor, Users, MapPin, Route, Bell,
  FileText, LogOut, Menu, X, Sun, Moon, Layers,
  ChevronLeft, ChevronRight, Shield, Building2
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/organizations', icon: Building2, label: 'Organizations', adminOnly: true },
  { path: '/devices', icon: Monitor, label: 'Devices' },
  { path: '/users', icon: Users, label: 'Users', adminOnly: true },
  { path: '/regions', icon: MapPin, label: 'Regions', adminOnly: true },
  { path: '/routes', icon: Route, label: 'Routes' },
  { path: '/alerts', icon: Bell, label: 'Alerts' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/audit-logs', icon: Shield, label: 'Audit Logs', adminOnly: true },
];

export default function AdminLayout() {
  const { user, logout, isAdmin, isImpersonating, exitPortal, realUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-alt">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ===== Sidebar ===== */}
      <aside
        className={`
          fixed lg:relative z-50 h-full flex flex-col
          transition-all duration-300 ease-in-out gradient-sidebar
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-[68px]' : 'w-[256px]'}
        `}
      >
        {/* Logo bar */}
        <div className="flex items-center h-16 px-4 border-b border-white/[0.06]">
          {!collapsed && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-sm shrink-0 animate-pulse-glow">
                B
              </div>
              <div className="min-w-0">
                <div className="text-white font-bold text-sm leading-tight truncate">BMC IoT</div>
                <div className="text-gray-500 text-[10px] leading-tight">Monitoring</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-sm mx-auto animate-pulse-glow">
              B
            </div>
          )}
          {/* Desktop toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:text-white p-1.5 rounded-lg transition-colors hidden lg:flex items-center justify-center ml-auto shrink-0"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="text-gray-500 hover:text-white p-1.5 rounded-lg transition-colors lg:hidden ml-auto"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2.5 space-y-0.5 overflow-y-auto">
          {!collapsed && (
            <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-gray-600 px-3 mb-3">
              Menu
            </div>
          )}
          {filteredNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) => {
                const base = 'flex items-center rounded-xl text-[13px] font-medium transition-all duration-200';
                const layout = collapsed
                  ? 'justify-center w-11 h-11 mx-auto'
                  : 'gap-3 px-3 py-2.5';
                const color = isActive
                  ? 'bg-brand text-white shadow-[0_4px_16px_rgba(37,99,235,0.25)]'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]';
                return `${base} ${layout} ${color}`;
              }}
            >
              <item.icon size={18} strokeWidth={1.8} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/[0.06]">
          {!collapsed ? (
            <div className="flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-white/[0.04] transition-colors">
              <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-white font-bold text-xs shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-gray-600 text-[11px] truncate capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-rose transition-colors p-1 shrink-0"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-white font-bold text-xs">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ===== Main content area ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Impersonation warning banner */}
        {isImpersonating && (
          <div className="bg-amber-500 text-black px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm">⚠️</span>
              <span>
                Viewing portal as: <strong>{user?.name}</strong> ({user?.email}). You are logged in as <strong>{realUser?.name}</strong>.
              </span>
            </div>
            <button
              onClick={exitPortal}
              className="bg-black text-white px-3 py-1 rounded-lg text-[10px] font-bold uppercase hover:bg-black/80 transition-colors"
            >
              Exit Portal
            </button>
          </div>
        )}

        {/* Top header */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 bg-surface border-b border-edge shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-t-primary hover:bg-surface-dim transition-colors"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-sm font-semibold text-t-secondary tracking-wide">
              Milk BMC Monitoring
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-surface-dim text-t-muted hover:text-t-primary hover:scale-105 transition-all duration-200"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="p-2 rounded-xl bg-surface-dim text-t-muted hover:text-t-primary hover:scale-105 transition-all duration-200 relative">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-surface-dim text-t-muted hover:text-rose hover:scale-105 transition-all duration-200"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
