import { Shield, Wallet, Building2, Check, Clock, Info } from 'lucide-react';
import type { PaymentMethodConfig } from '@/config/paymentMethods';
import { PAYMENT_METHODS } from '@/config/paymentMethods';
import { useTranslation } from '@/i18n';

// --- Icon resolver -------------------------------------------------------

const ICON_MAP = {
  Shield,
  Wallet,
  Building2,
} as const;

type IconName = keyof typeof ICON_MAP;

function MethodIcon({ name, className }: { name: IconName; className?: string }) {
    const { tx } = useTranslation();
  const Icon = ICON_MAP[name];
  return <Icon className={className} />;
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
            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
            selected
              ? 'bg-[color-mix(in_srgb,var(--workspace-primary)_10%,transparent)] text-[var(--workspace-primary)]'
              : 'bg-surface text-muted-foreground',
          ].join(' ')}
        >
          <MethodIcon name={method.icon} className="w-5 h-5" />
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
        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-surface text-muted-foreground">
          <MethodIcon name={method.icon} className="w-5 h-5" />
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
