new_return = r'''  return (
    <div className="page-enter min-h-screen bg-[#0a0a0f] transition-colors duration-300">
      <SEO
        title={job ? `${job.title} | ${t.seo.jobDetail.titleSuffix}` : t.seo.jobDetail.titleSuffix}
        description={job?.description?.slice(0, 160) || t.seo.jobDetail.descriptionFallback}
      />
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-white/40 mb-7">
          <Link to="/" className="hover:text-white/70 transition-colors">{t.nav.home}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/jobs" className="hover:text-white/70 transition-colors">{t.nav.jobs}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-white/60">
            {t.jobDetail.category[CATEGORY_LABELS[job.category] as keyof typeof t.jobDetail.category] || job.category}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Hero Header Card */}
            <div
              className="relative overflow-hidden rounded-2xl border border-white/8"
              style={{
                background: 'linear-gradient(145deg,#141420 0%,#0f0f1a 60%,#0c0c16 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.04),0 24px 60px -20px rgba(0,0,0,0.6)',
              }}
            >
              <div
                className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full opacity-20 blur-3xl"
                style={{ background: 'var(--workspace-primary,#8b5cf6)' }}
              />
              <div className="relative p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight break-words [overflow-wrap:anywhere]">
                    {job.title}
                  </h1>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={toggleSave}
                      className={cn(
                        'group flex h-9 w-9 items-center justify-center rounded-xl border transition-all',
                        isSaved
                          ? 'border-rose-500/40 bg-rose-500/10'
                          : 'border-white/10 bg-white/5 hover:border-rose-500/40 hover:bg-rose-500/10',
                      )}
                      title={isSaved ? tx('jobDetail.removeFromSaves', undefined, 'Remove from saves') : tx('jobDetail.saveJob', undefined, 'Save this job')}
                    >
                      <Heart className={cn('w-4 h-4 transition-colors', isSaved ? 'fill-rose-400 text-rose-400' : 'text-white/50 group-hover:text-rose-400')} />
                    </button>
                    <button
                      onClick={shareJob}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition-all hover:border-white/20 hover:text-white"
                      title={tx('jobDetail.shareJob', undefined, 'Share this job')}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-white/45 mb-5">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{tx('jobDetail.postedLabel', undefined, 'Posted')} {timeAgo(job.posted_at, tx)}</span>
                  <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{job.proposals_count} {t.jobDetail.proposals}</span>
                  <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{job.views_count} {t.jobDetail.views}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-white/8">
                  <span
                    className="inline-flex items-center rounded-full px-3.5 py-1 text-xs font-semibold"
                    style={{
                      background: job.job_type === 'fixed_price' ? 'rgba(59,130,246,0.12)' : 'rgba(16,185,129,0.12)',
                      color: job.job_type === 'fixed_price' ? '#60a5fa' : '#34d399',
                      border: `1px solid ${job.job_type === 'fixed_price' ? 'rgba(59,130,246,0.25)' : 'rgba(16,185,129,0.25)'}`,
                    }}
                  >
                    {job.job_type === 'fixed_price' ? t.jobDetail.fixedPrice : t.jobDetail.hourly}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-semibold text-white/70 capitalize">
                    {t.jobDetail.experience[EXPERIENCE_LABELS[job.experience_level] as keyof typeof t.jobDetail.experience] || job.experience_level}
                  </span>
                  {job.duration && (
                    <span
                      className="inline-flex items-center rounded-full px-3.5 py-1 text-xs font-semibold"
                      style={{
                        background: 'var(--workspace-primary-dim,rgba(139,92,246,0.12))',
                        color: 'var(--workspace-primary,#8b5cf6)',
                        border: '1px solid color-mix(in srgb,var(--workspace-primary,#8b5cf6) 28%,transparent)',
                      }}
                    >
                      {(() => {
                        const durationKeyMap: Record<string, string> = {
                          less_than_1_month: 'jobs.new.stepBudget.durationLessThan1Month',
                          '1_3_months': 'jobs.new.stepBudget.duration1To3Months',
                          '3_6_months': 'jobs.new.stepBudget.duration3To6Months',
                          more_than_6_months: 'jobs.new.stepBudget.durationMoreThan6Months',
                        };
                        const k = durationKeyMap[job.duration!];
                        return k ? tx(k, undefined, job.duration) : job.duration;
                      })()}
                    </span>
                  )}
                </div>

                {/* Budget */}
                <div
                  className="rounded-xl p-4 flex items-center gap-4"
                  style={{
                    background: 'linear-gradient(135deg,color-mix(in srgb,var(--workspace-primary,#8b5cf6) 10%,transparent) 0%,rgba(255,255,255,0.02) 100%)',
                    border: '1px solid color-mix(in srgb,var(--workspace-primary,#8b5cf6) 22%,transparent)',
                  }}
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black"
                    style={{
                      background: 'color-mix(in srgb,var(--workspace-primary,#8b5cf6) 20%,transparent)',
                      color: 'var(--workspace-primary,#8b5cf6)',
                    }}
                  >
                    TND
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-0.5">{t.jobDetail.budget}</p>
                    <p className="text-2xl font-black text-white leading-none">
                      {job.job_type === 'fixed_price' ? (
                        job.budget_min === job.budget_max || !job.budget_max
                          ? `${job.budget_min} ${tx('common.currency', undefined, 'TND')}`
                          : `${job.budget_min} – ${job.budget_max} ${tx('common.currency', undefined, 'TND')}`
                      ) : (
                        <>
                          {job.hourly_rate} {tx('common.currency', undefined, 'TND')}
                          <span className="text-sm font-normal text-white/50 ms-1">{t.jobDetail.perHour}</span>
                        </>
                      )}
                    </p>
                    {job.job_type === 'hourly' && job.estimated_hours && (
                      <p className="text-xs text-white/40 mt-0.5">{t.jobDetail.approxHours.replace('{{count}}', String(job.estimated_hours))}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-2xl border border-white/8 p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.025)' }}>
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 opacity-60" />
                {t.jobDetail.description}
              </h2>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-white/70 leading-7">
                {job.description}
              </div>
            </div>

            {/* Skills */}
            {job.required_skills && job.required_skills.length > 0 && (
              <div className="rounded-2xl border border-white/8 p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.025)' }}>
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 opacity-60" />
                  {t.jobDetail.requiredSkills}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.map((skill, index) => {
                    const skillLabel = getSkillLabel(skill);
                    const isMatch = freelancerProfile?.skills?.some((s) =>
                      'name_ar' in s
                        ? s.name_ar === skillLabel || s.name_en === skillLabel || s.name_fr === skillLabel
                        : s.name === skillLabel,
                    );
                    return (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 break-words [overflow-wrap:anywhere] px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors"
                        style={
                          isMatch
                            ? { background: 'rgba(16,185,129,0.12)', color: '#34d399', borderColor: 'rgba(16,185,129,0.28)' }
                            : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)' }
                        }
                      >
                        {isMatch && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                        {skillLabel}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Attachments */}
            {job.attachments && job.attachments.length > 0 && (
              <div className="rounded-2xl border border-white/8 p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.025)' }}>
                <h2 className="text-base font-bold text-white mb-4">{t.jobDetail.attachments}</h2>
                <div className="space-y-2">
                  {job.attachments.map((url, index) => {
                    const filename = url.split('/').pop() || t.jobDetail.file.replace('{{index}}', String(index + 1));
                    return (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3.5 rounded-xl border border-white/8 bg-white/4 hover:bg-white/8 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="text-sm text-white/80 group-hover:text-white transition-colors">{filename}</span>
                        </div>
                        <Download className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Similar Jobs */}
            {similarJobs.length > 0 && (
              <div className="rounded-2xl border border-white/8 p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.025)' }}>
                <h2 className="text-base font-bold text-white mb-4">{tx('jobDetail.similarJobs', undefined, 'Similar jobs')}</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {similarJobs.map((j) => (
                    <SimilarJobCard key={j.id} job={j} onClick={() => navigate(`/jobs/${j.id}`)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-[300px] shrink-0 space-y-4 lg:sticky lg:top-24 lg:self-start">

            {/* Action Card */}
            <div
              className="rounded-2xl border border-white/8 p-5 space-y-4"
              style={{
                background: 'linear-gradient(145deg,#141420 0%,#0f0f1a 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.04)',
              }}
            >
              {myProposal ? (
                <div className="text-center py-2">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-emerald-500/15">
                    <CheckCircle className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h3 className="font-bold text-white text-base mb-1">{tx('jobDetail.proposalSubmitted', undefined, 'Proposal submitted!')}</h3>
                  <p className="text-sm text-white/50 mb-4">{tx('jobDetail.yourBid', undefined, 'Your bid:')} {myProposal.bid_amount} {tx('common.currency', undefined, 'TND')}</p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full rounded-xl" onClick={() => navigate(ROUTES.myProposals)}>
                      {tx('jobDetail.viewProposal', undefined, 'View proposal')}
                    </Button>
                    <Button variant="ghost" className="w-full rounded-xl text-rose-400 hover:text-rose-300" onClick={withdrawProposal}>
                      {tx('jobDetail.withdrawProposal', undefined, 'Withdraw proposal')}
                    </Button>
                  </div>
                </div>
              ) : user?.id === job.client_id ? (
                <div className="text-center py-2">
                  <p className="text-sm text-white/50 mb-3">{tx('jobDetail.yourJob', undefined, 'This is your job')}</p>
                  <Button variant="primary" className="w-full rounded-xl" onClick={() => navigate(getClientJobProposalsRoute(job.id))}>
                    {tx('jobDetail.manageJob', undefined, 'Manage job')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={openProposalFlow}
                    disabled={!canSubmitToday}
                    className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-2xl font-bold text-white text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg,var(--workspace-primary,#8b5cf6) 0%,color-mix(in srgb,var(--workspace-primary,#8b5cf6) 70%,#6d28d9) 100%)',
                      boxShadow: '0 10px 30px -15px color-mix(in srgb,var(--workspace-primary,#8b5cf6) 60%,transparent)',
                    }}
                  >
                    <Send className="w-4 h-4" />
                    {tx('jobDetail.submitProposal', undefined, 'Submit Proposal')}
                  </button>

                  {freelancerProfile && (
                    <div
                      className="rounded-xl p-4"
                      style={{
                        background: canSubmitToday ? 'rgba(59,130,246,0.07)' : 'rgba(239,68,68,0.07)',
                        border: `1px solid ${canSubmitToday ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs font-semibold text-white/80">{tx('jobDetail.dailyApplyLimitTitle', undefined, 'Daily application limit')}</p>
                          <p className="text-[11px] text-white/40 mt-0.5">
                            {canSubmitToday
                              ? tx('jobDetail.dailyApplyRemainingHint', { remaining: dailyProposalUsage.remaining }, `${dailyProposalUsage.remaining} remaining today`)
                              : tx('jobDetail.dailyApplyResetHint', undefined, 'Resets tomorrow')}
                          </p>
                        </div>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                          style={{
                            background: canSubmitToday ? 'rgba(59,130,246,0.18)' : 'rgba(239,68,68,0.18)',
                            color: canSubmitToday ? '#60a5fa' : '#f87171',
                          }}
                        >
                          {canSubmitToday ? tx('jobDetail.dailyApplyAvailable', undefined, 'Available today') : tx('jobDetail.dailyApplyReached', undefined, 'Limit reached')}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: tx('jobDetail.used', undefined, 'Used'), value: dailyProposalUsage.used },
                          { label: tx('jobDetail.limit', undefined, 'Limit'), value: dailyProposalUsage.limit },
                          { label: tx('jobDetail.remaining', undefined, 'Left'), value: dailyProposalUsage.remaining },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded-lg p-2.5 bg-black/20 border border-white/6">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/35 mb-1">{label}</p>
                            <p className="text-lg font-black text-white">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Client Info */}
            <ClientInfoSidebar
              clientName={job.client?.full_name || t.jobDetail.defaultClient}
              location={job.client?.location ? localizeGovernorate(job.client.location, language) : 'Tunis'}
              avatarUrl={job.client?.avatar_url || null}
              ratingText={clientStats.rating > 0 ? `${clientStats.rating.toFixed(1)} of 5 reviews` : '4.8 of 5 reviews'}
              jobsPosted={clientStats.totalJobs > 0 ? `${clientStats.totalJobs}` : '15'}
              hireRate="75%"
              totalSpent={clientStats.totalSpent > 0 ? `${clientStats.totalSpent.toLocaleString()} TND` : '15k+ TND'}
              avgHourlyPaid="45 TND/hr"
              paymentVerified
              phoneVerified={false}
              emailVerified={false}
              memberSince={job.client?.created_at ? new Date(job.client.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Mar 2026'}
            />

            {/* Job Stats */}
            <div className="rounded-2xl border border-white/8 p-5" style={{ background: 'rgba(255,255,255,0.025)' }}>
              <h3 className="text-sm font-bold text-white/80 mb-3">{tx('jobDetail.jobStats', undefined, 'Job Stats')}</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/45 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{tx('jobDetail.proposals', undefined, 'Proposals')}</span>
                  <span className="font-semibold text-white">{job.proposals_count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/45 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{tx('jobDetail.views', undefined, 'Views')}</span>
                  <span className="font-semibold text-white">{job.views_count}</span>
                </div>
                {job.deadline && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/45 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{tx('jobDetail.deadline', undefined, 'Deadline')}</span>
                    <span className="font-semibold text-white">
                      {new Date(job.deadline).toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Report */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="w-full text-center text-xs font-medium flex items-center justify-center gap-1.5 py-2 text-white/25 hover:text-rose-400/70 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              {tx('jobDetail.reportJob', undefined, 'Report This Job')}
            </button>
          </div>
        </div>
      </div>

      {!user ? <Footer /> : null}

      {/* Mobile sticky CTA */}
      {!myProposal && user?.id !== job.client_id && applyDecision.allowed && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 lg:hidden px-4 pt-3"
          style={{
            background: 'rgba(10,10,15,0.88)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            paddingBottom: 'max(env(safe-area-inset-bottom),1rem)',
          }}
        >
          <button
            onClick={openProposalFlow}
            className="w-full h-12 rounded-2xl font-bold text-white text-sm transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,var(--workspace-primary,#8b5cf6) 0%,color-mix(in srgb,var(--workspace-primary,#8b5cf6) 70%,#6d28d9) 100%)' }}
          >
            {tx('jobDetail.submitProposal', undefined, 'Submit Proposal')}
          </button>
        </div>
      )}

      {job && (
        <ProposalModal
          isOpen={showProposalModal}
          onClose={() => setShowProposalModal(false)}
          job={job}
          onSubmit={submitProposal}
          isSubmitting={submitProposalMutation.isPending}
        />
      )}

      <Modal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} title={tx('jobDetail.confirmWithdrawal', undefined, 'Confirm Withdrawal')} size="md">
        <div className="space-y-6 pt-4">
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {tx('jobDetail.withdrawConfirmDesc', undefined, 'Are you sure you want to withdraw this proposal? This action cannot be undone.')}
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsWithdrawModalOpen(false)}>{tx('common.cancel', undefined, 'Cancel')}</Button>
            <Button variant="danger" onClick={confirmWithdrawProposal} isLoading={withdrawProposalMutation.isPending}>
              {tx('jobDetail.yesWithdraw', undefined, 'Yes, Withdraw')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title={tx('jobDetail.reportJobTitle', undefined, 'Report Job')} size="sm">
        <div className="space-y-4 pt-2">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {tx('jobDetail.reportJobDescription', undefined, 'Tell us why this job violates our community guidelines.')}
          </p>
          <div className="space-y-2">
            {['spam', 'misleading', 'inappropriate', 'fraud', 'other'].map((reason) => (
              <label
                key={reason}
                className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                style={{
                  borderColor: reportReason === reason ? 'var(--workspace-primary)' : 'var(--color-border-default)',
                  background: reportReason === reason ? 'var(--workspace-primary-dim,rgba(139,92,246,0.08))' : 'var(--color-background-elevated)',
                }}
              >
                <input type="radio" name="report-reason" value={reason} checked={reportReason === reason} onChange={() => setReportReason(reason)} className="accent-[var(--workspace-primary)]" />
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {tx(`jobDetail.reportReason.${reason}`, undefined, reason.charAt(0).toUpperCase() + reason.slice(1))}
                </span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsReportModalOpen(false)}>{tx('common.cancel', undefined, 'Cancel')}</Button>
            <Button variant="danger" size="sm" onClick={handleReport} isLoading={isSubmittingReport} disabled={!reportReason}>
              {tx('jobDetail.submitReport', undefined, 'Submit Report')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default JobDetail;
'''

with open(r'src/pages/JobDetail.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

return_idx = 16665
end_idx = 53085  # position of '\nexport default JobDetail;'

# end_idx points to the newline before 'export default', so we keep everything after the closing brace
new_content = content[:return_idx] + new_return

with open(r'src/pages/JobDetail.tsx', 'w', encoding='utf-8', newline='') as f:
    f.write(new_content)

print('DONE, new length:', len(new_content))
