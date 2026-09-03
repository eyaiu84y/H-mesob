# 🗄️ Database Schema Documentation

This directory contains all database-related files for the Hawassa MESOB backend.

## 📁 Directory Structure

```
database/
├── migrations/           # SQL migration files (run in order)
│   ├── 001_create_schema.sql
│   ├── 002_create_rls_policies.sql
│   └── 003_create_functions_views.sql
├── seeds/               # Seed data files
│   └── 001_seed_institutions.sql
├── docs/                # Documentation
│   └── DATABASE_SCHEMA.md
├── SETUP_GUIDE.md       # Step-by-step setup instructions
├── VERIFICATION_REPORT.md  # Schema verification checklist
└── README.md            # This file
```

## 🚀 Quick Start

### 1. Run Migrations (In Order)

Execute these SQL files in your Supabase SQL Editor in this exact order:

```sql
-- 1. Create all tables, enums, constraints
migrations/001_create_schema.sql

-- 2. Enable RLS and create security policies
migrations/002_create_rls_policies.sql

-- 3. Create helper functions and views
migrations/003_create_functions_views.sql
```

### 2. Seed Initial Data

```sql
-- Insert the 12 approved institutions
seeds/001_seed_institutions.sql
```

### 3. Verify Setup

Run verification queries from `VERIFICATION_REPORT.md` to ensure everything is set up correctly.

## 📊 Schema Overview

### Tables (12)
1. **users** - System users with role-based access
2. **institutions** - 12 approved government institutions
3. **services** - Services offered by institutions
4. **service_requirements** - Required documents for services
5. **applications** - Citizen service applications
6. **queue_entries** - Service queue management
7. **maintenance_reports** - IT/Technical maintenance
8. **maintenance_attachments** - Maintenance file attachments
9. **maintenance_tasks** - Maintenance sub-tasks
10. **announcements** - System and institutional announcements
11. **notifications** - User notifications
12. **telegram_users** - Telegram bot integration

### User Roles (6)
- SUPER_ADMIN
- MESOB_MANAGER
- INSTITUTION_MANAGER
- EMPLOYEE
- ICT_STAFF
- CITIZEN

### Institutions (12)
1. Ethiopian Electric Utility
2. Revenues Bureau
3. Ministry of Justice
4. Commercial Bank of Ethiopia
5. Ethio Telecom
6. Ethiopian Postal Service Enterprise
7. Investment Commission
8. Labor and Skills Bureau
9. Trade Bureau
10. Construction Authority
11. National ID Program / Fayda
12. Sidama Bank

## 📖 Documentation

### Main Documentation
- **DATABASE_SCHEMA.md** - Complete schema documentation
- **SETUP_GUIDE.md** - Step-by-step setup instructions
- **VERIFICATION_REPORT.md** - Verification checklist

### Migration Files
- **001_create_schema.sql** - Core schema (tables, indexes, triggers)
- **002_create_rls_policies.sql** - Row Level Security policies
- **003_create_functions_views.sql** - Helper functions and views

### Seed Files
- **001_seed_institutions.sql** - 12 approved institutions

## 🔐 Security

### Row Level Security (RLS)
All tables have RLS enabled with role-based policies:

- **SUPER_ADMIN**: Full access to everything
- **MESOB_MANAGER**: System-wide read access
- **INSTITUTION_MANAGER**: Institution-scoped access
- **EMPLOYEE**: Task-assigned access
- **ICT_STAFF**: Maintenance-related access
- **CITIZEN**: Own data only

### 50+ Security Policies
Each table has multiple policies ensuring users can only access data they're authorized to see.

## 📈 Performance

### Indexes (60+)
- All primary keys indexed
- All foreign keys indexed
- Frequently queried fields indexed
- Composite indexes where appropriate

### Views (6)
Pre-optimized views for complex queries:
- user_profiles
- application_summary
- queue_statistics
- maintenance_summary
- active_announcements
- service_catalogue

## 🔧 Helper Functions

### Number Generation
- `generate_application_number(institution_code, service_code)`
- `generate_queue_number(institution_code)`
- `generate_maintenance_number()`

### User Utilities
- `get_unread_notification_count(user_id)`
- `mark_all_notifications_read(user_id)`
- `get_dashboard_stats(user_id)`

### Authentication Helpers
- `current_user_role()` - Get authenticated user's role
- `current_user_institution()` - Get authenticated user's institution

## ✅ Verification

After setup, verify:

```sql
-- Check tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Expected: 12

-- Check institutions
SELECT COUNT(*) FROM institutions;
-- Expected: 12

-- Check RLS
SELECT COUNT(*) FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = TRUE;
-- Expected: 12
```

## 🔄 Migration Strategy

### Forward Migration
Run migrations in order (001, 002, 003)

### Rollback
If needed, drop schema and start over:
```sql
-- WARNING: This deletes all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then re-run all migrations
```

## 📝 Naming Conventions

### Tables
- Plural, lowercase with underscores
- Example: `maintenance_reports`

### Columns
- Lowercase with underscores
- Timestamps end with `_at`
- Booleans start with `is_` or `has_`

### Foreign Keys
- Named after referenced table + `_id`
- Example: `institution_id`, `citizen_id`

### Indexes
- `idx_{table}_{column(s)}`
- Example: `idx_users_email`

### Enums
- Singular, lowercase with underscores
- Values in UPPERCASE
- Example: `user_role` with values `SUPER_ADMIN`, `CITIZEN`

## 🐛 Troubleshooting

### Common Issues

**Error: "relation already exists"**
```sql
DROP TABLE IF EXISTS table_name CASCADE;
-- Then re-run creation
```

**Error: "type already exists"**
```sql
DROP TYPE IF EXISTS type_name CASCADE;
-- Then re-run creation
```

**RLS not working**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## 📞 Support

For database-related issues:
1. Check `SETUP_GUIDE.md` for common solutions
2. Review `VERIFICATION_REPORT.md` for verification queries
3. Check Supabase logs for error details
4. Verify migrations ran in correct order

## 🔄 Updates

### Version History
- **1.0.0** (2024-01) - Initial schema release

### Future Enhancements
- Application document storage schema
- Analytics/reporting tables
- Audit log tables
- Performance monitoring views

---

**Schema Version:** 1.0.0  
**Last Updated:** January 2024  
**Status:** ✅ Production Ready
