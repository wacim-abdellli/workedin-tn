import { Info } from 'lucide-react';
import type { PaymentMethodConfig } from '@/config/paymentMethods';
import { PAYMENT_METHODS } from '@/config/paymentMethods';
import { useTranslation } from '@/i18n';
import { PaymentMethodCard } from './PaymentMethodCard';

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
  const { language, tx } = useTranslation() as { t: unknown; tx: (key: string, vars?: Record<string, string>, fallback?: string) => string; language: string };

  const available = PAYMENT_METHODS.filter((m) => m.available);
  const comingSoon = PAYMENT_METHODS.filter((m) => m.comingSoon);

  const isRtl = language === 'ar';

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-3">
      {/* Available methods */}
      <div className="space-y-2">
        {available.map((method) => (
          <PaymentMethodCard
            key={method.id}
            id={method.id}
            name={localise(method.name, language)}
            description={localise(method.description, language)}
            features={localiseList(method.features, language)}
            recommended={method.recommended}
            selected={selectedMethod === method.id}
            showRadio
            onSelect={() => onSelect(method.id)}
          />
        ))}
      </div>

      {/* Coming Soon separator + cards */}
      {showComingSoon && comingSoon.length > 0 && (
        <>
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
              {tx('wallet.comingSoonLabel', undefined, 'Coming soon')}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-2">
            {comingSoon.map((method) => (
              <PaymentMethodCard
                key={method.id}
                id={method.id}
                name={localise(method.name, language)}
                description={localise(method.description, language)}
                features={localiseList(method.features, language)}
                status="soon"
                disabled
              />
            ))}
          </div>
        </>
      )}

      {/* Info note */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
        <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          {tx('wallet.moreMethodsSoon', undefined, 'More payment methods will be available soon.')}
        </p>
      </div>
    </div>
  );
}
