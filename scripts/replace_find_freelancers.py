new_render = r'''    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            <SEO {...SEO_CONFIG.findFreelancers} url="/find-freelancers" canonical="https://workedin.tn/find-freelancers" />
            <Header />

            {/* ── Hero ── */}
            <section className="relative overflow-hidden pt-12 pb-16">
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background: 'radial-gradient(ellipse 70% 50% at 20% -10%, rgba(139,92,246,0.15) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% -5%, rgba(99,102,241,0.10) 0%, transparent 50%)',
                    }}
                />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <div
                                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold mb-5"
                                style={{
                                    background: 'rgba(139,92,246,0.12)',
                                    border: '1px solid rgba(139,92,246,0.25)',
                                    color: '#a78bfa',
                                }}
                            >
                                <Sparkles className="h-3 w-3" />
                                {copy.hero.badge}
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 leading-[1.08]">
                                {copy.hero.title}{' '}
                                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg,#8b5cf6,#6366f1)' }}>
                                    {copy.hero.titleHighlight}
                                </span>
                            </h1>
                            <p className="text-white/50 text-base leading-7">
                                {copy.hero.subtitle}
                                <span className="hidden md:inline">{copy.hero.subtitleDesktop}</span>
                            </p>

                            {/* Stat pills */}
                            <div className="mt-8 flex flex-wrap gap-3">
                                {[
                                    { label: copy.heroStats.talentPool, value: `${(freelancersData?.length || 0).toLocaleString()}+` },
                                    { label: copy.heroStats.verified, value: String((freelancersData || []).filter((f: FreelancerRecord) => f.is_verified).length) },
                                    { label: copy.heroStats.fastReplies, value: '4.9/5' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 backdrop-blur-sm">
                                        <p className="text-xl font-black text-white">{value}</p>
                                        <p className="text-[10px] uppercase tracking-widest text-white/35 mt-0.5">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* View toggle */}
                        <div className="flex items-center gap-1 rounded-2xl border border-white/8 bg-white/4 p-1.5 self-start lg:self-end">
                            {([
                                { mode: 'grid', Icon: Grid, label: 'Grid' },
                                { mode: 'list', Icon: List, label: 'List' },
                            ] as const).map(({ mode, Icon, label }) => (
                                <button
                                    key={mode}
                                    type="button"
                                    aria-label={label}
                                    aria-pressed={viewMode === mode}
                                    onClick={() => setViewMode(mode)}
                                    className="rounded-xl p-2.5 transition-all"
                                    style={viewMode === mode
                                        ? { background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }
                                        : { color: 'rgba(255,255,255,0.3)' }
                                    }
                                >
                                    <Icon className="h-4.5 w-4.5" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Body ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

                {/* Mobile filter button */}
                <div className="mb-5 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setShowFilters(true)}
                        className="w-full flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-5 py-3 text-sm font-semibold text-white"
                    >
                        <span className="flex items-center gap-2">
                            <SlidersHorizontal className="h-4 w-4 opacity-60" />
                            {copy.filterToggle}
                        </span>
                        {activeFilterCount > 0 && (
                            <span className="rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/25 px-2 py-0.5 text-xs font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex items-start gap-6">
                    {/* Sidebar */}
                    <aside className="sticky top-24 hidden w-72 shrink-0 lg:block z-10">
                        <div className="rounded-2xl border border-white/8 p-5" style={{ background: 'rgba(255,255,255,0.025)' }}>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                                    <Filter className="h-4 w-4 opacity-60" />
                                    {copy.filterTitle}
                                </h2>
                                {activeFilterCount > 0 && (
                                    <button type="button" onClick={clearFilters} className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-semibold">
                                        {copy.clearAll}
                                    </button>
                                )}
                            </div>
                            <FilterSidebar
                                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                                availableOnly={availableOnly} setAvailableOnly={setAvailableOnly}
                                selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
                                selectedSkills={selectedSkills} setSelectedSkills={setSelectedSkills}
                                rateRange={rateRange} setRateRange={setRateRange}
                                minRating={minRating} setMinRating={setMinRating}
                                verifiedOnly={verifiedOnly} setVerifiedOnly={setVerifiedOnly}
                                clearFilters={clearFilters} copy={copy} tx={tx}
                                categoryOptions={CATEGORY_OPTIONS} skillOptions={SKILL_OPTIONS}
                            />
                        </div>
                    </aside>

                    {/* Main */}
                    <main className="min-w-0 flex-1">
                        {/* Toolbar */}
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2.5">
                                <p className="text-sm text-white/45">
                                    {copy.resultsCount.replace('{{count}}', filteredFreelancers.length.toString())}
                                </p>
                                {activeFilterCount > 0 && (
                                    <span className="rounded-full text-xs font-semibold px-2.5 py-0.5"
                                        style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
                                        {activeFilterCount} {copy.activeFilters}
                                    </span>
                                )}
                            </div>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/70 outline-none appearance-none cursor-pointer focus:border-violet-500 transition-colors"
                            >
                                <option value="recommended">{copy.sort.recommended}</option>
                                <option value="rating">{copy.sort.rating}</option>
                                <option value="rate_low">{copy.sort.priceLow}</option>
                            </select>
                        </div>

                        {/* Result stats */}
                        {!isLoading && filteredFreelancers.length > 0 && (
                            <div className="mb-5 grid grid-cols-3 gap-3">
                                {[
                                    { label: copy.resultStats.availableNow, value: filteredFreelancers.filter((f) => f.is_available).length },
                                    { label: copy.resultStats.averageRate, value: `${averageRate} TND` },
                                    { label: copy.resultStats.topRating, value: topRating },
                                ].map(({ label, value }) => (
                                    <div key={label} className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                                        <p className="text-base font-black text-white">{value}</p>
                                        <p className="text-[10px] uppercase tracking-wider text-white/30 mt-0.5">{label}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Cards */}
                        {isLoading ? (
                            <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="rounded-2xl border border-white/8 bg-white/3 animate-pulse h-48" />
                                ))}
                            </div>
                        ) : filteredFreelancers.length > 0 ? (
                            <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
                                {filteredFreelancers.map((freelancer, index) => (
                                    <div key={freelancer.id} style={{ animationDelay: `${index * 40}ms`, animation: 'fadeUp 0.35s ease both' }}>
                                        <FreelancerCard
                                            freelancer={freelancer} viewMode={viewMode}
                                            isSaved={savedFreelancerIds.has(freelancer.id)}
                                            onToggleSave={toggleSaved}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={Search}
                                title={copy.noResults.title}
                                description={copy.noResults.description}
                                action={{ label: copy.noResults.action, onClick: clearFilters, variant: 'primary' }}
                                className="rounded-2xl"
                            />
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile filter drawer */}
            {showFilters && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                        onClick={() => setShowFilters(false)}
                    />
                    <div
                        className="absolute inset-x-0 bottom-0 top-16 flex flex-col rounded-t-3xl border border-white/8"
                        style={{ background: '#12121a' }}
                    >
                        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                            <h2 className="text-base font-bold text-white">{copy.filterTitle}</h2>
                            <button type="button" onClick={() => setShowFilters(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/8 text-white/60 hover:text-white transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-5">
                            <FilterSidebar
                                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                                availableOnly={availableOnly} setAvailableOnly={setAvailableOnly}
                                selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories}
                                selectedSkills={selectedSkills} setSelectedSkills={setSelectedSkills}
                                rateRange={rateRange} setRateRange={setRateRange}
                                minRating={minRating} setMinRating={setMinRating}
                                verifiedOnly={verifiedOnly} setVerifiedOnly={setVerifiedOnly}
                                clearFilters={clearFilters} copy={copy} tx={tx}
                                categoryOptions={CATEGORY_OPTIONS} skillOptions={SKILL_OPTIONS}
                            />
                        </div>
                        <div className="border-t border-white/8 p-5">
                            <button
                                type="button"
                                onClick={() => setShowFilters(false)}
                                className="w-full h-12 rounded-2xl font-bold text-white text-sm"
                                style={{ background: 'linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%)' }}
                            >
                                {copy.resultsCount.replace('{{count}}', filteredFreelancers.length.toString())}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
'''

with open(r'src/pages/FindFreelancers.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('    return (\n        <div className="min-h-screen transition-colors duration-300"')
if idx == -1:
    print('ERROR: marker not found')
else:
    new_content = content[:idx] + new_render
    with open(r'src/pages/FindFreelancers.tsx', 'w', encoding='utf-8', newline='') as f:
        f.write(new_content)
    print(f'DONE, new length: {len(new_content)}')
