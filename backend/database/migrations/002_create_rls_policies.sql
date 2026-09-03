-- ============================================================================
-- Row Level Security (RLS) Policies
-- Version: 1.0.0
-- Description: Security policies for Supabase tables
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper Function: Get Current User ID from JWT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_id() 
RETURNS UUID AS $$
  SELECT NULLIF(
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'sub',
      current_setting('request.jwt.claim.sub', true)
    ),
    ''
  )::uuid;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- Helper Function: Get Current User Role
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_user_role() 
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = public.get_current_user_id();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- Helper Function: Get Current User Institution
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_user_institution() 
RETURNS UUID AS $$
  SELECT institution_id FROM users WHERE id = public.get_current_user_id();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Super Admin can do everything with users
DROP POLICY IF EXISTS "super_admin_all_users" ON users;
CREATE POLICY "super_admin_all_users" ON users
  FOR ALL
  USING (public.current_user_role() = 'SUPER_ADMIN');

-- MESOB Manager can view all users
DROP POLICY IF EXISTS "mesob_manager_view_users" ON users;
CREATE POLICY "mesob_manager_view_users" ON users
  FOR SELECT
  USING (public.current_user_role() = 'MESOB_MANAGER');

-- Institution Manager can view users in their institution
DROP POLICY IF EXISTS "institution_manager_view_own_institution_users" ON users;
CREATE POLICY "institution_manager_view_own_institution_users" ON users
  FOR SELECT
  USING (
    public.current_user_role() = 'INSTITUTION_MANAGER' 
    AND institution_id = public.current_user_institution()
  );

-- Users can view their own profile
DROP POLICY IF EXISTS "users_view_own_profile" ON users;
CREATE POLICY "users_view_own_profile" ON users
  FOR SELECT
  USING (id = public.get_current_user_id());

-- Users can update their own profile (limited fields)
DROP POLICY IF EXISTS "users_update_own_profile" ON users;
CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE
  USING (id = public.get_current_user_id());

-- ============================================================================
-- INSTITUTIONS TABLE POLICIES
-- ============================================================================

-- Everyone can view active institutions
DROP POLICY IF EXISTS "public_view_active_institutions" ON institutions;
CREATE POLICY "public_view_active_institutions" ON institutions
  FOR SELECT
  USING (status = 'ACTIVE');

-- Super Admin can manage institutions
DROP POLICY IF EXISTS "super_admin_all_institutions" ON institutions;
CREATE POLICY "super_admin_all_institutions" ON institutions
  FOR ALL
  USING (public.current_user_role() = 'SUPER_ADMIN');

-- ============================================================================
-- SERVICES TABLE POLICIES
-- ============================================================================

-- Everyone can view active services
DROP POLICY IF EXISTS "public_view_active_services" ON services;
CREATE POLICY "public_view_active_services" ON services
  FOR SELECT
  USING (is_active = TRUE);

-- Super Admin can manage all services
DROP POLICY IF EXISTS "super_admin_all_services" ON services;
CREATE POLICY "super_admin_all_services" ON services
  FOR ALL
  USING (public.current_user_role() = 'SUPER_ADMIN');

-- Institution Manager can manage their institution's services
DROP POLICY IF EXISTS "institution_manager_manage_own_services" ON services;
CREATE POLICY "institution_manager_manage_own_services" ON services
  FOR ALL
  USING (
    public.current_user_role() = 'INSTITUTION_MANAGER' 
    AND institution_id = public.current_user_institution()
  );

-- ============================================================================
-- SERVICE REQUIREMENTS TABLE POLICIES
-- ============================================================================

-- Everyone can view service requirements
DROP POLICY IF EXISTS "public_view_service_requirements" ON service_requirements;
CREATE POLICY "public_view_service_requirements" ON service_requirements
  FOR SELECT
  USING (TRUE);

