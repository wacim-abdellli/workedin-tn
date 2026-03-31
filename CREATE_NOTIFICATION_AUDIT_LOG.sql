CREATE TABLE IF NOT EXISTS notification_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  html_body text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  retry_count integer DEFAULT 0,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert notification logs" 
ON notification_audit_log FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can update notification logs" 
ON notification_audit_log FOR UPDATE 
TO authenticated 
USING (true);