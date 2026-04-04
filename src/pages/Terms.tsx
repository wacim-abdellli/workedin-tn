import { Header, Footer } from '../components/layout';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { useTranslation } from '../i18n';

export default function Terms() {
    const { tx } = useTranslation();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
            <SEO {...SEO_CONFIG.terms} url="/terms" />
            <Header />

            <div className="container-custom py-12">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold text-foreground mb-8">{tx('legalPages.terms.title')}</h1>

                    <div className="card prose prose-lg max-w-none">
                        <p className="text-muted mb-6">{tx('legalPages.terms.lastUpdated')}</p>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">{tx('legalPages.terms.sections.intro.title')}</h2>
                            <p className="text-gray-700 dark:text-gray-200 mb-4">{tx('legalPages.terms.sections.intro.text')}</p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">{tx('legalPages.terms.sections.registration.title')}</h2>
                            <ul className="list-disc list-inside text-gray-700 dark:text-gray-200 space-y-2">
                                <li>{tx('legalPages.terms.sections.registration.items.age')}</li>
                                <li>{tx('legalPages.terms.sections.registration.items.accuracy')}</li>
                                <li>{tx('legalPages.terms.sections.registration.items.security')}</li>
                                <li>{tx('legalPages.terms.sections.registration.items.report')}</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">{tx('legalPages.terms.sections.platformUse.title')}</h2>
                            <p className="text-gray-700 dark:text-gray-200 mb-4">{tx('legalPages.terms.sections.platformUse.intro')}</p>
                            <ul className="list-disc list-inside text-gray-700 dark:text-gray-200 space-y-2">
                                <li>{tx('legalPages.terms.sections.platformUse.items.illegal')}</li>
                                <li>{tx('legalPages.terms.sections.platformUse.items.impersonation')}</li>
                                <li>{tx('legalPages.terms.sections.platformUse.items.abusive')}</li>
                                <li>{tx('legalPages.terms.sections.platformUse.items.paymentBypass')}</li>
                                <li>{tx('legalPages.terms.sections.platformUse.items.dataHarvesting')}</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">{tx('legalPages.terms.sections.contractsPayments.title')}</h2>
                            <p className="text-gray-700 dark:text-gray-200 mb-4">{tx('legalPages.terms.sections.contractsPayments.intro')}</p>
                            <ul className="list-disc list-inside text-gray-700 dark:text-gray-200 space-y-2">
                                <li>{tx('legalPages.terms.sections.contractsPayments.items.fee')}</li>
                                <li>{tx('legalPages.terms.sections.contractsPayments.items.secureMethods')}</li>
                                <li>{tx('legalPages.terms.sections.contractsPayments.items.holdPeriod')}</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">{tx('legalPages.terms.sections.disputes.title')}</h2>
                            <p className="text-gray-700 dark:text-gray-200 mb-4">{tx('legalPages.terms.sections.disputes.text')}</p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold mb-4">{tx('legalPages.terms.sections.contact.title')}</h2>
                            <p className="text-gray-700 dark:text-gray-200">
                                {tx('legalPages.terms.sections.contact.intro')}
                                <br />
                                {tx('legalPages.terms.sections.contact.emailLabel')} legal@khedma.tn
                            </p>
                        </section>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
