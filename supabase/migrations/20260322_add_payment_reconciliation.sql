-- Payment reconciliation: view for stuck transactions + admin helper
-- Idempotent: uses CREATE OR REPLACE / IF NOT EXISTS

-- View: stuck transactions (pending for > 1 hour)
CREATE OR REPLACE VIEW stuck_transactions AS
SELECT
    t.id,
    t.user_id,
    t.amount,
    t.type,
    t.status,
    t.reference_id,
    t.created_at,
    p.full_name AS user_name,
    p.email
FROM transactions t
LEFT JOIN profiles p ON p.id = t.user_id
WHERE t.status = 'pending'
  AND t.created_at < NOW() - INTERVAL '1 hour'
ORDER BY t.created_at ASC;

-- Grant access to the view (service role always has access; anon does not)
GRANT SELECT ON stuck_transactions TO authenticated;
