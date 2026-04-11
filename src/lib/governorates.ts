import type { Language } from '@/types';
import { GOVERNORATES } from '@/types';

type GovernorateLabels = {
  ar: string;
  en: string;
  fr: string;
};

const GOVERNORATE_LABELS: Record<string, GovernorateLabels> = {
  'تونس': { ar: 'تونس', en: 'Tunis', fr: 'Tunis' },
  'أريانة': { ar: 'أريانة', en: 'Ariana', fr: 'Ariana' },
  'بن عروس': { ar: 'بن عروس', en: 'Ben Arous', fr: 'Ben Arous' },
  'منوبة': { ar: 'منوبة', en: 'Manouba', fr: 'Manouba' },
  'نابل': { ar: 'نابل', en: 'Nabeul', fr: 'Nabeul' },
  'زغوان': { ar: 'زغوان', en: 'Zaghouan', fr: 'Zaghouan' },
  'بنزرت': { ar: 'بنزرت', en: 'Bizerte', fr: 'Bizerte' },
  'باجة': { ar: 'باجة', en: 'Beja', fr: 'Beja' },
  'جندوبة': { ar: 'جندوبة', en: 'Jendouba', fr: 'Jendouba' },
  'الكاف': { ar: 'الكاف', en: 'Le Kef', fr: 'Le Kef' },
  'سليانة': { ar: 'سليانة', en: 'Siliana', fr: 'Siliana' },
  'سوسة': { ar: 'سوسة', en: 'Sousse', fr: 'Sousse' },
  'المنستير': { ar: 'المنستير', en: 'Monastir', fr: 'Monastir' },
  'المهدية': { ar: 'المهدية', en: 'Mahdia', fr: 'Mahdia' },
  'صفاقس': { ar: 'صفاقس', en: 'Sfax', fr: 'Sfax' },
  'القيروان': { ar: 'القيروان', en: 'Kairouan', fr: 'Kairouan' },
  'القصرين': { ar: 'القصرين', en: 'Kasserine', fr: 'Kasserine' },
  'سيدي بوزيد': { ar: 'سيدي بوزيد', en: 'Sidi Bouzid', fr: 'Sidi Bouzid' },
  'قابس': { ar: 'قابس', en: 'Gabes', fr: 'Gabes' },
  'مدنين': { ar: 'مدنين', en: 'Medenine', fr: 'Medenine' },
  'تطاوين': { ar: 'تطاوين', en: 'Tataouine', fr: 'Tataouine' },
  'قفصة': { ar: 'قفصة', en: 'Gafsa', fr: 'Gafsa' },
  'توزر': { ar: 'توزر', en: 'Tozeur', fr: 'Tozeur' },
  'قبلي': { ar: 'قبلي', en: 'Kebili', fr: 'Kebili' },
};

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');

export function localizeGovernorate(value: string, language: Language): string {
  const key = normalize(value);
  const labels = GOVERNORATE_LABELS[key];
  if (labels) return labels[language];

  const lower = key.toLowerCase();
  const matched = Object.values(GOVERNORATE_LABELS).find(
    (item) => item.en.toLowerCase() === lower || item.fr.toLowerCase() === lower,
  );

  return matched ? matched[language] : value;
}

export function getLocalizedGovernorateOptions(language: Language): Array<{ value: string; label: string }> {
  return GOVERNORATES.map((gov) => ({
    value: gov,
    label: localizeGovernorate(gov, language),
  }));
}
