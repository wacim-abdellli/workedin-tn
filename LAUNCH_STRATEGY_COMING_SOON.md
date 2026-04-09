# Launch Strategy: Dhmad Now, Flouci/D17 Coming Soon
**Date**: 2026-04-09  
**Strategy**: Launch with Dhmad.tn, show Flouci/D17 as "Coming Soon"

---

## 🎯 STRATEGY OVERVIEW

### Phase 1: Launch (Week 1)
- ✅ **Dhmad.tn**: Primary payment method (escrow)
- 🔜 **Flouci**: Show as "Coming Soon"
- 🔜 **D17**: Show as "Coming Soon"

### Phase 2: Add Payment Options (Week 2-4)
- Get patente (business registration)
- Activate Flouci business account
- Add D17 integration
- Enable all payment methods

---

## 💡 WHY THIS WORKS

1. **Launch immediately** with working escrow (Dhmad)
2. **Build trust** by showing future payment options
3. **Set expectations** - users know more options coming
4. **Buy time** to get patente and government approvals
5. **Professional appearance** - looks like a complete platform

---

## 🎨 UI IMPLEMENTATION

### Payment Method Selection Screen

```
┌─────────────────────────────────────────┐
│  Select Payment Method                   │
├─────────────────────────────────────────┤
│                                          │
│  ✅ Dhmad Escrow (Recommended)          │
│  └─ Secure escrow protection            │
│     Funds held until work complete      │
│     [Select] ←─────────────────────     │
│                                          │
│  🔜 Flouci Wallet                        │
│  └─ Coming Soon                          │
│     Pay with Flouci mobile wallet       │
│     [Coming Soon]                        │
│                                          │
│  🔜 D17 (La Poste)                       │
│  └─ Coming Soon                          │
│     Pay with D17 e-dinar                │
│     [Coming Soon]                        │
│                                          │
└─────────────────────────────────────────┘
```

### Wallet Deposit Screen

```
┌─────────────────────────────────────────┐
│  Deposit Funds                           │
├─────────────────────────────────────────┤
│                                          │
│  Amount: [____] TND                      │
│                                          │
│  Payment Method:                         │
│                                          │
│  ○ Dhmad Escrow ✅ Available            │
│  ○ Flouci 🔜 Coming Soon                │
│  ○ D17 🔜 Coming Soon                    │
│                                          │
│  [Continue with Dhmad]                   │
│                                          │
│  💡 More payment methods coming soon!    │
│                                          │
└─────────────────────────────────────────┘
```

---

## 📝 CODE IMPLEMENTATION

### 1. Payment Methods Configuration

**File**: `src/config/paymentMethods.ts`

```typescript
export interface PaymentMethod {
  id: string;
  name: string;
  nameAr: string;
  nameFr: string;
  description: string;
  descriptionAr: string;
  descriptionFr: string;
  icon: string;
  available: boolean;
  comingSoon: boolean;
  recommended?: boolean;
  features: string[];
  featuresAr: string[];
  featuresFr: string[];
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'dhmad',
    name: 'Dhmad Escrow',
    nameAr: 'ضمان دحماد',
    nameFr: 'Dépôt Dhmad',
    description: 'Secure escrow protection - Funds held until work complete',
    descriptionAr: 'حماية الضمان الآمنة - يتم الاحتفاظ بالأموال حتى اكتمال العمل',
    descriptionFr: 'Protection par dépôt sécurisé - Fonds conservés jusqu\'à la fin du travail',
    icon: 'Shield',
    available: true,
    comingSoon: false,
    recommended: true,
    features: [
      'Escrow protection',
      'Dispute resolution',
      'Secure transactions',
      'Trusted by Tunisian marketplaces'
    ],
    featuresAr: [
      'حماية الضمان',
      'حل النزاعات',
      'معاملات آمنة',
      'موثوق به من قبل الأسواق التونسية'
    ],
    featuresFr: [
      'Protection par dépôt',
      'Résolution des litiges',
      'Transactions sécurisées',
      'Approuvé par les marchés tunisiens'
    ]
  },
  {
    id: 'flouci',
    name: 'Flouci Wallet',
    nameAr: 'محفظة فلوسي',
    nameFr: 'Portefeuille Flouci',
    description: 'Pay with your Flouci mobile wallet',
    descriptionAr: 'ادفع باستخدام محفظة فلوسي المحمولة',
    descriptionFr: 'Payez avec votre portefeuille mobile Flouci',
    icon: 'Wallet',
    available: false,
    comingSoon: true,
    features: [
      'Mobile wallet payments',
      'Instant transfers',
      '250,000+ users in Tunisia',
      'Bank card support'
    ],
    featuresAr: [
      'مدفوعات المحفظة المحمولة',
      'تحويلات فورية',
      '250,000+ مستخدم في تونس',
      'دعم البطاقات المصرفية'
    ],
    featuresFr: [
      'Paiements par portefeuille mobile',
      'Virements instantanés',
      '250 000+ utilisateurs en Tunisie',
      'Support carte bancaire'
    ]
  },
  {
    id: 'd17',
    name: 'D17 (La Poste)',
    nameAr: 'دي17 (البريد التونسي)',
    nameFr: 'D17 (La Poste)',
    description: 'Pay with D17 e-dinar from La Poste Tunisienne',
    descriptionAr: 'ادفع باستخدام الدينار الإلكتروني D17 من البريد التونسي',
    descriptionFr: 'Payez avec le e-dinar D17 de La Poste Tunisienne',
    icon: 'Building',
    available: false,
    comingSoon: true,
    features: [
      'E-dinar payments',
      'La Poste Tunisienne network',
      'Widely accepted',
      'Government-backed'
    ],
    featuresAr: [
      'مدفوعات الدينار الإلكتروني',
      'شبكة البريد التونسي',
      'مقبول على نطاق واسع',
      'مدعوم من الحكومة'
    ],
    featuresFr: [
      'Paiements e-dinar',
      'Réseau La Poste Tunisienne',
      'Largement accepté',
      'Soutenu par le gouvernement'
    ]
  }
];

export function getAvailablePaymentMethods(): PaymentMethod[] {
  return PAYMENT_METHODS.filter(method => method.available);
}

export function getComingSoonPaymentMethods(): PaymentMethod[] {
  return PAYMENT_METHODS.filter(method => method.comingSoon);
}

export function getPaymentMethodById(id: string): PaymentMethod | undefined {
  return PAYMENT_METHODS.find(method => method.id === id);
}
```

