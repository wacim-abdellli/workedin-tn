// 🎨 COMPLETELY NEW VIBRANT JOB CARD DESIGN
// This is a reference for the new design - will be implemented in actual file

import { Heart, Clock, TrendingUp, MapPin, Sparkles } from 'lucide-react';

/*
NEW DESIGN FEATURES:
1. Colorful left border (changes per category)
2. Gradient hover effect
3. Floating save button with animation
4. Colorful skill badges
5. Large, prominent budget display
6. Client info with glow effect
7. Stats with icons and colors
8. Smooth animations
*/

const CATEGORY_COLORS = {
  design: { border: '#EC4899', bg: '#FCE7F3', text: '#BE185D' },
  development: { border: '#8B5CF6', bg: '#EDE9FE', text: '#6D28D9' },
  writing: { border: '#06B6D4', bg: '#CFFAFE', text: '#0E7490' },
  translation: { border: '#10B981', bg: '#D1FAE5', text: '#047857' },
  marketing: { border: '#F59E0B', bg: '#FEF3C7', text: '#D97706' },
  video: { border: '#EF4444', bg: '#FEE2E2', text: '#DC2626' },
};

export function VibrantJobCard({ job, isSaved, onToggleSave, onClick }) {
  const categoryColor = CATEGORY_COLORS[job.category] || CATEGORY_COLORS.development;

  return (
    <div
      onClick={() => onClick(job.id)}
      className="group relative overflow-hidden rounded-2xl bg-white p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1"
      style={{
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        borderLeft: `4px solid ${categoryColor.border}`,
      }}
    >
      {/* Gradient Overlay on Hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${categoryColor.bg}20 0%, transparent 100%)`,
        }}
      />

      {/* Floating Save Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSave(job);
        }}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white shadow-lg hover:scale-110 transition-transform duration-200"
        style={{
          boxShadow: isSaved ? `0 4px 12px ${categoryColor.border}40` : '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <Heart 
          className="w-5 h-5 transition-colors" 
          fill={isSaved ? categoryColor.border : 'none'}
          stroke={isSaved ? categoryColor.border : '#9CA3AF'}
        />
      </button>

      {/* Category Badge */}
      <div 
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3"
        style={{
          background: categoryColor.bg,
          color: categoryColor.text,
        }}
      >
        <Sparkles className="w-3 h-3" />
        {job.category}
      </div>

      {/* Title - Large and Bold */}
      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
        {job.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
        {job.description}
      </p>

      {/* Budget - Large and Prominent */}
      <div className="mb-4">
        <div 
          className="inline-flex items-baseline gap-2 px-4 py-2 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${categoryColor.border}15, ${categoryColor.border}05)`,
          }}
        >
          <span className="text-2xl font-bold" style={{ color: categoryColor.border }}>
            {job.job_type === 'fixed_price' 
              ? `${job.budget_min}-${job.budget_max}`
              : job.hourly_rate
            }
          </span>
          <span className="text-sm font-medium text-gray-600">
            {job.job_type === 'fixed_price' ? 'TND' : 'TND/h'}
          </span>
        </div>
      </div>

      {/* Skills - Colorful Pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {job.skills.slice(0, 4).map((skill, idx) => (
          <span
            key={idx}
            className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-50 to-cyan-50 text-purple-700 border border-purple-200"
          >
            {skill}
          </span>
        ))}
        {job.skills.length > 4 && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            +{job.skills.length - 4}
          </span>
        )}
      </div>

      {/* Footer - Client & Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        {/* Client Info */}
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{
              background: `linear-gradient(135deg, ${categoryColor.border}, ${categoryColor.text})`,
              boxShadow: `0 4px 12px ${categoryColor.border}30`,
            }}
          >
            {job.client?.full_name?.charAt(0) || 'C'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{job.client?.full_name}</p>
            {job.client?.location && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {job.client.location}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span>{job.proposals_count} proposals</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>{timeAgo(job.posted_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
