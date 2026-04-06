> Legacy note: generated migration report. Not canonical.
> Use `audit/DESIGN_TOKEN_COMPLIANCE_POLICY.md` and current source files instead.

# Color Migration Report

Generated: 2026-04-05T20:56:31.917Z

## Summary

- **Total Files Scanned**: 12
- **Files with Issues**: 10
- **Total Issues Found**: 254
- **Auto-fixable**: 178
- **Manual Review Required**: 76

## Issues by File

### src\pages\admin\DisputesTab.tsx

Found 7 issue(s):

1. **Line 61:59** - ✅ Auto-fixable
   - Current: `text-red-500`
   - Suggested: `text-[var(--color-status-error)]`
   - Context: `<AlertTriangle className="w-5 h-5 text-red-500" />`

2. **Line 70:97** - ✅ Auto-fixable
   - Current: `text-primary-600`
   - Suggested: `text-[var(--color-brand-primary)]`
   - Context: `<div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" /><p className="text-muted">{tr('جاري التحميل...', 'Loading...', 'Chargement...')}</p></div>`

3. **Line 73:53** - ✅ Auto-fixable
   - Current: `text-green-500`
   - Suggested: `text-[var(--color-status-success)]`
   - Context: `<Check className="w-12 h-12 text-green-500 mx-auto mb-2" />`

4. **Line 80:103** - ✅ Auto-fixable
   - Current: `border-red-200`
   - Suggested: `border-[var(--color-status-error-subtle)]`
   - Context: `<div key={d.id} className={`overflow-hidden rounded-xl ${adminInsetClass} border-red-200/70 dark:border-red-500/18`}>`

5. **Line 80:126** - ✅ Auto-fixable
   - Current: `border-red-500`
   - Suggested: `border-[var(--color-status-error)]`
   - Context: `<div key={d.id} className={`overflow-hidden rounded-xl ${adminInsetClass} border-red-200/70 dark:border-red-500/18`}>`

6. **Line 100:90** - ✅ Auto-fixable
   - Current: `text-blue-600`
   - Suggested: `text-[var(--color-status-info)]`
   - Context: `<Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50" disabled={resolvingId === d.id} onClick={() => handleResolve(d.id, 'resolved_client', tr('نزاع لصالح العميل', 'Dispute resolved for client', 'Litige resolu en faveur du client'))}>`

7. **Line 100:110** - ✅ Auto-fixable
   - Current: `bg-blue-50`
   - Suggested: `bg-[var(--color-status-info-subtle)]`
   - Context: `<Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50" disabled={resolvingId === d.id} onClick={() => handleResolve(d.id, 'resolved_client', tr('نزاع لصالح العميل', 'Dispute resolved for client', 'Litige resolu en faveur du client'))}>`

### src\pages\admin\JobsTab.tsx

Found 10 issue(s):

1. **Line 206:67** - ✅ Auto-fixable
   - Current: `text-primary-600`
   - Suggested: `text-[var(--color-brand-primary)]`
   - Context: `<Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />`

2. **Line 211:40** - ✅ Auto-fixable
   - Current: `text-red-500`
   - Suggested: `text-[var(--color-status-error)]`
   - Context: `<p className="text-red-500 font-medium">{tx('dashboard.admin.jobs.loadError', undefined, 'Failed to load jobs')}</p>`

3. **Line 272:146** - ✅ Auto-fixable
   - Current: `border-red-500`
   - Suggested: `border-[var(--color-status-error)]`
   - Context: `<button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/18 bg-red-500/10 px-3.5 text-sm font-semibold text-red-300 transition-all hover:-translate-y-0.5 hover:bg-red-500/16 disabled:opacity-50" onClick={() => handleDeleteJob(job.id)} disabled={deleteJobMutation.isPending}>`

4. **Line 272:164** - ✅ Auto-fixable
   - Current: `bg-red-500`
   - Suggested: `bg-[var(--color-status-error)]`
   - Context: `<button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/18 bg-red-500/10 px-3.5 text-sm font-semibold text-red-300 transition-all hover:-translate-y-0.5 hover:bg-red-500/16 disabled:opacity-50" onClick={() => handleDeleteJob(job.id)} disabled={deleteJobMutation.isPending}>`

5. **Line 272:207** - ✅ Auto-fixable
   - Current: `text-red-300`
   - Suggested: `text-[var(--color-status-error)]`
   - Context: `<button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/18 bg-red-500/10 px-3.5 text-sm font-semibold text-red-300 transition-all hover:-translate-y-0.5 hover:bg-red-500/16 disabled:opacity-50" onClick={() => handleDeleteJob(job.id)} disabled={deleteJobMutation.isPending}>`

6. **Line 272:264** - ✅ Auto-fixable
   - Current: `bg-red-500`
   - Suggested: `bg-[var(--color-status-error)]`
   - Context: `<button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/18 bg-red-500/10 px-3.5 text-sm font-semibold text-red-300 transition-all hover:-translate-y-0.5 hover:bg-red-500/16 disabled:opacity-50" onClick={() => handleDeleteJob(job.id)} disabled={deleteJobMutation.isPending}>`

7. **Line 322:107** - ✅ Auto-fixable
   - Current: `text-red-600`
   - Suggested: `text-[var(--color-status-error)]`
   - Context: `<Button variant="ghost" size="sm" className="flex-1 min-h-[44px] text-red-600 hover:bg-red-50" onClick={() => handleDeleteJob(job.id)} disabled={deleteJobMutation.isPending}>`

8. **Line 322:126** - ✅ Auto-fixable
   - Current: `bg-red-50`
   - Suggested: `bg-[var(--color-status-error-subtle)]`
   - Context: `<Button variant="ghost" size="sm" className="flex-1 min-h-[44px] text-red-600 hover:bg-red-50" onClick={() => handleDeleteJob(job.id)} disabled={deleteJobMutation.isPending}>`

9. **Line 343:83** - ✅ Auto-fixable
   - Current: `bg-amber-600`
   - Suggested: `bg-[var(--color-status-warning)]`
   - Context: `className={confirmAction.actionType === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-white border-transparent shadow shadow-amber-600/30' : ''}`

10. **Line 343:102** - ✅ Auto-fixable
   - Current: `bg-amber-700`
   - Suggested: `bg-[var(--color-status-warning-hover)]`
   - Context: `className={confirmAction.actionType === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-white border-transparent shadow shadow-amber-600/30' : ''}`

### src\pages\admin\OverviewTab.tsx

Found 20 issue(s):

1. **Line 109:58** - ✅ Auto-fixable
   - Current: `text-primary-600`
   - Suggested: `text-[var(--color-brand-primary)]`
   - Context: `<Loader2 className="h-8 w-8 animate-spin text-primary-600" />`

2. **Line 125:55** - ⚠️ Manual review
   - Current: `text-cyan-500`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<Activity className="w-5 h-5 text-cyan-500" />{tx('dashboard.admin.overview.todayActivity', undefined, 'Today activity')}`

3. **Line 129:106** - ⚠️ Manual review
   - Current: `text-emerald-600`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<div className="flex items-center gap-2 mb-2"><UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-300" /><span className="text-emerald-800 dark:text-emerald-200 font-medium">{tx('dashboard.admin.overview.newSignups', undefined, 'New signups')}</span></div>`

4. **Line 129:128** - ⚠️ Manual review
   - Current: `text-emerald-300`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<div className="flex items-center gap-2 mb-2"><UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-300" /><span className="text-emerald-800 dark:text-emerald-200 font-medium">{tx('dashboard.admin.overview.newSignups', undefined, 'New signups')}</span></div>`

5. **Line 129:165** - ⚠️ Manual review
   - Current: `text-emerald-800`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<div className="flex items-center gap-2 mb-2"><UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-300" /><span className="text-emerald-800 dark:text-emerald-200 font-medium">{tx('dashboard.admin.overview.newSignups', undefined, 'New signups')}</span></div>`

