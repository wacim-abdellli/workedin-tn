-- Migration to enforce maximum caps on job budgets and hourly rates.

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_budget_min_max_check,
  DROP CONSTRAINT IF EXISTS jobs_budget_max_check,
  DROP CONSTRAINT IF EXISTS jobs_hourly_rate_max_check;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_budget_min_max_check CHECK (budget_min <= 100000),
  ADD CONSTRAINT jobs_budget_max_check CHECK (budget_max <= 100000),
  ADD CONSTRAINT jobs_hourly_rate_max_check CHECK (hourly_rate <= 10000);
