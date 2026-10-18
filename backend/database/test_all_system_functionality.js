/**
 * Complete End-to-End System Functionality Test Suite
 * Hawassa MESOB Public Service Information System
 * Tests all 14 backend modules and full workflow over HTTP against running backend.
 */

const BASE_URL = 'http://localhost:5000/api';

const CREDENTIALS = {
  SUPER_ADMIN: { email: 'superadmin@mesobcenter.et', password: 'SuperAdmin@2026', expectedRole: 'SUPER_ADMIN' },
  MESOB_MANAGER: { email: 'manager@mesobcenter.et', password: 'MesobManager@2026', expectedRole: 'MESOB_MANAGER' },
  INSTITUTION_MANAGER: { email: 'inst.manager@mesobcenter.et', password: 'InstManager@2026', expectedRole: 'INSTITUTION_MANAGER' },
  EMPLOYEE: { email: 'employee@mesobcenter.et', password: 'Employee@2026', expectedRole: 'EMPLOYEE' },
  TECHNICIAN: { email: 'tech@mesobcenter.et', password: 'tech@2026', expectedRole: 'ICT_STAFF' },
  CUSTOMER: { email: 'customer@mesobcenter.et', password: 'customer@2026', expectedRole: 'CITIZEN' }
};

let tokens = {};
let users = {};
let createdEntities = {
  applicationId: null,
  queueId: null,
  maintenanceReportId: null,
  maintenanceTaskId: null,
  feedbackId: null
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
  }
}

async function apiRequest(endpoint, options = {}, retries = 2) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {})
  };

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        ...(options.body ? { body: JSON.stringify(options.body) } : {})
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }

      if (!response.ok && attempt <= retries && response.status >= 500) {
        await new Promise(r => setTimeout(r, 1200 * attempt));
        continue;
      }

      return { status: response.status, ok: response.ok, data };
    } catch (err) {
      if (attempt <= retries) {
        await new Promise(r => setTimeout(r, 1200 * attempt));
        continue;
      }
      return { status: 0, ok: false, data: { error: err.message } };
    }
  }
}

