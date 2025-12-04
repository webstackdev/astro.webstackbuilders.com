CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_subject_id UUID NOT NULL,
  email TEXT,
  purposes TEXT[] NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  ip_address INET,
  privacy_policy_version TEXT NOT NULL,
  consent_text TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_consent_data_subject_id ON consent_records(data_subject_id);
CREATE INDEX idx_consent_email ON consent_records(email) WHERE email IS NOT NULL;
CREATE INDEX idx_consent_timestamp ON consent_records(timestamp DESC);

-- RLS
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_access"
ON consent_records
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
