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
import { WhatsAppBrandIcon } from './WhatsAppIcon';

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
    isSidebarCollapsed
  } = useApp();
  const { t } = useTranslation();

  const runningCount = (machines || []).filter((m) => m?.status === 'running').length;
  const stoppedCount = (machines || []).filter((m) => m?.status === 'stopped').length;
  const idleCount = (machines || []).filter((m) => m?.status === 'idle' || m?.status === 'maintenance').length;

  // Role-tailored navigation items
  const adminNav = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'machines', label: t('nav.machines'), icon: Cpu, badge: `${runningCount}/${machines.length}` },
    { id: 'control', label: t('nav.control'), icon: Sliders },
    { id: 'production', label: t('nav.production'), icon: Boxes },
    {
      id: 'alarms',
      label: t('nav.alarms'),
      icon: AlertTriangle,
      badge: alarms.length > 0 ? alarms.length : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    { id: 'workers', label: t('nav.workers'), icon: Users },
    { id: 'rawmaterial', label: t('nav.rawmaterial'), icon: Layers },
    { id: 'sales', label: t('nav.sales'), icon: Briefcase },
    { id: 'rolls', label: t('nav.rolls') || 'Rolls & QR Tracking', icon: QrCode },
    { id: 'analytics', label: t('nav.analytics'), icon: TrendingUp },
    { id: 'whatsapp-reports', label: t('nav.whatsappReports') || 'WhatsApp AI', icon: WhatsAppBrandIcon },
    { id: 'users', label: t('nav.users'), icon: UserCheck }
  ];

  const supervisorNav = [
    { id: 'supervisor-floor', label: t('nav.supervisorFloor'), icon: Activity },
    { id: 'machines', label: t('nav.machines'), icon: Cpu, badge: `${runningCount}/${machines.length}` },
    { id: 'production', label: t('nav.production'), icon: Boxes },
    {
      id: 'alarms',
      label: t('nav.alarms'),
      icon: AlertTriangle,
      badge: alarms.length > 0 ? alarms.length : null,
      badgeColor: 'bg-rose-500 text-white'
    },
    { id: 'workers', label: t('nav.workers'), icon: Users },
    { id: 'rawmaterial', label: t('nav.rawmaterial'), icon: Layers },
    { id: 'rolls', label: t('nav.rolls') || 'Rolls & QR Tracking', icon: QrCode },
    { id: 'whatsapp-reports', label: t('nav.whatsappReports') || 'WhatsApp AI', icon: WhatsAppBrandIcon }
  ];

  const operatorNav = [
    { id: 'operator-console', label: t('nav.operatorConsole'), icon: Wrench },
    { id: 'machines', label: t('nav.machines'), icon: Cpu },
    { id: 'control', label: t('nav.control'), icon: Sliders },
    { id: 'production', label: t('nav.production'), icon: Boxes },
    {
      id: 'alarms',
      label: t('nav.alarms'),
      icon: AlertTriangle,
      badge: alarms.length > 0 ? alarms.length : null,
      badgeColor: 'bg-rose-500 text-white'
    }
  ];

  let currentNav = adminNav;
  if (userRole === 'Supervisor') currentNav = supervisorNav;
  else if (userRole === 'Operator') currentNav = operatorNav;

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const renderNavLinks = (collapsed = false) => (
    <div className="flex-1 overflow-y-auto modern-scrollbar px-2.5 py-2.5 space-y-1 min-h-0">
      <nav className="space-y-1">
        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              title={collapsed ? item.label : undefined}
              className={`group w-full flex items-center h-10 px-2 rounded-xl text-xs font-semibold transition-colors duration-75 text-left cursor-pointer relative ${
                isActive
                  ? 'bg-sky-50 text-sky-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-sky-700 hover:bg-slate-100/70'
              }`}
            >
              {/* Active Indicator Accent Bar */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-sky-600 rounded-r-full" />
              )}

              {/* Icon Container with Balanced Size */}
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <Icon
                  className={`w-5 h-5 transition-colors duration-75 ${
                    isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
              </div>

              {/* Smooth Gliding Label & Badge */}
              <div
                className={`flex items-center justify-between flex-1 pr-1.5 pl-2.5 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out ${
                  collapsed
                    ? 'max-w-0 opacity-0 pointer-events-none'
                    : 'max-w-[180px] opacity-100'
                }`}
              >
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ml-1.5 shrink-0 ${
                      item.badgeColor ||
                      (isActive
                        ? 'bg-sky-100 text-sky-800 border border-sky-200'
                        : 'bg-slate-100 text-slate-600')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Collapsed dot badge for alarms only */}
              {collapsed && item.id === 'alarms' && alarms.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Action Buttons */}
      {(userRole === 'Admin' || userRole === 'Supervisor') && (
        <div className="pt-2 space-y-1 border-t border-slate-100 mt-2">
          {/* Add Loom Button */}
          <button
            onClick={() => {
              setIsAddMachineOpen(true);
              setIsMobileMenuOpen(false);
            }}
            title={collapsed ? t('dashboard.addLoomBtn') : undefined}
            className="w-full flex items-center h-10 px-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200/80 text-sky-800 text-xs font-bold transition-colors duration-75 cursor-pointer shadow-2xs group"
          >
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <Plus className="w-[18px] h-[18px] text-sky-600 group-hover:scale-110 transition-transform" />
            </div>
            <div
              className={`flex-1 pr-1.5 pl-2.5 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out text-left ${
                collapsed
                  ? 'max-w-0 opacity-0 pointer-events-none'
                  : 'max-w-[180px] opacity-100'
              }`}
            >
              <span>{t('dashboard.addLoomBtn')}</span>
            </div>
          </button>

          {/* Data Reset Button (Admin only) */}
          {userRole === 'Admin' && (
            <button
              onClick={() => {
                setIsDataManagerOpen(true);
                setIsMobileMenuOpen(false);
              }}
              title={collapsed ? t('app.dataReset') : undefined}
              className="w-full flex items-center h-10 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition-colors duration-75 cursor-pointer shadow-2xs group"
            >
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <Database className="w-[18px] h-[18px] text-indigo-600 group-hover:scale-110 transition-transform" />
              </div>
              <div
                className={`flex-1 pr-1.5 pl-2.5 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out text-left ${
                  collapsed
                    ? 'max-w-0 opacity-0 pointer-events-none'
                    : 'max-w-[180px] opacity-100'
                }`}
              >
                <span>{t('app.dataReset')}</span>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderFleetTelemetry = (collapsed = false) => {
    return (
      <div className="shrink-0 border-t border-slate-100 bg-white overflow-hidden transition-all duration-300">
        {collapsed ? (
          <div
            className="p-2 flex flex-col items-center justify-center gap-1 transition-all duration-300 cursor-default"
            title={`Looms: ${runningCount} ${t('status.running')}, ${stoppedCount} ${t('status.stopped')}, ${idleCount} ${t('status.idle')} | ${t('app.powerLoad')}: ${powerLoadPercent}%`}
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-mono font-bold text-xs shadow-2xs">
              {runningCount}
            </div>
            <span className="text-[8.5px] font-mono text-slate-400 font-bold truncate max-w-[48px]">{t('status.running')}</span>
          </div>
        ) : (
          <div className="p-3 transition-all duration-300 animate-in fade-in duration-200">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-sky-600" />
                  <span>{t('app.loomFleet')}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{machines.length} {t('common.total')}</span>
              </div>

              {/* 3 mini status badges */}
              <div className="grid grid-cols-3 gap-1 text-center">
                <div className="p-1 rounded-lg bg-emerald-50 border border-emerald-200/80">
                  <div className="text-[9px] font-semibold text-emerald-700 truncate">{t('status.running')}</div>
                  <div className="text-xs font-extrabold text-emerald-800 font-mono">{runningCount}</div>
                </div>
                <div className="p-1 rounded-lg bg-rose-50 border border-rose-200/80">
                  <div className="text-[9px] font-semibold text-rose-700 truncate">{t('status.stopped')}</div>
                  <div className="text-xs font-extrabold text-rose-800 font-mono">{stoppedCount}</div>
                </div>
                <div className="p-1 rounded-lg bg-amber-50 border border-amber-200/80">
                  <div className="text-[9px] font-semibold text-amber-700 truncate">{t('status.idle')}</div>
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
        )}
      </div>
    );
  };

  return (
    <>
      {/* ─── DESKTOP SIDEBAR (Silky Smooth Width Animation) ─── */}
      <aside
        className={`hidden md:flex ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        } transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[width] bg-white border-r border-slate-200/90 flex-col shrink-0 h-full select-none overflow-hidden relative shadow-xs`}
      >
        {/* Brand Header */}
        <div className="h-16 px-3 border-b border-slate-200/90 bg-white flex items-center shrink-0 overflow-hidden">
          <div className="flex items-center min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 font-bold font-display text-sm tracking-wider shrink-0">
              LM
            </div>
            <div
              className={`ml-2.5 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out ${
                isSidebarCollapsed
                  ? 'max-w-0 opacity-0 pointer-events-none'
                  : 'max-w-[180px] opacity-100'
              }`}
            >
              <span className="font-extrabold tracking-tight text-sm font-display text-slate-900 block leading-tight">
                TEAM LMP
              </span>
              <p className="text-[9px] font-semibold text-slate-400 tracking-wider uppercase font-mono truncate">
                {t('app.tagline')}
              </p>
            </div>
          </div>
        </div>

        {/* Role Banner Indicator (Smooth slide up/down) */}
        <div
          className={`border-b border-slate-100 bg-slate-50/70 shrink-0 overflow-hidden transition-[max-height,opacity] duration-200 ease-in-out ${
            isSidebarCollapsed ? 'max-h-0 opacity-0 py-0' : 'max-h-12 px-4 py-2 opacity-100'
          }`}
        >
          <div className="flex items-center justify-between whitespace-nowrap">
            <span className="text-[10px] font-bold tracking-wider uppercase font-mono text-slate-500">
              {t('app.activeMode')}
            </span>
            <span
              className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md font-mono ${
                userRole === 'Admin'
                  ? 'bg-sky-100 text-sky-800'
                  : userRole === 'Supervisor'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {t(`roles.${userRole}`)}
            </span>
          </div>
        </div>

        {/* Scrollable Navigation Links */}
        {renderNavLinks(isSidebarCollapsed)}

        {/* Bottom Pinned Fleet Telemetry */}
        {renderFleetTelemetry(isSidebarCollapsed)}
      </aside>

      {/* ─── MOBILE SLIDE-OVER DRAWER ─── */}
      {isMobileMenuOpen &&
        createPortal(
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop Overlay with smooth fade */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer Panel with smooth slide-in */}
            <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col z-50 shadow-2xl animate-in slide-in-from-left duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden">
              {/* Drawer Header */}
              <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sky-500/20">
                    LM
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-slate-900 block">TEAM LMP</span>
                    <span className="text-[10px] font-mono block text-slate-400">{t('app.navigationMenu')}</span>
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
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                        userRole === 'Admin'
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : userRole === 'Supervisor'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {t(`roles.${userRole}`)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title={t('auth.signOut')}
                >
                  {t('auth.signOut')}
                </button>
              </div>

              {/* Scrollable Navigation Links */}
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
