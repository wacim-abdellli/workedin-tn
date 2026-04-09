const iconv = require('iconv-lite');
const str = 'ØªØ¨Ø­Ø« Ø¹Ù† Ù…Ø­ØªØ±Ù ÙŠÙ† ØªÙˆÙ†Ø³ÙŠÙŠÙ† Ù…ÙˆØ«Ù‚ÙŠÙ† Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ÙƒØŸ Ø§Ù†Ø´Ø± Ù…Ø´Ø±ÙˆØ¹Ùƒ Ù…Ø¬Ø§Ù†Ø§Ù‹';
const buf = iconv.encode(str, 'latin1'); 
console.log(iconv.decode(buf, 'utf8'));
