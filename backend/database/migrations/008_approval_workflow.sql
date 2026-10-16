-- ============================================================================
-- Migration: 008_approval_workflow.sql
-- Description: Centralized Approval Workflow for Institutions and User Accounts
-- Author: Hawassa Mesob System
-- Date: 2026-10-16
-- ============================================================================

-- Document the Approval Workflow Architecture:
-- 1. SUPER_ADMIN submits an institution or eligible user account (e.g. INSTITUTION_MANAGER).
-- 2. The record is created/saved with status = 'INACTIVE' and metadata->'approval' containing:
--    {
--      "status": "PENDING_APPROVAL",
--      "requested_by": "<super_admin_uuid>",
--      "requested_by_name": "Super Admin",
--      "requested_by_email": "superadmin@mesobcenter.et",
--      "submitted_at": "<timestamp>",
--      "history": [...]
--    }
-- 3. In-app notification with type 'SYSTEM_MESSAGE' is dispatched to MESOB_MANAGER.
-- 4. MESOB_MANAGER reviews the pending queue.
-- 5. Decision:
--    - If APPROVED:
--        Record status is set to 'ACTIVE'.
--        metadata->'approval'->>'status' is set to 'APPROVED'.
--        Decision notification dispatched to requesting SUPER_ADMIN.
--    - If REJECTED:
--        Record status remains 'INACTIVE'.
--        metadata->'approval'->>'status' is set to 'REJECTED'.
--        metadata->'approval'->>'rejection_reason' stores mandatory reason.
--        Decision notification with reason dispatched to requesting SUPER_ADMIN.

-- Indexes for efficient querying of approval queues by status
CREATE INDEX IF NOT EXISTS idx_institutions_approval_status 
  ON institutions USING btree (((metadata->'approval'->>'status')));

CREATE INDEX IF NOT EXISTS idx_users_approval_status 
  ON users USING btree (((metadata->'approval'->>'status')));

-- Audit logging comments for approval actions
COMMENT ON TABLE institutions IS 'Government institutions providing public services with central approval workflow';
COMMENT ON TABLE users IS 'System users across all 6 roles with central approval enforcement for eligible accounts';
