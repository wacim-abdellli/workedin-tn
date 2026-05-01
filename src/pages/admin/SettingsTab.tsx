import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { adminInsetClass, adminPanelClass, adminPillClass, adminSelectClass } from './adminTheme';
import AdminSelect from './AdminSelect';

export default function SettingsTab() {
    const { language } = useTranslation();
    const tr = (ar: string, en: string, fr?: string) => language === 'ar' ? ar : language === 'fr' ? (fr || en) : en;

    const [autoRefresh, setAutoRefresh] = useState(() => localStorage.getItem('admin_auto_refresh') === '1');
    const [refreshIntervalSec, setRefreshIntervalSec] = useState(() => Number(localStorage.getItem('admin_refresh_interval') || 45));

    useEffect(() => { localStorage.setItem('admin_auto_refresh', autoRefresh ? '1' : '0'); }, [autoRefresh]);
    useEffect(() => { localStorage.setItem('admin_refresh_interval', String(refreshIntervalSec)); }, [refreshIntervalSec]);

    const panelClass = adminPanelClass;
    const selectClass = adminSelectClass;

    return (
        <div className="space-y-6">
            <div className={panelClass}>
                <h3 className="font-bold text-foreground mb-5 flex items-center gap-2"><Settings className="w-5 h-5 text-[var(--color-status-info)]" />{tr('إعدادات لوحة الإدارة', 'Admin dashboard settings', 'Parametres du tableau admin')}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <label className={`flex items-center justify-between p-4 ${adminInsetClass}`}>
                        <span className="text-sm font-medium text-foreground">{tr('التحديث التلقائي', 'Auto refresh', 'Actualisation automatique')}</span>
                        <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="h-5 w-5 accent-cyan-600" />
                    </label>
                    <label className={`flex items-center justify-between p-4 ${adminInsetClass}`}>
                        <span className="text-sm font-medium text-foreground">{tr('فاصل التحديث', 'Refresh interval', 'Intervalle d actualisation')}</span>
                        <AdminSelect
                            value={String(refreshIntervalSec)}
                            onChange={(v) => setRefreshIntervalSec(Number(v))}
                            className="min-w-[140px]"
                            options={[
                                { value: '20', label: `20 ${tr('ثانية', 'seconds', 'secondes')}` },
                                { value: '30', label: `30 ${tr('ثانية', 'seconds', 'secondes')}` },
                                { value: '45', label: `45 ${tr('ثانية', 'seconds', 'secondes')}` },
                                { value: '60', label: `60 ${tr('ثانية', 'seconds', 'secondes')}` },
                            ]}
                        />
                    </label>
                </div>
            </div>
            <div className={panelClass}>
                <h4 className="font-bold text-foreground mb-3">{tr('صحة النظام', 'System health', 'Sante du systeme')}</h4>
                <div className={`flex items-center justify-between p-4 ${adminInsetClass}`}>
                    <span className="text-muted">{tr('حالة المراقبة', 'Monitoring status', 'Etat de supervision')}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${adminPillClass('emerald')}`}>
                        {tr('مستقر', 'Stable', 'Stable')}
                    </span>
                </div>
            </div>
        </div>
    );
}



