import { Check, Clock, Info } from 'lucide-react';
import type { PaymentMethodConfig } from '@/config/paymentMethods';
import { PAYMENT_METHODS } from '@/config/paymentMethods';
import { useTranslation } from '@/i18n';

// --- Inline SVG logos (no external files needed) -------------------------

function DhmadLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#6C3CE1" />
      <rect width="40" height="40" rx="10" fill="url(#dhmad_grad)" />
      {/* Shield shape */}
      <path d="M20 8L10 12v9c0 5.5 4.3 10.6 10 12 5.7-1.4 10-6.5 10-12V12L20 8z" fill="white" fillOpacity="0.15" />
      <path d="M20 9.5L11 13v8c0 4.8 3.8 9.3 9 10.6 5.2-1.3 9-5.8 9-10.6V13L20 9.5z" fill="none" stroke="white" strokeWidth="1.2" strokeOpacity="0.6" />
      {/* D letter */}
      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="15" fontWeight="800" fontFamily="system-ui,sans-serif" letterSpacing="-0.5">D</text>
      <defs>
        <linearGradient id="dhmad_grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#5B21B6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function FlouciLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="url(#flouci_grad)" />
      {/* Stylised F + wave */}
      <rect x="12" y="11" width="3" height="18" rx="1.5" fill="white" />
      <rect x="12" y="11" width="12" height="3" rx="1.5" fill="white" />
      <rect x="12" y="18.5" width="9" height="3" rx="1.5" fill="white" />
      {/* Accent dot */}
      <circle cx="28" cy="28" r="3.5" fill="white" fillOpacity="0.9" />
      <defs>
        <linearGradient id="flouci_grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38BDF8" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function LaPosteLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="url(#laposte_grad)" />
      {/* Envelope shape */}
      <rect x="8" y="14" width="24" height="16" rx="2" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" />
      <path d="M8 16l12 9 12-9" stroke="white" strokeWidth="1.5" strokeOpacity="0.9" strokeLinecap="round" />
      {/* D17 text */}
      <text x="20" y="23" textAnchor="middle" fill="white" fontSize="8" fontWeight="800" fontFamily="system-ui,sans-serif" letterSpacing="0.5">D17</text>
      <defs>
        <linearGradient id="laposte_grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F97316" />
          <stop offset="1" stopColor="#C2410C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MethodLogo({ id, className }: { id: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-xl overflow-hidden ${className}`}>
      {id === 'dhmad' && <DhmadLogo size={40} />}
      {id === 'flouci' && <FlouciLogo size={40} />}
      {id === 'd17' && <LaPosteLogo size={40} />}
      {id !== 'dhmad' && id !== 'flouci' && id !== 'd17' && (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-500 text-white text-xs font-bold">
          {id.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

// --- Helpers -------------------------------------------------------------

function localise(
  map: { en: string; ar: string; fr: string },
  lang: string,
): string {
  if (lang === 'ar') return map.ar;
  if (lang === 'fr') return map.fr;
  return map.en;
}

function localiseList(
  map: { en: string[]; ar: string[]; fr: string[] },
  lang: string,
): string[] {
  if (lang === 'ar') return map.ar;
  if (lang === 'fr') return map.fr;
  return map.en;
}

// --- Sub-components ------------------------------------------------------

interface AvailableCardProps {
  method: PaymentMethodConfig;
  selected: boolean;
  onSelect: (id: string) => void;
  lang: string;
}

function AvailableCard({ method, selected, onSelect, lang }: AvailableCardProps) {
    const { tx } = useTranslation();
  const name = localise(method.name, lang);
  const description = localise(method.description, lang);
  const features = localiseList(method.features, lang);

  return (
    <button
      type="button"
      onClick={() => onSelect(method.id)}
      aria-pressed={selected}
      className={[
        'w-full text-start rounded-2xl border-2 p-4 transition-all duration-200',
        'bg-card hover:shadow-md',
        selected
          ? 'border-[color:var(--workspace-primary)] shadow-sm ring-1 ring-[color:var(--workspace-primary)]/20'
          : 'border-border hover:border-[color:var(--workspace-primary)]/50',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        {/* Icon circle */}
        <div
          className={[
            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden',
            selected ? '' : 'opacity-90',
          ].join(' ')}
        >
          <MethodLogo id={method.id} className="w-10 h-10" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{name}</span>
            {method.recommended && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {tx('ui.recommended')}</span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {description}
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {features.map((feat) => (
              <span
                key={feat}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full bg-surface text-muted-foreground/80"
              >
                <Check className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />
                {feat}
              </span>
            ))}
          </div>
        </div>

        {/* Selection indicator */}
        <div
          className={[
            'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
            selected
              ? 'border-[color:var(--workspace-primary)] bg-[color:var(--workspace-primary)]'
              : 'border-border',
          ].join(' ')}
        >
          {selected && <Check className="w-3 h-3 text-white" />}
        </div>
      </div>
    </button>
  );
}

interface ComingSoonCardProps {
  method: PaymentMethodConfig;
  lang: string;
}

function ComingSoonCard({ method, lang }: ComingSoonCardProps) {
    const { tx } = useTranslation();
  const name = localise(method.name, lang);
  const description = localise(method.description, lang);
  const features = localiseList(method.features, lang);

  return (
    <div
      aria-disabled="true"
      className="w-full text-start rounded-2xl border-2 border-dashed border-border p-4 bg-muted/30 opacity-60 cursor-not-allowed"
    >
      <div className="flex items-start gap-3">
        {/* Icon circle — muted */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden opacity-50">
          <MethodLogo id={method.id} className="w-10 h-10" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-muted-foreground">{name}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-amber-500/10 text-amber-600">
              <Clock className="w-2.5 h-2.5" />
              {tx('ui.coming_soon')}</span>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground/70 mt-1 leading-relaxed">
            {description}
          </p>

          {/* Feature pills — greyed */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {features.map((feat) => (
              <span
                key={feat}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full bg-surface text-muted-foreground/60"
              >
                <Check className="w-2.5 h-2.5 text-muted-foreground/40 flex-shrink-0" />
                {feat}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main component ------------------------------------------------------

export interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onSelect: (id: string) => void;
  showComingSoon?: boolean;
}

export default function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  showComingSoon = true,
}: PaymentMethodSelectorProps) {
  const { language } = useTranslation() as { t: unknown; tx: unknown; language: string };

  const available = PAYMENT_METHODS.filter((m) => m.available);
  const comingSoon = PAYMENT_METHODS.filter((m) => m.comingSoon);

  const isRtl = language === 'ar';

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-3">
      {/* Available methods */}
      <div className="space-y-2">
        {available.map((method) => (
          <AvailableCard
            key={method.id}
            method={method}
            selected={selectedMethod === method.id}
            onSelect={onSelect}
            lang={language}
          />
        ))}
      </div>

      {/* Coming Soon separator + cards */}
      {showComingSoon && comingSoon.length > 0 && (
        <>
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
              {language === 'ar' ? 'قريباً' : language === 'fr' ? 'Bientôt disponible' : 'Coming soon'}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-2">
            {comingSoon.map((method) => (
              <ComingSoonCard key={method.id} method={method} lang={language} />
            ))}
          </div>
        </>
      )}

      {/* Info note */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
        <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          {language === 'ar'
            ? 'المزيد من طرق الدفع ستكون متاحة قريباً.'
            : language === 'fr'
            ? "D'autres moyens de paiement seront bientôt disponibles."
            : 'More payment methods coming soon.'}
        </p>
      </div>
    </div>
  );
}
