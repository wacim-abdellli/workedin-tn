 import { AlertTriangle, ShieldAlert, Mail, User, MessageSquare, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@/i18n';
import { useToast } from '@/components/ui/Toast';

type AccountStatus = 'suspended' | 'archived';

const COPY: Record<
  AccountStatus,
  {
    titleKey: string;
    titleFallback: string;
    bodyKey: string;
    bodyFallback: string;
    icon: typeof ShieldAlert;
  }
> = {
  suspended: {
    titleKey: 'accountStatus.suspended.title',
    titleFallback: 'Account suspended',
    bodyKey: 'accountStatus.suspended.body',
    bodyFallback:
      'Your account access is temporarily suspended. Contact support if you need help or think this is a mistake.',
    icon: ShieldAlert,
  },
  archived: {
    titleKey: 'accountStatus.archived.title',
    titleFallback: 'Account archived',
    bodyKey: 'accountStatus.archived.body',
    bodyFallback:
      'This account is archived and can no longer access protected platform features. Contact support for assistance.',
    icon: AlertTriangle,
  },
};

export default function AccountStatusGate({ status }: { status: AccountStatus }) {
  const { tx } = useTranslation();
  const { showToast } = useToast();
  const copy = COPY[status];
  const Icon = copy.icon;
  const headingId = `account-status-${status}-title`;
  
  const [showContactForm, setShowContactForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      showToast(tx('support.errors.requiredFields', undefined, 'Please fill in all required fields'), 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showToast(tx('support.success.sent', undefined, 'Your message has been sent successfully. We will get back to you soon.'), 'success');
      setShowContactForm(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (_error) {
      showToast(tx('support.errors.sendFailed', undefined, 'Failed to send message. Please try again or email us directly at support@workedin.tn'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <main
        aria-labelledby={headingId}
        className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.12),_transparent_28%),linear-gradient(180deg,_#0a0f1a_0%,_#0f172a_100%)] px-4 py-10 text-white"
      >
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-[0_28px_80px_-36px_rgba(2,6,23,0.95)] backdrop-blur-xl sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
              <Icon className="h-8 w-8" />
            </div>
            <h1 id={headingId} className="mt-6 text-3xl font-semibold tracking-tight text-white">
              {tx(copy.titleKey, undefined, copy.titleFallback)}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {tx(copy.bodyKey, undefined, copy.bodyFallback)}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] px-5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
              >
                {tx('common.returnHome', undefined, 'Return home')}
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowContactForm(true);
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 shadow-lg shadow-violet-600/30"
              >
                {tx('common.contactSupport', undefined, 'Contact support')}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Contact Form Modal - Using Portal to render at document body */}
      {showContactForm && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            setShowContactForm(false);
          }}
        >
          <div 
            className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{tx('common.contactSupport', undefined, 'Contact Support')}</h2>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowContactForm(false);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={tx('common.close', undefined, 'Close')}
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {tx('support.form.description', undefined, 'Fill out the form below and our support team will get back to you as soon as possible.')}
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tx('support.form.fullName', undefined, 'Full Name')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={tx('support.form.fullNamePlaceholder', undefined, 'Enter your full name')}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tx('support.form.emailAddress', undefined, 'Email Address')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tx('support.form.subject', undefined, 'Subject')}
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder={tx('support.form.subjectPlaceholder', undefined, 'Brief description of your issue')}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e293b] text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tx('support.form.message', undefined, 'Message')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={tx('support.form.messagePlaceholder', undefined, 'Please describe your issue in detail...')}
                  rows={6}
                  required
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1e293b] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowContactForm(false);
                  }}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {tx('common.cancel', undefined, 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-violet-600/30"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {tx('support.form.sending', undefined, 'Sending...')}
                    </>
                  ) : (
                    <>
                      {tx('support.form.sendMessage', undefined, 'Send Message')}
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
