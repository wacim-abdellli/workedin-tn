const fs = require('fs');
let code = fs.readFileSync('src/pages/ResetPassword.tsx', 'utf8');

// Strip out the arabic fallbacks first
code = code.replace(/ \|\| "\S*?[\u0600-\u06FF]\S*?"/g, '');
code = code.replace(/ \|\| \S*?[\u0600-\u06FF]\S*?/g, ''); // in case no quotes
code = code.replace(/ \|\| \"[^\"]*?[\u0600-\u06FF][^\"]*?\"/g, '');

const arr = [
  ['رابط منتهي الصلاحية', '{t.auth?.resetPassword?.expiredLink || "Expired Link"}'],
  ['{t.auth?.resetPassword?.invalidLinkDesc || "رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد."}', '{t.auth?.resetPassword?.invalidLinkDesc || "Invalid reset link. Please request a new one."}'],
  ['طلب رابط جديد', '{t.auth?.resetPassword?.requestNewLink || "Request New Link"}'],
  ['تعيين كلمة مرور جديدة', '{t.auth?.resetPassword?.setNew || "Set New Password"}'],
  ['{t.auth?.resetPassword?.setNewDesc || "أدخل كلمة المرور الجديدة لحسابك"}', '{t.auth?.resetPassword?.setNewDesc || "Enter your new password"}'],
  ['كلمة المرور الجديدة', '{t.auth?.password?.new || "New Password"}'],
  ['placeholder={t.auth?.passwordPlaceholder?.new || "أدخل كلمة المرور الجديدة"}', 'placeholder={t.auth?.passwordPlaceholder?.new || "Enter your new password"}'],
  ['<span className="text-xs text-gray-500">{t.auth?.passwordStrength?.label || "قوة كلمة المرور"}</span>', '<span className="text-xs text-gray-500">{t.auth?.passwordStrength?.label || "Password strength"}</span>'],
  ['تأكيد كلمة المرور', '{t.auth?.confirmPassword || "Confirm Password"}'],
  ['placeholder={t.auth?.confirmPasswordPlaceholder || "أعد إدخال كلمة المرور"}', 'placeholder={t.auth?.confirmPasswordPlaceholder || "Re-enter your password"}'],
  ['{t.auth?.passwordRequirements?.title || "متطلبات كلمة المرور:"}', '{t.auth?.passwordRequirements?.title || "Password Requirements"}'],
  ['• 8 أحرف على الأقل', '{t.auth?.passwordRequirements?.req1 || "• At least 8 characters"}'],
  ['• حرف كبير واحد على الأقل', '{t.auth?.passwordRequirements?.req2 || "• At least one uppercase letter"}'],
  ['• حرف صغير واحد على الأقل', '{t.auth?.passwordRequirements?.req3 || "• At least one lowercase letter"}'],
  ['• رقم واحد على الأقل', '{t.auth?.passwordRequirements?.req4 || "• At least one number"}'],
  ['تم تغيير كلمة المرور بنجاح!', '{t.auth?.resetPassword?.success || "Password changed successfully!"}'],
  ['يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.', '{t.auth?.resetPassword?.successDesc || "You can now log in with your new password."}'],
  ['جاري تحويلك لصفحة تسجيل الدخول...', '{t.auth?.resetPassword?.redirecting || "Redirecting to login..."}']
];

arr.forEach(pair => {
  code = code.replace(pair[0], pair[1]);
});

fs.writeFileSync('src/pages/ResetPassword.tsx', code);
console.log('done');
