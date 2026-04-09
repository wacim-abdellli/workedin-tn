import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle, MessageCircle, FileText, CreditCard, Shield, User } from 'lucide-react';
import { Header, Footer } from '../components/layout';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { useTranslation } from '@/i18n';

export default function FAQ() {
    const { tx, t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [openItems, setOpenItems] = useState<string[]>([]);

    const FAQ_CATEGORIES = [
        {
            id: 'general',
            icon: HelpCircle,
            title: tx('faqPage.categories.general.title'),
            questions: (t.faqPage.categories.general.items as Array<{ q: string; a: string }>)
        },
        {
            id: 'freelancer',
            icon: User,
            title: tx('faqPage.categories.freelancer.title'),
            questions: (t.faqPage.categories.freelancer.items as Array<{ q: string; a: string }>)
        },
        {
            id: 'client',
            icon: FileText,
            title: tx('faqPage.categories.client.title'),
            questions: (t.faqPage.categories.client.items as Array<{ q: string; a: string }>)
        },
        {
            id: 'payment',
            icon: CreditCard,
            title: tx('faqPage.categories.payment.title'),
            questions: (t.faqPage.categories.payment.items as Array<{ q: string; a: string }>)
        },
        {
            id: 'security',
            icon: Shield,
            title: tx('faqPage.categories.security.title'),
            questions: (t.faqPage.categories.security.items as Array<{ q: string; a: string }>)
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
        <div className="min-h-screen" style={{ background: 'var(--color-bg-subtle)' }}>
            <SEO {...SEO_CONFIG.faq} url="/faq" />
            <Header />

            <div className="container-custom py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>{tx('faqPage.page.title')}</h1>
                    <p className="max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                        {tx('faqPage.page.subtitle')}
                    </p>
                </div>

                {/* Search */}
                <div className="max-w-xl mx-auto mb-12">
                    <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={tx('faqPage.page.searchPlaceholder')}
                            className="w-full pe-12 ps-4 py-4 rounded-2xl text-lg"
                            style={{
                                border: '1px solid var(--color-border-default)',
                                background: 'var(--color-bg-elevated)',
                                color: 'var(--color-text-primary)'
                            }}
                        />
                    </div>
                </div>

                {/* FAQ Categories */}
                <div className="max-w-3xl mx-auto space-y-8">
                    {filteredCategories.map(category => (
                        <div 
                            key={category.id} 
                            className="rounded-2xl p-6 shadow-sm"
                            style={{
                                background: 'var(--color-bg-elevated)',
                                border: '1px solid var(--color-border-subtle)'
                            }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div 
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: 'var(--color-brand-primary-light)' }}
                                >
                                    <category.icon className="w-5 h-5" style={{ color: 'var(--color-brand-primary)' }} />
                                </div>
                                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{category.title}</h2>
                            </div>

                            <div className="space-y-4">
                                {category.questions.map((item, idx) => {
                                    const itemId = `${category.id}-${idx}`;
                                    const isOpen = openItems.includes(itemId);

                                    return (
                                        <div 
                                            key={idx} 
                                            className="pb-4 last:pb-0"
                                            style={{ borderBottom: idx !== category.questions.length - 1 ? '1px solid var(--color-border-subtle)' : 'none' }}
                                        >
                                            <button
                                                onClick={() => toggleItem(itemId)}
                                                className="w-full flex items-center justify-between text-right py-2"
                                            >
                                                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.q}</span>
                                                {isOpen ? (
                                                    <ChevronUp className="w-5 h-5 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                                                )}
                                            </button>
                                            {isOpen && (
                                                <p className="mt-2 pe-0 animate-slide-down" style={{ color: 'var(--color-text-secondary)' }}>
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
                    <div 
                        className="rounded-2xl p-8 text-white text-center shadow-lg"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-brand-secondary) 100%)'
                        }}
                    >
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-80" />
                        <h3 className="text-xl font-bold mb-2">{tx('faqPage.page.noAnswer')}</h3>
                        <p className="opacity-90 mb-4">{tx('faqPage.page.supportReady')}</p>
                        <a
                            href="mailto:support@Khedmetna.tn"
                            className="inline-block px-6 py-3 rounded-xl font-medium transition-colors"
                            style={{
                                background: 'var(--color-bg-elevated)',
                                color: 'var(--color-brand-primary)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-muted)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-bg-elevated)'}
                        >
                            {tx('faqPage.page.contactButton')}
                        </a>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

