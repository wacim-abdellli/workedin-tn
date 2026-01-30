import { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/i18n';
import OptimizedImage from '@/components/common/OptimizedImage';

export default function TestimonialsSection() {
    const { t, dir } = useTranslation();
    const testimonials = t.testimonials.items;
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
    const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

    const nextTestimonial = () => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    };

    const prevTestimonial = () => {
        setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

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
                    <div className="card p-8 md:p-12 relative overflow-hidden">
                        {/* Decorative */}
                        <div className="absolute top-0 start-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent rounded-br-full" />

                        {/* Navigation */}
                        <button
                            onClick={prevTestimonial}
                            className="absolute start-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 flex items-center justify-center transition-all shadow-lg"
                        >
                            <PrevIcon className="w-6 h-6" />
                        </button>
                        <button
                            onClick={nextTestimonial}
                            className="absolute end-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-dark-100 dark:bg-dark-800 hover:bg-dark-200 dark:hover:bg-dark-700 flex items-center justify-center transition-all shadow-lg"
                        >
                            <NextIcon className="w-6 h-6" />
                        </button>

                        <div className="text-center px-12">
                            <div className="w-24 h-24 mx-auto mb-6">
                                <OptimizedImage
                                    src={testimonials[currentTestimonial].image}
                                    alt={testimonials[currentTestimonial].name}
                                    className="w-full h-full rounded-2xl ring-4 ring-primary-100 dark:ring-primary-900/50 shadow-xl"
                                    imgClassName="object-cover"
                                />
                            </div>

                            <div className="flex items-center justify-center gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-6 h-6 text-warning-400 fill-current" />
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
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400 font-semibold">
                                <TrendingUp className="w-4 h-4" />
                                {t.home.sections.testimonials.earned} {testimonials[currentTestimonial].earned} {t.common.tnd}
                            </div>
                        </div>

                        {/* Dots */}
                        <div className="flex items-center justify-center gap-2 mt-10">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentTestimonial(index)}
                                    className={`h-2 rounded-full transition-all duration-300 ${index === currentTestimonial
                                        ? 'w-8 bg-gradient-to-r from-primary-500 to-primary-700'
                                        : 'w-2 bg-dark-200 dark:bg-dark-700 hover:bg-dark-300'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
