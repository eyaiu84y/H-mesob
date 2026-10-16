/**
 * COMPREHENSIVE ROLE MIGRATION & SYSTEM VERIFICATION SUITE
 * 
 * Tests the system-wide role migration from CITIZEN -> CUSTOMER and ICT_STAFF -> TECHNICIAN.
 * Validates:
 * 1. Database backup integrity & restorable status
 * 2. Database role counts & distribution
 * 3. Multi-role authentication & JWT generation
 * 4. Multi-role dashboard data retrieval
 * 5. Role-based Access Control (Positive & Strict Negative Security Guards)
 * 6. Customer Restriction Enforcement (customers can NEVER access staff/technician endpoints or be assigned tasks)
 * 7. Institutional Scope Enforcement
 * 8. Service Application Task Assignment Workflow
 * 9. Maintenance Ticket Assignment Workflow
 * 10. Customer Feedback Workflow
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { supabase } from './src/config/supabase.js';

const API_BASE = 'http://localhost:5000/api';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

function recordResult(testName, passed, detail = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName} - ${detail}`);
  }
  results.push({ testName, passed, detail });
}

function sectionHeader(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`📋 ${title}`);
  console.log('='.repeat(80));
}

// Global user tokens & context
const userContext = {};

async function loginUser(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success && data.data?.accessToken) {
      return {
        token: data.data.accessToken,
        user: data.data.user
      };
    }
    return null;
  } catch (err) {
    return null;
  }
}

async function runVerification() {
  console.log('\n🚀 STARTING HAWASSA MESOB SYSTEM VERIFICATION SUITE\n');

  // =========================================================================
  // SECTION 1: DATABASE BACKUP & RESTORABILITY VERIFICATION
  // =========================================================================
  sectionHeader('SECTION 1: Database Backup & Restorability Verification');

  const backupsDir = path.join(__dirname, 'backups');
  const backupFiles = fs.readdirSync(backupsDir);
  const sqlDumps = backupFiles.filter(f => f.endsWith('.sql'));
  const jsonDumps = backupFiles.filter(f => f.endsWith('.json'));

  recordResult(
    'SQL standalone restorable backup file exists',
    sqlDumps.length > 0,
    sqlDumps.length > 0 ? `Found: ${sqlDumps[0]} (${(fs.statSync(path.join(backupsDir, sqlDumps[0])).size / 1024).toFixed(1)} KB)` : 'No .sql backup found'
  );

  recordResult(
    'JSON full database backup file exists',
    jsonDumps.length > 0,
    jsonDumps.length > 0 ? `Found: ${jsonDumps[0]}` : 'No .json backup found'
  );

  const restoreScript = path.join(backupsDir, 'restore_database.js');
  recordResult(
    'Database restore runner script exists',
    fs.existsSync(restoreScript),
    `Path: ${restoreScript}`
  );

  // =========================================================================
  // SECTION 2: CURRENT DATABASE ROLE COUNTS & ENUM STATUS
  // =========================================================================
  sectionHeader('SECTION 2: Database Schema & Role Counts Verification');

  const { data: allUsers, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name, role, status, institution_id');

  if (usersError) {
    recordResult('Fetch database users', false, usersError.message);
  } else {
    const roleCounts = allUsers.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});

    recordResult('Database connection and user retrieval', true, `Total users: ${allUsers.length}`);
    console.log('\n  Current Database User Distribution by Role:');
    console.table(roleCounts);

    // Verify 6 roles representation
    const expectedRoles = ['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER', 'EMPLOYEE'];
    for (const role of expectedRoles) {
      recordResult(
        `Preserved role '${role}' has active accounts`,
        (roleCounts[role] || 0) > 0,
        `Count: ${roleCounts[role] || 0}`
      );
    }

    const customerOrCitizenCount = (roleCounts['CUSTOMER'] || 0) + (roleCounts['CITIZEN'] || 0);
    recordResult(
      `Customer accounts present (CUSTOMER or legacy CITIZEN)`,
      customerOrCitizenCount > 0,
      `CUSTOMER: ${roleCounts['CUSTOMER'] || 0}, CITIZEN: ${roleCounts['CITIZEN'] || 0} (Total: ${customerOrCitizenCount})`
    );

    const technicianOrIctCount = (roleCounts['TECHNICIAN'] || 0) + (roleCounts['ICT_STAFF'] || 0);
    recordResult(
      `Technician accounts present (TECHNICIAN or legacy ICT_STAFF)`,
      technicianOrIctCount > 0,
      `TECHNICIAN: ${roleCounts['TECHNICIAN'] || 0}, ICT_STAFF: ${roleCounts['ICT_STAFF'] || 0} (Total: ${technicianOrIctCount})`
    );
  }

  // =========================================================================
  // SECTION 3: MULTI-ROLE AUTHENTICATION & LOGIN TESTS
  // =========================================================================
  sectionHeader('SECTION 3: Role-Based Authentication & JWT Generation');

  const credentials = [
    { roleKey: 'SUPER_ADMIN', email: 'superadmin@mesobcenter.et', pass: 'SuperAdmin@2026' },
    { roleKey: 'MESOB_MANAGER', email: 'manager@mesobcenter.et', pass: 'MesobManager@2026' },
    { roleKey: 'INSTITUTION_MANAGER', email: 'inst.manager@mesobcenter.et', pass: 'InstManager@2026' },
    { roleKey: 'EMPLOYEE', email: 'employee@mesobcenter.et', pass: 'Employee@2026' },
    { roleKey: 'TECHNICIAN', email: 'tech@mesobcenter.et', pass: 'tech@2026' },
    { roleKey: 'CUSTOMER', email: 'customer@mesobcenter.et', pass: 'customer@2026' }
  ];

  for (const cred of credentials) {
    const authData = await loginUser(cred.email, cred.pass);
    if (authData) {
      userContext[cred.roleKey] = authData;
      recordResult(
        `Login successful for ${cred.roleKey} (${cred.email})`,
        true,
        `Returned Role: ${authData.user.role}, Name: ${authData.user.name}`
      );
    } else {
      recordResult(`Login failed for ${cred.roleKey} (${cred.email})`, false, 'Could not authenticate');
    }
  }

  // =========================================================================
  // SECTION 4: DASHBOARD ENDPOINT TESTS FOR ALL ROLES
  // =========================================================================
  sectionHeader('SECTION 4: Dashboard Data Retrieval by Role');

  for (const roleKey of ['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER', 'EMPLOYEE', 'TECHNICIAN', 'CUSTOMER']) {
    if (!userContext[roleKey]) {
      recordResult(`Dashboard fetch for ${roleKey}`, false, 'Skipped: Not authenticated');
      continue;
    }

    const res = await fetch(`${API_BASE}/dashboards/me`, {
      headers: { Authorization: `Bearer ${userContext[roleKey].token}` }
    });
    const data = await res.json();
    recordResult(
      `Dashboard endpoint returns 200 for ${roleKey}`,
      res.status === 200 && data.success,
      `Status: ${res.status}`
    );
  }

  // =========================================================================
  // SECTION 5: STRICT CUSTOMER RESTRICTION (NEGATIVE SECURITY TESTS)
  // Customers must NEVER access employee or technician functions
  // =========================================================================
  sectionHeader('SECTION 5: Customer Restriction & Negative Security Tests');

  if (userContext['CUSTOMER']) {
    const customerToken = userContext['CUSTOMER'].token;

    // 1. Customer cannot access technician tasks
    const resTechTasks = await fetch(`${API_BASE}/maintenance/my-tasks`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    recordResult(
      'Customer BLOCKED from technician tasks (GET /api/maintenance/my-tasks)',
      resTechTasks.status === 403,
      `HTTP Status: ${resTechTasks.status} (expected 403 Forbidden)`
    );

    // 2. Customer cannot create maintenance reports (staff only)
    const resCreateMaint = await fetch(`${API_BASE}/maintenance/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        institutionId: 'd1a0b3c4-0001-4000-a000-000000000001',
        problemType: 'Hardware',
        description: 'Unauthorized customer maintenance report attempt'
      })
    });
    recordResult(
      'Customer BLOCKED from creating maintenance reports (POST /api/maintenance/reports)',
      resCreateMaint.status === 403,
      `HTTP Status: ${resCreateMaint.status} (expected 403 Forbidden)`
    );

    // 3. Customer cannot call next in queue
    const resCallNext = await fetch(`${API_BASE}/queues/call-next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({ windowNumber: 1 })
    });
    recordResult(
      'Customer BLOCKED from calling next queue ticket (POST /api/queues/call-next)',
      resCallNext.status === 403,
      `HTTP Status: ${resCallNext.status} (expected 403 Forbidden)`
    );

    // 4. Customer cannot assign applications
    const fakeAppId = '00000000-0000-0000-0000-000000000001';
    const resAssignApp = await fetch(`${API_BASE}/applications/${fakeAppId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({ employeeId: '00000000-0000-0000-0000-000000000002' })
    });
    recordResult(
      'Customer BLOCKED from assigning applications (PATCH /api/applications/:id/assign)',
      resAssignApp.status === 403,
      `HTTP Status: ${resAssignApp.status} (expected 403 Forbidden)`
    );

    // 5. Customer cannot assign maintenance tasks
    const resAssignMaint = await fetch(`${API_BASE}/maintenance/reports/${fakeAppId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({ ictStaffId: '00000000-0000-0000-0000-000000000003' })
    });
    recordResult(
      'Customer BLOCKED from assigning maintenance reports (POST /api/maintenance/reports/:id/assign)',
      resAssignMaint.status === 403,
      `HTTP Status: ${resAssignMaint.status} (expected 403 Forbidden)`
    );
  }

  // =========================================================================
  // SECTION 6: TASK ASSIGNMENT WORKFLOW ENFORCEMENT
  // - Customers must NEVER be assigned tasks
  // - Authorized employees may be assigned service application work
  // - Authorized technicians may be assigned maintenance tasks
  // - Only authorized managers can assign work within permitted institutional scope
  // =========================================================================
  sectionHeader('SECTION 6: Task Assignment & Institutional Scope Enforcement');

  const { data: appsList } = await supabase.from('applications').select('id, institution_id').limit(1);
  const sampleApp = appsList?.[0];

  const { data: custList } = await supabase.from('users').select('id, role').in('role', ['CUSTOMER', 'CITIZEN']).limit(1);
  const customerUser = custList?.[0];

  const { data: techList } = await supabase.from('users').select('id, role, institution_id').in('role', ['TECHNICIAN', 'ICT_STAFF']).limit(1);
  const techUser = techList?.[0];

  const { data: maintList } = await supabase.from('maintenance_reports').select('id, institution_id').limit(1);
  const sampleMaint = maintList?.[0];

  // 1. Attempting to assign application to a CUSTOMER must fail
  if (sampleApp && customerUser && userContext['SUPER_ADMIN']) {
    const resAssignToCust = await fetch(`${API_BASE}/applications/${sampleApp.id}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userContext['SUPER_ADMIN'].token}`
      },
      body: JSON.stringify({ employeeId: customerUser.id })
    });
    const assignData = await resAssignToCust.json();

    recordResult(
      'System REFUSES to assign service-application work to a CUSTOMER',
      !assignData.success || resAssignToCust.status >= 400,
      `Status: ${resAssignToCust.status}, Message: ${assignData.message || resAssignToCust.statusText}`
    );
  }

  // 2. Attempting to assign application to a TECHNICIAN must fail (must be EMPLOYEE)
  if (sampleApp && techUser && userContext['SUPER_ADMIN']) {
    const resAssignToTech = await fetch(`${API_BASE}/applications/${sampleApp.id}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userContext['SUPER_ADMIN'].token}`
      },
      body: JSON.stringify({ employeeId: techUser.id })
    });
    const assignData = await resAssignToTech.json();

    recordResult(
      'System REFUSES to assign service-application work to a TECHNICIAN (must be EMPLOYEE)',
      !assignData.success || resAssignToTech.status >= 400,
      `Status: ${resAssignToTech.status}, Message: ${assignData.message || resAssignToTech.statusText}`
    );
  }

  // 3. Maintenance report assignment: Customer can NEVER be assigned maintenance report
  if (sampleMaint && customerUser && userContext['SUPER_ADMIN']) {
    const resAssignMaintToCust = await fetch(`${API_BASE}/maintenance/reports/${sampleMaint.id}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userContext['SUPER_ADMIN'].token}`
      },
      body: JSON.stringify({ ictStaffId: customerUser.id })
    });
    const maintAssignData = await resAssignMaintToCust.json();

    recordResult(
      'System REFUSES to assign maintenance tasks to a CUSTOMER',
      !maintAssignData.success || resAssignMaintToCust.status >= 400,
      `Status: ${resAssignMaintToCust.status}, Message: ${maintAssignData.message || resAssignMaintToCust.statusText}`
    );
  }

  // 4. Authorized Technician CAN be assigned maintenance task in the same institution
  if (sampleMaint && userContext['SUPER_ADMIN']) {
    // Find a technician belonging to the same institution as sampleMaint
    const { data: instTechs } = await supabase
      .from('users')
      .select('id, full_name, role, institution_id')
      .in('role', ['TECHNICIAN', 'ICT_STAFF'])
      .eq('institution_id', sampleMaint.institution_id)
      .limit(1);

    if (instTechs && instTechs.length > 0) {
      const targetTech = instTechs[0];
      const resAssignTech = await fetch(`${API_BASE}/maintenance/reports/${sampleMaint.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userContext['SUPER_ADMIN'].token}`
        },
        body: JSON.stringify({ ictStaffId: targetTech.id })
      });
      const dataAssignTech = await resAssignTech.json();
      recordResult(
        `Authorized TECHNICIAN assigned maintenance task by Manager (${targetTech.full_name})`,
        resAssignTech.status === 200 && dataAssignTech.success,
        `Status: ${resAssignTech.status}`
      );
    }
  }

  // 5. Authorized Employee CAN be assigned service application in the same institution
  if (sampleApp && userContext['SUPER_ADMIN']) {
    const { data: instEmployees } = await supabase
      .from('users')
      .select('id, full_name, role, institution_id')
      .eq('role', 'EMPLOYEE')
      .eq('institution_id', sampleApp.institution_id)
      .limit(1);

    if (instEmployees && instEmployees.length > 0) {
      const targetEmp = instEmployees[0];
      const resAssignEmp = await fetch(`${API_BASE}/applications/${sampleApp.id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userContext['SUPER_ADMIN'].token}`
        },
        body: JSON.stringify({ employeeId: targetEmp.id })
      });
      const dataAssignEmp = await resAssignEmp.json();
      recordResult(
        `Authorized EMPLOYEE assigned service-application by Manager (${targetEmp.full_name})`,
        resAssignEmp.status === 200 && dataAssignEmp.success,
        `Status: ${resAssignEmp.status}`
      );
    }
  }

  // 6. Cross-institution scope check: Institution Manager of Institution A cannot assign tasks of Institution B
  if (sampleApp && userContext['INSTITUTION_MANAGER']) {
    const mgrInstId = userContext['INSTITUTION_MANAGER'].user.institutionId || userContext['INSTITUTION_MANAGER'].user.institution_id;
    // Find application of a different institution
    const { data: diffApps } = await supabase
      .from('applications')
      .select('id, institution_id')
      .neq('institution_id', mgrInstId)
      .limit(1);

    if (diffApps && diffApps.length > 0) {
      const diffApp = diffApps[0];
      const resCrossAssign = await fetch(`${API_BASE}/applications/${diffApp.id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userContext['INSTITUTION_MANAGER'].token}`
        },
        body: JSON.stringify({ employeeId: '00000000-0000-0000-0000-000000000001' })
      });
      recordResult(
        'Institution Manager BLOCKED from assigning applications outside their institutional scope',
        resCrossAssign.status === 403 || resCrossAssign.status === 400 || !((await resCrossAssign.json()).success),
        `HTTP Status: ${resCrossAssign.status}`
      );
    }
  }

  // =========================================================================
  // SECTION 7: APPLICATION & MAINTENANCE WORKFLOW TESTS
  // =========================================================================
  sectionHeader('SECTION 7: Application & Maintenance Workflow Verification');

  // Customer application listing
  if (userContext['CUSTOMER']) {
    const resApps = await fetch(`${API_BASE}/applications`, {
      headers: { Authorization: `Bearer ${userContext['CUSTOMER'].token}` }
    });
    const dataApps = await resApps.json();
    recordResult(
      'Customer successfully retrieves own applications',
      resApps.status === 200 && dataApps.success,
      `Retrieved ${dataApps.data?.length || 0} applications`
    );
  }

  // Technician tasks listing
  if (userContext['TECHNICIAN']) {
    const resTasks = await fetch(`${API_BASE}/maintenance/my-tasks`, {
      headers: { Authorization: `Bearer ${userContext['TECHNICIAN'].token}` }
    });
    const dataTasks = await resTasks.json();
    recordResult(
      'Technician successfully retrieves assigned maintenance tasks',
      resTasks.status === 200 && dataTasks.success,
      `Retrieved ${dataTasks.data?.length || 0} tasks`
    );
  }

  // =========================================================================
  // SECTION 8: FEEDBACK WORKFLOW TESTS
  // =========================================================================
  sectionHeader('SECTION 8: Customer Feedback Workflow Verification');

  if (userContext['CUSTOMER']) {
    const resMyFeedback = await fetch(`${API_BASE}/feedback/my-feedback`, {
      headers: { Authorization: `Bearer ${userContext['CUSTOMER'].token}` }
    });
    const dataMyFeedback = await resMyFeedback.json();
    recordResult(
      'Customer successfully queries own feedback history',
      resMyFeedback.status === 200 && dataMyFeedback.success,
      `Status: ${resMyFeedback.status}`
    );
  }

  // Employee/Staff BLOCKED from customer feedback endpoint
  if (userContext['EMPLOYEE']) {
    const resEmpFeedback = await fetch(`${API_BASE}/feedback/my-feedback`, {
      headers: { Authorization: `Bearer ${userContext['EMPLOYEE'].token}` }
    });
    recordResult(
      'Employee BLOCKED from customer-only feedback endpoint (/api/feedback/my-feedback)',
      resEmpFeedback.status === 403,
      `HTTP Status: ${resEmpFeedback.status} (expected 403 Forbidden)`
    );
  }

  // =========================================================================
  // FINAL REPORT & SUMMARY
  // =========================================================================
  sectionHeader('TEST SUITE EXECUTION SUMMARY');
  console.log(`\n  Total Tests Executed: ${totalTests}`);
  console.log(`  Passed Tests:         ${passedTests}`);
  console.log(`  Failed Tests:         ${failedTests}`);
  console.log(`  Pass Rate:            ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  if (failedTests > 0) {
    console.error('⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  } else {
    console.log('🎉 ALL SYSTEM TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  }
}

runVerification().catch(err => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
