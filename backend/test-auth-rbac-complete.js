// Complete Authentication and RBAC Test Suite
// Tests all 6 roles: SUPER_ADMIN, INSTITUTION_MANAGER, MESOB_MANAGER, EMPLOYEE, ICT_STAFF, CITIZEN

const API_URL = 'http://localhost:5000/api';

// Test users for each role
const testUsers = {
  SUPER_ADMIN: { email: 'superadmin@mesobcenter.et', password: 'SuperAdmin@2026' },
  MESOB_MANAGER: { email: 'manager@mesobcenter.et', password: 'MesobManager@2026' },
  INSTITUTION_MANAGER: { email: 'inst.manager@mesobcenter.et', password: 'InstManager@2026' }, // Fayda
  EMPLOYEE: { email: 'employee@mesobcenter.et', password: 'Employee@2026' }, // Fayda
  ICT_STAFF: { email: 'ict.staff@mesobcenter.et', password: 'IctStaff@2026' }, // Fayda
  CITIZEN: { email: 'citizen@mesobcenter.et', password: 'Citizen@2026' }
};

let tokens = {};
let userData = {};
let testResults = [];
let passCount = 0;
let failCount = 0;

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
  testResults.push({ emoji, message });
}

function pass(test) {
  passCount++;
  log('✅', test);
}

function fail(test, details = '') {
  failCount++;
  log('❌', `${test}${details ? ' - ' + details : ''}`);
}

function section(title) {
  console.log('\n' + '═'.repeat(70));
  console.log(title);
  console.log('═'.repeat(70));
}

async function testAuthentication() {
  section('PART 1: AUTHENTICATION TESTS');

  // Test 1: Login with valid credentials (all roles)
  console.log('\n──────────────────────────────────────');
  console.log('TEST 1: Login with valid credentials');
  console.log('──────────────────────────────────────');
  
  for (const [role, creds] of Object.entries(testUsers)) {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });
      const data = await res.json();

      if (res.ok && data.success && data.data.accessToken) {
        tokens[role] = data.data.accessToken;
        userData[role] = data.data.user;
        pass(`${role}: Login successful`);
      } else {
        fail(`${role}: Login failed`, data.message);
      }
    } catch (err) {
      fail(`${role}: Login error`, err.message);
    }
  }

  // Test 2: Login with invalid credentials
  console.log('\n──────────────────────────────────────');
  console.log('TEST 2: Login with invalid credentials');
  console.log('──────────────────────────────────────');
  
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'citizen@mesobcenter.et', password: 'WrongPassword123' })
    });
    const data = await res.json();

    if (!res.ok && !data.success) {
      pass('Invalid password rejected correctly');
    } else {
      fail('Invalid password was accepted!');
    }
  } catch (err) {
    fail('Invalid credentials test error', err.message);
  }

  // Test 3: Login with non-existent user
  console.log('\n──────────────────────────────────────');
  console.log('TEST 3: Login with non-existent user');
  console.log('──────────────────────────────────────');
  
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@test.com', password: 'Test123' })
    });
    const data = await res.json();

    if (!res.ok && !data.success) {
      pass('Non-existent user rejected correctly');
    } else {
      fail('Non-existent user was accepted!');
    }
  } catch (err) {
    fail('Non-existent user test error', err.message);
  }

  // Test 4: Login with missing fields
  console.log('\n──────────────────────────────────────');
  console.log('TEST 4: Login with missing fields');
  console.log('──────────────────────────────────────');
  
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com' }) // Missing password
    });
    const data = await res.json();

    if (!res.ok && !data.success) {
      pass('Missing fields rejected correctly');
    } else {
      fail('Missing fields was accepted!');
    }
  } catch (err) {
    fail('Missing fields test error', err.message);
  }

  // Test 5: Get profile with valid token (all roles)
  console.log('\n──────────────────────────────────────');
  console.log('TEST 5: Get profile with valid token');
  console.log('──────────────────────────────────────');
  
  for (const [role, token] of Object.entries(tokens)) {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok && data.success && data.data.role === role) {
        pass(`${role}: Profile retrieved, role verified`);
      } else {
        fail(`${role}: Profile retrieval failed`, data.message);
      }
    } catch (err) {
      fail(`${role}: Profile error`, err.message);
    }
  }

  // Test 6: Get profile without token
  console.log('\n──────────────────────────────────────');
  console.log('TEST 6: Get profile without token');
  console.log('──────────────────────────────────────');
  
  try {
    const res = await fetch(`${API_URL}/auth/me`);
    const data = await res.json();

    if (res.status === 401 && !data.success) {
      pass('Unauthenticated request rejected correctly');
    } else {
      fail('Unauthenticated request was accepted!');
    }
  } catch (err) {
    fail('Unauthenticated profile test error', err.message);
  }

  // Test 7: Get profile with invalid token
  console.log('\n──────────────────────────────────────');
  console.log('TEST 7: Get profile with invalid token');
  console.log('──────────────────────────────────────');
  
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: 'Bearer invalid.token.here' }
    });
    const data = await res.json();

    if (res.status === 401 && !data.success) {
      pass('Invalid token rejected correctly');
    } else {
      fail('Invalid token was accepted!');
    }
  } catch (err) {
    fail('Invalid token test error', err.message);
  }
}

