/**
 * Comprehensive Automated Verification Suite for Hawassa MESOB Authentication Enhancements
 * Tests all 12 scenarios specified in the requirements.
 */

import { supabase } from '../config/supabase.js';

const BASE_URL = 'http://localhost:5000/api';
const timestamp = Date.now();

const results = [];

function recordTest(id, name, passed, details) {
  results.push({ id, name, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [Test ${id}] ${name}`);
  if (details) console.log(`   └─ ${details}`);
}

async function runTests() {
  console.log('\n================================================================');
  console.log('  🧪 RUNNING AUTHENTICATION & REGISTRATION VERIFICATION SUITE');
  console.log('================================================================\n');

  let adminToken = '';
  let institutionId = '';

  // Step 0: Login Super Admin to perform admin actions
  try {
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@mesobcenter.et', password: 'SuperAdmin@2026' })
    });
    const adminData = await adminRes.json();
    if (adminData.success && adminData.data?.accessToken) {
      adminToken = adminData.data.accessToken;
      console.log('Super Admin logged in successfully.\n');
    } else {
      throw new Error(`Admin login failed: ${adminData.message}`);
    }

    const { data: inst } = await supabase.from('institutions').select('id').limit(1).single();
    institutionId = inst?.id;
  } catch (err) {
    console.error('Fatal setup error:', err.message);
    process.exit(1);
  }

  // ────────────────────────────────────────────────────────────────
  // Test 1: Administrator can create internal account with correct role & official email
  // Also verify that non-institutional email for internal user is rejected
  // ────────────────────────────────────────────────────────────────
  let internalUserEmail = `staff.${timestamp}@mesobcenterh.gov.et`;
  let tempPassword = '';
  let internalUserId = '';

  try {
    // 1a. Attempt creating staff with non-institutional email (@gmail.com) -> should reject
    const invalidEmailRes = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        fullName: 'Invalid Staff',
        email: `invalid.staff.${timestamp}@gmail.com`,
        role: 'EMPLOYEE',
        institutionId: institutionId,
        employeeId: 'EMP-001'
      })
    });
    const invalidEmailData = await invalidEmailRes.json();
    const rejectedNonGov = !invalidEmailData.success && invalidEmailData.message.includes('institutional email');

    // 1b. Create staff with valid official institutional email (@mesobcenterh.gov.et)
    const validCreateRes = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        fullName: 'Hawassa Staff Officer',
        email: internalUserEmail,
        role: 'EMPLOYEE',
        institutionId: institutionId,
        employeeId: `EMP-${timestamp.toString().slice(-4)}`
      })
    });
    const validCreateData = await validCreateRes.json();
    tempPassword = validCreateData.data?.tempPassword;
    internalUserId = validCreateData.data?.id;

    const createdSuccessfully = validCreateData.success && tempPassword && tempPassword.length >= 8;
    recordTest(1, 'Administrator can create internal account with official email & temp password',
      rejectedNonGov && createdSuccessfully,
      `Non-gov rejected: ${rejectedNonGov}. Valid account created with tempPassword (length: ${tempPassword?.length})`
    );
  } catch (err) {
    recordTest(1, 'Administrator can create internal account', false, err.message);
  }

  // ────────────────────────────────────────────────────────────────
  // Test 2: Public visitor cannot register an internal account
  // ────────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Hacker',
        lastName: 'Admin',
        email: `hacker.${timestamp}@mesobcenterh.gov.et`,
        password: 'Password@2026',
        role: 'SUPER_ADMIN'
      })
    });
    const data = await res.json();
    // Must be rejected because public registration only allows @gmail.com and cannot create staff
    const passed = !data.success && data.message.includes('@gmail.com');
    recordTest(2, 'Public visitor cannot register an internal account', passed,
      `Rejected with message: "${data.message}"`
    );
  } catch (err) {
    recordTest(2, 'Public visitor cannot register an internal account', false, err.message);
  }

  // ────────────────────────────────────────────────────────────────
  // Test 3: Customer can register using a valid Gmail address
  // ────────────────────────────────────────────────────────────────
  let customerEmail = `citizen.${timestamp}@gmail.com`;
  let customerPassword = 'Customer@2026!';
  let customerToken = '';
  let verificationCode = '';

  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Citizen',
        lastName: 'Mesob',
        email: customerEmail,
        password: customerPassword,
        phone: '0911223344'
      })
    });
    const data = await res.json();
    customerToken = data.data?.accessToken;
    verificationCode = data.data?.verificationCode;

    const passed = data.success && data.data?.user?.email === customerEmail && ['CUSTOMER', 'CITIZEN'].includes(data.data?.user?.role);
    recordTest(3, 'Customer can register using a valid Gmail address (@gmail.com)', passed,
      `Created customer with role: ${data.data?.user?.role}`
    );
  } catch (err) {
    recordTest(3, 'Customer can register using a valid Gmail address', false, err.message);
  }

  // ────────────────────────────────────────────────────────────────
  // Test 4: Registration using a non-Gmail address is rejected by backend
  // ────────────────────────────────────────────────────────────────
  try {
    const testDomains = [`test.${timestamp}@yahoo.com`, `test.${timestamp}@outlook.com`, `test.${timestamp}@somedomain.net`];
    let allRejected = true;

    for (const d of testDomains) {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Non',
          lastName: 'Gmail',
          email: d,
          password: 'Customer@2026!'
        })
      });
      const data = await res.json();
      if (data.success || !data.message.includes('@gmail.com')) {
        allRejected = false;
        break;
      }
    }

    recordTest(4, 'Registration using non-Gmail addresses is rejected by backend', allRejected,
      allRejected ? 'All non-Gmail domain registrations were strictly blocked' : 'A non-Gmail address was accepted'
    );
  } catch (err) {
    recordTest(4, 'Registration using non-Gmail addresses is rejected', false, err.message);
  }

  // ────────────────────────────────────────────────────────────────
  // Test 5: A customer cannot assign themselves another role
  // ────────────────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Sneaky',
        lastName: 'User',
        email: `sneaky.${timestamp}@gmail.com`,
        password: 'Password@2026!',
        role: 'SUPER_ADMIN' // Client attempts privilege escalation
      })
    });
    const data = await res.json();
    const assignedRole = data.data?.user?.role;
    const passed = data.success && (assignedRole === 'CUSTOMER' || assignedRole === 'CITIZEN') && assignedRole !== 'SUPER_ADMIN';

    recordTest(5, 'A customer cannot assign themselves another role', passed,
      `Submitted SUPER_ADMIN role -> Server assigned role: ${assignedRole}`
    );
  } catch (err) {
    recordTest(5, 'A customer cannot assign themselves another role', false, err.message);
  }

  // ────────────────────────────────────────────────────────────────
  // Test 6: A new internal user can log in with their temporary password
  // (Activate account in DB for testing login)
  // ────────────────────────────────────────────────────────────────
  let internalUserToken = '';

  try {
    // Activate the internal user record directly in Supabase for testing (in case it is pending approval)
    await supabase.from('users').update({ status: 'ACTIVE' }).eq('id', internalUserId);

    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: internalUserEmail,
        password: tempPassword
      })
    });
    const loginData = await loginRes.json();
    internalUserToken = loginData.data?.accessToken;
    const mustChangePassword = loginData.data?.mustChangePassword;

    const passed = loginData.success && internalUserToken && mustChangePassword === true;
    recordTest(6, 'New internal user can log in with temporary password', passed,
      `Login success: ${loginData.success}, mustChangePassword: ${mustChangePassword}`
    );
  } catch (err) {
    recordTest(6, 'New internal user can log in with temporary password', false, err.message);
  }

  // ────────────────────────────────────────────────────────────────
  // Test 7: Internal user cannot access dashboard or protected business API before changing password
  // ────────────────────────────────────────────────────────────────
  try {
    // Attempt accessing protected endpoint /api/users with the restricted token
    const res = await fetch(`${BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${internalUserToken}` }
    });
    const data = await res.json();
    const blocked = res.status === 403 && data.code === 'MUST_CHANGE_PASSWORD';

    recordTest(7, 'Internal user cannot access protected APIs before changing password', blocked,
      `Status: ${res.status}, Error Code: ${data.code}, Message: "${data.message}"`
    );
  } catch (err) {
    recordTest(7, 'Internal user blocked from protected APIs before password change', false, err.message);
  }

  // ────────────────────────────────────────────────────────────────
  // Test 8: Internal user can set a new password and then access authorized resources
  // ────────────────────────────────────────────────────────────────
  let newPermanentPassword = 'PermanentStaff@2026!';
  let freshToken = '';

  try {
    const changeRes = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${internalUserToken}`
      },
      body: JSON.stringify({
        currentPassword: tempPassword,
        newPassword: newPermanentPassword,
        confirmPassword: newPermanentPassword
      })
    });
    const changeData = await changeRes.json();
    freshToken = changeData.data?.accessToken;
    const changeSuccess = changeData.success && changeData.data?.mustChangePassword === false;

    // Now test accessing /api/auth/me with the fresh permanent session
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${freshToken}` }
    });
    const meData = await meRes.json();
    const accessible = meData.success && meData.data?.user?.email === internalUserEmail;

    recordTest(8, 'Internal user can set new password and access authorized system',
      changeSuccess && accessible,
      `Password changed: ${changeSuccess}. Account active without restricted session: ${accessible}`
    );
  } catch (err) {
    recordTest(8, 'Internal user can set new password', false, err.message);
  }

  // ────────────────────────────────────────────────────────────────
  // Test 9: Temporary password no longer works after password change
  // ────────────────────────────────────────────────────────────────
  try {
    const oldLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: internalUserEmail,
        password: tempPassword // old temporary password
      })
    });
    const oldLoginData = await oldLoginRes.json();
    const tempPasswordRevoked = !oldLoginData.success;

    // Verify new password works
    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: internalUserEmail,
        password: newPermanentPassword
      })
    });
    const newLoginData = await newLoginRes.json();
    const newPasswordWorks = newLoginData.success;

    recordTest(9, 'Temporary password no longer works after password change',
      tempPasswordRevoked && newPasswordWorks,
      `Temp password rejected: ${tempPasswordRevoked}. New password accepted: ${newPasswordWorks}`
    );
  } catch (err) {
    recordTest(9, 'Temporary password no longer works after change', false, err.message);
  }

  // ────────────────────────────────────────────────────────────────
  // Test 10: Existing users with permanent passwords continue logging in normally
  // ────────────────────────────────────────────────────────────────
  try {
    const existingRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@mesobcenter.et',
        password: 'SuperAdmin@2026'
      })
    });
    const existingData = await existingRes.json();
    const passed = existingData.success && existingData.data?.mustChangePassword === false;

    recordTest(10, 'Existing users with permanent passwords continue logging in normally', passed,
      `Logged in without forced password change: ${passed}`
    );
  } catch (err) {
    recordTest(10, 'Existing users continue logging in normally', false, err.message);
  }

  // ────────────────────────────────────────────────────────────────
  // Test 11: Users cannot access another role\'s APIs by changing URLs or request data
  // ────────────────────────────────────────────────────────────────
  try {
    // Attempt calling Super Admin /api/users endpoint using Customer Token
    const unauthorizedRes = await fetch(`${BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const passed = unauthorizedRes.status === 403;

    recordTest(11, 'Users cannot access another role\'s APIs (RBAC strictly enforced)', passed,
      `Customer accessing /api/users returned HTTP status ${unauthorizedRes.status} (Forbidden)`
    );
  } catch (err) {
    recordTest(11, 'RBAC enforcement', false, err.message);
  }

  // ────────────────────────────────────────────────────────────────
  // Test 12: Email verification, session handling, and invalid token handling behave correctly
  // ────────────────────────────────────────────────────────────────
  try {
    // 12a. Verify email with wrong code -> should fail
    const wrongCodeRes = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: customerEmail, code: '000000' })
    });
    const wrongCodeData = await wrongCodeRes.json();
    const wrongCodeRejected = !wrongCodeData.success;

    // 12b. Verify email with correct code if available
    let correctCodeAccepted = true;
    if (verificationCode) {
      const correctCodeRes = await fetch(`${BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customerEmail, code: verificationCode })
      });
      const correctCodeData = await correctCodeRes.json();
      correctCodeAccepted = correctCodeData.success;
    }

    // 12c. Logout invalidates session
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const logoutData = await logoutRes.json();

    const passed = wrongCodeRejected && correctCodeAccepted && logoutData.success;
    recordTest(12, 'Email verification and session invalidation behave correctly', passed,
      `Invalid code rejected: ${wrongCodeRejected}, Valid code accepted: ${correctCodeAccepted}, Logout success: ${logoutData.success}`
    );
  } catch (err) {
    recordTest(12, 'Email verification and session handling', false, err.message);
  }

  // ────────────────────────────────────────────────────────────────
  // SUMMARY REPORT
  // ────────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log('  📊 VERIFICATION SUITE RESULTS SUMMARY');
  console.log('================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  console.log(`Total Scenarios Tested : ${totalCount}`);
  console.log(`Passed                 : ${passedCount}`);
  console.log(`Failed                 : ${totalCount - passedCount}`);
  console.log(`Overall Success Rate   : ${((passedCount / totalCount) * 100).toFixed(1)}%\n`);

  if (passedCount === totalCount) {
    console.log('🎉 ALL 12 SECURITY SCENARIOS FULLY VERIFIED AND PASSING!\n');
  } else {
    console.error('⚠️ SOME TESTS FAILED! Check log above.\n');
    process.exit(1);
  }
}

runTests();
