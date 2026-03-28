# Hardcoded Strings Audit - Khedma TN

## Summary
Found **50+ hardcoded Arabic strings** in production code that need to be migrated to i18n translation files.

## Critical Files with Hardcoded Strings

### 1. **src/components/auth/LoginForm.tsx**
- `'إخفاء كلمة المرور'` / `'إظهار كلمة المرور'` (aria-label)

### 2. **src/pages/ResetPassword.tsx**
- `'رابط إعادة التعيين منتهي الصلاحية'`
- `'تم تغيير كلمة المرور بنجاح'`

### 3. **src/pages/PortfolioDashboard.tsx**
- `'حدث خطأ أثناء تحميل المعرض'`
- `'تم تحديث العمل بنجاح'`
- `'تم إضافة العمل بنجاح'`
- `'حدث خطأ أثناء حفظ العمل'`
- `'تم حذف العمل بنجاح'`
- `'حدث خطأ أثناء الحذف'`

### 4. **src/pages/JobProposals.tsx**
- `'فشل تحميل بيانات المشروع'`
- `'فشل تحميل العروض'`
- `'يجب توظيف المستقل أولاً لبدء المحادثة'`
- `'تمت الإزالة من القائمة المختصرة'`
- `'تمت الإضافة إلى القائمة المختصرة'`
- `'حدث خطأ أثناء تحديث القائمة المختصرة'`
- `'تم توظيف المستقل بنجاح! 🎉'`
- `'فشل توظيف المستقل. حاول مرة أخرى'`
- `'تم أرشفة العرض'`
- `'فشل أرشفة العرض'`

### 5. **src/pages/JobMatches.tsx**
- `'حدث خطأ في البحث عن تطابقات'`
- `'تم بدء العقد بنجاح!'`
- `'حدث خطأ في إنشاء العقد'`

### 6. **src/pages/JobDetail.tsx**
- `'تم حفظ الوظيفة'`
- `'تم إزالة الوظيفة من المحفوظات'`
- `'حدث خطأ'`
- `'سجل الدخول لحفظ الوظيفة'`
- `'تم إرسال العرض بنجاح!'`
- `'تم سحب العرض واسترداد الكونيكتس'`
- `'حدث خطأ في سحب العرض'`
- `'تم نسخ الرابط'`

### 7. **src/pages/ContractWorkspace.tsx**
- `'تم تسليم العمل بنجاح!'`
- `'حدث خطأ في تسليم العمل'`
- `'تم قبول العمل وإتمام الدفع!'`
- `'حدث خطأ في قبول العمل'`
- `'طلب تعديلات'`
- `'تم إرسال طلب التعديلات'`
- `'تم فتح نزاع. سيتم المراجعة خلال 48 ساعة.'`
- `'حدث خطأ في فتح النزاع'`
- `'تم إرسال تقييمك بنجاح'`

### 8. **src/pages/ForgotPassword.tsx**
- `'تم تجاوز عدد المحاولات. حاول مرة أخرى لاحقاً.'`
- `'تم إرسال رابط إعادة التعيين'`

### 9. **src/pages/JobBoard.tsx**
- `'Error'` (generic error message)

## Action Plan

### Phase 1: Add Missing Translation Keys
Add all hardcoded strings to `src/i18n/ar.ts` and `src/i18n/fr.ts` under appropriate namespaces:

```typescript
// Suggested structure:
{
  auth: {
    password: {
      show: 'إظهار كلمة المرور',
      hide: 'إخفاء كلمة المرور'
    }
  },
  portfolio: {
    loadError: 'حدث خطأ أثناء تحميل المعرض',
    updateSuccess: 'تم تحديث العمل بنجاح',
    addSuccess: 'تم إضافة العمل بنجاح',
    saveError: 'حدث خطأ أثناء حفظ العمل',
    deleteSuccess: 'تم حذف العمل بنجاح',
    deleteError: 'حدث خطأ أثناء الحذف'
  },
  proposals: {
    loadJobError: 'فشل تحميل بيانات المشروع',
    loadError: 'فشل تحميل العروض',
    hireFirstMessage: 'يجب توظيف المستقل أولاً لبدء المحادثة',
    shortlistRemoved: 'تمت الإزالة من القائمة المختصرة',
    shortlistAdded: 'تمت الإضافة إلى القائمة المختصرة',
    shortlistError: 'حدث خطأ أثناء تحديث القائمة المختصرة',
    hireSuccess: 'تم توظيف المستقل بنجاح! 🎉',
    hireError: 'فشل توظيف المستقل. حاول مرة أخرى',
    archiveSuccess: 'تم أرشفة العرض',
    archiveError: 'فشل أرشفة العرض'
  },
  contract: {
    deliverSuccess: 'تم تسليم العمل بنجاح!',
    deliverError: 'حدث خطأ في تسليم العمل',
    acceptSuccess: 'تم قبول العمل وإتمام الدفع!',
    acceptError: 'حدث خطأ في قبول العمل',
    requestChanges: 'طلب تعديلات',
    requestChangesSuccess: 'تم إرسال طلب التعديلات',
    disputeSuccess: 'تم فتح نزاع. سيتم المراجعة خلال 48 ساعة.',
    disputeError: 'حدث خطأ في فتح النزاع',
    reviewSuccess: 'تم إرسال تقييمك بنجاح'
  },
  common: {
    error: 'حدث خطأ',
    success: 'تمت العملية بنجاح',
    loginRequired: 'سجل الدخول للمتابعة'
  }
}
```

### Phase 2: Replace Hardcoded Strings
Replace all hardcoded strings with `t('key.path')` or `tx('key.path', undefined, 'fallback')`

### Phase 3: Verify Consistency
- Ensure all keys follow the pattern: `feature.action.type`
- Check for missing translations in French
- Run build to catch any missing keys

## Estimated Impact
- **50+ strings** to migrate
- **9 files** to update
- **Improved**: Maintainability, consistency, and translation coverage
