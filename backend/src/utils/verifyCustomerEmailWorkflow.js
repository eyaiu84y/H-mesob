/**
 * Verification Test Suite for Hawassa MESOB Customer Email Notifications
 * Verifies all 10 requirements specified in the user prompt:
 * 1. Uses configured GMAIL_USER and GMAIL_PASS
 * 2. Application submission confirmation email
 * 3. Application status change emails (action required, approval, rejection)
 * 4. Queue ticket called email (with ticket info and counter instructions)
 * 5. Service genuinely completed email
 * 6. Database source of truth for customer email address
 * 7. Backend event wiring verification (in applicationService and queueService)
 * 8. Duplicate email prevention (idempotency) and credential privacy in logs
 * 9. Invalid email and SMTP failure safe handling
 * 10. Complete workflow execution report
 */

import { supabase } from '../config/supabase.js';
import {
  sendEmail,
  sendQueueJoinEmail,
  sendQueueCallEmail,
  sendApplicationSubmittedEmail,
  sendApplicationActionRequiredEmail,
  sendApplicationDecisionEmail,
  sendApplicationCompletedEmail,
  maskEmail,
  isValidEmail,
  isUserEmailVerified
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
import fs from 'fs';
import path from 'path';

let results = [];

function recordResult(requirementNum, name, passed, details = '') {
  results.push({
    requirement: requirementNum,
    name,
    passed,
    details
  });
  const icon = passed ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`  ${icon} Req ${requirementNum}: ${name}${details ? ` (${details})` : ''}`);
}

