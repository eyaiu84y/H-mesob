/**
 * verify-domain-restrictions.js
 *
 * Verifies the strict email domain enforcement:
 * 1. External customers can sign up ONLY with @gmail.com (non-@gmail.com rejected)
 * 2. External customers can log in ONLY with @gmail.com (non-@gmail.com rejected)
 * 3. Internal users can log in ONLY with @mesobcenterh.gov.et (non-@mesobcenterh.gov.et rejected)
 * 4. Logins with legacy @mesobcenter.et are completely BLOCKED and RESTRICTED
 * 5. Internal user creation by Admin strictly requires @mesobcenterh.gov.et
 * 6. All official roles (Super Admin, Mesob Manager, Institution Manager, Employee, Technician)
 *    can authenticate with @mesobcenterh.gov.et successfully.
 */

const BASE_URL = 'http://localhost:5000/api';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, detail = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName} ${detail ? '(' + detail + ')' : ''}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName} ${detail ? '(' + detail + ')' : ''}`);
  }
}

async function post(endpoint, body, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log('  🔒 VERIFYING STRICT EMAIL DOMAIN VALIDATION & ENFORCEMENT');
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  // =========================================================================
  // TEST 1: Legacy @mesobcenter.et Login Restriction
  // =========================================================================
  console.log('1. Testing @mesobcenter.et Login Restrictions (Must Be Prohibited):');

  const mesobAdminLogin = await post('/auth/login', {
    email: 'superadmin@mesobcenter.et',
    password: 'SuperAdmin@2026'
  });
  assert(
    !mesobAdminLogin.data.success && mesobAdminLogin.data.message?.includes('restricted'),
    'Legacy @mesobcenter.et internal staff login is strictly RESTRICTED',
    `Status: ${mesobAdminLogin.status}, Msg: ${mesobAdminLogin.data.message}`
  );

  const mesobCustLogin = await post('/auth/login', {
    email: 'customer@mesobcenter.et',
    password: 'customer@2026'
  });
  assert(
    !mesobCustLogin.data.success && mesobCustLogin.data.message?.includes('restricted'),
    'Legacy @mesobcenter.et customer login is strictly RESTRICTED',
    `Status: ${mesobCustLogin.status}, Msg: ${mesobCustLogin.data.message}`
  );

  const yahooLogin = await post('/auth/login', {
    email: 'random@yahoo.com',
    password: 'Password@2026'
  });
  assert(
    !yahooLogin.data.success && yahooLogin.data.message?.includes('restricted'),
    'Random domain (@yahoo.com) login is strictly RESTRICTED',
    `Status: ${yahooLogin.status}`
  );

  const govEtLogin = await post('/auth/login', {
    email: 'officer@ministry.gov.et',
    password: 'Password@2026'
  });
  assert(
    !govEtLogin.data.success && govEtLogin.data.message?.includes('restricted'),
    'Generic @*.gov.et domain login is strictly RESTRICTED (only @mesobcenterh.gov.et allowed)',
    `Status: ${govEtLogin.status}`
  );

  // =========================================================================
  // TEST 2: Customer Signup Strict @gmail.com Validation
  // =========================================================================
  console.log('\n2. Testing Customer Signup Validation (Only @gmail.com Allowed):');

  const badSignup1 = await post('/auth/register', {
    firstName: 'Test',
    lastName: 'User',
    email: 'user@mesobcenter.et',
    password: 'Password@2026'
  });
  assert(
    badSignup1.status === 400 && !badSignup1.data.success && badSignup1.data.message?.includes('@gmail.com'),
    'Customer signup with @mesobcenter.et is strictly REJECTED',
    badSignup1.data.message
  );

  const badSignup2 = await post('/auth/register', {
    firstName: 'Test',
    lastName: 'User',
    email: 'user@outlook.com',
    password: 'Password@2026'
  });
  assert(
    badSignup2.status === 400 && !badSignup2.data.success && badSignup2.data.message?.includes('@gmail.com'),
    'Customer signup with @outlook.com is strictly REJECTED',
    badSignup2.data.message
  );

  const timestamp = Date.now();
  const goodSignup = await post('/auth/register', {
    firstName: 'Valid',
    lastName: 'Customer',
    email: `valid.citizen.${timestamp}@gmail.com`,
    password: 'Password@2026'
  });
  assert(
    goodSignup.status === 201 && goodSignup.data.success === true,
    'Customer signup with valid @gmail.com SUCCEEDS',
    `Role assigned: ${goodSignup.data.data?.user?.role}`
  );
  assert(
    goodSignup.data.data?.user?.role === 'CUSTOMER',
    'Customer signup automatically assigns role CUSTOMER'
  );

  // =========================================================================
  // TEST 3: Customer Login Validation (@gmail.com only)
  // =========================================================================
  console.log('\n3. Testing Customer Login (Only @gmail.com Allowed):');

  const validCustLogin = await post('/auth/login', {
    email: 'customer@gmail.com',
    password: 'Customer@2026'
  });
  assert(
    validCustLogin.status === 200 && validCustLogin.data.success === true,
    'Customer login with valid @gmail.com SUCCEEDS',
    `User: ${validCustLogin.data.data?.user?.email}, Role: ${validCustLogin.data.data?.user?.role}`
  );
  assert(
    validCustLogin.data.data?.user?.role === 'CUSTOMER',
    'Customer returned user.role is CUSTOMER'
  );

  // =========================================================================
  // TEST 4: Internal Staff Login Validation (@mesobcenterh.gov.et only)
  // =========================================================================
  console.log('\n4. Testing Internal Staff Logins (Only @mesobcenterh.gov.et Allowed):');

  const internalRoles = [
    { role: 'SUPER_ADMIN', email: 'superadmin@mesobcenterh.gov.et', pass: 'Admin@2026' },
    { role: 'MESOB_MANAGER', email: 'manager@mesobcenterh.gov.et', pass: 'Manager@2026' },
    { role: 'INSTITUTION_MANAGER', email: 'instmanager@mesobcenterh.gov.et', pass: 'InstMgr@2026' },
    { role: 'EMPLOYEE', email: 'employee@mesobcenterh.gov.et', pass: 'Employee@2026' },
    { role: 'TECHNICIAN', email: 'technician@mesobcenterh.gov.et', pass: 'Technician@2026' }
  ];

  let adminToken = null;

  for (const staff of internalRoles) {
    const res = await post('/auth/login', { email: staff.email, password: staff.pass });
    assert(
      res.status === 200 && res.data.success === true,
      `Internal staff login for ${staff.role} (${staff.email}) SUCCEEDS`,
      `Returned Role: ${res.data.data?.user?.role}`
    );
    if (staff.role === 'SUPER_ADMIN') {
      adminToken = res.data.data?.accessToken;
    }
  }

  // =========================================================================
  // TEST 5: System Admin Registering Internal User (Domain Validation)
  // =========================================================================
  console.log('\n5. Testing Admin Internal User Creation (Only @mesobcenterh.gov.et Allowed):');

  if (adminToken) {
    const badAdminCreate = await post('/users', {
      fullName: 'Illegal Internal User',
      email: 'staff@mesobcenter.et',
      role: 'EMPLOYEE',
      institutionId: 'd1a0b3c4-0001-4000-a000-000000000001',
      employeeId: 'EMP-999'
    }, adminToken);

    assert(
      badAdminCreate.status === 400 && !badAdminCreate.data.success && badAdminCreate.data.message?.includes('@mesobcenterh.gov.et'),
      'Admin cannot create internal staff with @mesobcenter.et (must be @mesobcenterh.gov.et)',
      badAdminCreate.data.message
    );

    const badAdminCreate2 = await post('/users', {
      fullName: 'Illegal Internal User',
      email: 'staff@citygov.gov.et',
      role: 'TECHNICIAN',
      institutionId: 'd1a0b3c4-0001-4000-a000-000000000001',
      employeeId: 'TECH-999'
    }, adminToken);

    assert(
      badAdminCreate2.status === 400 && !badAdminCreate2.data.success && badAdminCreate2.data.message?.includes('@mesobcenterh.gov.et'),
      'Admin cannot create internal staff with generic @*.gov.et (must strictly be @mesobcenterh.gov.et)',
      badAdminCreate2.data.message
    );
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n══════════════════════════════════════════════════════════════════════════');
  console.log(`  VERIFICATION RESULTS: ${passedTests}/${totalTests} tests passed (${((passedTests/totalTests)*100).toFixed(1)}%)`);
  if (failedTests === 0) {
    console.log('  🎉 ALL EMAIL DOMAIN RESTRICTIONS & VERIFICATIONS PASSED PERFECTLY (100%)!');
  } else {
    console.error(`  ⚠️ ${failedTests} test(s) failed.`);
  }
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  process.exit(failedTests === 0 ? 0 : 1);
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
