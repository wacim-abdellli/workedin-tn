import { Star } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface LiveCounterSectionProps {
    stats: {
        earnings: number;
        jobs: number;
        freelancers: number;
    };
}

export default function LiveCounterSection({ stats }: LiveCounterSectionProps) {
    const { t, language } = useTranslation();
    const animatedEarnings = useAnimatedCounter(stats.earnings, 2500);

    return (
        <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--dash-bg) 0%, color-mix(in srgb, var(--dash-bg) 82%, black) 100%)' }} />
            <div className="absolute inset-0">
                <div className="absolute top-0 start-1/4 w-64 h-64 rounded-full blur-[80px]" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 20%, transparent)' }} />
                <div className="absolute bottom-0 end-1/4 w-64 h-64 rounded-full blur-[80px]" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 18%, transparent)' }} />
            </div>

            <div className="container-custom relative text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-8 backdrop-blur-sm"
                    style={{
                        background: 'rgba(255,255,255,0.06)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.82)',
                    }}>
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    {t.home.stats.live}
                </div>

                <div className="text-6xl md:text-8xl font-bold text-white mb-4 font-cairo">
                    <span style={{
                        background: 'linear-gradient(135deg, var(--workspace-primary) 0%, var(--workspace-primary-mid) 55%, var(--workspace-primary) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        {language === 'ar'
                            ? animatedEarnings.toLocaleString('ar-TN')
                            : animatedEarnings.toLocaleString()}
                    </span>
                </div>
                <p className="text-xl md:text-2xl" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    {t.counter.title}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-8 mt-12 max-w-2xl mx-auto">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">+{stats.jobs}</div>
                        <div className="text-sm" style={{ color: 'rgba(255,255,255,0.68)' }}>{t.home.stats.activeJobs}</div>
                    </div>
                    <div className="text-center border-x border-white/10 border-border">
                        <div className="text-3xl font-bold text-white mb-1">+{stats.freelancers.toLocaleString()}</div>
                        <div className="text-sm" style={{ color: 'rgba(255,255,255,0.68)' }}>{t.home.stats.users}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">4.9</div>
                        <div className="text-sm flex items-center justify-center gap-1" style={{ color: 'rgba(255,255,255,0.68)' }}>
                            <Star className="w-3 h-3 fill-current" style={{ color: 'var(--workspace-primary)' }} />
                            {t.home.stats.rating}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
