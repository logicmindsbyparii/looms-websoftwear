import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { WhatsAppBrandIcon } from './WhatsAppIcon';
import { openWhatsApp, cleanPhoneNumber } from '../../utils/whatsapp';
import {
  X,
  MessageSquare,
  Phone,
  Send,
  User,
  Users,
  Building,
  Boxes,
  Briefcase,
  Copy,
  Check,
  Edit3
} from 'lucide-react';

export default function WhatsAppShareModal() {
  const {
    whatsAppShareData,
    closeWhatsAppShare,
    adminWhatsAppPhone,
    godownWhatsAppPhone,
    salesWhatsAppPhone,
    brokers,
    showToast
  } = useApp();
  const { t } = useTranslation();

  const { isOpen, title, message, category, defaultPhone } = whatsAppShareData;

  const [recipientType, setRecipientType] = useState('admin'); // 'admin' | 'godown' | 'sales' | 'broker' | 'custom' | 'any'
  const [customPhone, setCustomPhone] = useState('');
  const [selectedBrokerId, setSelectedBrokerId] = useState('');
  const [editableMessage, setEditableMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Synchronize message & default recipient when modal opens
  useEffect(() => {
    if (isOpen) {
      setEditableMessage(message || '');
      setIsCopied(false);

      if (category === 'godown') {
        setRecipientType('godown');
      } else if (category === 'sales') {
        setRecipientType('sales');
      } else {
        setRecipientType('admin');
      }

      if (defaultPhone && defaultPhone !== adminWhatsAppPhone) {
        setCustomPhone(defaultPhone);
        setRecipientType('custom');
      } else {
        setCustomPhone('');
      }

      if (brokers && brokers.length > 0) {
        setSelectedBrokerId(brokers[0].id);
      }
    }
  }, [isOpen, message, category, defaultPhone, adminWhatsAppPhone, brokers]);

  if (!isOpen) return null;

  // Determine the final destination phone number
  const getDestinationPhone = () => {
    switch (recipientType) {
      case 'admin':
        return adminWhatsAppPhone || '+91 75675 74107';
      case 'godown':
        return godownWhatsAppPhone || adminWhatsAppPhone || '+91 75675 74107';
      case 'sales':
        return salesWhatsAppPhone || adminWhatsAppPhone || '+91 75675 74107';
      case 'broker': {
        const found = brokers.find(b => b.id === selectedBrokerId);
        return found ? found.phone : '';
      }
      case 'custom':
        return customPhone;
      case 'any':
      default:
        return '';
    }
  };

  const getRecipientLabel = () => {
    switch (recipientType) {
      case 'admin':
        return `${t('modals.whatsAppShare.sendToAdmin')} (${adminWhatsAppPhone || '7567574107'})`;
      case 'godown':
        return `${t('modals.whatsAppShare.sendToGodown')} (${godownWhatsAppPhone || adminWhatsAppPhone})`;
      case 'sales':
        return `${t('modals.whatsAppShare.sendToSales')} (${salesWhatsAppPhone || adminWhatsAppPhone})`;
      case 'broker': {
        const found = brokers.find(b => b.id === selectedBrokerId);
        return found ? `${found.name} (${found.phone})` : t('modals.whatsAppShare.sendToBroker');
      }
      case 'custom':
        return customPhone ? `${t('modals.whatsAppShare.sendToCustom')} (${customPhone})` : t('modals.whatsAppShare.sendToCustom');
      case 'any':
        return t('modals.whatsAppShare.sendToAny');
      default:
        return 'WhatsApp';
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    const destPhone = getDestinationPhone();

    if (recipientType === 'custom' && !customPhone.trim()) {
      showToast(t('modals.whatsAppShare.invalidNumber'), 'error');
      return;
    }

    openWhatsApp({
      phone: destPhone,
      message: editableMessage
    });

    showToast(`Opening WhatsApp for ${getRecipientLabel()}!`, 'success');
    closeWhatsAppShare();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableMessage);
    setIsCopied(true);
    showToast(t('modals.whatsAppShare.copied'), 'info');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-emerald-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base font-display">
                {title || t('modals.whatsAppShare.modalTitle')}
              </h3>
              <p className="text-[11px] text-emerald-800 font-mono">
                {t('modals.whatsAppShare.selectRecipient')}
              </p>
            </div>
          </div>

          <button
            onClick={closeWhatsAppShare}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSend} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Recipient Selection Section */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">
              {t('modals.whatsAppShare.selectRecipient')}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Option 1: Admin / Owner */}
              <button
                type="button"
                onClick={() => setRecipientType('admin')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  recipientType === 'admin'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${recipientType === 'admin' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Building className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold flex items-center gap-1">
                    <span>{t('modals.whatsAppShare.sendToAdmin')}</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded font-mono">Default</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 block mt-0.5">{adminWhatsAppPhone || '7567574107'}</span>
                </div>
              </button>

              {/* Option 2: Godown Manager */}
              <button
                type="button"
                onClick={() => setRecipientType('godown')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  recipientType === 'godown'
                    ? 'border-sky-500 bg-sky-50 text-sky-950 font-bold ring-2 ring-sky-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${recipientType === 'godown' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Boxes className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold">{t('modals.whatsAppShare.sendToGodown')}</div>
                  <span className="text-[11px] font-mono text-slate-500 block mt-0.5">{godownWhatsAppPhone || adminWhatsAppPhone}</span>
                </div>
              </button>

              {/* Option 3: Sales Incharge */}
              <button
                type="button"
                onClick={() => setRecipientType('sales')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  recipientType === 'sales'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${recipientType === 'sales' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold">{t('modals.whatsAppShare.sendToSales')}</div>
                  <span className="text-[11px] font-mono text-slate-500 block mt-0.5">{salesWhatsAppPhone || adminWhatsAppPhone}</span>
                </div>
              </button>

              {/* Option 4: Custom Number */}
              <button
                type="button"
                onClick={() => setRecipientType('custom')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  recipientType === 'custom'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${recipientType === 'custom' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold">{t('modals.whatsAppShare.sendToCustom')}</div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">10-digit number</span>
                </div>
              </button>
            </div>

            {/* Sub-Option: If Broker Selected or Brokers Available */}
            {brokers && brokers.length > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setRecipientType('broker')}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 text-xs transition-all ${
                    recipientType === 'broker'
                      ? 'border-purple-500 bg-purple-50 font-bold ring-2 ring-purple-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>{t('modals.whatsAppShare.sendToBroker')}</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-700 font-bold">
                    {brokers.length} contacts
                  </span>
                </button>

                {recipientType === 'broker' && (
                  <div className="mt-2 pl-2">
                    <select
                      value={selectedBrokerId}
                      onChange={e => setSelectedBrokerId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {brokers.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.company}) — {b.phone}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Sub-Option: If Custom Number is Active */}
            {recipientType === 'custom' && (
              <div className="pt-1">
                <div className="relative">
                  <Phone className="w-4 h-4 text-amber-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder={t('modals.whatsAppShare.customPhonePlaceholder')}
                    value={customPhone}
                    onChange={e => setCustomPhone(e.target.value)}
                    autoFocus
                    className="w-full pl-10 pr-4 py-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Option: Any WhatsApp Contact (Free Pick) */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setRecipientType('any')}
                className={`text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-medium ${recipientType === 'any' ? 'font-bold text-emerald-700' : ''}`}
              >
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${recipientType === 'any' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>
                  {recipientType === 'any' && <Check className="w-2.5 h-2.5" />}
                </span>
                <span>{t('modals.whatsAppShare.sendToAny')}</span>
              </button>
            </div>
          </div>

          {/* Message Preview & Quick Edit */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                {t('modals.whatsAppShare.messagePreview')}
              </label>

              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 font-semibold"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                {isCopied ? t('modals.whatsAppShare.copied') : t('modals.whatsAppShare.copyText')}
              </button>
            </div>

            <textarea
              rows={6}
              value={editableMessage}
              onChange={e => setEditableMessage(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
            />
          </div>

          {/* Destination Target Banner */}
          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-600 font-medium">Sending to:</span>
              <strong className="text-slate-900 font-mono">{getRecipientLabel()}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={closeWhatsAppShare}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              {t('common.cancel')}
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/25 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{t('modals.whatsAppShare.openWhatsAppBtn')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

