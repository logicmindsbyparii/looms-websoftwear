import React from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  LayoutDashboard,
  Cpu,
  Sliders,
  Boxes,
  AlertTriangle,
  Users,
  Layers,
  Briefcase,
  TrendingUp,
  Activity,
  Wrench,
  Zap,
  Gauge,
  X,
  Plus,
  Database,
  UserCheck,
  QrCode
} from 'lucide-react';

export default function Sidebar() {
  const {
    activeTab,
    setActiveTab,
    userRole,
    currentUser,
    logout,
    machines,
    alarms,
    powerLoadPercent,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    setIsAddMachineOpen,
    setIsDataManagerOpen,
    isSidebarCollapsed,
    toggleSidebar
  } = useApp();
  const { t } = useTranslation();

  const runningCount = (machines || []).filter(m => m?.status === 'running').length;
  const stoppedCount = (machines || []).filter(m => m?.status === 'stopped').length;
  const idleCount = (machines || []).filter(m => m?.status === 'idle' || m?.status === 'maintenance').length;

  // Role-tailored navigation items
  const adminNav = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'machines', label: t('nav.machines'), icon: Cpu, badge: `${runningCount}/${machines.length}` },
    { id: 'control', label: t('nav.control'), icon: Sliders },
    { id: 'production', label: t('nav.production'), icon: Boxes },
    { id: 'alarms', label: t('nav.alarms'), icon: AlertTriangle, badge: alarms.length > 0 ? alarms.length : null, badgeColor: 'bg-rose-500 text-white' },
    { id: 'workers', label: t('nav.workers'), icon: Users },
    { id: 'rawmaterial', label: t('nav.rawmaterial'), icon: Layers },
    { id: 'sales', label: t('nav.sales'), icon: Briefcase },
    { id: 'rolls', label: t('nav.rolls') || 'Rolls & QR Tracking', icon: QrCode },
    { id: 'analytics', label: t('nav.analytics'), icon: TrendingUp },
    { id: 'users', label: t('nav.users'), icon: UserCheck }
  ];

  const supervisorNav = [
    { id: 'supervisor-floor', label: t('nav.supervisorFloor'), icon: Activity },
    { id: 'machines', label: t('nav.machines'), icon: Cpu, badge: `${runningCount}/${machines.length}` },
    { id: 'production', label: t('nav.production'), icon: Boxes },
    { id: 'alarms', label: t('nav.alarms'), icon: AlertTriangle, badge: alarms.length > 0 ? alarms.length : null, badgeColor: 'bg-rose-500 text-white' },
    { id: 'workers', label: t('nav.workers'), icon: Users },
    { id: 'rawmaterial', label: t('nav.rawmaterial'), icon: Layers },
    { id: 'rolls', label: t('nav.rolls') || 'Rolls & QR Tracking', icon: QrCode },
  ];

  const operatorNav = [
    { id: 'operator-console', label: t('nav.operatorConsole'), icon: Wrench },
    { id: 'machines', label: t('nav.machines'), icon: Cpu },
    { id: 'control', label: t('nav.control'), icon: Sliders },
    { id: 'production', label: t('nav.production'), icon: Boxes },
    { id: 'alarms', label: t('nav.alarms'), icon: AlertTriangle, badge: alarms.length > 0 ? alarms.length : null, badgeColor: 'bg-rose-500 text-white' },
  ];

  let currentNav = adminNav;
  if (userRole === 'Supervisor') currentNav = supervisorNav;
  else if (userRole === 'Operator') currentNav = operatorNav;

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const renderNavLinks = (collapsed = false) => (
    <div className={`flex-1 overflow-y-auto modern-scrollbar ${collapsed ? 'px-1.5 py-2' : 'px-3 py-3'} space-y-1 min-h-0`}>
      <nav className="space-y-1">
        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (collapsed) {
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={item.label}
                className={`relative group w-full flex items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-700'}`} />
                {item.badge && (
                  <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`group w-full flex items-center justify-between pl-3 pr-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left border-l-4 ${
                isActive
                  ? 'bg-sky-50 text-sky-900 border-sky-600 font-extrabold shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-sky-700 hover:bg-sky-50/60 active:scale-[0.99]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-sky-600'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold transition-colors ${
                  item.badgeColor || (isActive ? 'bg-sky-100 text-sky-800 border border-sky-200' : 'bg-slate-100 text-slate-600 group-hover:bg-sky-100 group-hover:text-sky-700')
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Action Buttons (Restricted by Role) */}
      {(userRole === 'Admin' || userRole === 'Supervisor') && (
        <div className="pt-2 space-y-2">
          {collapsed ? (
            <button
              onClick={() => setIsAddMachineOpen(true)}
              title={t('dashboard.addLoomBtn')}
              className="w-full flex items-center justify-center p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-5 h-5 text-sky-600" />
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsAddMachineOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2 px-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-sky-600" />
                <span>Loom</span>
              </button>

              {userRole === 'Admin' && (
                <button
                  onClick={() => {
                    setIsDataManagerOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Data Reset</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );

  const renderFleetTelemetry = (collapsed = false) => {
    if (collapsed) {
      return (
        <div className="shrink-0 p-2 border-t border-slate-100 bg-white flex flex-col items-center gap-1" title={`Looms: ${runningCount} Run, ${stoppedCount} Stop, ${idleCount} Idle`}>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-mono font-bold text-xs">
            {runningCount}
          </div>
          <span className="text-[9px] font-mono text-slate-400 font-bold">RUN</span>
        </div>
      );
    }

    return (
      <div className="shrink-0 p-3 border-t border-slate-100 bg-white">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-sky-600" />
              <span>LOOM FLEET</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{machines.length} Total</span>
          </div>

          {/* 3 mini status badges */}
          <div className="grid grid-cols-3 gap-1 text-center">
            <div className="p-1 rounded-lg bg-emerald-50 border border-emerald-200/80">
              <div className="text-[9px] font-semibold text-emerald-700">RUN</div>
              <div className="text-xs font-extrabold text-emerald-800 font-mono">{runningCount}</div>
            </div>
            <div className="p-1 rounded-lg bg-rose-50 border border-rose-200/80">
              <div className="text-[9px] font-semibold text-rose-700">STOP</div>
              <div className="text-xs font-extrabold text-rose-800 font-mono">{stoppedCount}</div>
            </div>
            <div className="p-1 rounded-lg bg-amber-50 border border-amber-200/80">
              <div className="text-[9px] font-semibold text-amber-700">IDLE</div>
              <div className="text-xs font-extrabold text-amber-800 font-mono">{idleCount}</div>
            </div>
          </div>

          {/* Power Load Gauge */}
          <div className="pt-0.5">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span className="flex items-center gap-1 font-semibold">
                <Zap className="w-3 h-3 text-amber-500" /> {t('app.powerLoad')}
              </span>
              <span className="font-mono font-bold text-slate-800">{powerLoadPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-500 transition-all duration-700 rounded-full"
                style={{ width: `${powerLoadPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ─── DESKTOP SIDEBAR (Collapsible with Arrow Button) ─── */}
      <aside className={`hidden md:flex ${isSidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 ease-in-out bg-white border-r border-slate-200/90 flex-col shrink-0 h-full select-none overflow-hidden relative`}>
        {/* Brand Header */}
        <div className={`px-3 h-16 border-b border-slate-200/90 bg-white flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} shrink-0`}>
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 font-bold font-display text-lg tracking-wider shrink-0">
                  LM
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold tracking-tight text-base font-display text-slate-900 truncate">
                      TEAM LMP
                    </span>
                    <span className="bg-sky-100 text-sky-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-sky-200 shrink-0">
                      v2.0
                    </span>
                  </div>
                  <p className="text-[9.5px] font-semibold text-slate-400 tracking-wider uppercase font-mono truncate">
                    {t('app.tagline')}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center relative w-full">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-xs font-bold font-display text-sm tracking-wider">
                LM
              </div>
            </div>
          )}
        </div>

        {/* Role Banner Indicator (When Expanded) */}
        {!isSidebarCollapsed && (
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/70 shrink-0 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase font-mono text-slate-500">
                Active Mode
              </span>
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md font-mono ${
                userRole === 'Admin' ? 'bg-sky-100 text-sky-800' :
                userRole === 'Supervisor' ? 'bg-amber-100 text-amber-800' :
                'bg-emerald-100 text-emerald-800'
              }`}>
                {t(`roles.${userRole}`)}
              </span>
            </div>
          </div>
        )}

        {/* Scrollable Navigation Links */}
        {renderNavLinks(isSidebarCollapsed)}

        {/* Bottom Pinned Fleet Telemetry */}
        {renderFleetTelemetry(isSidebarCollapsed)}
      </aside>

      {/* ─── MOBILE SLIDE-OVER DRAWER ─── */}
      {isMobileMenuOpen && createPortal(
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col z-50 shadow-2xl animate-in slide-in-from-left duration-200 overflow-hidden">
            {/* Drawer Header */}
            <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sky-500/20">
                  LM
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-slate-900">TEAM LMP</span>
                    <span className="bg-sky-100 text-sky-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-sky-200">
                      v2.0
                    </span>
                  </div>
                  <span className="text-[10px] font-mono block text-slate-400">Navigation Menu</span>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Authenticated User Session Card inside Drawer */}
            <div className="p-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  {currentUser.avatar || currentUser.displayName?.[0] || 'U'}
                </div>
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block leading-tight">
                    {currentUser.displayName}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                    userRole === 'Admin' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                    userRole === 'Supervisor' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {t(`roles.${userRole}`)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors"
                title={t('auth.signOut')}
              >
                {t('auth.signOut')}
              </button>
            </div>

            {/* Scrollable Navigation Links (Modern Scrollbar) */}
            {renderNavLinks(false)}

            {/* Bottom Pinned Fleet Telemetry in Drawer */}
            {renderFleetTelemetry(false)}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
