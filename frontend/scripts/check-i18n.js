import { TRANSLATIONS } from '../src/i18n/translations.js';

function getFlatKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getFlatKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enKeys = new Set(getFlatKeys(TRANSLATIONS.en));
const languages = ['gu', 'hi', 'mr'];

console.log(`====================================================`);
console.log(`LOOMUS 2.0 i18n Translation Integrity Checker`);
console.log(`Total Base Keys in English (en): ${enKeys.size}`);
console.log(`====================================================`);

let totalMissing = 0;

for (const lang of languages) {
  const langKeys = new Set(getFlatKeys(TRANSLATIONS[lang] || {}));
  const missing = [];

  for (const key of enKeys) {
    if (!langKeys.has(key)) {
      missing.push(key);
    }
  }

  if (missing.length === 0) {
    console.log(`✅ [${lang.toUpperCase()}] 100% Complete! (${langKeys.size}/${enKeys.size} keys present)`);
  } else {
    console.warn(`⚠️ [${lang.toUpperCase()}] Missing ${missing.length} keys:`);
    missing.forEach(k => console.warn(`   - ${k}`));
    totalMissing += missing.length;
  }
}

console.log(`====================================================`);
if (totalMissing === 0) {
  console.log(`🎉 ALL 4 LANGUAGES (EN, GU, HI, MR) FULLY SYNCHRONIZED!`);
  process.exit(0);
} else {
  console.error(`❌ Total missing translation keys: ${totalMissing}`);
  process.exit(1);
}

