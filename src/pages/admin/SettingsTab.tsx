import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function SettingsTab() {
    const { language } = useTranslation();
    const tr = (ar: string, en: string, fr?: string) => language === 'ar' ? ar : language === 'fr' ? (fr || en) : en;

    const [autoRefresh, setAutoRefresh] = useState(() => localStorage.getItem('admin_auto_refresh') === '1');
    const [refreshIntervalSec, setRefreshIntervalSec] = useState(() => Number(localStorage.getItem('admin_refresh_interval') || 45));

    useEffect(() => { localStorage.setItem('admin_auto_refresh', autoRefresh ? '1' : '0'); }, [autoRefresh]);
    useEffect(() => { localStorage.setItem('admin_refresh_interval', String(refreshIntervalSec)); }, [refreshIntervalSec]);

    const panelClass = 'card border-white/45 dark:border-white/10 bg-white/80 dark:bg-slate-950/55 backdrop-blur-xl shadow-[0_16px_45px_-24px_rgba(21,84,247,0.38)]';
    const selectClass = 'h-12 px-4 border rounded-xl bg-white/92 dark:bg-slate-900/70 border-gray-200 dark:border-white/12 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/35 focus:border-primary-400/40';

    return (
        <div className="space-y-6">
            <div className={panelClass}>
                <h3 className="font-bold text-foreground mb-5 flex items-center gap-2"><Settings className="w-5 h-5 text-cyan-500" />{tr('إعدادات لوحة الإدارة', 'Admin dashboard settings', 'Parametres du tableau admin')}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/55">
                        <span className="text-sm font-medium text-foreground">{tr('التحديث التلقائي', 'Auto refresh', 'Actualisation automatique')}</span>
                        <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="h-5 w-5 accent-cyan-600" />
                    </label>
                    <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/55">
                        <span className="text-sm font-medium text-foreground">{tr('فاصل التحديث', 'Refresh interval', 'Intervalle d actualisation')}</span>
                        <select value={refreshIntervalSec} onChange={e => setRefreshIntervalSec(Number(e.target.value))} className={selectClass}>
                            <option value={20}>20 {tr('ثانية', 'seconds', 'secondes')}</option>
                            <option value={30}>30 {tr('ثانية', 'seconds', 'secondes')}</option>
                            <option value={45}>45 {tr('ثانية', 'seconds', 'secondes')}</option>
                            <option value={60}>60 {tr('ثانية', 'seconds', 'secondes')}</option>
                        </select>
                    </label>
                </div>
            </div>
            <div className={panelClass}>
                <h4 className="font-bold text-foreground mb-3">{tr('صحة النظام', 'System health', 'Sante du systeme')}</h4>
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/55">
                    <span className="text-muted">{tr('حالة المراقبة', 'Monitoring status', 'Etat de supervision')}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        {tr('مستقر', 'Stable', 'Stable')}
                    </span>
                </div>
            </div>
        </div>
    );
}