### 2. Payment Method Selector Component

**File**: `src/components/payment/PaymentMethodSelector.tsx`

```typescript
import { useState } from 'react';
import { Shield, Wallet, Building, Check, Clock } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { PAYMENT_METHODS, type PaymentMethod } from '@/config/paymentMethods';

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onSelect: (methodId: string) => void;
  showComingSoon?: boolean;
}

const ICONS = {
  Shield,
  Wallet,
  Building,
};

export function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  showComingSoon = true,
}: PaymentMethodSelectorProps) {
  const { language } = useTranslation();

  const getName = (method: PaymentMethod) => {
    if (language === 'ar') return method.nameAr;
    if (language === 'fr') return method.nameFr;
    return method.name;
  };

  const getDescription = (method: PaymentMethod) => {
    if (language === 'ar') return method.descriptionAr;
    if (language === 'fr') return method.descriptionFr;
    return method.description;
  };

  const getFeatures = (method: PaymentMethod) => {
    if (language === 'ar') return method.featuresAr;
    if (language === 'fr') return method.featuresFr;
    return method.features;
  };

  const availableMethods = PAYMENT_METHODS.filter(m => m.available);
  const comingSoonMethods = showComingSoon ? PAYMENT_METHODS.filter(m => m.comingSoon) : [];

  return (
    <div className="space-y-4">
      {/* Available Methods */}
      {availableMethods.map((method) => {
        const Icon = ICONS[method.icon as keyof typeof ICONS];
        const isSelected = selectedMethod === method.id;

        return (
          <button
            key={method.id}
            onClick={() => onSelect(method.id)}
            className={`w-full text-start p-4 rounded-xl border-2 transition-all ${
              isSelected
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border hover:border-primary/50 hover:bg-primary/5'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
              }`}>
                <Icon className="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{getName(method)}</h3>
                  {method.recommended && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded">
                      {language === 'ar' ? 'موصى به' : language === 'fr' ? 'Recommandé' : 'Recommended'}
                    </span>
                  )}
                  {isSelected && (
                    <Check className="w-5 h-5 text-primary ml-auto" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {getDescription(method)}
                </p>
                <ul className="space-y-1">
                  {getFeatures(method).slice(0, 2).map((feature, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </button>
        );
      })}

      {/* Coming Soon Methods */}
      {comingSoonMethods.length > 0 && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {language === 'ar' ? 'قريباً' : language === 'fr' ? 'Bientôt disponible' : 'Coming Soon'}
              </span>
            </div>
          </div>

          {comingSoonMethods.map((method) => {
            const Icon = ICONS[method.icon as keyof typeof ICONS];

            return (
              <div
                key={method.id}
                className="w-full p-4 rounded-xl border-2 border-dashed border-border bg-muted/30 opacity-60 cursor-not-allowed"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-muted-foreground">{getName(method)}</h3>
                      <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {language === 'ar' ? 'قريباً' : language === 'fr' ? 'Bientôt' : 'Coming Soon'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {getDescription(method)}
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      {language === 'ar' 
                        ? 'سيتم إضافة هذه الطريقة قريباً' 
                        : language === 'fr' 
                        ? 'Cette méthode sera ajoutée prochainement'
                        : 'This payment method will be added soon'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Info Banner */}
      {comingSoonMethods.length > 0 && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            💡 {language === 'ar' 
              ? 'نعمل على إضافة المزيد من طرق الدفع لتوفير المزيد من الخيارات لك'
              : language === 'fr'
              ? 'Nous travaillons à ajouter plus de méthodes de paiement pour vous offrir plus d\'options'
              : 'We\'re working on adding more payment methods to give you more options'}
          </p>
        </div>
      )}
    </div>
  );
}
```

