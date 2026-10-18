-- Migration 004: Add APPROVED status to maintenance_status enum
DO $$
BEGIN
  ALTER TYPE maintenance_status ADD VALUE IF NOT EXISTS 'APPROVED';
END
$$;
