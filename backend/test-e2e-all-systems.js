/**
 * test-e2e-all-systems.js
 *
 * Comprehensive End-to-End Verification of Hawassa MESOB System
 * Tests:
 * 1. Health & Database connectivity
 * 2. Multi-role Authentication & JWT verification
 * 3. Strict Domain Enforcement
 * 4. Institutions API
 * 5. Services Catalogue API
 * 6. Announcements Full Lifecycle (Create, View, Edit/Update, Delete)
 * 7. Queue Management API
 * 8. Maintenance & Technician API
 * 9. Dashboards for each role
 */

const BASE_URL = 'http://localhost:5000/api';

let total = 0;
let passed = 0;
let failed = 0;

function assert(condition, testName, detail = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${testName} ${detail ? '(' + detail + ')' : ''}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${testName} ${detail ? '(' + detail + ')' : ''}`);
  }
}

async function api(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = { raw: await res.text() };
  }
  return { status: res.status, data };
}

async function run() {
  console.log('\n======================================================================');
  console.log('  🚀 HAWASSA MESOB SYSTEM - FULL END-TO-END VERIFICATION');
  console.log('======================================================================\n');

  // 1. HEALTH CHECK
  console.log('1. System Health & Database Connectivity:');
  const health = await api('/health');
  assert(health.status === 200 && health.data.status === 'healthy', 'Backend API is operational & healthy');
  assert(health.data.services?.database?.connected === true, 'Supabase Database connection is active and operational');

  // 2. AUTHENTICATION FOR ALL 6 ROLES
  console.log('\n2. Role-Based Authentication & JWT Validation:');
  const credentials = [
    { role: 'SUPER_ADMIN', email: 'superadmin@mesobcenterh.gov.et', pass: 'Admin@2026' },
    { role: 'MESOB_MANAGER', email: 'manager@mesobcenterh.gov.et', pass: 'Manager@2026' },
    { role: 'INSTITUTION_MANAGER', email: 'instmanager@mesobcenterh.gov.et', pass: 'InstMgr@2026' },
    { role: 'EMPLOYEE', email: 'employee@mesobcenterh.gov.et', pass: 'Employee@2026' },
    { role: 'TECHNICIAN', email: 'technician@mesobcenterh.gov.et', pass: 'Technician@2026' },
    { role: 'CUSTOMER', email: 'customer@gmail.com', pass: 'Customer@2026' }
  ];

  const tokens = {};
  for (const c of credentials) {
    const loginRes = await api('/auth/login', 'POST', { email: c.email, password: c.pass });
    assert(
      loginRes.status === 200 && loginRes.data.success === true,
      `Login for ${c.role} (${c.email}) succeeds`,
      `Token issued: ${loginRes.data.data?.accessToken ? 'Yes' : 'No'}`
    );
    assert(
      loginRes.data.data?.user?.role === c.role,
      `Returned role matches ${c.role}`,
      loginRes.data.data?.user?.role
    );
    tokens[c.role] = loginRes.data.data?.accessToken;
  }

  // 3. GET /auth/me FOR CURRENT USER PROFILE
  console.log('\n3. Profile Self-Retrieval (/api/auth/me):');
  const meRes = await api('/auth/me', 'GET', null, tokens.SUPER_ADMIN);
  assert(meRes.status === 200 && meRes.data.success === true, 'Super Admin /auth/me returns 200 OK');
  assert(meRes.data.data?.user?.email === 'superadmin@mesobcenterh.gov.et', 'Verified Super Admin profile identity');

  // 4. STRICT DOMAIN VALIDATION
  console.log('\n4. Strict Domain Enforcement & Guardrails:');
  const legacyBlocked = await api('/auth/login', 'POST', { email: 'superadmin@mesobcenter.et', password: 'Admin@2026' });
  assert(
    legacyBlocked.status === 401 && !legacyBlocked.data.success && legacyBlocked.data.message?.includes('restricted'),
    'Legacy @mesobcenter.et logins are strictly rejected'
  );
  const badDomain = await api('/auth/login', 'POST', { email: 'user@outlook.com', password: 'Password@2026' });
  assert(
    badDomain.status === 401 && !badDomain.data.success && badDomain.data.message?.includes('restricted'),
    'Unauthorized external domain logins are blocked'
  );

  // 5. INSTITUTIONS API
  console.log('\n5. Institutions Catalogue API:');
  const instRes = await api('/institutions', 'GET', null, tokens.SUPER_ADMIN);
  assert(instRes.status === 200, 'GET /api/institutions returns 200 OK');
  const instList = Array.isArray(instRes.data) ? instRes.data : instRes.data?.data || [];
  assert(instList.length > 0, `Institutions retrieved: ${instList.length} registered institutions`);
  const sampleInst = instList[0];

  // 6. SERVICES CATALOGUE API
  console.log('\n6. Services Catalogue API:');
  const servicesRes = await api('/services', 'GET', null, tokens.CUSTOMER);
  assert(servicesRes.status === 200, 'GET /api/services returns 200 OK for customers');
  const serviceList = Array.isArray(servicesRes.data) ? servicesRes.data : servicesRes.data?.data || [];
  assert(serviceList.length > 0, `Services available: ${serviceList.length} services loaded`);

  // 7. ANNOUNCEMENTS FULL LIFECYCLE (CREATE -> VIEW -> EDIT -> DELETE)
  console.log('\n7. Announcements Full Lifecycle (Verification of User Reported Issue):');
  
  // 7a. Create Announcement
  const testTitle = `Deployment E2E Test Announcement ${Date.now()}`;
  const createAnn = await api('/announcements', 'POST', {
    title: testTitle,
    content: 'Announcement testing deployment readiness and edit operations.',
    scope: 'PUBLIC'
  }, tokens.SUPER_ADMIN);
  assert(createAnn.status === 201 && createAnn.data.success === true, 'Super Admin creates announcement successfully');
  const annId = createAnn.data.data?.id;

  // 7b. View Announcement Details
  const viewAnn = await api(`/announcements/${annId}`, 'GET', null, tokens.SUPER_ADMIN);
  assert(viewAnn.status === 200 && viewAnn.data.data?.title === testTitle, 'Announcement detail view retrieved accurately');

  // 7c. Edit / Update Announcement (The critical fix!)
  const updatedTitle = `${testTitle} [EDITED & VERIFIED]`;
  const editAnn = await api(`/announcements/${annId}`, 'PATCH', {
    title: updatedTitle,
    content: 'Updated content via edit button action verification.',
    scope: 'INTERNAL'
  }, tokens.SUPER_ADMIN);
  assert(editAnn.status === 200 && editAnn.data.success === true, 'Announcement updated successfully (PATCH /announcements/:id)');

  // 7d. Verify Persistence of Updated Values
  const verifyAnn = await api(`/announcements/${annId}`, 'GET', null, tokens.SUPER_ADMIN);
  assert(
    verifyAnn.data.data?.title === updatedTitle && verifyAnn.data.data?.scope === 'INTERNAL',
    'Persisted updated title and INTERNAL scope successfully'
  );

  // 7e. Delete Announcement
  const deleteAnn = await api(`/announcements/${annId}`, 'DELETE', null, tokens.SUPER_ADMIN);
  assert(deleteAnn.status === 200 && deleteAnn.data.success === true, 'Announcement deleted cleanly (DELETE /announcements/:id)');

  // 8. QUEUE MANAGEMENT API
  console.log('\n8. Queue Management API:');
  const queuesRes = await api('/queues', 'GET', null, tokens.EMPLOYEE);
  assert(queuesRes.status === 200, 'GET /api/queues returns 200 OK for employees');

  // 9. MAINTENANCE & TECHNICIAN WORKFLOW API
  console.log('\n9. Maintenance Management & Technician Tasks:');
  const techTasks = await api('/maintenance/my-tasks', 'GET', null, tokens.TECHNICIAN);
  assert(techTasks.status === 200 && techTasks.data.success === true, 'Technician can access assigned maintenance tasks');
  
  const custForbidden = await api('/maintenance/my-tasks', 'GET', null, tokens.CUSTOMER);
  assert(custForbidden.status === 403, 'RBAC Security: Customer is forbidden from technician maintenance tasks (403)');

  // 10. ROLE DASHBOARDS
  console.log('\n10. Role-Specific Dashboards Verification:');
  const techDash = await api('/dashboards/me', 'GET', null, tokens.TECHNICIAN);
  assert(techDash.status === 200 && techDash.data.success === true, 'Technician dashboard API accessible');

  const custDash = await api('/dashboards/me', 'GET', null, tokens.CUSTOMER);
  assert(custDash.status === 200 && custDash.data.success === true, 'Customer dashboard API accessible');

  // SUMMARY
  console.log('\n======================================================================');
  console.log(`  📊 FINAL VERIFICATION RESULTS: ${passed}/${total} checks passed (${((passed/total)*100).toFixed(1)}%)`);
  if (failed === 0) {
    console.log('  🎉 100% OF SYSTEM VERIFICATION CHECKS PASSED - READY TO DEPLOY!');
  } else {
    console.error(`  ⚠️ ${failed} check(s) failed.`);
  }
  console.log('======================================================================\n');

  process.exit(failed === 0 ? 0 : 1);
}

run().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