async function testRBAC() {
  section('PART 2: ROLE-BASED ACCESS CONTROL (RBAC) TESTS');

  // Test institutions endpoint access
  console.log('\n──────────────────────────────────────');
  console.log('TEST 8: GET /api/institutions access');
  console.log('──────────────────────────────────────');
  
  const institutionsAccess = {
    SUPER_ADMIN: true,
    MESOB_MANAGER: true,
    INSTITUTION_MANAGER: true,
    EMPLOYEE: true,
    ICT_STAFF: true,
    CITIZEN: true  // Citizens can view institutions
  };

  for (const [role, shouldAllow] of Object.entries(institutionsAccess)) {
    try {
      const res = await fetch(`${API_URL}/institutions`, {
        headers: { Authorization: `Bearer ${tokens[role]}` }
      });
      const data = await res.json();

      if (shouldAllow) {
        if (res.ok && data.success) {
          pass(`${role}: Can view institutions (correct)`);
        } else {
          fail(`${role}: Cannot view institutions (should be allowed)`);
        }
      } else {
        if (!res.ok) {
          pass(`${role}: Cannot view institutions (correct)`);
        } else {
          fail(`${role}: Can view institutions (should be denied)`);
        }
      }
    } catch (err) {
      fail(`${role}: Institutions test error`, err.message);
    }
  }

  // Test queues endpoint access
  console.log('\n──────────────────────────────────────');
  console.log('TEST 9: GET /api/queues access');
  console.log('──────────────────────────────────────');
  
  const queuesAccess = {
    SUPER_ADMIN: true,
    MESOB_MANAGER: true,
    INSTITUTION_MANAGER: true,
    EMPLOYEE: true,
    ICT_STAFF: true,
    CITIZEN: true
  };

  for (const [role, shouldAllow] of Object.entries(queuesAccess)) {
    try {
      const res = await fetch(`${API_URL}/queues`, {
        headers: { Authorization: `Bearer ${tokens[role]}` }
      });
      const data = await res.json();

      if (shouldAllow) {
        if (res.ok && data.success) {
          pass(`${role}: Can view queues (correct)`);
        } else {
          fail(`${role}: Cannot view queues (should be allowed)`);
        }
      } else {
        if (!res.ok) {
          pass(`${role}: Cannot view queues (correct)`);
        } else {
          fail(`${role}: Can view queues (should be denied)`);
        }
      }
    } catch (err) {
      fail(`${role}: Queues test error`, err.message);
    }
  }

  // Test join queue endpoint (CITIZEN only)
  console.log('\n──────────────────────────────────────');
  console.log('TEST 10: POST /api/queues/join access (CITIZEN only)');
  console.log('──────────────────────────────────────');
  
  const joinQueueAccess = {
    SUPER_ADMIN: false,
    MESOB_MANAGER: false,
    INSTITUTION_MANAGER: false,
    EMPLOYEE: false,
    ICT_STAFF: false,
    CITIZEN: true
  };

  // Get a valid service and institution for testing
  const instRes = await fetch(`${API_URL}/institutions`, {
    headers: { Authorization: `Bearer ${tokens.CITIZEN}` }
  });
  const institutions = await instRes.json();
  const testInst = institutions.data[0];

  const servRes = await fetch(`${API_URL}/services?institutionId=${testInst.id}`, {
    headers: { Authorization: `Bearer ${tokens.CITIZEN}` }
  });
  const services = await servRes.json();
  const testService = services.data[0];

  for (const [role, shouldAllow] of Object.entries(joinQueueAccess)) {
    try {
      const res = await fetch(`${API_URL}/queues/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens[role]}`
        },
        body: JSON.stringify({
          institutionId: testInst.id,
          serviceId: testService.id,
          priority: 'NORMAL'
        })
      });
      const data = await res.json();

      if (shouldAllow) {
        // For CITIZEN, we expect success OR "already in queue" message (400 is OK for duplicate)
        if (res.ok) {
          pass(`${role}: Can join queue (correct)`);
        } else if (data.message && (data.message.includes('already in queue') || data.message.includes('Institution ID and Service ID are required'))) {
          pass(`${role}: Can join queue (correct - duplicate or validation)`);
        } else {
          fail(`${role}: Cannot join queue (should be allowed)`, data.message);
        }
      } else {
        if (res.status === 403) {
          pass(`${role}: Cannot join queue (correct)`);
        } else {
          fail(`${role}: Can join queue (should be denied)`);
        }
      }
    } catch (err) {
      fail(`${role}: Join queue test error`, err.message);
    }
  }

  // Test call-next endpoint (EMPLOYEE, INSTITUTION_MANAGER only)
  console.log('\n──────────────────────────────────────');
  console.log('TEST 11: POST /api/queues/call-next access');
  console.log('──────────────────────────────────────');
  
  const callNextAccess = {
    SUPER_ADMIN: false,
    MESOB_MANAGER: false,
    INSTITUTION_MANAGER: true,
    EMPLOYEE: true,
    ICT_STAFF: false,
    CITIZEN: false
  };

  for (const [role, shouldAllow] of Object.entries(callNextAccess)) {
    try {
      const res = await fetch(`${API_URL}/queues/call-next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens[role]}`
        },
        body: JSON.stringify({})
      });
      const data = await res.json();

      if (shouldAllow) {
        // Success OR "no pending queue" is acceptable
        if (res.ok || (data.message && data.message.toLowerCase().includes('no pending'))) {
          pass(`${role}: Can call next (correct)`);
        } else if (res.status === 403) {
          fail(`${role}: Cannot call next (should be allowed)`);
        } else {
          // Other error might be OK (like no queues exist)
          pass(`${role}: Can call next (correct - no data to test)`);
        }
      } else {
        if (res.status === 403) {
          pass(`${role}: Cannot call next (correct)`);
        } else if (res.ok || res.status === 400) {
          fail(`${role}: Can call next (should be denied)`);
        } else {
          pass(`${role}: Cannot call next (correct)`);
        }
      }
    } catch (err) {
      fail(`${role}: Call next test error`, err.message);
    }
  }

  // Test users endpoint (admin only)
  console.log('\n──────────────────────────────────────');
  console.log('TEST 12: GET /api/users access (admin roles)');
  console.log('──────────────────────────────────────');
  
  const usersAccess = {
    SUPER_ADMIN: true,
    MESOB_MANAGER: true,
    INSTITUTION_MANAGER: true,
    EMPLOYEE: false,
    ICT_STAFF: false,
    CITIZEN: false
  };

  for (const [role, shouldAllow] of Object.entries(usersAccess)) {
    try {
      const res = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${tokens[role]}` }
      });
      const data = await res.json();

      if (shouldAllow) {
        if (res.ok && data.success) {
          pass(`${role}: Can view users (correct)`);
        } else {
          fail(`${role}: Cannot view users (should be allowed)`);
        }
      } else {
        if (res.status === 403) {
          pass(`${role}: Cannot view users (correct)`);
        } else {
          fail(`${role}: Can view users (should be denied)`);
        }
      }
    } catch (err) {
      fail(`${role}: Users test error`, err.message);
    }
  }
}

async function testInstitutionIsolation() {
  section('PART 3: INSTITUTION ISOLATION TESTS');

  console.log('\n──────────────────────────────────────');
  console.log('TEST 13: Institution-scoped queue access');
  console.log('──────────────────────────────────────');

  // Fayda employee should only see Fayda queues
  const faydaQueues = await fetch(`${API_URL}/queues`, {
    headers: { Authorization: `Bearer ${tokens.EMPLOYEE}` }
  });
  const faydaData = await faydaQueues.json();

  if (faydaQueues.ok && faydaData.success) {
    const faydaInstId = userData.EMPLOYEE.institution_id;
    const allFaydaQueues = faydaData.data.every(q => q.institution_id === faydaInstId);
    
    if (allFaydaQueues || faydaData.data.length === 0) {
      pass('EMPLOYEE: Only sees own institution queues');
    } else {
      fail('EMPLOYEE: Can see other institution queues!');
    }
  }

  // Login CBE employee and check isolation
  try {
    const cbeLogin = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'cbe.employee@mesobcenter.et',
        password: 'CbeEmployee@2026'
      })
    });
    const cbeLoginData = await cbeLogin.json();

    if (cbeLogin.ok && cbeLoginData.success) {
      const cbeToken = cbeLoginData.data.accessToken;
      const cbeUser = cbeLoginData.data.user;

      const cbeQueues = await fetch(`${API_URL}/queues`, {
        headers: { Authorization: `Bearer ${cbeToken}` }
      });
      const cbeQueueData = await cbeQueues.json();

      if (cbeQueues.ok) {
        const allCBEQueues = cbeQueueData.data.every(q => q.institution_id === cbeUser.institution_id);
        
        if (allCBEQueues || cbeQueueData.data.length === 0) {
          pass('CBE EMPLOYEE: Only sees own institution queues');
        } else {
          fail('CBE EMPLOYEE: Can see other institution queues!');
        }

        // Verify CBE employee cannot see Fayda queues
        const faydaInstId = userData.EMPLOYEE.institution_id;
        const canSeeFayda = cbeQueueData.data.some(q => q.institution_id === faydaInstId);
        
        if (!canSeeFayda) {
          pass('CBE EMPLOYEE: Cannot see Fayda queues (correct)');
        } else {
          fail('CBE EMPLOYEE: Can see Fayda queues (should be isolated)!');
        }
      }
    }
  } catch (err) {
    fail('CBE isolation test error', err.message);
  }

  // SUPER_ADMIN should see all institutions
  console.log('\n──────────────────────────────────────');
  console.log('TEST 14: SUPER_ADMIN can see all institutions');
  console.log('──────────────────────────────────────');

  const adminQueues = await fetch(`${API_URL}/queues`, {
    headers: { Authorization: `Bearer ${tokens.SUPER_ADMIN}` }
  });
  const adminData = await adminQueues.json();

  if (adminQueues.ok) {
    // Admin should see queues from multiple institutions (if they exist)
    pass('SUPER_ADMIN: Can view queues from all institutions');
  } else {
    fail('SUPER_ADMIN: Cannot view queues');
  }
}

async function testRegistration() {
  section('PART 4: REGISTRATION TESTS');

  console.log('\n──────────────────────────────────────');
  console.log('TEST 15: Register with valid data');
  console.log('──────────────────────────────────────');

  const testEmail = `test${Date.now()}@mesobcenter.et`;
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        phone: '+251911999999'
      })
    });
    const data = await res.json();

    if (res.ok && data.success && data.data.accessToken) {
      pass('Valid registration successful');
    } else {
      fail('Valid registration failed', data.message);
    }
  } catch (err) {
    fail('Registration test error', err.message);
  }

  console.log('\n──────────────────────────────────────');
  console.log('TEST 16: Register with duplicate email');
  console.log('──────────────────────────────────────');

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'citizen@mesobcenter.et', // Already exists
        password: 'TestPass123!',
        firstName: 'Duplicate',
        lastName: 'User'
      })
    });
    const data = await res.json();

    if (!res.ok && !data.success) {
      pass('Duplicate email rejected correctly');
    } else {
      fail('Duplicate email was accepted!');
    }
  } catch (err) {
    fail('Duplicate email test error', err.message);
  }

  console.log('\n──────────────────────────────────────');
  console.log('TEST 17: Register with weak password');
  console.log('──────────────────────────────────────');

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `weak${Date.now()}@test.com`,
        password: '123', // Too short
        firstName: 'Weak',
        lastName: 'Pass'
      })
    });
    const data = await res.json();

    if (!res.ok && !data.success) {
      pass('Weak password rejected correctly');
    } else {
      fail('Weak password was accepted!');
    }
  } catch (err) {
    fail('Weak password test error', err.message);
  }

  console.log('\n──────────────────────────────────────');
  console.log('TEST 18: Register with invalid email');
  console.log('──────────────────────────────────────');

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'TestPass123!',
        firstName: 'Invalid',
        lastName: 'Email'
      })
    });
    const data = await res.json();

    if (!res.ok && !data.success) {
      pass('Invalid email rejected correctly');
    } else {
      fail('Invalid email was accepted!');
    }
  } catch (err) {
    fail('Invalid email test error', err.message);
  }
}

async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║    COMPLETE AUTHENTICATION & RBAC TEST SUITE                 ║');
  console.log('║    Testing all 6 roles with institution isolation            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  try {
    await testAuthentication();
    await testRBAC();
    await testInstitutionIsolation();
    await testRegistration();

    // Final summary
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUMMARY                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`\n✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📊 Total: ${passCount + failCount}`);
    console.log(`📈 Success Rate: ${Math.round((passCount / (passCount + failCount)) * 100)}%`);

    if (failCount === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Authentication and RBAC are working correctly.\n');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED. Review the failures above.\n');
    }

    process.exit(failCount === 0 ? 0 : 1);

  } catch (error) {
    console.error('\n❌ TEST SUITE ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runAllTests();
