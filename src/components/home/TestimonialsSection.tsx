import { useState, useEffect, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/i18n';
import OptimizedImage from '@/components/common/OptimizedImage';

export default function TestimonialsSection() {
    const { t, dir } = useTranslation();
    const testimonials = t.testimonials.items;
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);

    const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
    const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

    const changeTestimonial = useCallback((nextIndex: number) => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentTestimonial(nextIndex);
            setIsTransitioning(false);
        }, 220); // transition fade-out duration
    }, [testimonials.length]);

    const nextTestimonial = useCallback(() => {
        changeTestimonial((currentTestimonial + 1) % testimonials.length);
    }, [currentTestimonial, changeTestimonial, testimonials.length]);

    const prevTestimonial = useCallback(() => {
        changeTestimonial((currentTestimonial - 1 + testimonials.length) % testimonials.length);
    }, [currentTestimonial, changeTestimonial, testimonials.length]);

    // Autoplay effect
    useEffect(() => {
        if (isAutoplayPaused) return;
        const interval = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
                setIsTransitioning(false);
            }, 220);
        }, 6000);
        return () => clearInterval(interval);
    }, [currentTestimonial, isAutoplayPaused, testimonials.length]);

    return (
        <section className="section">
            <div className="container-custom">
                <div className="text-center mb-12">
                    <span className="badge-success mb-4">{t.home.sections.testimonials.badge}</span>
                    <h2 className="heading-lg">
                        {t.testimonials.title}
                    </h2>
                </div>

                <div className="max-w-4xl mx-auto">
                    <div 
                        onMouseEnter={() => setIsAutoplayPaused(true)}
                        onMouseLeave={() => setIsAutoplayPaused(false)}
                        className="p-8 md:p-12 relative overflow-hidden rounded-[2rem] border" 
                        style={{ background: 'var(--card-bg)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-lg)' }}
                    >
                        {/* Decorative */}
                        <div className="absolute top-0 start-0 w-32 h-32 rounded-br-full" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--workspace-primary) 14%, transparent), transparent)' }} />

                        {/* Navigation */}
                        <button
                            onClick={prevTestimonial}
                            className="absolute start-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg z-10 hover:scale-110 hover:bg-[var(--workspace-primary)] hover:text-white active:scale-95 duration-200"
                            style={{ background: 'var(--surface-bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                        >
                            <PrevIcon className="w-6 h-6" />
                        </button>
                        <button
                            onClick={nextTestimonial}
                            className="absolute end-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg z-10 hover:scale-110 hover:bg-[var(--workspace-primary)] hover:text-white active:scale-95 duration-200"
                            style={{ background: 'var(--surface-bg)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                        >
                            <NextIcon className="w-6 h-6" />
                        </button>

                        <div className={`text-center px-12 transition-all duration-300 transform ${
                            isTransitioning 
                                ? 'opacity-0 scale-[0.98] translate-y-1' 
                                : 'opacity-100 scale-100 translate-y-0'
                        }`}>
                            <div className="w-24 h-24 mx-auto mb-6">
                                <OptimizedImage
                                    src={testimonials[currentTestimonial].image}
                                    alt={testimonials[currentTestimonial].name}
                                    className="w-full h-full rounded-2xl shadow-xl"
                                    style={{ boxShadow: '0 0 0 4px color-mix(in srgb, var(--workspace-primary) 14%, transparent), var(--shadow-lg)' }}
                                    imgClassName="object-cover"
                                />
                            </div>

                            <div className="flex items-center justify-center gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-6 h-6 fill-current" style={{ color: 'var(--workspace-primary)' }} />
                                ))}
                            </div>

                            <blockquote className="text-xl md:text-2xl mb-8 leading-relaxed">
                                "{testimonials[currentTestimonial].quote}"
                            </blockquote>

                            <div className="font-bold text-lg mb-1">
                                {testimonials[currentTestimonial].name}
                            </div>
                            <div className="text-muted mb-3">
                                {testimonials[currentTestimonial].role}
                            </div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold" style={{ background: 'color-mix(in srgb, var(--workspace-primary) 12%, transparent)', color: 'var(--workspace-primary)' }}>
                                <TrendingUp className="w-4 h-4" />
                                {t.home.sections.testimonials.earned} {testimonials[currentTestimonial].earned} {t.common.tnd}
                            </div>
                        </div>

                        {/* Dots */}
                        <div className="flex items-center justify-center gap-2 mt-10">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => changeTestimonial(index)}
                                    className={`h-2 rounded-full transition-all duration-300 ${index === currentTestimonial
                                        ? 'w-8'
                                        : 'w-2'
                                        }`}
                                    style={index === currentTestimonial
                                        ? { background: 'linear-gradient(135deg, var(--workspace-primary), var(--workspace-primary-mid))' }
                                        : { background: 'color-mix(in srgb, var(--text-muted) 32%, transparent)' }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