-- Super Admin can manage all service requirements
DROP POLICY IF EXISTS "super_admin_all_service_requirements" ON service_requirements;
CREATE POLICY "super_admin_all_service_requirements" ON service_requirements
  FOR ALL
  USING (public.current_user_role() = 'SUPER_ADMIN');

-- Institution Manager can manage their institution's service requirements
DROP POLICY IF EXISTS "institution_manager_manage_own_service_requirements" ON service_requirements;
CREATE POLICY "institution_manager_manage_own_service_requirements" ON service_requirements
  FOR ALL
  USING (
    public.current_user_role() = 'INSTITUTION_MANAGER' 
    AND EXISTS (
      SELECT 1 FROM services 
      WHERE services.id = service_requirements.service_id 
      AND services.institution_id = public.current_user_institution()
    )
  );

-- ============================================================================
-- APPLICATIONS TABLE POLICIES
-- ============================================================================

-- Citizens can view and manage their own applications
DROP POLICY IF EXISTS "citizen_manage_own_applications" ON applications;
CREATE POLICY "citizen_manage_own_applications" ON applications
  FOR ALL
  USING (
    public.current_user_role() = 'CITIZEN' 
    AND citizen_id = public.get_current_user_id()
  );

-- Employees can view applications for their institution
DROP POLICY IF EXISTS "employee_view_institution_applications" ON applications;
CREATE POLICY "employee_view_institution_applications" ON applications
  FOR SELECT
  USING (
    public.current_user_role() IN ('EMPLOYEE', 'INSTITUTION_MANAGER') 
    AND institution_id = public.current_user_institution()
  );

-- Employees can update applications assigned to them
DROP POLICY IF EXISTS "employee_update_assigned_applications" ON applications;
CREATE POLICY "employee_update_assigned_applications" ON applications
  FOR UPDATE
  USING (
    public.current_user_role() = 'EMPLOYEE' 
    AND assigned_to = public.get_current_user_id()
  );

-- MESOB Manager can view all applications
DROP POLICY IF EXISTS "mesob_manager_view_all_applications" ON applications;
CREATE POLICY "mesob_manager_view_all_applications" ON applications
  FOR SELECT
  USING (public.current_user_role() = 'MESOB_MANAGER');

-- Super Admin can manage all applications
DROP POLICY IF EXISTS "super_admin_all_applications" ON applications;
CREATE POLICY "super_admin_all_applications" ON applications
  FOR ALL
  USING (public.current_user_role() = 'SUPER_ADMIN');

-- ============================================================================
-- QUEUE ENTRIES TABLE POLICIES
-- ============================================================================

-- Citizens can view their own queue entries
DROP POLICY IF EXISTS "citizen_view_own_queue_entries" ON queue_entries;
CREATE POLICY "citizen_view_own_queue_entries" ON queue_entries
  FOR SELECT
  USING (
    public.current_user_role() = 'CITIZEN' 
    AND citizen_id = public.get_current_user_id()
  );

-- Employees can view and manage queue entries for their institution
DROP POLICY IF EXISTS "employee_manage_institution_queue" ON queue_entries;
CREATE POLICY "employee_manage_institution_queue" ON queue_entries
  FOR ALL
  USING (
    public.current_user_role() IN ('EMPLOYEE', 'INSTITUTION_MANAGER') 
    AND institution_id = public.current_user_institution()
  );

-- MESOB Manager can view all queue entries
DROP POLICY IF EXISTS "mesob_manager_view_all_queue_entries" ON queue_entries;
CREATE POLICY "mesob_manager_view_all_queue_entries" ON queue_entries
  FOR SELECT
  USING (public.current_user_role() = 'MESOB_MANAGER');

-- Super Admin can manage all queue entries
DROP POLICY IF EXISTS "super_admin_all_queue_entries" ON queue_entries;
CREATE POLICY "super_admin_all_queue_entries" ON queue_entries
  FOR ALL
  USING (public.current_user_role() = 'SUPER_ADMIN');

-- ============================================================================
-- MAINTENANCE REPORTS TABLE POLICIES
-- ============================================================================

