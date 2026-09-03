-- ============================================================================
-- Production Database Enhancements
-- Version: 1.1.0
-- Description: Add audit logging, password reset, and session management
-- ============================================================================

-- ============================================================================
-- TABLE: audit_logs
-- Description: Track all user actions for security and compliance
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,  -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', etc.
  entity_type VARCHAR(50),      -- 'user', 'application', 'queue', 'maintenance', etc.
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

COMMENT ON TABLE audit_logs IS 'System audit trail for all user actions';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity affected';
COMMENT ON COLUMN audit_logs.old_value IS 'Previous state (for updates/deletes)';
COMMENT ON COLUMN audit_logs.new_value IS 'New state (for creates/updates)';

-- ============================================================================
-- TABLE: password_reset_tokens
-- Description: Secure password reset workflow
-- ============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE NOT NULL,
  used_at TIMESTAMPTZ,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for password_reset_tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

COMMENT ON TABLE password_reset_tokens IS 'Tokens for secure password reset';
COMMENT ON COLUMN password_reset_tokens.token IS 'Secure random token (hashed)';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Token expiration time (typically 1 hour)';

-- ============================================================================
-- TABLE: email_verification_tokens
-- Description: Email verification for new user accounts
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for email_verification_tokens
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);

COMMENT ON TABLE email_verification_tokens IS 'Email verification tokens for new users';

-- ============================================================================
-- TABLE: user_sessions
-- Description: Track active user sessions for security
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,  -- Hashed JWT
  refresh_token_hash VARCHAR(255) UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  revoked_at TIMESTAMPTZ
);

-- Indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity_at ON user_sessions(last_activity_at DESC);

COMMENT ON TABLE user_sessions IS 'Active user sessions for multi-device login tracking';
COMMENT ON COLUMN user_sessions.token_hash IS 'Hashed JWT token for security';
COMMENT ON COLUMN user_sessions.is_active IS 'Session active status (can be revoked)';

-- ============================================================================
-- TABLE: failed_login_attempts
-- Description: Track failed login attempts for security
-- ============================================================================

CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for failed_login_attempts
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip_address ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_attempted_at ON failed_login_attempts(attempted_at DESC);

COMMENT ON TABLE failed_login_attempts IS 'Failed login attempts for brute force protection';

-- ============================================================================
-- ENHANCED USER TABLE
-- Add email verification and account lockout fields
-- ============================================================================

-- Add email verification field if not exists
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE NOT NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Add account lockout fields
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0 NOT NULL;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE users ADD COLUMN locked_until TIMESTAMPTZ;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMPTZ;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Add indexes for new user fields
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);

COMMENT ON COLUMN users.email_verified IS 'Whether user has verified their email address';
COMMENT ON COLUMN users.failed_login_attempts IS 'Count of consecutive failed login attempts';
COMMENT ON COLUMN users.locked_until IS 'Account locked until this timestamp (NULL = not locked)';
COMMENT ON COLUMN users.password_changed_at IS 'Last password change timestamp';

-- ============================================================================
-- FUNCTION: Log Audit Event
-- ============================================================================

CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action VARCHAR,
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id, action, entity_type, entity_id,
    old_value, new_value, ip_address, user_agent,
    success, error_message
  ) VALUES (
    p_user_id, p_action, p_entity_type, p_entity_id,
    p_old_value, p_new_value, p_ip_address, p_user_agent,
    p_success, p_error_message
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_audit_event IS 'Create an audit log entry';

-- ============================================================================
-- FUNCTION: Check Account Lockout
-- ============================================================================

CREATE OR REPLACE FUNCTION check_account_lockout(p_email VARCHAR)
RETURNS TABLE (
  is_locked BOOLEAN,
  locked_until TIMESTAMPTZ,
  failed_attempts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN u.locked_until IS NOT NULL AND u.locked_until > NOW() THEN TRUE
      ELSE FALSE
    END AS is_locked,
    u.locked_until,
    u.failed_login_attempts
  FROM users u
  WHERE u.email = p_email;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION check_account_lockout IS 'Check if user account is locked due to failed login attempts';

-- ============================================================================
-- FUNCTION: Record Failed Login Attempt
-- ============================================================================

CREATE OR REPLACE FUNCTION record_failed_login(
  p_email VARCHAR,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_failed_attempts INTEGER;
  v_max_attempts INTEGER := 5;  -- Lock account after 5 failed attempts
  v_lockout_duration INTERVAL := '30 minutes';
BEGIN
  -- Record failed attempt
  INSERT INTO failed_login_attempts (email, ip_address, user_agent)
  VALUES (p_email, p_ip_address, p_user_agent);
  
  -- Update user's failed attempt count
  UPDATE users 
  SET failed_login_attempts = failed_login_attempts + 1
  WHERE email = p_email
  RETURNING id, failed_login_attempts INTO v_user_id, v_failed_attempts;
  
  -- Lock account if max attempts reached
  IF v_failed_attempts >= v_max_attempts THEN
    UPDATE users
    SET 
      locked_until = NOW() + v_lockout_duration,
      status = 'SUSPENDED'
    WHERE id = v_user_id;
    
    -- Log the lockout
    PERFORM log_audit_event(
      v_user_id,
      'ACCOUNT_LOCKED',
      'user',
      v_user_id,
      NULL,
      jsonb_build_object('reason', 'max_failed_attempts', 'locked_until', NOW() + v_lockout_duration),
      p_ip_address,
      p_user_agent,
      TRUE,
      NULL
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION record_failed_login IS 'Record failed login attempt and lock account if needed';

-- ============================================================================
-- FUNCTION: Reset Failed Login Attempts
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_failed_login_attempts(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET 
    failed_login_attempts = 0,
    locked_until = NULL,
    status = CASE 
      WHEN status = 'SUSPENDED' AND locked_until IS NOT NULL THEN 'ACTIVE'
      ELSE status
    END
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reset_failed_login_attempts IS 'Reset failed login attempts on successful login';

-- ============================================================================
-- FUNCTION: Clean Expired Tokens
-- ============================================================================

CREATE OR REPLACE FUNCTION clean_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- Delete expired password reset tokens
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW() AND used = FALSE;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  -- Delete expired email verification tokens
  DELETE FROM email_verification_tokens
  WHERE expires_at < NOW() AND verified = FALSE;
  
  -- Delete expired sessions
  DELETE FROM user_sessions
  WHERE expires_at < NOW();
  
  -- Clean old failed login attempts (keep last 7 days)
  DELETE FROM failed_login_attempts
  WHERE attempted_at < NOW() - INTERVAL '7 days';
  
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION clean_expired_tokens IS 'Clean up expired tokens and old records';

-- ============================================================================
-- FUNCTION: Get User Login Statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_login_stats(p_user_id UUID)
RETURNS TABLE (
  total_sessions INTEGER,
  active_sessions INTEGER,
  last_login TIMESTAMPTZ,
  failed_attempts INTEGER,
  is_locked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM user_sessions WHERE user_id = p_user_id) AS total_sessions,
    (SELECT COUNT(*)::INTEGER FROM user_sessions WHERE user_id = p_user_id AND is_active = TRUE AND expires_at > NOW()) AS active_sessions,
    u.last_login_at,
    u.failed_login_attempts,
    CASE 
      WHEN u.locked_until IS NOT NULL AND u.locked_until > NOW() THEN TRUE
      ELSE FALSE
    END AS is_locked
  FROM users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_user_login_stats IS 'Get user login statistics and security status';

-- ============================================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Audit logs: Only SUPER_ADMIN and MESOB_MANAGER can view
DROP POLICY IF EXISTS "admin_view_audit_logs" ON audit_logs;
CREATE POLICY "admin_view_audit_logs" ON audit_logs
  FOR SELECT
  USING (
    public.current_user_role() IN ('SUPER_ADMIN', 'MESOB_MANAGER')
  );

-- Users can view their own audit logs
DROP POLICY IF EXISTS "users_view_own_audit_logs" ON audit_logs;
CREATE POLICY "users_view_own_audit_logs" ON audit_logs
  FOR SELECT
  USING (user_id = public.get_current_user_id());

-- Password reset tokens: Users can view their own
DROP POLICY IF EXISTS "users_view_own_reset_tokens" ON password_reset_tokens;
CREATE POLICY "users_view_own_reset_tokens" ON password_reset_tokens
  FOR SELECT
  USING (user_id = public.get_current_user_id());

-- Email verification tokens: Users can view their own
DROP POLICY IF EXISTS "users_view_own_verification_tokens" ON email_verification_tokens;
CREATE POLICY "users_view_own_verification_tokens" ON email_verification_tokens
  FOR SELECT
  USING (user_id = public.get_current_user_id());

-- User sessions: Users can view and delete their own sessions
DROP POLICY IF EXISTS "users_view_own_sessions" ON user_sessions;
CREATE POLICY "users_view_own_sessions" ON user_sessions
  FOR SELECT
  USING (user_id = public.get_current_user_id());

DROP POLICY IF EXISTS "users_delete_own_sessions" ON user_sessions;
CREATE POLICY "users_delete_own_sessions" ON user_sessions
  FOR DELETE
  USING (user_id = public.get_current_user_id());

-- Failed login attempts: Only admins can view
DROP POLICY IF EXISTS "admin_view_failed_logins" ON failed_login_attempts;
CREATE POLICY "admin_view_failed_logins" ON failed_login_attempts
  FOR SELECT
  USING (
    public.current_user_role() IN ('SUPER_ADMIN', 'MESOB_MANAGER')
  );

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Ensure password reset tokens expire within reasonable time
ALTER TABLE password_reset_tokens 
  ADD CONSTRAINT check_reset_token_expiry 
  CHECK (expires_at > created_at AND expires_at <= created_at + INTERVAL '24 hours');

-- Ensure email verification tokens expire within reasonable time
ALTER TABLE email_verification_tokens 
  ADD CONSTRAINT check_verification_token_expiry 
  CHECK (expires_at > created_at AND expires_at <= created_at + INTERVAL '7 days');

-- Ensure sessions have valid expiry
ALTER TABLE user_sessions 
  ADD CONSTRAINT check_session_expiry 
  CHECK (expires_at > created_at);

-- Ensure failed login attempts is non-negative
ALTER TABLE users 
  ADD CONSTRAINT check_failed_attempts_non_negative 
  CHECK (failed_login_attempts >= 0);

-- ============================================================================
-- INITIAL DATA CLEANUP
-- ============================================================================

-- Clean any expired data on migration
SELECT clean_expired_tokens();

-- ============================================================================
-- GRANTS FOR SERVICE ROLE
-- ============================================================================

-- Grant access to new tables (service role has full access)
GRANT ALL ON audit_logs TO service_role;
GRANT ALL ON password_reset_tokens TO service_role;
GRANT ALL ON email_verification_tokens TO service_role;
GRANT ALL ON user_sessions TO service_role;
GRANT ALL ON failed_login_attempts TO service_role;

-- Grant execute on new functions
GRANT EXECUTE ON FUNCTION log_audit_event TO service_role;
GRANT EXECUTE ON FUNCTION check_account_lockout TO service_role;
GRANT EXECUTE ON FUNCTION record_failed_login TO service_role;
GRANT EXECUTE ON FUNCTION reset_failed_login_attempts TO service_role;
GRANT EXECUTE ON FUNCTION clean_expired_tokens TO service_role;
GRANT EXECUTE ON FUNCTION get_user_login_stats TO service_role;

-- ============================================================================
-- END OF PRODUCTION ENHANCEMENTS
-- ============================================================================

