import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { openWhatsApp } from '../../utils/whatsapp';
import { WhatsAppBrandIcon } from './WhatsAppIcon';
import {
  X,
  Send,
  ExternalLink,
  Sparkles,
  CheckCheck
} from 'lucide-react';

// Re-export for compatibility
export { WhatsAppBrandIcon };

export default function FloatingWhatsApp() {
  const {
    adminWhatsAppPhone,
    setIsWhatsAppModalOpen,
    isAuthenticated,
    userRole
  } = useApp();
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show a welcome tooltip on first page load after 2 seconds if user hasn't interacted
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasInteracted) {
        setShowTooltip(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [hasInteracted]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
    setShowTooltip(false);
    setHasInteracted(true);
  };

  const handleSend = (textToSend) => {
    const finalMsg = textToSend || message.trim() || t('whatsApp.welcomeMsg');
    openWhatsApp({
      phone: adminWhatsAppPhone || '+91 96646 83069',
      message: finalMsg
    });
    setIsOpen(false);
    setMessage('');
  };

  const quickTopics = [
    { label: t('whatsApp.quickInquiry'), text: 'Namaste! I would like to inquire about mill operations and weaving schedules.' },
    { label: t('whatsApp.quickBreakdown'), text: '⚠️ ALERT: Need urgent technician support for loom unit breakdown on the floor.' },
    { label: t('whatsApp.quickStock'), text: '📦 INQUIRY: Checking ready goods roll stock & inward yarn lot availability.' },
    { label: t('whatsApp.quickReport'), text: '📊 UPDATE: Requesting supervisor shift production & efficiency report.' },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed z-40 select-none bottom-20 right-4 md:bottom-6 md:right-6 font-sans will-change-transform"
      style={{ transform: 'translateZ(0)' }}
    >
      {/* WhatsApp Chat Popup Box (Widget Card) */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[calc(100vw-2rem)] sm:w-96 max-w-[390px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col mb-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Card Header (WhatsApp Signature Emerald Gradient) */}
          <div className="bg-gradient-to-r from-[#075E54] to-[#128C7E] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md">
                  <WhatsAppBrandIcon className="w-7 h-7 fill-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#075E54] rounded-full"></span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm tracking-wide flex items-center gap-1.5">
                  LOOMUS Support
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.5 rounded-full font-mono uppercase">
                    Mill
                  </span>
                </h4>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  {t('whatsApp.onlineStatus')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-emerald-100 hover:text-white transition-colors"
              title="Close"
              aria-label="Close WhatsApp chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Body with WhatsApp Pattern Wallpaper Background */}
          <div className="p-4 bg-slate-100/80 space-y-3 max-h-[360px] overflow-y-auto overscroll-contain">
            {/* Timestamp Header */}
            <div className="text-center">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-white/70 rounded-full shadow-2xs">
                TODAY
              </span>
            </div>

            {/* Inbound WhatsApp Message Bubble */}
            <div className="flex flex-col items-start max-w-[90%]">
              <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-sm border border-slate-200/60 text-slate-800 text-xs leading-relaxed space-y-1">
                <p className="font-bold text-emerald-700 flex items-center gap-1 text-[11px]">
                  <Sparkles className="w-3 h-3" />
                  LOOMUS Factory Management
                </p>
                <p>{t('whatsApp.welcomeMsg')}</p>
                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-0.5">
                  <span>Now</span>
                  <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                </div>
              </div>
            </div>

            {/* Quick Topic Chips */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                Quick Messages:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickTopics.map((topic, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(topic.text)}
                    className="text-left text-[11px] font-medium bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl px-2.5 py-1.5 transition-all shadow-2xs hover:shadow-xs"
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Footer & Message Input */}
          <div className="p-3 bg-white border-t border-slate-200/90 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend(message);
                  }
                }}
                placeholder={t('whatsApp.typeMessage')}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-slate-800"
              />

              <button
                onClick={() => handleSend(message)}
                className="p-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl shadow-md hover:shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                title={t('whatsApp.startChat')}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Direct WhatsApp Callout & Hub Link */}
            <div className="flex items-center justify-between text-[11px] px-1 text-slate-500">
              <span className="font-mono text-[10px] text-slate-400">
                {adminWhatsAppPhone || '+91 96646 83069'}
              </span>

              {isAuthenticated && userRole === 'Admin' && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsWhatsAppModalOpen(true);
                  }}
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  {t('whatsApp.openHub')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Tooltip Pill (Shows on hover or initial hint) */}
      {showTooltip && !isOpen && (
        <div className="absolute right-16 top-1/2 -translate-y-1/2 mr-2 whitespace-nowrap bg-slate-900 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-xl flex items-center gap-1.5 animate-in fade-in zoom-in-95">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{t('whatsApp.chatWithUs')}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
              setHasInteracted(true);
            }}
            className="text-slate-400 hover:text-white ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Floating WhatsApp Action Button */}
      <button
        onClick={handleToggle}
        onMouseEnter={() => !hasInteracted && setShowTooltip(true)}
        className="relative group w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-lg hover:shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-400/40 cursor-pointer"
        title={t('whatsApp.chatWithUs')}
        aria-label="WhatsApp Support and Inquiries"
      >
        {/* Subtle Online Indicator Dot */}
        <span className="absolute top-0 right-0 flex h-3 w-3">
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-300 border-2 border-white shadow-xs"></span>
        </span>

        {/* Authentic WhatsApp Icon or Close Icon when opened */}
        {isOpen ? (
          <X className="w-7 h-7 text-white stroke-[2.5] animate-in zoom-in-75 duration-200" />
        ) : (
          <WhatsAppBrandIcon className="w-9 h-9 sm:w-9.5 sm:h-9.5 fill-white drop-shadow-sm transition-transform duration-200 group-hover:scale-105" />
        )}
      </button>
    </div>
  );
}
