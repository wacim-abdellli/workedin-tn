import { ar } from './src/i18n/ar';
import { en } from './src/i18n/en';
import { fr } from './src/i18n/fr';
import * as fs from 'fs';

function getFlattenedPairs(obj: any, prefix = ''): { [key: string]: string } {
    const pairs: { [key: string]: string } = {};
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            Object.assign(pairs, getFlattenedPairs(obj[key], `${prefix}${key}.`));
        } else {
            pairs[`${prefix}${key}`] = obj[key] as string;
        }
    }
    return pairs;
}

const arPairs = getFlattenedPairs(ar);
const enPairs = getFlattenedPairs(en);
const frPairs = getFlattenedPairs(fr);

const allowlist = ['Khedmetna', 'Khedma-TN', 'Khedma TN', 'Khedma', 'TN', 'URL', 'React', 'Node.js', 'Python', 'UX/UI', 'Figma', 'SEO', 'API', 'Docker', 'AWS', '3D', 'IT', 'AI'];
function shouldCheck(val: string) {
    if (!val || typeof val !== 'string') return false;
    if (allowlist.includes(val)) return false;
    // if value only contains numbers and punctuation, skip
    if (!/[a-zA-Z\u0600-\u06FF]/.test(val)) return false;
    // allow image paths
    if (val.startsWith('/images/') || val.includes('.jpg') || val.includes('.png')) return false;
    return true;
}

const untranslatedFr = Object.keys(frPairs).filter(k => frPairs[k] === enPairs[k] && shouldCheck(enPairs[k]));
const untranslatedAr = Object.keys(arPairs).filter(k => arPairs[k] === enPairs[k] && shouldCheck(enPairs[k]));
const untranslatedArFr = Object.keys(arPairs).filter(k => arPairs[k] === frPairs[k] && shouldCheck(frPairs[k]));

const missingAr = Object.keys(enPairs).filter(k => arPairs[k] === undefined);
const missingFr = Object.keys(enPairs).filter(k => frPairs[k] === undefined);

const log = [
    '--- MISSING IN AR ---',
    missingAr.join('\n'),
    '--- MISSING IN FR ---',
    missingFr.join('\n'),
    '\n--- UNTRANSLATED FR (matches EN) ---',
    ...untranslatedFr.map(k => `${k}: ${frPairs[k]}`),
    '\n--- UNTRANSLATED AR (matches EN) ---',
    ...untranslatedAr.map(k => `${k}: ${arPairs[k]}`)
].join('\n');

fs.writeFileSync('i18n_issues.log', log);
console.log('Wrote to i18n_issues.log');
