-- Add identity verification notification types to notification_type_enum
-- Required for admin verification/revocation flows

-- Add new enum values to notification_type_enum
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'identity_verified';
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'identity_rejected';

-- Note: These enum values are now available for use in notifications.type column
-- - identity_verified: User's identity verification was approved by admin
-- identity_rejected: User's identity verification was rejected or revoked by admin
