const fs = require('fs');
const file = 'c:/Users/pc/Desktop/workedin_tn/src/pages/FreelancerProfile.tsx';
let content = fs.readFileSync(file, 'utf8');

// heroActions
content = content.replace(
  /const heroActions = isOwner && !editingBasics \? \([\s\S]*?\) : undefined;/m,
  `const heroActions = isOwner ? (
      <button
        type="button"
        onClick={() => navigate('/settings?tab=freelancer')}
        className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl border transition-all duration-150"
        style={{ 
          color: 'var(--color-text-secondary)', 
          borderColor: 'var(--color-border-subtle)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-subtle)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <Edit2 className="w-3.5 h-3.5" />
        {tx('pages.freelancerProfile.actions.editProfile', undefined, 'Edit profile')}
      </button>
  ) : undefined;`
);

// editingBasics section
content = content.replace(
  /\{isOwner && editingBasics && \([\s\S]*?\)\s*\}\s*<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">/,
  `<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">`
);

// Bio section
content = content.replace(
  /<ProfileSection[\s\S]*?title="Introduction"[^>]*>[\s\S]*?\{editingBio && isOwner \? \([\s\S]*?\) : freelancer\.bio \? \([\s\S]*?<p[\s\S]*?>[\s\S]*?\{freelancer\.bio\}[\s\S]*?<\/p>[\s\S]*?\) : \([\s\S]*?<ProfileEmptySlot message="No bio added yet\." \/>[\s\S]*?\)[\s\S]*?<\/ProfileSection>/,
  `<ProfileSection
                        title="Introduction"
                        animationDelay={80}
                        onEdit={isOwner ? () => navigate('/settings?tab=freelancer') : undefined}
                        editLabel="Edit"
                    >
                        {freelancer.bio ? (
                            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                                {freelancer.bio}
                            </p>
                        ) : (
                            <ProfileEmptySlot 
                                message="No bio added yet." 
                                cta={isOwner ? <Link to="/settings?tab=freelancer" className="text-xs font-medium" style={{ color: accentColor }}>+ Add bio</Link> : undefined} 
                            />
                        )}
                    </ProfileSection>`
);

// Skills section
content = content.replace(
  /<ProfileSection[\s\S]*?title=\{tx\('pages\.freelancerProfile\.sections\.coreStrengths'[^>]*>[\s\S]*?\{editingSkills && isOwner \? \([\s\S]*?\) : strengths\.length > 0 \? \([\s\S]*?<div className="flex flex-wrap gap-2">[\s\S]*?\{strengths\.map\(\(item\) => \([\s\S]*?<ProfileTag key=\{item\} label=\{item\} accentColor=\{accentColor\} \/>[\s\S]*?\)\)}[\s\S]*?<\/div>[\s\S]*?\) : \([\s\S]*?<ProfileEmptySlot message="No skills added yet\." \/>[\s\S]*?\)[\s\S]*?<\/ProfileSection>/,
  `<ProfileSection
                        title={tx('pages.freelancerProfile.sections.coreStrengths', undefined, 'Core strengths')}
                        animationDelay={160}
                        onEdit={isOwner ? () => navigate('/settings?tab=freelancer') : undefined}
                        editLabel="Edit"
                    >
                        {strengths.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {strengths.map((item) => (
                                    <ProfileTag key={item} label={item} accentColor={accentColor} />
                                ))}
                            </div>
                        ) : (
                            <ProfileEmptySlot 
                                message="No skills added yet."
                                cta={isOwner ? <Link to="/settings?tab=freelancer" className="text-xs font-medium" style={{ color: accentColor }}>+ Add skills</Link> : undefined} 
                            />
                        )}
                    </ProfileSection>`
);

// Tools section
content = content.replace(
  /<ProfileSection[\s\S]*?title="Tools"[^>]*>[\s\S]*?\{editingTools && isOwner \? \([\s\S]*?\) : tools\.length > 0 \? \([\s\S]*?<div className="flex flex-wrap gap-2">[\s\S]*?\{tools\.map\(\(item\) => \([\s\S]*?<ProfileTag key=\{item\} label=\{item\} accentColor="var\(--workspace-primary\)" \/>[\s\S]*?\)\)}[\s\S]*?<\/div>[\s\S]*?\) : \([\s\S]*?<ProfileEmptySlot message="No tools added yet\." \/>[\s\S]*?\)[\s\S]*?<\/ProfileSection>/,
  `<ProfileSection
                        title="Tools"
                        animationDelay={240}
                        onEdit={isOwner ? () => navigate('/settings?tab=freelancer') : undefined}
                        editLabel="Edit"
                    >
                        {tools.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {tools.map((item) => (
                                    <ProfileTag key={item} label={item} accentColor="var(--workspace-primary)" />
                                ))}
                            </div>
                        ) : (
                            <ProfileEmptySlot 
                                message="No tools added yet."
                                cta={isOwner ? <Link to="/settings?tab=freelancer" className="text-xs font-medium" style={{ color: accentColor }}>+ Add tools</Link> : undefined} 
                            />
                        )}
                    </ProfileSection>`
);

fs.writeFileSync(file, content);
