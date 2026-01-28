import { Header, Footer } from '../components/layout';
import SEO, { SEO_CONFIG } from '../components/common/SEO';

export default function Privacy() {
    return (
        <div className="min-h-screen bg-gray-50">
            <SEO {...SEO_CONFIG.privacy} url="/privacy" />
            <Header />

            <div className="container-custom py-12">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold text-foreground mb-8">سياسة الخصوصية</h1>

                    <div className="card prose prose-lg max-w-none">
                        <p className="text-muted mb-6">
                            آخر تحديث: يناير 2026
                        </p>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">1. البيانات التي نجمعها</h2>
                            <p className="text-gray-700 mb-4">
                                نجمع المعلومات التالية عند استخدامك للمنصة:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li>معلومات الحساب: الاسم، البريد الإلكتروني، رقم الهاتف</li>
                                <li>معلومات الملف الشخصي: المهارات، الخبرات، الصور</li>
                                <li>بيانات الاستخدام: الصفحات المزارة، الوقت المستغرق</li>
                                <li>معلومات الدفع: تفاصيل الحساب البنكي (مشفرة)</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">2. كيف نستخدم بياناتك</h2>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li>توفير وتحسين خدماتنا</li>
                                <li>معالجة المعاملات المالية</li>
                                <li>إرسال إشعارات مهمة</li>
                                <li>منع الاحتيال وحماية الأمان</li>
                                <li>تحسين تجربة المستخدم</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">3. مشاركة البيانات</h2>
                            <p className="text-gray-700 mb-4">
                                لا نبيع بياناتك الشخصية. قد نشاركها مع:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li>مزودي خدمات الدفع (لمعالجة المعاملات)</li>
                                <li>السلطات القانونية (عند الطلب الرسمي)</li>
                                <li>المستخدمين الآخرين (المعلومات العامة في ملفك)</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">4. حماية البيانات</h2>
                            <p className="text-gray-700 mb-4">
                                نستخدم تقنيات أمان متقدمة لحماية بياناتك:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li>تشفير SSL/TLS لجميع الاتصالات</li>
                                <li>تشفير البيانات الحساسة في قاعدة البيانات</li>
                                <li>مراجعات أمنية دورية</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">5. حقوقك</h2>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li>الوصول إلى بياناتك الشخصية</li>
                                <li>تصحيح البيانات غير الدقيقة</li>
                                <li>حذف حسابك وبياناتك</li>
                                <li>تصدير بياناتك</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">6. ملفات تعريف الارتباط (Cookies)</h2>
                            <p className="text-gray-700 mb-4">
                                نستخدم ملفات تعريف الارتباط لتحسين تجربتك. يمكنك التحكم في هذه الإعدادات من متصفحك.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">7. التواصل</h2>
                            <p className="text-gray-700">
                                لأي استفسارات حول الخصوصية:
                                <br />
                                البريد الإلكتروني: privacy@khedma.tn
                            </p>
                        </section>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
