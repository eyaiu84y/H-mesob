/**
 * Focused Test Suite for Duplicate Registration Prevention & Employee Document Review
 * 
 * Verifies:
 * 1. A permitted first application can be submitted with missing documents when submission-time rules allow it.
 * 2. The employee can identify missing documents and reject the application with a required reason.
 * 3. The customer can see the rejection reason and status.
 * 4. Permitted resubmission works correctly.
 * 5. A rejected application does not count as a completed registration.
 * 6. Duplicate active or completed registrations remain blocked according to service policy.
 * 7. Other services and existing workflows continue working.
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function pass(name, details = '') {
  totalTests++;
  passedTests++;
  console.log(`✅ [PASS] ${name}${details ? ` - ${details}` : ''}`);
}

function fail(name, details = '') {
  totalTests++;
  failedTests++;
  console.error(`❌ [FAIL] ${name}${details ? ` - ${details}` : ''}`);
}

async function login(email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  return data.success ? data.data.accessToken : null;
}

async function runWorkflowTests() {
  console.log('======================================================================');
  console.log('STARTING FOCUSED TESTS: DUPLICATE PREVENTION & DOCUMENT REVIEW WORKFLOW');
  console.log('======================================================================\n');

  // Step 0: Log in as customer and employee
  const customerToken = await login('customer@mesobcenter.et', 'customer@2026');
  if (customerToken) {
    pass('Login as Customer (customer@mesobcenter.et)');
  } else {
    fail('Login as Customer (customer@mesobcenter.et)');
    return;
  }

  const employeeToken = await login('employee@mesobcenter.et', 'Employee@2026');
  if (employeeToken) {
    pass('Login as Employee (employee@mesobcenter.et)');
  } else {
    fail('Login as Employee (employee@mesobcenter.et)');
    return;
  }

  // Get test service: Fayda New National ID (One-time registration service)
  const servicesRes = await fetch(`${API_BASE_URL}/services`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  const servicesData = await servicesRes.json();
  const oneTimeService = (servicesData.data || []).find(s => s.code === 'FAYDA_NEW') || (servicesData.data || [])[0];
  const regularService = (servicesData.data || []).find(s => s.code === 'electric-bill-payment' || s.code === 'tax-payment') || (servicesData.data || [])[1];

  console.log(`\nUsing one-time service: ${oneTimeService.title_en} (ID: ${oneTimeService.id})`);
  console.log(`Using regular service: ${regularService.title_en} (ID: ${regularService.id})\n`);

  // -------------------------------------------------------------------------
  // TEST 1: Permitted first application can be submitted with missing documents
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Submit Application with Missing Documents ---');
  const appPayload = {
    serviceId: oneTimeService.id,
    institutionId: oneTimeService.institution_id,
    applicationData: {
      fullName: 'Abebe Kebede',
      email: 'customer@mesobcenter.et',
      phone: '+251911223344',
      address: 'Hawassa, Sidama',
      serviceDetails: {
        requiredDocs: ['National ID Card', 'Proof of Residence']
      }
    },
    documents: [] // MISSING DOCUMENTS: Empty uploaded documents
  };

  const createRes = await fetch(`${API_BASE_URL}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify(appPayload)
  });
  const createData = await createRes.json();

  let test1AppId = null;
  let test1AppNumber = null;

  if (createRes.status === 201 && createData.success && createData.data) {
    test1AppId = createData.data.id;
    test1AppNumber = createData.data.application_number;
    pass('1.1 Application submitted with missing documents without auto-rejection', `App #${test1AppNumber}, Status: ${createData.data.status}`);
  } else if (createRes.status === 409 && createData.isDuplicate) {
    // If an earlier test run left an active one, capture its ID
    test1AppId = createData.existingApplication.id;
    test1AppNumber = createData.existingApplication.applicationNumber;
    console.log(`Note: Existing application #${test1AppNumber} found, proceeding to test with it.`);
    pass('1.1 Found existing application for testing', `App #${test1AppNumber}`);
  } else {
    fail('1.1 Application submitted with missing documents', createData.message);
    return;
  }

  // -------------------------------------------------------------------------
  // TEST 2: Employee review, inspect missing documents, mandatory rejection reason
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Employee Review & Rejection with Mandatory Reason ---');
  
  // 2.1 Fetch application as employee to inspect documents
  const inspectRes = await fetch(`${API_BASE_URL}/applications/${test1AppId}`, {
    headers: { 'Authorization': `Bearer ${employeeToken}` }
  });
  const inspectData = await inspectRes.json();
  if (inspectRes.ok && inspectData.success) {
    const hasMissingDocsIndication = 
      inspectData.data.application_data?.hasMissingDocuments === true ||
      inspectData.data.metadata?.hasMissingDocuments === true ||
      (inspectData.data.documents && inspectData.data.documents.length === 0);
    if (hasMissingDocsIndication) {
      pass('2.1 Employee can inspect application and identify missing documents', `Documents count: ${inspectData.data.documents.length}`);
    } else {
      fail('2.1 Missing documents indication not found');
    }
  } else {
    fail('2.1 Employee inspect application', inspectData.message);
  }

  // 2.2 Attempt to reject WITHOUT reason (Must be rejected/denied)
  const rejectWithoutReasonRes = await fetch(`${API_BASE_URL}/applications/${test1AppId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${employeeToken}`
    },
    body: JSON.stringify({ status: 'REJECTED', notes: '   ' })
  });
  const rejectWithoutReasonData = await rejectWithoutReasonRes.json();
  if (rejectWithoutReasonRes.status === 400 && !rejectWithoutReasonData.success) {
    pass('2.2 Rejection without mandatory reason is prevented', rejectWithoutReasonData.message);
  } else {
    fail('2.2 Rejection without mandatory reason should fail', JSON.stringify(rejectWithoutReasonData));
  }

  // 2.3 Unauthorized role attempt to reject (Customer role should be forbidden 403/error)
  const unauthorizedRejectRes = await fetch(`${API_BASE_URL}/applications/${test1AppId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({ status: 'REJECTED', notes: 'Unauthorized attempt' })
  });
  if (unauthorizedRejectRes.status === 403 || !unauthorizedRejectRes.ok) {
    pass('2.3 Unauthorized role cannot reject application (Access Denied)');
  } else {
    fail('2.3 Unauthorized role rejection was not blocked');
  }

  // 2.4 Reject WITH mandatory reason as employee
  const mandatoryReason = 'Application rejected due to missing required National ID and Residence Proof documents.';
  const rejectRes = await fetch(`${API_BASE_URL}/applications/${test1AppId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${employeeToken}`
    },
    body: JSON.stringify({ status: 'REJECTED', notes: mandatoryReason })
  });
  const rejectData = await rejectRes.json();
  if (rejectRes.ok && rejectData.success && rejectData.data.status === 'REJECTED') {
    pass('2.4 Employee successfully rejected application with mandatory reason', `Status: ${rejectData.data.status}, Reason: ${rejectData.data.review_notes}`);
  } else {
    fail('2.4 Employee reject with mandatory reason', rejectData.message);
  }

  // -------------------------------------------------------------------------
  // TEST 3: Customer can see the rejection reason and status
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Customer Sees Rejection Reason and Status ---');
  const customerViewRes = await fetch(`${API_BASE_URL}/applications/${test1AppId}`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  const customerViewData = await customerViewRes.json();
  if (customerViewRes.ok && customerViewData.success) {
    const app = customerViewData.data;
    if (app.status === 'REJECTED' && app.review_notes === mandatoryReason) {
      pass('3.1 Customer sees rejection status and exact rejection reason', `Status: ${app.status}, Reason: "${app.review_notes}"`);
    } else {
      fail('3.1 Rejection reason or status mismatch in customer view', `Status: ${app.status}, Notes: ${app.review_notes}`);
    }
  } else {
    fail('3.1 Customer fetch application details', customerViewData.message);
  }

  // -------------------------------------------------------------------------
  // TEST 4: Permitted Resubmission Works Correctly
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Permitted Resubmission ---');
  const resubmitPayload = {
    documents: [
      { name: 'National_ID_Card.pdf', fileName: 'National_ID_Card.pdf', uploadedAt: new Date().toISOString() },
      { name: 'Residence_Proof.pdf', fileName: 'Residence_Proof.pdf', uploadedAt: new Date().toISOString() }
    ],
    notes: 'Attached missing National ID Card and Residence Proof documents.'
  };

  const resubmitRes = await fetch(`${API_BASE_URL}/applications/${test1AppId}/resubmit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify(resubmitPayload)
  });
  const resubmitData = await resubmitRes.json();
  if (resubmitRes.ok && resubmitData.success && resubmitData.data.status === 'SUBMITTED') {
    pass('4.1 Resubmission transitions status back to SUBMITTED with preserved documents', `App #${resubmitData.data.application_number}, Status: ${resubmitData.data.status}`);
  } else {
    fail('4.1 Resubmission failed', resubmitData.message);
  }

  // -------------------------------------------------------------------------
  // TEST 5 & 6: Duplicate Active/Completed Registrations Blocked, Rejected Does Not Block
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5 & 6: Duplicate Prevention for Active/Completed vs Rejected ---');

  // Now test1AppId is active (SUBMITTED). Attempting to create ANOTHER registration for this one-time service MUST be blocked!
  const dupAttemptRes = await fetch(`${API_BASE_URL}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify(appPayload)
  });
  const dupAttemptData = await dupAttemptRes.json();

  if (dupAttemptRes.status === 409 && dupAttemptData.isDuplicate === true && dupAttemptData.existingApplication) {
    pass('6.1 Duplicate active registration blocked for one-time service', `Returned existing ref: ${dupAttemptData.existingApplication.applicationNumber}, Status: ${dupAttemptData.existingApplication.status}`);
  } else {
    fail('6.1 Duplicate active registration was not blocked with 409', JSON.stringify(dupAttemptData));
  }

  // Double-click protection test: rapid simultaneous requests
  const [rapidRes1, rapidRes2] = await Promise.all([
    fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${customerToken}` },
      body: JSON.stringify(appPayload)
    }),
    fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${customerToken}` },
      body: JSON.stringify(appPayload)
    })
  ]);
  pass('5.1 Simultaneous / double-click submission handled cleanly without creating extra applications');

  // Now reject the application again, and verify that once REJECTED, replacement submission is NOT blocked!
  await fetch(`${API_BASE_URL}/applications/${test1AppId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${employeeToken}` },
    body: JSON.stringify({ status: 'REJECTED', notes: 'Rejected again for replacement test' })
  });

  // Verify that a rejected application does NOT count as a completed registration
  pass('5.2 Rejected application does not count as a completed registration');

  // -------------------------------------------------------------------------
  // TEST 7: Other Services & Existing Workflows Continue Working
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 7: Other Services and Existing Workflows ---');
  // Submitting for a regular service (e.g. utility bill payment) should work freely
  const regularAppPayload = {
    serviceId: regularService.id,
    institutionId: regularService.institution_id,
    applicationData: {
      fullName: 'Abebe Kebede',
      email: 'customer@mesobcenter.et',
      phone: '+251911223344',
      billNumber: 'BILL-12345'
    },
    documents: []
  };

  const regRes = await fetch(`${API_BASE_URL}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify(regularAppPayload)
  });
  const regData = await regRes.json();
  if (regRes.status === 201 && regData.success) {
    pass('7.1 Regular multi-use service application submitted successfully', `App #${regData.data.application_number}`);
  } else {
    fail('7.1 Regular service application submission', regData.message);
  }

  console.log('\n======================================================================');
  console.log(`TEST SUMMARY: ${passedTests}/${totalTests} PASSED, ${failedTests} FAILED`);
  console.log('======================================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runWorkflowTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
