-- Add 'shortlisted' and 'archived' to proposal_status_enum
-- This is required for the client-side shortlist and archive features to work.
-- The enum currently only has: 'pending', 'accepted', 'rejected', 'withdrawn'

ALTER TYPE proposal_status_enum ADD VALUE IF NOT EXISTS 'shortlisted';
ALTER TYPE proposal_status_enum ADD VALUE IF NOT EXISTS 'archived';
ALTER TYPE proposal_status_enum ADD VALUE IF NOT EXISTS 'new';
