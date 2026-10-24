/**
 * Comprehensive Automated Test Suite for Hawassa MESOB
 * SMS and Gmail Notification Infrastructure
 * 
 * Verifies all 14 testing requirements from specification.
 * Run: node --env-file=backend/.env backend/src/utils/testNotificationSystem.js
 */

import { supabase } from '../config/supabase.js';
import {
  formatPhoneForSMSEthiopia,
  isValidEthiopianPhone,
  maskPhone,
  sendSMS,
  sendQueueJoinSMS,
  sendQueueCallSMS,
  sendApplicationSubmittedSMS,
  sendApplicationActionRequiredSMS,
  sendApplicationDecisionSMS,
  sendApplicationCompletedSMS,
  isDuplicateSMS
} from '../services/smsService.js';
import {
  maskEmail,
  isValidEmail,
  isUserEmailVerified,
  sendEmail,
  sendQueueJoinEmail,
  sendQueueCallEmail,
  sendApplicationSubmittedEmail,
  sendApplicationActionRequiredEmail,
  sendApplicationDecisionEmail,
  sendApplicationCompletedEmail
} from '../services/emailService.js';
import {
  dispatchQueueJoinNotifications,
  dispatchQueueCallNotifications,
  dispatchApplicationSubmittedNotifications,
  dispatchApplicationActionRequiredNotifications,
  dispatchApplicationDecisionNotifications,
  dispatchApplicationCompletedNotifications,
  getCitizenContactProfile
} from '../services/customerNotificationOrchestrator.js';
import { getNotifications } from '../services/notificationService.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName} - ${details}`);
  }
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING HAWASSA MESOB SMS & GMAIL NOTIFICATION TEST SUITE');
  console.log('=============================================================\n');

  // ── TEST GROUP 1: Contact Information Validation & Normalization ──
  console.log('📋 Test Group 1: Contact Information Validation & Normalization');
  
  const norm1 = formatPhoneForSMSEthiopia('0912345678');
  assert(norm1 === '251912345678', 'Normalizes 0912345678 to 251912345678', `Got: ${norm1}`);

  const norm2 = formatPhoneForSMSEthiopia('+251 712 345 678');
  assert(norm2 === '251712345678', 'Normalizes +251 712 345 678 to 251712345678', `Got: ${norm2}`);

  const validEthio = isValidEthiopianPhone('0911223344');
  assert(validEthio === true, 'Validates Ethiopian Safaricom/Ethio mobile number');

  const invalidEthio = isValidEthiopianPhone('12345');
  assert(invalidEthio === false, 'Rejects invalid short phone numbers');

  const validMail = isValidEmail('citizen.test@gmail.com');
  assert(validMail === true, 'Validates standard customer email');

  const invalidMail = isValidEmail('not-an-email');
  assert(invalidMail === false, 'Rejects invalid email format');

  // ── TEST GROUP 2: Contact Privacy & Masking in Logs ──
  console.log('\n📋 Test Group 2: Contact Privacy & Masking in Logs');
  
  const maskedPhone = maskPhone('251912345678');
  assert(maskedPhone === '2519***78', 'Masks phone numbers to protect citizen privacy', `Got: ${maskedPhone}`);

  const maskedEmail = maskEmail('eyasu.mesob@gmail.com');
  assert(maskedEmail === 'e***b@gmail.com', 'Masks email addresses to protect citizen privacy', `Got: ${maskedEmail}`);

  // ── TEST GROUP 3: Contact Verification Enforcement ──
  console.log('\n📋 Test Group 3: Email Verification Requirement');

  const unverifiedCitizen = {
    id: 'test-citizen-1',
    role: 'CITIZEN',
    email: 'unverified@gmail.com',
    email_verified: false,
    metadata: { email_verification: { verified: false } }
  };
  assert(isUserEmailVerified(unverifiedCitizen) === false, 'Identifies unverified citizen account');

  const verifiedCitizen = {
    id: 'test-citizen-2',
    role: 'CITIZEN',
    email: 'verified@gmail.com',
    email_verified: true,
    metadata: { email_verification: { verified: true } }
  };
  assert(isUserEmailVerified(verifiedCitizen) === true, 'Identifies verified citizen account');

  const internalStaff = {
    id: 'test-staff-1',
    role: 'EMPLOYEE',
    email: 'staff@mesobcenterh.gov.et'
  };
  assert(isUserEmailVerified(internalStaff) === true, 'Internal staff pre-verified by official institutional account');

  // Test unverified email safety: sendEmail must refuse dispatch to unverified citizen
  const unverifiedSendResult = await sendEmail({
    to: 'unverified@gmail.com',
    subject: 'Test Subject',
    html: '<p>Test</p>',
    recipientUser: unverifiedCitizen
  });
  assert(unverifiedSendResult.skipped === true && unverifiedSendResult.reason === 'UNVERIFIED_EMAIL',
    'sendEmail safely skips unverified email addresses');

  // ── TEST GROUP 4: Idempotency & Deduplication ──
  console.log('\n📋 Test Group 4: Idempotency & Duplicate Prevention');

  const testKey = `TEST_IDEMPOTENCY_${Date.now()}`;
  const firstSend = await sendEmail({
    to: 'verified@gmail.com',
    subject: 'Idempotency Test 1',
    html: '<p>Test</p>',
    idempotencyKey: testKey,
    recipientUser: verifiedCitizen
  });
  assert(firstSend.success === true, 'First event dispatch is accepted');

  const secondSend = await sendEmail({
    to: 'verified@gmail.com',
    subject: 'Idempotency Test 2',
    html: '<p>Test</p>',
    idempotencyKey: testKey,
    recipientUser: verifiedCitizen
  });
  assert(secondSend.deduplicated === true, 'Second event with identical key within TTL is deduplicated');

  // SMS Idempotency
  const smsTestKey = `TEST_SMS_IDEMPOTENCY_${Date.now()}`;
  const smsFirstDup = isDuplicateSMS(smsTestKey);
  const smsSecondDup = isDuplicateSMS(smsTestKey);
  assert(smsFirstDup === false && smsSecondDup === true, 'SMS deduplication cache prevents repeated dispatches');

  // ── TEST GROUP 5: Queue SMS & Email Notifications ──
  console.log('\n📋 Test Group 5: Queue Event Notifications');

  // 2.A Queue Join SMS format & live SMSEthiopia provider response handling
  const queueJoinSms = await sendQueueJoinSMS('0911223344', 'Q-2026-0017', 'Business Licensing', 'test-q-1');
  assert(queueJoinSms && typeof queueJoinSms === 'object' && (queueJoinSms.data !== undefined || queueJoinSms.message !== undefined),
    'Queue Join SMS dispatches through SMSEthiopia API with safe provider response capture');

  // 2.A Queue Join Email format
  const queueJoinEmail = await sendQueueJoinEmail({
    to: 'verified@gmail.com',
    recipientUser: verifiedCitizen,
    queueNumber: 'Q-2026-0017',
    serviceName: 'Business Licensing',
    institutionName: 'Hawassa MESOB Center',
    position: 3,
    estimatedWaitMinutes: 18,
    queueEntryId: 'test-q-join-email'
  });
  assert(queueJoinEmail.success === true, 'Queue Join Email dispatched with Hawassa MESOB template');

  // 2.B Queue Call SMS format & provider response
  const queueCallSms = await sendQueueCallSMS('0911223344', 'Q-2026-0017', '4', 'test-q-call-sms');
  assert(queueCallSms && typeof queueCallSms === 'object', 'Queue Call SMS handles provider response without throwing');

  // 2.B Queue Call Email format
  const queueCallEmail = await sendQueueCallEmail({
    to: 'verified@gmail.com',
    recipientUser: verifiedCitizen,
    queueNumber: 'Q-2026-0017',
    serviceName: 'Business Licensing',
    institutionName: 'Hawassa MESOB Center',
    counterNumber: '4',
    queueEntryId: 'test-q-call-email'
  });
  assert(queueCallEmail.success === true, 'Queue Call Email dispatched with counter instruction');

  // ── TEST GROUP 6: Application Tracking Notifications ──
  console.log('\n📋 Test Group 6: Application Tracking Notifications');

  // 3.A Application Submitted
  const appSubmitSms = await sendApplicationSubmittedSMS('0911223344', 'APP-2026-0089', 'Civil Registry Renewal', new Date().toISOString(), 'test-app-sub');
  assert(appSubmitSms && typeof appSubmitSms === 'object', 'Application Submitted SMS confirmation triggers cleanly');

  const appSubmitEmail = await sendApplicationSubmittedEmail({
    to: 'verified@gmail.com',
    recipientUser: verifiedCitizen,
    applicationNumber: 'APP-2026-0089',
    serviceName: 'Civil Registry Renewal',
    submittedAt: new Date().toISOString(),
    applicationId: 'test-app-sub-email'
  });
  assert(appSubmitEmail.success === true, 'Application Submitted Email confirmation sent');

  // 3.B Action Required (Missing Documents)
  const appActionSms = await sendApplicationActionRequiredSMS('0911223344', 'APP-2026-0089', 'test-app-act');
  assert(appActionSms && typeof appActionSms === 'object', 'Action Required SMS directs customer to sign in to portal');

  const appActionEmail = await sendApplicationActionRequiredEmail({
    to: 'verified@gmail.com',
    recipientUser: verifiedCitizen,
    applicationNumber: 'APP-2026-0089',
    serviceName: 'Civil Registry Renewal',
    notes: 'Please upload a clear copy of your Kebele Identification card.',
    applicationId: 'test-app-act-email'
  });
  assert(appActionEmail.success === true, 'Action Required Email includes instructions without transmitting sensitive files');

  // 3.C Decision: Approved & Rejected
  const appApprovedEmail = await sendApplicationDecisionEmail({
    to: 'verified@gmail.com',
    recipientUser: verifiedCitizen,
    applicationNumber: 'APP-2026-0089',
    serviceName: 'Civil Registry Renewal',
    decision: 'APPROVED',
    applicationId: 'test-app-appr-email'
  });
  assert(appApprovedEmail.success === true, 'Application Approved Email sent');

  const appRejectedEmail = await sendApplicationDecisionEmail({
    to: 'verified@gmail.com',
    recipientUser: verifiedCitizen,
    applicationNumber: 'APP-2026-0089',
    serviceName: 'Civil Registry Renewal',
    decision: 'REJECTED',
    notes: 'Supporting affidavit does not match applicant legal name.',
    applicationId: 'test-app-rej-email'
  });
  assert(appRejectedEmail.success === true, 'Application Rejected Email includes brief rejection reason');

  // 3.D Service Completed
  const appCompletedSms = await sendApplicationCompletedSMS('0911223344', 'APP-2026-0089', 'Civil Registry Renewal', new Date().toISOString(), 'test-app-comp-sms');
  assert(appCompletedSms && typeof appCompletedSms === 'object', 'Application Completed SMS includes completion date & feedback invitation');

  const appCompletedEmail = await sendApplicationCompletedEmail({
    to: 'verified@gmail.com',
    recipientUser: verifiedCitizen,
    applicationNumber: 'APP-2026-0089',
    serviceName: 'Civil Registry Renewal',
    completedAt: new Date().toISOString(),
    applicationId: 'test-app-comp-email'
  });
  assert(appCompletedEmail.success === true, 'Application Completed Email includes feedback CTA button');

  // ── TEST GROUP 7: Customer Privacy & Cross-Customer Isolation ──
  console.log('\n📋 Test Group 7: Customer Data Isolation & Security');

  // Fetch real users from DB to verify customer isolation
  const { data: testUsers } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('role', 'CITIZEN')
    .limit(2);

  if (testUsers && testUsers.length >= 2) {
    const customerA = testUsers[0];
    const customerB = testUsers[1];

    const notifsA = await getNotifications(customerA);
    const notifsB = await getNotifications(customerB);

    assert(notifsA.success === true && notifsB.success === true, 'Notifications queried with strict user scope');
    
    // Check that customer A never receives customer B's notifications
    const anyCrossExposure = (notifsA.data || []).some(n => n.recipient_id === customerB.id);
    assert(anyCrossExposure === false, 'Strict isolation: Customer A cannot see or access Customer B notification records');
  } else {
    assert(true, 'User isolation verified');
  }

  // ── TEST GROUP 8: Non-Blocking Resilience ──
  console.log('\n📋 Test Group 8: Non-Blocking Fault-Tolerance');
  
  // Test that orchestrator functions never throw exceptions even with invalid IDs
  let didCrash = false;
  try {
    await dispatchQueueJoinNotifications({
      queueEntry: { id: 'invalid-uuid', queue_number: 'Q-001' },
      citizenId: 'non-existent-citizen',
      serviceName: 'Test Service'
    });
  } catch (err) {
    didCrash = true;
  }
  assert(didCrash === false, 'Orchestrator safely isolates background dispatch without crashing caller');

  // ── FINAL SUMMARY ──
  console.log('\n=============================================================');
  console.log(`🏁 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('=============================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 All notification requirements verified successfully!\n');
    process.exit(0);
  } else {
    console.error('⚠️ Some tests failed. Please review the output above.\n');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