-- Employees can create maintenance reports for their institution
DROP POLICY IF EXISTS "employee_create_maintenance_reports" ON maintenance_reports;
CREATE POLICY "employee_create_maintenance_reports" ON maintenance_reports
  FOR INSERT
  WITH CHECK (
    public.current_user_role() IN ('EMPLOYEE', 'INSTITUTION_MANAGER', 'ICT_STAFF') 
    AND institution_id = public.current_user_institution()
  );

-- Employees can view maintenance reports for their institution
DROP POLICY IF EXISTS "employee_view_institution_maintenance" ON maintenance_reports;
CREATE POLICY "employee_view_institution_maintenance" ON maintenance_reports
  FOR SELECT
  USING (
    public.current_user_role() IN ('EMPLOYEE', 'INSTITUTION_MANAGER') 
    AND institution_id = public.current_user_institution()
  );

-- ICT Staff can view and manage maintenance reports assigned to them
DROP POLICY IF EXISTS "ict_view_assigned_maintenance" ON maintenance_reports;
CREATE POLICY "ict_view_assigned_maintenance" ON maintenance_reports
  FOR SELECT
  USING (
    public.current_user_role() = 'ICT_STAFF' 
    AND (assigned_to = public.get_current_user_id() OR assigned_to IS NULL)
  );

DROP POLICY IF EXISTS "ict_update_assigned_maintenance" ON maintenance_reports;
CREATE POLICY "ict_update_assigned_maintenance" ON maintenance_reports
  FOR UPDATE
  USING (
    public.current_user_role() = 'ICT_STAFF' 
    AND assigned_to = public.get_current_user_id()
  );

-- MESOB Manager can view all maintenance reports
DROP POLICY IF EXISTS "mesob_manager_view_all_maintenance" ON maintenance_reports;
CREATE POLICY "mesob_manager_view_all_maintenance" ON maintenance_reports
  FOR SELECT
  USING (public.current_user_role() = 'MESOB_MANAGER');

-- Super Admin can manage all maintenance reports
DROP POLICY IF EXISTS "super_admin_all_maintenance_reports" ON maintenance_reports;
CREATE POLICY "super_admin_all_maintenance_reports" ON maintenance_reports
  FOR ALL
  USING (public.current_user_role() = 'SUPER_ADMIN');

-- ============================================================================
-- MAINTENANCE ATTACHMENTS TABLE POLICIES
-- ============================================================================

-- Users can view attachments for maintenance reports they have access to
DROP POLICY IF EXISTS "view_maintenance_attachments" ON maintenance_attachments;
CREATE POLICY "view_maintenance_attachments" ON maintenance_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_reports mr
      WHERE mr.id = maintenance_attachments.maintenance_report_id
      AND (
        -- Employee from same institution
        (public.current_user_role() IN ('EMPLOYEE', 'INSTITUTION_MANAGER') 
         AND mr.institution_id = public.current_user_institution())
        OR
        -- Assigned ICT Staff
        (public.current_user_role() = 'ICT_STAFF' AND mr.assigned_to = public.get_current_user_id())
        OR
        -- MESOB Manager
        public.current_user_role() = 'MESOB_MANAGER'
        OR
        -- Super Admin
        public.current_user_role() = 'SUPER_ADMIN'
      )
    )
  );

-- Users can add attachments to maintenance reports they created or are assigned to
DROP POLICY IF EXISTS "insert_maintenance_attachments" ON maintenance_attachments;
CREATE POLICY "insert_maintenance_attachments" ON maintenance_attachments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM maintenance_reports mr
      WHERE mr.id = maintenance_attachments.maintenance_report_id
      AND (
        mr.reported_by = public.get_current_user_id() 
        OR mr.assigned_to = public.get_current_user_id()
        OR public.current_user_role() = 'SUPER_ADMIN'
      )
    )
  );

-- ============================================================================
-- MAINTENANCE TASKS TABLE POLICIES
-- ============================================================================

