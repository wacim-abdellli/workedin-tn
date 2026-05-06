const fs = require('fs');
const file = 'c:/Users/pc/Desktop/workedin_tn/src/pages/ClientProfile.tsx';
let content = fs.readFileSync(file, 'utf8');

// heroActions
content = content.replace(
  /const heroActions = isOwnProfile \? \([\s\S]*?\) : undefined;/m,
  `const heroActions = isOwnProfile ? (
      <button
        type="button"
        onClick={() => navigate('/settings?tab=profile')}
        className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl border transition-all duration-150 hover:bg-white/5"
        style={{ color: "rgba(255,255,255,0.55)", borderColor: "rgba(255,255,255,0.12)" }}
      >
        <Edit2 className="w-3.5 h-3.5" />
        {tx('clientProfile.editProfile', undefined, 'Edit profile')}
      </button>
  ) : undefined;`
);

fs.writeFileSync(file, content);
