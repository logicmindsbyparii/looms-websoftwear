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
  Users,
  Eye
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
                ? `${runningCount}/${machines.length} ACTIVE LOOMS`
                : t('app.allSystemsNominal')}
            </span>
          </div>
        </div>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Alarm Bell with Counter */}
          <button
            onClick={() => setActiveTab('alarms')}
            className="relative p-1.5 sm:p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Active Alarms"
            aria-label="Active Alarms"
          >
            <Bell className="w-4 h-4" />
            {alarms.length > 0 && (
              <span className={`absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold text-white ${criticalAlarmsCount > 0 ? 'bg-rose-600 animate-bounce' : 'bg-amber-500'}`}>
                {alarms.length}
              </span>
            )}
          </button>

          {/* User Profile & Dropdown */}
          <div className="relative flex items-center gap-1 pl-1 sm:pl-2 border-l border-slate-200">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 transition-colors"
              title={currentUser.displayName}
            >
              <div className="h-7 w-7 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-md shadow-sky-500/20">
                {currentUser.avatar || currentUser.displayName?.[0] || 'U'}
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
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
        </div>
      </div>
    </header>
  );
}
