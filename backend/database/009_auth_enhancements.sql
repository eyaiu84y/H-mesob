-- ============================================================================
-- Migration 009: Authentication Enhancements (Hawassa MESOB)
-- Purpose: Add must_change_password and email_verified tracking to users table
-- Safe, idempotent execution
-- ============================================================================

DO $$
BEGIN
    -- 1. Add must_change_password column if it does not already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'users' 
          AND column_name = 'must_change_password'
    ) THEN
        ALTER TABLE public.users ADD COLUMN must_change_password BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added must_change_password column to users table';
    ELSE
        RAISE NOTICE 'Column must_change_password already exists on users table';
    END IF;

    -- 2. Add email_verified column if it does not already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'users' 
          AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE public.users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added email_verified column to users table';
    ELSE
        RAISE NOTICE 'Column email_verified already exists on users table';
    END IF;

    -- 3. Set existing users' must_change_password to FALSE so they are not affected
    UPDATE public.users 
    SET must_change_password = FALSE 
    WHERE must_change_password IS NULL;

    -- 4. Set existing internal users to email_verified = TRUE
    UPDATE public.users 
    SET email_verified = TRUE 
    WHERE role IN ('SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER', 'EMPLOYEE', 'TECHNICIAN', 'ICT_STAFF');

END $$;
