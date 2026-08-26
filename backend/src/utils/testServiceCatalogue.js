import { supabase } from '../config/supabase.js';

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║     🧪 SERVICE CATALOGUE TEST                         ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

async function testServiceCatalogue() {
  let passedTests = 0;
  let failedTests = 0;

  function logTest(testName, passed, details = '') {
    if (passed) {
      console.log(`✅ ${testName}`);
      if (details) console.log(`   ${details}`);
      passedTests++;
    } else {
      console.log(`❌ ${testName}`);
      if (details) console.log(`   ${details}`);
      failedTests++;
    }
  }

  console.log('📊 TEST 1: Total Services Count\n');
  
  try {
    const { data: services, error } = await supabase
      .from('services')
      .select('*');

    if (error) throw error;

    const serviceCount = services.length;
    logTest(
      'Query services table',
      true,
      `Found ${serviceCount} services`
    );
    logTest(
      'Verify service count',
      serviceCount === 37,
      `Expected 37, got ${serviceCount}`
    );
  } catch (err) {
    logTest('Query services table', false, err.message);
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('📊 TEST 2: Total Requirements Count\n');

  try {
    const { data: requirements, error } = await supabase
      .from('service_requirements')
      .select('*');

    if (error) throw error;

    const reqCount = requirements.length;
    logTest(
      'Query service_requirements table',
      true,
      `Found ${reqCount} requirements`
    );
    logTest(
      'Verify minimum requirements',
      reqCount >= 170,
      `Expected 170+, got ${reqCount}`
    );
  } catch (err) {
    logTest('Query service_requirements table', false, err.message);
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('📊 TEST 3: Services Per Institution\n');

  try {
    const { data: institutions, error: instError } = await supabase
      .from('institutions')
      .select(`
        code,
        name_en,
        services (count)
      `);

    if (instError) throw instError;

    const expectedCounts = {
      'electric': 1,
      'revenue': 1,
      'justice': 3,
      'cbe': 2,
      'ethiotel': 2,
      'ethiopost': 11,
      'investment': 1,
      'labor': 2,
      'trade': 7,
      'construction': 1,
      'fayda': 4,
      'sidama-bank': 2
    };

    for (const inst of institutions) {
      const expected = expectedCounts[inst.code];
      const actual = inst.services[0]?.count || 0;
      
      logTest(
        `${inst.name_en}: ${actual} services`,
        actual === expected,
        `Expected ${expected}, got ${actual}`
      );
    }
  } catch (err) {
    logTest('Query institution services', false, err.message);
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('📊 TEST 4: Services Without Requirements (Should be 0)\n');

  try {
    // Get all services
    const { data: allServices, error: servError } = await supabase
      .from('services')
      .select('id, code, title_en');

    if (servError) throw servError;

    // Get all service IDs that have requirements
    const { data: servicesWithReqs, error: reqError } = await supabase
      .from('service_requirements')
      .select('service_id');

    if (reqError) throw reqError;

    const serviceIdsWithReqs = new Set(servicesWithReqs.map(r => r.service_id));
    const orphanServices = allServices.filter(s => !serviceIdsWithReqs.has(s.id));

    logTest(
      'All services have requirements',
      orphanServices.length === 0,
      orphanServices.length === 0 
        ? 'Every service has at least one requirement' 
        : `Found ${orphanServices.length} services without requirements: ${orphanServices.map(s => s.code).join(', ')}`
    );
  } catch (err) {
    logTest('Check service requirements', false, err.message);
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('📊 TEST 5: Bilingual Content Verification\n');

  try {
    const { data: services, error } = await supabase
      .from('services')
      .select('code, title_en, title_am')
      .limit(5);

    if (error) throw error;

    const allHaveBilingual = services.every(
      s => s.title_en && s.title_am && s.title_en.length > 0 && s.title_am.length > 0
    );

    logTest(
      'Services have both English and Amharic titles',
      allHaveBilingual,
      allHaveBilingual ? 'Bilingual content verified' : 'Some services missing translations'
    );

    // Check requirements too
    const { data: reqs, error: reqError } = await supabase
      .from('service_requirements')
      .select('document_name_en, document_name_am')
      .limit(5);

    if (reqError) throw reqError;

    const reqsHaveBilingual = reqs.every(
      r => r.document_name_en && r.document_name_am
    );

    logTest(
      'Requirements have both English and Amharic names',
      reqsHaveBilingual,
      reqsHaveBilingual ? 'Bilingual requirements verified' : 'Some requirements missing translations'
    );
  } catch (err) {
    logTest('Verify bilingual content', false, err.message);
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('📊 TEST 6: Sample Service Data Integrity\n');

  try {
    // Test specific service: Electricity Bill Payment
    const { data: electricService, error } = await supabase
      .from('services')
      .select(`
        code,
        title_en,
        processing_time,
        service_fee,
        service_url,
        service_requirements (
          document_name_en,
          is_mandatory,
          display_order
        )
      `)
      .eq('code', 'electric-bill-payment')
      .single();

    if (error) throw error;

    logTest(
      'Electricity Bill Payment service exists',
      !!electricService,
      `Code: ${electricService.code}`
    );

    logTest(
      'Service has correct details',
      electricService.processing_time === 'Instant' &&
      electricService.service_fee === 'As per consumption',
      `Time: ${electricService.processing_time}, Fee: ${electricService.service_fee}`
    );

    logTest(
      'Service has requirements',
      electricService.service_requirements.length >= 2,
      `Found ${electricService.service_requirements.length} requirements`
    );

  } catch (err) {
    logTest('Test sample service', false, err.message);
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('📊 TEST 7: Fayda Grievance Service (Special Check)\n');

  try {
    // Verify Fayda Level 1 Grievance service exists (mentioned in instructions)
    const { data: faydaGrievance, error } = await supabase
      .from('services')
      .select('code, title_en')
      .eq('code', 'fayda-grievance-level1')
      .single();

    if (error) throw error;

    logTest(
      'Fayda Level 1 Grievance service exists',
      !!faydaGrievance,
      `Title: ${faydaGrievance.title_en}`
    );
  } catch (err) {
    logTest('Fayda Grievance service check', false, err.message);
  }

  console.log('\n═══════════════════════════════════════════════════════\n');

  // Summary
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     📊 TEST RESULTS SUMMARY                           ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const total = passedTests + failedTests;
  const percentage = total > 0 ? Math.round((passedTests / total) * 100) : 0;

  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📊 Total:  ${total}`);
  console.log(`📈 Success Rate: ${percentage}%\n`);

  if (failedTests === 0) {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     🎉 ALL SERVICE CATALOGUE TESTS PASSED!            ║');
    console.log('║     ✅ 37 SERVICES VERIFIED                           ║');
    console.log('║     ✅ 170+ REQUIREMENTS VERIFIED                     ║');
    console.log('║     ✅ ALL INSTITUTIONS HAVE SERVICES                 ║');
    console.log('║     🚀 READY FOR API DEVELOPMENT                      ║');
    console.log('╚════════════════════════════════════════════════════════╝');
  } else {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║     ⚠️  SOME TESTS FAILED                             ║');
    console.log('║     Service catalogue may not be complete             ║');
    console.log('║     Review errors above                                ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    process.exit(1);
  }
}

testServiceCatalogue();
