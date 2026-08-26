-- ============================================================================
-- Hawassa MESOB Database Schema
-- Version: 1.0.0
-- Description: Complete database structure for MESOB Public Service System
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User roles (exactly 6 approved roles)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',
    'MESOB_MANAGER',
    'INSTITUTION_MANAGER',
    'EMPLOYEE',
    'ICT_STAFF',
    'CITIZEN'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- User status
DO $$ BEGIN
  CREATE TYPE user_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Institution status
DO $$ BEGIN
  CREATE TYPE institution_status AS ENUM (
    'ACTIVE',
    'INACTIVE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Application status
DO $$ BEGIN
  CREATE TYPE application_status AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'UNDER_REVIEW',
    'PENDING_DOCUMENTS',
    'APPROVED',
    'REJECTED',
    'COMPLETED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Queue status
DO $$ BEGIN
  CREATE TYPE queue_status AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Queue priority
DO $$ BEGIN
  CREATE TYPE queue_priority AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Maintenance status
DO $$ BEGIN
  CREATE TYPE maintenance_status AS ENUM (
    'REPORTED',
    'ASSIGNED',
    'IN_PROGRESS',
    'WAITING_PARTS',
    'RESOLVED',
    'CLOSED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Maintenance priority
DO $$ BEGIN
  CREATE TYPE maintenance_priority AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'CRITICAL'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Maintenance task status
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Announcement scope
DO $$ BEGIN
  CREATE TYPE announcement_scope AS ENUM (
    'SYSTEM',
    'INSTITUTION',
    'ROLE',
    'PUBLIC'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Notification type
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'APPLICATION_UPDATE',
    'QUEUE_ASSIGNMENT',
    'MAINTENANCE_ASSIGNMENT',
    'ANNOUNCEMENT',
    'SYSTEM_MESSAGE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLE: users
-- Description: Core user table for all system users
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role user_role NOT NULL,
  status user_status DEFAULT 'ACTIVE' NOT NULL,
  
  -- Role-specific fields
  institution_id UUID,  -- Required for INSTITUTION_MANAGER, EMPLOYEE, ICT_STAFF
  employee_id VARCHAR(50),  -- Required for INSTITUTION_MANAGER, EMPLOYEE, ICT_STAFF
  
  -- Profile fields
  profile_photo_url TEXT,
  national_id VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT phone_format CHECK (phone IS NULL OR phone ~* '^\+?[0-9]{10,15}$')
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_institution_id ON users(institution_id);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- ============================================================================
-- TABLE: institutions
-- Description: Government institutions providing services
-- ============================================================================

CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,  -- e.g., 'ethiopost', 'revenue', 'justice'
  name_en VARCHAR(255) NOT NULL,
  name_am VARCHAR(255) NOT NULL,
  
  -- Institution details
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  
  -- Contact information
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  
  -- Status
  status institution_status DEFAULT 'ACTIVE' NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT institution_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for institutions table
CREATE INDEX IF NOT EXISTS idx_institutions_code ON institutions(code);
CREATE INDEX IF NOT EXISTS idx_institutions_status ON institutions(status);
CREATE INDEX IF NOT EXISTS idx_institutions_name_en ON institutions(name_en);

-- ============================================================================
-- TABLE: services
-- Description: Services offered by institutions
-- ============================================================================

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  
  -- Service details
  code VARCHAR(100) NOT NULL,  -- Unique within institution
  title_en VARCHAR(255) NOT NULL,
  title_am VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_am TEXT,
  
  -- Service information
  processing_time VARCHAR(100),  -- e.g., "3-5 business days"
  service_fee VARCHAR(100),      -- e.g., "500 ETB" or "Free"
  service_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT unique_service_code_per_institution UNIQUE(institution_id, code)
);

-- Indexes for services table
CREATE INDEX IF NOT EXISTS idx_services_institution_id ON services(institution_id);
CREATE INDEX IF NOT EXISTS idx_services_code ON services(code);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_title_en ON services(title_en);

-- ============================================================================
-- TABLE: service_requirements
-- Description: Required documents for each service
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  
  -- Requirement details
  document_name_en VARCHAR(255) NOT NULL,
  document_name_am VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_am TEXT,
  
  -- Requirement properties
  is_mandatory BOOLEAN DEFAULT TRUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for service_requirements table
CREATE INDEX IF NOT EXISTS idx_service_requirements_service_id ON service_requirements(service_id);
CREATE INDEX IF NOT EXISTS idx_service_requirements_display_order ON service_requirements(service_id, display_order);

-- ============================================================================
-- TABLE: applications
-- Description: Citizen applications for services
-- ============================================================================

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_number VARCHAR(50) UNIQUE NOT NULL,  -- Auto-generated tracking number
  
  -- Foreign keys
  citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  
  -- Application status
  status application_status DEFAULT 'DRAFT' NOT NULL,
  
  -- Application data
  application_data JSONB DEFAULT '{}'::jsonb,  -- Service-specific form data
  documents JSONB DEFAULT '[]'::jsonb,         -- Uploaded documents
  
  -- Processing information
  assigned_to UUID REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for applications table
CREATE INDEX IF NOT EXISTS idx_applications_application_number ON applications(application_number);
CREATE INDEX IF NOT EXISTS idx_applications_citizen_id ON applications(citizen_id);
CREATE INDEX IF NOT EXISTS idx_applications_service_id ON applications(service_id);
CREATE INDEX IF NOT EXISTS idx_applications_institution_id ON applications(institution_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_assigned_to ON applications(assigned_to);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON applications(submitted_at DESC);

-- ============================================================================
-- TABLE: queue_entries
-- Description: Service queue management for institutions
-- ============================================================================

CREATE TABLE IF NOT EXISTS queue_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_number VARCHAR(50) UNIQUE NOT NULL,  -- e.g., "REV-2024-0001"
  
  -- Foreign keys
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  
  -- Queue status
  status queue_status DEFAULT 'PENDING' NOT NULL,
  priority queue_priority DEFAULT 'NORMAL' NOT NULL,
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),  -- Employee handling this queue entry
  assigned_at TIMESTAMPTZ,
  
  -- Processing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_completion TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,  -- Only visible to staff
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for queue_entries table
CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_number ON queue_entries(queue_number);
CREATE INDEX IF NOT EXISTS idx_queue_entries_citizen_id ON queue_entries(citizen_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_service_id ON queue_entries(service_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_institution_id ON queue_entries(institution_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON queue_entries(status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_priority ON queue_entries(priority);
CREATE INDEX IF NOT EXISTS idx_queue_entries_assigned_to ON queue_entries(assigned_to);
CREATE INDEX IF NOT EXISTS idx_queue_entries_created_at ON queue_entries(created_at DESC);

-- ============================================================================
-- TABLE: maintenance_reports
-- Description: IT/Technical maintenance reports
-- ============================================================================

CREATE TABLE IF NOT EXISTS maintenance_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number VARCHAR(50) UNIQUE NOT NULL,  -- e.g., "MAINT-2024-0001"
  
  -- Foreign keys
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,  -- Employee
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  
  -- Report details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255),
  equipment_info TEXT,
  
  -- Classification
  category VARCHAR(100),  -- e.g., "Hardware", "Software", "Network"
  priority maintenance_priority DEFAULT 'NORMAL' NOT NULL,
  status maintenance_status DEFAULT 'REPORTED' NOT NULL,
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),  -- ICT Staff
  assigned_at TIMESTAMPTZ,
  
  -- Resolution
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for maintenance_reports table
CREATE INDEX IF NOT EXISTS idx_maintenance_reports_report_number ON maintenance_reports(report_number);
CREATE INDEX IF NOT EXISTS idx_maintenance_reports_reported_by ON maintenance_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_maintenance_reports_institution_id ON maintenance_reports(institution_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_reports_status ON maintenance_reports(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_reports_priority ON maintenance_reports(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_reports_assigned_to ON maintenance_reports(assigned_to);
CREATE INDEX IF NOT EXISTS idx_maintenance_reports_created_at ON maintenance_reports(created_at DESC);

-- ============================================================================
-- TABLE: maintenance_attachments
-- Description: File attachments for maintenance reports
-- ============================================================================

CREATE TABLE IF NOT EXISTS maintenance_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maintenance_report_id UUID NOT NULL REFERENCES maintenance_reports(id) ON DELETE CASCADE,
  
  -- File information
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,  -- bytes
  file_url TEXT NOT NULL,  -- Supabase Storage URL
  
  -- Upload information
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for maintenance_attachments table
CREATE INDEX IF NOT EXISTS idx_maintenance_attachments_report_id ON maintenance_attachments(maintenance_report_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_attachments_uploaded_by ON maintenance_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_maintenance_attachments_uploaded_at ON maintenance_attachments(uploaded_at DESC);

-- ============================================================================
-- TABLE: maintenance_tasks
-- Description: Sub-tasks for maintenance reports
-- ============================================================================

CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maintenance_report_id UUID NOT NULL REFERENCES maintenance_reports(id) ON DELETE CASCADE,
  
  -- Task details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),  -- ICT Staff
  assigned_at TIMESTAMPTZ,
  assigned_by UUID REFERENCES users(id),
  
  -- Status
  status task_status DEFAULT 'PENDING' NOT NULL,
  
  -- Completion
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for maintenance_tasks table
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_report_id ON maintenance_tasks(maintenance_report_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_assigned_to ON maintenance_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_status ON maintenance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_created_at ON maintenance_tasks(created_at DESC);

-- ============================================================================
-- TABLE: announcements
-- Description: System and institutional announcements
-- ============================================================================

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Publisher information
  published_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,  -- NULL for system-wide
  
  -- Announcement details
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  
  -- Targeting
  scope announcement_scope DEFAULT 'SYSTEM' NOT NULL,
  target_roles user_role[],  -- NULL = all roles
  
  -- Priority and visibility
  is_pinned BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 0,
  
  -- Scheduling
  published_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for announcements table
CREATE INDEX IF NOT EXISTS idx_announcements_published_by ON announcements(published_by);
CREATE INDEX IF NOT EXISTS idx_announcements_institution_id ON announcements(institution_id);
CREATE INDEX IF NOT EXISTS idx_announcements_scope ON announcements(scope);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON announcements(expires_at);

-- ============================================================================
-- TABLE: notifications
-- Description: User notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Recipient
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification details
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entities
  related_entity_type VARCHAR(50),  -- e.g., 'application', 'queue', 'maintenance'
  related_entity_id UUID,
  
  -- Announcement link (if notification is from announcement)
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_announcement_id ON notifications(announcement_id);

-- ============================================================================
-- TABLE: telegram_users
-- Description: Telegram bot user mappings
-- ============================================================================

CREATE TABLE IF NOT EXISTS telegram_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User mapping
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  telegram_chat_id BIGINT UNIQUE NOT NULL,
  telegram_username VARCHAR(255),
  
  -- Preferences
  notifications_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  
  -- Timestamps
  linked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_interaction_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT unique_user_telegram UNIQUE(user_id)
);

-- Indexes for telegram_users table
CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON telegram_users(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_chat_id ON telegram_users(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_is_active ON telegram_users(is_active);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS (Additional)
-- ============================================================================

-- Add foreign key for users.institution_id (references institutions)
DO $$ BEGIN
  ALTER TABLE users 
    ADD CONSTRAINT fk_users_institution 
    FOREIGN KEY (institution_id) 
    REFERENCES institutions(id) 
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add foreign key for users.created_by (self-reference)
DO $$ BEGIN
  ALTER TABLE users 
    ADD CONSTRAINT fk_users_created_by 
    FOREIGN KEY (created_by) 
    REFERENCES users(id) 
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for institutions table
DROP TRIGGER IF EXISTS update_institutions_updated_at ON institutions;
CREATE TRIGGER update_institutions_updated_at 
  BEFORE UPDATE ON institutions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for services table
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at 
  BEFORE UPDATE ON services 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for service_requirements table
DROP TRIGGER IF EXISTS update_service_requirements_updated_at ON service_requirements;
CREATE TRIGGER update_service_requirements_updated_at 
  BEFORE UPDATE ON service_requirements 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for applications table
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at 
  BEFORE UPDATE ON applications 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for queue_entries table
DROP TRIGGER IF EXISTS update_queue_entries_updated_at ON queue_entries;
CREATE TRIGGER update_queue_entries_updated_at 
  BEFORE UPDATE ON queue_entries 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for maintenance_reports table
DROP TRIGGER IF EXISTS update_maintenance_reports_updated_at ON maintenance_reports;
CREATE TRIGGER update_maintenance_reports_updated_at 
  BEFORE UPDATE ON maintenance_reports 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for maintenance_tasks table
DROP TRIGGER IF EXISTS update_maintenance_tasks_updated_at ON maintenance_tasks;
CREATE TRIGGER update_maintenance_tasks_updated_at 
  BEFORE UPDATE ON maintenance_tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for announcements table
DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at 
  BEFORE UPDATE ON announcements 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'System users with role-based access';
COMMENT ON TABLE institutions IS '12 approved government institutions';
COMMENT ON TABLE services IS 'Services offered by institutions';
COMMENT ON TABLE service_requirements IS 'Required documents for each service';
COMMENT ON TABLE applications IS 'Citizen applications for services';
COMMENT ON TABLE queue_entries IS 'Service queue management';
COMMENT ON TABLE maintenance_reports IS 'IT/Technical maintenance reports';
COMMENT ON TABLE maintenance_attachments IS 'File attachments for maintenance reports';
COMMENT ON TABLE maintenance_tasks IS 'Sub-tasks for maintenance reports';
COMMENT ON TABLE announcements IS 'System and institutional announcements';
COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON TABLE telegram_users IS 'Telegram bot user mappings';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
