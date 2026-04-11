import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "../../i18n";
import { Logo } from "../ui/Logo";
import { useAuth } from "@/contexts/AuthContext";

function Footer() {
  const { t, tx } = useTranslation();
  const { profile, activeMode } = useAuth();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const mode = activeMode === 'freelancer' || profile?.user_type === 'freelancer' ? 'freelancer' : 'client';

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) { setSubscribed(true); setEmail(''); }
  };

  return (
    <footer style={{ background: '#0a0a0a', borderTop: '1px solid #1a1a1a', color: '#fff' }}>
      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <Logo variant="full" size="md" titleStyle="default" mode={mode} />
            </Link>
            <p style={{ color: '#888', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              {t.footer.description}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {[
                { icon: MapPin, text: t.footer.city },
                { icon: Mail, text: tx('ui.contact_workedin_tn') },
                { icon: Phone, text: tx('ui.xx_xxx_xxx') },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: '#161616', border: '1px solid #2a2a2a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon style={{ width: 16, height: 16, color: '#E8820C' }} />
                  </div>
                  <span style={{ color: '#aaa', fontSize: 13 }}>{text}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { icon: Facebook, label: 'Facebook' },
                { icon: Twitter, label: 'Twitter' },
                { icon: Instagram, label: 'Instagram' },
                { icon: Linkedin, label: 'LinkedIn' },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: '#161616', border: '1px solid #2a2a2a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#666', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#E8820C';
                    (e.currentTarget as HTMLElement).style.color = '#E8820C';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a';
                    (e.currentTarget as HTMLElement).style.color = '#666';
                  }}
                >
                  <Icon style={{ width: 16, height: 16 }} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginBottom: 20 }}>
              {t.footer.quickLinks}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { to: '/about', label: t.footer.about },
                { to: '/faq', label: t.footer.faq },
                { to: '/how-it-works', label: t.nav.howItWorks },
                { to: '/jobs', label: t.nav.jobs },
                { to: '/find-freelancers', label: tx('nav.findFreelancers', undefined, 'Find Freelancers') },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    style={{ color: '#888', fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#888'}
                  >
                    <ArrowRight style={{ width: 12, height: 12, color: '#E8820C', flexShrink: 0 }} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginBottom: 20 }}>
              {t.footer.legal}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { to: '/terms', label: t.footer.terms },
                { to: '/privacy', label: t.footer.privacy },
                { to: '/contact', label: t.footer.contact },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    style={{ color: '#888', fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#888'}
                  >
                    <ArrowRight style={{ width: 12, height: 12, color: '#E8820C', flexShrink: 0 }} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginBottom: 20 }}>
              {t.footer.newsletterTitle}
            </h3>
            <p style={{ color: '#888', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
              {t.footer.newsletterDescription}
            </p>
            {subscribed ? (
              <div style={{
                background: 'rgba(232,130,12,0.1)', border: '1px solid rgba(232,130,12,0.3)',
                borderRadius: 12, padding: '14px 16px', color: '#E8820C', fontSize: 13, fontWeight: 600,
              }}>
                ✓ {tx('footer.subscribed', undefined, "You're subscribed!")}
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t.footer.newsletterPlaceholder}
                  required
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 12,
                    background: '#111', border: '1px solid #2a2a2a',
                    color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#E8820C'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#2a2a2a'}
                />
                <button
                  type="submit"
                  style={{
                    width: '100%', padding: '12px', borderRadius: 12,
                    background: '#E8820C', border: 'none', color: '#fff',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#d4750a'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#E8820C'}
                >
                  {t.footer.newsletterAction}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ color: '#555', fontSize: 13 }}>{t.footer.madeInTunisia} 🇹🇳</span>
          <span style={{ color: '#555', fontSize: 13 }}>{t.footer.copyright}</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
