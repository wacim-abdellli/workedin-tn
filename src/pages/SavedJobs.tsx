import { Heart, MapPin, Clock, Star, Briefcase } from 'lucide-react';
import { Header } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';

type SavedItemsRole = 'client' | 'freelancer';

interface SavedJobItem {
  id: string;
  title: string;
  jobType: 'Fixed-price' | 'Hourly';
  budget: string;
  postedAgo: string;
}

interface SavedTalentItem {
  id: string;
  name: string;
  title: string;
  location: string;
  rating: number;
  hourlyRate: number;
}

interface SavedItemsProps {
  role: SavedItemsRole;
  savedJobs?: SavedJobItem[];
  savedTalent?: SavedTalentItem[];
}

const SAVED_JOBS: SavedJobItem[] = [
  {
    id: 'job-1',
    title: 'Build a React + Supabase dashboard for order analytics',
    jobType: 'Fixed-price',
    budget: '1500 TND',
    postedAgo: 'Posted 1 day ago',
  },
  {
    id: 'job-2',
    title: 'Landing page redesign with modern motion and conversions focus',
    jobType: 'Hourly',
    budget: '45 TND/hr',
    postedAgo: 'Posted 3 days ago',
  },
  {
    id: 'job-3',
    title: 'Migrate legacy Node API endpoints to typed service architecture',
    jobType: 'Fixed-price',
    budget: '2200 TND',
    postedAgo: 'Posted 5 days ago',
  },
];

const SAVED_TALENT: SavedTalentItem[] = [
  {
    id: 'talent-1',
    name: 'Aymen Ben Salem',
    title: 'Full-Stack Engineer',
    location: 'Tunis',
    rating: 4.9,
    hourlyRate: 45,
  },
  {
    id: 'talent-2',
    name: 'Meriem Trabelsi',
    title: 'Product Designer',
    location: 'Sfax',
    rating: 4.8,
    hourlyRate: 40,
  },
  {
    id: 'talent-3',
    name: 'Youssef Gharbi',
    title: 'DevOps Specialist',
    location: 'Sousse',
    rating: 4.7,
    hourlyRate: 55,
  },
];

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
};

export function SavedItems({
  role,
  savedJobs = SAVED_JOBS,
  savedTalent = SAVED_TALENT,
}: SavedItemsProps) {
  const isFreelancer = role === 'freelancer';
  const title = isFreelancer ? 'Saved Jobs' : 'Saved Talent';
  const subtitle = isFreelancer
    ? 'Keep track of jobs you want to apply for.'
    : 'Keep track of top freelancers for your projects.';

  const roleItems = isFreelancer ? savedJobs : savedTalent;

  const titleHoverClass = isFreelancer
    ? 'group-hover:text-purple-400'
    : 'group-hover:text-orange-500';
  const actionButtonClass = isFreelancer
    ? 'bg-purple-600 hover:bg-purple-700'
    : 'bg-orange-500 hover:bg-orange-600';
  const heartClass = isFreelancer
    ? 'text-purple-500 fill-purple-500'
    : 'text-orange-500 fill-orange-500';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 pt-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-3xl font-bold mb-2 text-white">{title}</h1>
          <p className="text-gray-400 mb-8">{subtitle}</p>
        </header>

        <section className="bg-[#141414] border border-[#262626] rounded-2xl overflow-hidden flex flex-col">
          {roleItems.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <Heart className="w-12 h-12 text-gray-600 mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Nothing saved yet</h2>
              <button
                type="button"
                className={`text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${actionButtonClass}`}
              >
                {isFreelancer ? 'Browse Jobs' : 'Browse Freelancers'}
              </button>
            </div>
          ) : isFreelancer ? (
            savedJobs.map((job) => (
              <article
                key={job.id}
                className="p-6 border-b border-[#262626] last:border-b-0 hover:bg-[#262626]/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group"
              >
                <div className="min-w-0">
                  <h3 className={`text-lg font-bold text-white transition-colors line-clamp-1 mb-2 cursor-pointer ${titleHoverClass}`}>
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      {job.jobType}
                    </span>
                    <span>
                      Budget: <span className="text-white">{job.budget}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {job.postedAgo}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <button
                    type="button"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  >
                    Apply Now
                  </button>
                  <button
                    type="button"
                    aria-label="Remove saved job"
                    className={`p-2 rounded-full border border-[#262626] bg-[#0a0a0a] hover:text-gray-400 hover:fill-transparent transition-all cursor-pointer ${heartClass}`}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))
          ) : (
            savedTalent.map((talent) => (
              <article
                key={talent.id}
                className="p-6 border-b border-[#262626] last:border-b-0 hover:bg-[#262626]/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-[#262626] shrink-0 flex items-center justify-center text-sm font-semibold text-white">
                    {getInitials(talent.name)}
                  </div>

                  <div className="min-w-0">
                    <h3 className={`text-lg font-bold text-white transition-colors line-clamp-1 cursor-pointer ${titleHoverClass}`}>
                      {talent.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-1 line-clamp-1">{talent.title}</p>
                    <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      {talent.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-4 text-sm mr-4">
                    <span className="inline-flex items-center gap-1 text-gray-400">
                      <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                      <span className="text-white">{talent.rating.toFixed(1)}</span>
                    </span>
                    <span className="text-white font-medium">{talent.hourlyRate} TND/hr</span>
                  </div>

                  <button
                    type="button"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  >
                    Invite to Job
                  </button>

                  <button
                    type="button"
                    aria-label="Remove saved freelancer"
                    className={`p-2 rounded-full border border-[#262626] bg-[#0a0a0a] hover:text-gray-400 hover:fill-transparent transition-all cursor-pointer ${heartClass}`}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

export default function SavedJobsPage() {
  const { activeMode } = useAuth();
  const role: SavedItemsRole = activeMode === 'client' ? 'client' : 'freelancer';

  return (
    <>
      <Header />
      <SavedItems role={role} />
    </>
  );
}
