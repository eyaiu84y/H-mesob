-- ============================================================================
-- Migration 003B: Functions, Views, Indexes and Verification
-- ============================================================================

-- ============================================================================
-- PART 2: HELPER FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS generate_application_number();
DROP FUNCTION IF EXISTS generate_queue_number(TEXT);
DROP FUNCTION IF EXISTS generate_maintenance_number();

CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  app_number TEXT;
BEGIN
  current_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(application_number, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM applications
  WHERE application_number LIKE 'APP-' || current_year || '-%';
  app_number := 'APP-' || current_year || '-' ||
                LPAD(next_number::TEXT, 4, '0');
  RETURN app_number;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_queue_number(
  p_institution_code TEXT
)
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  queue_num TEXT;
  prefix TEXT;
BEGIN
  current_year := TO_CHAR(NOW(), 'YYYY');
  prefix := UPPER(SUBSTRING(p_institution_code, 1, 3));
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(queue_number, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM queue_entries qe
  JOIN institutions i ON qe.institution_id = i.id
  WHERE queue_number LIKE prefix || '-' || current_year || '-%'
    AND i.code = p_institution_code;
  queue_num := prefix || '-' || current_year || '-' ||
               LPAD(next_number::TEXT, 4, '0');
  RETURN queue_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_maintenance_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
  report_num TEXT;
BEGIN
  current_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(report_number, '-', 3) AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM maintenance_reports
  WHERE report_number LIKE 'MR-' || current_year || '-%';
  report_num := 'MR-' || current_year || '-' ||
                LPAD(next_number::TEXT, 4, '0');
  RETURN report_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 3: VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW v_active_queues AS
SELECT
  qe.id,
  qe.queue_number,
  qe.status,
  qe.priority,
  i.code AS institution_code,
  i.name_en AS institution_name,
  s.title_en AS service_name,
  u.full_name AS citizen_name,
  u.phone AS citizen_phone,
  qe.created_at,
  qe.started_at,
  qe.estimated_completion,
  ROW_NUMBER() OVER (
    PARTITION BY qe.institution_id
    ORDER BY qe.priority DESC, qe.created_at ASC
  ) AS queue_position
FROM queue_entries qe
JOIN institutions i ON qe.institution_id = i.id
JOIN services s ON qe.service_id = s.id
JOIN users u ON qe.citizen_id = u.id
WHERE qe.status IN ('WAITING', 'CALLED', 'PENDING');

CREATE OR REPLACE VIEW v_pending_maintenance AS
SELECT
  mr.id,
  mr.report_number,
  mr.title,
  mr.priority,
  mr.status,
  i.name_en AS institution_name,
  reporter.full_name AS reported_by_name,
  reporter.employee_id AS reporter_employee_id,
  assigned.full_name AS assigned_to_name,
  mr.created_at,
  mr.assigned_at
FROM maintenance_reports mr
JOIN institutions i ON mr.institution_id = i.id
JOIN users reporter ON mr.reported_by = reporter.id
LEFT JOIN users assigned ON mr.assigned_to = assigned.id
WHERE mr.status IN (
  'REPORTED',
  'PENDING',
  'ASSIGNED',
  'IN_PROGRESS',
  'ACKNOWLEDGED'
);

CREATE OR REPLACE VIEW v_recent_applications AS
SELECT
  a.id,
  a.application_number,
  a.status,
  i.name_en AS institution_name,
  s.title_en AS service_name,
  u.full_name AS citizen_name,
  u.email AS citizen_email,
  u.phone AS citizen_phone,
  a.submitted_at,
  a.created_at,
  a.updated_at
FROM applications a
JOIN institutions i ON a.institution_id = i.id
JOIN services s ON a.service_id = s.id
JOIN users u ON a.citizen_id = u.id
ORDER BY a.created_at DESC;

-- ============================================================================
-- PART 4: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_role_institution
ON users(role, institution_id)
WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_applications_status_institution
ON applications(status, institution_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applications_citizen_status
ON applications(citizen_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_queue_institution_status
ON queue_entries(
  institution_id,
  status,
  priority DESC,
  created_at ASC
);

CREATE INDEX IF NOT EXISTS idx_maintenance_institution_status
ON maintenance_reports(
  institution_id,
  status,
  priority DESC,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS idx_maintenance_assigned_status
ON maintenance_reports(
  assigned_to,
  status,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
ON notifications(
  recipient_id,
  is_read,
  created_at DESC
);

CREATE INDEX IF NOT EXISTS idx_announcements_active_published
ON announcements(
  is_active,
  published_at DESC,
  expires_at
)
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_services_institution_id_active
ON services(institution_id)
WHERE is_active = TRUE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
  'queue_status' AS enum_name,
  unnest(enum_range(NULL::queue_status))::text AS value
ORDER BY value;

SELECT
  'Functions created' AS status,
  COUNT(*) AS count
FROM pg_proc
WHERE proname IN (
  'generate_application_number',
  'generate_queue_number',
  'generate_maintenance_number'
);

SELECT
  'Views created' AS status,
  COUNT(*) AS count
FROM pg_views
WHERE viewname IN (
  'v_active_queues',
  'v_pending_maintenance',
  'v_recent_applications'
);

SELECT
  'Indexes created' AS status,
  COUNT(*) AS count
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ MIGRATION 003 COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Enum values were committed separately';
  RAISE NOTICE '✓ 3 Helper functions created';
  RAISE NOTICE '✓ 3 Helpful views created';
  RAISE NOTICE '✓ Performance indexes created';
  RAISE NOTICE '========================================';
END
$$;
