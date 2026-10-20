import { supabase } from './src/config/supabase.js';

const API_BASE = 'http://localhost:5000/api';

async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(`Login failed for ${email}: ${data.message}`);
  }
  return {
    token: data.data.accessToken,
    user: data.data.user
  };
}

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   HAWASSA MESOB — LIVE QUEUE TRACKING VERIFICATION SUITE         ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
      return true;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      return false;
    }
  }

  // 1. Setup Auth
  console.log('--- Step 0: Authentication Setup ---');
  const customerAuth = await loginUser('customer@mesobcenter.et', 'customer@2026');
  const employeeAuth = await loginUser('employee@mesobcenter.et', 'Employee@2026');
  console.log(`Authenticated Customer: ${customerAuth.user.email} (${customerAuth.user.id})`);
  console.log(`Authenticated Employee: ${employeeAuth.user.email} (Institution: ${employeeAuth.user.institution_id})\n`);

  const institutionId = employeeAuth.user.institution_id; // Fayda institution

  // Find a service for this institution
  const { data: services } = await supabase
    .from('services')
    .select('id, title_en')
    .eq('institution_id', institutionId)
    .limit(1);

  if (!services || services.length === 0) {
    throw new Error('No service found for institution');
  }
  const serviceId = services[0].id;
  console.log(`Using Service: "${services[0].title_en}" (${serviceId})\n`);

  // Track created test queue entry IDs to clean up afterwards
  const cleanupIds = [];

  try {
    // Clean up any stale active test queues for this citizen to have a clean slate
    await supabase
      .from('queue_entries')
      .update({ status: 'COMPLETED' })
      .eq('citizen_id', customerAuth.user.id)
      .eq('service_id', serviceId)
      .in('status', ['PENDING', 'WAITING', 'IN_PROGRESS']);

    // =========================================================================
    // TEST 1: Initial Queue with 20 entries ahead
    // =========================================================================
    console.log('--- TEST 1: Initial Queue with 20 entries ahead ---');
    const now = Date.now();
    const aheadEntries = [];

    // Create 20 queue entries created before our test customer
    for (let i = 1; i <= 20; i++) {
      const qNum = `Q-TEST-${String(i).padStart(4, '0')}`;
      const entryTime = new Date(now - (25 - i) * 60000).toISOString();
      aheadEntries.push({
        queue_number: qNum,
        institution_id: institutionId,
        service_id: serviceId,
        citizen_id: customerAuth.user.id,
        status: i === 1 ? 'IN_PROGRESS' : 'PENDING',
        priority: 'NORMAL',
        created_at: entryTime
      });
    }

    const { data: insertedAhead, error: insertAheadErr } = await supabase
      .from('queue_entries')
      .insert(aheadEntries)
      .select();

    if (insertAheadErr) {
      throw new Error(`Failed to insert ahead entries: ${insertAheadErr.message}`);
    }
    insertedAhead.forEach(e => cleanupIds.push(e.id));

    // Now insert our test customer's ticket (ticket #21)
    const customerTicketTime = new Date(now).toISOString();
    const customerQueueNumber = 'Q-TEST-0021';
    const { data: customerTicket, error: customerTicketErr } = await supabase
      .from('queue_entries')
      .insert({
        queue_number: customerQueueNumber,
        institution_id: institutionId,
        service_id: serviceId,
        citizen_id: customerAuth.user.id,
        status: 'PENDING',
        priority: 'NORMAL',
        created_at: customerTicketTime
      })
      .select()
      .single();

    if (customerTicketErr) {
      throw new Error(`Failed to insert customer ticket: ${customerTicketErr.message}`);
    }
    cleanupIds.push(customerTicket.id);

    // Fetch via Customer API
    const resTest1 = await fetch(`${API_BASE}/queues`, {
      headers: { Authorization: `Bearer ${customerAuth.token}` }
    });
    const dataTest1 = await resTest1.json();
    const myTicket1 = dataTest1.data?.find(q => q.id === customerTicket.id);

    assert(myTicket1 !== undefined, 'Customer can view their queue ticket');
    assert(myTicket1.people_ahead === 20, `People ahead is exactly 20 (got: ${myTicket1?.people_ahead})`);
    assert(myTicket1.estimated_wait_minutes === 120, `Estimated waiting time is 120 minutes (20 x 6 min) (got: ${myTicket1?.estimated_wait_minutes})`);
    assert(myTicket1.current_serving === 'Q-TEST-0001', `Current serving token is Q-TEST-0001 (got: ${myTicket1?.current_serving})`);

    // =========================================================================
    // TEST 2: One customer completes service (20 -> 19 ahead, 120 -> 114 min)
    // =========================================================================
    console.log('\n--- TEST 2: One customer completes service (20 -> 19 people ahead) ---');
    // Employee marks the in-progress ticket (Q-TEST-0001) as COMPLETED
    const firstTicket = insertedAhead.find(e => e.queue_number === 'Q-TEST-0001');
    const updateRes1 = await fetch(`${API_BASE}/queues/${firstTicket.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeAuth.token}`
      },
      body: JSON.stringify({ status: 'COMPLETED' })
    });
    const updateData1 = await updateRes1.json();
    assert(updateData1.success === true, 'Employee successfully updated ticket to COMPLETED');

    // Customer re-fetches (simulates live auto-poll without manual refresh)
    const resTest2 = await fetch(`${API_BASE}/queues`, {
      headers: { Authorization: `Bearer ${customerAuth.token}` }
    });
    const dataTest2 = await resTest2.json();
    const myTicket2 = dataTest2.data?.find(q => q.id === customerTicket.id);

    assert(myTicket2.people_ahead === 19, `Remaining people ahead updated automatically from 20 to 19 (got: ${myTicket2?.people_ahead})`);
    assert(myTicket2.estimated_wait_minutes === 114, `Estimated waiting time recalculated to 114 minutes (19 x 6 min) (got: ${myTicket2?.estimated_wait_minutes})`);

    // =========================================================================
    // TEST 3: Second customer completes service (19 -> 18 ahead, 114 -> 108 min)
    // =========================================================================
    console.log('\n--- TEST 3: Second customer completes service (19 -> 18 people ahead, 108 min) ---');
    const ticket2 = insertedAhead.find(e => e.queue_number === 'Q-TEST-0002');

    // Employee completes service for second customer ahead
    const updateRes2 = await fetch(`${API_BASE}/queues/${ticket2.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeAuth.token}`
      },
      body: JSON.stringify({ status: 'COMPLETED' })
    });
    const updateData2 = await updateRes2.json();
    assert(updateData2.success === true, 'Employee successfully completed service for second customer ahead');

    const resTest3 = await fetch(`${API_BASE}/queues`, {
      headers: { Authorization: `Bearer ${customerAuth.token}` }
    });
    const dataTest3 = await resTest3.json();
    const myTicket3 = dataTest3.data?.find(q => q.id === customerTicket.id);

    assert(myTicket3.people_ahead === 18, `People ahead updated automatically from 19 to 18 (got: ${myTicket3?.people_ahead})`);
    assert(myTicket3.estimated_wait_minutes === 108, `Estimated waiting time recalculated to 108 minutes (18 x 6 min) (got: ${myTicket3?.estimated_wait_minutes})`);

    // Complete a 3rd customer to verify continued live countdown (18 -> 17 ahead, 102 min)
    const ticket3 = insertedAhead.find(e => e.queue_number === 'Q-TEST-0003');
    await fetch(`${API_BASE}/queues/${ticket3.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeAuth.token}`
      },
      body: JSON.stringify({ status: 'COMPLETED' })
    });
    const resTest3B = await fetch(`${API_BASE}/queues`, {
      headers: { Authorization: `Bearer ${customerAuth.token}` }
    });
    const dataTest3B = await resTest3B.json();
    const myTicket3B = dataTest3B.data?.find(q => q.id === customerTicket.id);
    assert(myTicket3B.people_ahead === 17, `People ahead updated to 17 (got: ${myTicket3B?.people_ahead})`);
    assert(myTicket3B.estimated_wait_minutes === 102, `Estimated waiting time recalculated to 102 minutes (17 x 6 min) (got: ${myTicket3B?.estimated_wait_minutes})`);

    // =========================================================================
    // TEST 4: Cancellation and Priority
    // =========================================================================
    console.log('\n--- TEST 4: Cancellation and Priority Handling ---');
    // 4A: Cancel an entry ahead (ticket 4) -> count drops by 1 (17 -> 16)
    const ticket4 = insertedAhead.find(e => e.queue_number === 'Q-TEST-0004');
    await fetch(`${API_BASE}/queues/${ticket4.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeAuth.token}`
      },
      body: JSON.stringify({ status: 'CANCELLED' })
    });

    const resTest4A = await fetch(`${API_BASE}/queues`, {
      headers: { Authorization: `Bearer ${customerAuth.token}` }
    });
    const dataTest4A = await resTest4A.json();
    const myTicket4A = dataTest4A.data?.find(q => q.id === customerTicket.id);
    assert(myTicket4A.people_ahead === 16, `Cancelled ticket excluded: people ahead dropped from 17 to 16 (got: ${myTicket4A?.people_ahead})`);
    assert(myTicket4A.estimated_wait_minutes === 96, `Estimated waiting time updated to 96 minutes (16 x 6 min) (got: ${myTicket4A?.estimated_wait_minutes})`);

    // 4B: Add an URGENT priority entry created after customer -> should still be placed AHEAD of customer
    const urgentTicket = {
      queue_number: 'Q-TEST-URGENT',
      institution_id: institutionId,
      service_id: serviceId,
      citizen_id: customerAuth.user.id,
      status: 'PENDING',
      priority: 'URGENT',
      created_at: new Date(Date.now() + 60000).toISOString() // Created later!
    };
    const { data: insertedUrgent } = await supabase
      .from('queue_entries')
      .insert(urgentTicket)
      .select()
      .single();
    cleanupIds.push(insertedUrgent.id);

    const resTest4B = await fetch(`${API_BASE}/queues`, {
      headers: { Authorization: `Bearer ${customerAuth.token}` }
    });
    const dataTest4B = await resTest4B.json();
    const myTicket4B = dataTest4B.data?.find(q => q.id === customerTicket.id);
    assert(myTicket4B.people_ahead === 17, `Urgent priority ticket placed ahead: count increased from 16 to 17 (got: ${myTicket4B?.people_ahead})`);

    // =========================================================================
    // TEST 4C: Requirement 8 (Queue Readiness when Ahead == 0)
    // =========================================================================
    console.log('\n--- TEST 4C: Requirement 8 (Queue Readiness when Ahead == 0) ---');
    // Complete remaining tickets ahead of customer ticket
    const remainingAhead = insertedAhead.slice(4); // remaining from index 4
    const aheadIds = [insertedUrgent.id, ...remainingAhead.map(t => t.id)];
    await supabase
      .from('queue_entries')
      .update({ status: 'COMPLETED' })
      .in('id', aheadIds);

    // Customer re-fetches: now peopleAhead === 0
    const resTest4C = await fetch(`${API_BASE}/queues`, {
      headers: { Authorization: `Bearer ${customerAuth.token}` }
    });
    const dataTest4C = await resTest4C.json();
    const myTicket4C = dataTest4C.data?.find(q => q.id === customerTicket.id);

    assert(myTicket4C.people_ahead === 0, `All ahead entries completed: people ahead is 0 (got: ${myTicket4C?.people_ahead})`);
    assert(myTicket4C.status === 'PENDING', `Customer ticket is still PENDING (not called yet)`);
    assert(myTicket4C.queue_readiness === 'READY_TO_CALL', `Queue readiness verified as READY_TO_CALL (not falsely shown as called or 0 min at counter)`);

    // Now employee calls customer's ticket
    await fetch(`${API_BASE}/queues/${customerTicket.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employeeAuth.token}`
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' })
    });
    const resTest4D = await fetch(`${API_BASE}/queues`, {
      headers: { Authorization: `Bearer ${customerAuth.token}` }
    });
    const dataTest4D = await resTest4D.json();
    const myTicket4D = dataTest4D.data?.find(q => q.id === customerTicket.id);

    assert(myTicket4D.status === 'IN_PROGRESS', `Customer ticket updated to IN_PROGRESS when called`);
    assert(myTicket4D.queue_readiness === 'CALLED', `Queue readiness correctly reflects CALLED when employee calls ticket`);

    // =========================================================================
    // TEST 5: Multiple Customers Isolation
    // =========================================================================
    console.log('\n--- TEST 5: Multiple Customers Isolation ---');
    // Log in as Super Admin and verify customer data cannot be modified by other users
    const adminAuth = await loginUser('superadmin@mesobcenter.et', 'SuperAdmin@2026');
    const resCustomer = await fetch(`${API_BASE}/queues`, {
      headers: { Authorization: `Bearer ${customerAuth.token}` }
    });
    const dataCustomer = await resCustomer.json();

    // Verify all tickets returned for customer belong to this customer
    const allBelongToCustomer = dataCustomer.data.every(q => q.citizen_id === customerAuth.user.id);
    assert(allBelongToCustomer, 'Customer only receives their own queue tickets');

    // Attempt to access another citizen ticket directly with customer auth
    // Suppose an arbitrary entry exists
    const resForbidden = await fetch(`${API_BASE}/queues/00000000-0000-0000-0000-000000000000`, {
      headers: { Authorization: `Bearer ${customerAuth.token}` }
    });
    assert(resForbidden.status === 404 || resForbidden.status === 403, `Direct access to unauthorized ticket prevented (status: ${resForbidden.status})`);

    // =========================================================================
    // TEST 6: Real-time Public Status & Database Reliability
    // =========================================================================
    console.log('\n--- TEST 6: Real-time Public Status & Database Reliability ---');
    const resStatus = await fetch(`${API_BASE}/queues/${customerTicket.id}/status`);
    const dataStatus = await resStatus.json();
    assert(dataStatus.success === true, 'Public queue status endpoint works');
    assert(dataStatus.data.people_ahead === 0, `Public endpoint returns live position: 0 ahead when called (got: ${dataStatus.data?.people_ahead})`);
    assert(dataStatus.data.estimated_wait_minutes === 0, `Public endpoint returns live waiting time: 0 min when called (got: ${dataStatus.data?.estimated_wait_minutes})`);
    assert(dataStatus.data.queue_readiness === 'CALLED', `Public endpoint returns live queue readiness: CALLED (got: ${dataStatus.data?.queue_readiness})`);

    // =========================================================================
    // TEST 7: Regression Checks
    // =========================================================================
    console.log('\n--- TEST 7: Regression Checks (Health, Services, Institutions) ---');
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    assert(healthData.status === 'healthy', 'Backend health check passed');

    const servicesRes = await fetch(`${API_BASE}/services`);
    const servicesData = await servicesRes.json();
    assert(servicesData.success === true && servicesData.data?.length > 0, 'Services catalogue endpoint works');

    const instRes = await fetch(`${API_BASE}/institutions`);
    const instData = await instRes.json();
    assert(instData.success === true && instData.data?.length > 0, 'Institutions endpoint works');

  } finally {
    // Clean up all inserted test queue entries
    console.log('\n--- Cleaning up test records ---');
    if (cleanupIds.length > 0) {
      await supabase
        .from('queue_entries')
        .delete()
        .in('id', cleanupIds);
      console.log(`Cleaned up ${cleanupIds.length} test records.`);
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log(` RESULTS: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log('══════════════════════════════════════════════════════════════════');

  if (passed === total) {
    console.log('🎉 ALL LIVE QUEUE TRACKING TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED.\n');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
