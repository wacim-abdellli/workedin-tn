const fs = require('fs');
let text = fs.readFileSync('src/pages/ResetPassword.tsx', 'utf8');

text = text.replace(/t\.auth\?\.validation\?\.password\?\.minLengthلمة المرور يجب أن تكون 8 أحرف على الأقل\"/g, 't.auth?.validation?.password?.minLength || "Password must be at least 8 characters"');
text = text.replace(/t\.auth\?\.validation\?\.password\?\.uppercaseجب أن تحتوي على حرف كبير واحد على الأقل\"/g, 't.auth?.validation?.password?.uppercase || "Must contain at least one uppercase letter"');
text = text.replace(/t\.auth\?\.validation\?\.password\?\.lowercaseجب أن تحتوي على حرف صغير واحد على الأقل\"/g, 't.auth?.validation?.password?.lowercase || "Must contain at least one lowercase letter"');
text = text.replace(/t\.auth\?\.validation\?\.password\?\.numberجب أن تحتوي على رقم واحد على الأقل\"/g, 't.auth?.validation?.password?.number || "Must contain at least one number"');
text = text.replace(/t\.auth\?\.validation\?\.password\?\.matchلمات المرور غير متطابقة\"/g, 't.auth?.validation?.password?.match || "Passwords do not match"');

text = text.replace(/\{t\.auth\?\.resetPassword\?\.invalidLinkDescابط إعادة التعيين غير صالح أو منتهي الصلاحية\. يرجى \{t\.auth\?\.resetPassword\?\.requestNewLink \|\| \"Request New Link\"\}\.\"\}/g, '{t.auth?.resetPassword?.invalidLinkDesc || "Invalid reset link."}');
text = text.replace(/>\s*طلب رابط جديد\s*</g, '>{t.auth?.resetPassword?.requestNewLink || "Request New Link"}<');

text = text.replace(/\{t\.auth\?\.resetPassword\?\.setNewDescدخل \{t\.auth\?\.password\?\.new \|\| \"New Password\"\} لحسابك\"\}/g, '{t.auth?.resetPassword?.setNewDesc || "Enter your new password"}');
text = text.replace(/>\s*كلمة المرور الجديدة\s*</g, '>{t.auth?.password?.new || "New Password"}<');

text = text.replace(/t\.auth\?\.passwordPlaceholder\?\.newدخل كلمة المرور الجديدة\"/g, 't.auth?.passwordPlaceholder?.new || "Enter your new password"');
text = text.replace(/\{t\.auth\?\.passwordStrength\?\.labelوة كلمة المرور\"\}/g, '{t.auth?.passwordStrength?.label || "Password strength"}');
text = text.replace(/t\.auth\?\.confirmPasswordPlaceholderعد إدخال كلمة المرور\"/g, 't.auth?.confirmPasswordPlaceholder || "Re-enter your password"');
text = text.replace(/\{t\.auth\?\.passwordRequirements\?\.titleتطلبات كلمة المرور:\"\}/g, '{t.auth?.passwordRequirements?.title || "Password Requirements:"}');

fs.writeFileSync('src/pages/ResetPassword.tsx', text);
