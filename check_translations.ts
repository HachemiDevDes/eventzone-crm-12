import fs from 'fs';
import en from './src/locales/en.ts';
import fr from './src/locales/fr.ts';

const keysText = fs.readFileSync('keys.txt', 'utf8');
const keys = keysText.split('\n').filter(Boolean).map(k => {
  const match = k.match(/t\("([^"]+)"\)/);
  return match ? match[1] : null;
}).filter(Boolean);

const uniqueKeys = [...new Set(keys)];

const missingEn = uniqueKeys.filter(k => !(k in en));
const missingFr = uniqueKeys.filter(k => !(k in fr));

console.log("Missing in EN:", missingEn);
console.log("Missing in FR:", missingFr);
