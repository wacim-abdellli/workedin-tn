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
            <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-950 to-dark-900" />
            <div className="absolute inset-0">
                <div className="absolute top-0 start-1/4 w-64 h-64 bg-primary-600/20 rounded-full blur-[80px]" />
                <div className="absolute bottom-0 end-1/4 w-64 h-64 bg-accent-500/20 rounded-full blur-[80px]" />
            </div>

            <div className="container-custom relative text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-white/80 text-sm font-medium mb-8 backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    {t.home.stats.live}
                </div>

                <div className="text-6xl md:text-8xl font-bold text-white mb-4 font-cairo">
                    <span className="text-gradient">
                        {language === 'ar'
                            ? animatedEarnings.toLocaleString('ar-TN')
                            : animatedEarnings.toLocaleString()}
                    </span>
                </div>
                <p className="text-xl md:text-2xl text-dark-300">
                    {t.counter.title}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-8 mt-12 max-w-2xl mx-auto">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">+{stats.jobs}</div>
                        <div className="text-sm text-dark-400">{t.home.stats.activeJobs}</div>
                    </div>
                    <div className="text-center border-x border-white/10">
                        <div className="text-3xl font-bold text-white mb-1">+{stats.freelancers.toLocaleString()}</div>
                        <div className="text-sm text-dark-400">{t.home.stats.users}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">4.9</div>
                        <div className="text-sm text-dark-400 flex items-center justify-center gap-1">
                            <Star className="w-3 h-3 text-warning-400 fill-current" />
                            {t.home.stats.rating}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
