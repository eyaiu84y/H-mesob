/**
 * Automated Test Suite for Central Approval Workflow & Verification
 * Hawassa MESOB: Verifies all 12 Required Tests from User Specification
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
  console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  HAWASSA MESOB — APPROVAL WORKFLOW VERIFICATION TEST SUITE${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

  try {
    // 0. Authenticate Roles
    console.log(`${colors.yellow}[Setup] Authenticating Test Roles...${colors.reset}`);
    const superAdmin = await login('superadmin@mesobcenter.et', 'SuperAdmin@2026');
    assert(superAdmin.token && superAdmin.user.role === 'SUPER_ADMIN', 'Super Admin authenticated successfully');

    const mesobManager = await login('manager@mesobcenter.et', 'MesobManager@2026');
    assert(mesobManager.token && mesobManager.user.role === 'MESOB_MANAGER', 'Mesob Manager authenticated successfully');

    const customer = await login('customer@mesobcenter.et', 'customer@2026');
    assert(customer.token, 'Customer authenticated successfully');

    const adminHeaders = { headers: { Authorization: `Bearer ${superAdmin.token}` } };
    const managerHeaders = { headers: { Authorization: `Bearer ${mesobManager.token}` } };
    const customerHeaders = { headers: { Authorization: `Bearer ${customer.token}` } };

    const timestamp = Date.now();

    // ─────────────────────────────────────────────────────────────
    // TEST 1: A newly submitted institution remains pending
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${colors.yellow}[Test 1] Newly submitted institution remains pending...${colors.reset}`);
    const instCode = `tst_${timestamp.toString().slice(-5)}`;
    const instPayload = {
      name: `Hawassa Trade Bureau ${timestamp}`,
      name_en: `Hawassa Trade Bureau ${timestamp}`,
      nameAm: 'የሐዋሳ ንግድ ቢሮ',
      name_am: 'የሐዋሳ ንግድ ቢሮ',
      code: instCode,
      description: 'Public regulatory institution overseeing commerce in Hawassa.',
      website_url: 'https://trade.hawassa.gov.et',
      officialUrl: 'https://trade.hawassa.gov.et',
      phone: '+251 46 220 1122',
      email: `trade.${timestamp}@hawassa.gov.et`,
      address: 'Piazza Sector 4, Hawassa',
      logoUrl: 'https://hawassa.gov.et/logos/trade-logo.png'
    };

    const submitInstRes = await axios.post(`${BASE_URL}/approvals/institution`, instPayload, adminHeaders);
    assert(submitInstRes.status === 201, 'Institution submitted with HTTP 201 Created');
    const createdInst = submitInstRes.data.data;
    assert(createdInst.status === 'INACTIVE', 'Institution entity status is INACTIVE upon submission', `Status: ${createdInst.status}`);
    assert(createdInst.metadata?.approval?.status === 'PENDING_APPROVAL', 'Approval metadata status is PENDING_APPROVAL');
    assert(createdInst.metadata?.approval?.submitted_by === superAdmin.user.id, 'Submitting Super Admin ID is recorded');
    assert(createdInst.metadata?.approval?.submitted_at, 'Submission timestamp is properly recorded');

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Opening its notification does NOT approve it
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${colors.yellow}[Test 2] Opening notification does NOT approve institution...${colors.reset}`);
    await new Promise(r => setTimeout(r, 500));
    const managerNotifs = await axios.get(`${BASE_URL}/notifications`, managerHeaders);
    const notifsList = managerNotifs.data.notifications || managerNotifs.data.data || [];
    const instNotif = notifsList.find(n => n.message?.includes(instPayload.name_en) || n.related_entity_id === createdInst.id);
    assert(Boolean(instNotif), 'MESOB Manager received notification for new institution submission');

    if (instNotif) {
      // Mark notification as read (simulating opening notification)
      const markReadRes = await axios.patch(`${BASE_URL}/notifications/${instNotif.id}/read`, {}, managerHeaders);
      assert(markReadRes.status === 200, 'Notification marked as read successfully');

      // Verify institution in database remains strictly INACTIVE and PENDING_APPROVAL
      const instCheckRes = await axios.get(`${BASE_URL}/institutions/${createdInst.id}`, managerHeaders);
      const checkedInst = instCheckRes.data.data;
      assert(checkedInst.status === 'INACTIVE', 'Institution remains INACTIVE after notification click/read', `Status: ${checkedInst.status}`);
      assert(checkedInst.metadata?.approval?.status === 'PENDING_APPROVAL', 'Approval status remains PENDING_APPROVAL after notification click/read');
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Manager can inspect all submitted institution details
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${colors.yellow}[Test 3] Manager can inspect all submitted institution details...${colors.reset}`);
    const queueRes = await axios.get(`${BASE_URL}/approvals?type=institution&status=PENDING_APPROVAL`, managerHeaders);
    assert(queueRes.status === 200, 'MESOB Manager retrieved approvals queue');
    const queueList = queueRes.data.data || [];
    const queuedInst = queueList.find(i => i.id === createdInst.id);
    assert(Boolean(queuedInst), 'Submitted institution found in MESOB Manager approval queue');

    if (queuedInst) {
      assert(queuedInst.name_en === instPayload.name_en, 'Complete institution English name is visible');
      assert(queuedInst.nameAm === instPayload.nameAm, 'Complete institution Amharic name is visible');
      assert(queuedInst.code === instCode, 'Complete institution code is visible');
      assert(queuedInst.details?.description === instPayload.description, 'Complete institution description is inspectable');
      assert(queuedInst.details?.email === instPayload.email, 'Contact email is inspectable');
      assert(queuedInst.details?.phone === instPayload.phone, 'Contact phone is inspectable');
      assert(queuedInst.details?.address === instPayload.address, 'Physical address is inspectable');
      assert(queuedInst.details?.websiteUrl === instPayload.website_url, 'Official website is inspectable');
      assert(queuedInst.submittingAdmin?.name === superAdmin.user.full_name || queuedInst.submittingAdmin?.name === 'Super Admin', 'Submitting Super Admin identity is inspectable');
      assert(Boolean(queuedInst.submittedAt), 'Submission timestamp is inspectable');
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Correct institution logo is visible and can be inspected
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${colors.yellow}[Test 4] Correct institution logo is visible and inspectable...${colors.reset}`);
    assert(queuedInst?.logoUrl === instPayload.logoUrl || queuedInst?.details?.logoUrl === instPayload.logoUrl, 'Institution logo URL is correctly returned and inspectable', queuedInst?.logoUrl);

    // ─────────────────────────────────────────────────────────────
    // TEST 5: Missing or broken required logo prevents approval
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${colors.yellow}[Test 5] Missing required logo prevents approval until corrected...${colors.reset}`);
    const noLogoCode = `nlg_${timestamp.toString().slice(-5)}`;
    const noLogoInstRes = await axios.post(`${BASE_URL}/approvals/institution`, {
      name: `Bureau Without Logo ${timestamp}`,
      code: noLogoCode,
      description: 'Institution submitted without logo for validation testing.',
      phone: '+251 46 220 3344',
      email: `nologo.${timestamp}@hawassa.gov.et`,
      logoUrl: null // No logo
    }, adminHeaders);
    const noLogoInst = noLogoInstRes.data.data;

    // Manager attempts to approve institution lacking a logo
    try {
      await axios.patch(`${BASE_URL}/approvals/INSTITUTION/${noLogoInst.id}/decision`, {
        decision: 'APPROVED'
      }, managerHeaders);
      assert(false, 'Approval without logo should have been blocked');
    } catch (err) {
      assert(err.response?.status === 400, 'Approval without logo rejected with HTTP 400 Bad Request', err.response?.data?.message);
      assert(err.response?.data?.message?.includes('logo is required'), 'Error message confirms logo is required before approval');
    }

    // Verify institution remains INACTIVE and PENDING_APPROVAL
    const noLogoCheck = await axios.get(`${BASE_URL}/institutions/${noLogoInst.id}`, managerHeaders);
    assert(noLogoCheck.data.data.status === 'INACTIVE', 'Institution without logo remains INACTIVE');

    // ─────────────────────────────────────────────────────────────
    // TEST 6: Corrected logo allows progression following validation rules
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${colors.yellow}[Test 6] Correcting logo follows validation rules...${colors.reset}`);
    const resubmitWithLogo = await axios.post(`${BASE_URL}/approvals/institution/${noLogoInst.id}/resubmit`, {
      name: `Bureau Without Logo ${timestamp}`,
      code: noLogoCode,
      logoUrl: 'https://hawassa.gov.et/logos/corrected-logo.png',
      resubmitNotes: 'Uploaded official verified SVG institution logo.'
    }, adminHeaders);
    assert(resubmitWithLogo.status === 200, 'Institution resubmitted with valid logo successfully');
    const updatedNoLogoInst = resubmitWithLogo.data.data;
    assert(Boolean(updatedNoLogoInst.logo_url), 'Updated institution now possesses valid logo_url', updatedNoLogoInst.logo_url);

    // ─────────────────────────────────────────────────────────────
    // TEST 8: Rejection without a reason is refused
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${colors.yellow}[Test 8] Rejection without a reason is refused...${colors.reset}`);
    try {
      await axios.patch(`${BASE_URL}/approvals/INSTITUTION/${noLogoInst.id}/decision`, {
        decision: 'REJECTED',
        reason: '' // Empty reason
      }, managerHeaders);
      assert(false, 'Rejection without reason should be refused');
    } catch (err) {
      assert(err.response?.status === 400, 'Rejection without reason refused with HTTP 400 Bad Request', err.response?.data?.message);
      assert(err.response?.data?.message?.includes('rejection reason is required'), 'Error confirms mandatory rejection reason is required');
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 9: Rejection with a reason works and notifies Super Admin
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${colors.yellow}[Test 9] Rejection with reason works and notifies Super Admin...${colors.reset}`);
    const rejectReasonText = 'Official regional seal verification document is missing from the attachment.';
    const rejectRes = await axios.patch(`${BASE_URL}/approvals/INSTITUTION/${noLogoInst.id}/decision`, {
      decision: 'REJECTED',
      reason: rejectReasonText
    }, managerHeaders);
    assert(rejectRes.status === 200, 'Institution rejected with HTTP 200 OK');
    const rejectedEntity = rejectRes.data.data;
    assert(rejectedEntity.status === 'INACTIVE', 'Rejected institution remains INACTIVE');
    assert(rejectedEntity.metadata?.approval?.status === 'REJECTED', 'Approval status recorded as REJECTED');
    assert(rejectedEntity.metadata?.approval?.rejection_reason === rejectReasonText, 'Rejection reason recorded in metadata');

    // Verify Super Admin received notification containing the rejection reason
    await new Promise(r => setTimeout(r, 500));
    const adminNotifs = await axios.get(`${BASE_URL}/notifications`, adminHeaders);
    const adminNotifsList = adminNotifs.data.notifications || adminNotifs.data.data || [];
    const rejectNotif = adminNotifsList.find(n => n.message?.includes(rejectReasonText) || (n.related_entity_id === noLogoInst.id && n.message?.includes('REJECTED')));
    assert(Boolean(rejectNotif), 'Super Admin received notification containing the rejection reason');

    // ─────────────────────────────────────────────────────────────
    // TEST 10: Unauthorized roles cannot approve through the backend
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${colors.yellow}[Test 10] Unauthorized roles cannot approve through backend...${colors.reset}`);
    // 10a. Super Admin cannot approve (anti-privilege escalation & role constraint)
    try {
      await axios.patch(`${BASE_URL}/approvals/INSTITUTION/${createdInst.id}/decision`, {
        decision: 'APPROVED'
      }, adminHeaders);
      assert(false, 'Super Admin was able to approve request');
    } catch (err) {
      assert(err.response?.status === 403, 'Super Admin approval blocked with HTTP 403 Forbidden', err.response?.data?.message);
    }

    // 10b. Customer/Citizen cannot approve
    try {
      await axios.patch(`${BASE_URL}/approvals/INSTITUTION/${createdInst.id}/decision`, {
        decision: 'APPROVED'
      }, customerHeaders);
      assert(false, 'Customer was able to approve request');
    } catch (err) {
      assert(err.response?.status === 403, 'Customer approval blocked with HTTP 403 Forbidden', err.response?.data?.message);
    }

    // 10c. Unauthenticated user cannot approve
    try {
      await axios.patch(`${BASE_URL}/approvals/INSTITUTION/${createdInst.id}/decision`, {
        decision: 'APPROVED'
      });
      assert(false, 'Unauthenticated user was able to approve request');
    } catch (err) {
      assert(err.response?.status === 401, 'Unauthenticated approval blocked with HTTP 401 Unauthorized');
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 7: Explicit approval works and records authorized manager
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${colors.yellow}[Test 7] Explicit approval works and records authorized manager...${colors.reset}`);
    const approveRes = await axios.patch(`${BASE_URL}/approvals/INSTITUTION/${createdInst.id}/decision`, {
      decision: 'APPROVED'
    }, managerHeaders);
    assert(approveRes.status === 200, 'Institution explicitly approved with HTTP 200 OK');
    const approvedInst = approveRes.data.data;
    assert(approvedInst.status === 'ACTIVE', 'Institution entity status changed to ACTIVE upon approval');
    assert(approvedInst.metadata?.approval?.status === 'APPROVED', 'Approval metadata status is APPROVED');
    assert(approvedInst.metadata?.approval?.reviewed_by === mesobManager.user.id, 'MESOB Manager user ID recorded as reviewed_by');
    assert(approvedInst.metadata?.approval?.reviewed_by_name === mesobManager.user.full_name || approvedInst.metadata?.approval?.reviewed_by_name === 'Mesob Manager', 'MESOB Manager name recorded');
    assert(Boolean(approvedInst.metadata?.approval?.reviewed_at), 'Approval decision timestamp is recorded');

    // Verify Super Admin received approval notification
    await new Promise(r => setTimeout(r, 500));
    const adminNotifs2 = await axios.get(`${BASE_URL}/notifications`, adminHeaders);
    const adminNotifsList2 = adminNotifs2.data.notifications || adminNotifs2.data.data || [];
    const approveNotif = adminNotifsList2.find(n => n.related_entity_id === createdInst.id && n.message?.includes('APPROVED'));
    assert(Boolean(approveNotif), 'Super Admin received notification confirming institution approval');

    // ─────────────────────────────────────────────────────────────
    // TEST 11: User account approval follows same explicit-decision principle
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${colors.yellow}[Test 11] User account approval follows same explicit-decision principle...${colors.reset}`);
    const userPayload = {
      name: `Institution Officer ${timestamp}`,
      fullName: `Institution Officer ${timestamp}`,
      email: `officer.${timestamp}@hawassa.gov.et`,
      phone: '+251911998877',
      role: 'INSTITUTION_MANAGER',
      institutionId: createdInst.id,
      employeeId: `EMP-${timestamp.toString().slice(-4)}`,
      nationalId: `NAT-${timestamp.toString().slice(-6)}`,
      password: 'Officer@Pass2026'
    };

    const submitUserRes = await axios.post(`${BASE_URL}/approvals/user`, userPayload, adminHeaders);
    assert(submitUserRes.status === 201, 'User submitted with HTTP 201 Created');
    const createdUser = submitUserRes.data.data;
    assert(createdUser.status === 'INACTIVE', 'User status is INACTIVE upon submission', `Status: ${createdUser.status}`);
    assert(createdUser.metadata?.approval?.status === 'PENDING_APPROVAL', 'User approval metadata is PENDING_APPROVAL');

    // Pending user login must be blocked
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: userPayload.email,
        password: userPayload.password
      });
      assert(false, 'Pending user was able to log in');
    } catch (err) {
      assert(err.response?.status === 403 || err.response?.status === 401, 'Pending user login blocked with 403/401');
    }

    // Direct activation bypass must be blocked
    try {
      await axios.patch(`${BASE_URL}/users/${createdUser.id}/status`, { status: 'ACTIVE' }, adminHeaders);
      assert(false, 'Direct user status activation should be blocked');
    } catch (err) {
      assert(err.response?.status === 400, 'Direct activation bypass blocked with 400 Bad Request');
    }

    // Explicit approval by Mesob Manager
    const approveUserRes = await axios.patch(`${BASE_URL}/approvals/USER/${createdUser.id}/decision`, {
      decision: 'APPROVED'
    }, managerHeaders);
    assert(approveUserRes.status === 200, 'User account explicitly approved with 200 OK');
    const approvedUser = approveUserRes.data.data;
    assert(approvedUser.status === 'ACTIVE', 'User status transitioned to ACTIVE');
    assert(approvedUser.metadata?.approval?.status === 'APPROVED', 'User approval metadata recorded as APPROVED');
    assert(approvedUser.metadata?.approval?.reviewed_by === mesobManager.user.id, 'MESOB Manager recorded as user reviewer');

    // Approved user can now log in
    const userLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: userPayload.email,
      password: userPayload.password
    });
    const userToken = userLoginRes.data?.data?.accessToken || userLoginRes.data?.token;
    assert(userLoginRes.status === 200 && Boolean(userToken), 'Approved user can now authenticate and receive token');

    // ─────────────────────────────────────────────────────────────
    // TEST 12: Existing unrelated workflows continue to work
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${colors.yellow}[Test 12] Existing unrelated workflows continue to work...${colors.reset}`);
    const healthRes = await axios.get(`${BASE_URL}/health`);
    assert(healthRes.status === 200, 'GET /api/health endpoint returns 200 OK');

    const servicesRes = await axios.get(`${BASE_URL}/services`);
    assert(servicesRes.status === 200, 'GET /api/services catalogue endpoint returns 200 OK');

    const announcementsRes = await axios.get(`${BASE_URL}/announcements`);
    assert(announcementsRes.status === 200, 'GET /api/announcements endpoint returns 200 OK');

    const institutionsRes = await axios.get(`${BASE_URL}/institutions`);
    assert(institutionsRes.status === 200, 'GET /api/institutions endpoint returns 200 OK');

  } catch (err) {
    console.error(`\n${colors.red}Test error encountered:${colors.reset}`, err.response?.data || err.message);
    failedTests++;
  }

  console.log(`\n${colors.bold}================================================================${colors.reset}`);
  console.log(`${colors.bold}  TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED${colors.reset}`);
  console.log(`${colors.bold}================================================================${colors.reset}\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
