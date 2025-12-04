-- Ensure required extensions are available for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- Consent records ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_subject_id UUID NOT NULL,
  email TEXT,
  purposes TEXT[] NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  ip_address INET,
  privacy_policy_version TEXT NOT NULL,
  consent_text TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_data_subject_id ON public.consent_records(data_subject_id);
CREATE INDEX IF NOT EXISTS idx_consent_email ON public.consent_records(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consent_timestamp ON public.consent_records("timestamp" DESC);

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'consent_records'
      AND policyname = 'service_role_all_access'
  ) THEN
    CREATE POLICY "service_role_all_access"
      ON public.consent_records
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

-- Newsletter confirmations --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  data_subject_id UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_token ON public.newsletter_confirmations(token);
CREATE INDEX IF NOT EXISTS idx_newsletter_expiry
  ON public.newsletter_confirmations(expires_at)
  WHERE confirmed_at IS NULL;

ALTER TABLE public.newsletter_confirmations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'newsletter_confirmations'
      AND policyname = 'service_role_all_access'
  ) THEN
    CREATE POLICY "service_role_all_access"
      ON public.newsletter_confirmations
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

-- DSAR requests ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dsar_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('ACCESS', 'DELETE')),
  expires_at TIMESTAMPTZ NOT NULL,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dsar_token ON public.dsar_requests(token);
CREATE INDEX IF NOT EXISTS idx_dsar_expiry
  ON public.dsar_requests(expires_at)
  WHERE fulfilled_at IS NULL;

ALTER TABLE public.dsar_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dsar_requests'
      AND policyname = 'service_role_all_access'
  ) THEN
    CREATE POLICY "service_role_all_access"
      ON public.dsar_requests
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;
