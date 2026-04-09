import * as fs from 'fs';

const replacements = [
    { from: "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©", to: "العربية" }
];

const filesToProcess = [
    'src/i18n/en.ts',
    'src/i18n/fr.ts',
    'src/i18n/ar.ts'
];

filesToProcess.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    for (const r of replacements) {
        if (content.includes(r.from)) {
            content = content.replace(new RegExp(r.from.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g'), r.to);
            changed = true;
        }
    }
    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Fixed mojibake in ${file}`);
    }
});

// Now insert the missing faq items in ar.ts
const arTsPath = 'src/i18n/ar.ts';
let arContent = fs.readFileSync(arTsPath, 'utf8');
if (!arContent.includes('ما هي طرق الدفع المتاحة؟')) {
    const missingFaq = `
                    {
                        q: 'ما هي طرق الدفع المتاحة؟',
                        a: 'ندعم حالياً الضمان عبر Dhmad للمعاملات الآمنة. محفظة Flouci و D17 (البريد التونسي) قادمة قريباً. تحافظ Dhmad على أموالك بأمان حتى يتم الموافقة على العمل — نفس النظام المستخدم من قبل Tunisie Freelance.',
                    },
                    {
                        q: 'هل Dhmad آمن؟',
                        a: 'نعم. Dhmad هي منصة ضمان تونسية مصرح لها بالاحتفاظ بالأموال كطرف ثالث موثوق. أموالك محمية حتى توافق على العمل.',
                    },
                    {
                        q: 'متى ستتوفر Flouci و D17؟',
                        a: 'نحن نعمل بنشاط على إضافة Flouci و D17. ستتوفر قريباً وسنقوم بإعلام جميع المستخدمين عند إطلاقها.',
                    },
                    {
                        q: 'ماذا يحدث في حال وجود نزاع؟',
                        a: 'إذا كان هناك خلاف، تحتفظ Dhmad بالأموال حتى يتم حل النزاع. لا يمكن لأي من الطرفين الوصول إلى الأموال حتى تتم تسوية المشكلة.',
                    },`;

    const marker = "نحن فقط نفرض عمولة صغيرة على المشاريع المنجزة بنجاح.',\n                    },";
    if (arContent.includes(marker)) {
        arContent = arContent.replace(marker, marker + missingFaq);
        fs.writeFileSync(arTsPath, arContent);
        console.log('Inserted missing faq items in ar.ts');
    } else {
        console.log('FAIL: Marker not found in ar.ts');
    }
}
