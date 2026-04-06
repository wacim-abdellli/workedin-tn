const fs = require('fs');
const path = require('path');

// Keys for our i18n injection for Verification Queue (Admin context)
const keys = {
  loadError: "Failed to load verification requests",
  approveFailed: "Failed to approve verification",
  rejectFailed: "Failed to reject verification",
  minutesAgo: "Minutes ago",
  since: "Since",
  hours: "hours",
  days: "days",
  errorTitle: "Loading error",
  retry: "Retry",
  seoTitle: "Identity verification requests - Admin dashboard",
  seoDescription: "Review and manage submitted identity verification requests",
  title: "Identity verification requests",
  description: "Review and manage identity verification requests submitted by users",
  pending: "Pending",
  queueTitle: "Pending requests",
  noPending: "No pending verification requests",
  reviewTitle: "Review verification",
  idNumber: "ID number",
  cardFront: "Card front"
};

const ar_translations = {
  loadError: "فشل تحميل طلبات التحقق",
  approveFailed: "فشل الموافقة على التحقق",
  rejectFailed: "فشل رفض التحقق",
  minutesAgo: "منذ دقائق",
  since: "منذ",
  hours: "ساعات",
  days: "أيام",
  errorTitle: "خطأ في التحميل",
  retry: "إعادة المحاولة",
  seoTitle: "طلبات التحقق من الهوية - لوحة تحكم المسؤول",
  seoDescription: "مراجعة وإدارة طلبات التحقق من الهوية المقدمة",
  title: "طلبات التحقق من الهوية",
  description: "مراجعة وإدارة طلبات التحقق من الهوية المقدمة من المستخدمين",
  pending: "قيد الانتظار",
  queueTitle: "الطلبات المعلقة",
  noPending: "لا توجد طلبات تحقق معلقة",
  reviewTitle: "مراجعة التحقق",
  idNumber: "رقم الهوية",
  cardFront: "الواجهة الأمامية للبطاقة"
};

const fr_translations = {
  loadError: "Échec du chargement des demandes de vérification",
  approveFailed: "Échec de l'approbation de la vérification",
  rejectFailed: "Échec du rejet de la vérification",
  minutesAgo: "Il y a quelques minutes",
  since: "Depuis",
  hours: "heures",
  days: "jours",
  errorTitle: "Erreur de chargement",
  retry: "Réessayer",
  seoTitle: "Demandes de vérification d'identité - Tableau de bord d'administration",
  seoDescription: "Passez en revue et gérez les demandes de vérification d'identité",
  title: "Demandes de vérification d'identité",
  description: "Examinez et gérez les demandes de vérification d'identité soumises par les utilisateurs",
  pending: "En attente",
  queueTitle: "Demandes en attente",
  noPending: "Aucune demande de vérification en attente",
  reviewTitle: "Examiner la vérification",
  idNumber: "Numéro d'identité",
  cardFront: "Recto de la carte"
};

function formatKeys(obj) {
  return Object.entries(obj).map(([k, v]) => `                ${k}: "${v}"`).join(',\n');
}

function injectVerificationQueue(filePath, formatKeysFn, translations) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Let's find "admin: {" inside dashboard: {
  const adminRegex = /admin:\s*\{/;
  if (adminRegex.test(content) && !content.includes('verificationQueue:')) {
    content = content.replace(adminRegex, `admin: {
            verificationQueue: {
${formatKeysFn(translations)}
            },`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Injected Verification Queue in ${filePath}`);
  }
}

injectVerificationQueue(path.join(__dirname, 'src', 'i18n', 'en.ts'), formatKeys, keys);
injectVerificationQueue(path.join(__dirname, 'src', 'i18n', 'ar.ts'), formatKeys, ar_translations);
injectVerificationQueue(path.join(__dirname, 'src', 'i18n', 'fr.ts'), formatKeys, fr_translations);
