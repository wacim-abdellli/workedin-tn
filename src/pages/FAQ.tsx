import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle, MessageCircle, FileText, CreditCard, Shield, User } from 'lucide-react';
import { Header, Footer } from '../components/layout';

const FAQ_CATEGORIES = [
    {
        id: 'general',
        icon: HelpCircle,
        title: 'أسئلة عامة',
        questions: [
            {
                q: 'ما هي خدمة.تن؟',
                a: 'خدمة.تن هي أول منصة تونسية للعمل الحر، تربط بين الموظفين الحرين والعملاء بطريقة سهلة وآمنة. نوفر نظام دفع محلي ودعم باللغة العربية.'
            },
            {
                q: 'كيف أبدأ؟',
                a: 'سجل حساب جديد، أكمل ملفك الشخصي، ثم ابدأ بتصفح المهام (كموظف حر) أو نشر مهمة (كعميل). العملية بسيطة ولا تستغرق أكثر من 5 دقائق.'
            },
            {
                q: 'هل المنصة مجانية؟',
                a: 'التسجيل مجاني تمامًا. نأخذ عمولة 10% فقط من قيمة العقود المكتملة.'
            }
        ]
    },
    {
        id: 'freelancer',
        icon: User,
        title: 'للموظفين الحرين',
        questions: [
            {
                q: 'كيف أجد عملاً؟',
                a: 'تصفح لوحة المهام واستخدم الفلاتر للعثور على مهام تناسب مهاراتك. قدم عروضك مع وصف واضح لخبرتك والسعر المقترح.'
            },
            {
                q: 'متى أستلم أرباحي؟',
                a: 'بعد موافقة العميل على العمل المنجز، تصبح الأموال متاحة للسحب خلال 7 أيام عمل.'
            },
            {
                q: 'كيف أبني سمعة جيدة؟',
                a: 'أكمل المشاريع في الوقت المحدد، تواصل بشكل واضح، واطلب من العملاء ترك تقييم بعد كل مشروع.'
            }
        ]
    },
    {
        id: 'client',
        icon: FileText,
        title: 'للعملاء',
        questions: [
            {
                q: 'كيف أنشر مهمة؟',
                a: 'اضغط على "نشر مهمة"، أضف وصفًا تفصيليًا، حدد الميزانية والمهارات المطلوبة، ثم انشر. ستبدأ بتلقي العروض خلال ساعات.'
            },
            {
                q: 'كيف أختار الموظف المناسب؟',
                a: 'راجع ملفات المتقدمين، تقييماتهم السابقة، وأعمالهم في المعرض. تواصل معهم لمناقشة تفاصيل المشروع قبل القبول.'
            },
            {
                q: 'ماذا لو لم أكن راضيًا عن العمل؟',
                a: 'تواصل أولاً مع الموظف لطلب التعديلات. إذا لم تُحل المشكلة، يمكنك فتح نزاع وسيتدخل فريق الدعم للمساعدة.'
            }
        ]
    },
    {
        id: 'payment',
        icon: CreditCard,
        title: 'الدفع والأرباح',
        questions: [
            {
                q: 'ما هي طرق الدفع المتاحة؟',
                a: 'نوفر D17، Flouci، والتحويل البنكي. جميع المعاملات آمنة ومشفرة.'
            },
            {
                q: 'ما هي رسوم المنصة؟',
                a: 'نأخذ 10% من قيمة كل عقد. لا توجد رسوم خفية أو اشتراكات شهرية.'
            },
            {
                q: 'كيف أسحب أرباحي؟',
                a: 'اذهب إلى صفحة الأرباح، اختر المبلغ وطريقة السحب، ثم أكد العملية. السحب عبر D17 فوري، والتحويل البنكي يستغرق 2-3 أيام.'
            }
        ]
    },
    {
        id: 'security',
        icon: Shield,
        title: 'الأمان والخصوصية',
        questions: [
            {
                q: 'هل بياناتي آمنة؟',
                a: 'نستخدم تشفير SSL وأفضل ممارسات الأمان لحماية بياناتك. لا نشارك معلوماتك مع أطراف ثالثة.'
            },
            {
                q: 'كيف أحمي حسابي؟',
                a: 'استخدم كلمة مرور قوية، فعّل المصادقة الثنائية، ولا تشارك بيانات تسجيل الدخول مع أحد.'
            }
        ]
    }
];

export default function FAQ() {
    const [searchQuery, setSearchQuery] = useState('');
    const [openItems, setOpenItems] = useState<string[]>([]);

    const toggleItem = (id: string) => {
        setOpenItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredCategories = FAQ_CATEGORIES.map(cat => ({
        ...cat,
        questions: cat.questions.filter(q =>
            q.q.includes(searchQuery) || q.a.includes(searchQuery)
        )
    })).filter(cat => cat.questions.length > 0);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container-custom py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-foreground mb-4">الأسئلة الشائعة</h1>
                    <p className="text-muted max-w-2xl mx-auto">
                        إجابات على أكثر الأسئلة شيوعًا حول استخدام خدمة.تن
                    </p>
                </div>

                {/* Search */}
                <div className="max-w-xl mx-auto mb-12">
                    <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث في الأسئلة..."
                            className="w-full pr-12 pl-4 py-4 border border-gray-200 rounded-2xl text-lg"
                        />
                    </div>
                </div>

                {/* FAQ Categories */}
                <div className="max-w-3xl mx-auto space-y-8">
                    {filteredCategories.map(category => (
                        <div key={category.id} className="card">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                                    <category.icon className="w-5 h-5 text-primary-600" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground">{category.title}</h2>
                            </div>

                            <div className="space-y-4">
                                {category.questions.map((item, idx) => {
                                    const itemId = `${category.id}-${idx}`;
                                    const isOpen = openItems.includes(itemId);

                                    return (
                                        <div key={idx} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                                            <button
                                                onClick={() => toggleItem(itemId)}
                                                className="w-full flex items-center justify-between text-right py-2"
                                            >
                                                <span className="font-medium text-foreground">{item.q}</span>
                                                {isOpen ? (
                                                    <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                                                )}
                                            </button>
                                            {isOpen && (
                                                <p className="text-muted mt-2 pr-0 animate-slide-down">
                                                    {item.a}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact CTA */}
                <div className="max-w-3xl mx-auto mt-12">
                    <div className="card bg-gradient-to-br from-primary-600 to-secondary-600 text-white text-center">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-80" />
                        <h3 className="text-xl font-bold mb-2">لم تجد إجابتك؟</h3>
                        <p className="opacity-90 mb-4">فريق الدعم جاهز لمساعدتك على مدار الساعة</p>
                        <a
                            href="mailto:support@khedma.tn"
                            className="inline-block px-6 py-3 bg-white text-primary-600 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                        >
                            تواصل معنا
                        </a>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
