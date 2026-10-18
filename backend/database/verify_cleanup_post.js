import bcrypt from 'bcrypt';
import { supabase } from '../src/config/supabase.js';
import { loginUser } from '../src/services/authService.js';
import { createApplication, updateApplicationStatus } from '../src/services/applicationService.js';
import { submitFeedback } from '../src/services/feedbackService.js';
import { createMaintenanceReport, assignMaintenanceReport, updateTaskStatus, resolveTask, closeMaintenanceReport } from '../src/services/maintenanceService.js';
import { getNotifications, getUnreadCount } from '../src/services/notificationService.js';
import { getDashboardData } from '../src/services/dashboardService.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runPostVerification() {
  console.log('=====================================================');
  console.log('🔍 POST-CLEANUP THOROUGH SYSTEM VERIFICATION SUITE');
  console.log('=====================================================\n');

  // 1. Table Counts After Cleanup
  const tables = [
    'users',
    'institutions',
    'services',
    'applications',
    'queue_entries',
    'service_feedback',
    'maintenance_reports',
    'maintenance_tasks',
    'maintenance_attachments',
    'announcements',
    'notifications',
    'failed_login_attempts',
    'audit_logs'
  ];

  console.log('📊 Step 1: Accurate Record Counts After Cleanup:');
  const postCounts = {};
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    postCounts[t] = error ? error.message : count;
  }
  console.table(postCounts);

  assert(postCounts.users === 34, 'Users count is exactly 34 (47 disposable test accounts removed)');
  assert(postCounts.institutions === 12, 'Institutions count preserved at 12');
  assert(postCounts.services === 41, 'Services count preserved at 41');
  assert(postCounts.applications === 6, 'Applications count reduced to 6 clean demonstration records');
  assert(postCounts.queue_entries === 4, 'Queue entries count reduced to 4 demonstration tickets');
  assert(postCounts.maintenance_reports === 5, 'Maintenance reports reduced to 5 lifecycle demonstration tickets');
  assert(postCounts.announcements === 3, 'Announcements polished to 3 official announcements');
  assert(postCounts.failed_login_attempts === 0, 'Failed login attempts cleared (all accounts unlocked)');

  // 2. Test Login for all 6 Designated Test Accounts
  console.log('\n🔐 Step 2: Testing Authentication & Roles for All 6 Designated Accounts:');
  const designatedAccounts = [
    { role: 'SUPER_ADMIN', email: 'superadmin@mesobcenter.et', pass: 'SuperAdmin@2026' },
    { role: 'MESOB_MANAGER', email: 'manager@mesobcenter.et', pass: 'MesobManager@2026' },
    { role: 'INSTITUTION_MANAGER', email: 'inst.manager@mesobcenter.et', pass: 'InstManager@2026' },
    { role: 'EMPLOYEE', email: 'employee@mesobcenter.et', pass: 'Employee@2026' },
    { role: 'TECHNICIAN', email: 'tech@mesobcenter.et', pass: 'tech@2026' },
    { role: 'CUSTOMER', email: 'customer@mesobcenter.et', pass: 'customer@2026' }
  ];

  const authTokens = {};
  const userObjects = {};

  for (const acc of designatedAccounts) {
    const authRes = await loginUser(acc.email, acc.pass);
    const token = authRes.data?.accessToken || authRes.data?.token;
    const success = authRes.success === true && !!token;
    assert(success, `Login successful for ${acc.role} (${acc.email})`);
    if (success) {
      authTokens[acc.role] = token;
      userObjects[acc.role] = authRes.data.user;
      assert(
        authRes.data.user.role === (acc.role === 'TECHNICIAN' ? 'ICT_STAFF' : acc.role === 'CUSTOMER' ? 'CITIZEN' : acc.role),
        `Role verified for ${acc.role}: received ${authRes.data.user.role}`
      );
    }
  }

  // 3. Foreign Key Integrity Check (No Orphaned Records)
  console.log('\n🔗 Step 3: Foreign Key & Referential Integrity Verification:');
  const { data: usersRemaining } = await supabase.from('users').select('id');
  const remainingUserIds = new Set(usersRemaining.map(u => u.id));

  const { data: allApps } = await supabase.from('applications').select('id, citizen_id, institution_id, service_id');
  const orphanedApps = (allApps || []).filter(a => a.citizen_id && !remainingUserIds.has(a.citizen_id));
  assert(orphanedApps.length === 0, 'Zero orphaned applications (all citizen_ids exist in users)');

  const { data: allMaints } = await supabase.from('maintenance_reports').select('id, reported_by, institution_id');
  const orphanedMaints = (allMaints || []).filter(m => m.reported_by && !remainingUserIds.has(m.reported_by));
  assert(orphanedMaints.length === 0, 'Zero orphaned maintenance reports (all reported_by exist in users)');

  const { data: allNotifs } = await supabase.from('notifications').select('id, recipient_id');
  const orphanedNotifs = (allNotifs || []).filter(n => n.recipient_id && !remainingUserIds.has(n.recipient_id));
  assert(orphanedNotifs.length === 0, 'Zero orphaned notifications (all recipient_ids exist in users)');

  // 4. Test Main Customer Application Workflow -> Processing -> Completion -> Feedback
  console.log('\n📝 Step 4: End-to-End Workflow Test (Application -> Review -> Complete -> Feedback):');
  const customer = userObjects.CUSTOMER;
  const employee = userObjects.EMPLOYEE;
  const { data: faydaInst } = await supabase.from('institutions').select('id').eq('code', 'fayda').single();
  const { data: faydaSvc } = await supabase.from('services').select('id').eq('code', 'FAYDA_NEW').single();

  const newAppRes = await createApplication({
    institutionId: faydaInst.id,
    serviceId: faydaSvc.id,
    applicationData: {
      applicantName: 'Test Defense Citizen',
      idType: 'NEW_REGISTRATION',
      notes: 'Testing end-to-end service delivery'
    }
  }, customer);

  assert(newAppRes.success === true, 'Customer can successfully submit a new service application');
  const createdAppId = newAppRes.data?.id;

  if (createdAppId) {
    // Employee updates status to UNDER_REVIEW
    const reviewRes = await updateApplicationStatus(createdAppId, 'UNDER_REVIEW', 'Initial document check passed', employee);
    assert(reviewRes.success === true, 'Employee can set application status to UNDER_REVIEW');

    // Employee completes application
    const completeRes = await updateApplicationStatus(createdAppId, 'COMPLETED', 'National ID card printed and ready for pickup', employee);
    assert(completeRes.success === true, 'Employee can complete application');

    // Customer submits feedback for completed service
    let feedbackCreated = false;
    try {
      const fbRes = await submitFeedback({
        customer_id: customer.id,
        citizen_id: customer.id,
        institution_id: faydaInst.id,
        service_id: faydaSvc.id,
        application_id: createdAppId,
        rating: 5,
        comment: 'Great service processing in test verification',
        source: 'WEBSITE'
      });
      feedbackCreated = !!fbRes;
    } catch (e) {
      console.error('Feedback error:', e.message);
    }
    assert(feedbackCreated === true, 'Customer can rate and submit feedback for completed application');

    // Clean up the temporary test application and feedback
    await supabase.from('service_feedback').delete().eq('application_id', createdAppId);
    await supabase.from('applications').delete().eq('id', createdAppId);
    await supabase.from('notifications').delete().eq('related_entity_id', createdAppId);
  }

  // 5. Test Maintenance Workflow (Create -> Assign -> Resolve -> Verify & Close)
  console.log('\n🛠️ Step 5: End-to-End Maintenance Workflow Test:');
  const instManager = userObjects.INSTITUTION_MANAGER;
  const technician = userObjects.TECHNICIAN;

  const newReportRes = await createMaintenanceReport({
    institutionId: faydaInst.id,
    title: 'Verification Test Printer Issue',
    description: 'Printer ribbon replacement needed',
    priority: 'NORMAL',
    problemType: 'HARDWARE'
  }, employee);

  assert(newReportRes.success === true, 'Staff can create maintenance report');
  const maintId = newReportRes.data?.id;

  if (maintId) {
    // Manager assigns technician
    const assignRes = await assignMaintenanceReport(maintId, technician.id, instManager);
    assert(assignRes.success === true, 'Institution Manager can assign maintenance report to technician');

    // Technician starts and resolves task
    const { data: task } = await supabase.from('maintenance_tasks').select('id').eq('maintenance_report_id', maintId).single();
    if (task) {
      const startRes = await updateTaskStatus(task.id, 'IN_PROGRESS', technician);
      assert(startRes.success === true, 'Technician can start task (IN_PROGRESS)');

      const resolveRes = await resolveTask(task.id, 'Replaced ribbon and tested test print successfully', technician);
      assert(resolveRes.success === true, 'Technician can resolve task (RESOLVED)');
    }

    // Manager closes report
    const closeRes = await closeMaintenanceReport(maintId, 'Manager verified and accepted repair', instManager);
    assert(closeRes.success === true, 'Institution Manager can verify and close maintenance report');

    // Clean up temporary maintenance test record
    await supabase.from('maintenance_tasks').delete().eq('maintenance_report_id', maintId);
    await supabase.from('maintenance_reports').delete().eq('id', maintId);
    await supabase.from('notifications').delete().eq('related_entity_id', maintId);
  }

  // 6. Test Notifications and Dashboard Statistics Reflect Cleaned State
  console.log('\n🔔 Step 6: Testing Notifications & Dashboard Consistency:');
  const custNotifs = await getNotifications(customer);
  assert(custNotifs.success === true, 'Customer notifications query succeeded');
  const custUnread = await getUnreadCount(customer);
  assert(typeof custUnread.data?.unreadCount === 'number', 'Customer unread count is valid');

  const adminStats = await getDashboardData(userObjects.SUPER_ADMIN);
  assert(adminStats.success === true, 'Super Admin dashboard data loads successfully');
  console.log('  Admin Stats Summary:', {
    totalUsers: adminStats.data?.stats?.totalUsers || adminStats.data?.users?.total,
    totalInstitutions: adminStats.data?.stats?.totalInstitutions || adminStats.data?.institutions?.total,
    totalApplications: adminStats.data?.stats?.totalApplications || adminStats.data?.applications?.total
  });

  console.log('\n=====================================================');
  console.log(`🏁 VERIFICATION RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (Total: ${totalTests})`);
  console.log('=====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPostVerification().catch(err => {
  console.error('Fatal post verification error:', err);
  process.exit(1);
});
