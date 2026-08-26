-- ============================================================================
-- Database Functions and Views
-- Version: 1.0.0
-- Description: Utility functions and views for the MESOB system
-- ============================================================================

-- ============================================================================
-- FUNCTION: Generate Application Number
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_application_number(
  p_institution_code VARCHAR,
  p_service_code VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
  v_year VARCHAR(4);
  v_count INTEGER;
  v_number VARCHAR(50);
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  
  -- Get count of applications for this service this year
  SELECT COUNT(*) + 1 INTO v_count
  FROM applications a
  JOIN services s ON s.id = a.service_id
  JOIN institutions i ON i.id = a.institution_id
  WHERE i.code = p_institution_code
  AND s.code = p_service_code
  AND EXTRACT(YEAR FROM a.created_at) = EXTRACT(YEAR FROM NOW());
  
  -- Format: INST-SVC-YYYY-0001
  v_number := UPPER(p_institution_code) || '-' || 
              UPPER(p_service_code) || '-' || 
              v_year || '-' || 
              LPAD(v_count::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Generate Queue Number
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_queue_number(
  p_institution_code VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
  v_year VARCHAR(4);
  v_count INTEGER;
  v_number VARCHAR(50);
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  
  -- Get count of queue entries for this institution this year
  SELECT COUNT(*) + 1 INTO v_count
  FROM queue_entries q
  JOIN institutions i ON i.id = q.institution_id
  WHERE i.code = p_institution_code
  AND EXTRACT(YEAR FROM q.created_at) = EXTRACT(YEAR FROM NOW());
  
  -- Format: INST-Q-YYYY-0001
  v_number := UPPER(p_institution_code) || '-Q-' || 
              v_year || '-' || 
              LPAD(v_count::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Generate Maintenance Report Number
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_maintenance_number() 
RETURNS VARCHAR AS $$
DECLARE
  v_year VARCHAR(4);
  v_count INTEGER;
  v_number VARCHAR(50);
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  
  -- Get count of maintenance reports this year
  SELECT COUNT(*) + 1 INTO v_count
  FROM maintenance_reports
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  -- Format: MAINT-YYYY-0001
  v_number := 'MAINT-' || v_year || '-' || LPAD(v_count::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEW: User Profile with Institution Details
-- ============================================================================

CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.phone,
  u.role,
  u.status,
  u.employee_id,
  u.profile_photo_url,
  u.national_id,
  u.created_at,
  u.last_login_at,
  i.id AS institution_id,
  i.code AS institution_code,
  i.name_en AS institution_name_en,
  i.name_am AS institution_name_am
FROM users u
LEFT JOIN institutions i ON i.id = u.institution_id;

-- ============================================================================
-- VIEW: Application Summary
-- ============================================================================

CREATE OR REPLACE VIEW application_summary AS
SELECT 
  a.id,
  a.application_number,
  a.status,
  a.created_at,
  a.submitted_at,
  a.completed_at,
  
  -- Citizen info
  c.id AS citizen_id,
  c.full_name AS citizen_name,
  c.email AS citizen_email,
  c.phone AS citizen_phone,
  
  -- Service info
  s.id AS service_id,
  s.title_en AS service_title_en,
  s.title_am AS service_title_am,
  s.processing_time,
  s.service_fee,
  
  -- Institution info
  i.id AS institution_id,
  i.code AS institution_code,
  i.name_en AS institution_name_en,
  i.name_am AS institution_name_am,
  
  -- Assignment info
  e.id AS assigned_employee_id,
  e.full_name AS assigned_employee_name
  
FROM applications a
JOIN users c ON c.id = a.citizen_id
JOIN services s ON s.id = a.service_id
JOIN institutions i ON i.id = a.institution_id
LEFT JOIN users e ON e.id = a.assigned_to;

-- ============================================================================
-- VIEW: Queue Statistics by Institution
-- ============================================================================

CREATE OR REPLACE VIEW queue_statistics AS
SELECT 
  i.id AS institution_id,
  i.code AS institution_code,
  i.name_en AS institution_name,
  COUNT(*) AS total_entries,
  COUNT(*) FILTER (WHERE q.status = 'PENDING') AS pending_count,
  COUNT(*) FILTER (WHERE q.status = 'IN_PROGRESS') AS in_progress_count,
  COUNT(*) FILTER (WHERE q.status = 'COMPLETED') AS completed_count,
  COUNT(*) FILTER (WHERE q.priority = 'URGENT') AS urgent_count,
  AVG(EXTRACT(EPOCH FROM (q.completed_at - q.created_at)) / 3600) 
    FILTER (WHERE q.status = 'COMPLETED') AS avg_completion_hours
FROM institutions i
LEFT JOIN queue_entries q ON q.institution_id = i.id
GROUP BY i.id, i.code, i.name_en;

-- ============================================================================
-- VIEW: Maintenance Report Summary
-- ============================================================================

CREATE OR REPLACE VIEW maintenance_summary AS
SELECT 
  m.id,
  m.report_number,
  m.title,
  m.category,
  m.priority,
  m.status,
  m.created_at,
  m.resolved_at,
  
  -- Reporter info
  r.id AS reporter_id,
  r.full_name AS reporter_name,
  r.role AS reporter_role,
  
  -- Institution info
  i.id AS institution_id,
  i.code AS institution_code,
  i.name_en AS institution_name,
  
  -- Assigned ICT Staff
  ict.id AS assigned_ict_id,
  ict.full_name AS assigned_ict_name,
  
  -- Task statistics
  (SELECT COUNT(*) FROM maintenance_tasks WHERE maintenance_report_id = m.id) AS total_tasks,
  (SELECT COUNT(*) FROM maintenance_tasks WHERE maintenance_report_id = m.id AND status = 'COMPLETED') AS completed_tasks,
  
  -- Attachment count
  (SELECT COUNT(*) FROM maintenance_attachments WHERE maintenance_report_id = m.id) AS attachment_count
  
FROM maintenance_reports m
JOIN users r ON r.id = m.reported_by
JOIN institutions i ON i.id = m.institution_id
LEFT JOIN users ict ON ict.id = m.assigned_to;

-- ============================================================================
-- VIEW: Active Announcements
-- ============================================================================

CREATE OR REPLACE VIEW active_announcements AS
SELECT 
  a.id,
  a.title,
  a.content,
  a.scope,
  a.target_roles,
  a.is_pinned,
  a.priority,
  a.published_at,
  a.expires_at,
  
  -- Publisher info
  u.id AS publisher_id,
  u.full_name AS publisher_name,
  u.role AS publisher_role,
  
  -- Institution info (if applicable)
  i.id AS institution_id,
  i.name_en AS institution_name
  
FROM announcements a
JOIN users u ON u.id = a.published_by
LEFT JOIN institutions i ON i.id = a.institution_id
WHERE a.is_active = TRUE
AND (a.expires_at IS NULL OR a.expires_at > NOW())
ORDER BY a.is_pinned DESC, a.priority DESC, a.published_at DESC;

-- ============================================================================
-- VIEW: User Notification Summary
-- ============================================================================

CREATE OR REPLACE VIEW user_notification_summary AS
SELECT 
  u.id AS user_id,
  u.full_name,
  u.email,
  COUNT(*) AS total_notifications,
  COUNT(*) FILTER (WHERE n.is_read = FALSE) AS unread_count,
  MAX(n.created_at) AS latest_notification_at
FROM users u
LEFT JOIN notifications n ON n.recipient_id = u.id
GROUP BY u.id, u.full_name, u.email;

-- ============================================================================
-- VIEW: Service Catalogue (Full Details)
-- ============================================================================

CREATE OR REPLACE VIEW service_catalogue AS
SELECT 
  s.id AS service_id,
  s.code AS service_code,
  s.title_en,
  s.title_am,
  s.description_en,
  s.description_am,
  s.processing_time,
  s.service_fee,
  s.service_url,
  s.is_active,
  
  -- Institution info
  i.id AS institution_id,
  i.code AS institution_code,
  i.name_en AS institution_name_en,
  i.name_am AS institution_name_am,
  i.website_url AS institution_website,
  i.status AS institution_status,
  
  -- Requirements (as JSON array)
  COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id', sr.id,
        'document_name_en', sr.document_name_en,
        'document_name_am', sr.document_name_am,
        'description_en', sr.description_en,
        'description_am', sr.description_am,
        'is_mandatory', sr.is_mandatory,
        'display_order', sr.display_order
      ) ORDER BY sr.display_order
    )
    FROM service_requirements sr
    WHERE sr.service_id = s.id),
    '[]'::jsonb
  ) AS requirements
  
FROM services s
JOIN institutions i ON i.id = s.institution_id
WHERE s.is_active = TRUE AND i.status = 'ACTIVE';

-- ============================================================================
-- FUNCTION: Get User's Unread Notification Count
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE recipient_id = p_user_id
    AND is_read = FALSE
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: Mark All Notifications as Read
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = TRUE, read_at = NOW()
  WHERE recipient_id = p_user_id
  AND is_read = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get Dashboard Statistics for User
-- ============================================================================

CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID)
RETURNS TABLE (
  user_role user_role,
  institution_id UUID,
  stat_type VARCHAR,
  stat_value INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.role AS user_role,
    u.institution_id,
    'unread_notifications'::VARCHAR AS stat_type,
    COUNT(*)::INTEGER AS stat_value
  FROM users u
  LEFT JOIN notifications n ON n.recipient_id = u.id AND n.is_read = FALSE
  WHERE u.id = p_user_id
  GROUP BY u.role, u.institution_id
  
  UNION ALL
  
  -- For citizens: their applications
  SELECT 
    u.role,
    u.institution_id,
    'my_applications'::VARCHAR,
    COUNT(*)::INTEGER
  FROM users u
  LEFT JOIN applications a ON a.citizen_id = u.id
  WHERE u.id = p_user_id AND u.role = 'CITIZEN'
  GROUP BY u.role, u.institution_id
  
  UNION ALL
  
  -- For employees: assigned queue items
  SELECT 
    u.role,
    u.institution_id,
    'assigned_queue'::VARCHAR,
    COUNT(*)::INTEGER
  FROM users u
  LEFT JOIN queue_entries q ON q.assigned_to = u.id AND q.status = 'IN_PROGRESS'
  WHERE u.id = p_user_id AND u.role = 'EMPLOYEE'
  GROUP BY u.role, u.institution_id
  
  UNION ALL
  
  -- For ICT staff: assigned maintenance
  SELECT 
    u.role,
    u.institution_id,
    'assigned_maintenance'::VARCHAR,
    COUNT(*)::INTEGER
  FROM users u
  LEFT JOIN maintenance_reports m ON m.assigned_to = u.id AND m.status IN ('ASSIGNED', 'IN_PROGRESS')
  WHERE u.id = p_user_id AND u.role = 'ICT_STAFF'
  GROUP BY u.role, u.institution_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- Comments on Views and Functions
-- ============================================================================

COMMENT ON VIEW user_profiles IS 'User profile information with institution details';
COMMENT ON VIEW application_summary IS 'Application details with citizen, service, and institution info';
COMMENT ON VIEW queue_statistics IS 'Queue statistics grouped by institution';
COMMENT ON VIEW maintenance_summary IS 'Maintenance report summary with task and attachment counts';
COMMENT ON VIEW active_announcements IS 'Currently active announcements';
COMMENT ON VIEW user_notification_summary IS 'User notification counts';
COMMENT ON VIEW service_catalogue IS 'Full service catalogue with requirements';

COMMENT ON FUNCTION generate_application_number IS 'Generate unique application tracking number';
COMMENT ON FUNCTION generate_queue_number IS 'Generate unique queue tracking number';
COMMENT ON FUNCTION generate_maintenance_number IS 'Generate unique maintenance report number';
COMMENT ON FUNCTION get_unread_notification_count IS 'Get count of unread notifications for a user';
COMMENT ON FUNCTION mark_all_notifications_read IS 'Mark all notifications as read for a user';
COMMENT ON FUNCTION get_dashboard_stats IS 'Get role-specific dashboard statistics';

-- ============================================================================
-- END OF FUNCTIONS AND VIEWS
-- ============================================================================