async function runEndToEndTests() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║   HAWASSA MESOB — COMPREHENSIVE END-TO-END SYSTEM TEST SUITE       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  // Import supabase for state cleanup
  const { supabase } = await import('../src/config/supabase.js');

  // ─────────────────────────────────────────────────────────────
  // MODULE 1: System Health Check
  // ─────────────────────────────────────────────────────────────
  console.log('📡 MODULE 1: System Health Check');
  const healthRes = await apiRequest('/health');
  assert(healthRes.status === 200, 'Health check returns HTTP 200');
  assert(healthRes.data?.services?.database?.connected === true, 'Supabase database connection is verified healthy');

  // ─────────────────────────────────────────────────────────────
  // MODULE 2: Authentication & Token Management
  // ─────────────────────────────────────────────────────────────
  console.log('\n🔐 MODULE 2: Authentication & Role Verification');
  for (const [roleKey, creds] of Object.entries(CREDENTIALS)) {
    const loginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email: creds.email, password: creds.password }
    });

    assert(loginRes.status === 200 && loginRes.data?.success, `Login successful for ${roleKey} (${creds.email})`);
    const token = loginRes.data?.data?.accessToken;
    const user = loginRes.data?.data?.user;
    assert(!!token, `JWT token issued for ${roleKey}`);
    assert(user?.role === creds.expectedRole, `Role matches expected for ${roleKey} (Received: ${user?.role})`);

    tokens[roleKey] = token;
    users[roleKey] = user;

    // Verify /auth/me
    const meRes = await apiRequest('/auth/me', { token });
    const meUser = meRes.data?.data?.user || meRes.data?.data;
    assert(meRes.status === 200 && meUser?.id === user?.id, `/auth/me profile matches logged-in ${roleKey}`);

    // Verify /auth/verify-token
    const verifyRes = await apiRequest('/auth/verify-token', { method: 'POST', token });
    const verifiedUser = verifyRes.data?.data?.user || verifyRes.data?.data;
    assert(verifyRes.status === 200 && verifiedUser?.id === user?.id, `/auth/verify-token confirms active token for ${roleKey}`);
  }

  // Test Bad Password
  const badLogin = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email: CREDENTIALS.CUSTOMER.email, password: 'WrongPassword@999' }
  });
  assert(badLogin.status === 401 || !badLogin.data?.success, 'Rejection of invalid password credentials');

  // ─────────────────────────────────────────────────────────────
  // MODULE 3: Public Catalog & Global Search
  // ─────────────────────────────────────────────────────────────
  console.log('\n🏛️ MODULE 3: Institutions, Service Catalog & Global Search');
  const instRes = await apiRequest('/institutions');
  assert(instRes.status === 200 && instRes.data?.data?.length === 12, 'Public institution list returns all 12 institutions');
  const faydaInst = instRes.data?.data?.find(i => (i.name_en || '').includes('Fayda') || (i.name_en || '').includes('National ID'));
  assert(!!faydaInst, 'Fayda National ID institution found');

  const instDetailRes = await apiRequest(`/institutions/${faydaInst.id}`);
  assert(instDetailRes.status === 200 && instDetailRes.data?.data?.id === faydaInst.id, 'Institution details retrieved by ID');

  const svcRes = await apiRequest('/services');
  assert(svcRes.status === 200 && svcRes.data?.data?.length === 41, 'Public service catalog returns all 41 services');
  const faydaSvc = svcRes.data?.data?.find(s => s.institution_id === faydaInst.id && (s.title_en || s.name || '').includes('New National ID'));
  const targetSvc = faydaSvc || svcRes.data?.data?.find(s => s.institution_id === faydaInst.id);
  assert(!!targetSvc, `Found target service for Fayda: "${targetSvc?.title_en || targetSvc?.name}"`);

  const instSvcRes = await apiRequest(`/institutions/${faydaInst.id}/services`);
  assert(instSvcRes.status === 200 && Array.isArray(instSvcRes.data?.data), 'Institution-specific services retrieved');

  const searchRes = await apiRequest('/search?q=National');
  assert(searchRes.status === 200 && searchRes.data?.data, 'Global search returns matching results for query "National"');

  // ─────────────────────────────────────────────────────────────
  // MODULE 4: Citizen Application Lifecycle
  // ─────────────────────────────────────────────────────────────
  console.log('\n📝 MODULE 4: Citizen Application Lifecycle (Submit -> Review -> Complete)');
  const submitAppRes = await apiRequest('/applications', {
    method: 'POST',
    token: tokens.CUSTOMER,
    body: {
      serviceId: targetSvc.id,
      institutionId: faydaInst.id,
      applicationData: {
        full_name: users.CUSTOMER.full_name,
        phone: users.CUSTOMER.phone || '+251911223344',
        purpose: 'Comprehensive End-to-End Defense Verification'
      }
    }
  });

  assert(submitAppRes.status === 201 || (submitAppRes.status === 200 && submitAppRes.data?.success), 'Customer submits service application');
  const createdApp = submitAppRes.data?.data;
  createdEntities.applicationId = createdApp?.id;
  assert(!!createdEntities.applicationId, `Application created with ID: ${createdEntities.applicationId}`);

  // Customer views their applications
  const custAppsRes = await apiRequest('/applications', { token: tokens.CUSTOMER });
  assert(custAppsRes.status === 200 && custAppsRes.data?.data?.some(a => a.id === createdEntities.applicationId), 'Customer retrieves active application list');

  // Employee retrieves institution applications
  const empAppsRes = await apiRequest('/applications', { token: tokens.EMPLOYEE });
  assert(empAppsRes.status === 200, 'Employee views institution applications');

  // Employee updates status to UNDER_REVIEW
  const reviewRes = await apiRequest(`/applications/${createdEntities.applicationId}/status`, {
    method: 'PATCH',
    token: tokens.EMPLOYEE,
    body: {
      status: 'UNDER_REVIEW',
      notes: 'Staff officer verified documents and began processing'
    }
  });
  assert(reviewRes.status === 200 && reviewRes.data?.success, 'Employee updates application status to UNDER_REVIEW');

  // Employee completes application
  const completeRes = await apiRequest(`/applications/${createdEntities.applicationId}/status`, {
    method: 'PATCH',
    token: tokens.EMPLOYEE,
    body: {
      status: 'COMPLETED',
      notes: 'National ID successfully processed and ready for collection'
    }
  });
  assert(completeRes.status === 200 && completeRes.data?.success, 'Employee updates application status to COMPLETED');

  // ─────────────────────────────────────────────────────────────
  // MODULE 5: Queue Management System
  // ─────────────────────────────────────────────────────────────
  console.log('\n🎟️ MODULE 5: Queue Management System (Join -> Call -> Complete)');
  // Ensure no existing active token blocks the test citizen for this service
  await supabase
    .from('queue_entries')
    .delete()
    .eq('citizen_id', users.CUSTOMER.id)
    .eq('service_id', targetSvc.id)
    .in('status', ['PENDING', 'IN_PROGRESS', 'WAITING']);

  const joinQueueRes = await apiRequest('/queues/join', {
    method: 'POST',
    token: tokens.CUSTOMER,
    body: {
      institutionId: faydaInst.id,
      serviceId: targetSvc.id,
      priority: 'NORMAL'
    }
  });

  assert(joinQueueRes.status === 200 || joinQueueRes.status === 201, 'Customer joins queue and obtains token', JSON.stringify(joinQueueRes.data));
  const queueEntry = joinQueueRes.data?.data;
  createdEntities.queueId = queueEntry?.id;
  assert(!!createdEntities.queueId, `Queue token created: ${queueEntry?.queue_number || queueEntry?.token_number || createdEntities.queueId}`);

  // Check public queue status
  const queueStatusRes = await apiRequest(`/queues/${createdEntities.queueId}/status`);
  assert(queueStatusRes.status === 200, 'Queue status query succeeds');

  // Employee calls next ticket or calls this ticket
  const callRes = await apiRequest(`/queues/${createdEntities.queueId}/call-next`, {
    method: 'POST',
    token: tokens.EMPLOYEE,
    body: { counter_number: 'Desk-04' }
  });
  assert(callRes.status === 200 && callRes.data?.success, 'Employee calls ticket to service desk');

  // Employee completes queue ticket
  const completeQueueRes = await apiRequest(`/queues/${createdEntities.queueId}/status`, {
    method: 'PATCH',
    token: tokens.EMPLOYEE,
    body: {
      status: 'COMPLETED',
      notes: 'Citizen served at counter'
    }
  });
  assert(completeQueueRes.status === 200 && completeQueueRes.data?.success, 'Employee marks queue token as COMPLETED');

  // ─────────────────────────────────────────────────────────────
  // MODULE 6: Feedback & Citizen Satisfaction
  // ─────────────────────────────────────────────────────────────
  console.log('\n⭐ MODULE 6: Feedback & Citizen Satisfaction');
  const canSubmitRes = await apiRequest(`/feedback/can-submit?serviceId=${targetSvc.id}&applicationId=${createdEntities.applicationId}`, {
    token: tokens.CUSTOMER
  });
  assert(canSubmitRes.status === 200, 'Citizen can check feedback submission eligibility');

  // Clear any pre-existing feedback on this specific test application
  if (createdEntities.applicationId) {
    await supabase.from('service_feedback').delete().eq('application_id', createdEntities.applicationId);
  }

  const submitFbRes = await apiRequest('/feedback', {
    method: 'POST',
    token: tokens.CUSTOMER,
    body: {
      service_id: targetSvc.id,
      institution_id: faydaInst.id,
      application_id: createdEntities.applicationId,
      rating: 5,
      comment: 'Excellent, swift, and courteous Fayda ID processing at desk.',
      source: 'WEBSITE'
    }
  });
  assert(submitFbRes.status === 201 || (submitFbRes.status === 200 && submitFbRes.data?.success), 'Customer submits 5-star service rating and review', JSON.stringify(submitFbRes.data));
  createdEntities.feedbackId = submitFbRes.data?.data?.id;

  const myFbRes = await apiRequest('/feedback/my-feedback', { token: tokens.CUSTOMER });
  assert(myFbRes.status === 200 && Array.isArray(myFbRes.data?.data), 'Customer retrieves personal feedback history');

  const instFbRes = await apiRequest('/feedback/institution', { token: tokens.INSTITUTION_MANAGER });
  assert(instFbRes.status === 200, 'Institution Manager retrieves institution feedback');

  const instFbStatsRes = await apiRequest('/feedback/institution/stats', { token: tokens.INSTITUTION_MANAGER });
  assert(instFbStatsRes.status === 200, 'Institution Manager retrieves satisfaction ratings breakdown');

  const overallFbStatsRes = await apiRequest('/feedback/stats', { token: tokens.MESOB_MANAGER });
  assert(overallFbStatsRes.status === 200, 'Mesob Manager retrieves center-wide satisfaction analytics');

  // ─────────────────────────────────────────────────────────────
  // MODULE 7: Maintenance Lifecycle System
  // ─────────────────────────────────────────────────────────────
  console.log('\n🛠️ MODULE 7: Maintenance Workflow (Report -> Assign -> In-Progress -> Resolve -> Close)');
  const reportMaintRes = await apiRequest('/maintenance/reports', {
    method: 'POST',
    token: tokens.EMPLOYEE,
    body: {
      institutionId: faydaInst.id,
      problemType: 'Biometric Scanner Calibration',
      description: 'Fingerprint scanner at desk 4 needs recalibration and cleaning.',
      location: 'Ground Floor, Desk 04',
      officeNumber: '104',
      priority: 'HIGH',
      category: 'Hardware'
    }
  });

  assert(reportMaintRes.status === 201 || (reportMaintRes.status === 200 && reportMaintRes.data?.success), 'Employee creates maintenance report');
  const maintReport = reportMaintRes.data?.data;
  createdEntities.maintenanceReportId = maintReport?.id;
  assert(!!createdEntities.maintenanceReportId, `Maintenance report created with ID: ${createdEntities.maintenanceReportId}`);

  // Manager lists maintenance reports
  const mgrMaintRes = await apiRequest('/maintenance/reports', { token: tokens.INSTITUTION_MANAGER });
  assert(mgrMaintRes.status === 200 && Array.isArray(mgrMaintRes.data?.data), 'Institution Manager retrieves maintenance backlog');

  // Manager assigns report to technician
  const assignMaintRes = await apiRequest(`/maintenance/reports/${createdEntities.maintenanceReportId}/assign`, {
    method: 'POST',
    token: tokens.INSTITUTION_MANAGER,
    body: {
      technicianId: users.TECHNICIAN.id,
      priority: 'HIGH',
      notes: 'Please inspect the optical sensor immediately.'
    }
  });
  assert(assignMaintRes.status === 200 && assignMaintRes.data?.success, 'Institution Manager assigns maintenance report to Technician');

  // Technician views assigned tasks
  const techTasksRes = await apiRequest('/maintenance/my-tasks', { token: tokens.TECHNICIAN });
  assert(techTasksRes.status === 200 && Array.isArray(techTasksRes.data?.data), 'Technician views personal maintenance queue');
  const assignedTask = techTasksRes.data?.data?.find(t => 
    t.maintenance_reports?.id === createdEntities.maintenanceReportId || 
    t.maintenance_report_id === createdEntities.maintenanceReportId
  );
  createdEntities.maintenanceTaskId = assignedTask?.id;
  assert(!!createdEntities.maintenanceTaskId, `Technician task found with ID: ${createdEntities.maintenanceTaskId}`);

  // Technician updates status to IN_PROGRESS
  const startTaskRes = await apiRequest(`/maintenance/tasks/${createdEntities.maintenanceTaskId}/status`, {
    method: 'PATCH',
    token: tokens.TECHNICIAN,
    body: {
      status: 'IN_PROGRESS',
      notes: 'Arrived at desk 4 and running optical diagnostics.'
    }
  });
  assert(startTaskRes.status === 200 && startTaskRes.data?.success, 'Technician updates task status to IN_PROGRESS');

  // Technician resolves task
  const resolveTaskRes = await apiRequest(`/maintenance/tasks/${createdEntities.maintenanceTaskId}/resolve`, {
    method: 'PATCH',
    token: tokens.TECHNICIAN,
    body: {
      resolutionNotes: 'Sensor prism cleaned and optical calibration utility executed successfully.'
    }
  });
  assert(resolveTaskRes.status === 200 && resolveTaskRes.data?.success, 'Technician completes and resolves maintenance task');

  // Manager verifies and closes report
  const closeReportRes = await apiRequest(`/maintenance/reports/${createdEntities.maintenanceReportId}/close`, {
    method: 'PATCH',
    token: tokens.INSTITUTION_MANAGER,
    body: {
      notes: 'Manager tested scanner with test scan. Verified working properly.'
    }
  });
  assert(closeReportRes.status === 200 && closeReportRes.data?.success, 'Institution Manager verifies completion and closes maintenance report');

  // ─────────────────────────────────────────────────────────────
  // MODULE 8: Central Approvals Workflow
  // ─────────────────────────────────────────────────────────────
  console.log('\n⚖️ MODULE 8: Central Approvals Workflow');
  const approvalsQueueRes = await apiRequest('/approvals', { token: tokens.MESOB_MANAGER });
  assert(approvalsQueueRes.status === 200, 'Mesob Manager queries centralized approvals queue');

  const adminApprovalsRes = await apiRequest('/approvals', { token: tokens.SUPER_ADMIN });
  assert(adminApprovalsRes.status === 200, 'Super Admin queries centralized approvals queue');

  // ─────────────────────────────────────────────────────────────
  // MODULE 9: Announcements System
  // ─────────────────────────────────────────────────────────────
  console.log('\n📢 MODULE 9: Announcements System');
  const publicAnnounceRes = await apiRequest('/announcements');
  assert(publicAnnounceRes.status === 200 && Array.isArray(publicAnnounceRes.data?.data), 'Public announcements retrieved');

  const staffAnnounceRes = await apiRequest('/announcements', { token: tokens.EMPLOYEE });
  assert(staffAnnounceRes.status === 200, 'Staff user retrieves announcements with role context');

  // ─────────────────────────────────────────────────────────────
  // MODULE 10: Role-Based Notifications
  // ─────────────────────────────────────────────────────────────
  console.log('\n🔔 MODULE 10: Notifications & Alerts');
  const custNotifsRes = await apiRequest('/notifications', { token: tokens.CUSTOMER });
  assert(custNotifsRes.status === 200 && Array.isArray(custNotifsRes.data?.data), 'Customer retrieves role-isolated notifications');

  const custUnreadRes = await apiRequest('/notifications/unread-count', { token: tokens.CUSTOMER });
  assert(custUnreadRes.status === 200 && typeof custUnreadRes.data?.data?.unreadCount === 'number', 'Customer retrieves valid unread count');

  if (custNotifsRes.data?.data?.length > 0) {
    const notifId = custNotifsRes.data?.data[0].id;
    const markReadRes = await apiRequest(`/notifications/${notifId}/read`, {
      method: 'PATCH',
      token: tokens.CUSTOMER
    });
    assert(markReadRes.status === 200 && markReadRes.data?.success, 'Customer marks notification as read');
  }

  // ─────────────────────────────────────────────────────────────
  // MODULE 11: Role Dashboards
  // ─────────────────────────────────────────────────────────────
  console.log('\n📊 MODULE 11: Dynamic Role Dashboards (/dashboards/me)');
  for (const [roleKey, token] of Object.entries(tokens)) {
    const dashRes = await apiRequest('/dashboards/me', { token });
    assert(dashRes.status === 200 && dashRes.data?.success, `Dashboard endpoint /dashboards/me responds for ${roleKey}`);
  }

  // ─────────────────────────────────────────────────────────────
  // MODULE 12: Safe Cleanup of Test Artifacts
  // ─────────────────────────────────────────────────────────────
  console.log('\n🧹 MODULE 12: Safe Cleanup of End-to-End Test Run Artifacts');
  if (createdEntities.feedbackId) {
    await supabase.from('service_feedback').delete().eq('id', createdEntities.feedbackId);
  }
  if (createdEntities.applicationId) {
    await supabase.from('applications').delete().eq('id', createdEntities.applicationId);
    await supabase.from('notifications').delete().eq('related_entity_id', createdEntities.applicationId);
  }
  if (createdEntities.queueId) {
    await supabase.from('queue_entries').delete().eq('id', createdEntities.queueId);
    await supabase.from('notifications').delete().eq('related_entity_id', createdEntities.queueId);
  }
  if (createdEntities.maintenanceTaskId) {
    await supabase.from('maintenance_tasks').delete().eq('id', createdEntities.maintenanceTaskId);
  }
  if (createdEntities.maintenanceReportId) {
    await supabase.from('maintenance_reports').delete().eq('id', createdEntities.maintenanceReportId);
    await supabase.from('notifications').delete().eq('related_entity_id', createdEntities.maintenanceReportId);
  }
  console.log('  Cleaned temporary test artifacts: defense baseline dataset preserved.');

  console.log('\n════════════════════════════════════════════════════════════════════');
  console.log(`🏁 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (Total: ${totalTests})`);
  console.log('════════════════════════════════════════════════════════════════════\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runEndToEndTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
