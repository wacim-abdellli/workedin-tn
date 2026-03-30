const fs = require('fs');
let file = fs.readFileSync('src/pages/JobBoard.tsx', 'utf8');
if (!file.includes('const tr = (')) {
    file = file.replace('const { t, language } = useTranslation();', 'const { t, language } = useTranslation();\n    const tr = (ar: string, en: string, fr?: string) => language === "ar" ? ar : language === "fr" ? (fr || en) : en;');
}
file = file.replace('Browse and apply to freelance opportunities', '{tr("تصفح وقدم على فرص العمل المستقل", "Browse and apply to freelance opportunities", "Parcourez et postulez aux offres")}');
fs.writeFileSync('src/pages/JobBoard.tsx', file);

file = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');
file = file.replace('Post a New Job', '{tx("dashboard.client.postJob", undefined, "Post a New Job")}');
fs.writeFileSync('src/pages/ClientDashboard.tsx', file);
