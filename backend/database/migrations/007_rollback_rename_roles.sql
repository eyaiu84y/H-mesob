-- ============================================================================
-- Rollback for Migration 007: Revert CUSTOMER -> CITIZEN and TECHNICIAN -> ICT_STAFF
-- Version: 1.0.7-rollback
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. REVERT USER ROLES
-- ----------------------------------------------------------------------------
UPDATE users
SET role = 'CITIZEN',
    updated_at = NOW()
WHERE role = 'CUSTOMER';

UPDATE users
SET role = 'ICT_STAFF',
    updated_at = NOW()
WHERE role = 'TECHNICIAN';

-- ----------------------------------------------------------------------------
-- 2. REVERT ANNOUNCEMENT TARGET ROLES ARRAYS
-- ----------------------------------------------------------------------------
UPDATE announcements
SET target_roles = array_replace(target_roles, 'CUSTOMER'::user_role, 'CITIZEN'::user_role)
WHERE 'CUSTOMER' = ANY(target_roles);

UPDATE announcements
SET target_roles = array_replace(target_roles, 'TECHNICIAN'::user_role, 'ICT_STAFF'::user_role)
WHERE 'TECHNICIAN' = ANY(target_roles);

-- ----------------------------------------------------------------------------
-- 3. REMOVE ASSIGNEE TRIGGERS
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS check_application_assignee ON applications;
DROP FUNCTION IF EXISTS trg_enforce_application_assignee_role();

DROP TRIGGER IF EXISTS check_maintenance_report_assignee ON maintenance_reports;
DROP TRIGGER IF EXISTS check_maintenance_task_assignee ON maintenance_tasks;
DROP FUNCTION IF EXISTS trg_enforce_maintenance_assignee_role();

-- ----------------------------------------------------------------------------
-- 4. REVERT RLS POLICIES TO ORIGINAL CITIZEN / ICT_STAFF
-- ----------------------------------------------------------------------------

-- A. Applications
DROP POLICY IF EXISTS "customer_manage_own_applications" ON applications;
CREATE POLICY "citizen_manage_own_applications" ON applications
  FOR ALL
  USING (
    public.current_user_role() = 'CITIZEN'
    AND citizen_id = public.get_current_user_id()
  );

-- B. Queue Entries
DROP POLICY IF EXISTS "customer_view_own_queue_entries" ON queue_entries;
CREATE POLICY "citizen_view_own_queue_entries" ON queue_entries
  FOR SELECT
  USING (
    public.current_user_role() = 'CITIZEN'
    AND citizen_id = public.get_current_user_id()
  );

-- C. Maintenance Reports
DROP POLICY IF EXISTS "technician_view_assigned_maintenance" ON maintenance_reports;
CREATE POLICY "ict_view_assigned_maintenance" ON maintenance_reports
  FOR SELECT
  USING (
    public.current_user_role() = 'ICT_STAFF'
    AND (assigned_to = public.get_current_user_id() OR assigned_to IS NULL)
  );

DROP POLICY IF EXISTS "technician_update_assigned_maintenance" ON maintenance_reports;
CREATE POLICY "ict_update_assigned_maintenance" ON maintenance_reports
  FOR UPDATE
  USING (
    public.current_user_role() = 'ICT_STAFF'
    AND assigned_to = public.get_current_user_id()
  );

DROP POLICY IF EXISTS "employee_create_maintenance_reports" ON maintenance_reports;
CREATE POLICY "employee_create_maintenance_reports" ON maintenance_reports
  FOR INSERT
  WITH CHECK (
    public.current_user_role() IN ('EMPLOYEE', 'INSTITUTION_MANAGER', 'ICT_STAFF')
    AND institution_id = public.current_user_institution()
  );

-- D. Maintenance Tasks
DROP POLICY IF EXISTS "technician_manage_own_tasks" ON maintenance_tasks;
CREATE POLICY "ict_manage_own_tasks" ON maintenance_tasks
  FOR ALL
  USING (
    public.current_user_role() = 'ICT_STAFF'
    AND EXISTS (
      SELECT 1 FROM maintenance_reports mr
      WHERE mr.id = maintenance_tasks.maintenance_report_id
      AND mr.assigned_to = public.get_current_user_id()
    )
  );

-- E. Service Feedback
DROP POLICY IF EXISTS "feedback_customer_insert" ON service_feedback;
CREATE POLICY "feedback_citizen_insert" ON service_feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'CITIZEN'
    )
    AND citizen_id = auth.uid()
  );

DROP POLICY IF EXISTS "feedback_customer_select" ON service_feedback;
CREATE POLICY "feedback_citizen_select" ON service_feedback
  FOR SELECT TO authenticated
  USING (
    (citizen_id = auth.uid() AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'CITIZEN'
    ))
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('SUPER_ADMIN', 'MESOB_MANAGER')
    )
    OR (institution_id = (
      SELECT institution_id FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('INSTITUTION_MANAGER', 'EMPLOYEE')
    ))
  );

COMMIT;
