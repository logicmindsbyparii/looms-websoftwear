// Utility formatters for LOOMUS Textile Suite with 4-locale support
import { getCurrentLang } from '../api/client';

const LOCALE_MAP = {
  en: 'en-IN',
  gu: 'gu-IN',
  hi: 'hi-IN',
  mr: 'mr-IN'
};

export function getActiveLocale() {
  const lang = getCurrentLang();
  return LOCALE_MAP[lang] || 'en-IN';
}

export function formatRupees(amount) {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }
  const locale = getActiveLocale();
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toLocaleString(locale, { maximumFractionDigits: 2 })} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toLocaleString(locale, { maximumFractionDigits: 2 })} L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toLocaleString(locale, { maximumFractionDigits: 1 })} K`;
  }
  return `₹${amount.toLocaleString(locale)}`;
}

export function formatMeters(meters) {
  const m = parseFloat(meters) || 0;
  const locale = getActiveLocale();
  return `${m.toLocaleString(locale)} m`;
}

export function formatPercentage(val) {
  return `${Math.round(val || 0)}%`;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString(getActiveLocale(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}
