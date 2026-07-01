import { describe, expect, it } from 'vitest';
import {
  JOB_CATEGORIES,
  getJobCategories,
  getLocalizedLabel,
  getCategoryName,
  getSubcategoryName,
} from '../jobCategories';

describe('jobCategories', () => {
  describe('JOB_CATEGORIES', () => {
    it('exports 9 categories', () => {
      expect(JOB_CATEGORIES).toHaveLength(9);
    });

    it('each category has an id and localized label', () => {
      for (const cat of JOB_CATEGORIES) {
        expect(cat.id).toBeTruthy();
        expect(cat.label.ar).toBeTruthy();
        expect(cat.label.fr).toBeTruthy();
        expect(cat.label.en).toBeTruthy();
        expect(Array.isArray(cat.subcategories)).toBe(true);
        expect(cat.subcategories.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getLocalizedLabel', () => {
    it('returns the label for the given language', () => {
      const label = { ar: 'عربي', fr: 'Francais', en: 'English' };
      expect(getLocalizedLabel(label, 'ar')).toBe('عربي');
      expect(getLocalizedLabel(label, 'fr')).toBe('Francais');
      expect(getLocalizedLabel(label, 'en')).toBe('English');
    });

    it('falls back to English for unsupported language', () => {
      const label = { ar: 'عربي', fr: 'Francais', en: 'English' };
      expect(getLocalizedLabel(label, 'de' as 'ar')).toBe('English');
    });
  });

  describe('getJobCategories', () => {
    it('returns categories with localized names for English', () => {
      const categories = getJobCategories('en');
      expect(categories).toHaveLength(9);
      expect(categories[0].name).toBe('Design and Creative');
      expect(categories[0].id).toBe('design');
      expect(categories[0].subcategories[0].name).toBe('Brand Identity');
    });

    it('returns categories with localized names for Arabic', () => {
      const categories = getJobCategories('ar');
      expect(categories[0].name).toBe('تصميم وإبداع');
      expect(categories[0].subcategories[0].name).toBe('هوية بصرية');
    });

    it('returns categories with localized names for French', () => {
      const categories = getJobCategories('fr');
      expect(categories[0].name).toBe('Design et creation');
    });
  });

  describe('getCategoryName', () => {
    it('returns the localized category name', () => {
      expect(getCategoryName('design', 'en')).toBe('Design and Creative');
      expect(getCategoryName('design', 'ar')).toBe('تصميم وإبداع');
    });

    it('returns empty string for undefined', () => {
      expect(getCategoryName(undefined, 'en')).toBe('');
    });

    it('returns the raw id for unknown category', () => {
      expect(getCategoryName('nonexistent', 'en')).toBe('nonexistent');
    });
  });

  describe('getSubcategoryName', () => {
    it('returns the localized subcategory name', () => {
      expect(getSubcategoryName('design', 'logo_design', 'en')).toBe('Logo Design');
      expect(getSubcategoryName('design', 'logo_design', 'ar')).toBe('تصميم شعارات');
    });

    it('returns empty string for missing categoryId', () => {
      expect(getSubcategoryName(undefined, 'logo_design', 'en')).toBe('');
    });

    it('returns empty string for missing subcategoryId', () => {
      expect(getSubcategoryName('design', undefined, 'en')).toBe('');
    });

    it('returns raw subcategoryId for unknown subcategory', () => {
      expect(getSubcategoryName('design', 'nonexistent', 'en')).toBe('nonexistent');
    });
  });
});
