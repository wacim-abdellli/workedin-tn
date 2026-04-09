import { ar } from './src/i18n/ar';
import { en } from './src/i18n/en';
import { fr } from './src/i18n/fr';

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

const extractVars = (str: string) => {
    if (typeof str !== 'string') return [];
    const matches = str.match(/\{\{\s*(\w+)\s*\}\}/g) || [];
    return matches.map(m => m.replace(/[\{\}\s]/g, '')).sort().join(',');
};

const keys = new Set([...Object.keys(arPairs), ...Object.keys(enPairs), ...Object.keys(frPairs)]);

let brokenCount = 0;
for (const key of keys) {
    const enVal = enPairs[key] || '';
    const arVal = arPairs[key] || '';
    const frVal = frPairs[key] || '';
    
    // allow empty values to skip the check as they might just be missing
    const enVars = extractVars(enVal);
    const arVars = arVal ? extractVars(arVal) : enVars;
    const frVars = frVal ? extractVars(frVal) : enVars;
    
    if (enVars !== arVars || enVars !== frVars || arVars !== frVars) {
        console.log(`Mismatch in variables for key: ${key}`);
        console.log(`EN vars: ${enVars} (${enVal})`);
        console.log(`AR vars: ${arVars} (${arVal})`);
        console.log(`FR vars: ${frVars} (${frVal})`);
        console.log('---');
        brokenCount++;
    }
}
console.log(`Total variable mismatches: ${brokenCount}`);
