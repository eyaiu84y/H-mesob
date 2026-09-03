-- ============================================================================
-- SERVICE ROLE ACCESS POLICIES
-- ============================================================================
-- Since we cannot grant BYPASSRLS to service_role (it's reserved),
-- we need to create explicit policies that allow service_role full access
-- ============================================================================

-- Drop existing service_role policies if they exist
DROP POLICY IF EXISTS "service_role_all_institutions" ON institutions;
DROP POLICY IF EXISTS "service_role_all_users" ON users;
DROP POLICY IF EXISTS "service_role_all_services" ON services;
DROP POLICY IF EXISTS "service_role_all_service_requirements" ON service_requirements;
DROP POLICY IF EXISTS "service_role_all_applications" ON applications;
DROP POLICY IF EXISTS "service_role_all_queue_entries" ON queue_entries;
DROP POLICY IF EXISTS "service_role_all_maintenance_reports" ON maintenance_reports;
DROP POLICY IF EXISTS "service_role_all_maintenance_attachments" ON maintenance_attachments;
DROP POLICY IF EXISTS "service_role_all_maintenance_tasks" ON maintenance_tasks;
DROP POLICY IF EXISTS "service_role_all_announcements" ON announcements;
DROP POLICY IF EXISTS "service_role_all_notifications" ON notifications;
DROP POLICY IF EXISTS "service_role_all_telegram_users" ON telegram_users;

-- ============================================================================
-- GRANT SERVICE_ROLE FULL ACCESS TO ALL TABLES
-- ============================================================================

-- Institutions table
CREATE POLICY "service_role_all_institutions"
ON institutions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Users table
CREATE POLICY "service_role_all_users"
ON users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Services table
CREATE POLICY "service_role_all_services"
ON services
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Service requirements table
CREATE POLICY "service_role_all_service_requirements"
ON service_requirements
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Applications table
CREATE POLICY "service_role_all_applications"
ON applications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Queue entries table
CREATE POLICY "service_role_all_queue_entries"
ON queue_entries
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Maintenance reports table
CREATE POLICY "service_role_all_maintenance_reports"
ON maintenance_reports
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Maintenance attachments table
CREATE POLICY "service_role_all_maintenance_attachments"
ON maintenance_attachments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Maintenance tasks table
CREATE POLICY "service_role_all_maintenance_tasks"
ON maintenance_tasks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Announcements table
CREATE POLICY "service_role_all_announcements"
ON announcements
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Notifications table
CREATE POLICY "service_role_all_notifications"
ON notifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Telegram users table
CREATE POLICY "service_role_all_telegram_users"
ON telegram_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- VERIFY POLICIES WERE CREATED
-- ============================================================================

SELECT 
  tablename,
  policyname,
  'service_role' = ANY(roles::text[]) as applies_to_service_role,
  cmd as operation,
  CASE 
    WHEN qual = 'true' AND with_check = 'true' THEN '✅ Full Access'
    ELSE '⚠️ Limited Access'
  END as access_level
FROM pg_policies 
WHERE policyname LIKE 'service_role_all_%'
ORDER BY tablename;

-- Expected: 12 policies, all with "✅ Full Access"
