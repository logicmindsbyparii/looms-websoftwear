import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import {
  Bell,
  Power,
  SlidersHorizontal,
  Menu,
  ChevronDown,
  MessageSquare,
  Users,
  Eye,
  QrCode
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
    setIsWhatsAppModalOpen,
    setIsScanModalOpen,
    adminWhatsAppPhone,
    isPreviewMode
  } = useApp();
  const { t } = useTranslation();

  const [showUserMenu, setShowUserMenu] = useState(false);

  const criticalAlarmsCount = alarms.filter(a => a.type === 'critical').length;
  const runningCount = machines.filter(m => m.status === 'running').length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 sm:px-6 h-16 flex items-center transition-all shrink-0">
      <div className="w-full flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Mobile Hamburger + Active Looms Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
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

          {/* User Profile Pill Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm"
              title="User Account Options"
              aria-label="User Account Options"
            >
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[11px] font-bold">
                {currentUser?.displayName?.[0] || 'A'}
              </div>
              <span className="text-xs font-bold tracking-tight font-mono">
                {userRole === 'Admin' ? 'Admin' : userRole === 'Supervisor' ? 'Supervisor' : 'Operator'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="font-bold text-xs text-slate-800">{currentUser.displayName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">@{currentUser.username} ({t(`roles.${userRole}`)})</div>
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
                      className="w-full text-left px-3 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg flex items-center gap-2"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>{t('roles.exitPreview')}</span>
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
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
        </div>
      </div>
    </header>
  );
}
