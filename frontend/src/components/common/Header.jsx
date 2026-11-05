import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { WhatsAppBrandIcon } from './WhatsAppIcon';
import {
  Bell,
  Power,
  SlidersHorizontal,
  Menu,
  ChevronDown,
  MessageSquare,
  Users,
  Eye,
  QrCode,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Header() {
  const {
    currentUser,
    userRole,
    switchRole,
    alarms,
    machines,
    setActiveTab,
    logout,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isSidebarCollapsed,
    toggleSidebar,
    setIsWhatsAppModalOpen,
    setIsScanModalOpen,
    adminWhatsAppPhone,
    isPreviewMode
  } = useApp();
  const { t } = useTranslation();

  const [showUserMenu, setShowUserMenu] = useState(false);

  const criticalAlarmsCount = (alarms || []).filter(a => a?.type === 'critical').length;
  const runningCount = (machines || []).filter(m => m?.status === 'running').length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 sm:px-6 h-16 flex items-center transition-all shrink-0">
      <div className="w-full flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Mobile Hamburger + Desktop Sidebar Arrow Toggle + Active Looms Badge */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Sidebar Toggle Arrow Button (Bahar wala arrow) */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer items-center justify-center border border-slate-200/80 shadow-2xs hover:shadow-xs active:scale-95"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            aria-label="Toggle Sidebar"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-700" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Plant Live Operational Status Badge: ACTIVE LOOMS */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-full text-emerald-800 text-xs font-bold uppercase tracking-wider font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>
              {machines.length > 0
                ? `${runningCount}/${machines.length} ${t('nav.activeLooms')}`
                : `0/0 ${t('nav.activeLooms')}`}
            </span>
          </div>
        </div>

        {/* Right Side: Language Switcher + Critical Alarm + User Profile + Scan QR + WhatsApp */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Multi-Language Dropdown */}
          <LanguageSwitcher />

          {/* Critical Alarm Bell Notification */}
          <button
            onClick={() => setActiveTab('alarms')}
            className={`relative p-2 rounded-xl transition-all ${
              criticalAlarmsCount > 0
                ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Active Loom Breakage & Quality Alarms"
            aria-label="Active Loom Alarms"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {alarms.length > 0 && (
              <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white ${
                criticalAlarmsCount > 0 ? 'bg-rose-600' : 'bg-amber-500'
              }`}>
                {alarms.length}
              </span>
            )}
          </button>

          {/* Quick Return to Admin Button in Header when in preview mode */}
          {isPreviewMode && (
            <button
              onClick={() => switchRole('Admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer animate-in fade-in"
              title="Return to Admin Mode"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">{t('roles.exitPreview') || 'Return to Admin'}</span>
              <span className="sm:hidden">Return to Admin</span>
            </button>
          )}

          {/* User Profile Pill Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-800 transition-all shadow-2xs hover:shadow-xs group"
              title="User Account Options"
              aria-label="User Account Options"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-2xs ring-2 ring-sky-100 shrink-0">
                {currentUser?.displayName?.[0] || 'A'}
              </div>
              <span className="text-xs font-bold text-slate-800 tracking-wide font-sans">
                {userRole === 'Admin' ? 'Admin' : userRole === 'Supervisor' ? 'Supervisor' : 'Operator'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="font-bold text-xs text-slate-800">{currentUser?.displayName || 'Admin'}</div>
                  <div className="text-[11px] text-slate-400 font-mono">@{currentUser?.username || 'admin'} ({t(`roles.${userRole}`)})</div>
                </div>

                {/* Admin Role Preview / View As Switcher */}
                {userRole === 'Admin' && (
                  <div className="p-2 border-b border-slate-100 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 font-mono px-2 uppercase">
                      View Portal As:
                    </div>
                    <div className="grid grid-cols-2 gap-1 px-1">
                      <button
                        onClick={() => {
                          switchRole('Supervisor');
                          setShowUserMenu(false);
                        }}
                        className="px-2 py-1.5 text-left text-[11px] font-medium text-amber-700 hover:bg-amber-50 rounded-lg flex items-center gap-1.5"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Supervisor</span>
                      </button>
                      <button
                        onClick={() => {
                          switchRole('Operator');
                          setShowUserMenu(false);
                        }}
                        className="px-2 py-1.5 text-left text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1.5"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Operator</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Preview Mode Exit Button */}
                {isPreviewMode && (
                  <div className="p-2 border-b border-slate-100">
                    <button
                      onClick={() => {
                        switchRole('Admin');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-sky-600" />
                      <span>{t('roles.exitPreview') || 'Return to Admin'}</span>
                    </button>
                  </div>
                )}

                {/* Users Management Link (Admin only) */}
                {userRole === 'Admin' && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setActiveTab('users');
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('nav.users')}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{t('auth.signOut')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Scan QR Button */}
          <button
            onClick={() => setIsScanModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 rounded-xl font-bold text-xs transition-all shadow-2xs shrink-0"
            title="Scan Roll QR or Barcode"
            aria-label="Scan QR"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Scan QR</span>
          </button>

          {/* WhatsApp Direct Reporting Button in the Right Side Corner */}
          <button
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl font-bold text-xs transition-all shadow-2xs shrink-0"
            title={`Configure WhatsApp Alerts & Reports (Admin: ${adminWhatsAppPhone})`}
            aria-label="Configure WhatsApp"
          >
            <WhatsAppBrandIcon className="w-4 h-4 fill-[#25D366] shrink-0" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
        </div>
      </div>
    </header>
  );
}
