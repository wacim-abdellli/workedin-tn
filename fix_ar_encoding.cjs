const fs = require('fs');
const iconv = require('iconv-lite');

const file = 'src/i18n/ar.ts';
let str = fs.readFileSync(file, 'utf8');

// Fix BOM first if it's there
if (str.charCodeAt(0) === 0xFEFF) {
    str = str.substring(1);
}

// Convert the garbled string back treating it as windows-1252
const originalBuffer = iconv.encode(str, 'windows-1252');

// Decode the raw bytes as UTF-8
let fixedStr = originalBuffer.toString('utf8');

if (fixedStr.charCodeAt(0) === 0xFEFF) {
    fixedStr = fixedStr.substring(1);
}

fs.writeFileSync(file, fixedStr, 'utf8');
console.log('Fixed ', file);

console.log(fixedStr.slice(0, 200));
