-- ============================================================================
-- SMS Logs Table
-- Description: Track all SMS notifications sent by the system
-- Date: 2026-10-09
-- ============================================================================

-- Create SMS Logs Table
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  phone_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'SUCCESS', 'FAILED', 'PENDING'
  provider_response JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON sms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON sms_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_at ON sms_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);

-- Enable RLS
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only admins can view SMS logs
DROP POLICY IF EXISTS "admin_view_sms_logs" ON sms_logs;
CREATE POLICY "admin_view_sms_logs" ON sms_logs
  FOR SELECT
  USING (
    public.current_user_role() IN ('SUPER_ADMIN', 'MESOB_MANAGER')
  );

-- Service role can insert SMS logs
DROP POLICY IF EXISTS "service_role_insert_sms_logs" ON sms_logs;
CREATE POLICY "service_role_insert_sms_logs" ON sms_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Grant permissions to service role
GRANT ALL ON sms_logs TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ SMS logs table created successfully';
END $$;
