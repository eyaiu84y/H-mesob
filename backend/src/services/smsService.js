import AfricasTalking from 'africastalking';
import { supabase } from '../config/supabase.js';

// Initialize Africa's Talking
let africastalking = null;
let sms = null;

// Initialize only if credentials are present
try {
  if (process.env.SMS_API_KEY && process.env.SMS_USERNAME) {
    africastalking = AfricasTalking({
      apiKey: process.env.SMS_API_KEY,
      username: process.env.SMS_USERNAME,
    });
    sms = africastalking.SMS;
    console.log('✅ SMS Service initialized successfully');
  } else {
    console.log('⚠️ SMS Service not configured (missing credentials)');
  }
} catch (error) {
  console.error('❌ Failed to initialize SMS Service:', error);
}

/**
 * Send SMS notification
 * @param {string} phoneNumber - Recipient phone number (format: +251912345678)
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} SMS send result
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    // Check if SMS is enabled
    if (process.env.SMS_ENABLED !== 'true') {
      console.log('[SMS] SMS disabled in environment');
      return {
        success: false,
        message: 'SMS notifications are disabled',
      };
    }

    // Check if SMS service is initialized
    if (!sms) {
      console.log('[SMS] SMS service not initialized');
      return {
        success: false,
        message: 'SMS service not configured',
      };
    }

    // Validate phone number
    if (!phoneNumber) {
      console.error('[SMS] No phone number provided');
      return {
        success: false,
        message: 'Phone number is required',
      };
    }

    // Format phone number (ensure it starts with +251 for Ethiopia)
    let formattedPhone = phoneNumber.trim();
    
    // Remove spaces and dashes
    formattedPhone = formattedPhone.replace(/[\s-]/g, '');
    
    // Add country code if not present
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+251' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('9') && formattedPhone.length === 9) {
      // Ethiopian number without leading 0
      formattedPhone = '+251' + formattedPhone;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+251' + formattedPhone;
    }

    console.log('[SMS] Sending SMS to:', formattedPhone);
    console.log('[SMS] Message:', message);

    // Send SMS (don't include 'from' in sandbox mode)
    const smsParams = {
      to: [formattedPhone],
      message: message,
    };
    
    // Only add sender ID if not in sandbox mode
    const senderId = process.env.SMS_SENDER_ID;
    if (senderId && process.env.SMS_USERNAME !== 'sandbox') {
      smsParams.from = senderId;
    }

    const result = await sms.send(smsParams);

    console.log('[SMS] Send result:', JSON.stringify(result, null, 2));

    // Check if SMS was sent successfully
    if (result.SMSMessageData && result.SMSMessageData.Recipients && result.SMSMessageData.Recipients.length > 0) {
      const recipient = result.SMSMessageData.Recipients[0];
      
      if (recipient.status === 'Success' || recipient.statusCode === 101) {
        console.log('[SMS] ✅ SMS sent successfully');
        return {
          success: true,
          message: 'SMS sent successfully',
          data: result,
        };
      } else {
        console.error('[SMS] ❌ SMS failed:', recipient.status);
        return {
          success: false,
          message: `SMS failed: ${recipient.status}`,
          data: result,
        };
      }
    }

    return {
      success: false,
      message: 'No recipients processed',
      data: result,
    };

  } catch (error) {
    console.error('[SMS] Error sending SMS:', error);
    return {
      success: false,
      message: error.message || 'Failed to send SMS',
      error: error.toString(),
    };
  }
};

/**
 * Send queue call notification via SMS
 * @param {string} phoneNumber - Citizen phone number
 * @param {string} queueNumber - Queue token number
 * @param {string} institutionName - Institution name
 * @param {string} language - Language code ('en' or 'am')
 * @returns {Promise<Object>} SMS send result
 */
export const sendQueueCallSMS = async (
  phoneNumber,
  queueNumber,
  institutionName,
  language = 'en'
) => {
  try {
    // SMS message templates
    const messages = {
      en: `MESOB Alert: Your queue number ${queueNumber} is now being called at ${institutionName}. Please proceed to the service desk immediately.`,
      am: `MESOB ማሳወቂያ: የእርስዎ የመስመር ቁጥር ${queueNumber} በ${institutionName} አሁን እየተጠራ ነው። እባክዎን ወዲያውኑ ወደ አገልግሎት ጠረጴዛ ይምጡ።`,
    };

    const message = messages[language] || messages.en;

    return await sendSMS(phoneNumber, message);

  } catch (error) {
    console.error('[SMS] Error sending queue call SMS:', error);
    return {
      success: false,
      message: 'Failed to send queue notification',
    };
  }
};

/**
 * Send queue registration confirmation SMS
 * @param {string} phoneNumber - Citizen phone number
 * @param {string} queueNumber - Queue token number
 * @param {string} institutionName - Institution name
 * @param {number} position - Position in queue
 * @param {string} language - Language code ('en' or 'am')
 * @returns {Promise<Object>} SMS send result
 */
export const sendQueueJoinSMS = async (
  phoneNumber,
  queueNumber,
  institutionName,
  position,
  language = 'en'
) => {
  try {
    const messages = {
      en: `MESOB: You joined the queue at ${institutionName}. Your token: ${queueNumber}. Position: ${position}. You will receive an SMS when called.`,
      am: `MESOB: በ${institutionName} ወደ መስመር ገብተዋል። የእርስዎ ቁጥር: ${queueNumber}። ቦታ: ${position}። በሚጠሩበት ጊዜ ኤስኤምኤስ ይደርስዎታል።`,
    };

    const message = messages[language] || messages.en;

    return await sendSMS(phoneNumber, message);

  } catch (error) {
    console.error('[SMS] Error sending queue join SMS:', error);
    return {
      success: false,
      message: 'Failed to send join confirmation',
    };
  }
};

/**
 * Log SMS notification to database for audit
 * @param {string} userId - User ID
 * @param {string} phoneNumber - Phone number
 * @param {string} message - SMS message
 * @param {string} status - Status (SUCCESS/FAILED)
 * @param {Object} providerResponse - Response from SMS provider
 */
export const logSMSNotification = async (userId, phoneNumber, message, status, providerResponse = null) => {
  try {
    await supabase
      .from('sms_logs')
      .insert({
        user_id: userId,
        phone_number: phoneNumber,
        message: message,
        status: status,
        provider_response: providerResponse,
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    console.log('[SMS] ✅ SMS logged to database');
  } catch (error) {
    console.error('[SMS] ⚠️ Failed to log SMS (non-critical):', error);
    // Don't throw - logging failure shouldn't block SMS sending
  }
};