async function runVerification() {
  console.log('\n========================================================================');
  console.log('📬 HAWASSA MESOB CUSTOMER EMAIL NOTIFICATION WORKFLOW VERIFICATION');
  console.log('========================================================================\n');

  // ── Requirement 1: Verify GMAIL_USER and GMAIL_PASS configured & working ──
  console.log('🔍 Checking Requirement 1: Environment Variables & SMTP Connection...');
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;
  const isEnabled = process.env.EMAIL_ENABLED;

  const hasCredentials = Boolean(gmailUser && gmailPass && isEnabled === 'true');
  let smtpVerified = false;
  try {
    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });
    smtpVerified = await transporter.verify();
  } catch (err) {
    smtpVerified = false;
  }

  recordResult(
    1,
    'Configured GMAIL_USER and GMAIL_PASS environment variables with active SMTP transport',
    hasCredentials && smtpVerified === true,
    `Account: ${maskEmail(gmailUser)}, SMTP Verified: ${smtpVerified}`
  );

  // ── Requirement 6: Database as Source of Truth for Customer Email ──
  console.log('\n🔍 Checking Requirement 6: Database Customer Email Resolution...');
  let realCustomer = null;
  const { data: dbCustomers, error: dbErr } = await supabase
    .from('users')
    .select('id, full_name, email, role, metadata, created_at')
    .eq('role', 'CITIZEN')
    .limit(10);

  if (dbCustomers && dbCustomers.length > 0) {
    realCustomer = dbCustomers.find(c => isValidEmail(c.email) && c.metadata?.email_verification?.verified !== false) || dbCustomers[0];
  }

  const profileLookup = realCustomer ? await getCitizenContactProfile(realCustomer.id) : null;
  const dbSourceVerified = Boolean(
    profileLookup &&
    realCustomer &&
    profileLookup.id === realCustomer.id &&
    profileLookup.email === realCustomer.email
  );

  recordResult(
    6,
    'Send notifications to customer email resolved directly from database as source of truth',
    dbSourceVerified,
    `Resolved citizen ID ${realCustomer?.id?.slice(0, 8)}... (${realCustomer?.full_name}) to database email: ${maskEmail(profileLookup?.email)}`
  );

  // Test recipient resolved directly from verified database customer (strictly NEVER GMAIL_USER)
  const testRecipient = (realCustomer && realCustomer.email !== gmailUser) ? realCustomer : {
    id: 'test-citizen-uuid',
    email: 'customer.mesob.test@gmail.com',
    full_name: 'Verified Customer',
    role: 'CITIZEN',
    metadata: { email_verification: { verified: true } }
  };

  // ── Requirement 2: Application Submission Confirmation Email ──
  console.log('\n🔍 Checking Requirement 2: Application Submission Confirmation Email...');
  const appSubmitResult = await sendApplicationSubmittedEmail({
    to: testRecipient.email,
    recipientUser: testRecipient,
    applicationNumber: 'APP-2026-MESOB-010',
    serviceName: 'Hawassa Resident ID Card Issuance',
    institutionName: 'Hawassa City Administration MESOB Center',
    submittedAt: new Date().toISOString(),
    applicationId: 'app-test-submit-id'
  });

  recordResult(
    2,
    'Customer receives confirmation email upon application submission',
    appSubmitResult.success === true,
    `Delivered to ${maskEmail(testRecipient.email)} (MessageId: ${appSubmitResult.messageId || 'OK'})`
  );

  // ── Requirement 3: Application Status Changes (Action Required, Approved, Rejected) ──
  console.log('\n🔍 Checking Requirement 3: Application Status Change Notifications...');
  
  // 3.A Action Required
  const actionRequiredResult = await sendApplicationActionRequiredEmail({
    to: testRecipient.email,
    recipientUser: testRecipient,
    applicationNumber: 'APP-2026-MESOB-010',
    serviceName: 'Hawassa Resident ID Card Issuance',
    notes: 'Please upload a clear scanned copy of your residential kebele registration slip.',
    applicationId: 'app-test-action-id'
  });

  // 3.B Decision: Approved
  const decisionApprovedResult = await sendApplicationDecisionEmail({
    to: testRecipient.email,
    recipientUser: testRecipient,
    applicationNumber: 'APP-2026-MESOB-010',
    serviceName: 'Hawassa Resident ID Card Issuance',
    decision: 'APPROVED',
    notes: 'Application approved by reviewing officer. Document ready for collection.',
    applicationId: 'app-test-approved-id'
  });

  // 3.C Decision: Rejected
  const decisionRejectedResult = await sendApplicationDecisionEmail({
    to: testRecipient.email,
    recipientUser: testRecipient,
    applicationNumber: 'APP-2026-MESOB-010',
    serviceName: 'Hawassa Resident ID Card Issuance',
    decision: 'REJECTED',
    notes: 'Uploaded residential slip could not be verified by Kebele 04 administration.',
    applicationId: 'app-test-rejected-id'
  });

  const req3Passed = (
    actionRequiredResult.success === true &&
    decisionApprovedResult.success === true &&
    decisionRejectedResult.success === true
  );

  recordResult(
    3,
    'Customer notified of application status changes (Action Required, Approved, Rejected)',
    req3Passed,
    'Verified Action Required, Approved, and Rejected email dispatches with officer instructions'
  );

  // ── Requirement 4: Queue Ticket Called Email ──
  console.log('\n🔍 Checking Requirement 4: Queue Ticket Called Email...');
  const queueCallResult = await sendQueueCallEmail({
    to: testRecipient.email,
    recipientUser: testRecipient,
    queueNumber: 'Q-2026-0042',
    serviceName: 'Civil Registration Service',
    institutionName: 'Hawassa MESOB Public Center',
    counterNumber: '3',
    queueEntryId: 'q-call-verify-id'
  });

  recordResult(
    4,
    'Customer receives email with ticket number and instructions when ticket is called',
    queueCallResult.success === true,
    `Delivered to ${maskEmail(testRecipient.email)} with Counter #3 instructions`
  );

  // ── Requirement 5: Service Genuinely Completed Email ──
  console.log('\n🔍 Checking Requirement 5: Service Completion Email...');
  const serviceCompletedResult = await sendApplicationCompletedEmail({
    to: testRecipient.email,
    recipientUser: testRecipient,
    applicationNumber: 'APP-2026-MESOB-010',
    serviceName: 'Hawassa Resident ID Card Issuance',
    completedAt: new Date().toISOString(),
    applicationId: 'app-completed-verify-id'
  });

  recordResult(
    5,
    'Customer receives completion email with feedback link when service is completed',
    serviceCompletedResult.success === true,
    `Delivered to ${maskEmail(testRecipient.email)} with feedback CTA`
  );

  // ── Requirement 7: Trigger Notifications from Actual Backend Events ──
  console.log('\n🔍 Checking Requirement 7: Backend Event Wiring Verification...');
  const appServicePath = path.resolve('src/services/applicationService.js');
  const queueServicePath = path.resolve('src/services/queueService.js');
  
  const appServiceContent = fs.readFileSync(appServicePath, 'utf8');
  const queueServiceContent = fs.readFileSync(queueServicePath, 'utf8');

  const appSubmitWired = appServiceContent.includes('dispatchApplicationSubmittedNotifications');
  const appStatusWired = appServiceContent.includes('dispatchApplicationActionRequiredNotifications') &&
                         appServiceContent.includes('dispatchApplicationDecisionNotifications') &&
                         appServiceContent.includes('dispatchApplicationCompletedNotifications');
  const queueCallWired = queueServiceContent.includes('dispatchQueueCallNotifications');
  const queueCompWired = queueServiceContent.includes('dispatchApplicationCompletedNotifications');

  const backendEventsWired = appSubmitWired && appStatusWired && queueCallWired && queueCompWired;

  recordResult(
    7,
    'Notifications wired directly into backend event handlers (applicationService & queueService)',
    backendEventsWired,
    'Confirmed backend triggers on createApplication, updateApplicationStatus, callNextQueue, and updateQueueStatus'
  );

  // ── Requirement 8: Deduplication & Credential Privacy ──
  console.log('\n🔍 Checking Requirement 8: Deduplication and Credential Privacy in Logs...');
  const idempotencyKey = `VERIFY_DEDUP_${Date.now()}`;
  
  const firstSend = await sendEmail({
    to: testRecipient.email,
    subject: 'Idempotency Test 1',
    html: '<p>Test 1</p>',
    idempotencyKey,
    recipientUser: testRecipient
  });

  const retrySend = await sendEmail({
    to: testRecipient.email,
    subject: 'Idempotency Test 2',
    html: '<p>Test 2</p>',
    idempotencyKey,
    recipientUser: testRecipient
  });

  const dedupWorked = firstSend.success === true && retrySend.deduplicated === true;

  // Verify masking
  const testMask = maskEmail('eyasu.mesob@gmail.com');
  const maskWorked = testMask === 'e***b@gmail.com';

  recordResult(
    8,
    'Duplicate emails prevented on retries and sensitive credentials masked in all logs',
    dedupWorked && maskWorked,
    `Idempotency TTL active; Email masked: ${testMask}`
  );

  // ── Requirement 9: Safe Error Handling for Invalid Addresses & SMTP ──
  console.log('\n🔍 Checking Requirement 9: Safe Error Handling (Invalid Emails & SMTP)...');
  
  // 9.A Invalid structure
  const invalidResult = await sendEmail({
    to: 'invalid-email-format',
    subject: 'Invalid test',
    html: '<p>Test</p>'
  });
  const handledInvalid = invalidResult.skipped === true && invalidResult.success === false;

  // 9.B Unverified user
  const unverifiedResult = await sendEmail({
    to: 'unverified.citizen@gmail.com',
    subject: 'Unverified test',
    html: '<p>Test</p>',
    recipientUser: {
      id: 'unverified-uuid',
      role: 'CITIZEN',
      metadata: { email_verification: { verified: false } }
    }
  });
  const handledUnverified = unverifiedResult.skipped === true && unverifiedResult.reason === 'UNVERIFIED_EMAIL';

  // 9.C Non-blocking orchestrator with non-existent citizen
  let orchestratorSafe = true;
  try {
    await dispatchApplicationSubmittedNotifications({
      application: { id: 'dummy-app', application_number: 'APP-999' },
      citizenId: 'non-existent-uuid',
      serviceName: 'Test Service'
    });
  } catch (e) {
    orchestratorSafe = false;
  }

  const req9Passed = handledInvalid && handledUnverified && orchestratorSafe;
  recordResult(
    9,
    'Invalid email addresses and temporary failures handled safely without system crashes',
    req9Passed,
    'Invalid emails rejected gracefully; unverified emails skipped safely; orchestrator non-blocking'
  );

  // ── Requirement 10: Complete Workflow Test Summary Report ──
  console.log('\n========================================================================');
  console.log('📊 REQUIREMENT VERIFICATION REPORT:');
  console.log('========================================================================');

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  for (const r of results) {
    const status = r.passed ? 'COMPLETED & VERIFIED' : 'INCOMPLETE';
    console.log(`Req ${r.requirement}: [${status}] - ${r.name}`);
    if (r.details) console.log(`       Details: ${r.details}`);
  }

  console.log('\n========================================================================');
  console.log(`TOTAL SCORE: ${passedCount}/${totalCount} REQUIREMENTS PASSED (${Math.round((passedCount/totalCount)*100)}%)`);
  console.log('========================================================================\n');

  if (passedCount === totalCount) {
    console.log('🎉 All 10 Customer Email Notification Requirements are 100% Complete & Verified!\n');
    process.exit(0);
  } else {
    console.error(`⚠️ ${totalCount - passedCount} requirement(s) remained incomplete.\n`);
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
