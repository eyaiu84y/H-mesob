import AfricasTalking from 'africastalking';
import { supabase } from '../config/supabase.js';

/**
 * Mask phone number for logging and privacy protection
 * Example: 251912345678 -> 2519***78
 */
export const maskPhone = (phoneNumber) => {
  if (!phoneNumber) return 'N/A';
  const str = phoneNumber.toString().trim();
  if (str.length <= 4) return '***';
  return str.slice(0, 4) + '***' + str.slice(-2);
};

// In-Memory Idempotency Cache for SMS (5 minutes TTL)
const sentSMSCache = new Map();
const SMS_IDEMPOTENCY_TTL_MS = 5 * 60 * 1000;

export const isDuplicateSMS = (key) => {
  if (!key) return false;
  const now = Date.now();
  for (const [k, timestamp] of sentSMSCache.entries()) {
    if (now - timestamp > SMS_IDEMPOTENCY_TTL_MS) {
      sentSMSCache.delete(k);
    }
  }
  if (sentSMSCache.has(key)) {
    return true;
  }
  sentSMSCache.set(key, now);
  return false;
};

// Determine SMS Provider ('smsethiopia' or 'africastalking')
const SMS_PROVIDER = (process.env.SMS_PROVIDER || 'smsethiopia').toLowerCase();

// Initialize Africa's Talking if selected
let africastalking = null;
let atSMS = null;

if (SMS_PROVIDER === 'africastalking') {
  try {
    if (process.env.SMS_API_KEY && process.env.SMS_USERNAME) {
      africastalking = AfricasTalking({
        apiKey: process.env.SMS_API_KEY,
        username: process.env.SMS_USERNAME,
      });
      atSMS = africastalking.SMS;
      console.log('✅ SMS Service initialized with Africa\'s Talking');
    } else {
      console.log('⚠️ Africa\'s Talking SMS not configured (missing credentials)');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Africa\'s Talking SMS Service:', error);
  }
} else if (SMS_PROVIDER === 'smsethiopia') {
  if (process.env.SMS_API_KEY) {
    console.log('✅ SMS Service initialized with SMSEthiopia (https://smsethiopia.com)');
  } else {
    console.log('⚠️ SMSEthiopia SMS not configured (missing SMS_API_KEY)');
  }
}

/**
 * Format phone number for SMSEthiopia (2519XXXXXXXX or 2517XXXXXXXX)
 * @param {string} phoneNumber 
 * @returns {string} Formatted phone number without '+' or spaces
 */
export const formatPhoneForSMSEthiopia = (phoneNumber) => {
  if (!phoneNumber) return '';
  let cleaned = phoneNumber.toString().trim().replace(/[\s\-().]/g, '');
  if (cleaned.startsWith('00251')) cleaned = cleaned.substring(2);
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
  if (cleaned.startsWith('2510')) cleaned = '251' + cleaned.substring(4);
  if (cleaned.startsWith('0')) {
    cleaned = '251' + cleaned.substring(1);
  } else if ((cleaned.startsWith('9') || cleaned.startsWith('7')) && cleaned.length === 9) {
    cleaned = '251' + cleaned;
  } else if (!cleaned.startsWith('251') && cleaned.length === 9) {
    cleaned = '251' + cleaned;
  }
  return cleaned;
};

/**
 * Validate that phone number is a valid Ethiopian mobile number
 */
export const isValidEthiopianPhone = (phoneNumber) => {
  if (!phoneNumber) return false;
  const formatted = formatPhoneForSMSEthiopia(phoneNumber);
  return /^251(9|7)\d{8}$/.test(formatted);
};

/**
 * Format phone number for Africa's Talking (+2519XXXXXXXX)
 * @param {string} phoneNumber 
 * @returns {string} Formatted phone number with '+'
 */
export const formatPhoneForAfricasTalking = (phoneNumber) => {
  if (!phoneNumber) return '';
  let cleaned = phoneNumber.toString().trim().replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+251' + cleaned.substring(1);
  } else if (cleaned.startsWith('9') && cleaned.length === 9) {
    cleaned = '+251' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
};

/**
 * Send SMS via SMSEthiopia REST API
 * @param {string} phoneNumber 
 * @param {string} message 
 * @returns {Promise<Object>}
 */
