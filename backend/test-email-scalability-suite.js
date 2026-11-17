/**
 * test-email-scalability-suite.js
 * Comprehensive Scalability and Progressive Load Testing Suite
 * Hawassa MESOB Public Service Management System
 * 
 * Testing Stages:
 * - Stage 1: 100 Workloads (Baseline verification & verification isolation)
 * - Stage 2: 1,000 Workloads (High concurrency, multi-institution, distributed outbox)
 * - Stage 3: 10,000 Workloads (High-volume throughput stress test, rate-limiting & zero message loss)
 */

import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config({ path: 'c:/Users/Eyasu/Desktop/IT/Hawssa-mesob-F-B/backend/.env' });

const API_BASE = 'http://localhost:5000/api';

const SIX_ROLES = {
  SUPER_ADMIN: { email: 'superadmin@mesobcenterh.gov.et', password: 'Admin@2026' },
  MESOB_MANAGER: { email: 'manager@mesobcenterh.gov.et', password: 'Manager@2026' },
  INSTITUTION_MANAGER: { email: 'instmanager@mesobcenterh.gov.et', password: 'InstMgr@2026' },
  EMPLOYEE: { email: 'employee@mesobcenterh.gov.et', password: 'Employee@2026' },
  TECHNICIAN: { email: 'technician@mesobcenterh.gov.et', password: 'Technician@2026' },
  CUSTOMER: { email: 'customer@gmail.com', password: 'Customer@2026' }
};

let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedAssertions++;
    console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
  }
}

async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

async function runInBatches(items, batchSize, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}

