-- ================================================
-- ACTIVATE EXISTING ANNOUNCEMENTS
-- ================================================
-- This script activates all existing announcements that were
-- created but never published (is_active = false).
-- 
-- Run this in Supabase SQL Editor if you have old announcements
-- that are not showing up on the website.
-- ================================================

-- 1. Activate all PUBLIC announcements
UPDATE announcements 
SET 
  is_active = true,
  published_at = COALESCE(published_at, created_at),
  updated_at = NOW()
WHERE 
  scope = 'PUBLIC' 
  AND is_active = false;

-- 2. Activate all other scope announcements (optional)
UPDATE announcements 
SET 
  is_active = true,
  published_at = COALESCE(published_at, created_at),
  updated_at = NOW()
WHERE 
  is_active = false;

-- 3. Verify the update
SELECT 
  id,
  title,
  scope,
  is_active,
  published_at,
  created_at
FROM announcements
ORDER BY created_at DESC
LIMIT 20;

-- ================================================
-- Expected Output:
-- All announcements should now have is_active = true
-- and published_at should have a timestamp
-- ================================================
