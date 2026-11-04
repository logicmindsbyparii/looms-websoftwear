import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const locales = {
  en: JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/en.json'), 'utf8')),
  gu: JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/gu.json'), 'utf8')),
  hi: JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/hi.json'), 'utf8')),
  mr: JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/mr.json'), 'utf8'))
};

export const getTranslation = (key, lang = 'en', fallbackText = '') => {
  const chosenLang = ['en', 'gu', 'hi', 'mr'].includes(lang) ? lang : 'en';
  return locales[chosenLang]?.[key] || locales.en?.[key] || fallbackText || key;
};

export const extractLanguageFromReq = (req) => {
  if (req?.user?.preferredLanguage) return req.user.preferredLanguage;
  const header = req?.headers?.['accept-language'];
  if (!header) return 'en';
  if (header.includes('gu')) return 'gu';
  if (header.includes('hi')) return 'hi';
  if (header.includes('mr')) return 'mr';
  return 'en';
};

