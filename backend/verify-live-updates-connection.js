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

async function runVerification() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  VERIFICATION: "LIVE UPDATES ACTIVE" & REAL-TIME QUEUE SYNC     ║');
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

  const cleanupIds = [];

  try {
    // 1. Auth Setup
    console.log('--- Step 1: Authenticate Customer and Employee ---');
    const customer = await loginUser('customer@mesobcenter.et', 'customer@2026');
    const employee = await loginUser('employee@mesobcenter.et', 'Employee@2026');
    console.log(`Customer: ${customer.user.email} (${customer.user.id})`);
    console.log(`Employee: ${employee.user.email} (Institution: ${employee.user.institution_id})`);

    const institutionId = employee.user.institution_id;
    const { data: services } = await supabase
      .from('services')
      .select('id, title_en')
      .eq('institution_id', institutionId)
      .limit(1);

    const serviceId = services[0].id;
    console.log(`Service: ${services[0].title_en} (${serviceId})\n`);

    // 2. Insert 2 people ahead and 1 customer ticket
    console.log('--- Step 2: Establish Live Queue State in Database ---');
    const now = Date.now();
    const ahead1 = {
      queue_number: 'Q-LIVE-0001',
      institution_id: institutionId,
      service_id: serviceId,
      citizen_id: employee.user.id,
      status: 'IN_PROGRESS',
      priority: 'NORMAL',
      created_at: new Date(now - 120000).toISOString()
    };
    const ahead2 = {
      queue_number: 'Q-LIVE-0002',
      institution_id: institutionId,
      service_id: serviceId,
      citizen_id: employee.user.id,
      status: 'PENDING',
      priority: 'NORMAL',
      created_at: new Date(now - 60000).toISOString()
    };
    const custEntry = {
      queue_number: 'Q-LIVE-0003',
      institution_id: institutionId,
      service_id: serviceId,
      citizen_id: customer.user.id,
      status: 'PENDING',
      priority: 'NORMAL',
      created_at: new Date(now).toISOString()
    };

    const { data: ins1 } = await supabase.from('queue_entries').insert(ahead1).select().single();
    cleanupIds.push(ins1.id);
    const { data: ins2 } = await supabase.from('queue_entries').insert(ahead2).select().single();
    cleanupIds.push(ins2.id);
    const { data: insCust } = await supabase.from('queue_entries').insert(custEntry).select().single();
    cleanupIds.push(insCust.id);

    console.log('Created test entries: Q-LIVE-0001 (IN_PROGRESS), Q-LIVE-0002 (PENDING), Q-LIVE-0003 (Customer, PENDING)');

    // 3. Customer fetches initial queue
    console.log('\n--- Step 3: Customer Live Dashboard Initial State ---');
    const resCust1 = await fetch(`${API_BASE}/queues`, {
      headers: { Authorization: `Bearer ${customer.token}` }
    });
    const dataCust1 = await resCust1.json();
    assert(dataCust1.success === true, 'Backend returned successful response for customer queues');

    const myTicket1 = dataCust1.data.find(q => q.id === insCust.id);
    assert(myTicket1 !== undefined, 'Customer found their active ticket in queue');
    assert(myTicket1.people_ahead === 2, `People ahead initially is 2 (got: ${myTicket1.people_ahead})`);
    assert(myTicket1.estimated_wait_minutes === 12, `Estimated wait is 12 min (got: ${myTicket1.estimated_wait_minutes})`);
    assert(myTicket1.current_serving === 'Q-LIVE-0001', `Current serving is Q-LIVE-0001 (got: ${myTicket1.current_serving})`);
    assert(myTicket1.queue_readiness === 'WAITING', `Queue readiness is WAITING (got: ${myTicket1.queue_readiness})`);

    // 4. Employee completes service for Q-LIVE-0001
    console.log('\n--- Step 4: Employee Workflow - Complete First Customer Ahead ---');
    const updateRes1 = await fetch(`${API_BASE}/queues/${ins1.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employee.token}`
      },
      body: JSON.stringify({ status: 'COMPLETED' })
    });
    const updateData1 = await updateRes1.json();
    assert(updateData1.success === true, 'Employee completed service for ticket ahead');

    // Customer polling check (simulating 3s poll cycle)
    const resCust2 = await fetch(`${API_BASE}/queues`, {
      headers: { Authorization: `Bearer ${customer.token}` }
    });
    const dataCust2 = await resCust2.json();
    const myTicket2 = dataCust2.data.find(q => q.id === insCust.id);
    assert(myTicket2.people_ahead === 1, `After 1 completion: People ahead updated from 2 to 1 (got: ${myTicket2.people_ahead})`);
    assert(myTicket2.estimated_wait_minutes === 6, `After 1 completion: Estimated wait updated from 12 to 6 min (got: ${myTicket2.estimated_wait_minutes})`);

    // 5. Employee calls next token (Q-LIVE-0002) and completes it
    console.log('\n--- Step 5: Employee Calls and Completes Second Customer Ahead ---');
    await fetch(`${API_BASE}/queues/${ins2.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employee.token}`
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' })
    });

    const resCust3 = await fetch(`${API_BASE}/queues`, {
      headers: { Authorization: `Bearer ${customer.token}` }
    });
    const dataCust3 = await resCust3.json();
    const myTicket3 = dataCust3.data.find(q => q.id === insCust.id);
    assert(myTicket3.current_serving === 'Q-LIVE-0002', `Current serving updated dynamically to Q-LIVE-0002 (got: ${myTicket3.current_serving})`);

    // Now employee completes Q-LIVE-0002
    await fetch(`${API_BASE}/queues/${ins2.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employee.token}`
      },
      body: JSON.stringify({ status: 'COMPLETED' })
    });

    // Customer polling check: now people ahead is 0
    const resCust4 = await fetch(`${API_BASE}/queues`, {
      headers: { Authorization: `Bearer ${customer.token}` }
    });
    const dataCust4 = await resCust4.json();
    const myTicket4 = dataCust4.data.find(q => q.id === insCust.id);
    assert(myTicket4.people_ahead === 0, `All ahead entries completed: People ahead is 0 (got: ${myTicket4.people_ahead})`);
    assert(myTicket4.queue_readiness === 'READY_TO_CALL', `Customer ticket is READY_TO_CALL (not falsely shown as at counter or 0 min) (got: ${myTicket4.queue_readiness})`);

    // 6. Employee calls customer ticket to counter
    console.log('\n--- Step 6: Employee Calls Customer Ticket (IN_PROGRESS) ---');
    await fetch(`${API_BASE}/queues/${insCust.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${employee.token}`
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' })
    });

    const resCust5 = await fetch(`${API_BASE}/queues`, {
      headers: { Authorization: `Bearer ${customer.token}` }
    });
    const dataCust5 = await resCust5.json();
    const myTicket5 = dataCust5.data.find(q => q.id === insCust.id);
    assert(myTicket5.status === 'IN_PROGRESS', `Customer ticket status updated to IN_PROGRESS (got: ${myTicket5.status})`);
    assert(myTicket5.queue_readiness === 'CALLED', `Queue readiness updated to CALLED (got: ${myTicket5.queue_readiness})`);
    assert(myTicket5.current_serving === 'Q-LIVE-0003', `Current serving is customer token Q-LIVE-0003 (got: ${myTicket5.current_serving})`);

    // 7. Verify Connection Failure Detection
    console.log('\n--- Step 7: Connection Failure Detection & Reconnection Behavior ---');
    // Test with invalid token (simulates expired auth or 401 connection error)
    const resFail = await fetch(`${API_BASE}/queues`, {
      headers: { Authorization: 'Bearer invalid_or_expired_token' }
    });
    assert(resFail.status === 401 || resFail.status === 403, `Unauthenticated request correctly rejected with status ${resFail.status}`);
    
    // Test with correct token (simulates reconnection recovery)
    const resRecover = await fetch(`${API_BASE}/queues`, {
      headers: { Authorization: `Bearer ${customer.token}` }
    });
    assert(resRecover.status === 200, `Connection recovery succeeds with status 200`);

  } finally {
    console.log('\n--- Cleaning up test records ---');
    if (cleanupIds.length > 0) {
      await supabase.from('queue_entries').delete().in('id', cleanupIds);
      console.log(`Cleaned up ${cleanupIds.length} test records.`);
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log(` RESULTS: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log('══════════════════════════════════════════════════════════════════');

  if (passed === total) {
    console.log('🎉 ALL LIVE UPDATE VERIFICATION TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED.\n');
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
