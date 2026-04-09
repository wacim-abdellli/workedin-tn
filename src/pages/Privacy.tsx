import { Header, Footer } from '../components/layout';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { useTranslation } from '../i18n';

export default function Privacy() {
    const { tx } = useTranslation();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:bg-gray-800">
            <SEO {...SEO_CONFIG.privacy} url="/privacy" />
            <Header />

            <div className="container-custom py-12">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold text-foreground mb-8">{tx('legalPages.privacy.title')}</h1>

                    <div className="card prose prose-lg max-w-none">
                        <p className="text-muted mb-6">{tx('legalPages.privacy.lastUpdated')}</p>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">{tx('legalPages.privacy.sections.dataCollection.title')}</h2>
                            <p className="text-gray-700 dark:text-gray-300 dark:text-gray-200 mb-4">{tx('legalPages.privacy.sections.dataCollection.intro')}</p>
                            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 dark:text-gray-200 space-y-2">
                                <li>{tx('legalPages.privacy.sections.dataCollection.items.account')}</li>
                                <li>{tx('legalPages.privacy.sections.dataCollection.items.profile')}</li>
                                <li>{tx('legalPages.privacy.sections.dataCollection.items.usage')}</li>
                                <li>{tx('legalPages.privacy.sections.dataCollection.items.payment')}</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">{tx('legalPages.privacy.sections.usage.title')}</h2>
                            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 dark:text-gray-200 space-y-2">
                                <li>{tx('legalPages.privacy.sections.usage.items.improve')}</li>
                                <li>{tx('legalPages.privacy.sections.usage.items.transactions')}</li>
                                <li>{tx('legalPages.privacy.sections.usage.items.notifications')}</li>
                                <li>{tx('legalPages.privacy.sections.usage.items.security')}</li>
                                <li>{tx('legalPages.privacy.sections.usage.items.experience')}</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">{tx('legalPages.privacy.sections.sharing.title')}</h2>
                            <p className="text-gray-700 dark:text-gray-300 dark:text-gray-200 mb-4">{tx('legalPages.privacy.sections.sharing.intro')}</p>
                            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 dark:text-gray-200 space-y-2">
                                <li>{tx('legalPages.privacy.sections.sharing.items.paymentProviders')}</li>
                                <li>{tx('legalPages.privacy.sections.sharing.items.legalAuthorities')}</li>
                                <li>{tx('legalPages.privacy.sections.sharing.items.publicProfile')}</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">{tx('legalPages.privacy.sections.protection.title')}</h2>
                            <p className="text-gray-700 dark:text-gray-300 dark:text-gray-200 mb-4">{tx('legalPages.privacy.sections.protection.intro')}</p>
                            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 dark:text-gray-200 space-y-2">
                                <li>{tx('legalPages.privacy.sections.protection.items.ssl')}</li>
                                <li>{tx('legalPages.privacy.sections.protection.items.database')}</li>
                                <li>{tx('legalPages.privacy.sections.protection.items.audits')}</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">{tx('legalPages.privacy.sections.rights.title')}</h2>
                            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 dark:text-gray-200 space-y-2">
                                <li>{tx('legalPages.privacy.sections.rights.items.access')}</li>
                                <li>{tx('legalPages.privacy.sections.rights.items.correction')}</li>
                                <li>{tx('legalPages.privacy.sections.rights.items.deletion')}</li>
                                <li>{tx('legalPages.privacy.sections.rights.items.export')}</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">{tx('legalPages.privacy.sections.cookies.title')}</h2>
                            <p className="text-gray-700 dark:text-gray-300 dark:text-gray-200 mb-4">{tx('legalPages.privacy.sections.cookies.text')}</p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">{tx('legalPages.privacy.sections.contact.title')}</h2>
                            <p className="text-gray-700 dark:text-gray-300 dark:text-gray-200">
                                {tx('legalPages.privacy.sections.contact.intro')}
                                <br />
                                {tx('legalPages.privacy.sections.contact.emailLabel')} privacy@Khedmetna.tn
                            </p>
                        </section>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