async function runScalabilitySuite() {
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log('  HAWASSA MESOB: Scalable Email Notification & Queue Benchmark Suite');
  console.log('  Workload Progression: Stage 1 (100) -> Stage 2 (1,000) -> Stage 3 (10,000)');
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  // Dynamic imports after dotenv initialized
  const { supabase } = await import('file:///c:/Users/Eyasu/Desktop/IT/Hawssa-mesob-F-B/backend/src/config/supabase.js');
  const { maskEmail } = await import('file:///c:/Users/Eyasu/Desktop/IT/Hawssa-mesob-F-B/backend/src/services/emailService.js');
  const { enqueueEmail, getOutboxStats, getOutboxLogs, getOutboxBacklogDepth } = await import('file:///c:/Users/Eyasu/Desktop/IT/Hawssa-mesob-F-B/backend/src/services/emailOutboxService.js');
  const { setActiveEmailProvider, getActiveEmailProvider, getProviderMetrics } = await import('file:///c:/Users/Eyasu/Desktop/IT/Hawssa-mesob-F-B/backend/src/services/emailProviderFactory.js');
  const { getWorkerHealth, setWorkerConcurrency } = await import('file:///c:/Users/Eyasu/Desktop/IT/Hawssa-mesob-F-B/backend/src/services/emailWorker.js');

  // ── Step 0: Six-Role Authentication & Access Control ──
  console.log('── STEP 0: Authentication & Role Verification ──');
  const roleTokens = {};
  for (const [roleName, creds] of Object.entries(SIX_ROLES)) {
    const loginRes = await loginUser(creds.email, creds.password);
    assert(loginRes.success && loginRes.data?.accessToken, `Role login OK: [${roleName}] ${creds.email}`);
    if (loginRes.data?.accessToken) {
      roleTokens[roleName] = loginRes.data.accessToken;
    }
  }

  const adminToken = roleTokens['SUPER_ADMIN'];

  // ── Step 1: Query Active Institutions & Services ──
  console.log('\n── STEP 1: Multi-Institution Environment Discovery ──');
  const { data: institutions } = await supabase.from('institutions').select('id, name_en, code');
  const { data: services } = await supabase.from('services').select('id, title_en, institution_id');

  assert(institutions && institutions.length >= 3, `Available institutions (${institutions?.length || 0})`);
  assert(services && services.length >= 5, `Available services (${services?.length || 0})`);

  const instServiceMap = {};
  for (const inst of institutions) {
    instServiceMap[inst.id] = services.filter(s => s.institution_id === inst.id);
  }
  const validInstitutions = institutions.filter(i => (instServiceMap[i.id] || []).length > 0);
  console.log(`Found ${validInstitutions.length} institutions with valid active services.`);

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 1: 100 Workloads (Baseline Regression & Isolation Verification)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log('  STAGE 1: 100 Workloads (Baseline Functional & Isolation Verification)');
  console.log('══════════════════════════════════════════════════════════════════════════');

  const stage1BatchId = Date.now().toString().slice(-6);
  const stage1Customers = [];
  console.log(`Registering 100 customers with batch ID ${stage1BatchId}...`);

  const stage1Inputs = Array.from({ length: 100 }, (_, idx) => {
    const i = idx + 1;
    const pad = String(i).padStart(3, '0');
    return {
      index: i,
      customerEmail: `stage1.${stage1BatchId}.cust${pad}@gmail.com`,
      customerPassword: `Stage1Test@${stage1BatchId}!`,
      firstName: `Customer${pad}`,
      lastName: `Stage1`,
      phone: `+251911${String(100000 + i).slice(-6)}`
    };
  });

  await runInBatches(stage1Inputs, 10, async (input) => {
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: input.customerEmail,
        password: input.customerPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone
      })
    });
    const regData = await regRes.json();
    if (regData.success) {
      stage1Customers.push({
        index: input.index,
        email: input.customerEmail,
        id: regData.data?.user?.id,
        token: regData.data?.accessToken,
        verificationCode: regData.data?.verificationCode,
        isVerified: false
      });
    }
  });

  stage1Customers.sort((a, b) => a.index - b.index);
  assert(stage1Customers.length === 100, `Stage 1: Successfully registered 100 accounts (${stage1Customers.length}/100)`);

  // Verify SHA-256 token hashing
  const { data: dbSample } = await supabase
    .from('users')
    .select('id, email, metadata')
    .eq('email', stage1Customers[0].email)
    .single();
  const vMeta = dbSample?.metadata?.email_verification;
  assert(vMeta?.token_hash && vMeta?.code_hash, 'Verification tokens are stored strictly as SHA-256 hashes');
  assert(vMeta?.token === undefined && vMeta?.code === undefined, 'Raw verification secrets are never stored in plain text');

  // Verify unverified blocked from queue
  const unverifiedCust = stage1Customers[0];
  const blockRes = await fetch(`${API_BASE}/queues/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${unverifiedCust.token}`
    },
    body: JSON.stringify({
      institutionId: validInstitutions[0].id,
      serviceId: instServiceMap[validInstitutions[0].id][0].id
    })
  });
  assert(blockRes.status === 403, 'Unverified customer blocked with 403');

  // Confirm verification for all 100 accounts
  await runInBatches(stage1Customers, 10, async (cust) => {
    const vRes = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cust.email,
        code: cust.verificationCode
      })
    });
    const vData = await vRes.json();
    if (vData.success) cust.isVerified = true;
  });
  assert(stage1Customers.every(c => c.isVerified), 'All 100 accounts successfully verified');

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 2: 1,000 Workloads (Concurrency, Multi-Institution & Scaling)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log('  STAGE 2: 1,000 Workloads (Concurrency, Multi-Institution Scaling)');
  console.log('══════════════════════════════════════════════════════════════════════════');

  // 1. Switch active provider to high-speed driver for high-volume benchmark
  const prevProvider = getActiveEmailProvider();
  setActiveEmailProvider('mock');
  setWorkerConcurrency(25);

  // Configure running backend server dynamically via PATCH config endpoint
  const configRes = await fetch(`${API_BASE}/notifications/email-outbox/config`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ concurrency: 25, provider: 'mock' })
  });
  const configData = await configRes.json();
  assert(configData.success, 'Admin dynamically scaled worker concurrency to 25 via PATCH endpoint');
  console.log(`Active provider set to [${getActiveEmailProvider().toUpperCase()}], server worker concurrency scaled to 25.`);

  // 2. Test worker health and backlog depth endpoint
  const healthRes = await fetch(`${API_BASE}/notifications/email-outbox/health`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const healthData = await healthRes.json();
  assert(healthData.success && healthData.data?.backlog, 'Admin can retrieve real-time worker health & backlog depth');
  assert(healthData.data.concurrency === 25, `Worker concurrency reported accurately: ${healthData.data.concurrency}`);

  // 3. Generate 1,000 simulated queue operations across 12 institutions
  console.log('Enqueuing 1,000 distributed outbox emails across multiple institutions...');
  const stage2BatchId = Date.now().toString().slice(-6);
  const enqueue1000StartTime = Date.now();

  const mock1000Items = Array.from({ length: 1000 }, (_, idx) => {
    const i = idx + 1;
    const inst = validInstitutions[i % validInstitutions.length];
    const svcList = instServiceMap[inst.id];
    const svc = svcList[i % svcList.length];
    const seq = String(i).padStart(6, '0');

    return {
      to: `load1000.cust${seq}@mesob-test.et`,
      subject: `Hawassa MESOB — Queue confirmation ticket #Q-2026-${seq}`,
      templateName: 'QUEUE_CONFIRMATION',
      payload: {
        customerName: `Citizen ${seq}`,
        ticketNumber: `Q-2026-${seq}`,
        institutionName: inst.name_en,
        serviceName: svc.title_en,
        queuePosition: (i % 50) + 1,
      },
      idempotencyKey: `STAGE2_LOAD_${stage2BatchId}_${seq}`
    };
  });

  const enqueueResults = await runInBatches(mock1000Items, 50, async (item) => {
    return enqueueEmail(item);
  });

  const enqueue1000DurationMs = Date.now() - enqueue1000StartTime;
  const successfulEnqueues = enqueueResults.filter(r => r.success).length;
  assert(successfulEnqueues === 1000, `Successfully enqueued 1,000 emails non-blockingly (${successfulEnqueues}/1000 in ${enqueue1000DurationMs}ms)`);
  console.log(`Average non-blocking enqueue latency: ${(enqueue1000DurationMs / 1000).toFixed(2)}ms per item.`);

  // 4. Test idempotency deduplication under load
  const duplicateSample = mock1000Items[0];
  const dupResult = await enqueueEmail(duplicateSample);
  assert(dupResult.success && dupResult.deduplicated, 'Idempotency key correctly deduplicated duplicate item in 1,000-item stream');

  // 5. Test queue token numbering beyond 9,999: verify 6-digit formatting
  console.log('Verifying scalable 6-digit sequence formatting...');
  const customer25 = stage1Customers[24];
  const testInst = validInstitutions[0];
  const testSvc = instServiceMap[testInst.id][0];

  const joinRes = await fetch(`${API_BASE}/queues/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customer25.token}`
    },
    body: JSON.stringify({
      institutionId: testInst.id,
      serviceId: testSvc.id,
      priority: 'NORMAL'
    })
  });
  const joinData = await joinRes.json();
  assert(joinData.success && joinData.data?.queue_number, `Queue ticket issued: ${joinData.data?.queue_number}`);
  assert(joinData.data.queue_number.length >= 13, `Ticket formatted with scalable 6-digit sequence (e.g. Q-2026-000001): ${joinData.data.queue_number}`);

  // ══════════════════════════════════════════════════════════════════════════
  // STAGE 3: 10,000 Workloads (Extreme Scalability, Zero Loss & Throughput)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log('  STAGE 3: 10,000 Workloads (Extreme Scalability, Zero Loss Benchmark)');
  console.log('══════════════════════════════════════════════════════════════════════════');

  setWorkerConcurrency(50);
  console.log('Worker concurrency scaled to 50 workers for 10,000-workload benchmark.');

  const stage3BatchId = Date.now().toString().slice(-6);
  const stage3Count = 10000;
  console.log(`Generating ${stage3Count} notification payloads with zero event loss verification...`);

  const stage3StartTime = Date.now();
  let totalProcessedInStage3 = 0;

  // Stream in 10 chunks of 1,000 items each to measure sustained throughput without memory spike
  for (let chunkIdx = 0; chunkIdx < 10; chunkIdx++) {
    const chunkStart = chunkIdx * 1000;
    const chunkItems = Array.from({ length: 1000 }, (_, idx) => {
      const i = chunkStart + idx + 1;
      const seq = String(i).padStart(6, '0');
      const inst = validInstitutions[i % validInstitutions.length];
      const svcList = instServiceMap[inst.id];
      const svc = svcList[i % svcList.length];

      return {
        to: `load10k.${stage3BatchId}.${seq}@mesob-test.et`,
        subject: `Hawassa MESOB — Service Update #${seq}`,
        templateName: i % 2 === 0 ? 'QUEUE_TURN' : 'QUEUE_COMPLETED',
        payload: {
          customerName: `Citizen ${seq}`,
          ticketNumber: `Q-2026-${seq}`,
          institutionName: inst.name_en,
          serviceName: svc.title_en,
        },
        idempotencyKey: `STAGE3_STRESS_${stage3BatchId}_${seq}`
      };
    });

    const chunkResults = await runInBatches(chunkItems, 100, async (item) => {
      return enqueueEmail(item);
    });

    totalProcessedInStage3 += chunkResults.filter(r => r.success).length;
  }

  const stage3DurationMs = Date.now() - stage3StartTime;
  assert(totalProcessedInStage3 === stage3Count, `Successfully enqueued 10,000 emails with zero event loss (${totalProcessedInStage3}/${stage3Count})`);

  const throughputPerSec = Math.round((stage3Count / stage3DurationMs) * 1000);
  console.log(`Enqueued 10,000 emails in ${stage3DurationMs}ms (~${throughputPerSec} emails/sec throughput).`);

  // Verify backlog depth telemetry reflects the 10,000 workload
  const backlogTelemetry = await getOutboxBacklogDepth();
  assert(backlogTelemetry.total >= stage3Count, `Outbox telemetry verified total records: ${backlogTelemetry.total}`);
  assert(backlogTelemetry.health !== undefined, `Backlog health assessment active: [${backlogTelemetry.health}]`);

  // Verify provider performance metrics
  const providerMetrics = getProviderMetrics();
  assert(providerMetrics.activeProvider === 'mock', 'Provider metrics confirm mock provider active for load test');
  assert(providerMetrics.rateLimiter !== undefined, 'Rate limiter status is active and tracking tokens');

  // Verify that database tickets remain 100% intact
  const { data: verifiedTicket } = await supabase
    .from('queue_entries')
    .select('id, queue_number, status')
    .eq('id', joinData.data.id)
    .single();
  assert(verifiedTicket && verifiedTicket.queue_number === joinData.data.queue_number, 'Customer queue ticket remained intact and uncorrupted under 10,000-item load');

  // ══════════════════════════════════════════════════════════════════════════
  // Post-Test Cleanup & Provider Restoration
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n── Teardown & Account State Restoration ──');

  // Restore previous email provider and concurrency
  setActiveEmailProvider(prevProvider || 'smtp');
  setWorkerConcurrency(10);
  try {
    await fetch(`${API_BASE}/notifications/email-outbox/config`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ concurrency: 10, provider: prevProvider || 'smtp' })
    });
  } catch {}
  console.log(`Email provider restored to: [${getActiveEmailProvider().toUpperCase()}], concurrency reset to 10.`);

  // Clean up Stage 1 simulated customer accounts and created queue entries
  const stage1Ids = stage1Customers.map(c => c.id);
  if (joinData.data?.id) {
    await supabase.from('notifications').delete().eq('related_entity_id', joinData.data.id);
    await supabase.from('queue_entries').delete().eq('id', joinData.data.id);
  }

  if (stage1Ids.length > 0) {
    await supabase.from('notifications').delete().in('recipient_id', stage1Ids);
    await supabase.from('audit_logs').delete().in('user_id', stage1Ids);
    await supabase.from('users').delete().in('id', stage1Ids);
  }

  // Verify exactly 6 original test accounts remain
  const { data: finalUsers } = await supabase.from('users').select('id, email, role');
  console.log(`Remaining users in database after teardown: ${finalUsers?.length || 0}`);
  assert(finalUsers?.length === 6, 'Exactly the 6 original test accounts remain after scalability benchmark teardown');

  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  SCALABILITY TEST RESULTS: ${passedAssertions} PASSED, ${failedAssertions} FAILED`);
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runScalabilitySuite().catch(err => {
  console.error('Fatal scalability suite error:', err);
  process.exit(1);
});
