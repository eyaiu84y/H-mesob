-- ============================================================================
-- Migration 010: Real Email Verification & Queue Notification System
-- Hawassa MESOB Public Service Management Information System
-- Idempotent DDL: Tables, Indexes, Constraints, and Policies
-- ============================================================================

-- Enable uuid extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABLE: email_verification_tokens
-- Description: Cryptographically secure, single-use, expiring verification tokens
-- Stores ONLY SHA-256 hashed tokens and OTP codes (never raw secrets)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,       -- SHA-256 hash of URL token
  code_hash VARCHAR(64) NOT NULL,              -- SHA-256 hash of 6-digit code
  expires_at TIMESTAMPTZ NOT NULL,             -- Token expiration timestamp
  verified BOOLEAN DEFAULT FALSE NOT NULL,
  verified_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0 NOT NULL,
  resend_count INTEGER DEFAULT 0 NOT NULL,
  last_resend_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for email_verification_tokens
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token_hash ON public.email_verification_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_code_hash ON public.email_verification_tokens(code_hash);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON public.email_verification_tokens(expires_at);

-- ============================================================================
-- 2. TABLE: email_outbox
-- Description: Reliable asynchronous email delivery queue with retry tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.email_outbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email VARCHAR(255) NOT NULL,
  recipient_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  template_name VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) DEFAULT 'PENDING' NOT NULL,  -- PENDING, PROCESSING, SENT, FAILED, RETRYING
  idempotency_key VARCHAR(120) UNIQUE,
  attempts INTEGER DEFAULT 0 NOT NULL,
  max_attempts INTEGER DEFAULT 5 NOT NULL,
  next_retry_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_error TEXT,
  message_id VARCHAR(150),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for email_outbox
CREATE INDEX IF NOT EXISTS idx_email_outbox_status_retry ON public.email_outbox(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_email_outbox_recipient ON public.email_outbox(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_outbox_idempotency ON public.email_outbox(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_email_outbox_created_at ON public.email_outbox(created_at DESC);

-- ============================================================================
-- 3. TABLE: email_notifications
-- Description: Permanent log of delivered email notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outbox_id UUID REFERENCES public.email_outbox(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,                 -- REGISTRATION_VERIFY, QUEUE_CONFIRMATION, QUEUE_TURN, QUEUE_COMPLETED
  reference_type VARCHAR(50),                      -- queue, user, application
  reference_id UUID,
  delivery_status VARCHAR(20) NOT NULL,            -- SENT, FAILED, SIMULATED
  message_id VARCHAR(150),
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for email_notifications
CREATE INDEX IF NOT EXISTS idx_email_notifications_recipient_id ON public.email_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_event_type ON public.email_notifications(event_type);
CREATE INDEX IF NOT EXISTS idx_email_notifications_reference ON public.email_notifications(reference_type, reference_id);

-- ============================================================================
-- 4. GRANTS FOR SERVICE ROLE
-- ============================================================================
GRANT ALL ON public.email_verification_tokens TO service_role;
GRANT ALL ON public.email_outbox TO service_role;
GRANT ALL ON public.email_notifications TO service_role;

-- Ensure RLS is active on public access
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
