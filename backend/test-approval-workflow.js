/**
 * Automated Test Suite for Central Approval Workflow & Secure Notifications
 * Tests real API endpoints, database state, RBAC authorization, anti-privilege escalation,
 * and notifications across Super Admin and Mesob Manager.
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ${colors.green}✓ PASS:${colors.reset} ${testName}`);
    passedTests++;
  } else {
    console.error(`  ${colors.red}✗ FAIL:${colors.reset} ${testName} ${details ? `(${details})` : ''}`);
    failedTests++;
  }
}

async function login(email, password) {
  const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  const data = res.data?.data || res.data;
  return {
    token: data.accessToken || data.token,
    user: data.user
  };
}

async function runTests() {
  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  CENTRAL APPROVAL WORKFLOW & NOTIFICATIONS TEST SUITE${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  try {
    // 1. Authenticate users
    console.log(`${colors.yellow}1. Authenticating Roles...${colors.reset}`);
    const superAdmin = await login('superadmin@mesobcenter.et', 'SuperAdmin@2026');
    assert(superAdmin.token && superAdmin.user.role === 'SUPER_ADMIN', 'Super Admin authenticated successfully');

    const mesobManager = await login('manager@mesobcenter.et', 'MesobManager@2026');
    assert(mesobManager.token && mesobManager.user.role === 'MESOB_MANAGER', 'Mesob Manager authenticated successfully');

    const customer = await login('customer@mesobcenter.et', 'customer@2026');
    assert(customer.token && (customer.user.role?.toUpperCase() === 'CUSTOMER' || customer.user.role?.toLowerCase() === 'citizen'), 'Customer authenticated successfully', `Role: ${customer.user.role}`);

    const adminHeaders = { headers: { Authorization: `Bearer ${superAdmin.token}` } };
    const managerHeaders = { headers: { Authorization: `Bearer ${mesobManager.token}` } };
    const customerHeaders = { headers: { Authorization: `Bearer ${customer.token}` } };

    // 2. Test Super Admin submitting a new institution
    console.log(`\n${colors.yellow}2. Testing Institution Submission for Approval...${colors.reset}`);
    const timestamp = Date.now();
    const instCode = `TEST_${timestamp.toString().slice(-5)}`;
    const instName = `Hawassa Innovation Bureau ${timestamp}`;
    const instPayload = {
      name: instName,
      name_en: instName,
      nameAm: 'የሐዋሳ ኢኖቬሽን ቢሮ',
      name_am: 'የሐዋሳ ኢኖቬሽን ቢሮ',
      code: instCode,
      description: 'Department overseeing technology, research, and innovation in Hawassa.',
      details: 'Full details of Hawassa Innovation Bureau with all required public documentation.',
      website_url: 'https://innovation.hawassa.gov.et',
      officialUrl: 'https://innovation.hawassa.gov.et',
      phone: '+251 46 220 9999',
      email: `contact.${timestamp}@innovation.gov.et`,
      address: 'Piazza, Hawassa, Ethiopia'
    };

    const submitInstRes = await axios.post(`${BASE_URL}/approvals/institution`, instPayload, adminHeaders);
    assert(submitInstRes.status === 201, 'Institution submitted with HTTP 201 Created');
    const createdInst = submitInstRes.data.data || submitInstRes.data.institution;
    assert(createdInst?.status === 'INACTIVE', 'Institution status is INACTIVE upon submission', `Status: ${createdInst?.status}`);
    assert(createdInst?.metadata?.approval?.status === 'PENDING_APPROVAL', 'Approval metadata status is PENDING_APPROVAL');
    assert(createdInst?.metadata?.approval?.submitted_by === superAdmin.user.id, 'Submitting admin ID is recorded');
    assert(createdInst?.metadata?.approval?.submitted_at, 'Submission timestamp is recorded');

    // 3. Mesob Manager receives in-app notification
    console.log(`\n${colors.yellow}3. Verifying In-App Notification Delivery to Mesob Manager...${colors.reset}`);
    // Wait brief moment for async notification insert if any
    await new Promise(r => setTimeout(r, 600));
    const managerNotifsRes = await axios.get(`${BASE_URL}/notifications`, managerHeaders);
    const notificationsList = managerNotifsRes.data.notifications || managerNotifsRes.data.data || [];
    const instApprovalNotif = notificationsList.find(n => 
      n.title?.includes(instPayload.name_en) || n.message?.includes(instPayload.name_en) || n.message?.includes(instCode)
    );
    assert(Boolean(instApprovalNotif), 'Mesob Manager received notification for new institution submission', instApprovalNotif ? instApprovalNotif.title : 'None found');
    if (instApprovalNotif) {
      assert(instApprovalNotif.recipient_id === mesobManager.user.id, 'Notification recipient_id correctly belongs to Mesob Manager');
    }

    // 4. Mesob Manager inspects approval queue
    console.log(`\n${colors.yellow}4. Testing Approval Queue Retrieval...${colors.reset}`);
    const queueRes = await axios.get(`${BASE_URL}/approvals?type=institution&status=PENDING_APPROVAL`, managerHeaders);
    assert(queueRes.status === 200, 'Mesob Manager successfully fetched approval queue');
    const queueItems = queueRes.data.data || queueRes.data.items || [];
    const queuedInst = queueItems.find(i => i.id === createdInst.id);
    assert(Boolean(queuedInst), 'Submitted institution appears in Mesob Manager pending approvals queue');
    if (queuedInst) {
      assert(queuedInst.name_en === instPayload.name_en || queuedInst.name === instPayload.name_en || queuedInst.entityName === instPayload.name_en, 'Complete institution details are inspectable in queue');
      assert(queuedInst.code === instCode.toLowerCase() || queuedInst.code === instCode, 'Institution code matches submission');
    }

    // 5. Anti-Privilege Escalation & Security Checks
    console.log(`\n${colors.yellow}5. Verifying Anti-Privilege Escalation & Authorization Rules...${colors.reset}`);
    
    // 5a. Super Admin cannot approve/reject
    try {
      await axios.post(`${BASE_URL}/approvals/${createdInst.id}/review`, {
        decision: 'APPROVED',
        notes: 'Trying to approve as super admin'
      }, adminHeaders);
      assert(false, 'Super Admin was blocked from reviewing approvals');
    } catch (err) {
      assert(err.response?.status === 403, 'Super Admin blocked from approving request (403 Forbidden)', `Got ${err.response?.status}`);
    }

    // 5b. Customer cannot approve/reject
    try {
      await axios.post(`${BASE_URL}/approvals/${createdInst.id}/review`, {
        decision: 'APPROVED'
      }, customerHeaders);
      assert(false, 'Customer was blocked from reviewing approvals');
    } catch (err) {
      assert(err.response?.status === 403, 'Customer blocked from approving request (403 Forbidden)', `Got ${err.response?.status}`);
    }

    // 5c. Super Admin cannot directly activate a pending institution via normal update endpoint
    try {
      await axios.put(`${BASE_URL}/institutions/${createdInst.id}`, { status: 'ACTIVE' }, adminHeaders);
      assert(false, 'Super Admin was blocked from directly activating pending institution');
    } catch (err) {
      assert(err.response?.status === 400, 'Direct activation of pending institution blocked with 400', err.response?.data?.message);
    }

    // 5d. Rejection without mandatory reason must fail
    try {
      await axios.post(`${BASE_URL}/approvals/${createdInst.id}/review`, {
        decision: 'REJECTED',
        reason: '' // Empty reason
      }, managerHeaders);
      assert(false, 'Rejection without reason should be rejected');
    } catch (err) {
      assert(err.response?.status === 400, 'Rejection without reason rejected with 400 Bad Request', err.response?.data?.message);
    }

    // 6. Mesob Manager Rejection with Mandatory Reason
    console.log(`\n${colors.yellow}6. Testing Rejection Flow with Mandatory Reason...${colors.reset}`);
    const rejectReason = 'Missing certified government accreditation documents and official charter.';
    const rejectRes = await axios.post(`${BASE_URL}/approvals/${createdInst.id}/review`, {
      decision: 'REJECTED',
      reason: rejectReason
    }, managerHeaders);
    assert(rejectRes.status === 200, 'Mesob Manager rejected request with 200 OK');
    const rejectedInst = rejectRes.data.data || rejectRes.data.institution;
    assert(rejectedInst?.metadata?.approval?.status === 'REJECTED', 'Approval status recorded as REJECTED');
    assert(rejectedInst?.status === 'INACTIVE', 'Institution remains INACTIVE');
    assert(rejectedInst?.metadata?.approval?.rejection_reason === rejectReason, 'Rejection reason recorded properly');

    // 7. Verify Submitting Super Admin received rejection notification
    console.log(`\n${colors.yellow}7. Verifying Decision Notification to Submitting Admin...${colors.reset}`);
    await new Promise(r => setTimeout(r, 600));
    const adminNotifsRes = await axios.get(`${BASE_URL}/notifications`, adminHeaders);
    const adminNotifsList = adminNotifsRes.data.notifications || adminNotifsRes.data.data || [];
    const rejectNotif = adminNotifsList.find(n => 
      n.message?.includes(instPayload.name_en) && (n.message?.toLowerCase().includes('rejected') || n.title?.toLowerCase().includes('rejected'))
    );
    assert(Boolean(rejectNotif), 'Super Admin received notification with rejection decision');
    if (rejectNotif) {
      assert(rejectNotif.message?.includes(rejectReason), 'Rejection notification contains the rejection reason');
    }

    // 8. Super Admin Resubmission with Corrections
    console.log(`\n${colors.yellow}8. Testing Resubmission Flow After Corrections...${colors.reset}`);
    const resubmitRes = await axios.post(`${BASE_URL}/approvals/institution/${createdInst.id}/resubmit`, {
      name_en: instPayload.name_en,
      name_am: instPayload.name_am,
      code: instCode,
      description: 'Accreditation documents attached and validated.',
      details: instPayload.details + ' - Officially certified by the regional council.',
      officialUrl: instPayload.website_url,
      phone: instPayload.phone,
      email: instPayload.email,
      address: instPayload.address
    }, adminHeaders);
    assert(resubmitRes.status === 200, 'Institution resubmitted with 200 OK');
    const resubmitted = resubmitRes.data.data || resubmitRes.data.institution;
    assert(resubmitted?.metadata?.approval?.status === 'PENDING_APPROVAL', 'Status changed back to PENDING_APPROVAL');
    assert(resubmitted?.status === 'INACTIVE', 'Status remains INACTIVE until approved');
    assert(Array.isArray(resubmitted?.metadata?.approval?.history), 'Decision history preserved in history array');
    assert(resubmitted?.metadata?.approval?.history.length >= 1, 'Previous rejection recorded in audit history');

    // 9. Mesob Manager Approves Institution
    console.log(`\n${colors.yellow}9. Testing Approval Decision & Activation...${colors.reset}`);
    const approveRes = await axios.post(`${BASE_URL}/approvals/${createdInst.id}/review`, {
      decision: 'APPROVED',
      notes: 'All requirements verified and certified.'
    }, managerHeaders);
    assert(approveRes.status === 200, 'Mesob Manager approved request with 200 OK');
    const approvedInst = approveRes.data.data || approveRes.data.institution;
    assert(approvedInst?.status === 'ACTIVE', 'Institution activated (status = ACTIVE) upon approval');
    assert(approvedInst?.metadata?.approval?.status === 'APPROVED', 'Approval metadata status is APPROVED');
    assert(approvedInst?.metadata?.approval?.reviewed_by === mesobManager.user.id, 'Reviewer ID recorded');
    assert(approvedInst?.metadata?.approval?.reviewed_at, 'Review timestamp recorded');

    // 10. Super Admin receives approval notification
    console.log(`\n${colors.yellow}10. Verifying Approval Notification to Super Admin...${colors.reset}`);
    await new Promise(r => setTimeout(r, 600));
    const adminNotifsRes2 = await axios.get(`${BASE_URL}/notifications`, adminHeaders);
    const adminNotifsList2 = adminNotifsRes2.data.notifications || adminNotifsRes2.data.data || [];
    const approveNotif = adminNotifsList2.find(n => 
      n.message?.includes(instPayload.name_en) && (n.message?.toLowerCase().includes('approved') || n.title?.toLowerCase().includes('approved'))
    );
    assert(Boolean(approveNotif), 'Super Admin received notification with approval decision');

    // 11. User Account Approval Workflow (INSTITUTION_MANAGER)
    console.log(`\n${colors.yellow}11. Testing User Account Approval Workflow (Institution Manager)...${colors.reset}`);
    const userTimestamp = Date.now();
    const userPayload = {
      name: `Manager User ${userTimestamp}`,
      fullName: `Manager User ${userTimestamp}`,
      email: `manager.${userTimestamp}@hawassa.gov.et`,
      phone: '+251911234567',
      role: 'institution_manager',
      institutionId: createdInst.id,
      employeeId: `MGR-${userTimestamp.toString().slice(-4)}`,
      password: 'TempPassword@2026'
    };

    const submitUserRes = await axios.post(`${BASE_URL}/approvals/user`, userPayload, adminHeaders);
    assert(submitUserRes.status === 201, 'User account submitted for approval with 201 Created');
    const createdUser = submitUserRes.data.data || submitUserRes.data.user;
    assert(createdUser?.status === 'INACTIVE', 'User status is INACTIVE upon submission', `Status: ${createdUser?.status}`);
    assert(createdUser?.metadata?.approval?.status === 'PENDING_APPROVAL', 'User approval metadata is PENDING_APPROVAL');
    assert(createdUser?.metadata?.approval?.submitted_by === superAdmin.user.id, 'Submitting admin ID is recorded');

    // 12. Pending User Login Attempt Must Be Blocked
    console.log(`\n${colors.yellow}12. Verifying Pending User Login is Blocked...${colors.reset}`);
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: userPayload.email,
        password: userPayload.password
      });
      assert(false, 'Pending user was able to log in');
    } catch (err) {
      assert(err.response?.status === 403 || err.response?.status === 401, 'Pending user login blocked with 403 Forbidden', err.response?.data?.message);
    }

    // 13. Direct Activation of Pending User Must Be Blocked
    console.log(`\n${colors.yellow}13. Verifying Anti-Privilege Escalation on User Status Update...${colors.reset}`);
    try {
      await axios.patch(`${BASE_URL}/users/${createdUser.id}/status`, { status: 'ACTIVE' }, adminHeaders);
      assert(false, 'Super Admin was able to directly activate pending user');
    } catch (err) {
      assert(err.response?.status === 400, 'Direct activation of pending user blocked with 400', err.response?.data?.message);
    }

    // 14. Mesob Manager Approves User Account
    console.log(`\n${colors.yellow}14. Mesob Manager Approves User Account...${colors.reset}`);
    const approveUserRes = await axios.post(`${BASE_URL}/approvals/user/${createdUser.id}/review`, {
      decision: 'APPROVED',
      notes: 'Credentials and institutional appointment verified.'
    }, managerHeaders);
    assert(approveUserRes.status === 200, 'User account approved with 200 OK');
    const approvedUser = approveUserRes.data.data || approveUserRes.data.user;
    assert(approvedUser?.status === 'ACTIVE', 'User status is now ACTIVE');
    assert(approvedUser?.metadata?.approval?.status === 'APPROVED', 'User approval status is APPROVED');

    // 15. Approved User Can Now Log In
    console.log(`\n${colors.yellow}15. Verifying Approved User Can Now Authenticate...${colors.reset}`);
    const approvedLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: userPayload.email,
      password: userPayload.password
    });
    const approvedToken = approvedLoginRes.data?.data?.accessToken || approvedLoginRes.data?.token;
    assert(approvedLoginRes.status === 200 && approvedToken, 'Approved user successfully logged in and received token');
    const approvedUserData = approvedLoginRes.data?.data?.user || approvedLoginRes.data?.user;
    assert(approvedUserData?.role?.toUpperCase() === 'INSTITUTION_MANAGER', 'User granted approved INSTITUTION_MANAGER role');

  } catch (error) {
    console.error(`\n${colors.red}Unhandled error in test runner:${colors.reset}`, error.response?.data || error.message);
    failedTests++;
  }

  console.log(`\n${colors.bold}====================================================${colors.reset}`);
  console.log(`${colors.bold}  TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED${colors.reset}`);
  console.log(`${colors.bold}====================================================${colors.reset}\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