const sendViaSMSEthiopia = async (phoneNumber, message) => {
  const apiKey = process.env.SMS_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      message: 'SMSEthiopia API Key is missing. Please set SMS_API_KEY in .env',
    };
  }

  const formattedPhone = formatPhoneForSMSEthiopia(phoneNumber);
  console.log(`[SMS - SMSEthiopia] Dispatching to: ${maskPhone(formattedPhone)}`);

  const response = await fetch('https://smsethiopia.com/api/sms/send', {
    method: 'POST',
    headers: {
      'KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      msisdn: formattedPhone,
      text: message,
    }),
  });

  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    data = { raw: await response.text() };
  }

  if (!response.ok) {
    const errorMsg = data?.error_message || data?.message || `HTTP ${response.status} Bad Request`;
    console.error(`[SMS - SMSEthiopia] ❌ Delivery failed to ${maskPhone(formattedPhone)}:`, errorMsg);
    
    if (data?.error_message && data.error_message.includes('DEFAULT_CAMPAIGN_RECIPIENT_NOT_WHITELISTED')) {
      console.warn(`[SMS - SMSEthiopia] ⚠️ Recipient ${maskPhone(formattedPhone)} not whitelisted in starter campaign! Add this number to your smsethiopia.com console or upgrade to a paid campaign.`);
    }

    return {
      success: false,
      message: errorMsg,
      data,
    };
  }

  console.log(`[SMS - SMSEthiopia] ✅ SMS accepted by provider for ${maskPhone(formattedPhone)}`);
  return {
    success: true,
    message: 'SMS sent successfully',
    data,
  };
};

/**
 * Send SMS via Africa's Talking SDK
 * @param {string} phoneNumber 
 * @param {string} message 
 * @returns {Promise<Object>}
 */
const sendViaAfricasTalking = async (phoneNumber, message) => {
  if (!atSMS) {
    return {
      success: false,
      message: 'Africa\'s Talking SMS service is not initialized',
    };
  }

  const formattedPhone = formatPhoneForAfricasTalking(phoneNumber);
  console.log(`[SMS - Africa's Talking] Dispatching to: ${maskPhone(formattedPhone)}`);

  const smsParams = {
    to: [formattedPhone],
    message: message,
  };

  const senderId = process.env.SMS_SENDER_ID;
  if (senderId && process.env.SMS_USERNAME !== 'sandbox') {
    smsParams.from = senderId;
  }

  const result = await atSMS.send(smsParams);

  if (result.SMSMessageData?.Recipients?.length > 0) {
    const recipient = result.SMSMessageData.Recipients[0];
    if (recipient.status === 'Success' || recipient.statusCode === 101) {
      console.log(`[SMS - Africa's Talking] ✅ SMS accepted for ${maskPhone(formattedPhone)}`);
      return {
        success: true,
        message: 'SMS sent successfully',
        data: result,
      };
    }
    console.error(`[SMS - Africa's Talking] ❌ SMS failed for ${maskPhone(formattedPhone)}: ${recipient.status}`);
    return {
      success: false,
      message: `SMS failed: ${recipient.status}`,
      data: result,
    };
  }

  return {
    success: false,
    message: 'No recipients processed',
    data: result,
  };
};

/**
 * Send SMS notification with phone validation, masking, and deduplication
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - SMS message content
 * @param {string} [idempotencyKey] - Optional deduplication key
 * @returns {Promise<Object>} SMS send result
 */
export const sendSMS = async (phoneNumber, message, idempotencyKey = null) => {
  try {
    // Check if SMS is enabled
    if (process.env.SMS_ENABLED !== 'true') {
      console.log(`[SMS] SMS disabled in environment (SMS_ENABLED != true). Simulated dispatch to ${maskPhone(phoneNumber)}`);
      return {
        success: true,
        message: 'SMS notifications are disabled; dispatch simulated',
        simulated: true,
      };
    }

    // Validate phone number
    if (!phoneNumber) {
      return {
        success: false,
        message: 'Phone number is required',
        skipped: true,
      };
    }

    if (!isValidEthiopianPhone(phoneNumber)) {
      console.warn(`[SMS] ⚠️ Invalid Ethiopian mobile phone format: ${maskPhone(phoneNumber)}`);
      return {
        success: false,
        message: 'Invalid phone number format. Must be an Ethiopian mobile number (09... or 07...).',
        skipped: true,
      };
    }

    // Idempotency check
    if (idempotencyKey && isDuplicateSMS(idempotencyKey)) {
      console.log(`[SMS] ℹ️ Deduplicated SMS dispatch for key: ${idempotencyKey}`);
      return {
        success: true,
        message: 'SMS deduplicated (already processed)',
        deduplicated: true,
      };
    }

    if (SMS_PROVIDER === 'africastalking') {
      return await sendViaAfricasTalking(phoneNumber, message);
    } else {
      return await sendViaSMSEthiopia(phoneNumber, message);
    }
  } catch (error) {
    console.error(`[SMS] Error sending SMS to ${maskPhone(phoneNumber)}:`, error.message);
    return {
      success: false,
      message: error.message || 'Failed to send SMS',
      error: error.toString(),
    };
  }
};

