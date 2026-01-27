import { Header, Footer } from '../components/layout';

export default function Terms() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container-custom py-12">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold text-foreground mb-8">شروط الخدمة</h1>

                    <div className="card prose prose-lg max-w-none">
                        <p className="text-muted mb-6">
                            آخر تحديث: يناير 2026
                        </p>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">1. مقدمة</h2>
                            <p className="text-gray-700 mb-4">
                                مرحبًا بك في خدمة.تن (Khedma.tn)، منصة العمل الحر الرائدة في تونس. باستخدامك لهذه المنصة، فإنك توافق على الالتزام بهذه الشروط والأحكام.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">2. التسجيل والحسابات</h2>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li>يجب أن يكون عمرك 18 عامًا على الأقل للتسجيل</li>
                                <li>المعلومات المقدمة يجب أن تكون دقيقة وحديثة</li>
                                <li>أنت مسؤول عن الحفاظ على سرية حسابك</li>
                                <li>يجب إبلاغنا فورًا عن أي استخدام غير مصرح به</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">3. استخدام المنصة</h2>
                            <p className="text-gray-700 mb-4">
                                يحظر استخدام المنصة في:
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li>أي نشاط غير قانوني</li>
                                <li>انتحال شخصية الآخرين</li>
                                <li>نشر محتوى مسيء أو ضار</li>
                                <li>التحايل على آليات الدفع</li>
                                <li>جمع بيانات المستخدمين</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">4. العقود والمدفوعات</h2>
                            <p className="text-gray-700 mb-4">
                                تعمل خدمة.تن كوسيط بين الموظفين الحرين والعملاء. نحن لسنا طرفًا في العقود المبرمة بينهم.
                            </p>
                            <ul className="list-disc list-inside text-gray-700 space-y-2">
                                <li>رسوم المنصة: 10% من قيمة كل عقد</li>
                                <li>المدفوعات تتم عبر طرق آمنة ومعتمدة</li>
                                <li>فترة الاحتفاظ بالمدفوعات: 7 أيام</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">5. حل النزاعات</h2>
                            <p className="text-gray-700 mb-4">
                                في حالة نشوء نزاع، نوفر آلية للتحكيم. قرارات فريق الدعم نهائية وملزمة.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">6. التواصل</h2>
                            <p className="text-gray-700">
                                للتواصل معنا حول هذه الشروط:
                                <br />
                                البريد الإلكتروني: legal@khedma.tn
                            </p>
                        </section>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
