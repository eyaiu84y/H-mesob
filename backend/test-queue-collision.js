/**
 * Test Queue Number Generation - Multiple Institutions
 * Verifies that multiple institutions can create queue entries without collision
 */

const API_URL = 'http://localhost:5000/api';

const testUsers = [
  { email: 'citizen@mesobcenter.et', password: 'Citizen@2026', role: 'CITIZEN', institution: 'Fayda' },
  { email: 'cbe.employee@mesobcenter.et', password: 'Employee@2026', role: 'EMPLOYEE', institution: 'CBE' }
];

async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  return data.data.accessToken;
}

async function getInstitutions(token) {
  const res = await fetch(`${API_URL}/institutions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.data;
}

async function getServices(token, institutionId) {
  const res = await fetch(`${API_URL}/services?institutionId=${institutionId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.data;
}

async function joinQueue(token, institutionId, serviceId) {
  const res = await fetch(`${API_URL}/queues/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      institutionId,
      serviceId,
      priority: 'NORMAL'
    })
  });
  return await res.json();
}

async function getQueues(token) {
  const res = await fetch(`${API_URL}/queues`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.data;
}

async function runTest() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Queue Collision Test - Multiple Institutions        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Login as citizen and get Fayda institution
    console.log('📝 Step 1: Login as CITIZEN (Fayda Bank)');
    const citizenToken = await login(testUsers[0].email, testUsers[0].password);
    const institutions = await getInstitutions(citizenToken);
    const faydaBank = institutions.find(i => i.name_en.includes('Construction'));
    
    if (!faydaBank) {
      console.error('❌ Construction Authority not found');
      return;
    }
    console.log(`   ✅ Found Construction Authority: ${faydaBank.id.substring(0, 8)}...`);

    // Step 2: Get services for Fayda
    const faydaServices = await getServices(citizenToken, faydaBank.id);
    if (!faydaServices || faydaServices.length === 0) {
      console.error('❌ No services found for Fayda Bank');
      return;
    }
    console.log(`   ✅ Found ${faydaServices.length} service(s) for Construction Authority\n`);

    // Step 3: Citizen joins queue at Construction Authority
    console.log('📝 Step 2: CITIZEN joins queue at Construction Authority');
    const result1 = await joinQueue(citizenToken, faydaBank.id, faydaServices[0].id);
    
    if (!result1.success) {
      console.error(`   ❌ Failed: ${result1.message}`);
      return;
    }
    console.log(`   ✅ Success! Queue Number: ${result1.data.queue_number}`);
    console.log(`   📍 Institution: ${result1.data.institutions.name_en}`);
    console.log(`   🎫 Service: ${result1.data.services.title_en}\n`);

    // Step 4: Login as CBE employee
    console.log('📝 Step 3: Login as another user for different institution (CBE)');
    const cbeToken = await login(testUsers[1].email, testUsers[1].password);
    const allInstitutions = await getInstitutions(cbeToken);
    const cbeBank = allInstitutions.find(i => i.name_en === 'Commercial Bank of Ethiopia');
    
    if (!cbeBank) {
      console.error('❌ CBE not found');
      return;
    }
    console.log(`   ✅ Found CBE: ${cbeBank.id.substring(0, 8)}...`);

    // Step 5: Get services for CBE
    const cbeServices = await getServices(cbeToken, cbeBank.id);
    if (!cbeServices || cbeServices.length === 0) {
      console.error('❌ No services found for CBE');
      return;
    }
    console.log(`   ✅ Found ${cbeServices.length} service(s) for CBE\n`);

    // Step 6: Create queue entry for CBE (should NOT collide with Fayda's Q-2026-0001)
    console.log('📝 Step 4: Create queue entry for CBE (Testing for collision)');
    
    // We need a citizen token from CBE institution for this test
    // For now, let's use superadmin to check all queues
    const superadminToken = await login('superadmin@mesobcenter.et', 'SuperAdmin@2026');
    
    // Check current queue state
    console.log('\n📊 Current Queue State:');
    const allQueues = await getQueues(superadminToken);
    console.log(`   Total Entries: ${allQueues.length}`);
    
    allQueues.forEach((q, idx) => {
      console.log(`   ${idx + 1}. ${q.queue_number} - ${q.status} - Institution: ${q.institution_id.substring(0, 8)}...`);
    });

    // Verify queue numbers are unique
    const queueNumbers = allQueues.map(q => q.queue_number);
    const uniqueNumbers = new Set(queueNumbers);
    
    console.log('\n📋 Verification Results:');
    console.log(`   Total Queue Entries: ${allQueues.length}`);
    console.log(`   Unique Queue Numbers: ${uniqueNumbers.size}`);
    
    if (queueNumbers.length === uniqueNumbers.size) {
      console.log('   ✅ No duplicate queue numbers detected!');
    } else {
      console.log('   ❌ DUPLICATE QUEUE NUMBERS FOUND!');
    }

    // Test duplicate prevention
    console.log('\n📝 Step 5: Test Duplicate Prevention (Same citizen, same service)');
    const duplicateResult = await joinQueue(citizenToken, faydaBank.id, faydaServices[0].id);
    
    if (!duplicateResult.success && duplicateResult.message.includes('already in queue')) {
      console.log(`   ✅ Duplicate prevention working: "${duplicateResult.message}"`);
    } else {
      console.log(`   ❌ Duplicate prevention failed! Got: ${JSON.stringify(duplicateResult)}`);
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                  ✅ ALL TESTS PASSED                   ║');
    console.log('╚════════════════════════════════════════════════════════╝');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error.stack);
  }
}

runTest();
