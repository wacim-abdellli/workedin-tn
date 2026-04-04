const fs = require('fs');

let profile = fs.readFileSync('src/components/settings/ProfileSettings.tsx', 'utf8');

profile = profile.replace(
    'const needsIdentityVerification = !profile?.cin_verified;',
    'const needsIdentityVerification = !profile?.cin_verified && !profile?.cin_submitted;'
);

profile = profile.replace(
    "const identityStatus: 'verified' | 'missing' = profile?.cin_verified\n        ? 'verified' : 'missing';",
    "const identityStatus: 'verified' | 'pending' | 'missing' = profile?.cin_verified\n        ? 'verified' : profile?.cin_submitted ? 'pending' : 'missing';"
);

profile = profile.replace(
    "{ key: 'identity_verification', label: tx('settings.completion.identityVerification', undefined, 'Identity verification'), value: Boolean(profile?.cin_verified) },",
    "{ key: 'identity_verification', label: tx('settings.completion.identityVerification', undefined, 'Identity verification'), value: Boolean(profile?.cin_verified || profile?.cin_submitted) },"
);

const oldRender = \{profile?.cin_verified ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
                                <Check className="w-3 h-3" />{tx('settings.identityVerified', undefined, 'Identity verified')}
                            </span>
                        ) : (
                            <button onClick={() => navigate('/verify-identity')} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-brand/20 bg-brand/5 text-brand transition-colors hover:bg-brand/10">
                                <Shield className="w-3 h-3" />{tx('settings.verifyIdentity', undefined, 'Verify your identity')}
                            </button>
                        )}\;

const newRender = \{profile?.cin_verified ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600">
                                <Check className="w-3 h-3" />{tx('settings.identityVerified', undefined, 'Identity verified')}
                            </span>
                        ) : profile?.cin_submitted ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-orange-500/20 bg-orange-500/10 text-orange-500 cursor-not-allowed">
                                <Loader2 className="w-3 h-3 animate-spin" />Pending review
                            </span>
                        ) : (
                            <button onClick={() => navigate('/verify-identity')} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-brand/20 bg-brand/5 text-brand transition-colors hover:bg-brand/10">
                                <Shield className="w-3 h-3" />{tx('settings.verifyIdentity', undefined, 'Verify your identity')}
                            </button>
                        )}\;

profile = profile.replace(oldRender, newRender);
fs.writeFileSync('src/components/settings/ProfileSettings.tsx', profile);

// Update Settings.tsx main wrapper
let settings = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

settings = settings.replace(
    \const identityLabel = profile?.cin_verified
        ? tx('settings.identityVerified', undefined, 'Identity verified')
        : tx('settings.verifyIdentity', undefined, 'Verify your identity');\,
    \const identityLabel = profile?.cin_verified
        ? tx('settings.identityVerified', undefined, 'Identity verified')
        : profile?.cin_submitted 
            ? 'Verification pending' 
            : tx('settings.verifyIdentity', undefined, 'Verify your identity');\
);

settings = settings.replace(
    \<p className="text-sm font-medium text-muted-foreground/80 mt-1">{profile?.cin_verified ? 'Successfully verified by a human' : 'Pending verification review'}</p>\,
    \<p className="text-sm font-medium text-muted-foreground/80 mt-1">{profile?.cin_verified ? 'Successfully verified by a human' : profile?.cin_submitted ? 'Pending verification review by admin' : 'Submit your ID'}</p>\
);

settings = settings.replace(
    \<div className={\\\p-3 rounded-xl \\\\}>\,
    \<div className={\\\p-3 rounded-xl \\\\}>\
);

settings = settings.replace(
    \<span className={\\\px-4 py-2 border rounded-full text-xs font-bold uppercase tracking-widest \\\\}>\,
    \<span className={\\\px-4 py-2 border rounded-full text-xs font-bold uppercase tracking-widest \\\\}>\
);

fs.writeFileSync('src/pages/Settings.tsx', settings);

let verifyIdentity = fs.readFileSync('src/pages/VerifyIdentity.tsx', 'utf8');

const loadingUi = \
    if (resolvedIdentityStatus === null && effectiveStatus === 'missing') {
        return (
            <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#13294f_0%,_#0b1328_40%,_#0b1020_100%)] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-brand" />
            </div>
        );
    }

    // -- Status screens ----------------------------------------------------------
\;
verifyIdentity = verifyIdentity.replace('    // -- Status screens ----------------------------------------------------------', loadingUi);

const preventForm = \
    if (profile?.cin_submitted && effectiveStatus === 'missing') {
        return (
            <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#13294f_0%,_#0b1328_40%,_#0b1020_100%)] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-brand" />
            </div>
        );
    }
    // -- Main flow ---------------------------------------------------------------\
verifyIdentity = verifyIdentity.replace('    // -- Main flow ---------------------------------------------------------------', preventForm);

fs.writeFileSync('src/pages/VerifyIdentity.tsx', verifyIdentity);
