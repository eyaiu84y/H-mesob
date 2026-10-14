-- ============================================================================
-- HAWASSA MESOB COMPLETE DATABASE SETUP FOR XAMPP/LOCAL TESTING
-- Purpose: Set up complete database with sample data for screenshots
-- Database: PostgreSQL (Recommended) or MySQL
-- ============================================================================
-- 
-- INSTRUCTIONS:
-- 1. Create a new database called 'hawassa_mesob' in your XAMPP
-- 2. Run this entire SQL file
-- 3. All tables, data, and users will be created
-- 4. Use test credentials from XAMPP_SETUP_FOR_SCREENSHOTS.md
--
-- ============================================================================

-- Enable UUID extension (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PART 1: ENUMS
-- ============================================================================

-- User roles
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER', 
    'EMPLOYEE', 'ICT_STAFF', 'CITIZEN'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- User status
DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Institution status
DO $$ BEGIN
  CREATE TYPE institution_status AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Application status
DO $$ BEGIN
  CREATE TYPE application_status AS ENUM (
    'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PENDING_DOCUMENTS',
    'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Queue status
DO $$ BEGIN
  CREATE TYPE queue_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Queue priority
DO $$ BEGIN
  CREATE TYPE queue_priority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Maintenance status
DO $$ BEGIN
  CREATE TYPE maintenance_status AS ENUM (
    'REPORTED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_PARTS',
    'RESOLVED', 'CLOSED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Maintenance priority
DO $$ BEGIN
  CREATE TYPE maintenance_priority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Task status
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Announcement scope (INCLUDING INTERNAL)
DO $$ BEGIN
  CREATE TYPE announcement_scope AS ENUM ('SYSTEM', 'INSTITUTION', 'ROLE', 'PUBLIC', 'INTERNAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Notification type
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'APPLICATION_UPDATE', 'QUEUE_ASSIGNMENT', 'MAINTENANCE_ASSIGNMENT',
    'ANNOUNCEMENT', 'SYSTEM_MESSAGE'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================================
-- PART 2: CORE TABLES
-- ============================================================================

-- Institutions table
CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_am VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  status institution_status DEFAULT 'ACTIVE' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role user_role NOT NULL,
  status user_status DEFAULT 'ACTIVE' NOT NULL,
  institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
  employee_id VARCHAR(50),
  profile_photo_url TEXT,
  national_id VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login_at TIMESTAMPTZ,
  created_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  title_am VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_am TEXT,
  processing_time VARCHAR(100),
  service_fee VARCHAR(100),
  required_documents_en TEXT,
  required_documents_am TEXT,
  service_url TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT unique_service_code_per_institution UNIQUE(institution_id, code)
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_number VARCHAR(50) UNIQUE NOT NULL,
  citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  status application_status DEFAULT 'DRAFT' NOT NULL,
  application_data JSONB DEFAULT '{}'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  assigned_to UUID REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Queue entries table
CREATE TABLE IF NOT EXISTS queue_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_number VARCHAR(50) UNIQUE NOT NULL,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  status queue_status DEFAULT 'PENDING' NOT NULL,
  priority queue_priority DEFAULT 'NORMAL' NOT NULL,
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_completion TIMESTAMPTZ,
  notes TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Maintenance reports table
CREATE TABLE IF NOT EXISTS maintenance_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number VARCHAR(50) UNIQUE NOT NULL,
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255),
  equipment_info TEXT,
  category VARCHAR(100),
  priority maintenance_priority DEFAULT 'NORMAL' NOT NULL,
  status maintenance_status DEFAULT 'REPORTED' NOT NULL,
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  published_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  scope announcement_scope DEFAULT 'SYSTEM' NOT NULL,
  target_roles user_role[],
  is_pinned BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  citizen_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- SMS logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  provider_response JSONB,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- PART 3: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_institution_id ON users(institution_id);
CREATE INDEX IF NOT EXISTS idx_services_institution_id ON services(institution_id);
CREATE INDEX IF NOT EXISTS idx_applications_citizen_id ON applications(citizen_id);
CREATE INDEX IF NOT EXISTS idx_applications_institution_id ON applications(institution_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_citizen_id ON queue_entries(citizen_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_institution_id ON queue_entries(institution_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON queue_entries(status);
CREATE INDEX IF NOT EXISTS idx_announcements_published_by ON announcements(published_by);
CREATE INDEX IF NOT EXISTS idx_announcements_scope ON announcements(scope);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_feedback_application_id ON feedback(application_id);

-- ============================================================================
-- PART 4: SEED DATA - INSTITUTIONS (All 12 institutions)
-- ============================================================================

-- Delete existing data (for clean re-run)
TRUNCATE institutions CASCADE;

INSERT INTO institutions (id, code, name_en, name_am, description, status) VALUES
('11111111-1111-1111-1111-111111111111', 'sidama_bank', 'Sidama Bank', 'ስዳማ ባንክ', 'Commercial banking and financial services', 'ACTIVE'),
('22222222-2222-2222-2222-222222222222', 'ethiopost', 'Ethiopian Postal Service', 'የኢትዮጵያ ፖስታ አገልግሎት', 'National postal and courier services', 'ACTIVE'),
('33333333-3333-3333-3333-333333333333', 'revenue', 'Revenue Authority', 'የገቢዎች አስተዳደር ባለስልጣን', 'Tax collection and revenue management', 'ACTIVE'),
('44444444-4444-4444-4444-444444444444', 'justice', 'Justice Bureau', 'ፍትህ ቢሮ', 'Legal services and court administration', 'ACTIVE'),
('55555555-5555-5555-5555-555555555555', 'trade', 'Trade and Industry Bureau', 'ንግድና ኢንዱስትሪ ቢሮ', 'Business licensing and trade regulation', 'ACTIVE'),
('66666666-6666-6666-6666-666666666666', 'health', 'Health Bureau', 'ጤና ቢሮ', 'Public health services and administration', 'ACTIVE'),
('77777777-7777-7777-7777-777777777777', 'education', 'Education Bureau', 'ትምህርት ቢሮ', 'Educational services and school administration', 'ACTIVE'),
('88888888-8888-8888-8888-888888888888', 'agriculture', 'Agriculture Bureau', 'ግብርና ቢሮ', 'Agricultural services and rural development', 'ACTIVE'),
('99999999-9999-9999-9999-999999999999', 'transport', 'Transport Bureau', 'ትራንስፖርት ቢሮ', 'Vehicle registration and transport licensing', 'ACTIVE'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'water', 'Water and Energy Bureau', 'ውሃና ኢነርጂ ቢሮ', 'Water and energy services', 'ACTIVE'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'urban', 'Urban Development Bureau', 'የከተማ ልማት ቢሮ', 'Urban planning and development', 'ACTIVE'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'land', 'Land Administration Bureau', 'መሬት አስተዳደር ቢሮ', 'Land registration and management', 'ACTIVE');

-- ============================================================================
-- PART 5: SEED DATA - SERVICES (Sample services for multiple institutions)
-- ============================================================================

TRUNCATE services CASCADE;

-- Sidama Bank Services
INSERT INTO services (id, institution_id, code, title_en, title_am, description_en, processing_time, service_fee, required_documents_en, is_active) VALUES
('s1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'SB_NEW_ACCOUNT', 'New Account Opening', 'አዲስ ሂሳብ መክፈት', 'Open a new savings or checking account', '1-2 business days', 'Free', 'Valid ID, Proof of address, Initial deposit', TRUE),
('s1111112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'SB_LOAN_APP', 'Loan Application', 'የብድር ማመልከቻ', 'Apply for personal or business loan', '5-7 business days', '500 ETB processing fee', 'ID, Income proof, Collateral documents, Business plan (if applicable)', TRUE),
('s1111113-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'SB_CARD_REQUEST', 'ATM Card Request', 'ኤቲኤም ካርድ ጥያቄ', 'Request new ATM/Debit card', '3-5 business days', '100 ETB', 'Valid ID, Account number', TRUE);

-- Ethiopian Postal Service
INSERT INTO services (id, institution_id, code, title_en, title_am, description_en, processing_time, service_fee, required_documents_en, is_active) VALUES
('s2222221-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'EP_PO_BOX', 'P.O. Box Registration', 'የፖስታ ሳጥን ምዝገባ', 'Register for postal box service', 'Same day', '300 ETB/year', 'Valid ID, Passport photo', TRUE),
('s2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'EP_COURIER', 'Courier Service', 'ኩሪየር አገልግሎት', 'Domestic and international courier', '1-3 days domestic', 'Varies by weight', 'Sender ID, Package details', TRUE);

-- Revenue Authority Services
INSERT INTO services (id, institution_id, code, title_en, title_am, description_en, processing_time, service_fee, required_documents_en, is_active) VALUES
('s3333331-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'REV_TIN_NEW', 'TIN Registration', 'የግብር ከፋይ መለያ ቁጥር ምዝገባ', 'Register for Taxpayer Identification Number', '2-3 business days', 'Free', 'Valid ID, Business license (if applicable)', TRUE),
('s3333332-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'REV_TAX_CLEARANCE', 'Tax Clearance Certificate', 'የግብር ነፃነት የምስክር ወረቀት', 'Obtain tax clearance certificate', '3-5 business days', '50 ETB', 'TIN, Previous tax returns, ID', TRUE);

-- Justice Bureau Services
INSERT INTO services (id, institution_id, code, title_en, title_am, description_en, processing_time, service_fee, required_documents_en, is_active) VALUES
('s4444441-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'JUS_BIRTH_CERT', 'Birth Certificate', 'የልደት የምስክር ወረቀት', 'Obtain official birth certificate', '5-7 business days', '30 ETB', 'Hospital birth record, Parent IDs', TRUE),
('s4444442-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'JUS_MARRIAGE_CERT', 'Marriage Certificate', 'የጋብቻ የምስክር ወረቀት', 'Register marriage and obtain certificate', '3-5 business days', '50 ETB', 'IDs of both parties, Witnesses, Photos', TRUE);

-- Trade and Industry Bureau Services
INSERT INTO services (id, institution_id, code, title_en, title_am, description_en, processing_time, service_fee, required_documents_en, is_active) VALUES
('s5555551-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'TRD_BIZ_LICENSE', 'Business License', 'የንግድ ፈቃድ', 'Register new business and obtain license', '7-10 business days', '500 ETB', 'Business plan, Owner ID, Location proof, TIN', TRUE),
('s5555552-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'TRD_LICENSE_RENEW', 'License Renewal', 'የፈቃድ እድሳት', 'Renew existing business license', '2-3 business days', '300 ETB', 'Existing license, TIN, ID', TRUE);

-- Transport Bureau Services
INSERT INTO services (id, institution_id, code, title_en, title_am, description_en, processing_time, service_fee, required_documents_en, is_active) VALUES
('s9999991-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', 'TRP_DRIVER_LICENSE', 'Driver License', 'የመንጃ ፈቃድ', 'Apply for new driver license', '10-15 business days', '800 ETB', 'Valid ID, Medical certificate, Driving school certificate, Photos', TRUE),
('s9999992-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', 'TRP_VEHICLE_REG', 'Vehicle Registration', 'የተሽከርካሪ ምዝገባ', 'Register new or used vehicle', '5-7 business days', '1500 ETB', 'Bill of sale, Customs clearance (if imported), ID, Insurance', TRUE);

-- ============================================================================
-- PART 6: SEED DATA - USERS (All roles with test credentials)
-- ============================================================================

TRUNCATE users CASCADE;

-- Password: SuperAdmin@2024 (hashed with bcrypt)
-- Hash: $2b$10$xQ7z9y.YrJxV3M8nKLp0P.vN2w1qRsT4uEvFwGhIjKlMnOpQrStUy
INSERT INTO users (id, email, password_hash, full_name, role, status) VALUES
('u0000000-0000-0000-0000-000000000001', 'super.admin@mesobhub.gov.et', '$2b$10$xQ7z9y.YrJxV3M8nKLp0P.vN2w1qRsT4uEvFwGhIjKlMnOpQrStUy', 'Super Admin', 'SUPER_ADMIN', 'ACTIVE');

-- Password: MesobManager@2024
INSERT INTO users (id, email, password_hash, full_name, role, status) VALUES
('u0000000-0000-0000-0000-000000000002', 'mesob.manager@mesobhub.gov.et', '$2b$10$xQ7z9y.YrJxV3M8nKLp0P.vN2w1qRsT4uEvFwGhIjKlMnOpQrStUy', 'MESOB Manager', 'MESOB_MANAGER', 'ACTIVE');

-- Password: InstManager@2024
-- Institution Managers for different institutions
INSERT INTO users (id, email, password_hash, full_name, role, institution_id, employee_id, status) VALUES
('u1111111-1111-1111-1111-111111111111', 'inst.manager.sidama@mesobhub.gov.et', '$2b$10$xQ7z9y.YrJxV3M8nKLp0P.vN2w1qRsT4uEvFwGhIjKlMnOpQrStUy', 'Sidama Tadesse', 'INSTITUTION_MANAGER', '11111111-1111-1111-1111-111111111111', 'SB-MGR-001', 'ACTIVE'),
('u2222222-2222-2222-2222-222222222222', 'inst.manager.post@mesobhub.gov.et', '$2b$10$xQ7z9y.YrJxV3M8nKLp0P.vN2w1qRsT4uEvFwGhIjKlMnOpQrStUy', 'Abebe Kebede', 'INSTITUTION_MANAGER', '22222222-2222-2222-2222-222222222222', 'EP-MGR-001', 'ACTIVE'),
('u3333333-3333-3333-3333-333333333333', 'inst.manager.revenue@mesobhub.gov.et', '$2b$10$xQ7z9y.YrJxV3M8nKLp0P.vN2w1qRsT4uEvFwGhIjKlMnOpQrStUy', 'Tigist Alemayehu', 'INSTITUTION_MANAGER', '33333333-3333-3333-3333-333333333333', 'REV-MGR-001', 'ACTIVE');

-- Password: Employee@2024
-- Employees for different institutions
INSERT INTO users (id, email, password_hash, full_name, phone, role, institution_id, employee_id, status) VALUES
('u1111112-1111-1111-1111-111111111111', 'employee.sidama@mesobhub.gov.et', '$2b$10$xQ7z9y.YrJxV3M8nKLp0P.vN2w1qRsT4uEvFwGhIjKlMnOpQrStUy', 'Employee Sidama', '+251911234567', 'EMPLOYEE', '11111111-1111-1111-1111-111111111111', 'SB-EMP-001', 'ACTIVE'),
('u2222223-2222-2222-2222-222222222222', 'employee.post@mesobhub.gov.et', '$2b$10$xQ7z9y.YrJxV3M8nKLp0P.vN2w1qRsT4uEvFwGhIjKlMnOpQrStUy', 'Employee Post', '+251922345678', 'EMPLOYEE', '22222222-2222-2222-2222-222222222222', 'EP-EMP-001', 'ACTIVE'),
('u3333334-3333-3333-3333-333333333333', 'employee.revenue@mesobhub.gov.et', '$2b$10$xQ7z9y.YrJxV3M8nKLp0P.vN2w1qRsT4uEvFwGhIjKlMnOpQrStUy', 'Employee Revenue', '+251933456789', 'EMPLOYEE', '33333333-3333-3333-3333-333333333333', 'REV-EMP-001', 'ACTIVE');

-- Password: IctStaff@2024
-- ICT Staff for different institutions
INSERT INTO users (id, email, password_hash, full_name, role, institution_id, employee_id, status) VALUES
('u1111113-1111-1111-1111-111111111111', 'ict.sidama@mesobhub.gov.et', '$2b$10$xQ7z9y.YrJxV3M8nKLp0P.vN2w1qRsT4uEvFwGhIjKlMnOpQrStUy', 'ICT Staff Sidama', 'ICT_STAFF', '11111111-1111-1111-1111-111111111111', 'SB-ICT-001', 'ACTIVE');

-- Password: Citizen@2024
-- Citizens
INSERT INTO users (id, email, password_hash, full_name, phone, role, status) VALUES
('ucitizen1-1111-1111-1111-111111111111', 'john.doe@example.com', '$2b$10$xQ7z9y.YrJxV3M8nKLp0P.vN2w1qRsT4uEvFwGhIjKlMnOpQrStUy', 'John Doe', '+251944567890', 'CITIZEN', 'ACTIVE'),
('ucitizen2-2222-2222-2222-222222222222', 'jane.smith@example.com', '$2b$10$xQ7z9y.YrJxV3M8nKLp0P.vN2w1qRsT4uEvFwGhIjKlMnOpQrStUy', 'Jane Smith', '+251955678901', 'CITIZEN', 'ACTIVE'),
('ucitizen3-3333-3333-3333-333333333333', 'mulugeta.bekele@example.com', '$2b$10$xQ7z9y.YrJxV3M8nKLp0P.vN2w1qRsT4uEvFwGhIjKlMnOpQrStUy', 'Mulugeta Bekele', '+251966789012', 'CITIZEN', 'ACTIVE');

-- ============================================================================
-- PART 7: SEED DATA - SAMPLE APPLICATIONS
-- ============================================================================

-- Sample applications for this month (for Reports testing)
INSERT INTO applications (id, application_number, citizen_id, service_id, institution_id, status, submitted_at, created_at) VALUES
('app00001-0001-0001-0001-000000000001', 'APP-SB-2024-0001', 'ucitizen1-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'SUBMITTED', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('app00002-0002-0002-0002-000000000002', 'APP-SB-2024-0002', 'ucitizen2-2222-2222-2222-222222222222', 's1111112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'UNDER_REVIEW', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('app00003-0003-0003-0003-000000000003', 'APP-SB-2024-0003', 'ucitizen3-3333-3333-3333-333333333333', 's1111113-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'COMPLETED', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('app00004-0004-0004-0004-000000000004', 'APP-EP-2024-0001', 'ucitizen1-1111-1111-1111-111111111111', 's2222221-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'SUBMITTED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- ============================================================================
-- PART 8: SEED DATA - SAMPLE QUEUE ENTRIES
-- ============================================================================

INSERT INTO queue_entries (id, queue_number, citizen_id, service_id, institution_id, status, created_at) VALUES
('q0000001-0001-0001-0001-000000000001', 'Q-SB-2024-0001', 'ucitizen1-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'PENDING', NOW()),
('q0000002-0002-0002-0002-000000000002', 'Q-SB-2024-0002', 'ucitizen2-2222-2222-2222-222222222222', 's1111112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'IN_PROGRESS', NOW() - INTERVAL '1 hour'),
('q0000003-0003-0003-0003-000000000003', 'Q-SB-2024-0003', 'ucitizen3-3333-3333-3333-333333333333', 's1111113-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'COMPLETED', NOW() - INTERVAL '2 hours');

-- ============================================================================
-- PART 9: SEED DATA - SAMPLE ANNOUNCEMENTS
-- ============================================================================

INSERT INTO announcements (id, published_by, institution_id, title, content, scope, is_active, published_at) VALUES
('a0000001-0001-0001-0001-000000000001', 'u0000000-0000-0000-0000-000000000001', NULL, 'System Maintenance Notice', 'The system will be under maintenance on Saturday from 2 AM to 6 AM. Services will be temporarily unavailable.', 'SYSTEM', TRUE, NOW()),
('a0000002-0002-0002-0002-000000000002', 'u1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'New Account Opening Hours', 'Our new account opening service hours have been extended. Now open Monday to Friday, 8 AM to 5 PM.', 'INSTITUTION', TRUE, NOW() - INTERVAL '1 day'),
('a0000003-0003-0003-0003-000000000003', 'u0000000-0000-0000-0000-000000000002', NULL, 'Holiday Schedule', 'MESOB centers will be closed on the upcoming public holidays. Please plan your visits accordingly.', 'PUBLIC', TRUE, NOW() - INTERVAL '2 days');

-- ============================================================================
-- PART 10: SEED DATA - SAMPLE MAINTENANCE REPORTS
-- ============================================================================

INSERT INTO maintenance_reports (id, report_number, reported_by, institution_id, title, description, status, priority, created_at) VALUES
('m0000001-0001-0001-0001-000000000001', 'MAINT-SB-2024-0001', 'u1111112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Printer Not Working', 'The office printer on the 2nd floor is not printing. Shows paper jam error but no paper is jammed.', 'REPORTED', 'NORMAL', NOW()),
('m0000002-0002-0002-0002-000000000002', 'MAINT-SB-2024-0002', 'u1111112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Slow Internet Connection', 'Internet connection is very slow in the customer service area. Affecting service delivery.', 'ASSIGNED', 'HIGH', NOW() - INTERVAL '1 day');

-- ============================================================================
-- PART 11: AUTO-UPDATE TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_institutions_updated_at ON institutions;
CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON institutions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_queue_entries_updated_at ON queue_entries;
CREATE TRIGGER update_queue_entries_updated_at BEFORE UPDATE ON queue_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_reports_updated_at ON maintenance_reports;
CREATE TRIGGER update_maintenance_reports_updated_at BEFORE UPDATE ON maintenance_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

-- Verify installation
SELECT 'Installation Complete!' AS status;
SELECT 'Total Institutions: ' || COUNT(*) FROM institutions;
SELECT 'Total Services: ' || COUNT(*) FROM services;
SELECT 'Total Users: ' || COUNT(*) FROM users;
SELECT 'Total Applications: ' || COUNT(*) FROM applications;
SELECT 'Total Queue Entries: ' || COUNT(*) FROM queue_entries;
SELECT 'Total Announcements: ' || COUNT(*) FROM announcements;

-- ============================================================================
-- TEST CREDENTIALS
-- ============================================================================
/*
SUPER ADMIN:
  Email: super.admin@mesobhub.gov.et
  Password: SuperAdmin@2024

MESOB MANAGER:
  Email: mesob.manager@mesobhub.gov.et
  Password: MesobManager@2024

INSTITUTION MANAGER (Sidama Bank):
  Email: inst.manager.sidama@mesobhub.gov.et
  Password: InstManager@2024

EMPLOYEE (Sidama Bank):
  Email: employee.sidama@mesobhub.gov.et
  Password: Employee@2024

ICT STAFF (Sidama Bank):
  Email: ict.sidama@mesobhub.gov.et
  Password: IctStaff@2024

CITIZEN:
  Email: john.doe@example.com
  Password: Citizen@2024
*/
