import { supabase } from '../config/supabase.js';
import { 
  registerUser, 
  verifyEmail, 
  resendVerification, 
  sendPhoneVerificationOTP, 
  verifyPhoneOTP, 
  loginUser,
  getUserProfile
} from '../services/authService.js';
import { 
  formatPhoneForSMSEthiopia, 
  isValidEthiopianPhone, 
  maskPhone 
} from '../services/smsService.js';
import { maskEmail } from '../services/emailService.js';
import { buildDeliveryTracking } from '../services/customerNotificationOrchestrator.js';

async function runTests() {
  console.log('\n===============================================================');
  console.log('🧪 HAWASSA MESOB: VERIFICATION & NOTIFICATION TRACKING TEST SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName} ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  const testEmail = `mesob_verify_test_${Date.now()}@gmail.com`;
  const testPassword = 'TestPassword123!@#';
  const testPhone = '0912345678';
  let testUserId = null;
  let verificationCode = null;
  let verificationToken = null;

  try {
    // -------------------------------------------------------------
    // TEST 1: Phone Normalization and Masking
    // -------------------------------------------------------------
    console.log('\n--- 1. Ethiopian Phone Normalization & Masking ---');
    const normalized1 = formatPhoneForSMSEthiopia('0912345678');
    assert(normalized1 === '251912345678', 'Normalize 09... format to 2519...', normalized1);

    const normalized2 = formatPhoneForSMSEthiopia('+251 91 234 5678');
    assert(normalized2 === '251912345678', 'Normalize +251 with spaces', normalized2);

    const isValid = isValidEthiopianPhone(normalized1);
    assert(isValid === true, 'Validate Ethiopian mobile prefix (Ethio Telecom / Safaricom)');

    const maskedP = maskPhone('251912345678');
    assert(maskedP.startsWith('2519') && maskedP.includes('***'), 'Mask phone for safe logging', maskedP);

    const maskedE = maskEmail('mesob.citizen.hawassa@gmail.com');
    assert(maskedE.includes('***') && maskedE.endsWith('@gmail.com'), 'Mask email for safe logging', maskedE);

    // -------------------------------------------------------------
    // TEST 2: Customer Registration & Verification Token Generation
    // -------------------------------------------------------------
    console.log('\n--- 2. Customer Registration & Verification Code/Token Generation ---');
    const regResult = await registerUser({
      email: testEmail,
      password: testPassword,
      firstName: 'Verify',
      lastName: 'Tester',
      phone: testPhone
    });

    assert(regResult.success === true, 'Customer registration succeeds');
    assert(regResult.data?.emailVerified === false, 'Customer email starts as unverified');

    testUserId = regResult.data?.user?.id;
    verificationCode = regResult.data?.verificationCode;
    verificationToken = regResult.data?.verificationToken;

    assert(Boolean(testUserId), 'User ID generated and persisted', testUserId);
    assert(Boolean(verificationCode && verificationCode.length === 6), '6-digit single-use verification code generated', verificationCode);
    assert(Boolean(verificationToken && verificationToken.length === 64), '32-byte (64 hex char) URL token generated');

    // Inspect user metadata in database directly
    const { data: dbUser } = await supabase
      .from('users')
      .select('id, email, role, metadata')
      .eq('id', testUserId)
      .single();

    assert(dbUser.role === 'CUSTOMER' || dbUser.role === 'CITIZEN', 'User registered strictly as CUSTOMER/CITIZEN', dbUser.role);
    assert(dbUser.metadata?.email_verification?.verified === false, 'Database metadata marks email_verification.verified === false');
    assert(dbUser.metadata?.email_verification?.code === verificationCode, 'Database stores code server-side only');

    // -------------------------------------------------------------
    // TEST 3: Resend Verification Cooldown & Anti-Enumeration
    // -------------------------------------------------------------
    console.log('\n--- 3. Resend Verification Cooldown & Anti-Enumeration Protection ---');
    // Rapid resend attempt within 60s should be blocked
    const cooldownResend = await resendVerification(testEmail);
    assert(
      cooldownResend.success === false && (cooldownResend.code === 'RATE_LIMIT_COOLDOWN' || cooldownResend.code === 'COOLDOWN'), 
      'Immediate resend blocked by 60s cooldown', 
      cooldownResend.message
    );

    // Anti-enumeration: requesting resend on non-existent account returns generic success
    const fakeEmailResend = await resendVerification('completely_unknown_account_xyz_123@gmail.com');
    assert(fakeEmailResend.success === true, 'Anti-enumeration: non-existent email returns generic success message');

    // -------------------------------------------------------------
    // TEST 4: Email Verification Validation & Single-Use Protection
    // -------------------------------------------------------------
    console.log('\n--- 4. Verification Validation & Single-Use Code/Token Invalidation ---');
    // Wrong code attempt
    const wrongCodeRes = await verifyEmail(testEmail, '000000');
    assert(wrongCodeRes.success === false && wrongCodeRes.code === 'INVALID_CODE', 'Wrong verification code rejected', wrongCodeRes.message);

    // Correct code verification
    const correctCodeRes = await verifyEmail(testEmail, verificationCode);
    assert(correctCodeRes.success === true, 'Valid code verifies email address successfully', correctCodeRes.message);

    // Database check: verified must now be true, and code/token MUST be null (single-use protection)
    const { data: verifiedDbUser } = await supabase
      .from('users')
      .select('metadata')
      .eq('id', testUserId)
      .single();

    assert(verifiedDbUser.metadata?.email_verification?.verified === true, 'Database email_verification.verified is true');
    assert(verifiedDbUser.metadata?.email_verification?.code === null, 'Single-use code was wiped from database');
    assert(verifiedDbUser.metadata?.email_verification?.token === null, 'Single-use token was wiped from database');

    // Replay attack / Already verified check
    const replayRes = await verifyEmail(testEmail, verificationCode);
    assert(replayRes.success === true && replayRes.alreadyVerified === true, 'Attempting code reuse reports already verified cleanly');

    // Profile retrieval check
    const profileRes = await getUserProfile(testUserId);
    assert(profileRes.success === true && profileRes.data?.emailVerified === true, 'Profile confirms emailVerified is true');

    // -------------------------------------------------------------
    // TEST 5: Phone OTP Verification
    // -------------------------------------------------------------
    console.log('\n--- 5. Phone Verification OTP Flow ---');
    const otpRes = await sendPhoneVerificationOTP(testUserId, '0911223344');
    console.log('  OTP send response:', otpRes.message);

    if (otpRes.sent) {
      assert(Boolean(otpRes.verificationCode), 'OTP generated for test environment');
      const verifyPhoneRes = await verifyPhoneOTP(testUserId, otpRes.verificationCode);
      assert(verifyPhoneRes.success === true, 'Phone OTP verified successfully');

      const updatedProfile = await getUserProfile(testUserId);
      assert(updatedProfile.data?.phoneVerified === true, 'Profile confirms phoneVerified is true');
    } else {
      // If provider rejected due to starter whitelist (documented SMSEthiopia limitation)
      assert(
        otpRes.success === false && otpRes.requiresWhitelist === true,
        'SMSEthiopia starter tier whitelist requirement handled cleanly without false verification'
      );

      // Verify that phone is NOT marked verified in database
      const { data: unverifiedPhoneUser } = await supabase
        .from('users')
        .select('metadata')
        .eq('id', testUserId)
        .single();

      assert(
        unverifiedPhoneUser.metadata?.phone_verification?.verified === false,
        'Phone is NOT falsely marked verified when SMS provider fails'
      );
    }

    // -------------------------------------------------------------
    // TEST 6: Independent Delivery Status Tracking (Email & SMS)
    // -------------------------------------------------------------
    console.log('\n--- 6. Independent Email and SMS Notification Delivery Tracking ---');
    const trackingSample = buildDeliveryTracking({
      user: {
        email: 'hailuhade847@gmail.com',
        phone: '0912345678'
      },
      emailResult: {
        success: true,
        messageId: '<sample-gmail-id-123@gmail.com>',
        accepted: ['hailuhade847@gmail.com']
      },
      smsResult: {
        success: false,
        skipped: false,
        error: '10007 DEFAULT_CAMPAIGN_RECIPIENT_NOT_WHITELISTED'
      }
    });

    assert(trackingSample.email.channel === 'EMAIL', 'Tracking channel EMAIL');
    assert(trackingSample.email.email_status === 'accepted', 'Tracking email_status: accepted');
    assert(trackingSample.email.message_id === '<sample-gmail-id-123@gmail.com>', 'Tracking provider message ID recorded');
    assert(trackingSample.email.recipient === 'h***7@gmail.com', 'Recipient email masked in tracking payload', trackingSample.email.recipient);

    assert(trackingSample.sms.channel === 'SMS', 'Tracking channel SMS');
    assert(trackingSample.sms.sms_status === 'failed', 'Tracking sms_status: failed (independent from email)');
    assert(trackingSample.sms.error.includes('NOT_WHITELISTED'), 'Safe error reason recorded');
    assert(trackingSample.sms.recipient.startsWith('2519') && trackingSample.sms.recipient.includes('***'), 'Recipient phone masked in tracking payload', trackingSample.sms.recipient);

    // Clean up test user to keep database clean
    if (testUserId) {
      await supabase.from('users').delete().eq('id', testUserId);
      console.log('\n  🧹 Cleaned up temporary test user');
    }

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
