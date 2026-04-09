// src/config/paymentMethods.ts

export interface PaymentMethodConfig {
  id: 'dhmad' | 'flouci' | 'd17';
  available: boolean;
  comingSoon: boolean;
  recommended?: boolean;
  icon: 'Shield' | 'Wallet' | 'Building2';
  name: { en: string; ar: string; fr: string };
  description: { en: string; ar: string; fr: string };
  features: { en: string[]; ar: string[]; fr: string[] };
}

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'dhmad',
    available: true,
    comingSoon: false,
    recommended: true,
    icon: 'Shield',
    name: {
      en: 'Dhmad Escrow',
      ar: 'ضمان دحماد',
      fr: 'Dépôt Dhmad',
    },
    description: {
      en: 'Secure escrow — funds held until work is approved',
      ar: 'ضمان آمن — تُحتجز الأموال حتى الموافقة على العمل',
      fr: "Dépôt sécurisé — fonds conservés jusqu'à approbation",
    },
    features: {
      en: ['Escrow protection', 'Dispute resolution', 'Used by Tunisie Freelance'],
      ar: ['حماية الضمان', 'حل النزاعات', 'مستخدم من قبل تونس فريلانس'],
      fr: ['Protection par dépôt', 'Résolution des litiges', 'Utilisé par Tunisie Freelance'],
    },
  },
  {
    id: 'flouci',
    available: false,
    comingSoon: true,
    icon: 'Wallet',
    name: {
      en: 'Flouci Wallet',
      ar: 'محفظة فلوسي',
      fr: 'Portefeuille Flouci',
    },
    description: {
      en: 'Pay with your Flouci mobile wallet',
      ar: 'ادفع بمحفظة فلوسي المحمولة',
      fr: 'Payez avec votre portefeuille Flouci',
    },
    features: {
      en: ['Mobile wallet', 'Instant transfers', '250K+ Tunisian users'],
      ar: ['محفظة موبايل', 'تحويلات فورية', '+250 ألف مستخدم تونسي'],
      fr: ['Portefeuille mobile', 'Virements instantanés', '250K+ utilisateurs'],
    },
  },
  {
    id: 'd17',
    available: false,
    comingSoon: true,
    icon: 'Building2',
    name: {
      en: 'D17 (La Poste)',
      ar: 'دي17 (البريد التونسي)',
      fr: 'D17 (La Poste)',
    },
    description: {
      en: 'Pay with D17 e-dinar from La Poste Tunisienne',
      ar: 'ادفع بالدينار الإلكتروني D17 من البريد التونسي',
      fr: 'Payez avec le e-dinar D17 de La Poste',
    },
    features: {
      en: ['E-dinar payments', 'La Poste network', 'Government-backed'],
      ar: ['مدفوعات الدينار الإلكتروني', 'شبكة البريد', 'مدعوم حكومياً'],
      fr: ['Paiements e-dinar', 'Réseau La Poste', "Soutenu par l'État"],
    },
  },
];
