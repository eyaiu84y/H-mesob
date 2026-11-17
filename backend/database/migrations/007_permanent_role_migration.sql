-- ============================================================================
-- Migration 007: Permanent System-Wide Role Migration
-- CITIZEN -> CUSTOMER and ICT_STAFF -> TECHNICIAN
-- Hawassa Mesob Public Service Management Information System
-- 
-- Official 6 System Roles:
-- 1. SUPER_ADMIN
-- 2. MESOB_MANAGER
-- 3. INSTITUTION_MANAGER
-- 4. EMPLOYEE
-- 5. TECHNICIAN
-- 6. CUSTOMER
-- ============================================================================

-- ============================================================================
-- PART 1: POSTGRESQL ENUM DDL EXTENSION
-- NOTE: In PostgreSQL, ALTER TYPE ... ADD VALUE cannot be executed inside a
-- multi-statement transaction with queries that immediately consume the new enum values.
-- Execute Part 1 first in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/afsaruutbrnnmonciiga/sql/new
-- ============================================================================
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'CUSTOMER';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'TECHNICIAN';

-- ============================================================================
-- PART 2: TRANSACTIONAL ROW MIGRATION, CONSTRAINTS & SECURITY POLICIES
-- Execute Part 2 after Part 1 is committed.
-- ============================================================================
BEGIN;

-- ----------------------------------------------------------------------------
-- 1. MIGRATE USER DATA (Preserving all IDs, passwords, metadata, and foreign keys)
-- ----------------------------------------------------------------------------
UPDATE users
SET role = 'CUSTOMER',
    updated_at = NOW()
WHERE role = 'CITIZEN';

UPDATE users
SET role = 'TECHNICIAN',
    updated_at = NOW()
WHERE role = 'ICT_STAFF';

-- ----------------------------------------------------------------------------
-- 2. MIGRATE ANNOUNCEMENT TARGET ROLES ARRAYS
-- ----------------------------------------------------------------------------
UPDATE announcements
SET target_roles = array_replace(target_roles, 'CITIZEN'::user_role, 'CUSTOMER'::user_role)
WHERE 'CITIZEN' = ANY(target_roles);

UPDATE announcements
SET target_roles = array_replace(target_roles, 'ICT_STAFF'::user_role, 'TECHNICIAN'::user_role)
WHERE 'ICT_STAFF' = ANY(target_roles);

-- ----------------------------------------------------------------------------
-- 3. PREVENT RE-INTRODUCTION OF RETIRED ROLES (ZERO-LEGACY ENFORCEMENT)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_prevent_retired_roles()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role::text IN ('CITIZEN', 'ICT_STAFF') THEN
    RAISE EXCEPTION 'Database Constraint Violation: Retired role "%" cannot be assigned. Use official role CUSTOMER or TECHNICIAN.', NEW.role::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_block_legacy_roles ON users;
CREATE TRIGGER trg_block_legacy_roles
  BEFORE INSERT OR UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION trg_prevent_retired_roles();

-- ----------------------------------------------------------------------------
-- 4. APPLICATION ASSIGNEE CONSTRAINT TRIGGER (EMPLOYEE ONLY)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_enforce_application_assignee_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM users WHERE id = NEW.assigned_to AND role = 'EMPLOYEE'
    ) THEN
      RAISE EXCEPTION 'Database Constraint Violation: Service applications can only be assigned to users with role EMPLOYEE. Customers and Technicians cannot receive application assignments.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_application_assignee ON applications;
CREATE TRIGGER check_application_assignee
  BEFORE INSERT OR UPDATE OF assigned_to ON applications
  FOR EACH ROW
  EXECUTE FUNCTION trg_enforce_application_assignee_role();

-- ----------------------------------------------------------------------------
-- 5. MAINTENANCE ASSIGNEE CONSTRAINT TRIGGER (TECHNICIAN ONLY)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_enforce_maintenance_assignee_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM users WHERE id = NEW.assigned_to AND role = 'TECHNICIAN'
    ) THEN
      RAISE EXCEPTION 'Database Constraint Violation: Maintenance tasks can only be assigned to TECHNICIAN. Customers and Employees cannot receive maintenance assignments.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_maintenance_report_assignee ON maintenance_reports;
CREATE TRIGGER check_maintenance_report_assignee
  BEFORE INSERT OR UPDATE OF assigned_to ON maintenance_reports
  FOR EACH ROW
  EXECUTE FUNCTION trg_enforce_maintenance_assignee_role();

DROP TRIGGER IF EXISTS check_maintenance_task_assignee ON maintenance_tasks;
CREATE TRIGGER check_maintenance_task_assignee
  BEFORE INSERT OR UPDATE OF assigned_to ON maintenance_tasks
  FOR EACH ROW
  EXECUTE FUNCTION trg_enforce_maintenance_assignee_role();

-- ----------------------------------------------------------------------------
-- 6. UPDATE RLS POLICIES (STRICT ZERO-LEGACY AUTHORIZATION)
-- ----------------------------------------------------------------------------

