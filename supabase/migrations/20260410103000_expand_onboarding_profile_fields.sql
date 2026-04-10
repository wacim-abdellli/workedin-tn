-- Expand onboarding data coverage for freelancer and client profiles

alter table public.profiles
  add column if not exists company_name text,
  add column if not exists company_website text,
  add column if not exists company_industry text,
  add column if not exists company_size text,
  add column if not exists company_role text,
  add column if not exists hiring_needs jsonb default '[]'::jsonb,
  add column if not exists project_budget_preference text,
  add column if not exists project_timeline_preference text,
  add column if not exists communication_preferences jsonb default '{}'::jsonb,
  add column if not exists screening_preferences jsonb default '{}'::jsonb,
  add column if not exists legal_preferences jsonb default '{}'::jsonb;

alter table public.freelancer_profiles
  add column if not exists years_experience integer,
  add column if not exists tools jsonb default '[]'::jsonb,
  add column if not exists industries jsonb default '[]'::jsonb,
  add column if not exists portfolio_links jsonb default '[]'::jsonb,
  add column if not exists weekly_availability_hours integer,
  add column if not exists revision_policy text,
  add column if not exists project_preferences jsonb default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'freelancer_profiles_years_experience_non_negative'
      and conrelid = 'public.freelancer_profiles'::regclass
  ) then
    alter table public.freelancer_profiles
      add constraint freelancer_profiles_years_experience_non_negative
      check (years_experience is null or years_experience >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'freelancer_profiles_weekly_hours_range'
      and conrelid = 'public.freelancer_profiles'::regclass
  ) then
    alter table public.freelancer_profiles
      add constraint freelancer_profiles_weekly_hours_range
      check (weekly_availability_hours is null or (weekly_availability_hours >= 1 and weekly_availability_hours <= 168));
  end if;
end;
$$;
