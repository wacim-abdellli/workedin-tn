import { Building2, Globe, Users, Target, MessageCircle, ShieldCheck, FileText } from 'lucide-react';
import { useTranslation } from '@/i18n';
import Input from '@/components/ui/Input';
import CustomSelect from '@/components/ui/CustomSelect';
import { INDUSTRY_OPTIONS } from '@/lib/constants/profileOptions';

/** Safely extract a plain string from a jsonb preference field */
export function extractPrefText(value: Record<string, unknown> | string | null | undefined): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return typeof value.description === 'string' ? value.description : '';
}

/** Merge user text back into existing jsonb without nuking hidden keys */
export function mergePrefText(
    existing: Record<string, unknown> | string | null | undefined,
    text: string
): Record<string, unknown> {
    const base = existing && typeof existing === 'object' && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {};
    return { ...base, description: text };
}

export interface ClientFormData {
    company_name: string;
    company_website: string;
    company_industry: string;
    company_size: string;
    company_role: string;
    hiring_needs: string;
    project_budget_preference: string;
    project_timeline_preference: string;
    communication_preferences: string;
    screening_preferences: string;
    legal_preferences: string;
}

interface ClientInfoFormProps {
    form: ClientFormData;
    onChange: (next: ClientFormData) => void;
}

export function buildClientInitialForm(
    profile: ReturnType<typeof import('@/contexts/AuthContext').useAuth>['profile']
): ClientFormData {
    return {
        company_name: profile?.company_name || '',
        company_website: profile?.company_website || '',
        company_industry: profile?.company_industry || '',
        company_size: profile?.company_size || '1-10',
        company_role: profile?.company_role || '',
        hiring_needs: profile?.hiring_needs?.join(', ') || '',
        project_budget_preference: profile?.project_budget_preference || 'flexible',
        project_timeline_preference: profile?.project_timeline_preference || 'flexible',
        communication_preferences: extractPrefText(profile?.communication_preferences as Record<string,unknown>),
        screening_preferences: extractPrefText(profile?.screening_preferences as Record<string,unknown>),
        legal_preferences: extractPrefText(profile?.legal_preferences as Record<string,unknown>),
    };
}

export function ClientInfoForm({ form, onChange }: ClientInfoFormProps) {
    const { tx } = useTranslation();
    const set = (patch: Partial<ClientFormData>) => onChange({ ...form, ...patch });

    const COMPANY_SIZE_OPTIONS = [
        { value: '1', label: 'Just me' },
        { value: '1-10', label: '1–10 employees' },
        { value: '11-50', label: '11–50 employees' },
        { value: '51-200', label: '51–200 employees' },
        { value: '201+', label: '201+ employees' },
    ];

    const BUDGET_OPTIONS = [
        { value: 'fixed', label: 'Fixed price' },
        { value: 'hourly', label: 'Hourly rate' },
        { value: 'flexible', label: 'Flexible / Depends on project' },
    ];

    const TIMELINE_OPTIONS = [
        { value: 'asap', label: 'As soon as possible' },
        { value: '1_to_3_months', label: '1 to 3 months' },
        { value: '3_to_6_months', label: '3 to 6 months' },
        { value: 'flexible', label: 'Flexible' },
    ];

    return (
        <div className="space-y-5">
            <div id="field-company" className="grid grid-cols-1 md:grid-cols-2 gap-5 transition-all duration-300 rounded-xl p-1">
                <Input
                    label={tx('profile.companyName', undefined, 'Company name')}
                    value={form.company_name}
                    onChange={e => set({ company_name: e.target.value })}
                    placeholder="e.g. WorkedIn Inc."
                    leftIcon={<Building2 className="w-4 h-4" />}
                />
                <Input
                    label={tx('profile.companyWebsite', undefined, 'Website')}
                    type="url"
                    value={form.company_website}
                    onChange={e => set({ company_website: e.target.value })}
                    placeholder="https://example.com"
                    leftIcon={<Globe className="w-4 h-4" />}
                />
                <div className="relative" style={{ zIndex: 50 }}>
                    <CustomSelect
                        name="company_industry"
                        label={tx('profile.companyIndustry', undefined, 'Industry')}
                        options={INDUSTRY_OPTIONS.map(i => ({ value: i, label: i }))}
                        variant="client"
                        value={form.company_industry}
                        onChange={value => set({ company_industry: value })}
                        placeholder="Select industry"
                    />
                </div>
                <div className="relative" style={{ zIndex: 40 }}>
                    <CustomSelect
                        name="company_size"
                        label={tx('profile.companySize', undefined, 'Company size')}
                        options={COMPANY_SIZE_OPTIONS}
                        variant="client"
                        value={form.company_size}
                        onChange={value => set({ company_size: value })}
                    />
                </div>
                <Input
                    label={tx('profile.companyRole', undefined, 'Your role')}
                    value={form.company_role}
                    onChange={e => set({ company_role: e.target.value })}
                    placeholder="e.g. Hiring Manager, CEO"
                    leftIcon={<Users className="w-4 h-4" />}
                />
                <Input
                    label={tx('profile.hiringNeeds', undefined, 'Hiring needs (comma separated)')}
                    value={form.hiring_needs}
                    onChange={e => set({ hiring_needs: e.target.value })}
                    placeholder="e.g. Designers, Developers"
                    leftIcon={<Target className="w-4 h-4" />}
                />
                <div className="relative" style={{ zIndex: 30 }}>
                    <CustomSelect
                        name="project_budget_preference"
                        label={tx('profile.budgetPreference', undefined, 'Default budget preference')}
                        options={BUDGET_OPTIONS}
                        variant="client"
                        value={form.project_budget_preference}
                        onChange={value => set({ project_budget_preference: value })}
                    />
                </div>
                <div className="relative" style={{ zIndex: 20 }}>
                    <CustomSelect
                        name="project_timeline_preference"
                        label={tx('profile.timelinePreference', undefined, 'Default timeline preference')}
                        options={TIMELINE_OPTIONS}
                        variant="client"
                        value={form.project_timeline_preference}
                        onChange={value => set({ project_timeline_preference: value })}
                    />
                </div>
            </div>

            <div id="field-preferences" className="space-y-5 transition-all duration-300 rounded-xl p-1">
                <Input
                    as="textarea"
                    rows={3}
                    label={tx('profile.communicationPreferences', undefined, 'Communication preferences')}
                    value={form.communication_preferences}
                    onChange={e => set({ communication_preferences: e.target.value })}
                    placeholder="e.g. Prefer Slack or email, weekly updates expected..."
                    leftIcon={<MessageCircle className="w-4 h-4" />}
                />
                <Input
                    as="textarea"
                    rows={3}
                    label={tx('profile.screeningPreferences', undefined, 'Screening preferences')}
                    value={form.screening_preferences}
                    onChange={e => set({ screening_preferences: e.target.value })}
                    placeholder="e.g. Portfolio required, technical test expected..."
                    leftIcon={<ShieldCheck className="w-4 h-4" />}
                />
                <Input
                    as="textarea"
                    rows={3}
                    label={tx('profile.legalPreferences', undefined, 'Legal preferences')}
                    value={form.legal_preferences}
                    onChange={e => set({ legal_preferences: e.target.value })}
                    placeholder="e.g. NDA required before starting..."
                    leftIcon={<FileText className="w-4 h-4" />}
                />
            </div>
        </div>
    );
}
