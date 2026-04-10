 import { Link } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Heart,
} from "lucide-react";

import { useTranslation } from "../../i18n";
import { Logo } from "../ui/Logo";
import { useAuth } from "@/contexts/AuthContext";

function Footer() {
  const { t, tx } = useTranslation();
  const { profile, activeMode } = useAuth();

  const footerLinks = [
    { href: "/about", label: t.footer.about },
    { href: "/faq", label: t.footer.faq },
    { href: "/terms", label: t.footer.terms },
    { href: "/privacy", label: t.footer.privacy },
    { href: "/contact", label: t.footer.contact },
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: t.footer.socialFacebook },
    { icon: Twitter, href: "#", label: t.footer.socialTwitter },
    { icon: Instagram, href: "#", label: t.footer.socialInstagram },
    { icon: Linkedin, href: "#", label: t.footer.socialLinkedin },
  ];

  return (
    <footer
      className="relative overflow-hidden border-t"
      style={{
        borderColor: "var(--color-border-subtle)",
        background: "var(--color-background-subtle)",
        color: "var(--color-text-primary)",
      }}
    >
      {/* Ambient backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at top left, color-mix(in srgb, var(--workspace-primary) 10%, transparent), transparent 34%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--workspace-accent) 10%, transparent), transparent 28%), linear-gradient(180deg, transparent 0%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute start-1/4 top-0 h-96 w-96 rounded-full blur-[120px]"
        style={{
          background:
            "color-mix(in srgb, var(--workspace-primary) 10%, transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 end-1/4 h-96 w-96 rounded-full blur-[120px]"
        style={{
          background:
            "color-mix(in srgb, var(--workspace-accent) 10%, transparent)",
        }}
      />

      <div className="container-custom relative py-16 md:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.2fr)_220px_220px_minmax(0,1fr)]">
          {/* Brand / Intro */}
          <div className="max-w-xl">
            <Link
              to="/"
              className="group mb-8 inline-flex items-center transition-opacity hover:opacity-80"
            >
              <Logo 
                variant="full" 
                size="lg" 
                titleStyle="default" 
                mode={activeMode === 'freelancer' || profile?.user_type === 'freelancer' ? 'freelancer' : 'client'}
              />
            </Link>

            <p
              className="mb-8 max-w-lg text-lg leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {t.footer.description}
            </p>

            <div className="mb-8 space-y-3.5">
              <div
                className="flex items-center gap-3"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: "var(--color-border-subtle)",
                    background: "var(--color-background-elevated)",
                  }}
                >
                  <MapPin
                    className="h-5 w-5"
                    style={{ color: "var(--workspace-primary)" }}
                  />
                </div>
                <span>{t.footer.city}</span>
              </div>

              <div
                className="flex items-center gap-3"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: "var(--color-border-subtle)",
                    background: "var(--color-background-elevated)",
                  }}
                >
                  <Mail
                    className="h-5 w-5"
                    style={{ color: "var(--workspace-primary)" }}
                  />
                </div>
                <span>{tx('ui.contact_workedin_tn')}</span>
              </div>

              <div
                className="flex items-center gap-3"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: "var(--color-border-subtle)",
                    background: "var(--color-background-elevated)",
                  }}
                >
                  <Phone
                    className="h-5 w-5"
                    style={{ color: "var(--workspace-primary)" }}
                  />
                </div>
                <span dir="ltr">{tx('ui.xx_xxx_xxx')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    borderColor: "var(--color-border-subtle)",
                    background: "var(--color-background-elevated)",
                    color: "var(--color-text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--workspace-primary)";
                    e.currentTarget.style.background =
                      "var(--workspace-primary-light)";
                    e.currentTarget.style.color = "var(--workspace-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--color-border-subtle)";
                    e.currentTarget.style.background =
                      "var(--color-background-elevated)";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                  }}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3
              className="mb-6 text-lg font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {t.footer.quickLinks}
            </h3>
            <ul className="space-y-4">
              {footerLinks.slice(0, 3).map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="group flex items-center gap-2 transition-colors"
                    style={{ color: "var(--color-text-secondary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--color-text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color =
                        "var(--color-text-secondary)";
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ background: "var(--workspace-primary)" }}
                    />
                    {link.label}
                  </Link>
                </li>
              ))}

              <li>
                <Link
                  to="/how-it-works"
                  className="group flex items-center gap-2 transition-colors"
                  style={{ color: "var(--color-text-secondary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--color-text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ background: "var(--workspace-primary)" }}
                  />
                  {t.nav.howItWorks}
                </Link>
              </li>

              <li>
                <Link
                  to="/jobs"
                  className="group flex items-center gap-2 transition-colors"
                  style={{ color: "var(--color-text-secondary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--color-text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ background: "var(--workspace-primary)" }}
                  />
                  {t.nav.jobs}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3
              className="mb-6 text-lg font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {t.footer.legal}
            </h3>
            <ul className="space-y-4">
              {footerLinks.slice(3).map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="group flex items-center gap-2 transition-colors"
                    style={{ color: "var(--color-text-secondary)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--color-text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color =
                        "var(--color-text-secondary)";
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ background: "var(--workspace-accent)" }}
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3
              className="mb-6 text-lg font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {t.footer.contact}
            </h3>

            <div
              className="rounded-2xl border p-5 shadow-sm backdrop-blur-sm"
              style={{
                borderColor: "var(--color-border-subtle)",
                background: "var(--color-background-elevated)",
              }}
            >
              <h4
                className="mb-2 text-xl font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {t.footer.newsletterTitle}
              </h4>
              <p
                className="mb-4 text-sm leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {t.footer.newsletterDescription}
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  placeholder={t.footer.newsletterPlaceholder}
                  className="min-w-0 flex-1 rounded-xl border px-4 py-3 transition-colors focus:outline-none"
                  style={{
                    borderColor: "var(--color-border-subtle)",
                    background: "var(--color-background-subtle)",
                    color: "var(--color-text-primary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--workspace-primary)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px color-mix(in srgb, var(--workspace-primary) 15%, transparent)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--color-border-subtle)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  className="rounded-xl px-5 py-3 font-semibold transition-transform hover:-translate-y-0.5"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--workspace-primary), var(--workspace-primary-hover))",
                    color: "var(--workspace-primary-text, #fff)",
                  }}
                >
                  {t.footer.newsletterAction}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-16 border-t pt-8"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div
              className="flex items-center gap-1 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {t.footer.madeInTunisia}
              <Heart
                className="h-4 w-4 fill-current"
                style={{ color: "var(--workspace-accent)" }}
              />
            </div>

            <div
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {t.footer.copyright}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

