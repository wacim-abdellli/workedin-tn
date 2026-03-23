import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone, Heart } from 'lucide-react';

import { useTranslation } from '../../i18n';
import { useTheme } from '../../contexts/ThemeContext';

function Footer() {
    const { t } = useTranslation();
    const { theme } = useTheme();

    const footerLinks = [
        { href: '/about', label: t.footer.about },
        { href: '/faq', label: t.footer.faq },
        { href: '/terms', label: t.footer.terms },
        { href: '/privacy', label: t.footer.privacy },
        { href: '/contact', label: t.footer.contact },
    ];

    const socialLinks = [
        { icon: Facebook, href: '#', label: 'Facebook', color: 'hover:bg-blue-600' },
        { icon: Twitter, href: '#', label: 'Twitter', color: 'hover:bg-sky-500' },
        { icon: Instagram, href: '#', label: 'Instagram', color: 'hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500' },
        { icon: Linkedin, href: '#', label: 'LinkedIn', color: 'hover:bg-blue-700' },
    ];

    return (
        <footer className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-dark-900 to-dark-950" />
            <div className="absolute start-1/4 top-0 h-96 w-96 rounded-full bg-primary-600/10 blur-[120px]" />
            <div className="absolute bottom-0 end-1/4 h-96 w-96 rounded-full bg-accent-500/10 blur-[120px]" />

            <div className="container-custom relative py-16 md:py-20">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
                    <div className="lg:col-span-2">
                        <Link to="/" className="group mb-10 inline-flex items-center">
                            <img
                                src={theme === 'dark' ? '/logos/logo-stacked-dark.svg' : '/logos/logo-stacked.svg'}
                                alt="Khedma TN"
                                width="100"
                                height="90"
                                style={{ height: '72px', width: 'auto' }}
                                className="object-contain"
                            />
                        </Link>

                        <p className="mb-8 max-w-md leading-relaxed text-dark-400">
                            {t.footer.description}
                        </p>

                        <div className="mb-8 space-y-3">
                            <div className="flex items-center gap-3 text-dark-400">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-800">
                                    <MapPin className="h-5 w-5 text-primary-400" />
                                </div>
                                <span>{t.footer.city}</span>
                            </div>
                            <div className="flex items-center gap-3 text-dark-400">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-800">
                                    <Mail className="h-5 w-5 text-primary-400" />
                                </div>
                                <span>contact@khedma.tn</span>
                            </div>
                            <div className="flex items-center gap-3 text-dark-400">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dark-800">
                                    <Phone className="h-5 w-5 text-primary-400" />
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
                                    className={`flex h-11 w-11 items-center justify-center rounded-xl bg-dark-800 text-dark-400 transition-all duration-300 hover:scale-110 hover:text-white hover:shadow-lg ${social.color}`}
                                >
                                    <social.icon className="h-5 w-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-6 text-lg font-bold text-white">{t.footer.quickLinks}</h3>
                        <ul className="space-y-4">
                            {footerLinks.slice(0, 3).map((link) => (
                                <li key={link.href}>
                                    <Link
                                        to={link.href}
                                        className="group flex items-center gap-2 text-dark-400 transition-colors hover:text-white"
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary-500 opacity-0 transition-opacity group-hover:opacity-100" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link
                                    to="/how-it-works"
                                    className="group flex items-center gap-2 text-dark-400 transition-colors hover:text-white"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary-500 opacity-0 transition-opacity group-hover:opacity-100" />
                                    {t.nav.howItWorks}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/jobs"
                                    className="group flex items-center gap-2 text-dark-400 transition-colors hover:text-white"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary-500 opacity-0 transition-opacity group-hover:opacity-100" />
                                    {t.nav.jobs}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-6 text-lg font-bold text-white">{t.footer.legal}</h3>
                        <ul className="space-y-4">
                            {footerLinks.slice(3).map((link) => (
                                <li key={link.href}>
                                    <Link
                                        to={link.href}
                                        className="group flex items-center gap-2 text-dark-400 transition-colors hover:text-white"
                                    >
                                        <span className="h-1.5 w-1.5 rounded-full bg-accent-500 opacity-0 transition-opacity group-hover:opacity-100" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-8">
                            <h4 className="mb-3 font-semibold text-white">{t.footer.newsletterTitle}</h4>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder={t.footer.newsletterPlaceholder}
                                    className="flex-1 rounded-xl border border-dark-700 bg-dark-800 px-4 py-2.5 text-white placeholder-dark-500 transition-colors focus:border-primary-500 focus:outline-none"
                                />
                                <button className="rounded-xl px-4 py-2.5 font-medium text-white transition-shadow hover:shadow-lg hover:shadow-primary-600/30 gradient-primary">
                                    {t.footer.newsletterAction}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-16 border-t border-dark-800 pt-8">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <div className="flex items-center gap-1 text-sm text-dark-400">
                            {t.footer.madeInTunisia}
                            <Heart className="h-4 w-4 fill-current text-accent-500" />
                        </div>
                        <div className="text-sm text-dark-400">
                            {t.footer.copyright}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
