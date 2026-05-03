# I18n Quick Reference Guide

## Current Status: ✅ 100% Coverage

All 45 pages in the application now support internationalization in Arabic, English, and French.

## How to Use i18n in Pages

### 1. Import the hook
```typescript
import { useTranslation } from '@/i18n';
```

### 2. Use in component
```typescript
function MyPage() {
  const { t, tx, language, dir } = useTranslation();
  
  return (
    <div>
      {/* Using nested translation object */}
      <h1>{t.nav.home}</h1>
      
      {/* Using tx function with fallback */}
      <p>{tx('common.loading', {}, 'Loading...')}</p>
      
      {/* With parameters */}
      <p>{tx('jobs.postedAgo', { time: '2h' }, 'Posted 2h ago')}</p>
    </div>
  );
}
```

### 3. Available Properties

- **`t`** - Direct access to translation object (e.g., `t.nav.home`)
- **`tx(key, params?, fallback?)`** - Function to get translation with fallback
- **`language`** - Current language ('ar' | 'en' | 'fr')
- **`dir`** - Text direction ('rtl' | 'ltr')

## Common Translation Keys

### Navigation
```typescript
t.nav.home          // "Home" / "الرئيسية" / "Accueil"
t.nav.jobs          // "Available Jobs"
t.nav.messages      // "Messages"
t.nav.dashboard     // "Dashboard"
t.nav.settings      // "Settings"
```

### Common Actions
```typescript
tx('common.back')       // "Back"
tx('common.goBack')     // "Go back"
tx('common.retry')      // "Retry"
tx('common.loading')    // "Loading..."
tx('common.error')      // "Error"
tx('common.success')    // "Success"
```

### Contract Workspace
```typescript
tx('contractWorkspace.clientView')      // "Client view"
tx('contractWorkspace.freelancerView')  // "Freelancer view"
tx('contractWorkspace.notFound')        // "Contract not found..."
tx('contractWorkspace.loadError')       // "Failed to load..."
```

## Adding New Translation Keys

### 1. Add to ar.ts (Arabic)
```typescript
export const ar = {
  // ... existing keys
  "myNewSection": {
    "title": "عنوان جديد",
    "description": "وصف جديد"
  }
};
```

### 2. Add to en.ts (English)
```typescript
export const en: Translations = {
  // ... existing keys
  "myNewSection": {
    "title": "New Title",
    "description": "New Description"
  }
};
```

### 3. Add to fr.ts (French)
```typescript
export const fr: Translations = {
  // ... existing keys
  "myNewSection": {
    "title": "Nouveau Titre",
    "description": "Nouvelle Description"
  }
};
```

## RTL Support

The app automatically handles RTL for Arabic:

```typescript
const { dir } = useTranslation();

// dir will be 'rtl' for Arabic, 'ltr' for English/French
<div dir={dir}>
  {/* Content automatically flows right-to-left in Arabic */}
</div>
```

## Language Switching

Users can switch languages from the UI. The selection is:
1. Stored in localStorage
2. Applied to document.documentElement
3. Synced across tabs

## Testing i18n

### Manual Testing
1. Switch to Arabic - verify RTL layout
2. Switch to English - verify LTR layout
3. Switch to French - verify LTR layout
4. Check all pages render correctly
5. Verify no text overflow

### Automated Testing
Run the audit script:
```bash
node scripts/audit-pages-i18n.mjs
```

## Translation File Structure

```
src/i18n/
├── index.tsx    # Provider and hook
├── ar.ts        # Arabic translations (primary)
├── en.ts        # English translations
└── fr.ts        # French translations
```

## Best Practices

1. **Always provide fallbacks** in `tx()` calls
2. **Use semantic keys** (e.g., `auth.login` not `button1`)
3. **Keep translations consistent** across all three files
4. **Test in all languages** before deploying
5. **Use parameters** for dynamic content: `tx('key', { name: 'John' })`

## Common Patterns

### Conditional Text
```typescript
const statusText = status === 'active' 
  ? tx('status.active', {}, 'Active')
  : tx('status.inactive', {}, 'Inactive');
```

### Lists
```typescript
const items = [
  tx('item.one', {}, 'Item One'),
  tx('item.two', {}, 'Item Two'),
  tx('item.three', {}, 'Item Three'),
];
```

### Forms
```typescript
<input 
  placeholder={tx('form.email.placeholder', {}, 'Enter your email')}
  aria-label={tx('form.email.label', {}, 'Email address')}
/>
```

## Need Help?

- Check existing pages for examples
- Review `src/i18n/index.tsx` for hook implementation
- Run audit script to find missing translations
- Refer to `I18N_PAGES_FIX_SUMMARY.md` for complete status

---

**Last Updated:** May 2, 2026  
**Coverage:** 45/45 pages (100%)
