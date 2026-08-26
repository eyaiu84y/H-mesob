-- ============================================================================
-- Seed Data: 12 Approved Institutions
-- Version: 1.0.0
-- Description: Insert the 12 approved government institutions
-- ============================================================================

-- Insert institutions based on organizations.js from frontend
INSERT INTO institutions (code, name_en, name_am, website_url, status, metadata) VALUES

-- 1. Ethiopian Electric Utility
('electric', 
 'Ethiopian Electric Utility', 
 'የኢትዮጵያ ኤሌክትሪክ አገልግሎት',
 'https://eeu.gov.et',
 'ACTIVE',
 '{"logo_path": "/image/ethio electric.png"}'::jsonb),

-- 2. Revenues Bureau
('revenue', 
 'Revenues Bureau', 
 'ገቢዎች ባለስልጣን',
 'https://www.aarevenue.gov.et',
 'ACTIVE',
 '{"logo_path": "/image/revenue.jpg"}'::jsonb),

-- 3. Ministry of Justice
('justice', 
 'Ministry of Justice', 
 'የፍትህ ሚኒስቴር',
 'https://justice.gov.et/en',
 'ACTIVE',
 '{"logo_path": "/image/ፍትሕ መምሪያ አገልግሎት.jpg"}'::jsonb),

-- 4. Commercial Bank of Ethiopia
('cbe', 
 'Commercial Bank of Ethiopia', 
 'የኢትዮጵያ ንግድ ባንክ',
 'https://combanketh.et',
 'ACTIVE',
 '{"logo_path": "/image/cbe.jpg"}'::jsonb),

-- 5. Ethio Telecom
('ethiotel', 
 'Ethio Telecom', 
 'ኢትዮ ቴሌኮም',
 'https://www.ethiotelecom.et',
 'ACTIVE',
 '{"logo_path": "/image/Ethio_telecom.png"}'::jsonb),

-- 6. Ethiopian Postal Service Enterprise
('ethiopost', 
 'Ethiopian Postal Service Enterprise', 
 'የኢትዮጵያ ፖስታ አገልግሎት ድርጅት',
 'https://ethio.post',
 'ACTIVE',
 '{"logo_path": "/image/Ethiopost-2.jpg"}'::jsonb),

-- 7. Investment Commission
('investment', 
 'Investment Commission', 
 'ኢንቨስትመንት ኮሚሽን',
 'https://investethiopia.gov.et',
 'ACTIVE',
 '{"logo_path": "/image/መሬት አስተዳደርና ኢንቨስትመንት ልማት.jpg"}'::jsonb),

-- 8. Labor and Skills Bureau
('labor', 
 'Labor and Skills Bureau', 
 'ሠራተኛ እና ክህሎት ቢሮ',
 'https://mols.gov.et',
 'ACTIVE',
 '{"logo_path": "/image/ሥራና ክህሎት.png"}'::jsonb),

-- 9. Trade Bureau
('trade', 
 'Trade Bureau', 
 'ንግድ ቢሮ',
 'https://motri.gov.et/en',
 'ACTIVE',
 '{"logo_path": "/image/ንግድና ገበያ.jpg"}'::jsonb),

-- 10. Construction Authority
('construction', 
 'Construction Authority', 
 'ግንባታ ባለስልጣን',
 '',
 'ACTIVE',
 '{"logo_path": "/image/ልማት.jpg"}'::jsonb),

-- 11. National ID Program / Fayda
('fayda', 
 'National ID Program / Fayda', 
 'ብሔራዊ መታወቂያ ፕሮግራም / ፋይዳ',
 'https://www.id.gov.et',
 'ACTIVE',
 '{"logo_path": "/image/fayda.png"}'::jsonb),

-- 12. Sidama Bank
('sidama-bank', 
 'Sidama Bank', 
 'ሲዳማ ባንክ',
 'https://sidamabanksc.com',
 'ACTIVE',
 '{"logo_path": "/image/የሲዳማ ባንክ አገልግሎት.png"}'::jsonb);

-- ============================================================================
-- Verification Query
-- ============================================================================

-- Verify all 12 institutions were inserted
-- SELECT COUNT(*) as total_institutions FROM institutions;
-- Expected result: 12

-- View all institutions
-- SELECT code, name_en, name_am, status FROM institutions ORDER BY name_en;

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
