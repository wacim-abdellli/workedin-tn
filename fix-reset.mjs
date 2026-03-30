import fs from 'fs';

let content = fs.readFileSync('src/pages/ResetPassword.tsx', 'utf8');

const mappings = [
  ['كلمة المرور يجب أن تكون 8 أحرف على الأقل', 't.auth?.passwordValidation?.minLength || "كلمة المرور يجب أن تكون 8 أحرف على الأقل"'],
  ['يجب أن تحتوي على حرف كبير واحد على الأقل', 't.auth?.passwordValidation?.uppercase || "يجب أن تحتوي على حرف كبير واحد على الأقل"'],
  ['يجب أن تحتوي على حرف صغير واحد على الأقل', 't.auth?.passwordValidation?.lowercase || "يجب أن تحتوي على حرف صغير واحد على الأقل"'],
  ['يجب أن تحتوي على رقم واحد على الأقل', 't.auth?.passwordValidation?.number || "يجب أن تحتوي على رقم واحد على الأقل"'],
  ['كلمات المرور غير متطابقة', 't.auth?.passwordMismatch || "كلمات المرور غير متطابقة"'],
  ['ضعيفة', 't.auth?.passwordStrength?.weak || "ضعيفة"'],
  ['متوسطة', 't.auth?.passwordStrength?.medium || "متوسطة"'],
  ['قوية', 't.auth?.passwordStrength?.strong || "قوية"'],
  ['رابط منتهي الصلاحية', 't.auth?.resetPassword?.linkExpired || "رابط منتهي الصلاحية"'],
  ['رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.', 't.auth?.resetPassword?.invalidLinkDesc || "رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد."'],
  ['طلب رابط جديد', 't.auth?.resetPassword?.requestNewLink || "طلب رابط جديد"'],
  ['تعيين كلمة مرور جديدة', 't.auth?.resetPassword?.setNewTitle || "تعيين كلمة مرور جديدة"'],
  ['أدخل كلمة المرور الجديدة لحسابك', 't.auth?.resetPassword?.setNewDesc || "أدخل كلمة المرور الجديدة لحسابك"'],
  ['كلمة المرور الجديدة', 't.auth?.password?.new || "كلمة المرور الجديدة"'],
  ['أدخل كلمة المرور الجديدة', 't.auth?.passwordPlaceholder?.new || "أدخل كلمة المرور الجديدة"'],
  ['قوة كلمة المرور', 't.auth?.passwordStrength?.label || "قوة كلمة المرور"'],
  ['تأكيد كلمة المرور', 't.auth?.confirmPassword || "تأكيد كلمة المرور"'],
  ['أعد إدخال كلمة المرور', 't.auth?.confirmPasswordPlaceholder || "أعد إدخال كلمة المرور"'],
  ['متطلبات كلمة المرور:', 't.auth?.passwordRequirements?.title || "متطلبات كلمة المرور:"'],
  ['8 أحرف على الأقل', 't.auth?.passwordRequirements?.minLength || "8 أحرف على الأقل"'],
  ['حرف كبير واحد على الأقل', 't.auth?.passwordRequirements?.uppercase || "حرف كبير واحد على الأقل"'],
  ['حرف صغير واحد على الأقل', 't.auth?.passwordRequirements?.lowercase || "حرف صغير واحد على الأقل"'],
  ['رقم واحد على الأقل', 't.auth?.passwordRequirements?.number || "رقم واحد على الأقل"'],
  ['تم تغيير كلمة المرور بنجاح!', 't.auth?.resetPassword?.success || "تم تغيير كلمة المرور بنجاح!"'],
  ['تم تغيير كلمة المرور بنجاح', 't.auth?.resetPassword?.success || "تم تغيير كلمة المرور بنجاح"'],
  ['يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.', 't.auth?.resetPassword?.loginNow || "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة."'],
  ['جاري تحويلك لصفحة تسجيل الدخول...', 't.auth?.resetPassword?.redirecting || "جاري تحويلك لصفحة تسجيل الدخول..."']
];


let schemaDef = `// Password validation schema
const getResetPasswordSchema = (t: any) => z.object({
    password: z.string()
        .min(8, t.auth?.passwordValidation?.minLength || 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
        .regex(/[A-Z]/, t.auth?.passwordValidation?.uppercase || 'يجب أن تحتوي على حرف كبير واحد على الأقل')
        .regex(/[a-z]/, t.auth?.passwordValidation?.lowercase || 'يجب أن تحتوي على حرف صغير واحد على الأقل')
        .regex(/[0-9]/, t.auth?.passwordValidation?.number || 'يجب أن تحتوي على رقم واحد على الأقل'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: t.auth?.passwordMismatch || 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<ReturnType<typeof getResetPasswordSchema>>;\n`;

let pwdStrengthStr = `const getPasswordStrength = (password: string, t: any): { score: number; label: string; color: string } => {`;
content = content.replace(/const getPasswordStrength = \(password: string\): { score: number; label: string; color: string } => {/, pwdStrengthStr);
content = content.replace(/if \(score <= 2\) return \{ score, label: 'ضعيفة', color: 'bg-red-500' \};/, 
  `if (score <= 2) return { score, label: t.auth?.passwordStrength?.weak || 'ضعيفة', color: 'bg-red-500' };`);
content = content.replace(/if \(score <= 4\) return \{ score, label: 'متوسطة', color: 'bg-yellow-500' \};/, 
  `if (score <= 4) return { score, label: t.auth?.passwordStrength?.medium || 'متوسطة', color: 'bg-yellow-500' };`);
content = content.replace(/return \{ score, label: 'قوية', color: 'bg-green-500' \};/, 
  `return { score, label: t.auth?.passwordStrength?.strong || 'قوية', color: 'bg-green-500' };`);

content = content.replace(/const strength = getPasswordStrength\(password\);/g, "const strength = getPasswordStrength(password, t);");

content = content.replace(/\/\/ Password validation schema[\s\S]*?type ResetPasswordFormData = z\.infer<typeof resetPasswordSchema>;/m, schemaDef);

content = content.replace(/resolver: zodResolver\(resetPasswordSchema\),/g, "resolver: zodResolver(getResetPasswordSchema(t)),");

mappings.forEach(([ar, repl]) => {
    // text in JSX
    content = content.split(`>${ar}<`).join(`>{${repl}}<`);
    content = content.split(`> ${ar} <`).join(`> {${repl}} <`);
    // exact literals like placeholder="ار"
    content = content.split(`="${ar}"`).join(`={${repl}}`);
    content = content.split(`'${ar}'`).join(`{${repl}}`);
    content = content.split(`"${ar}"`).join(`{${repl}}`);
});

fs.writeFileSync('src/pages/ResetPassword.tsx', content);
console.log("Updated ResetPassword.tsx");
