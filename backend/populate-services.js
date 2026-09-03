/**
 * Populate All 37 Approved Services
 * Manually inserts services using Supabase JS client based on approved source data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

// Source: database/seeds/002_seed_services.sql (approved service catalogue)
const APPROVED_SERVICES = [
  // Ethiopian Electric Utility
  {
    inst_code: 'electric',
    code: 'electric-bill-payment',
    title_en: 'Electricity Bill Payment',
    title_am: 'የኤሌክትሪክ ክፍያ ማስታወሻ',
    processing_time: 'Instant',
    service_fee: 'As per consumption',
    service_url: 'https://eeu.gov.et'
  },
  
  // Revenues Bureau
  {
    inst_code: 'revenue',
    code: 'tax-payment',
    title_en: 'Tax Payment',
    title_am: 'የታክስ ክፍያ',
    processing_time: 'Instant to Same Day',
    service_fee: 'As per tax assessment',
    service_url: 'https://www.aarevenue.gov.et'
  },
  
  // Ministry of Justice (3 services)
  {
    inst_code: 'justice',
    code: 'federal-attorney-license',
    title_en: 'Issuance of Practice Licenses for Federal Attorneys',
    title_am: 'ለፌዴራል ጠበቆች የልምምድ ፈቃድ አሰጣጥ',
    processing_time: '5 days',
    service_fee: '400 Birr',
    service_url: 'https://justice.gov.et/en'
  },
  {
    inst_code: 'justice',
    code: 'federal-attorney-renewal',
    title_en: 'Renewal of Federal Attorney Practice Licenses',
    title_am: 'የፌዴራል ጠበቃ የልምምድ ፈቃድ ማደስ',
    processing_time: '15 minutes',
    service_fee: '300 Birr',
    service_url: 'https://justice.gov.et/en'
  },
  {
    inst_code: 'justice',
    code: 'federal-attorney-upgrade',
    title_en: 'Upgrading of Federal Attorney Practice Licenses',
    title_am: 'የፌዴራል ጠበቃ የልምምድ ፈቃድ ማሻሻያ',
    processing_time: '5 days',
    service_fee: '400 Birr',
    service_url: 'https://justice.gov.et/en'
  },
  
  // Commercial Bank of Ethiopia (2 services)
  {
    inst_code: 'cbe',
    code: 'account-opening',
    title_en: 'Account Opening',
    title_am: 'ሂሳብ መክፈቻ',
    processing_time: '25 minutes',
    service_fee: 'None',
    service_url: 'https://combanketh.et'
  },
  {
    inst_code: 'cbe',
    code: 'mobile-banking',
    title_en: 'Mobile Banking',
    title_am: 'የሞባይል ባንክ አገልግሎት',
    processing_time: '5 minutes',
    service_fee: 'None',
    service_url: 'https://combanketh.et'
  },
  
  // Ethio Telecom (2 services)
  {
    inst_code: 'ethiotel',
    code: 'sim-registration',
    title_en: 'New SIM Card Registration',
    title_am: 'አዲስ ሲም ካርድ ምዝገባ',
    processing_time: 'Stage 1: 1 to 3 Minutes, Stage 2: 5 to 10 Minutes, Stage 3: 1 Day',
    service_fee: 'Standard: 50 ETB, VIP: 1,000 ETB',
    service_url: 'https://www.ethiotelecom.et'
  },
  {
    inst_code: 'ethiotel',
    code: 'telebirr-registration',
    title_en: 'Telebirr Registration and Services',
    title_am: 'ቴሌብር ምዝገባ እና አገልግሎቶች',
    processing_time: 'Instant',
    service_fee: 'None (Transaction fees may apply)',
    service_url: 'https://www.ethiotelecom.et'
  },
  
  // Ethiopian Postal Service (11 services)
  {
    inst_code: 'ethiopost',
    code: 'po-box-rental',
    title_en: 'P.O. Box Rental',
    title_am: 'የፖስታ ሳጥን ኪራይ',
    processing_time: 'Same Day',
    service_fee: 'Varies by box size and location',
    service_url: 'https://ethio.post'
  },
  {
    inst_code: 'ethiopost',
    code: 'domestic-parcel',
    title_en: 'Domestic Parcel and Letter Services',
    title_am: 'የሀገር ውስጥ ጥቅል እና ደብዳቤ አገልግሎቶች',
    processing_time: '1 to 7 Days (depending on destination)',
    service_fee: 'Based on weight and destination',
    service_url: 'https://ethio.post'
  },
  {
    inst_code: 'ethiopost',
    code: 'international-parcel',
    title_en: 'International Parcel and Letter Services',
    title_am: 'ዓለም አቀፍ ጥቅል እና ደብዳቤ አገልግሎቶች',
    processing_time: '5 to 21 Days (depending on destination)',
    service_fee: 'Based on weight, destination, and service type',
    service_url: 'https://ethio.post'
  },
  {
    inst_code: 'ethiopost',
    code: 'ems-service',
    title_en: 'Express Mail Service (EMS)',
    title_am: 'ፈጣን የፖስታ አገልግሎት (EMS)',
    processing_time: '1 to 3 Days (domestic), 3 to 7 Days (international)',
    service_fee: 'Premium rates based on weight and destination',
    service_url: 'https://ethio.post'
  },
  {
    inst_code: 'ethiopost',
    code: 'money-order',
    title_en: 'Postal Money Order',
    title_am: 'የፖስታ ገንዘብ ትዕዛዝ',
    processing_time: 'Same Day to 3 Days',
    service_fee: 'Service charge based on amount sent',
    service_url: 'https://ethio.post'
  },
  {
    inst_code: 'ethiopost',
    code: 'stamp-collection',
    title_en: 'Philatelic Services (Stamp Collection)',
    title_am: 'ፊላቴሊክ አገልግሎቶች (የማህተም ስብስብ)',
    processing_time: 'Instant',
    service_fee: 'Varies by stamp type',
    service_url: 'https://ethio.post'
  },
  {
    inst_code: 'ethiopost',
    code: 'courier-services',
    title_en: 'Courier Services',
    title_am: 'የኩሪየር አገልግሎቶች',
    processing_time: 'Same Day to 3 Days (depending on service level)',
    service_fee: 'Based on weight, destination, and urgency',
    service_url: 'https://ethio.post'
  },
  {
    inst_code: 'ethiopost',
    code: 'registered-mail',
    title_en: 'Registered Mail',
    title_am: 'የተመዘገበ ፖስታ',
    processing_time: '3 to 7 Days',
    service_fee: 'Based on weight and destination',
    service_url: 'https://ethio.post'
  },
  {
    inst_code: 'ethiopost',
    code: 'bill-payment',
    title_en: 'Bill Payment Services',
    title_am: 'የሂሳብ ክፍያ አገልግሎቶች',
    processing_time: 'Instant',
    service_fee: 'Small service charge',
    service_url: 'https://ethio.post'
  },
  {
    inst_code: 'ethiopost',
    code: 'postal-banking',
    title_en: 'Postal Banking Services',
    title_am: 'የፖስታ ባንክ አገልግሎቶች',
    processing_time: 'Same Day',
    service_fee: 'None for account opening; transaction fees may apply',
    service_url: 'https://ethio.post'
  },
  {
    inst_code: 'ethiopost',
    code: 'track-trace',
    title_en: 'Track and Trace Services',
    title_am: 'ክትትል እና ፍለጋ አገልግሎቶች',
    processing_time: 'Instant',
    service_fee: 'None',
    service_url: 'https://ethio.post'
  },
  
  // Investment Commission
  {
    inst_code: 'investment',
    code: 'investment-license',
    title_en: 'Investment License / Permit',
    title_am: 'የኢንቨስትመንት ፈቃድ / ፍቃድ',
    processing_time: '5 to 15 Working Days',
    service_fee: 'Varies by investment size and sector',
    service_url: 'https://investethiopia.gov.et'
  },
  
  // Labor and Skills Bureau (2 services)
  {
    inst_code: 'labor',
    code: 'work-permit-new',
    title_en: 'Issuance of a New Work Permit for Foreign Nationals',
    title_am: 'ለውጭ ዜጎች አዲስ የሥራ ፈቃድ አሰጣጥ',
    processing_time: '30 minutes',
    service_fee: '2000 ETB',
    service_url: 'https://mols.gov.et'
  },
  {
    inst_code: 'labor',
    code: 'work-permit-renewal',
    title_en: 'Work Permit Renewal for Foreign Nationals',
    title_am: 'ለውጭ ዜጎች የሥራ ፈቃድ ማደስ',
    processing_time: '20 minutes',
    service_fee: '1500 ETB',
    service_url: 'https://mols.gov.et'
  },
  
  // Trade Bureau (7 services)
  {
    inst_code: 'trade',
    code: 'business-registration',
    title_en: 'New Business Registration',
    title_am: 'አዲስ ንግድ ምዝገባ',
    processing_time: '3 to 5 Working Days',
    service_fee: 'Varies by business type',
    service_url: 'https://motri.gov.et/en'
  },
  {
    inst_code: 'trade',
    code: 'business-license-renewal',
    title_en: 'Business License Renewal',
    title_am: 'የንግድ ፈቃድ እድሳት',
    processing_time: '1 to 2 Working Days',
    service_fee: 'Varies by business type',
    service_url: 'https://motri.gov.et/en'
  },
  {
    inst_code: 'trade',
    code: 'trade-name-reservation',
    title_en: 'Trade Name Reservation',
    title_am: 'የንግድ ስም ማስያዝ',
    processing_time: '1 Working Day',
    service_fee: '100 ETB',
    service_url: 'https://motri.gov.et/en'
  },
  {
    inst_code: 'trade',
    code: 'import-export-license',
    title_en: 'Import/Export License',
    title_am: 'የማስመጣት/መላክ ፈቃድ',
    processing_time: '5 to 7 Working Days',
    service_fee: 'Varies by license type',
    service_url: 'https://motri.gov.et/en'
  },
  {
    inst_code: 'trade',
    code: 'certificate-origin',
    title_en: 'Certificate of Origin',
    title_am: 'የመነሻ ምስክር ወረቀት',
    processing_time: '1 to 2 Working Days',
    service_fee: '150 ETB per certificate',
    service_url: 'https://motri.gov.et/en'
  },
  {
    inst_code: 'trade',
    code: 'consumer-protection',
    title_en: 'Consumer Protection Services',
    title_am: 'የሸማቾች ጥበቃ አገልግሎቶች',
    processing_time: 'Varies by case',
    service_fee: 'None',
    service_url: 'https://motri.gov.et/en'
  },
  {
    inst_code: 'trade',
    code: 'fair-trade-certification',
    title_en: 'Fair Trade Practice Certification',
    title_am: 'ፍትሃዊ የንግድ ልምምድ ማረጋገጫ',
    processing_time: '10 to 15 Working Days',
    service_fee: 'Varies',
    service_url: 'https://motri.gov.et/en'
  },
  
  // Construction Authority
  {
    inst_code: 'construction',
    code: 'building-permit',
    title_en: 'Building Permit',
    title_am: 'የግንባታ ፈቃድ',
    processing_time: '15 to 30 Working Days',
    service_fee: 'Based on project size and type',
    service_url: ''
  },
  
  // National ID Program / Fayda (4 services)
  {
    inst_code: 'fayda',
    code: 'fayda-registration',
    title_en: 'Fayda National Digital ID Registration (New ID)',
    title_am: 'ፋይዳ ብሔራዊ ዲጂታል መታወቂያ ምዝገባ (አዲስ መታወቂያ)',
    processing_time: '3 to 5 Working Days',
    service_fee: 'Free for first issuance',
    service_url: 'https://www.id.gov.et'
  },
  {
    inst_code: 'fayda',
    code: 'fayda-update-renewal',
    title_en: 'Fayda Demographic and Biometric Data Update / Renewal',
    title_am: 'ፋይዳ የስነ ሕዝብ እና ባዮሜትሪክ መረጃ ማሻሻያ / ማደስ',
    processing_time: '2 to 3 Working Days',
    service_fee: '30 ETB',
    service_url: 'https://www.id.gov.et'
  },
  {
    inst_code: 'fayda',
    code: 'fayda-replacement',
    title_en: 'Fayda National Digital ID Replacement (Lost / Damaged)',
    title_am: 'ፋይዳ ብሔራዊ ዲጂታል መታወቂያ ምትክ (የጠፋ / የተበላሸ)',
    processing_time: '3 to 5 Working Days',
    service_fee: '50 ETB',
    service_url: 'https://www.id.gov.et'
  },
  {
    inst_code: 'fayda',
    code: 'fayda-grievance-level1',
    title_en: 'Fayda National Digital ID Grievance and Dispute Resolution System (Level 1)',
    title_am: 'ፋይዳ ብሔራዊ ዲጂታል መታወቂያ ቅሬታ እና ክርክር አፈታት ስርዓት (ደረጃ 1)',
    processing_time: '5 to 10 Working Days',
    service_fee: 'None',
    service_url: 'https://www.id.gov.et'
  },
  
  // Sidama Bank (2 services)
  {
    inst_code: 'sidama-bank',
    code: 'account-opening',
    title_en: 'Account Opening',
    title_am: 'ሂሳብ መክፈቻ',
    processing_time: '30 minutes',
    service_fee: 'None',
    service_url: 'https://sidamabanksc.com'
  },
  {
    inst_code: 'sidama-bank',
    code: 'mobile-banking',
    title_en: 'Mobile Banking',
    title_am: 'የሞባይል ባንክ አገልግሎት',
    processing_time: '10 minutes',
    service_fee: 'None',
    service_url: 'https://sidamabanksc.com'
  }
];

async function populateServices() {
  try {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║          POPULATE ALL 37 APPROVED SERVICES                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    // Get institution mapping
    console.log('🏢 Fetching institutions...');
    const { data: institutions, error: instError } = await supabase
      .from('institutions')
      .select('id, code');
    
    if (instError) throw instError;
    
    const instMap = {};
    institutions.forEach(inst => {
      instMap[inst.code] = inst.id;
    });
    console.log(`   Found ${institutions.length} institutions`);
    console.log('');

    // Count existing
    console.log('📊 Current service count...');
    const { count: before } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true });
    console.log(`   Existing: ${before}`);
    console.log('');

    // Insert services
    console.log('🚀 Inserting approved services...');
    let inserted = 0;
    let skipped = 0;
    let failed = 0;

    for (const service of APPROVED_SERVICES) {
      const institution_id = instMap[service.inst_code];
      
      if (!institution_id) {
        console.log(`   ⚠️  Institution "${service.inst_code}" not found, skipping: ${service.title_en}`);
        failed++;
        continue;
      }

      // Check if service already exists
      const { data: existing } = await supabase
        .from('services')
        .select('id')
        .eq('institution_id', institution_id)
        .eq('code', service.code)
        .single();

      if (existing) {
        console.log(`   ⏭️  Skipped (exists): ${service.title_en}`);
        skipped++;
        continue;
      }

      // Insert service
      const { error: insertError } = await supabase
        .from('services')
        .insert({
          institution_id,
          code: service.code,
          title_en: service.title_en,
          title_am: service.title_am,
          processing_time: service.processing_time,
          service_fee: service.service_fee,
          service_url: service.service_url,
          is_active: true
        });

      if (insertError) {
        console.log(`   ❌ Failed: ${service.title_en} - ${insertError.message}`);
        failed++;
      } else {
        console.log(`   ✅ Inserted: ${service.title_en}`);
        inserted++;
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   Services inserted: ' + inserted);
    console.log('   Services skipped: ' + skipped);
    console.log('   Services failed: ' + failed);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // Final count
    const { count: after } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Final service count: ${after}`);
    console.log('');

    console.log('✅ SERVICE POPULATION COMPLETE');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

populateServices();
