-- ============================================================================
-- Seed 005: Insert Test Services for Queue Testing
-- Date: 2026-08-28
-- Description: Minimal service data for testing queue workflow
-- ============================================================================

DO $$
DECLARE
  inst_fayda_id UUID;
  inst_cbe_id UUID;
  inst_revenue_id UUID;
BEGIN
  -- Get institution IDs
  SELECT id INTO inst_fayda_id FROM institutions WHERE code = 'fayda';
  SELECT id INTO inst_cbe_id FROM institutions WHERE code = 'cbe';
  SELECT id INTO inst_revenue_id FROM institutions WHERE code = 'revenue';

  -- Fayda National ID Services
  INSERT INTO services (institution_id, code, title_en, title_am, description_en, processing_time, service_fee, is_active)
  VALUES 
    (inst_fayda_id, 'FAYDA_NEW', 'New National ID Application', 'አዲስ ብሔራዊ መታወቂያ ማመልከቻ', 'Apply for a new national ID card', '3-5 business days', '50 ETB', true),
    (inst_fayda_id, 'FAYDA_RENEW', 'National ID Renewal', 'ብሔራዊ መታወቂያ እድሳት', 'Renew your existing national ID card', '2-3 business days', '30 ETB', true),
    (inst_fayda_id, 'FAYDA_LOST', 'Lost ID Replacement', 'የጠፋ መታወቂያ ምትክ', 'Replace a lost or stolen ID card', '5-7 business days', '100 ETB', true)
  ON CONFLICT (institution_id, code) DO UPDATE SET
    title_en = EXCLUDED.title_en,
    title_am = EXCLUDED.title_am,
    description_en = EXCLUDED.description_en,
    processing_time = EXCLUDED.processing_time,
    service_fee = EXCLUDED.service_fee,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

  -- CBE Banking Services
  INSERT INTO services (institution_id, code, title_en, title_am, description_en, processing_time, service_fee, is_active)
  VALUES 
    (inst_cbe_id, 'CBE_ACCOUNT', 'New Bank Account', 'አዲስ የባንክ መለያ', 'Open a new bank account', '1-2 hours', 'Free', true),
    (inst_cbe_id, 'CBE_LOAN', 'Loan Application', 'ብድር ማመልከቻ', 'Apply for a personal or business loan', '5-10 business days', 'Free', true),
    (inst_cbe_id, 'CBE_CARD', 'ATM Card Request', 'የኤቲኤም ካርድ ጥያቄ', 'Request a new ATM/debit card', '3-5 business days', '50 ETB', true)
  ON CONFLICT (institution_id, code) DO UPDATE SET
    title_en = EXCLUDED.title_en,
    title_am = EXCLUDED.title_am,
    description_en = EXCLUDED.description_en,
    processing_time = EXCLUDED.processing_time,
    service_fee = EXCLUDED.service_fee,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

  -- Revenue Services
  INSERT INTO services (institution_id, code, title_en, title_am, description_en, processing_time, service_fee, is_active)
  VALUES 
    (inst_revenue_id, 'REV_TIN', 'TIN Registration', 'ቲአይኤን ምዝገባ', 'Register for Tax Identification Number', '1-2 business days', 'Free', true),
    (inst_revenue_id, 'REV_RENEW', 'Business License Renewal', 'የንግድ ፈቃድ እድሳት', 'Renew your business operating license', '2-3 business days', '200 ETB', true),
    (inst_revenue_id, 'REV_CERT', 'Tax Clearance Certificate', 'የግብር ማረጋገጫ ሰርተፍኬት', 'Obtain tax clearance certificate', '3-5 business days', '100 ETB', true)
  ON CONFLICT (institution_id, code) DO UPDATE SET
    title_en = EXCLUDED.title_en,
    title_am = EXCLUDED.title_am,
    description_en = EXCLUDED.description_en,
    processing_time = EXCLUDED.processing_time,
    service_fee = EXCLUDED.service_fee,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

  RAISE NOTICE '✓ Test services seeded successfully';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '✗ Error seeding services: %', SQLERRM;
    RAISE;
END $$;

-- Verification
SELECT 
  i.name_en as institution,
  s.code,
  s.title_en,
  s.processing_time,
  s.service_fee,
  s.is_active
FROM services s
JOIN institutions i ON s.institution_id = i.id
ORDER BY i.name_en, s.code;

