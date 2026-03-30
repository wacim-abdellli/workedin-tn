const fs = require('fs');
let file = fs.readFileSync('src/pages/ResetPassword.tsx', 'utf8');

const t = (k, def) => '{t("' + k + '", "' + def + '")}';

const jsxReplacements = [
  ['رابط منتهي الصلاحية', 'auth.resetPassword.linkExpired'],
  ['طلب رابط جديد', 'auth.resetPassword.requestNewLink'],
  ['تعيين كلمة مرور جديدة', 'auth.resetPassword.setNewTitle'],
  ['كلمة المرور الجديدة', 'auth.password.new'],
  ['قوة كلمة المرور', 'auth.passwordStrength.label'],
  ['تأكيد كلمة المرور', 'auth.confirmPassword'],
  ['8 أحرف على الأقل', 'auth.passwordRequirements.minLength'],
  ['حرف كبير واحد على الأقل', 'auth.passwordRequirements.uppercase'],
  ['حرف صغير واحد على الأقل', 'auth.passwordRequirements.lowercase'],
  ['رقم واحد على الأقل', 'auth.passwordRequirements.number'],
  ['تم تغيير كلمة المرور بنجاح!', 'auth.resetPassword.successTitle'],
  ['يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.', 'auth.resetPassword.loginNow'],
  ['جاري تحويلك لصفحة تسجيل الدخول...', 'auth.resetPassword.redirecting']
];

jsxReplacements.forEach(([ar, key]) => {
  file = file.replace(new RegExp('>' + ar + '<', 'g'), '>' + t(key, ar) + '<');
});
file = file.replace(new RegExp('>رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.<', 'g'), '>' + t('auth.resetPassword.invalidLinkDesc', 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.') + '<');
file = file.replace(new RegExp('رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.', 'g'), t('auth.resetPassword.invalidLinkDesc', 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.'));
file = file.replace(new RegExp('>أدخل كلمة المرور الجديدة لحسابك<', 'g'), '>' + t('auth.resetPassword.setNewDesc', 'أدخل كلمة المرور الجديدة لحسابك') + '<');
file = file.replace(new RegExp('أدخل كلمة المرور الجديدة لحسابك', 'g'), t('auth.resetPassword.setNewDesc', 'أدخل كلمة المرور الجديدة لحسابك'));
file = file.replace(new RegExp('>متطلبات كلمة المرور:<', 'g'), '>' + t('auth.passwordRequirements.title', 'متطلبات كلمة المرور:') + '<');
file = file.replace(new RegExp('متطلبات كلمة المرور:', 'g'), t('auth.passwordRequirements.title', 'متطلبات كلمة المرور:'));

file = file.replace('placeholder="أدخل كلمة المرور الجديدة"', 'placeholder={t("auth.passwordPlaceholder.new", "أدخل كلمة المرور الجديدة")}');
file = file.replace('placeholder="أعد إدخال كلمة المرور"', 'placeholder={t("auth.confirmPasswordPlaceholder", "أعد إدخال كلمة المرور")}');

file = file.replace('"تم تغيير كلمة المرور بنجاح!"', 't("auth.resetPassword.successTitle", "تم تغيير كلمة المرور بنجاح!")');
file = file.replace("'تم تغيير كلمة المرور بنجاح'", 't("auth.resetPassword.success", "تم تغيير كلمة المرور بنجاح")');

fs.writeFileSync('src/pages/ResetPassword.tsx', file);
console.log('Done replacement');
