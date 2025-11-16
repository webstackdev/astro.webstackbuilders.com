CREATE TABLE dsar_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('ACCESS', 'DELETE')),
  expires_at TIMESTAMPTZ NOT NULL,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dsar_token ON dsar_requests(token);
CREATE INDEX idx_dsar_expiry ON dsar_requests(expires_at)
  WHERE fulfilled_at IS NULL;

ALTER TABLE dsar_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_access"
ON dsar_requests
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
