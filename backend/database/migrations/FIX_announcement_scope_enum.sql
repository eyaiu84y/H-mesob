-- ========================================
-- Fix: Add INTERNAL to announcement_scope enum
-- ========================================
-- Date: October 9, 2026
-- Issue: Cannot create announcements with INTERNAL scope
-- Solution: Add missing enum value
-- ========================================

-- Add INTERNAL value to announcement_scope enum
ALTER TYPE announcement_scope ADD VALUE IF NOT EXISTS 'INTERNAL';

-- Verify the fix
SELECT 
  'announcement_scope enum values:' AS info,
  unnest(enum_range(NULL::announcement_scope))::text AS value;

-- Expected output:
-- SYSTEM
-- INSTITUTION
-- ROLE
-- PUBLIC
-- INTERNAL
