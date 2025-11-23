CREATE TABLE newsletter_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  data_subject_id UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_newsletter_token ON newsletter_confirmations(token);
CREATE INDEX idx_newsletter_expiry ON newsletter_confirmations(expires_at)
  WHERE confirmed_at IS NULL;

ALTER TABLE newsletter_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_access"
ON newsletter_confirmations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
