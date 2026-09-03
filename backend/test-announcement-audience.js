/**
 * Test Script: Announcement Audience Filtering
 * 
 * Tests PUBLIC/INTERNAL announcement visibility with backend enforcement:
 * - CITIZEN sees only PUBLIC announcements
 * - EMPLOYEE sees PUBLIC + INTERNAL announcements
 * - SUPER_ADMIN sees all announcements
 * 
 * CRITICAL: This tests that INTERNAL announcements are NEVER returned
 * to citizens via the API (backend filtering, not frontend hiding).
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test credentials from seed data
const testUsers = {
  citizen: {
    email: 'citizen@mesobcenter.et',
    password: 'Citizen@2026',
    role: 'CITIZEN'
  },
  employee: {
    email: 'employee@mesobcenter.et',
    password: 'Employee@2026',
    role: 'EMPLOYEE'
  },
  superAdmin: {
    email: 'superadmin@mesobcenter.et',
    password: 'SuperAdmin@2026',
    role: 'SUPER_ADMIN'
  }
};

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Login and get JWT token
 */
async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Login failed');
    }

    return data.token;
  } catch (error) {
    throw new Error(`Login failed for ${email}: ${error.message}`);
  }
}

/**
 * Create an announcement
 */
async function createAnnouncement(token, announcementData) {
  try {
    const response = await fetch(`${API_URL}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(announcementData)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to create announcement');
    }

    return data.data;
  } catch (error) {
    throw new Error(`Create announcement failed: ${error.message}`);
  }
}

/**
 * Publish an announcement
 */
async function publishAnnouncement(token, announcementId) {
  try {
    const response = await fetch(`${API_URL}/api/announcements/${announcementId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to publish announcement');
    }

    return data.data;
  } catch (error) {
    throw new Error(`Publish announcement failed: ${error.message}`);
  }
}

/**
 * Get announcements
 */
async function getAnnouncements(token) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/api/announcements`, {
      method: 'GET',
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch announcements');
    }

    return data.data || [];
  } catch (error) {
    throw new Error(`Get announcements failed: ${error.message}`);
  }
}

/**
 * Delete an announcement
 */
async function deleteAnnouncement(token, announcementId) {
  try {
    const response = await fetch(`${API_URL}/api/announcements/${announcementId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete announcement');
    }

    return true;
  } catch (error) {
    throw new Error(`Delete announcement failed: ${error.message}`);
  }
}

/**
 * Test helper: Assert condition
 */
function assert(condition, testName, errorMessage) {
  testResults.total++;
  if (condition) {
    testResults.passed++;
    log(`✓ ${testName}`, 'green');
    return true;
  } else {
    testResults.failed++;
    log(`✗ ${testName}`, 'red');
    log(`  ${errorMessage}`, 'red');
    testResults.errors.push({ test: testName, error: errorMessage });
    return false;
  }
}

