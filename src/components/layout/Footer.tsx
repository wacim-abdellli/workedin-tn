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

  // icon box style
  const iconBox = {
    width: 36, height: 36, borderRadius: 10,
    background: '#1e1e1e', border: '1px solid #2e2e2e',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  } as const;

  // social button style
  const socialBtn = {
    width: 38, height: 38, borderRadius: 10,
    background: '#1e1e1e', border: '1px solid #2e2e2e',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#777', transition: 'all 0.2s', textDecoration: 'none',
  } as const;

  return (
    <footer style={{ background: '#141414', borderTop: '1px solid #252525', color: '#fff' }}>
      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand */}
          <div>
            <Link to="/" className="inline-block mb-6">
              <Logo variant="full" size="md" titleStyle="default" mode={mode} />
            </Link>
            <p style={{ color: '#999', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              {t.footer.description}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {[
                { icon: MapPin, text: t.footer.city },
                { icon: Mail, text: tx('ui.contact_workedin_tn') },
                { icon: Phone, text: tx('ui.xx_xxx_xxx') },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={iconBox}>
                    <Icon style={{ width: 15, height: 15, color: '#E8820C' }} />
                  </div>
                  <span style={{ color: '#bbb', fontSize: 13 }}>{text}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  style={socialBtn}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#E8820C';
                    (e.currentTarget as HTMLElement).style.color = '#E8820C';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(232,130,12,0.08)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#2e2e2e';
                    (e.currentTarget as HTMLElement).style.color = '#777';
                    (e.currentTarget as HTMLElement).style.background = '#1e1e1e';
                  }}
                >
                  <Icon style={{ width: 15, height: 15 }} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', marginBottom: 20 }}>
              {t.footer.quickLinks}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
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
                    style={{ color: '#999', fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 7, transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#999'}
                  >
                    <ArrowRight style={{ width: 11, height: 11, color: '#E8820C', flexShrink: 0 }} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', marginBottom: 20 }}>
              {t.footer.legal}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[
                { to: '/terms', label: t.footer.terms },
                { to: '/privacy', label: t.footer.privacy },
                { to: '/contact', label: t.footer.contact },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    style={{ color: '#999', fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 7, transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#999'}
                  >
                    <ArrowRight style={{ width: 11, height: 11, color: '#E8820C', flexShrink: 0 }} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#666', marginBottom: 20 }}>
              {t.footer.newsletterTitle}
            </h3>
            <p style={{ color: '#999', fontSize: 13, lineHeight: 1.65, marginBottom: 16 }}>
              {t.footer.newsletterDescription}
            </p>
            {subscribed ? (
              <div style={{
                background: 'rgba(232,130,12,0.1)', border: '1px solid rgba(232,130,12,0.25)',
                borderRadius: 12, padding: '13px 16px', color: '#E8820C', fontSize: 13, fontWeight: 600,
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
                    width: '100%', padding: '11px 14px', borderRadius: 12,
                    background: '#1a1a1a', border: '1px solid #2e2e2e',
                    color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#E8820C'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#2e2e2e'}
                />
                <button
                  type="submit"
                  style={{
                    width: '100%', padding: '11px', borderRadius: 12,
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
        <div style={{ borderTop: '1px solid #252525', paddingTop: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ color: '#666', fontSize: 13 }}>{t.footer.madeInTunisia} 🇹🇳</span>
          <span style={{ color: '#666', fontSize: 13 }}>{t.footer.copyright}</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
