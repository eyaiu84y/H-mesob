-- =====================================================================
-- Migration 011: Enterprise Scalability Indexes & Distributed Outbox Leases
-- Hawassa MESOB Public Service Management Information System
-- =====================================================================

-- 1. Extend email_outbox with distributed worker lease columns for horizontal scaling
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'email_outbox'
    ) THEN
        -- Add locked_by column if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'email_outbox' AND column_name = 'locked_by'
        ) THEN
            ALTER TABLE public.email_outbox ADD COLUMN locked_by VARCHAR(100) DEFAULT NULL;
        END IF;

        -- Add locked_at column if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'email_outbox' AND column_name = 'locked_at'
        ) THEN
            ALTER TABLE public.email_outbox ADD COLUMN locked_at TIMESTAMPTZ DEFAULT NULL;
        END IF;

        -- Add lease_expires_at column if not exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'email_outbox' AND column_name = 'lease_expires_at'
        ) THEN
            ALTER TABLE public.email_outbox ADD COLUMN lease_expires_at TIMESTAMPTZ DEFAULT NULL;
        END IF;
    END IF;
END $$;

-- 2. Indexes for High-Throughput Email Outbox Batch Fetching & Processing
CREATE INDEX IF NOT EXISTS idx_email_outbox_fetch_batch 
ON public.email_outbox (status, next_retry_at) 
WHERE status IN ('PENDING', 'RETRYING');

CREATE INDEX IF NOT EXISTS idx_email_outbox_lease 
ON public.email_outbox (locked_by, locked_at) 
WHERE locked_by IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_outbox_idemp_key 
ON public.email_outbox (idempotency_key) 
WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_outbox_created_desc 
ON public.email_outbox (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_outbox_recipient 
ON public.email_outbox (recipient_email);

-- 3. Indexes for High-Volume Queue Operations Across Multiple Institutions
CREATE INDEX IF NOT EXISTS idx_queue_entries_inst_status_created 
ON public.queue_entries (institution_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_queue_entries_citizen_created 
ON public.queue_entries (citizen_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_queue_entries_created_desc 
ON public.queue_entries (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_queue_entries_prefix_search 
ON public.queue_entries (queue_number text_pattern_ops);

-- 4. Atomic Batch Fetch & Lease Function for Horizontal Worker Scaling
CREATE OR REPLACE FUNCTION public.claim_email_outbox_batch(
    p_worker_id VARCHAR,
    p_batch_size INT,
    p_lease_duration_seconds INT DEFAULT 300
)
RETURNS SETOF public.email_outbox
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_now TIMESTAMPTZ := NOW();
    v_lease_expiry TIMESTAMPTZ := NOW() + (p_lease_duration_seconds || ' seconds')::INTERVAL;
BEGIN
    RETURN QUERY
    WITH candidate_batch AS (
        SELECT id
        FROM public.email_outbox
        WHERE (status IN ('PENDING', 'RETRYING') AND next_retry_at <= v_now)
           OR (status = 'PROCESSING' AND (locked_at IS NULL OR locked_at < v_now - (p_lease_duration_seconds || ' seconds')::INTERVAL))
        ORDER BY next_retry_at ASC, id ASC
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    )
    UPDATE public.email_outbox u
    SET status = 'PROCESSING',
        locked_by = p_worker_id,
        locked_at = v_now,
        lease_expires_at = v_lease_expiry,
        updated_at = v_now
    FROM candidate_batch c
    WHERE u.id = c.id
    RETURNING u.*;
END;
$$;
