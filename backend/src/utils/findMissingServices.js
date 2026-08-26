import { supabase } from '../config/supabase.js';

async function findMissing() {
  // Get all services from database
  const { data: dbServices } = await supabase
    .from('services')
    .select('code, title_en');
  
  console.log('📊 Database has', dbServices.length, 'services\n');
  
  // Expected services (from migration file)
  const expected = [
    // Part 1 (DO block 1) - Should be present
    'electric-bill-payment',
    'tax-payment',
    'federal-attorney-license',
    'federal-attorney-renewal',
    'federal-attorney-upgrade',
    'account-opening', // CBE
    'mobile-banking', // CBE
    'sim-registration',
    'telebirr-registration',
    
    // Part 2 (DO block 2) - Likely missing
    'po-box-rental',
    'domestic-parcel',
    'international-parcel',
    'ems-service',
    'money-order',
    'stamp-collection',
    'courier-services',
    'registered-mail',
    'bill-payment',
    'postal-banking',
    'track-trace',
    'investment-license',
    'work-permit-new',
    'work-permit-renewal',
    
    // Part 3 (DO block 3) - Likely missing
    'business-registration',
    'business-license-renewal',
    'trade-name-reservation',
    'import-export-license',
    'certificate-of-origin',
    'consumer-protection',
    'fair-trade-certification',
    'building-permit',
    'fayda-new-registration',
    'fayda-update-renewal',
    'fayda-replacement',
    'fayda-grievance-level1',
    'account-opening', // Sidama (duplicate code with CBE!)
    'mobile-banking' // Sidama (duplicate code with CBE!)
  ];
  
  const dbCodes = new Set(dbServices.map(s => s.code));
  const missing = expected.filter(code => !dbCodes.has(code));
  
  console.log('❌ Missing services:', missing.length);
  if (missing.length > 0) {
    missing.forEach(code => console.log(`   - ${code}`));
  }
  
  console.log('\n✅ Present services:', dbServices.length);
  console.log('\nServices by code:');
  dbServices.forEach(s => console.log(`   ${s.code}: ${s.title_en}`));
}

findMissing();
