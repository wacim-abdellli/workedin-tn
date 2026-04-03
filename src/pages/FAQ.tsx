import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle, MessageCircle, FileText, CreditCard, Shield, User } from 'lucide-react';
import { Header, Footer } from '../components/layout';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { useTranslation } from 'react-i18next';

export default function FAQ() {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [openItems, setOpenItems] = useState<string[]>([]);

    const FAQ_CATEGORIES = [
        {
            id: 'general',
            icon: HelpCircle,
            title: t('faqPage.categories.general.title'),
            questions: t('faqPage.categories.general.items', { returnObjects: true }) as Array<{ q: string; a: string }>
        },
        {
            id: 'freelancer',
            icon: User,
            title: t('faqPage.categories.freelancer.title'),
            questions: t('faqPage.categories.freelancer.items', { returnObjects: true }) as Array<{ q: string; a: string }>
        },
        {
            id: 'client',
            icon: FileText,
            title: t('faqPage.categories.client.title'),
            questions: t('faqPage.categories.client.items', { returnObjects: true }) as Array<{ q: string; a: string }>
        },
        {
            id: 'payment',
            icon: CreditCard,
            title: t('faqPage.categories.payment.title'),
            questions: t('faqPage.categories.payment.items', { returnObjects: true }) as Array<{ q: string; a: string }>
        },
        {
            id: 'security',
            icon: Shield,
            title: t('faqPage.categories.security.title'),
            questions: t('faqPage.categories.security.items', { returnObjects: true }) as Array<{ q: string; a: string }>
        }
    ];

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
            <SEO {...SEO_CONFIG.faq} url="/faq" />
            <Header />

            <div className="container-custom py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-foreground mb-4">{t('faqPage.page.title')}</h1>
                    <p className="text-muted max-w-2xl mx-auto">
                        {t('faqPage.page.subtitle')}
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
                            placeholder={t('faqPage.page.searchPlaceholder')}
                            className="w-full pe-12 ps-4 py-4 border border-gray-200 rounded-2xl text-lg"
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
                                                <p className="text-muted mt-2 pe-0 animate-slide-down">
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
                        <h3 className="text-xl font-bold mb-2">{t('faqPage.page.noAnswer')}</h3>
                        <p className="opacity-90 mb-4">{t('faqPage.page.supportReady')}</p>
                        <a
                            href="mailto:support@khedma.tn"
                            className="inline-block px-6 py-3 bg-white text-primary-600 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                        >
                            {t('faqPage.page.contactButton')}
                        </a>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
