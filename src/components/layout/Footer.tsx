import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone, Heart } from 'lucide-react';

import { useTranslation } from '../../i18n';
import { Logo } from '../ui/Logo';

function Footer() {
    const { t } = useTranslation();

    const footerLinks = [
        { href: '/about', label: t.footer.about },
        { href: '/faq', label: t.footer.faq },
        { href: '/terms', label: t.footer.terms },
        { href: '/privacy', label: t.footer.privacy },
        { href: '/contact', label: t.footer.contact },
    ];

    const socialLinks = [
        { icon: Facebook, href: '#', label: t.footer.socialFacebook },
        { icon: Twitter, href: '#', label: t.footer.socialTwitter },
        { icon: Instagram, href: '#', label: t.footer.socialInstagram },
        { icon: Linkedin, href: '#', label: t.footer.socialLinkedin },
    ];

    return (
        <footer className="relative overflow-hidden border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#0f0d16] text-gray-900 dark:text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.08),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.06),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(249,250,251,0)_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.10),transparent_24%),linear-gradient(180deg,#120f1c_0%,#0d0b14_100%)]" />
            <div className="absolute start-1/4 top-0 h-96 w-96 rounded-full bg-primary-600/10 dark:bg-primary-600/10 blur-[120px]" />
            <div className="absolute bottom-0 end-1/4 h-96 w-96 rounded-full bg-accent-500/10 dark:bg-accent-500/10 blur-[120px]" />

            <div className="container-custom relative py-16 md:py-20">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.2fr)_220px_220px_minmax(0,1fr)]">
                    <div className="max-w-xl">
                        <Link to="/" className="group mb-8 inline-flex items-center hover:opacity-80 transition-opacity">
                            <Logo variant="full" size="lg" />
                        </Link>

                        <p className="mb-8 max-w-lg text-lg leading-relaxed text-gray-600 dark:text-[#a8a2bb]">
                            {t.footer.description}
                        </p>

                        <div className="mb-8 space-y-3.5">
                            <div className="flex items-center gap-3 text-gray-700 dark:text-[#b8b3ca]">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-white/8 dark:bg-gray-900/[0.04]">
                                    <MapPin className="h-5 w-5 text-[color:var(--workspace-primary)]" />
                                </div>
                                <span>{t.footer.city}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700 dark:text-[#b8b3ca]">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-white/8 dark:bg-gray-900/[0.04]">
                                    <Mail className="h-5 w-5 text-[color:var(--workspace-primary)]" />
                                </div>
                                <span>contact@khedma.tn</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700 dark:text-[#b8b3ca]">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-white/8 dark:bg-gray-900/[0.04]">
                                    <Phone className="h-5 w-5 text-[color:var(--workspace-primary)]" />
                                </div>
                                <span dir="ltr">+216 XX XXX XXX</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-[color:var(--workspace-primary)]/20 hover:bg-[color:var(--workspace-primary)]/10 hover:text-[color:var(--workspace-primary)] dark:border-white/8 dark:bg-gray-900/[0.04] dark:text-[#a8a2bb] dark:hover:bg-[color:var(--workspace-primary)]/12 dark:hover:text-white transition-all duration-300 hover:-translate-y-0.5"
                                >
                                    <social.icon className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">{t.footer.quickLinks}</h3>
                        <ul className="space-y-4">
                            {footerLinks.slice(0, 3).map((link) => (
                                <li key={link.href}>
                                    <Link
                                        to={link.href}
                                        className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-[#a8a2bb] dark:hover:text-white transition-colors"
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--workspace-primary)] opacity-0 transition-opacity group-hover:opacity-100" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link
                                    to="/how-it-works"
                                    className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-[#a8a2bb] dark:hover:text-white transition-colors"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--workspace-primary)] opacity-0 transition-opacity group-hover:opacity-100" />
                                    {t.nav.howItWorks}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/jobs"
                                    className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-[#a8a2bb] dark:hover:text-white transition-colors"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--workspace-primary)] opacity-0 transition-opacity group-hover:opacity-100" />
                                    {t.nav.jobs}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">{t.footer.legal}</h3>
                        <ul className="space-y-4">
                            {footerLinks.slice(3).map((link) => (
                                <li key={link.href}>
                                    <Link
                                        to={link.href}
                                        className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-[#a8a2bb] dark:hover:text-white transition-colors"
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-accent-500 opacity-0 transition-opacity group-hover:opacity-100" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">{t.footer.contact}</h3>
                        <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-gray-900/[0.04] dark:shadow-none backdrop-blur-sm">
                            <h4 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{t.footer.newsletterTitle}</h4>
                            <p className="mb-4 text-sm leading-6 text-gray-600 dark:text-[#a8a2bb]">
                                {t.footer.newsletterDescription}
                            </p>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <input
                                    type="email"
                                    placeholder={t.footer.newsletterPlaceholder}
                                    className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[color:var(--workspace-primary)] focus:outline-none dark:border-white/10 dark:bg-[#171422] dark:text-white dark:placeholder:text-[#7f7894] transition-colors"
                                />
                                <button className="rounded-xl bg-[linear-gradient(135deg,var(--workspace-primary),var(--workspace-primary-hover))] px-5 py-3 font-semibold text-[color:var(--workspace-primary-text)] transition-transform hover:-translate-y-0.5">
                                    {t.footer.newsletterAction}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-16 border-t border-gray-200 dark:border-white/6 pt-8">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-[#a8a2bb]">
                            {t.footer.madeInTunisia}
                            <Heart className="h-4 w-4 fill-current text-accent-500" />
                        </div>
                        <div className="text-sm text-gray-500 dark:text-[#a8a2bb]">
                            {t.footer.copyright}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
