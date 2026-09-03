/**
 * Frontend Authentication Integration Test
 * Tests the frontend can successfully authenticate with backend API
 */

const API_URL = 'http://localhost:5000/api';

// Test users matching backend database
const testUsers = {
  SUPER_ADMIN: { email: 'superadmin@mesobcenter.et', password: 'SuperAdmin@2026', expectedRole: 'super_admin' },
  MESOB_MANAGER: { email: 'manager@mesobcenter.et', password: 'MesobManager@2026', expectedRole: 'mesob_manager' },
  INSTITUTION_MANAGER: { email: 'inst.manager@mesobcenter.et', password: 'InstManager@2026', expectedRole: 'institution_manager' },
  EMPLOYEE: { email: 'employee@mesobcenter.et', password: 'Employee@2026', expectedRole: 'employee' },
  ICT_STAFF: { email: 'ict.staff@mesobcenter.et', password: 'IctStaff@2026', expectedRole: 'ict_staff' },
  CITIZEN: { email: 'citizen@mesobcenter.et', password: 'Citizen@2026', expectedRole: 'citizen' }
};

let passCount = 0;
let failCount = 0;

function pass(test) {
  passCount++;
  console.log(`✅ ${test}`);
}

function fail(test, details = '') {
  failCount++;
  console.log(`❌ ${test}${details ? ' - ' + details : ''}`);
}

function section(title) {
  console.log('\n' + '═'.repeat(70));
  console.log(title);
  console.log('═'.repeat(70));
}

async function testLogin(role, credentials, expectedRole) {
  console.log(`\nTesting ${role}...`);
  
  try {
    // Test login
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });
    
    const loginData = await loginRes.json();
    
    if (!loginRes.ok || !loginData.success) {
      fail(`${role}: Login failed`, loginData.message || 'Unknown error');
      return null;
    }
    
    if (!loginData.data || !loginData.data.accessToken) {
      fail(`${role}: No access token in response`);
      return null;
    }
    
    pass(`${role}: Login successful`);
    
    const token = loginData.data.accessToken;
    const user = loginData.data.user;
    
    // Verify user data
    if (user.role !== user.role.toUpperCase()) {
      fail(`${role}: Backend returned role "${user.role}" (not uppercase)`);
    } else {
      pass(`${role}: Backend role format correct (${user.role})`);
    }
    
    // Verify full_name exists
    if (user.full_name) {
      pass(`${role}: User has full_name property`);
    } else {
      fail(`${role}: Missing full_name property`);
    }
    
    // Test GET /api/auth/me
    const profileRes = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const profileData = await profileRes.json();
    
    if (!profileRes.ok || !profileData.success) {
      fail(`${role}: Failed to fetch profile`, profileData.message || 'Unknown error');
      return token;
    }
    
    pass(`${role}: Profile fetch successful`);
    
    // Test logout
    const logoutRes = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const logoutData = await logoutRes.json();
    
    if (!logoutRes.ok || !logoutData.success) {
      fail(`${role}: Logout failed`, logoutData.message || 'Unknown error');
    } else {
      pass(`${role}: Logout successful`);
    }
    
    return token;
    
  } catch (error) {
    fail(`${role}: Error during test`, error.message);
    return null;
  }
}

async function testInvalidCredentials() {
  console.log(`\nTesting invalid credentials...`);
  
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'citizen@mesobcenter.et',
        password: 'WrongPassword123'
      })
    });
    
    const data = await res.json();
    
    if (!res.ok && !data.success) {
      pass('Invalid credentials rejected correctly');
    } else {
      fail('Invalid credentials were accepted!');
    }
  } catch (error) {
    fail('Invalid credentials test error', error.message);
  }
}

async function testMissingCredentials() {
  console.log(`\nTesting missing credentials...`);
  
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'citizen@mesobcenter.et'
        // password missing
      })
    });
    
    const data = await res.json();
    
    if (!res.ok && !data.success) {
      pass('Missing password rejected correctly');
    } else {
      fail('Missing password was accepted!');
    }
  } catch (error) {
    fail('Missing credentials test error', error.message);
  }
}

async function testExpiredToken() {
  console.log(`\nTesting expired/invalid token...`);
  
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid_token_here'
      }
    });
    
    const data = await res.json();
    
    if (!res.ok && !data.success) {
      pass('Invalid token rejected correctly');
    } else {
      fail('Invalid token was accepted!');
    }
  } catch (error) {
    fail('Invalid token test error', error.message);
  }
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Frontend-Backend Authentication Integration Tests  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  section('PART 1: LOGIN TESTS FOR ALL ROLES');
  
  for (const [role, credentials] of Object.entries(testUsers)) {
    await testLogin(role, credentials, credentials.expectedRole);
  }
  
  section('PART 2: ERROR HANDLING TESTS');
  
  await testInvalidCredentials();
  await testMissingCredentials();
  await testExpiredToken();
  
  section('TEST SUMMARY');
  
  console.log(`\nTotal Tests: ${passCount + failCount}`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  
  if (failCount === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Frontend-backend integration successful.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Please review the failures above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ FATAL ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
});
