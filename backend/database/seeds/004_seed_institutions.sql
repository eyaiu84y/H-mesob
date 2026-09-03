-- ============================================================================
-- Seed 004: Insert EXACTLY 12 Approved Institutions
-- Date: 2026-08-27
-- Description: Seed data for the 12 approved government institutions
-- Source: Frontend organizationsData (organizations.js)
-- ============================================================================

-- First, remove any institutions that are NOT in the approved list of 12
DELETE FROM institutions 
WHERE code NOT IN (
  'electric', 'revenue', 'justice', 'cbe', 'ethiotel', 'ethiopost',
  'investment', 'labor', 'trade', 'construction', 'fayda', 'sidama-bank'
);

-- Now insert/update the 12 approved institutions
DO $$
BEGIN
  -- 1. Ethiopian Electric Utility
  INSERT INTO institutions (code, name_en, name_am, website_url, logo_url, status)
  VALUES (
    'electric',
    'Ethiopian Electric Utility',
    'የኢትዮጵያ ኤሌክትሪክ አገልግሎት',
    'https://eeu.gov.et',
    '/image/ethio electric.png',
    'ACTIVE'
  )
  ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_am = EXCLUDED.name_am,
    website_url = EXCLUDED.website_url,
    logo_url = EXCLUDED.logo_url,
    status = 'ACTIVE',
    updated_at = NOW();

  -- 2. Revenues Bureau
  INSERT INTO institutions (code, name_en, name_am, website_url, logo_url, status)
  VALUES (
    'revenue',
    'Revenues Bureau',
    'ገቢዎች ባለስልጣን',
    'https://www.aarevenue.gov.et',
    '/image/revenue.jpg',
    'ACTIVE'
  )
  ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_am = EXCLUDED.name_am,
    website_url = EXCLUDED.website_url,
    logo_url = EXCLUDED.logo_url,
    status = 'ACTIVE',
    updated_at = NOW();

  -- 3. Ministry of Justice
  INSERT INTO institutions (code, name_en, name_am, website_url, logo_url, status)
  VALUES (
    'justice',
    'Ministry of Justice',
    'የፍትህ ሚኒስቴር',
    'https://justice.gov.et/en',
    '/image/ፍትሕ መምሪያ አገልግሎት.jpg',
    'ACTIVE'
  )
  ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_am = EXCLUDED.name_am,
    website_url = EXCLUDED.website_url,
    logo_url = EXCLUDED.logo_url,
    status = 'ACTIVE',
    updated_at = NOW();

  -- 4. Commercial Bank of Ethiopia
  INSERT INTO institutions (code, name_en, name_am, website_url, logo_url, status)
  VALUES (
    'cbe',
    'Commercial Bank of Ethiopia',
    'የኢትዮጵያ ንግድ ባንክ',
    'https://combanketh.et',
    '/image/cbe.jpg',
    'ACTIVE'
  )
  ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_am = EXCLUDED.name_am,
    website_url = EXCLUDED.website_url,
    logo_url = EXCLUDED.logo_url,
    status = 'ACTIVE',
    updated_at = NOW();

  -- 5. Ethio Telecom
  INSERT INTO institutions (code, name_en, name_am, website_url, logo_url, status)
  VALUES (
    'ethiotel',
    'Ethio Telecom',
    'ኢትዮ ቴሌኮም',
    'https://www.ethiotelecom.et',
    '/image/ethiotel.png',
    'ACTIVE'
  )
  ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_am = EXCLUDED.name_am,
    website_url = EXCLUDED.website_url,
    logo_url = EXCLUDED.logo_url,
    status = 'ACTIVE',
    updated_at = NOW();

  -- 6. Ethiopian Postal Service Enterprise
  INSERT INTO institutions (code, name_en, name_am, website_url, logo_url, status)
  VALUES (
    'ethiopost',
    'Ethiopian Postal Service Enterprise',
    'የኢትዮጵያ ፖስታ አገልግሎት ድርጅት',
    'https://ethio.post',
    '/image/Ethiopost-2.jpg',
    'ACTIVE'
  )
  ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_am = EXCLUDED.name_am,
    website_url = EXCLUDED.website_url,
    logo_url = EXCLUDED.logo_url,
    status = 'ACTIVE',
    updated_at = NOW();

  -- 7. Investment Commission
  INSERT INTO institutions (code, name_en, name_am, website_url, logo_url, status)
  VALUES (
    'investment',
    'Investment Commission',
    'ኢንቨስትመንት ኮሚሽን',
    'https://investethiopia.gov.et',
    '/image/መሬት አስተዳደርና ኢንቨስትመንት ልማት.jpg',
    'ACTIVE'
  )
  ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_am = EXCLUDED.name_am,
    website_url = EXCLUDED.website_url,
    logo_url = EXCLUDED.logo_url,
    status = 'ACTIVE',
    updated_at = NOW();

  -- 8. Labor and Skills Bureau
  INSERT INTO institutions (code, name_en, name_am, website_url, logo_url, status)
  VALUES (
    'labor',
    'Labor and Skills Bureau',
    'ሠራተኛ እና ክህሎት ቢሮ',
    'https://mols.gov.et',
    '/image/ሥራና ክህሎት.png',
    'ACTIVE'
  )
  ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_am = EXCLUDED.name_am,
    website_url = EXCLUDED.website_url,
    logo_url = EXCLUDED.logo_url,
    status = 'ACTIVE',
    updated_at = NOW();

  -- 9. Trade Bureau
  INSERT INTO institutions (code, name_en, name_am, website_url, logo_url, status)
  VALUES (
    'trade',
    'Trade Bureau',
    'ንግድ ቢሮ',
    'https://motri.gov.et/en',
    '/image/ንግድና ገበያ.jpg',
    'ACTIVE'
  )
  ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_am = EXCLUDED.name_am,
    website_url = EXCLUDED.website_url,
    logo_url = EXCLUDED.logo_url,
    status = 'ACTIVE',
    updated_at = NOW();

  -- 10. Construction Authority
  INSERT INTO institutions (code, name_en, name_am, website_url, logo_url, status)
  VALUES (
    'construction',
    'Construction Authority',
    'ግንባታ ባለስልጣን',
    '',
    '/image/ልማት.jpg',
    'ACTIVE'
  )
  ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_am = EXCLUDED.name_am,
    logo_url = EXCLUDED.logo_url,
    status = 'ACTIVE',
    updated_at = NOW();

  -- 11. National ID Program / Fayda
  INSERT INTO institutions (code, name_en, name_am, website_url, logo_url, status)
  VALUES (
    'fayda',
    'National ID Program / Fayda',
    'ብሔራዊ መታወቂያ ፕሮግራም / ፋይዳ',
    'https://www.id.gov.et',
    '/image/fayda.png',
    'ACTIVE'
  )
  ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_am = EXCLUDED.name_am,
    website_url = EXCLUDED.website_url,
    logo_url = EXCLUDED.logo_url,
    status = 'ACTIVE',
    updated_at = NOW();

  -- 12. Sidama Bank
  INSERT INTO institutions (code, name_en, name_am, website_url, logo_url, status)
  VALUES (
    'sidama-bank',
    'Sidama Bank',
    'ሲዳማ ባንክ',
    'https://sidamabanksc.com',
    '/image/የሲዳማ ባንክ አገልግሎት.png',
    'ACTIVE'
  )
  ON CONFLICT (code) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_am = EXCLUDED.name_am,
    website_url = EXCLUDED.website_url,
    logo_url = EXCLUDED.logo_url,
    status = 'ACTIVE',
    updated_at = NOW();

  RAISE NOTICE '✓ Exactly 12 institutions seeded successfully';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '✗ Error seeding institutions: %', SQLERRM;
    RAISE;
END $$;

-- ============================================================================
-- Verification Query
-- ============================================================================

-- Count active institutions (should be 12)
DO $$
DECLARE
  institution_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO institution_count 
  FROM institutions 
  WHERE status = 'ACTIVE';
  
  RAISE NOTICE 'Active institutions count: %', institution_count;
  
  IF institution_count != 12 THEN
    RAISE WARNING 'Expected 12 active institutions, found %', institution_count;
  END IF;
END $$;

-- Display all institutions
SELECT 
  code,
  name_en,
  name_am,
  website_url,
  status,
  created_at
FROM institutions
ORDER BY code;

-- ============================================================================
-- END OF SEED 004
-- ============================================================================

COMMENT ON TABLE institutions IS '12 approved government institutions providing services to citizens';
