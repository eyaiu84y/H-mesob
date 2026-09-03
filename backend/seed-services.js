// Seed test services for queue workflow testing
import { supabase } from './src/config/supabase.js';

async function seedServices() {
  try {
    console.log('🌱 Seeding test services...\n');

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

    if (!faydaInst || !cbeInst || !revenueInst) {
      console.error('❌ Required institutions not found');
      console.log('Available:', institutions.map(i => i.code));
      return;
    }

    console.log('✓ Found institutions:');
    console.log(`  - Fayda: ${faydaInst.id}`);
    console.log(`  - CBE: ${cbeInst.id}`);
    console.log(`  - Revenue: ${revenueInst.id}\n`);

    // Seed services
    const services = [
      // Fayda services
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
        institution_id: faydaInst.id,
        code: 'FAYDA_LOST',
        title_en: 'Lost ID Replacement',
        title_am: 'የጠፋ መታወቂያ ምትክ',
        description_en: 'Replace a lost or stolen ID card',
        processing_time: '5-7 business days',
        service_fee: '100 ETB',
        is_active: true
      },
      // CBE services
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
        institution_id: cbeInst.id,
        code: 'CBE_LOAN',
        title_en: 'Loan Application',
        title_am: 'ብድር ማመልከቻ',
        description_en: 'Apply for a personal or business loan',
        processing_time: '5-10 business days',
        service_fee: 'Free',
        is_active: true
      },
      // Revenue services
      {
        institution_id: revenueInst.id,
        code: 'REV_TIN',
        title_en: 'TIN Registration',
        title_am: 'ቲአይኤን ምዝገባ',
        description_en: 'Register for Tax Identification Number',
        processing_time: '1-2 business days',
        service_fee: 'Free',
        is_active: true
      },
      {
        institution_id: revenueInst.id,
        code: 'REV_RENEW',
        title_en: 'Business License Renewal',
        title_am: 'የንግድ ፈቃድ እድሳት',
        description_en: 'Renew your business operating license',
        processing_time: '2-3 business days',
        service_fee: '200 ETB',
        is_active: true
      }
    ];

    console.log(`📝 Inserting ${services.length} services...\n`);

    // Delete old services first to avoid conflicts
    const { error: deleteError } = await supabase
      .from('services')
      .delete()
      .in('code', services.map(s => s.code));

    if (deleteError) {
      console.warn('⚠️  Could not delete old services:', deleteError.message);
    }

    for (const service of services) {
      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select('id, code, title_en');

      if (error) {
        console.error(`❌ Error seeding ${service.code}:`, error);
      } else {
        console.log(`✓ ${service.code}: ${service.title_en}`);
      }
    }

    console.log('\n✅ Service seeding complete!');

    // Verify
    const { data: allServices, error: verifyError } = await supabase
      .from('services')
      .select('id, title_en, institutions(name_en)')
      .eq('is_active', true);

    if (!verifyError) {
      console.log(`\n📊 Total active services: ${allServices.length}`);
      console.log('\nServices by institution:');
      const byInst = allServices.reduce((acc, s) => {
        const inst = s.institutions?.name_en || 'Unknown';
        acc[inst] = (acc[inst] || 0) + 1;
        return acc;
      }, {});
      Object.entries(byInst).forEach(([inst, count]) => {
        console.log(`  - ${inst}: ${count} services`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run seeding
seedServices().then(() => {
  console.log('\n✅ Done');
  process.exit(0);
}).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
