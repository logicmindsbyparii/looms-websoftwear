import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  X,
  Database,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Lock
} from 'lucide-react';

export default function DataManagerModal() {
  const {
    isDataManagerOpen,
    setIsDataManagerOpen,
    machines,
    workers,
    stockLevels,
    readyGoods,
    brokers,
    clearAllData,
    loadDemoData,
    exportDataJSON,
    importDataJSON,
    showToast
  } = useApp();
  const { t } = useTranslation();

  const fileInputRef = useRef(null);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  if (!isDataManagerOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        importDataJSON(content);
        setIsDataManagerOpen(false);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteWipe = async () => {
    if (!passwordConfirm.trim()) {
      showToast(t('dataManager.confirmPasswordPlaceholder'), 'error');
      return;
    }
    setIsWiping(true);
    const success = await clearAllData(passwordConfirm.trim());
    setIsWiping(false);
    if (success) {
      setPasswordConfirm('');
      setShowPasswordPrompt(false);
      setIsDataManagerOpen(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base font-display">
                {t('dataManager.title')}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-mono">
                {t('dataManager.subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDataManagerOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6">
          {/* Current Factory Records Count */}
          <div className="heavy-card rounded-2xl p-4 bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-3">
              Factory Database Records
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">MACHINES</span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">{machines.length}</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">STAFF</span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">{workers.length}</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">YARN TYPES</span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">{stockLevels.length}</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">READY ROLLS</span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">{readyGoods.length}</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">BROKERS</span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">{brokers.length}</span>
              </div>
            </div>
          </div>

          {/* Primary Action: Clear All Data */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>{t('dataManager.clearAllBtn')}</span>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed">
              {t('dataManager.wipeWarning')}
            </p>

            {showPasswordPrompt ? (
              <div className="mt-3 p-3 bg-white rounded-xl border border-rose-300 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  {t('dataManager.confirmPasswordPlaceholder')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordPrompt(false);
                      setPasswordConfirm('');
                    }}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={isWiping}
                    onClick={handleExecuteWipe}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    {isWiping ? 'Wiping...' : t('dataManager.wipeConfirmBtn')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowPasswordPrompt(true)}
                className="mt-2 w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('dataManager.clearAllBtn')}</span>
              </button>
            )}
          </div>

          {/* Secondary Actions: Load Demo Data & Backups */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Alternative Actions & Backups
            </h4>

            {/* Load Demo Data Button */}
            <button
              onClick={() => {
                loadDemoData();
                setIsDataManagerOpen(false);
              }}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-sky-600" />
                <span>{t('dataManager.loadDemoBtn')}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Database Seed</span>
            </button>

            {/* Export JSON */}
            <button
              onClick={exportDataJSON}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>{t('dataManager.exportBtn')}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">JSON</span>
            </button>

            {/* Import JSON */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>{t('dataManager.importBtn')}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">JSON</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
