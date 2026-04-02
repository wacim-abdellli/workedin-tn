-- Combined index for common filter pattern
CREATE INDEX IF NOT EXISTS idx_jobs_filter_combo
    ON jobs(status, category, experience_level, posted_at DESC)
    WHERE status != 'closed';
