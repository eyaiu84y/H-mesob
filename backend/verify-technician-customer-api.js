/**
 * verify-technician-customer-api.js
 *
 * Verifies that the role rename from ICT_STAFF -> TECHNICIAN and CITIZEN -> CUSTOMER
 * is completely operational across all API endpoints:
 *
 * 1. POST /api/auth/login for TECHNICIAN returns role: 'TECHNICIAN'
 * 2. POST /api/auth/login for CUSTOMER returns role: 'CUSTOMER'
 * 3. GET /api/auth/me for TECHNICIAN returns role: 'TECHNICIAN'
 * 4. GET /api/auth/me for CUSTOMER returns role: 'CUSTOMER'
 * 5. GET /api/users returns normalized roles (zero legacy ICT_STAFF / CITIZEN)
 * 6. GET /api/users?role=TECHNICIAN filters technicians correctly
 * 7. GET /api/users?role=CUSTOMER filters customers correctly
 * 8. GET /api/dashboards/me works for both TECHNICIAN and CUSTOMER
 * 9. RBAC guards: Customer cannot access technician endpoints (403 Forbidden)
 */

import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000/api';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName} ${details ? '(' + details + ')' : ''}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
  }
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

async function run() {
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('  🧪 VERIFYING TECHNICIAN & CUSTOMER ROLE API INTEGRATION');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  // Test 1: Technician Login
  console.log('1. Testing Technician Authentication API:');
  const techLogin = await login('technician@mesobcenterh.gov.et', 'Technician@2026');
  assert(techLogin.success === true, 'Technician login successful');
  assert(techLogin.data?.user?.role === 'TECHNICIAN', 'Technician returned user.role is TECHNICIAN', techLogin.data?.user?.role);
  
  const techToken = techLogin.data?.accessToken;
  const decodedTech = jwt.decode(techToken);
  assert(decodedTech?.role === 'TECHNICIAN', 'Technician JWT token payload role is TECHNICIAN', decodedTech?.role);

  // Test 2: Customer Login
  console.log('\n2. Testing Customer Authentication API:');
  const custLogin = await login('customer@gmail.com', 'Customer@2026');
  assert(custLogin.success === true, 'Customer login successful');
  assert(custLogin.data?.user?.role === 'CUSTOMER', 'Customer returned user.role is CUSTOMER', custLogin.data?.user?.role);
  
  const custToken = custLogin.data?.accessToken;
  const decodedCust = jwt.decode(custToken);
  assert(decodedCust?.role === 'CUSTOMER', 'Customer JWT token payload role is CUSTOMER', decodedCust?.role);

  // Test 3: GET /api/auth/me for Technician
  console.log('\n3. Testing GET /api/auth/me for Technician:');
  const techMeRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${techToken}` }
  });
  const techMe = await techMeRes.json();
  assert(techMe.success === true, 'GET /auth/me for Technician returns 200');
  assert(techMe.data?.user?.role === 'TECHNICIAN', '/auth/me user.role is TECHNICIAN', techMe.data?.user?.role);

  // Test 4: GET /api/auth/me for Customer
  console.log('\n4. Testing GET /api/auth/me for Customer:');
  const custMeRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${custToken}` }
  });
  const custMe = await custMeRes.json();
  assert(custMe.success === true, 'GET /auth/me for Customer returns 200');
  assert(custMe.data?.user?.role === 'CUSTOMER', '/auth/me user.role is CUSTOMER', custMe.data?.user?.role);

  // Test 5: Super Admin User Management API
  console.log('\n5. Testing GET /api/users User Listing API:');
  const adminLogin = await login('superadmin@mesobcenterh.gov.et', 'Admin@2026');
  assert(adminLogin.success === true, 'Super Admin login successful');
  const adminToken = adminLogin.data?.accessToken;

  const usersRes = await fetch(`${BASE_URL}/users`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const usersData = await usersRes.json();
  assert(usersData.success === true, 'GET /users returns 200');
  
  const users = usersData.data || [];
  const rolesFound = [...new Set(users.map(u => u.role))];
  console.log('   Roles present in /api/users:', rolesFound.join(', '));

  const hasLegacyCitizen = users.some(u => u.role === 'CITIZEN');
  const hasLegacyIct = users.some(u => u.role === 'ICT_STAFF');
  assert(!hasLegacyCitizen, 'Zero users have legacy role "CITIZEN" (all converted to CUSTOMER)');
  assert(!hasLegacyIct, 'Zero users have legacy role "ICT_STAFF" (all converted to TECHNICIAN)');
  
  const techCount = users.filter(u => u.role === 'TECHNICIAN').length;
  const custCount = users.filter(u => u.role === 'CUSTOMER').length;
  assert(techCount > 0, `TECHNICIAN users found in listing: ${techCount}`);
  assert(custCount > 0, `CUSTOMER users found in listing: ${custCount}`);

  // Test 6: Filter by Role
  console.log('\n6. Testing Role-filtered Queries:');
  const techFilterRes = await fetch(`${BASE_URL}/users?role=TECHNICIAN`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const techFiltered = await techFilterRes.json();
  const allTechs = (techFiltered.data || []).every(u => u.role === 'TECHNICIAN');
  assert(techFiltered.success === true && allTechs, 'GET /users?role=TECHNICIAN returns only TECHNICIAN users', `Count: ${techFiltered.data?.length}`);

  const custFilterRes = await fetch(`${BASE_URL}/users?role=CUSTOMER`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const custFiltered = await custFilterRes.json();
  const allCusts = (custFiltered.data || []).every(u => u.role === 'CUSTOMER');
  assert(custFiltered.success === true && allCusts, 'GET /users?role=CUSTOMER returns only CUSTOMER users', `Count: ${custFiltered.data?.length}`);

  // Test 7: Dashboard API
  console.log('\n7. Testing Dashboard Endpoints:');
  let activeTechToken = techToken;
  if (techLogin.data?.mustChangePassword) {
    const changeRes = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${techToken}`
      },
      body: JSON.stringify({
        currentPassword: 'Technician@2026',
        newPassword: 'TechnicianUpdated@2026',
        confirmPassword: 'TechnicianUpdated@2026'
      })
    });
    const changeData = await changeRes.json();
    if (changeData.success && changeData.data?.accessToken) {
      activeTechToken = changeData.data.accessToken;
      // Restore original password for reproducible test runs
      const revertRes = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeTechToken}`
        },
        body: JSON.stringify({
          currentPassword: 'TechnicianUpdated@2026',
          newPassword: 'Technician@2026',
          confirmPassword: 'Technician@2026'
        })
      });
      const revertData = await revertRes.json();
      if (revertData.success && revertData.data?.accessToken) {
        activeTechToken = revertData.data.accessToken;
      }
    }
  }

  const techDashRes = await fetch(`${BASE_URL}/dashboards/me`, {
    headers: { Authorization: `Bearer ${activeTechToken}` }
  });
  const techDash = await techDashRes.json();
  if (techDashRes.status !== 200 || !techDash.success) {
    console.log('   techDash debug: status =', techDashRes.status, 'body =', JSON.stringify(techDash));
  }
  assert(techDashRes.status === 200 && techDash.success, 'Technician dashboard returns 200');

  const custDashRes = await fetch(`${BASE_URL}/dashboards/me`, {
    headers: { Authorization: `Bearer ${custToken}` }
  });
  const custDash = await custDashRes.json();
  assert(custDashRes.status === 200 && custDash.success, 'Customer dashboard returns 200');

  // Test 8: Security Guard - Customer cannot access technician tasks
  console.log('\n8. Testing RBAC Security Guard:');
  const forbiddenRes = await fetch(`${BASE_URL}/maintenance/my-tasks`, {
    headers: { Authorization: `Bearer ${custToken}` }
  });
  assert(forbiddenRes.status === 403, 'Customer blocked from technician tasks endpoint (403 Forbidden)', `Status: ${forbiddenRes.status}`);

  // Summary
  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log(`  VERIFICATION RESULTS: ${passedTests}/${totalTests} tests passed (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  if (failedTests === 0) {
    console.log('  🎉 ALL TECHNICIAN AND CUSTOMER API CHECKS PASSED PERFECTLY (100%)!');
  } else {
    console.error(`  ⚠️ ${failedTests} test(s) failed.`);
  }
  console.log('══════════════════════════════════════════════════════════════════════\n');

  process.exit(failedTests === 0 ? 0 : 1);
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
