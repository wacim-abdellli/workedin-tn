export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  jobs: '/jobs',
  jobsNew: '/jobs/new',
  saved: '/saved',
  myContracts: '/contracts',
  myProposals: '/my-proposals',
  clientJobs: '/client/jobs',
  messages: '/messages',
  settings: '/settings',
  settingsAccount: '/settings?tab=account',
  settingsProfile: '/settings?tab=profile',
  freelancerPortfolio: '/freelancer/portfolio',
} as const;

export function getClientJobProposalsRoute(jobId: string) {
  return `/client/jobs/${jobId}/proposals`;
}

export function getJobDetailRoute(jobId: string) {
  return `/jobs/${jobId}`;
}

export function getJobEditRoute(jobId: string) {
  return `/jobs/${jobId}/edit`;
}