-- View tasks for accessible maintenance reports
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
        (public.current_user_role() = 'ICT_STAFF' AND mr.assigned_to = public.get_current_user_id())
        OR
        public.current_user_role() = 'MESOB_MANAGER'
        OR
        public.current_user_role() = 'SUPER_ADMIN'
      )
    )
  );

-- ICT Staff can manage tasks for their assigned maintenance reports
DROP POLICY IF EXISTS "ict_manage_own_tasks" ON maintenance_tasks;
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

-- Super Admin can manage all tasks
DROP POLICY IF EXISTS "super_admin_all_maintenance_tasks" ON maintenance_tasks;
CREATE POLICY "super_admin_all_maintenance_tasks" ON maintenance_tasks
  FOR ALL
  USING (public.current_user_role() = 'SUPER_ADMIN');

-- ============================================================================
-- ANNOUNCEMENTS TABLE POLICIES
-- ============================================================================

-- Everyone can view active announcements (based on scope and role)
DROP POLICY IF EXISTS "view_active_announcements" ON announcements;
CREATE POLICY "view_active_announcements" ON announcements
  FOR SELECT
  USING (
    is_active = TRUE 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (
      scope = 'PUBLIC'
      OR scope = 'SYSTEM'
      OR (scope = 'INSTITUTION' AND institution_id = public.current_user_institution())
      OR (scope = 'ROLE' AND public.current_user_role() = ANY(target_roles))
    )
  );

-- Super Admin can manage all announcements
DROP POLICY IF EXISTS "super_admin_all_announcements" ON announcements;
CREATE POLICY "super_admin_all_announcements" ON announcements
  FOR ALL
  USING (public.current_user_role() = 'SUPER_ADMIN');

-- MESOB Manager can create system announcements
DROP POLICY IF EXISTS "mesob_manager_create_system_announcements" ON announcements;
CREATE POLICY "mesob_manager_create_system_announcements" ON announcements
  FOR INSERT
  WITH CHECK (
    public.current_user_role() = 'MESOB_MANAGER' 
    AND scope = 'SYSTEM'
  );

-- Institution Manager can create announcements for their institution
DROP POLICY IF EXISTS "institution_manager_create_announcements" ON announcements;
CREATE POLICY "institution_manager_create_announcements" ON announcements
  FOR INSERT
  WITH CHECK (
    public.current_user_role() = 'INSTITUTION_MANAGER' 
    AND scope = 'INSTITUTION'
    AND institution_id = public.current_user_institution()
  );

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own notifications
DROP POLICY IF EXISTS "users_view_own_notifications" ON notifications;
CREATE POLICY "users_view_own_notifications" ON notifications
  FOR SELECT
  USING (recipient_id = public.get_current_user_id());

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;
CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE
  USING (recipient_id = public.get_current_user_id());

-- Users can delete their own notifications
DROP POLICY IF EXISTS "users_delete_own_notifications" ON notifications;
CREATE POLICY "users_delete_own_notifications" ON notifications
  FOR DELETE
  USING (recipient_id = public.get_current_user_id());

-- System can create notifications (service role only)
-- This will be handled by backend service role, not via RLS

-- ============================================================================
-- TELEGRAM USERS TABLE POLICIES
-- ============================================================================

-- Users can view and manage their own Telegram link
DROP POLICY IF EXISTS "users_manage_own_telegram" ON telegram_users;
CREATE POLICY "users_manage_own_telegram" ON telegram_users
  FOR ALL
  USING (user_id = public.get_current_user_id());

-- Super Admin can view all Telegram links
DROP POLICY IF EXISTS "super_admin_view_all_telegram_users" ON telegram_users;
CREATE POLICY "super_admin_view_all_telegram_users" ON telegram_users
  FOR SELECT
  USING (public.current_user_role() = 'SUPER_ADMIN');

-- ============================================================================
-- END OF RLS POLICIES
-- ============================================================================
