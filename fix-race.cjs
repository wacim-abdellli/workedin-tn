const fs = require('fs');

let c = fs.readFileSync('src/components/jobs/JobCard.tsx', 'utf8');

c = c.replace(/import React from 'react';/, "import React, { useState } from 'react';");
c = c.replace(/onToggleSave: \(job: JobForCard\) => void;/, "onToggleSave: (job: JobForCard) => void | Promise<void>;");
c = c.replace(
  /function JobCard\(\{ job, isSaved, onToggleSave, onClick \}: JobCardProps\) \{\n  const \{ t, language \} = useTranslation\(\);/,
  "function JobCard({ job, isSaved, onToggleSave, onClick }: JobCardProps) {\n  const [isSaving, setIsSaving] = useState(false);\n  const { t, language } = useTranslation();"
);

c = c.replace(
  /onClick=\{\(event\) => \{\n\s*event\.stopPropagation\(\);\n\s*onToggleSave\(job\);\n\s*\}\}/,
  `onClick={async (event) => {
            event.stopPropagation();
            if (isSaving) return;
            setIsSaving(true);
            try {
              await onToggleSave(job);
            } finally {
              setIsSaving(false);
            }
          }}`
);

c = c.replace(/isActive=\{isSaved\}/, "isActive={isSaved}\n          disabled={isSaving}\n          isLoading={isSaving}");

fs.writeFileSync('src/components/jobs/JobCard.tsx', c);
console.log('Fixed race condition in JobCard');