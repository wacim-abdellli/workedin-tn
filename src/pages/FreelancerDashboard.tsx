import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowUpRight, Bell, Briefcase, Calendar, DollarSign, Eye, FileText, Plus, Send, Sparkles } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Header } from '../components/layout';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import ProfileCompletionCard from '../components/freelancer/ProfileCompletionCard';
import Button from '../components/ui/Button';
import { Skeleton } from '../components/common/SkeletonCard';
import { useAuth } from '../contexts/AuthContext';

const stats = [
  { label: 'Active Contracts', value: '08', change: '+12% this month', icon: Briefcase, tone: 'from-primary-500/20 to-primary-500/5 text-primary-600 dark:text-primary-300' },
  { label: 'Pending Proposals', value: '14', change: '+4 new this week', icon: Send, tone: 'from-amber-400/20 to-amber-400/5 text-amber-600 dark:text-amber-300' },
  { label: 'Total Earnings', value: '24,500 TND', change: '+18% this month', icon: DollarSign, tone: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-300' },
  { label: 'Profile Views', value: '1,284', change: '+23% this month', icon: Eye, tone: 'from-sky-500/20 to-sky-500/5 text-sky-600 dark:text-sky-300' },
];

const chartData = [
  { month: 'Oct', earnings: 1800 },
  { month: 'Nov', earnings: 2600 },
  { month: 'Dec', earnings: 3100 },
  { month: 'Jan', earnings: 4200 },
  { month: 'Feb', earnings: 3900 },
  { month: 'Mar', earnings: 4900 },
];

const activityFeed = [
  { icon: Sparkles, title: 'Proposal accepted', time: '2 hours ago', detail: 'Brand refresh for a DTC skincare client.' },
  { icon: Bell, title: 'New client message', time: '5 hours ago', detail: 'Kickoff notes received for the next sprint.' },
  { icon: Calendar, title: 'Milestone completed', time: 'Yesterday', detail: 'Landing page audit delivered and approved.' },
  { icon: DollarSign, title: 'Payment received', time: '2 days ago', detail: '1,200 TND released from escrow.' },
];

const milestones = [
  { title: 'Product design handoff', due: 'Tomorrow', amount: '850 TND' },
  { title: 'Client review call', due: 'Friday', amount: 'Discovery' },
  { title: 'Escrow release', due: 'Next week', amount: '1,200 TND' },
];

function FreelancerDashboardPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const greeting = useMemo(() => profile?.full_name?.split(' ')[0] || 'there', [profile?.full_name]);

  return (
    <div className="min-h-screen bg-[#f6f3ff] dark:bg-[#0b0a12]">
      <SEO {...SEO_CONFIG.dashboard} url="/freelancer/dashboard" noIndex />
      <Header />

      <main className="container-custom py-8">
        <section className="glass-card overflow-hidden rounded-[32px] p-6 sm:p-8">
          <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
            <aside className="space-y-5">
              <div className="premium-panel rounded-[28px] p-5">
                <p className="text-sm font-medium text-[#6b6880] dark:text-[#8b8aa0]">Welcome back</p>
                <h1 className="mt-2 text-3xl font-bold text-[#1a1825] dark:text-white">{greeting}</h1>
                <p className="mt-3 text-sm leading-relaxed text-[#6b6880] dark:text-[#8b8aa0]">
                  Your freelancer business is looking sharper. Keep the momentum high and the profile polished.
                </p>
              </div>

              <ProfileCompletionCard />

              <div className="premium-panel rounded-[28px] p-5">
                <div className="text-sm font-semibold text-[#1a1825] dark:text-white">Quick actions</div>
                <div className="mt-4 space-y-3">
                  <Button className="w-full justify-start" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate('/jobs')}>
                    Browse premium jobs
                  </Button>
                  <Button variant="outline" className="w-full justify-start" leftIcon={<FileText className="h-4 w-4" />} onClick={() => navigate('/settings')}>
                    Refine profile settings
                  </Button>
                  <button
                    onClick={() => signOut()}
                    className="w-full rounded-2xl border border-red-200 px-4 py-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </aside>

            <section className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((item) => (
                  <div key={item.label} className="premium-panel rounded-[28px] p-5">
                    {loading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-11 w-11 rounded-2xl" />
                        <Skeleton className="h-8 w-28" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ) : (
                      <>
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tone}`}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="mt-5 text-3xl font-bold text-[#1a1825] dark:text-white">{item.value}</div>
                        <div className="mt-1 text-sm font-medium text-[#4e4a63] dark:text-[#aba9bc]">{item.label}</div>
                        <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          {item.change}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="premium-panel rounded-[30px] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#1a1825] dark:text-white">Earnings trajectory</h2>
                    <p className="mt-2 text-sm text-[#6b6880] dark:text-[#8b8aa0]">Last 6 months of billed work, released escrow, and completed milestones.</p>
                  </div>
                  <div className="rounded-2xl border border-primary-100 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 dark:border-white/8 dark:bg-white/5 dark:text-primary-200">
                    6 month trend
                  </div>
                </div>

                <div className="mt-6 h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.12)" vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#8b8aa0', fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8b8aa0', fontSize: 12 }} tickFormatter={(value) => `${value} TND`} width={72} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 18,
                          border: '1px solid rgba(139, 92, 246, 0.14)',
                          background: 'rgba(17, 14, 28, 0.92)',
                          color: '#fff',
                        }}
                        formatter={(value) => [`${Number(value ?? 0).toLocaleString()} TND`, 'Earnings']}
                      />
                      <Area type="monotone" dataKey="earnings" stroke="#8b5cf6" strokeWidth={3} fill="url(#earningsFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="premium-panel rounded-[30px] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-white/5 dark:text-primary-300">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#1a1825] dark:text-white">Recent activity</h2>
                    <p className="text-sm text-[#6b6880] dark:text-[#8b8aa0]">A clean timeline of the work that keeps revenue moving.</p>
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {activityFeed.map((item, index) => (
                    <div key={item.title} className="relative flex gap-4">
                      {index !== activityFeed.length - 1 ? <div className="absolute left-[18px] top-11 h-[calc(100%-1rem)] w-px bg-primary-100 dark:bg-white/10" /> : null}
                      <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-white/5 dark:text-primary-300">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-[#1a1825] dark:text-white">{item.title}</div>
                        <div className="mt-1 text-sm text-[#4e4a63] dark:text-[#aba9bc]">{item.detail}</div>
                        <div className="mt-1 text-xs font-medium text-[#8b8aa0]">{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="premium-panel rounded-[28px] p-5">
                <div className="text-sm font-semibold text-[#1a1825] dark:text-white">Upcoming milestones</div>
                <div className="mt-4 space-y-3">
                  {milestones.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-primary-100/80 bg-white/80 p-4 dark:border-white/8 dark:bg-white/5">
                      <div className="font-semibold text-[#1a1825] dark:text-white">{item.title}</div>
                      <div className="mt-1 text-sm text-[#6b6880] dark:text-[#8b8aa0]">{item.due}</div>
                      <div className="mt-3 text-sm font-semibold text-primary-600 dark:text-primary-300">{item.amount}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="premium-panel rounded-[28px] p-5">
                <div className="text-sm font-semibold text-[#1a1825] dark:text-white">Notifications</div>
                <div className="mt-4 space-y-3">
                  {[
                    'Client approved your last delivery.',
                    'Profile views increased 23% after the redesign.',
                    'Two saved jobs match your current skills.',
                  ].map((note) => (
                    <div key={note} className="flex gap-3 rounded-2xl bg-white/75 p-4 dark:bg-white/5">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary-500" />
                      <p className="text-sm leading-relaxed text-[#4e4a63] dark:text-[#aba9bc]">{note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

export default FreelancerDashboardPage;