// ── Queue SMS Notifications ──────────────────────────────────────

/**
 * 2.A - Queue Join SMS
 * Example: "HAWASSA MESOB: Your queue ticket is Q-2026-0017 for Account Opening. Your queue status is Waiting. Check your dashboard for updates."
 */
export const sendQueueJoinSMS = async (
  phoneNumber,
  queueNumber,
  serviceName,
  queueEntryId = null
) => {
  const service = serviceName || 'Public Service';
  const message = `HAWASSA MESOB: Your queue ticket is ${queueNumber} for ${service}. Your queue status is Waiting. Check your dashboard for updates.`;
  return await sendSMS(phoneNumber, message, `SMS_QUEUE_JOIN:${queueEntryId || queueNumber}`);
};

/**
 * 2.B - Queue Call SMS
 * Example: "HAWASSA MESOB: Your ticket Q-2026-0017 has been called. Please proceed to your assigned service counter."
 */
export const sendQueueCallSMS = async (
  phoneNumber,
  queueNumber,
  counterNumber = null,
  queueEntryId = null
) => {
  const counterText = counterNumber ? `Counter #${counterNumber}` : 'your assigned service counter';
  const message = `HAWASSA MESOB: Your ticket ${queueNumber} has been called. Please proceed to ${counterText}.`;
  return await sendSMS(phoneNumber, message, `SMS_QUEUE_CALL:${queueEntryId || queueNumber}`);
};

// ── Application Tracking SMS Notifications ───────────────────────

/**
 * 3.A - Application Submitted SMS
 */
export const sendApplicationSubmittedSMS = async (
  phoneNumber,
  applicationNumber,
  serviceName,
  submittedAt = null,
  applicationId = null
) => {
  const service = serviceName || 'Public Service';
  const dateStr = submittedAt ? new Date(submittedAt).toLocaleDateString('en-US') : new Date().toLocaleDateString('en-US');
  const message = `HAWASSA MESOB: Application ${applicationNumber} for ${service} was submitted on ${dateStr}. Track progress at your customer dashboard.`;
  return await sendSMS(phoneNumber, message, `SMS_APP_SUBMIT:${applicationId || applicationNumber}`);
};

/**
 * 3.B - Application Requires Additional Information SMS
 */
export const sendApplicationActionRequiredSMS = async (
  phoneNumber,
  applicationNumber,
  applicationId = null
) => {
  const message = `HAWASSA MESOB: Action required for application ${applicationNumber}. Further information is needed. Sign in to your dashboard to review requirements.`;
  return await sendSMS(phoneNumber, message, `SMS_APP_ACTION:${applicationId || applicationNumber}:${new Date().toDateString()}`);
};

/**
 * 3.C - Application Decision (Approved or Rejected) SMS
 */
export const sendApplicationDecisionSMS = async (
  phoneNumber,
  applicationNumber,
  serviceName,
  decision,
  reason = null,
  applicationId = null
) => {
  const isApproved = String(decision).toUpperCase() === 'APPROVED';
  const statusWord = isApproved ? 'approved' : 'rejected';
  let message = `HAWASSA MESOB: Application ${applicationNumber} for ${serviceName || 'Public Service'} has been ${statusWord}.`;
  if (!isApproved && reason && reason.trim().length <= 60) {
    message += ` Reason: ${reason.trim()}`;
  }
  message += ` Sign in to your dashboard for details.`;
  return await sendSMS(phoneNumber, message, `SMS_APP_DECISION:${applicationId || applicationNumber}:${decision}`);
};

/**
 * 3.D - Application or Service Completed SMS
 */
export const sendApplicationCompletedSMS = async (
  phoneNumber,
  applicationNumber,
  serviceName,
  completedAt = null,
  applicationId = null
) => {
  const dateStr = completedAt ? new Date(completedAt).toLocaleDateString('en-US') : new Date().toLocaleDateString('en-US');
  const message = `HAWASSA MESOB: Your service application ${applicationNumber} for ${serviceName || 'Public Service'} has been completed on ${dateStr}. Sign in to review and share your feedback.`;
  return await sendSMS(phoneNumber, message, `SMS_APP_COMPLETED:${applicationId || applicationNumber}`);
};

/**
 * Log SMS notification to audit log
 */
export const logSMSNotification = async (userId, phoneNumber, message, status, providerResponse = null) => {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'SMS_DISPATCH',
      details: JSON.stringify({
        recipient: maskPhone(phoneNumber),
        status,
        provider_response: providerResponse ? (typeof providerResponse === 'object' ? providerResponse : { raw: providerResponse }) : null,
      }),
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SMS] ⚠️ Failed to log SMS to audit_logs (non-critical):', error.message);
  }
};