-- A. Applications
DROP POLICY IF EXISTS "citizen_manage_own_applications" ON applications;
DROP POLICY IF EXISTS "customer_manage_own_applications" ON applications;
CREATE POLICY "customer_manage_own_applications" ON applications
  FOR ALL
  USING (
    public.current_user_role() = 'CUSTOMER'
    AND citizen_id = public.get_current_user_id()
  );

-- B. Queue Entries
DROP POLICY IF EXISTS "citizen_view_own_queue_entries" ON queue_entries;
DROP POLICY IF EXISTS "customer_view_own_queue_entries" ON queue_entries;
CREATE POLICY "customer_view_own_queue_entries" ON queue_entries
  FOR SELECT
  USING (
    public.current_user_role() = 'CUSTOMER'
    AND citizen_id = public.get_current_user_id()
  );

-- C. Maintenance Reports
DROP POLICY IF EXISTS "employee_create_maintenance_reports" ON maintenance_reports;
CREATE POLICY "employee_create_maintenance_reports" ON maintenance_reports
  FOR INSERT
  WITH CHECK (
    public.current_user_role() IN ('EMPLOYEE', 'INSTITUTION_MANAGER', 'TECHNICIAN')
    AND institution_id = public.current_user_institution()
  );

DROP POLICY IF EXISTS "ict_view_assigned_maintenance" ON maintenance_reports;
DROP POLICY IF EXISTS "technician_view_assigned_maintenance" ON maintenance_reports;
CREATE POLICY "technician_view_assigned_maintenance" ON maintenance_reports
  FOR SELECT
  USING (
    public.current_user_role() = 'TECHNICIAN'
    AND (assigned_to = public.get_current_user_id() OR assigned_to IS NULL)
  );

DROP POLICY IF EXISTS "ict_update_assigned_maintenance" ON maintenance_reports;
DROP POLICY IF EXISTS "technician_update_assigned_maintenance" ON maintenance_reports;
CREATE POLICY "technician_update_assigned_maintenance" ON maintenance_reports
  FOR UPDATE
  USING (
    public.current_user_role() = 'TECHNICIAN'
    AND assigned_to = public.get_current_user_id()
  );

-- D. Maintenance Attachments
DROP POLICY IF EXISTS "view_maintenance_attachments" ON maintenance_attachments;
CREATE POLICY "view_maintenance_attachments" ON maintenance_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_reports mr
      WHERE mr.id = maintenance_attachments.maintenance_report_id
      AND (
        (public.current_user_role() IN ('EMPLOYEE', 'INSTITUTION_MANAGER') 
         AND mr.institution_id = public.current_user_institution())
        OR
        (public.current_user_role() = 'TECHNICIAN' 
         AND mr.assigned_to = public.get_current_user_id())
        OR
        public.current_user_role() = 'MESOB_MANAGER'
        OR
        public.current_user_role() = 'SUPER_ADMIN'
      )
    )
  );

-- E. Maintenance Tasks
DROP POLICY IF EXISTS "view_maintenance_tasks" ON maintenance_tasks;
CREATE POLICY "view_maintenance_tasks" ON maintenance_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_reports mr
      WHERE mr.id = maintenance_tasks.maintenance_report_id
      AND (
        (public.current_user_role() IN ('EMPLOYEE', 'INSTITUTION_MANAGER') 
         AND mr.institution_id = public.current_user_institution())
        OR
        (public.current_user_role() = 'TECHNICIAN' 
         AND mr.assigned_to = public.get_current_user_id())
        OR
        public.current_user_role() = 'MESOB_MANAGER'
        OR
        public.current_user_role() = 'SUPER_ADMIN'
      )
    )
  );

DROP POLICY IF EXISTS "ict_manage_own_tasks" ON maintenance_tasks;
DROP POLICY IF EXISTS "technician_manage_own_tasks" ON maintenance_tasks;
CREATE POLICY "technician_manage_own_tasks" ON maintenance_tasks
  FOR ALL
  USING (
    public.current_user_role() = 'TECHNICIAN'
    AND EXISTS (
      SELECT 1 FROM maintenance_reports mr
      WHERE mr.id = maintenance_tasks.maintenance_report_id
      AND mr.assigned_to = public.get_current_user_id()
    )
  );

-- F. Service Feedback
DROP POLICY IF EXISTS "feedback_citizen_insert" ON service_feedback;
DROP POLICY IF EXISTS "feedback_customer_insert" ON service_feedback;
CREATE POLICY "feedback_customer_insert" ON service_feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'CUSTOMER'
    )
    AND citizen_id = auth.uid()
  );

DROP POLICY IF EXISTS "feedback_citizen_select" ON service_feedback;
DROP POLICY IF EXISTS "feedback_customer_select" ON service_feedback;
CREATE POLICY "feedback_customer_select" ON service_feedback
  FOR SELECT TO authenticated
  USING (
    (citizen_id = auth.uid() AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'CUSTOMER'
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