/**
 * Main test suite
 */
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  Announcement Audience Filtering Test Suite                   ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════╝\n', 'cyan');

  let superAdminToken, citizenToken, employeeToken;
  let publicAnnouncementId, internalAnnouncementId, systemAnnouncementId;

  try {
    // ─── PHASE 1: Authentication ──────────────────────────────────────
    log('\n📋 PHASE 1: Authentication', 'blue');
    log('─'.repeat(70), 'blue');

    try {
      superAdminToken = await login(testUsers.superAdmin.email, testUsers.superAdmin.password);
      log('✓ Super Admin login successful', 'green');
    } catch (error) {
      log(`✗ Super Admin login failed: ${error.message}`, 'red');
      throw error;
    }

    try {
      citizenToken = await login(testUsers.citizen.email, testUsers.citizen.password);
      log('✓ Citizen login successful', 'green');
    } catch (error) {
      log(`✗ Citizen login failed: ${error.message}`, 'red');
      throw error;
    }

    try {
      employeeToken = await login(testUsers.employee.email, testUsers.employee.password);
      log('✓ Employee login successful', 'green');
    } catch (error) {
      log(`✗ Employee login failed: ${error.message}`, 'red');
      throw error;
    }

    // ─── PHASE 2: Create Test Announcements ──────────────────────────
    log('\n📋 PHASE 2: Create Test Announcements', 'blue');
    log('─'.repeat(70), 'blue');

    // Create PUBLIC announcement
    try {
      const publicAnn = await createAnnouncement(superAdminToken, {
        title: 'TEST: Public Announcement',
        content: 'This is a public announcement visible to everyone.',
        scope: 'PUBLIC'
      });
      publicAnnouncementId = publicAnn.id;
      await publishAnnouncement(superAdminToken, publicAnnouncementId);
      log('✓ Created and published PUBLIC announcement', 'green');
    } catch (error) {
      log(`✗ Failed to create PUBLIC announcement: ${error.message}`, 'red');
      throw error;
    }

    // Create INTERNAL announcement
    try {
      const internalAnn = await createAnnouncement(superAdminToken, {
        title: 'TEST: Internal Staff Announcement',
        content: 'This is an internal announcement for staff only.',
        scope: 'INTERNAL'
      });
      internalAnnouncementId = internalAnn.id;
      await publishAnnouncement(superAdminToken, internalAnnouncementId);
      log('✓ Created and published INTERNAL announcement', 'green');
    } catch (error) {
      log(`✗ Failed to create INTERNAL announcement: ${error.message}`, 'red');
      throw error;
    }

    // Create SYSTEM announcement
    try {
      const systemAnn = await createAnnouncement(superAdminToken, {
        title: 'TEST: System Announcement',
        content: 'This is a system announcement for admins.',
        scope: 'SYSTEM'
      });
      systemAnnouncementId = systemAnn.id;
      await publishAnnouncement(superAdminToken, systemAnnouncementId);
      log('✓ Created and published SYSTEM announcement', 'green');
    } catch (error) {
      log(`✗ Failed to create SYSTEM announcement: ${error.message}`, 'red');
      throw error;
    }

    // ─── PHASE 3: Test Citizen Access (CRITICAL) ─────────────────────
    log('\n📋 PHASE 3: Test Citizen Access (CRITICAL SECURITY TEST)', 'blue');
    log('─'.repeat(70), 'blue');

    const citizenAnnouncements = await getAnnouncements(citizenToken);
    log(`Citizen received ${citizenAnnouncements.length} announcement(s)`, 'yellow');

    // CRITICAL: Citizen must NEVER see INTERNAL announcements
    const citizenHasInternal = citizenAnnouncements.some(a => a.scope === 'INTERNAL');
    assert(
      !citizenHasInternal,
      'CRITICAL: Citizen does NOT receive INTERNAL announcements',
      `SECURITY FAILURE: Citizen received INTERNAL announcement(s)! ${JSON.stringify(citizenAnnouncements.filter(a => a.scope === 'INTERNAL'))}`
    );

    // Citizen must NOT see SYSTEM announcements
    const citizenHasSystem = citizenAnnouncements.some(a => a.scope === 'SYSTEM');
    assert(
      !citizenHasSystem,
      'Citizen does NOT receive SYSTEM announcements',
      `Citizen received SYSTEM announcement(s): ${JSON.stringify(citizenAnnouncements.filter(a => a.scope === 'SYSTEM'))}`
    );

    // Citizen MUST see PUBLIC announcements
    const citizenHasPublic = citizenAnnouncements.some(a => a.scope === 'PUBLIC' && a.id === publicAnnouncementId);
    assert(
      citizenHasPublic,
      'Citizen receives PUBLIC announcements',
      'Citizen did not receive PUBLIC announcement'
    );

    // Verify citizen sees ONLY PUBLIC scope
    const citizenScopes = [...new Set(citizenAnnouncements.map(a => a.scope))];
    assert(
      citizenScopes.length === 1 && citizenScopes[0] === 'PUBLIC',
      'Citizen sees ONLY PUBLIC scope announcements',
      `Citizen saw scopes: ${citizenScopes.join(', ')}`
    );

    // ─── PHASE 4: Test Employee Access ───────────────────────────────
    log('\n📋 PHASE 4: Test Employee Access', 'blue');
    log('─'.repeat(70), 'blue');

    const employeeAnnouncements = await getAnnouncements(employeeToken);
    log(`Employee received ${employeeAnnouncements.length} announcement(s)`, 'yellow');

    // Employee MUST see PUBLIC announcements
    const employeeHasPublic = employeeAnnouncements.some(a => a.scope === 'PUBLIC' && a.id === publicAnnouncementId);
    assert(
      employeeHasPublic,
      'Employee receives PUBLIC announcements',
      'Employee did not receive PUBLIC announcement'
    );

    // Employee MUST see INTERNAL announcements
    const employeeHasInternal = employeeAnnouncements.some(a => a.scope === 'INTERNAL' && a.id === internalAnnouncementId);
    assert(
      employeeHasInternal,
      'Employee receives INTERNAL announcements',
      'Employee did not receive INTERNAL announcement'
    );

    // Employee should NOT see SYSTEM announcements
    const employeeHasSystem = employeeAnnouncements.some(a => a.scope === 'SYSTEM');
    assert(
      !employeeHasSystem,
      'Employee does NOT receive SYSTEM announcements',
      'Employee received SYSTEM announcement(s)'
    );

    // ─── PHASE 5: Test Super Admin Access ────────────────────────────
    log('\n📋 PHASE 5: Test Super Admin Access', 'blue');
    log('─'.repeat(70), 'blue');

    const adminAnnouncements = await getAnnouncements(superAdminToken);
    log(`Super Admin received ${adminAnnouncements.length} announcement(s)`, 'yellow');

    // Admin MUST see PUBLIC announcements
    const adminHasPublic = adminAnnouncements.some(a => a.scope === 'PUBLIC' && a.id === publicAnnouncementId);
    assert(
      adminHasPublic,
      'Super Admin receives PUBLIC announcements',
      'Super Admin did not receive PUBLIC announcement'
    );

    // Admin MUST see INTERNAL announcements
    const adminHasInternal = adminAnnouncements.some(a => a.scope === 'INTERNAL' && a.id === internalAnnouncementId);
    assert(
      adminHasInternal,
      'Super Admin receives INTERNAL announcements',
      'Super Admin did not receive INTERNAL announcement'
    );

    // Admin MUST see SYSTEM announcements
    const adminHasSystem = adminAnnouncements.some(a => a.scope === 'SYSTEM' && a.id === systemAnnouncementId);
    assert(
      adminHasSystem,
      'Super Admin receives SYSTEM announcements',
      'Super Admin did not receive SYSTEM announcement'
    );

    // ─── PHASE 6: Test Unauthenticated Access ────────────────────────
    log('\n📋 PHASE 6: Test Unauthenticated Access', 'blue');
    log('─'.repeat(70), 'blue');

    const publicAnnouncements = await getAnnouncements(null);
    log(`Unauthenticated user received ${publicAnnouncements.length} announcement(s)`, 'yellow');

    // Unauthenticated MUST see PUBLIC announcements
    const unauthHasPublic = publicAnnouncements.some(a => a.scope === 'PUBLIC' && a.id === publicAnnouncementId);
    assert(
      unauthHasPublic,
      'Unauthenticated user receives PUBLIC announcements',
      'Unauthenticated user did not receive PUBLIC announcement'
    );

    // Unauthenticated must NOT see INTERNAL announcements
    const unauthHasInternal = publicAnnouncements.some(a => a.scope === 'INTERNAL');
    assert(
      !unauthHasInternal,
      'Unauthenticated user does NOT receive INTERNAL announcements',
      'Unauthenticated user received INTERNAL announcement(s)'
    );

    // Verify unauthenticated sees ONLY PUBLIC scope
    const unauthScopes = [...new Set(publicAnnouncements.map(a => a.scope))];
    assert(
      unauthScopes.length === 1 && unauthScopes[0] === 'PUBLIC',
      'Unauthenticated user sees ONLY PUBLIC scope announcements',
      `Unauthenticated user saw scopes: ${unauthScopes.join(', ')}`
    );

    // ─── PHASE 7: Cleanup ─────────────────────────────────────────────
    log('\n📋 PHASE 7: Cleanup', 'blue');
    log('─'.repeat(70), 'blue');

    try {
      await deleteAnnouncement(superAdminToken, publicAnnouncementId);
      log('✓ Deleted PUBLIC announcement', 'green');
    } catch (error) {
      log(`✗ Failed to delete PUBLIC announcement: ${error.message}`, 'yellow');
    }

    try {
      await deleteAnnouncement(superAdminToken, internalAnnouncementId);
      log('✓ Deleted INTERNAL announcement', 'green');
    } catch (error) {
      log(`✗ Failed to delete INTERNAL announcement: ${error.message}`, 'yellow');
    }

    try {
      await deleteAnnouncement(superAdminToken, systemAnnouncementId);
      log('✓ Deleted SYSTEM announcement', 'green');
    } catch (error) {
      log(`✗ Failed to delete SYSTEM announcement: ${error.message}`, 'yellow');
    }

  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    console.error(error);
  }

  // ─── FINAL REPORT ─────────────────────────────────────────────────
  log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  Test Results                                                  ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════╝\n', 'cyan');

  log(`Total Tests:  ${testResults.total}`, 'blue');
  log(`Passed:       ${testResults.passed}`, 'green');
  log(`Failed:       ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');

  if (testResults.failed > 0) {
    log('\n❌ FAILED TESTS:', 'red');
    testResults.errors.forEach(err => {
      log(`  • ${err.test}`, 'red');
      log(`    ${err.error}`, 'yellow');
    });
  }

  const success = testResults.failed === 0;
  log(`\n${success ? '✓' : '✗'} Test Suite ${success ? 'PASSED' : 'FAILED'}`, success ? 'green' : 'red');

  process.exit(success ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
