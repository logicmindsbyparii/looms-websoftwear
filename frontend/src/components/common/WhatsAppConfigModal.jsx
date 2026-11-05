import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { WhatsAppBrandIcon } from './WhatsAppIcon';
import { openWhatsApp } from '../../utils/whatsapp';
import {
  X,
  MessageSquare,
  Phone,
  CheckCircle2,
  Send,
  ShieldCheck,
  Building,
  Boxes,
  Briefcase
} from 'lucide-react';

export default function WhatsAppConfigModal() {
  const {
    isWhatsAppModalOpen,
    setIsWhatsAppModalOpen,
    adminWhatsAppPhone,
    setAdminWhatsAppPhone,
    godownWhatsAppPhone,
    setGodownWhatsAppPhone,
    salesWhatsAppPhone,
    setSalesWhatsAppPhone,
    showToast
  } = useApp();
  const { t } = useTranslation();

  const [inputAdminPhone, setInputAdminPhone] = useState(adminWhatsAppPhone || '+91 75675 74107');
  const [inputGodownPhone, setInputGodownPhone] = useState(godownWhatsAppPhone || '+91 75675 74107');
  const [inputSalesPhone, setInputSalesPhone] = useState(salesWhatsAppPhone || '+91 75675 74107');

  if (!isWhatsAppModalOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!inputAdminPhone.trim()) {
      showToast(t('modals.whatsAppConfig.invalidAdmin'), 'error');
      return;
    }
    setAdminWhatsAppPhone(inputAdminPhone.trim());
    setGodownWhatsAppPhone(inputGodownPhone.trim() || inputAdminPhone.trim());
    setSalesWhatsAppPhone(inputSalesPhone.trim() || inputAdminPhone.trim());

    showToast(t('modals.whatsAppConfig.savedSuccess'), 'success');
    setIsWhatsAppModalOpen(false);
  };

  const handleSendTest = (phone, title) => {
    openWhatsApp({
      phone: phone || inputAdminPhone,
      message: `🏭 *LOOMUS TEXTILE SUITE — TEST ALERT*\n\n✅ Namaste! Aapka WhatsApp number (${title}) Loomus system se connect ho gaya hai.\nAb aapko sabhi Maal Aaya, Maal Gaya, Sales, Godown aur Daily Reports isi number par 1-click me milenge.`
    });
    showToast(`Sent test message to ${title} on WhatsApp!`, 'info');
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-emerald-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base font-display">
                {t('modals.whatsAppConfig.title')}
              </h3>
              <p className="text-[11px] text-emerald-800 font-mono">
                {t('modals.whatsAppConfig.subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsWhatsAppModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* 1. Admin Number */}
          <div className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-700" />
                {t('modals.whatsAppConfig.adminLabel')}
              </label>
              <button
                type="button"
                onClick={() => handleSendTest(inputAdminPhone, 'Admin')}
                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md flex items-center gap-1"
              >
                <Send className="w-3 h-3" /> {t('modals.whatsAppConfig.sendTest')}
              </button>
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="+91 75675 74107"
                value={inputAdminPhone}
                onChange={e => setInputAdminPhone(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 bg-white border border-emerald-200 rounded-xl font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {t('modals.whatsAppConfig.adminHint')}
            </p>
          </div>

          {/* 2. Godown Manager Number */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-sky-600" />
                {t('modals.whatsAppConfig.godownLabel')}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputGodownPhone(inputAdminPhone)}
                  className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 underline"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleSendTest(inputGodownPhone, 'Godown')}
                  className="text-[10px] font-bold text-sky-700 hover:text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md flex items-center gap-1"
                >
                  <Send className="w-3 h-3" /> {t('modals.whatsAppConfig.sendTest')}
                </button>
              </div>
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-sky-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="+91 75675 74107"
                value={inputGodownPhone}
                onChange={e => setInputGodownPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {t('modals.whatsAppConfig.godownHint')}
            </p>
          </div>

          {/* 3. Sales & Dispatch Number */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                {t('modals.whatsAppConfig.salesLabel')}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputSalesPhone(inputAdminPhone)}
                  className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 underline"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleSendTest(inputSalesPhone, 'Sales')}
                  className="text-[10px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md flex items-center gap-1"
                >
                  <Send className="w-3 h-3" /> {t('modals.whatsAppConfig.sendTest')}
                </button>
              </div>
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-indigo-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="+91 75675 74107"
                value={inputSalesPhone}
                onChange={e => setInputSalesPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {t('modals.whatsAppConfig.salesHint')}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsWhatsAppModalOpen(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              {t('common.cancel')}
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/25 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t('modals.whatsAppConfig.saveNumbers')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