### 3. Update Wallet Page

**File**: `src/pages/Wallet.tsx` (Update deposit section)

```typescript
import { PaymentMethodSelector } from '@/components/payment/PaymentMethodSelector';

// Inside Wallet component:
const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('dhmad');

// In deposit modal:
<div className="mb-5">
  <label className="block text-sm font-medium text-foreground mb-3">
    {tx('wallet.paymentMethod', undefined, 'Payment Method')}
  </label>
  <PaymentMethodSelector
    selectedMethod={selectedPaymentMethod}
    onSelect={setSelectedPaymentMethod}
    showComingSoon={true}
  />
</div>
```

---

## 📱 USER MESSAGING

### Homepage Banner

```typescript
<div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 text-center">
  <p className="text-sm font-medium">
    🎉 {language === 'ar' 
      ? 'قريباً: فلوسي و D17 - المزيد من طرق الدفع قادمة!'
      : language === 'fr'
      ? 'Bientôt : Flouci et D17 - Plus de méthodes de paiement à venir !'
      : 'Coming Soon: Flouci & D17 - More payment options on the way!'}
  </p>
</div>
```

### FAQ Section

**Q: What payment methods do you support?**
A: Currently, we support Dhmad escrow for secure transactions. We're actively working on adding Flouci wallet and D17 (La Poste) payments. These will be available soon!

**Q: When will Flouci be available?**
A: We're in the process of completing our business registration. Flouci integration will be live within 2-4 weeks.

**Q: Is Dhmad safe?**
A: Yes! Dhmad is a trusted escrow platform used by major Tunisian marketplaces like Tunisie Freelance. Your funds are held securely until work is completed.

---

## 🚀 LAUNCH TIMELINE

### Week 1: Launch with Dhmad
- Day 1-2: Apply for Dhmad account
- Day 3-5: Integrate Dhmad
- Day 6: Add "Coming Soon" UI
- Day 7: 🚀 LAUNCH

### Week 2-4: Get Patente
- Start business registration process
- Gather required documents
- Submit application
- Wait for approval (1-2 weeks)

### Week 4-6: Add Flouci & D17
- Activate Flouci business account
- Integrate Flouci API
- Research D17 integration
- Add D17 if feasible
- Remove "Coming Soon" badges
- Announce new payment methods

---

## ✅ BENEFITS OF THIS APPROACH

1. **Launch immediately** - Don't wait for patente
2. **Professional appearance** - Shows you're planning ahead
3. **User trust** - Transparency about future features
4. **Competitive advantage** - Dhmad escrow is actually better for marketplace
5. **Flexibility** - Can add methods as they become available
6. **No broken promises** - "Coming Soon" sets expectations

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Coming Soon UI (This Week)
- [ ] Create `paymentMethods.ts` config
- [ ] Create `PaymentMethodSelector` component
- [ ] Update Wallet page with selector
- [ ] Add "Coming Soon" badges
- [ ] Add info banner about future methods
- [ ] Update FAQ with payment method info
- [ ] Add homepage banner (optional)

### Phase 2: Dhmad Integration (This Week)
- [ ] Apply for Dhmad account
- [ ] Get sandbox API key
- [ ] Create Dhmad service
- [ ] Create Edge Functions
- [ ] Test in sandbox
- [ ] Deploy to production

### Phase 3: Get Patente (Week 2-4)
- [ ] Research registration requirements
- [ ] Gather documents
- [ ] Submit application
- [ ] Follow up with authorities
- [ ] Get approval

### Phase 4: Add Flouci (Week 4-6)
- [ ] Activate Flouci business account
- [ ] Get production API keys
- [ ] Update payment config (set available: true)
- [ ] Test Flouci integration
- [ ] Remove "Coming Soon" badge
- [ ] Announce to users

### Phase 5: Add D17 (Optional, Week 6-8)
- [ ] Research D17 API
- [ ] Apply for D17 merchant account
- [ ] Integrate D17 API
- [ ] Test D17 payments
- [ ] Remove "Coming Soon" badge
- [ ] Announce to users

---

**Last Updated**: 2026-04-09  
**Status**: READY TO IMPLEMENT  
**Timeline**: Launch in 7 days with Dhmad + Coming Soon UI
