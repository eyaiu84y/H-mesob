// Fix services schema - delete all and reseed with correct columns
import { supabase } from './src/config/supabase.js';

async function fixServices() {
  try {
    console.log('🔧 Fixing services schema...\n');

    // First delete queue entries that reference services
    console.log('🗑️  Deleting existing queue entries...');
    const { error: queueDeleteError } = await supabase
      .from('queue_entries')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (queueDeleteError) {
      console.warn('⚠️  Queue delete warning:', queueDeleteError.message);
    } else {
      console.log('✓ Queue entries deleted\n');
    }

    // Delete ALL existing services
    console.log('🗑️  Deleting all existing services...');
    const { error: deleteError } = await supabase
      .from('services')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
      return;
    }
    console.log('✓ All services deleted\n');

    // Get institutions
    const { data: institutions, error: instError } = await supabase
      .from('institutions')
      .select('id, code, name_en')
      .in('code', ['fayda', 'cbe', 'revenue']);

    if (instError) {
      console.error('❌ Error fetching institutions:', instError);
      return;
    }

    const faydaInst = institutions.find(i => i.code === 'fayda');
    const cbeInst = institutions.find(i => i.code === 'cbe');
    const revenueInst = institutions.find(i => i.code === 'revenue');

    console.log('✓ Found institutions\n');

    // Insert services with CORRECT columns: title_en, title_am
    const services = [
      {
        institution_id: faydaInst.id,
        code: 'FAYDA_NEW',
        title_en: 'New National ID Application',
        title_am: 'አዲስ ብሔራዊ መታወቂያ ማመልከቻ',
        description_en: 'Apply for a new national ID card',
        processing_time: '3-5 business days',
        service_fee: '50 ETB',
        is_active: true
      },
      {
        institution_id: faydaInst.id,
        code: 'FAYDA_RENEW',
        title_en: 'National ID Renewal',
        title_am: 'ብሔራዊ መታወቂያ እድሳት',
        description_en: 'Renew your existing national ID card',
        processing_time: '2-3 business days',
        service_fee: '30 ETB',
        is_active: true
      },
      {
        institution_id: cbeInst.id,
        code: 'CBE_ACCOUNT',
        title_en: 'New Bank Account',
        title_am: 'አዲስ የባንክ መለያ',
        description_en: 'Open a new bank account',
        processing_time: '1-2 hours',
        service_fee: 'Free',
        is_active: true
      },
      {
        institution_id: revenueInst.id,
        code: 'REV_TIN',
        title_en: 'TIN Registration',
        title_am: 'ቲአይኤን ምዝገባ',
        description_en: 'Register for Tax Identification Number',
        processing_time: '1-2 business days',
        service_fee: 'Free',
        is_active: true
      }
    ];

    console.log(`📝 Inserting ${services.length} services with correct schema...\n`);

    for (const service of services) {
      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select('id, code, title_en, title_am');

      if (error) {
        console.error(`❌ Error inserting ${service.code}:`, error.message);
        console.error('   Details:', error.details);
        console.error('   Hint:', error.hint);
      } else {
        console.log(`✓ ${data[0].code}: ${data[0].title_en}`);
      }
    }

    console.log('\n✅ Services fixed and reseeded!');

    // Verify
    const { data: allServices, error: verifyError } = await supabase
      .from('services')
      .select('id, title_en, title_am');

    if (!verifyError && allServices) {
      console.log(`\n📊 Total services: ${allServices.length}`);
      allServices.forEach(s => {
        console.log(`   - ${s.title_en} / ${s.title_am}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run
fixServices().then(() => {
  console.log('\n✅ Done');
  process.exit(0);
}).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