6. **Line 129:187** - ⚠️ Manual review
   - Current: `text-emerald-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<div className="flex items-center gap-2 mb-2"><UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-300" /><span className="text-emerald-800 dark:text-emerald-200 font-medium">{tx('dashboard.admin.overview.newSignups', undefined, 'New signups')}</span></div>`

7. **Line 130:64** - ⚠️ Manual review
   - Current: `text-emerald-700`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{s.todaySignups}</p>`

8. **Line 130:86** - ⚠️ Manual review
   - Current: `text-emerald-300`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{s.todaySignups}</p>`

9. **Line 133:106** - ⚠️ Manual review
   - Current: `text-cyan-600`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<div className="flex items-center gap-2 mb-2"><FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-300" /><span className="text-cyan-800 dark:text-cyan-200 font-medium">{tx('dashboard.admin.overview.newContracts', undefined, 'New contracts')}</span></div>`

10. **Line 133:125** - ⚠️ Manual review
   - Current: `text-cyan-300`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<div className="flex items-center gap-2 mb-2"><FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-300" /><span className="text-cyan-800 dark:text-cyan-200 font-medium">{tx('dashboard.admin.overview.newContracts', undefined, 'New contracts')}</span></div>`

11. **Line 133:159** - ⚠️ Manual review
   - Current: `text-cyan-800`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<div className="flex items-center gap-2 mb-2"><FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-300" /><span className="text-cyan-800 dark:text-cyan-200 font-medium">{tx('dashboard.admin.overview.newContracts', undefined, 'New contracts')}</span></div>`

12. **Line 133:178** - ⚠️ Manual review
   - Current: `text-cyan-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<div className="flex items-center gap-2 mb-2"><FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-300" /><span className="text-cyan-800 dark:text-cyan-200 font-medium">{tx('dashboard.admin.overview.newContracts', undefined, 'New contracts')}</span></div>`

13. **Line 134:64** - ⚠️ Manual review
   - Current: `text-cyan-700`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{s.todayContracts}</p>`

14. **Line 134:83** - ⚠️ Manual review
   - Current: `text-cyan-300`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{s.todayContracts}</p>`

15. **Line 140:53** - ✅ Auto-fixable
   - Current: `text-yellow-600`
   - Suggested: `text-[var(--color-status-warning)]`
   - Context: `<Shield className="w-5 h-5 text-yellow-600" />`

16. **Line 148:72** - ✅ Auto-fixable
   - Current: `text-yellow-800`
   - Suggested: `text-[var(--color-status-warning-hover)]`
   - Context: `<span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{tx('dashboard.admin.overview.requestsCount', undefined, 'Pending requests count')}</span>`

17. **Line 148:93** - ⚠️ Manual review
   - Current: `text-yellow-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{tx('dashboard.admin.overview.requestsCount', undefined, 'Pending requests count')}</span>`

18. **Line 149:70** - ⚠️ Manual review
   - Current: `text-yellow-700`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{s.pendingVerifications}</span>`

19. **Line 149:91** - ⚠️ Manual review
   - Current: `text-yellow-300`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{s.pendingVerifications}</span>`

20. **Line 163:114** - ✅ Auto-fixable
   - Current: `text-red-600`
   - Suggested: `text-[var(--color-status-error)]`
   - Context: `<h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Flag className="w-5 h-5 text-red-600" />{tx('dashboard.admin.overview.reports', undefined, 'Reports')}</h3>`

### src\pages\admin\PaymentsTab.tsx

Found 3 issue(s):

1. **Line 34:57** - ✅ Auto-fixable
   - Current: `text-yellow-600`
   - Suggested: `text-[var(--color-status-warning)]`
   - Context: `<CreditCard className="w-5 h-5 text-yellow-600" />`

2. **Line 42:98** - ✅ Auto-fixable
   - Current: `text-primary-600`
   - Suggested: `text-[var(--color-brand-primary)]`
   - Context: `<div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" /><p className="text-muted">{tx('dashboard.admin.payments.loading', undefined, 'Loading...')}</p></div>`

3. **Line 45:54** - ✅ Auto-fixable
   - Current: `text-green-500`
   - Suggested: `text-[var(--color-status-success)]`
   - Context: `<Check className="w-12 h-12 text-green-500 mx-auto mb-2" />`

### src\pages\admin\ReportsTab.tsx

Found 19 issue(s):

1. **Line 73:54** - ✅ Auto-fixable
   - Current: `text-red-500`
   - Suggested: `text-[var(--color-status-error)]`
   - Context: `<Flag className="w-5 h-5 text-red-500" />`

2. **Line 77:71** - ✅ Auto-fixable
   - Current: `bg-red-100`
   - Suggested: `bg-[var(--color-status-error-subtle)]`
   - Context: `<span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300 rounded-full text-xs">{reports.length}</span>`

3. **Line 77:82** - ✅ Auto-fixable
   - Current: `text-red-700`
   - Suggested: `text-[var(--color-status-error-hover)]`
   - Context: `<span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300 rounded-full text-xs">{reports.length}</span>`

4. **Line 77:100** - ✅ Auto-fixable
   - Current: `bg-red-500`
   - Suggested: `bg-[var(--color-status-error)]`
   - Context: `<span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300 rounded-full text-xs">{reports.length}</span>`

5. **Line 77:119** - ✅ Auto-fixable
   - Current: `text-red-300`
   - Suggested: `text-[var(--color-status-error)]`
   - Context: `<span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300 rounded-full text-xs">{reports.length}</span>`

6. **Line 104:39** - ✅ Auto-fixable
   - Current: `text-red-500`
   - Suggested: `text-[var(--color-status-error)]`
   - Context: `<p className="text-red-500 font-medium">{tr('فشل تحميل البلاغات', 'Failed to load reports', 'Impossible de charger les signalements')}</p>`

7. **Line 108:53** - ✅ Auto-fixable
   - Current: `text-green-500`
   - Suggested: `text-[var(--color-status-success)]`
   - Context: `<Check className="w-12 h-12 text-green-500 mx-auto mb-2" />`

8. **Line 159:80** - ✅ Auto-fixable
   - Current: `text-gray-500`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `className="text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400"`

9. **Line 159:100** - ✅ Auto-fixable
   - Current: `bg-gray-100`
   - Suggested: `bg-[var(--color-bg-subtle)]`
   - Context: `className="text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400"`

10. **Line 159:117** - ✅ Auto-fixable
   - Current: `bg-gray-800`
   - Suggested: `bg-[var(--color-bg-elevated)]`
   - Context: `className="text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400"`

11. **Line 159:134** - ✅ Auto-fixable
   - Current: `text-gray-400`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `className="text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400"`

12. **Line 172:76** - ✅ Auto-fixable
   - Current: `text-amber-600`
   - Suggested: `text-[var(--color-status-warning)]`
   - Context: `className="text-amber-600 hover:bg-amber-50"`

13. **Line 172:97** - ✅ Auto-fixable
   - Current: `bg-amber-50`
   - Suggested: `bg-[var(--color-status-warning-subtle)]`
   - Context: `className="text-amber-600 hover:bg-amber-50"`

14. **Line 203:72** - ✅ Auto-fixable
   - Current: `border-gray-100`
   - Suggested: `border-[var(--color-border-subtle)]`
   - Context: `<div className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-800 dark:border-white/10">`

15. **Line 203:93** - ✅ Auto-fixable
   - Current: `border-gray-800`
   - Suggested: `border-[var(--color-border-strong)]`
   - Context: `<div className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-800 dark:border-white/10">`

16. **Line 229:84** - ✅ Auto-fixable
   - Current: `text-gray-500`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `className="flex-1 min-h-[44px] text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400"`

