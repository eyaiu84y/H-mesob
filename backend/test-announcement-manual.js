/**
 * Manual Test: Citizen Cannot Access INTERNAL Announcements
 * 
 * This script tests the CRITICAL security requirement:
 * A citizen calling GET /api/announcements must NEVER receive INTERNAL announcement records.
 * 
 * Run this script AFTER:
 * 1. Backend server is running (npm start)
 * 2. Database migrations have been applied
 * 3. Test data has been seeded
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkServerHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function login(email, password) {
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
}

async function getAnnouncements(token) {
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
}

async function runManualTest() {
  log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  MANUAL TEST: Citizen Cannot Access INTERNAL Announcements    ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════╝\n', 'cyan');

  // Check if server is running
  log('🔍 Checking backend server...', 'blue');
  const isServerRunning = await checkServerHealth();

  if (!isServerRunning) {
    log('', 'reset');
    log('❌ Backend server is not running!', 'red');
    log('', 'reset');
    log('Please start the backend server:', 'yellow');
    log('  1. cd backend', 'yellow');
    log('  2. npm start', 'yellow');
    log('', 'reset');
    log('Then run this test again:', 'yellow');
    log('  node test-announcement-manual.js', 'yellow');
    log('', 'reset');
    process.exit(1);
  }

  log('✓ Backend server is running', 'green');
  log('', 'reset');

  try {
    // Test with Citizen credentials
    log('📋 Testing Citizen Access', 'blue');
    log('─'.repeat(70), 'blue');

    log('Logging in as citizen@mesobcenter.et...', 'yellow');
    const citizenToken = await login('citizen@mesobcenter.et', 'Citizen@2026');
    log('✓ Citizen login successful', 'green');
    log('', 'reset');

    log('Fetching announcements as CITIZEN...', 'yellow');
    const citizenAnnouncements = await getAnnouncements(citizenToken);
    log(`✓ Received ${citizenAnnouncements.length} announcement(s)`, 'green');
    log('', 'reset');

    // Analyze the results
    const scopes = citizenAnnouncements.map(a => a.scope);
    const uniqueScopes = [...new Set(scopes)];
    const hasInternal = citizenAnnouncements.some(a => a.scope === 'INTERNAL');
    const hasSystem = citizenAnnouncements.some(a => a.scope === 'SYSTEM');
    const hasPublic = citizenAnnouncements.some(a => a.scope === 'PUBLIC');

    log('📊 ANALYSIS:', 'cyan');
    log('─'.repeat(70), 'cyan');
    log(`Total announcements received: ${citizenAnnouncements.length}`, 'blue');
    log(`Scopes present: ${uniqueScopes.join(', ') || 'NONE'}`, 'blue');
    log('', 'reset');

    // Display each announcement
    if (citizenAnnouncements.length > 0) {
      log('Announcements received:', 'blue');
      citizenAnnouncements.forEach((ann, idx) => {
        log(`  ${idx + 1}. [${ann.scope}] ${ann.title}`, ann.scope === 'INTERNAL' ? 'red' : 'yellow');
      });
      log('', 'reset');
    }

    // CRITICAL TEST RESULTS
    log('🔐 SECURITY TEST RESULTS:', 'cyan');
    log('─'.repeat(70), 'cyan');

    if (hasInternal) {
      log('❌ CRITICAL FAILURE: Citizen received INTERNAL announcement(s)!', 'red');
      log('', 'reset');
      log('INTERNAL announcements found:', 'red');
      citizenAnnouncements
        .filter(a => a.scope === 'INTERNAL')
        .forEach(ann => {
          log(`  • ID: ${ann.id}`, 'red');
          log(`    Title: ${ann.title}`, 'red');
          log(`    Content: ${ann.content}`, 'red');
        });
      log('', 'reset');
      log('🚨 SECURITY BREACH: Backend is NOT filtering INTERNAL announcements!', 'red');
      log('', 'reset');
      process.exit(1);
    } else {
      log('✓ PASSED: Citizen did NOT receive INTERNAL announcements', 'green');
    }

    if (hasSystem) {
      log('⚠️  WARNING: Citizen received SYSTEM announcement(s)', 'yellow');
    } else {
      log('✓ PASSED: Citizen did NOT receive SYSTEM announcements', 'green');
    }

    if (hasPublic) {
      log('✓ PASSED: Citizen received PUBLIC announcements', 'green');
    } else {
      log('⚠️  INFO: No PUBLIC announcements found', 'yellow');
    }

    if (uniqueScopes.length === 1 && uniqueScopes[0] === 'PUBLIC') {
      log('✓ PASSED: Citizen sees ONLY PUBLIC announcements', 'green');
    } else if (uniqueScopes.length === 0) {
      log('ℹ️  INFO: No announcements exist yet', 'blue');
    } else {
      log('❌ FAILED: Citizen sees non-PUBLIC scopes: ' + uniqueScopes.join(', '), 'red');
    }

    log('', 'reset');

    // Test with Employee for comparison
    log('📋 Testing Employee Access (for comparison)', 'blue');
    log('─'.repeat(70), 'blue');

    log('Logging in as employee@mesobcenter.et...', 'yellow');
    const employeeToken = await login('employee@mesobcenter.et', 'Employee@2026');
    log('✓ Employee login successful', 'green');
    log('', 'reset');

    log('Fetching announcements as EMPLOYEE...', 'yellow');
    const employeeAnnouncements = await getAnnouncements(employeeToken);
    log(`✓ Received ${employeeAnnouncements.length} announcement(s)`, 'green');
    log('', 'reset');

    const employeeScopes = [...new Set(employeeAnnouncements.map(a => a.scope))];
    const employeeHasInternal = employeeAnnouncements.some(a => a.scope === 'INTERNAL');

    log('📊 EMPLOYEE ANALYSIS:', 'cyan');
    log(`Total announcements: ${employeeAnnouncements.length}`, 'blue');
    log(`Scopes: ${employeeScopes.join(', ') || 'NONE'}`, 'blue');
    log(`Has INTERNAL: ${employeeHasInternal ? 'YES' : 'NO'}`, employeeHasInternal ? 'green' : 'yellow');
    log('', 'reset');

    // Final summary
    log('╔════════════════════════════════════════════════════════════════╗', 'cyan');
    log('║  SUMMARY                                                       ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════════╝', 'cyan');
    log('', 'reset');

    if (!hasInternal) {
      log('✅ SUCCESS: Backend filtering is working correctly!', 'green');
      log('', 'reset');
      log('   • Citizens CANNOT access INTERNAL announcements', 'green');
      log('   • Backend enforces security at the API level', 'green');
      log('   • Announcement visibility control is properly implemented', 'green');
      log('', 'reset');
      process.exit(0);
    } else {
      log('❌ FAILURE: Backend filtering is NOT working!', 'red');
      log('', 'reset');
      log('   • Citizens CAN access INTERNAL announcements', 'red');
      log('   • Security vulnerability exists', 'red');
      log('   • Fix required in announcementService.js', 'red');
      log('', 'reset');
      process.exit(1);
    }

  } catch (error) {
    log('', 'reset');
    log(`❌ Test error: ${error.message}`, 'red');
    console.error(error);
    log('', 'reset');
    process.exit(1);
  }
}

// Run the test
runManualTest();