17. **Line 229:104** - ✅ Auto-fixable
   - Current: `bg-gray-100`
   - Suggested: `bg-[var(--color-bg-subtle)]`
   - Context: `className="flex-1 min-h-[44px] text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400"`

18. **Line 229:121** - ✅ Auto-fixable
   - Current: `bg-gray-800`
   - Suggested: `bg-[var(--color-bg-elevated)]`
   - Context: `className="flex-1 min-h-[44px] text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400"`

19. **Line 229:138** - ✅ Auto-fixable
   - Current: `text-gray-400`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `className="flex-1 min-h-[44px] text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400"`

### src\pages\admin\SettingsTab.tsx

Found 1 issue(s):

1. **Line 22:117** - ⚠️ Manual review
   - Current: `text-cyan-500`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<h3 className="font-bold text-foreground mb-5 flex items-center gap-2"><Settings className="w-5 h-5 text-cyan-500" />{tr('إعدادات لوحة الإدارة', 'Admin dashboard settings', 'Parametres du tableau admin')}</h3>`

### src\pages\admin\UsersTab.tsx

Found 22 issue(s):

1. **Line 339:66** - ✅ Auto-fixable
   - Current: `text-primary-600`
   - Suggested: `text-[var(--color-brand-primary)]`
   - Context: `<Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />`

2. **Line 344:39** - ✅ Auto-fixable
   - Current: `text-red-500`
   - Suggested: `text-[var(--color-status-error)]`
   - Context: `<p className="text-red-500 font-medium">{tx('dashboard.admin.users.failedToLoadUsers', undefined, 'Failed to load users')}</p>`

3. **Line 434:98** - ✅ Auto-fixable
   - Current: `text-yellow-600`
   - Suggested: `text-[var(--color-status-warning)]`
   - Context: `className={`${iconActionClass} hover:text-yellow-600 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 disabled:opacity-50`}`

4. **Line 434:125** - ⚠️ Manual review
   - Current: `text-yellow-300`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `className={`${iconActionClass} hover:text-yellow-600 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 disabled:opacity-50`}`

5. **Line 434:147** - ✅ Auto-fixable
   - Current: `bg-yellow-50`
   - Suggested: `bg-[var(--color-status-warning-subtle)]`
   - Context: `className={`${iconActionClass} hover:text-yellow-600 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 disabled:opacity-50`}`

6. **Line 434:171** - ⚠️ Manual review
   - Current: `bg-yellow-500`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `className={`${iconActionClass} hover:text-yellow-600 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 disabled:opacity-50`}`

7. **Line 442:98** - ✅ Auto-fixable
   - Current: `text-amber-600`
   - Suggested: `text-[var(--color-status-warning)]`
   - Context: `className={`${iconActionClass} hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 disabled:opacity-50`}`

8. **Line 442:124** - ⚠️ Manual review
   - Current: `text-amber-300`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `className={`${iconActionClass} hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 disabled:opacity-50`}`

9. **Line 442:145** - ✅ Auto-fixable
   - Current: `bg-amber-50`
   - Suggested: `bg-[var(--color-status-warning-subtle)]`
   - Context: `className={`${iconActionClass} hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 disabled:opacity-50`}`

10. **Line 442:168** - ✅ Auto-fixable
   - Current: `bg-amber-500`
   - Suggested: `bg-[var(--color-status-warning)]`
   - Context: `className={`${iconActionClass} hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 disabled:opacity-50`}`

11. **Line 449:98** - ✅ Auto-fixable
   - Current: `text-red-600`
   - Suggested: `text-[var(--color-status-error)]`
   - Context: `className={`${iconActionClass} hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50`}`

12. **Line 449:122** - ✅ Auto-fixable
   - Current: `text-red-300`
   - Suggested: `text-[var(--color-status-error)]`
   - Context: `className={`${iconActionClass} hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50`}`

13. **Line 449:141** - ✅ Auto-fixable
   - Current: `bg-red-50`
   - Suggested: `bg-[var(--color-status-error-subtle)]`
   - Context: `className={`${iconActionClass} hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50`}`

14. **Line 449:162** - ✅ Auto-fixable
   - Current: `bg-red-500`
   - Suggested: `bg-[var(--color-status-error)]`
   - Context: `className={`${iconActionClass} hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50`}`

15. **Line 509:60** - ✅ Auto-fixable
   - Current: `text-amber-600`
   - Suggested: `text-[var(--color-status-warning)]`
   - Context: `className="text-amber-600 hover:bg-amber-50 flex-1 justify-center"`

16. **Line 509:81** - ✅ Auto-fixable
   - Current: `bg-amber-50`
   - Suggested: `bg-[var(--color-status-warning-subtle)]`
   - Context: `className="text-amber-600 hover:bg-amber-50 flex-1 justify-center"`

17. **Line 520:56** - ✅ Auto-fixable
   - Current: `text-yellow-600`
   - Suggested: `text-[var(--color-status-warning)]`
   - Context: `className="text-yellow-600 hover:bg-yellow-50 flex-1 justify-center"`

18. **Line 520:78** - ✅ Auto-fixable
   - Current: `bg-yellow-50`
   - Suggested: `bg-[var(--color-status-warning-subtle)]`
   - Context: `className="text-yellow-600 hover:bg-yellow-50 flex-1 justify-center"`

19. **Line 530:56** - ✅ Auto-fixable
   - Current: `text-red-600`
   - Suggested: `text-[var(--color-status-error)]`
   - Context: `className="text-red-600 hover:bg-red-50 flex-1 justify-center"`

20. **Line 530:75** - ✅ Auto-fixable
   - Current: `bg-red-50`
   - Suggested: `bg-[var(--color-status-error-subtle)]`
   - Context: `className="text-red-600 hover:bg-red-50 flex-1 justify-center"`

21. **Line 607:82** - ✅ Auto-fixable
   - Current: `bg-amber-600`
   - Suggested: `bg-[var(--color-status-warning)]`
   - Context: `className={confirmAction.actionType === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-white border-transparent shadow shadow-amber-600/30' : ''}`

22. **Line 607:101** - ✅ Auto-fixable
   - Current: `bg-amber-700`
   - Suggested: `bg-[var(--color-status-warning-hover)]`
   - Context: `className={confirmAction.actionType === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-white border-transparent shadow shadow-amber-600/30' : ''}`

### src\pages\admin\VerificationQueue.tsx

Found 93 issue(s):

1. **Line 264:58** - ✅ Auto-fixable
   - Current: `text-primary-600`
   - Suggested: `text-[var(--color-brand-primary)]`
   - Context: `<Loader2 className="w-8 h-8 animate-spin text-primary-600" />`

2. **Line 273:56** - ✅ Auto-fixable
   - Current: `text-red-500`
   - Suggested: `text-[var(--color-status-error)]`
   - Context: `<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />`

3. **Line 274:55** - ✅ Auto-fixable
   - Current: `text-gray-900`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-2">{tx('dashboard.admin.verificationQueue.errorTitle', undefined, 'Loading error')}</h2>`

4. **Line 274:74** - ✅ Auto-fixable
   - Current: `text-gray-100`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-2">{tx('dashboard.admin.verificationQueue.errorTitle', undefined, 'Loading error')}</h2>`

5. **Line 275:36** - ✅ Auto-fixable
   - Current: `text-gray-600`
   - Suggested: `text-[var(--color-text-secondary)]`
   - Context: `<p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>`

6. **Line 275:55** - ✅ Auto-fixable
   - Current: `text-gray-400`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `<p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>`

7. **Line 281:48** - ✅ Auto-fixable
   - Current: `bg-primary-600`
   - Suggested: `bg-[var(--color-brand-primary)]`
   - Context: `className="rounded-xl bg-primary-600 px-6 py-2 text-white transition-colors hover:bg-primary-700"`

8. **Line 281:108** - ✅ Auto-fixable
   - Current: `bg-primary-700`
   - Suggested: `bg-[var(--color-brand-primary-hover)]`
   - Context: `className="rounded-xl bg-primary-600 px-6 py-2 text-white transition-colors hover:bg-primary-700"`

9. **Line 297:53** - ✅ Auto-fixable
   - Current: `text-primary-600`
   - Suggested: `text-[var(--color-brand-primary)]`
   - Context: `<Shield className="w-8 h-8 text-primary-600" />`

10. **Line 298:60** - ✅ Auto-fixable
   - Current: `text-gray-900`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">`

11. **Line 298:79** - ✅ Auto-fixable
   - Current: `text-gray-100`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">`

12. **Line 302:36** - ✅ Auto-fixable
   - Current: `text-gray-600`
   - Suggested: `text-[var(--color-text-secondary)]`
   - Context: `<p className="text-gray-600 dark:text-gray-400">`

13. **Line 302:55** - ✅ Auto-fixable
   - Current: `text-gray-400`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `<p className="text-gray-600 dark:text-gray-400">`

14. **Line 312:61** - ✅ Auto-fixable
   - Current: `text-amber-600`
   - Suggested: `text-[var(--color-status-warning)]`
   - Context: `<Clock className="w-5 h-5 text-amber-600" />`

15. **Line 315:67** - ✅ Auto-fixable
   - Current: `text-gray-900`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<p className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">{verifications.length}</p>`

16. **Line 315:86** - ✅ Auto-fixable
   - Current: `text-gray-100`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<p className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">{verifications.length}</p>`

17. **Line 316:56** - ✅ Auto-fixable
   - Current: `text-gray-600`
   - Suggested: `text-[var(--color-text-secondary)]`
   - Context: `<p className="text-sm text-gray-600 dark:text-gray-400">{tx('dashboard.admin.verificationQueue.pending', undefined, 'Pending')}</p>`

18. **Line 316:75** - ✅ Auto-fixable
   - Current: `text-gray-400`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `<p className="text-sm text-gray-600 dark:text-gray-400">{tx('dashboard.admin.verificationQueue.pending', undefined, 'Pending')}</p>`

19. **Line 325:63** - ✅ Auto-fixable
   - Current: `text-gray-900`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white">`

20. **Line 325:82** - ✅ Auto-fixable
   - Current: `text-gray-100`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white">`

21. **Line 330:60** - ✅ Auto-fixable
   - Current: `bg-gray-800`
   - Suggested: `bg-[var(--color-bg-elevated)]`
   - Context: `<div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-800 dark:border-gray-700">`

22. **Line 330:106** - ✅ Auto-fixable
   - Current: `border-gray-100`
   - Suggested: `border-[var(--color-border-subtle)]`
   - Context: `<div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-800 dark:border-gray-700">`

23. **Line 330:127** - ✅ Auto-fixable
   - Current: `border-gray-800`
   - Suggested: `border-[var(--color-border-strong)]`
   - Context: `<div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-800 dark:border-gray-700">`

24. **Line 330:148** - ✅ Auto-fixable
   - Current: `border-gray-700`
   - Suggested: `border-[var(--color-border-default)]`
   - Context: `<div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-100 dark:border-gray-800 dark:border-gray-700">`

25. **Line 331:69** - ✅ Auto-fixable
   - Current: `text-green-500`
   - Suggested: `text-[var(--color-status-success)]`
   - Context: `<CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />`

26. **Line 332:48** - ✅ Auto-fixable
   - Current: `text-gray-600`
   - Suggested: `text-[var(--color-text-secondary)]`
   - Context: `<p className="text-gray-600 dark:text-gray-400">`

27. **Line 332:67** - ✅ Auto-fixable
   - Current: `text-gray-400`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `<p className="text-gray-600 dark:text-gray-400">`

28. **Line 342:45** - ✅ Auto-fixable
   - Current: `border-primary-500`
   - Suggested: `border-[var(--color-brand-primary)]`
   - Context: `? 'border-primary-500 shadow-lg shadow-primary-500/10'`

29. **Line 350:101** - ✅ Auto-fixable
   - Current: `border-gray-100`
   - Suggested: `border-[var(--color-border-subtle)]`
   - Context: `className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 dark:border-gray-800 dark:border-gray-700"`

30. **Line 350:122** - ✅ Auto-fixable
   - Current: `border-gray-800`
   - Suggested: `border-[var(--color-border-strong)]`
   - Context: `className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 dark:border-gray-800 dark:border-gray-700"`

31. **Line 350:143** - ✅ Auto-fixable
   - Current: `border-gray-700`
   - Suggested: `border-[var(--color-border-default)]`
   - Context: `className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 dark:border-gray-800 dark:border-gray-700"`

32. **Line 353:74** - ✅ Auto-fixable
   - Current: `text-gray-900`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<h3 className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white truncate">`

33. **Line 353:93** - ✅ Auto-fixable
   - Current: `text-gray-100`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<h3 className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white truncate">`

34. **Line 356:67** - ✅ Auto-fixable
   - Current: `text-gray-600`
   - Suggested: `text-[var(--color-text-secondary)]`
   - Context: `<p className="text-sm text-gray-600 dark:text-gray-400 truncate">`

35. **Line 356:86** - ✅ Auto-fixable
   - Current: `text-gray-400`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `<p className="text-sm text-gray-600 dark:text-gray-400 truncate">`

36. **Line 359:67** - ✅ Auto-fixable
   - Current: `text-gray-500`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `<p className="text-xs text-gray-500 dark:text-gray-500">`

37. **Line 359:86** - ✅ Auto-fixable
   - Current: `text-gray-500`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `<p className="text-xs text-gray-500 dark:text-gray-500">`

38. **Line 363:73** - ✅ Auto-fixable
   - Current: `text-gray-400`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `<ChevronLeft className="w-5 h-5 text-gray-400 rtl:rotate-180" />`

39. **Line 373:68** - ✅ Auto-fixable
   - Current: `text-gray-900`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100 dark:text-white flex items-center gap-2">`

40. **Line 373:87** - ✅ Auto-fixable
   - Current: `text-gray-100`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100 dark:text-white flex items-center gap-2">`

41. **Line 379:60** - ⚠️ Manual review
   - Current: `border-slate-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<div className="mb-6 border-b border-slate-200/70 pb-6 dark:border-white/8">`

42. **Line 384:97** - ✅ Auto-fixable
   - Current: `border-gray-100`
   - Suggested: `border-[var(--color-border-subtle)]`
   - Context: `className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 dark:border-gray-800 dark:border-gray-700"`

43. **Line 384:118** - ✅ Auto-fixable
   - Current: `border-gray-800`
   - Suggested: `border-[var(--color-border-strong)]`
   - Context: `className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 dark:border-gray-800 dark:border-gray-700"`

44. **Line 384:139** - ✅ Auto-fixable
   - Current: `border-gray-700`
   - Suggested: `border-[var(--color-border-default)]`
   - Context: `className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 dark:border-gray-800 dark:border-gray-700"`

45. **Line 387:69** - ✅ Auto-fixable
   - Current: `text-gray-900`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">`

46. **Line 387:88** - ✅ Auto-fixable
   - Current: `text-gray-100`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">`

47. **Line 390:63** - ✅ Auto-fixable
   - Current: `text-gray-600`
   - Suggested: `text-[var(--color-text-secondary)]`
   - Context: `<p className="text-sm text-gray-600 dark:text-gray-400">`

48. **Line 390:82** - ✅ Auto-fixable
   - Current: `text-gray-400`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `<p className="text-sm text-gray-600 dark:text-gray-400">`

49. **Line 399:56** - ✅ Auto-fixable
   - Current: `text-gray-600`
   - Suggested: `text-[var(--color-text-secondary)]`
   - Context: `<p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{tx('dashboard.admin.verificationQueue.idNumber', undefined, 'ID number')}</p>`

50. **Line 399:75** - ✅ Auto-fixable
   - Current: `text-gray-400`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `<p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{tx('dashboard.admin.verificationQueue.idNumber', undefined, 'ID number')}</p>`

51. **Line 400:77** - ✅ Auto-fixable
   - Current: `text-gray-900`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<p className="text-3xl font-mono font-bold text-gray-900 dark:text-gray-100 dark:text-white tracking-wider" dir="ltr">`

52. **Line 400:96** - ✅ Auto-fixable
   - Current: `text-gray-100`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<p className="text-3xl font-mono font-bold text-gray-900 dark:text-gray-100 dark:text-white tracking-wider" dir="ltr">`

53. **Line 408:77** - ✅ Auto-fixable
   - Current: `text-gray-700`
   - Suggested: `text-[var(--color-text-secondary)]`
   - Context: `<p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{tx('dashboard.admin.verificationQueue.cardFront', undefined, 'Card front')}</p>`

54. **Line 408:96** - ✅ Auto-fixable
   - Current: `text-gray-300`
   - Suggested: `text-[var(--color-text-disabled)]`
   - Context: `<p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{tx('dashboard.admin.verificationQueue.cardFront', undefined, 'Card front')}</p>`

55. **Line 412:83** - ⚠️ Manual review
   - Current: `border-slate-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `className="w-full rounded-lg border border-slate-200/80 dark:border-white/10"`

56. **Line 417:88** - ✅ Auto-fixable
   - Current: `text-gray-400`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `<Loader2 className="w-6 h-6 animate-spin text-gray-400" />`

57. **Line 422:77** - ✅ Auto-fixable
   - Current: `text-gray-700`
   - Suggested: `text-[var(--color-text-secondary)]`
   - Context: `<p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{tx('dashboard.admin.verificationQueue.cardBack', undefined, 'Card back')}</p>`

58. **Line 422:96** - ✅ Auto-fixable
   - Current: `text-gray-300`
   - Suggested: `text-[var(--color-text-disabled)]`
   - Context: `<p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{tx('dashboard.admin.verificationQueue.cardBack', undefined, 'Card back')}</p>`

59. **Line 426:83** - ⚠️ Manual review
   - Current: `border-slate-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `className="w-full rounded-lg border border-slate-200/80 dark:border-white/10"`

60. **Line 431:88** - ✅ Auto-fixable
   - Current: `text-gray-400`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `<Loader2 className="w-6 h-6 animate-spin text-gray-400" />`

61. **Line 436:77** - ✅ Auto-fixable
   - Current: `text-gray-700`
   - Suggested: `text-[var(--color-text-secondary)]`
   - Context: `<p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{tx('dashboard.admin.verificationQueue.selfie', undefined, 'Selfie')}</p>`

62. **Line 436:96** - ✅ Auto-fixable
   - Current: `text-gray-300`
   - Suggested: `text-[var(--color-text-disabled)]`
   - Context: `<p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{tx('dashboard.admin.verificationQueue.selfie', undefined, 'Selfie')}</p>`

63. **Line 440:83** - ⚠️ Manual review
   - Current: `border-slate-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `className="w-full rounded-lg border border-slate-200/80 dark:border-white/10"`

64. **Line 445:88** - ✅ Auto-fixable
   - Current: `text-gray-400`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `<Loader2 className="w-6 h-6 animate-spin text-gray-400" />`

65. **Line 453:73** - ✅ Auto-fixable
   - Current: `text-gray-700`
   - Suggested: `text-[var(--color-text-secondary)]`
   - Context: `<p className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">{tx('dashboard.admin.verificationQueue.checklist', undefined, 'Verification checklist:')}</p>`

66. **Line 453:92** - ✅ Auto-fixable
   - Current: `text-gray-300`
   - Suggested: `text-[var(--color-text-disabled)]`
   - Context: `<p className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">{tx('dashboard.admin.verificationQueue.checklist', undefined, 'Verification checklist:')}</p>`

67. **Line 454:67** - ✅ Auto-fixable
   - Current: `text-gray-600`
   - Suggested: `text-[var(--color-text-secondary)]`
   - Context: `<ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">`

68. **Line 454:86** - ✅ Auto-fixable
   - Current: `text-gray-400`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `<ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">`

69. **Line 456:84** - ✅ Auto-fixable
   - Current: `text-primary-600`
   - Suggested: `text-[var(--color-brand-primary)]`
   - Context: `<input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />`

70. **Line 460:84** - ✅ Auto-fixable
   - Current: `text-primary-600`
   - Suggested: `text-[var(--color-brand-primary)]`
   - Context: `<input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />`

71. **Line 464:84** - ✅ Auto-fixable
   - Current: `text-primary-600`
   - Suggested: `text-[var(--color-brand-primary)]`
   - Context: `<input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />`

72. **Line 468:84** - ✅ Auto-fixable
   - Current: `text-primary-600`
   - Suggested: `text-[var(--color-brand-primary)]`
   - Context: `<input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />`

73. **Line 479:104** - ✅ Auto-fixable
   - Current: `bg-green-600`
   - Suggested: `bg-[var(--color-status-success)]`
   - Context: `className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"`

74. **Line 479:157** - ✅ Auto-fixable
   - Current: `bg-green-700`
   - Suggested: `bg-[var(--color-status-success-hover)]`
   - Context: `className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"`

75. **Line 491:104** - ✅ Auto-fixable
   - Current: `bg-red-600`
   - Suggested: `bg-[var(--color-status-error)]`
   - Context: `className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"`

76. **Line 491:155** - ✅ Auto-fixable
   - Current: `bg-red-700`
   - Suggested: `bg-[var(--color-status-error-hover)]`
   - Context: `className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"`

77. **Line 500:57** - ✅ Auto-fixable
   - Current: `text-gray-400`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `<User className="w-12 h-12 text-gray-400 mx-auto mb-4" />`

78. **Line 501:44** - ✅ Auto-fixable
   - Current: `text-gray-600`
   - Suggested: `text-[var(--color-text-secondary)]`
   - Context: `<p className="text-gray-600 dark:text-gray-400">`

79. **Line 501:63** - ✅ Auto-fixable
   - Current: `text-gray-400`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `<p className="text-gray-600 dark:text-gray-400">`

80. **Line 515:66** - ✅ Auto-fixable
   - Current: `text-red-600`
   - Suggested: `text-[var(--color-status-error)]`
   - Context: `<AlertCircle className="w-5 h-5 text-red-600" />`

81. **Line 517:63** - ✅ Auto-fixable
   - Current: `text-gray-900`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 dark:text-white">`

82. **Line 517:82** - ✅ Auto-fixable
   - Current: `text-gray-100`
   - Suggested: `text-[var(--color-text-primary)]`
   - Context: `<h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 dark:text-white">`

83. **Line 522:48** - ✅ Auto-fixable
   - Current: `text-gray-600`
   - Suggested: `text-[var(--color-text-secondary)]`
   - Context: `<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">`

84. **Line 522:67** - ✅ Auto-fixable
   - Current: `text-gray-400`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">`

85. **Line 540:61** - ✅ Auto-fixable
   - Current: `bg-gray-100`
   - Suggested: `bg-[var(--color-bg-subtle)]`
   - Context: `className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"`

86. **Line 540:78** - ✅ Auto-fixable
   - Current: `bg-gray-800`
   - Suggested: `bg-[var(--color-bg-elevated)]`
   - Context: `className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"`

87. **Line 540:95** - ✅ Auto-fixable
   - Current: `bg-gray-700`
   - Suggested: `bg-[var(--color-bg-muted)]`
   - Context: `className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"`

88. **Line 540:107** - ✅ Auto-fixable
   - Current: `text-gray-700`
   - Suggested: `text-[var(--color-text-secondary)]`
   - Context: `className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"`

89. **Line 540:126** - ✅ Auto-fixable
   - Current: `text-gray-300`
   - Suggested: `text-[var(--color-text-disabled)]`
   - Context: `className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"`

90. **Line 540:169** - ✅ Auto-fixable
   - Current: `bg-gray-200`
   - Suggested: `bg-[var(--color-bg-muted)]`
   - Context: `className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"`

91. **Line 540:192** - ⚠️ Manual review
   - Current: `bg-gray-600`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"`

92. **Line 547:62** - ✅ Auto-fixable
   - Current: `bg-red-600`
   - Suggested: `bg-[var(--color-status-error)]`
   - Context: `className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"`

93. **Line 547:113** - ✅ Auto-fixable
   - Current: `bg-red-700`
   - Suggested: `bg-[var(--color-status-error-hover)]`
   - Context: `className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"`

### src\pages\admin\VerificationsTab.tsx

Found 21 issue(s):

1. **Line 232:57** - ✅ Auto-fixable
   - Current: `text-yellow-600`
   - Suggested: `text-[var(--color-status-warning)]`
   - Context: `<Shield className="w-5 h-5 text-yellow-600" />`

2. **Line 250:58** - ✅ Auto-fixable
   - Current: `text-green-500`
   - Suggested: `text-[var(--color-status-success)]`
   - Context: `<Check className="w-12 h-12 text-green-500 mx-auto mb-2" />`

3. **Line 260:82** - ✅ Auto-fixable
   - Current: `bg-gray-200`
   - Suggested: `bg-[var(--color-bg-muted)]`
   - Context: `<div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 dark:bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">`

4. **Line 260:99** - ✅ Auto-fixable
   - Current: `bg-gray-700`
   - Suggested: `bg-[var(--color-bg-muted)]`
   - Context: `<div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 dark:bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">`

5. **Line 264:80** - ✅ Auto-fixable
   - Current: `text-gray-400`
   - Suggested: `text-[var(--color-text-muted)]`
   - Context: `<Shield className="w-6 h-6 text-gray-400 dark:text-gray-300" />`

6. **Line 264:99** - ✅ Auto-fixable
   - Current: `text-gray-300`
   - Suggested: `text-[var(--color-text-disabled)]`
   - Context: `<Shield className="w-6 h-6 text-gray-400 dark:text-gray-300" />`

7. **Line 302:61** - ✅ Auto-fixable
   - Current: `text-red-600`
   - Suggested: `text-[var(--color-status-error)]`
   - Context: `className="text-red-600 hover:bg-red-50"`

8. **Line 302:80** - ✅ Auto-fixable
   - Current: `bg-red-50`
   - Suggested: `bg-[var(--color-status-error-subtle)]`
   - Context: `className="text-red-600 hover:bg-red-50"`

9. **Line 313:89** - ⚠️ Manual review
   - Current: `border-slate-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `<div className="grid grid-cols-1 gap-4 border-t border-slate-200/70 p-4 dark:border-white/8 md:grid-cols-3">`

10. **Line 318:161** - ✅ Auto-fixable
   - Current: `border-gray-200`
   - Suggested: `border-[var(--color-border-default)]`
   - Context: `<img src={v.front_image_url} alt="front" className="w-full rounded-lg object-cover aspect-video border border-gray-200 dark:border-gray-700 dark:border-white/10 dark:border-gray-800 hover:opacity-90 transition" />`

11. **Line 318:182** - ✅ Auto-fixable
   - Current: `border-gray-700`
   - Suggested: `border-[var(--color-border-default)]`
   - Context: `<img src={v.front_image_url} alt="front" className="w-full rounded-lg object-cover aspect-video border border-gray-200 dark:border-gray-700 dark:border-white/10 dark:border-gray-800 hover:opacity-90 transition" />`

12. **Line 318:224** - ✅ Auto-fixable
   - Current: `border-gray-800`
   - Suggested: `border-[var(--color-border-strong)]`
   - Context: `<img src={v.front_image_url} alt="front" className="w-full rounded-lg object-cover aspect-video border border-gray-200 dark:border-gray-700 dark:border-white/10 dark:border-gray-800 hover:opacity-90 transition" />`

13. **Line 321:101** - ✅ Auto-fixable
   - Current: `bg-gray-100`
   - Suggested: `bg-[var(--color-bg-subtle)]`
   - Context: `<div className="w-full rounded-lg aspect-video bg-gray-100 dark:bg-white/10 flex items-center justify-center text-muted text-sm">{tx('dashboard.admin.verification.noImage', undefined, 'No image')}</div>`

14. **Line 328:159** - ✅ Auto-fixable
   - Current: `border-gray-200`
   - Suggested: `border-[var(--color-border-default)]`
   - Context: `<img src={v.back_image_url} alt="back" className="w-full rounded-lg object-cover aspect-video border border-gray-200 dark:border-gray-700 dark:border-white/10 dark:border-gray-800 hover:opacity-90 transition" />`

15. **Line 328:180** - ✅ Auto-fixable
   - Current: `border-gray-700`
   - Suggested: `border-[var(--color-border-default)]`
   - Context: `<img src={v.back_image_url} alt="back" className="w-full rounded-lg object-cover aspect-video border border-gray-200 dark:border-gray-700 dark:border-white/10 dark:border-gray-800 hover:opacity-90 transition" />`

16. **Line 328:222** - ✅ Auto-fixable
   - Current: `border-gray-800`
   - Suggested: `border-[var(--color-border-strong)]`
   - Context: `<img src={v.back_image_url} alt="back" className="w-full rounded-lg object-cover aspect-video border border-gray-200 dark:border-gray-700 dark:border-white/10 dark:border-gray-800 hover:opacity-90 transition" />`

17. **Line 331:101** - ✅ Auto-fixable
   - Current: `bg-gray-100`
   - Suggested: `bg-[var(--color-bg-subtle)]`
   - Context: `<div className="w-full rounded-lg aspect-video bg-gray-100 dark:bg-white/10 flex items-center justify-center text-muted text-sm">{tx('dashboard.admin.verification.noImage', undefined, 'No image')}</div>`

18. **Line 338:157** - ✅ Auto-fixable
   - Current: `border-gray-200`
   - Suggested: `border-[var(--color-border-default)]`
   - Context: `<img src={v.selfie_url} alt="selfie" className="w-full rounded-lg object-cover aspect-video border border-gray-200 dark:border-gray-700 dark:border-white/10 dark:border-gray-800 hover:opacity-90 transition" />`

19. **Line 338:178** - ✅ Auto-fixable
   - Current: `border-gray-700`
   - Suggested: `border-[var(--color-border-default)]`
   - Context: `<img src={v.selfie_url} alt="selfie" className="w-full rounded-lg object-cover aspect-video border border-gray-200 dark:border-gray-700 dark:border-white/10 dark:border-gray-800 hover:opacity-90 transition" />`

20. **Line 338:220** - ✅ Auto-fixable
   - Current: `border-gray-800`
   - Suggested: `border-[var(--color-border-strong)]`
   - Context: `<img src={v.selfie_url} alt="selfie" className="w-full rounded-lg object-cover aspect-video border border-gray-200 dark:border-gray-700 dark:border-white/10 dark:border-gray-800 hover:opacity-90 transition" />`

21. **Line 341:101** - ✅ Auto-fixable
   - Current: `bg-gray-100`
   - Suggested: `bg-[var(--color-bg-subtle)]`
   - Context: `<div className="w-full rounded-lg aspect-video bg-gray-100 dark:bg-white/10 flex items-center justify-center text-muted text-sm">{tx('dashboard.admin.verification.noImage', undefined, 'No image')}</div>`

### src\pages\admin\adminTheme.ts

Found 58 issue(s):

1. **Line 1:58** - ⚠️ Manual review
   - Current: `border-slate-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `export const adminPanelClass = 'rounded-[1.75rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,248,252,0.92))] backdrop-blur-xl shadow-[0_24px_60px_-34px_rgba(15,23,42,0.2)] dark:border-white/8 dark:bg-[linear-gradient(180deg,rgba(14,19,32,0.98),rgba(9,13,24,0.98))] dark:shadow-[0_24px_70px_-34px_rgba(2,6,23,0.98),inset_0_1px_0_rgba(255,255,255,0.05)]';`

2. **Line 5:64** - ⚠️ Manual review
   - Current: `border-slate-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `export const adminTableHeadClass = 'sticky top-0 z-10 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur dark:border-white/8 dark:bg-white/[0.055]';`

3. **Line 5:84** - ⚠️ Manual review
   - Current: `bg-slate-50`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `export const adminTableHeadClass = 'sticky top-0 z-10 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur dark:border-white/8 dark:bg-white/[0.055]';`

4. **Line 6:51** - ⚠️ Manual review
   - Current: `border-slate-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `export const adminTableRowClass = 'group border-b border-slate-200/70 transition-colors last:border-0 hover:bg-slate-50/80 dark:border-white/7 dark:hover:bg-white/[0.035]';`

5. **Line 6:109** - ⚠️ Manual review
   - Current: `bg-slate-50`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `export const adminTableRowClass = 'group border-b border-slate-200/70 transition-colors last:border-0 hover:bg-slate-50/80 dark:border-white/7 dark:hover:bg-white/[0.035]';`

6. **Line 7:58** - ⚠️ Manual review
   - Current: `border-slate-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `export const adminInsetClass = 'rounded-[1.25rem] border border-slate-200/70 bg-slate-50/75 dark:border-white/8 dark:bg-white/[0.045]';`

7. **Line 7:78** - ⚠️ Manual review
   - Current: `bg-slate-50`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `export const adminInsetClass = 'rounded-[1.25rem] border border-slate-200/70 bg-slate-50/75 dark:border-white/8 dark:bg-white/[0.045]';`

8. **Line 9:70** - ⚠️ Manual review
   - Current: `border-slate-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `export const adminInputClass = 'w-full h-12 rounded-[1.15rem] border border-slate-200/80 bg-white/88 px-4 text-slate-900 placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-all focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-brand-primary)]/12 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:placeholder:text-slate-500 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] dark:focus:border-[var(--color-brand-primary)] dark:focus:ring-[var(--color-brand-primary)]/14';`

9. **Line 9:107** - ⚠️ Manual review
   - Current: `text-slate-900`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `export const adminInputClass = 'w-full h-12 rounded-[1.15rem] border border-slate-200/80 bg-white/88 px-4 text-slate-900 placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-all focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-brand-primary)]/12 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:placeholder:text-slate-500 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] dark:focus:border-[var(--color-brand-primary)] dark:focus:ring-[var(--color-brand-primary)]/14';`

10. **Line 9:134** - ⚠️ Manual review
   - Current: `text-slate-400`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `export const adminInputClass = 'w-full h-12 rounded-[1.15rem] border border-slate-200/80 bg-white/88 px-4 text-slate-900 placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-all focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-brand-primary)]/12 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:placeholder:text-slate-500 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] dark:focus:border-[var(--color-brand-primary)] dark:focus:ring-[var(--color-brand-primary)]/14';`

11. **Line 9:399** - ⚠️ Manual review
   - Current: `text-slate-500`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `export const adminInputClass = 'w-full h-12 rounded-[1.15rem] border border-slate-200/80 bg-white/88 px-4 text-slate-900 placeholder:text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-all focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-brand-primary)]/12 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:placeholder:text-slate-500 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] dark:focus:border-[var(--color-brand-primary)] dark:focus:ring-[var(--color-brand-primary)]/14';`

12. **Line 10:64** - ⚠️ Manual review
   - Current: `border-slate-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `export const adminSelectClass = 'h-12 rounded-[1.15rem] border border-slate-200/80 bg-white/88 px-4 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-all focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-brand-primary)]/12 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] dark:focus:border-[var(--color-brand-primary)] dark:focus:ring-[var(--color-brand-primary)]/14';`

13. **Line 10:109** - ⚠️ Manual review
   - Current: `text-slate-900`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `export const adminSelectClass = 'h-12 rounded-[1.15rem] border border-slate-200/80 bg-white/88 px-4 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-all focus:border-[var(--color-brand-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-brand-primary)]/12 dark:border-white/10 dark:bg-[#0f1727] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] dark:focus:border-[var(--color-brand-primary)] dark:focus:ring-[var(--color-brand-primary)]/14';`

14. **Line 12:106** - ⚠️ Manual review
   - Current: `border-slate-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `export const adminIconButtonClass = 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white/85 text-slate-500 transition-all hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400 dark:hover:border-white/14 dark:hover:bg-white/[0.09] dark:hover:text-white';`

15. **Line 12:138** - ⚠️ Manual review
   - Current: `text-slate-500`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `export const adminIconButtonClass = 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white/85 text-slate-500 transition-all hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400 dark:hover:border-white/14 dark:hover:bg-white/[0.09] dark:hover:text-white';`

16. **Line 12:197** - ⚠️ Manual review
   - Current: `border-slate-300`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `export const adminIconButtonClass = 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white/85 text-slate-500 transition-all hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400 dark:hover:border-white/14 dark:hover:bg-white/[0.09] dark:hover:text-white';`

17. **Line 12:280** - ⚠️ Manual review
   - Current: `text-slate-400`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `export const adminIconButtonClass = 'inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/70 bg-white/85 text-slate-500 transition-all hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400 dark:hover:border-white/14 dark:hover:bg-white/[0.09] dark:hover:text-white';`

18. **Line 14:170** - ⚠️ Manual review
   - Current: `text-slate-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `export const adminActionButtonClass = 'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm font-semibold text-slate-200 transition-all hover:-translate-y-0.5 hover:bg-white/[0.08]';`

19. **Line 19:22** - ⚠️ Manual review
   - Current: `border-primary-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-primary-200/80 bg-primary-50 text-primary-700 dark:border-primary-400/18 dark:bg-primary-400/16 dark:text-primary-100';`

20. **Line 19:44** - ✅ Auto-fixable
   - Current: `bg-primary-50`
   - Suggested: `bg-[var(--color-brand-primary-subtle)]`
   - Context: `return 'border border-primary-200/80 bg-primary-50 text-primary-700 dark:border-primary-400/18 dark:bg-primary-400/16 dark:text-primary-100';`

21. **Line 19:58** - ✅ Auto-fixable
   - Current: `text-primary-700`
   - Suggested: `text-[var(--color-brand-primary-hover)]`
   - Context: `return 'border border-primary-200/80 bg-primary-50 text-primary-700 dark:border-primary-400/18 dark:bg-primary-400/16 dark:text-primary-100';`

22. **Line 19:80** - ✅ Auto-fixable
   - Current: `border-primary-400`
   - Suggested: `border-[var(--color-brand-primary)]`
   - Context: `return 'border border-primary-200/80 bg-primary-50 text-primary-700 dark:border-primary-400/18 dark:bg-primary-400/16 dark:text-primary-100';`

23. **Line 19:107** - ⚠️ Manual review
   - Current: `bg-primary-400`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-primary-200/80 bg-primary-50 text-primary-700 dark:border-primary-400/18 dark:bg-primary-400/16 dark:text-primary-100';`

24. **Line 19:130** - ⚠️ Manual review
   - Current: `text-primary-100`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-primary-200/80 bg-primary-50 text-primary-700 dark:border-primary-400/18 dark:bg-primary-400/16 dark:text-primary-100';`

25. **Line 25:22** - ✅ Auto-fixable
   - Current: `border-amber-200`
   - Suggested: `border-[var(--color-status-warning-subtle)]`
   - Context: `return 'border border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-400/18 dark:bg-amber-400/16 dark:text-amber-100';`

26. **Line 25:42** - ✅ Auto-fixable
   - Current: `bg-amber-50`
   - Suggested: `bg-[var(--color-status-warning-subtle)]`
   - Context: `return 'border border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-400/18 dark:bg-amber-400/16 dark:text-amber-100';`

27. **Line 25:54** - ⚠️ Manual review
   - Current: `text-amber-700`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-400/18 dark:bg-amber-400/16 dark:text-amber-100';`

28. **Line 25:74** - ⚠️ Manual review
   - Current: `border-amber-400`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-400/18 dark:bg-amber-400/16 dark:text-amber-100';`

29. **Line 25:99** - ⚠️ Manual review
   - Current: `bg-amber-400`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-400/18 dark:bg-amber-400/16 dark:text-amber-100';`

30. **Line 25:120** - ⚠️ Manual review
   - Current: `text-amber-100`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-400/18 dark:bg-amber-400/16 dark:text-amber-100';`

31. **Line 27:22** - ⚠️ Manual review
   - Current: `border-emerald-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-400/18 dark:bg-emerald-400/16 dark:text-emerald-100';`

32. **Line 27:44** - ⚠️ Manual review
   - Current: `bg-emerald-50`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-400/18 dark:bg-emerald-400/16 dark:text-emerald-100';`

33. **Line 27:58** - ⚠️ Manual review
   - Current: `text-emerald-700`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-400/18 dark:bg-emerald-400/16 dark:text-emerald-100';`

34. **Line 27:80** - ⚠️ Manual review
   - Current: `border-emerald-400`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-400/18 dark:bg-emerald-400/16 dark:text-emerald-100';`

35. **Line 27:107** - ⚠️ Manual review
   - Current: `bg-emerald-400`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-400/18 dark:bg-emerald-400/16 dark:text-emerald-100';`

36. **Line 27:130** - ⚠️ Manual review
   - Current: `text-emerald-100`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-400/18 dark:bg-emerald-400/16 dark:text-emerald-100';`

37. **Line 29:22** - ✅ Auto-fixable
   - Current: `border-red-200`
   - Suggested: `border-[var(--color-status-error-subtle)]`
   - Context: `return 'border border-red-200/80 bg-red-50 text-red-700 dark:border-red-400/18 dark:bg-red-400/16 dark:text-red-100';`

38. **Line 29:40** - ✅ Auto-fixable
   - Current: `bg-red-50`
   - Suggested: `bg-[var(--color-status-error-subtle)]`
   - Context: `return 'border border-red-200/80 bg-red-50 text-red-700 dark:border-red-400/18 dark:bg-red-400/16 dark:text-red-100';`

39. **Line 29:50** - ✅ Auto-fixable
   - Current: `text-red-700`
   - Suggested: `text-[var(--color-status-error-hover)]`
   - Context: `return 'border border-red-200/80 bg-red-50 text-red-700 dark:border-red-400/18 dark:bg-red-400/16 dark:text-red-100';`

40. **Line 29:68** - ⚠️ Manual review
   - Current: `border-red-400`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-red-200/80 bg-red-50 text-red-700 dark:border-red-400/18 dark:bg-red-400/16 dark:text-red-100';`

41. **Line 29:91** - ⚠️ Manual review
   - Current: `bg-red-400`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-red-200/80 bg-red-50 text-red-700 dark:border-red-400/18 dark:bg-red-400/16 dark:text-red-100';`

42. **Line 29:110** - ⚠️ Manual review
   - Current: `text-red-100`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-red-200/80 bg-red-50 text-red-700 dark:border-red-400/18 dark:bg-red-400/16 dark:text-red-100';`

43. **Line 31:22** - ⚠️ Manual review
   - Current: `border-cyan-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-cyan-200/80 bg-cyan-50 text-cyan-700 dark:border-cyan-400/18 dark:bg-cyan-400/16 dark:text-cyan-100';`

44. **Line 31:41** - ⚠️ Manual review
   - Current: `bg-cyan-50`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-cyan-200/80 bg-cyan-50 text-cyan-700 dark:border-cyan-400/18 dark:bg-cyan-400/16 dark:text-cyan-100';`

45. **Line 31:52** - ⚠️ Manual review
   - Current: `text-cyan-700`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-cyan-200/80 bg-cyan-50 text-cyan-700 dark:border-cyan-400/18 dark:bg-cyan-400/16 dark:text-cyan-100';`

46. **Line 31:71** - ⚠️ Manual review
   - Current: `border-cyan-400`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-cyan-200/80 bg-cyan-50 text-cyan-700 dark:border-cyan-400/18 dark:bg-cyan-400/16 dark:text-cyan-100';`

47. **Line 31:95** - ⚠️ Manual review
   - Current: `bg-cyan-400`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-cyan-200/80 bg-cyan-50 text-cyan-700 dark:border-cyan-400/18 dark:bg-cyan-400/16 dark:text-cyan-100';`

48. **Line 31:115** - ⚠️ Manual review
   - Current: `text-cyan-100`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-cyan-200/80 bg-cyan-50 text-cyan-700 dark:border-cyan-400/18 dark:bg-cyan-400/16 dark:text-cyan-100';`

49. **Line 33:22** - ⚠️ Manual review
   - Current: `border-indigo-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-indigo-200/80 bg-indigo-50 text-indigo-700 dark:border-indigo-400/18 dark:bg-indigo-400/16 dark:text-indigo-100';`

50. **Line 33:43** - ⚠️ Manual review
   - Current: `bg-indigo-50`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-indigo-200/80 bg-indigo-50 text-indigo-700 dark:border-indigo-400/18 dark:bg-indigo-400/16 dark:text-indigo-100';`

51. **Line 33:56** - ⚠️ Manual review
   - Current: `text-indigo-700`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-indigo-200/80 bg-indigo-50 text-indigo-700 dark:border-indigo-400/18 dark:bg-indigo-400/16 dark:text-indigo-100';`

52. **Line 33:77** - ⚠️ Manual review
   - Current: `border-indigo-400`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-indigo-200/80 bg-indigo-50 text-indigo-700 dark:border-indigo-400/18 dark:bg-indigo-400/16 dark:text-indigo-100';`

53. **Line 33:103** - ⚠️ Manual review
   - Current: `bg-indigo-400`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-indigo-200/80 bg-indigo-50 text-indigo-700 dark:border-indigo-400/18 dark:bg-indigo-400/16 dark:text-indigo-100';`

54. **Line 33:125** - ⚠️ Manual review
   - Current: `text-indigo-100`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-indigo-200/80 bg-indigo-50 text-indigo-700 dark:border-indigo-400/18 dark:bg-indigo-400/16 dark:text-indigo-100';`

55. **Line 35:22** - ⚠️ Manual review
   - Current: `border-slate-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-slate-200/80 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200';`

56. **Line 35:42** - ⚠️ Manual review
   - Current: `bg-slate-100`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-slate-200/80 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200';`

57. **Line 35:55** - ⚠️ Manual review
   - Current: `text-slate-700`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-slate-200/80 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200';`

58. **Line 35:117** - ⚠️ Manual review
   - Current: `text-slate-200`
   - Suggested: `MANUAL_REVIEW_NEEDED`
   - Context: `return 'border border-slate-200/80 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200';`

## Migration Guide

### Auto-fixable Issues

Run the following command to automatically fix 178 issues:

```bash
node design-system/scripts/migrate-colors.js --apply
```

### Manual Review Required

76 issues require manual review. These are typically:

- Colors not yet mapped in the design system
- Context-specific colors that need designer input
- Complex color combinations

Please review the issues above and update them manually.
