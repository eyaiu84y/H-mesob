import { supabase } from '../config/supabase.js';
import { createNotification } from './notificationService.js';
import {
  sendQueueJoinSMS,
  sendQueueCallSMS,
  sendApplicationSubmittedSMS,
  sendApplicationActionRequiredSMS,
  sendApplicationDecisionSMS,
  sendApplicationCompletedSMS,
  isValidEthiopianPhone,
  formatPhoneForSMSEthiopia,
  maskPhone
} from './smsService.js';
import {
  sendQueueJoinEmail,
  sendQueueCallEmail,
  sendApplicationSubmittedEmail,
  sendApplicationActionRequiredEmail,
  sendApplicationDecisionEmail,
  sendApplicationCompletedEmail,
  isUserEmailVerified,
  maskEmail
} from './emailService.js';

/**
 * Fetch and return customer record with contact and verification attributes
 * @param {string} citizenId 
 * @returns {Promise<Object|null>}
 */
export const getCustomerContactProfile = async (citizenId) => {
  if (!citizenId) return null;
  try {
    const { data: citizen, error } = await supabase
      .from('users')
      .select('id, full_name, email, phone, role, status, metadata')
      .eq('id', citizenId)
      .single();

    if (error || !citizen) {
      console.warn(`[NOTIF-ORCHESTRATOR] ⚠️ Customer record not found for ID: ${citizenId}`);
      return null;
    }

    return citizen;
  } catch (err) {
    console.error(`[NOTIF-ORCHESTRATOR] ❌ Error fetching customer contact profile:`, err.message);
    return null;
  }
};

/**
 * Record delivery attempt in audit_logs table
 */
const recordNotificationAudit = async (userId, action, details) => {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[NOTIF-ORCHESTRATOR] ⚠️ Audit log failed (non-critical):`, err.message);
  }
};

/**
 * Build standardized separate delivery tracking metadata for Email & SMS
 */
export const buildDeliveryTracking = ({
  event,
  referenceType,
  referenceId,
  referenceNumber,
  recipientEmail,
  recipientPhone,
  user,
  emailResult,
  smsResult,
}) => {
  const nowIso = new Date().toISOString();
  const targetEmail = recipientEmail || user?.email;
  const targetPhone = formatPhoneForSMSEthiopia(recipientPhone || user?.phone);

  // Email status determination (provider acceptance via SMTP != confirmed delivery to mailbox)
  let emailStatus = 'pending';
  let emailError = null;
  if (!targetEmail) {
    emailStatus = 'skipped';
    emailError = 'NO_EMAIL_PROVIDED';
  } else if (emailResult?.skipped) {
    emailStatus = 'skipped';
    emailError = emailResult.reason || 'UNVERIFIED_EMAIL';
  } else if (emailResult?.success) {
    emailStatus = 'accepted'; // provider accepted for transmission
  } else if (emailResult) {
    emailStatus = 'failed';
    emailError = emailResult.message || emailResult.error || 'SMTP_DISPATCH_FAILED';
  }

  // SMS status determination
  let smsStatus = 'pending';
  let smsError = null;
  if (!targetPhone) {
    smsStatus = 'skipped';
    smsError = 'NO_PHONE_PROVIDED';
  } else if (smsResult?.skipped) {
    smsStatus = 'skipped';
    smsError = smsResult.reason || 'INVALID_ETHIOPIAN_PHONE';
  } else if (smsResult?.success) {
    smsStatus = 'accepted'; // provider accepted via REST API
  } else if (smsResult) {
    smsStatus = 'failed';
    smsError = smsResult.message || smsResult.error || 'SMS_PROVIDER_FAILED';
  }

  return {
    event: event || 'NOTIFICATION_DISPATCH',
    reference_type: referenceType || 'GENERAL',
    reference_id: referenceId || null,
    reference_number: referenceNumber || null,
    timestamp: nowIso,
    email: {
      channel: 'EMAIL',
      email_status: emailStatus,
      recipient: maskEmail(targetEmail),
      message_id: emailResult?.messageId || null,
      accepted_at: emailStatus === 'accepted' ? nowIso : null,
      error: emailError,
    },
    sms: {
      channel: 'SMS',
      sms_status: smsStatus,
      recipient: maskPhone(targetPhone),
      message_id: smsResult?.data?.message_id || smsResult?.data?.id || null,
      provider: process.env.SMS_PROVIDER || 'smsethiopia',
      accepted_at: smsStatus === 'accepted' ? nowIso : null,
      error: smsError,
    }
  };
};

/**
 * 2.A - Event: Customer successfully joins a queue
 */
export const dispatchQueueJoinNotifications = async ({
  queueEntry,
  citizenId,
  serviceName,
  institutionName = 'Hawassa MESOB Center',
  position,
  estimatedWaitMinutes,
}) => {
  const targetCustomerId = citizenId || queueEntry?.citizen_id;
  if (!queueEntry || !targetCustomerId) return;

  // Run asynchronously without blocking HTTP response
  setImmediate(async () => {
    try {
      const customer = await getCustomerContactProfile(targetCustomerId);
      if (!customer) return;

      const queueNumber = queueEntry.queue_number || queueEntry.token;
      const service = serviceName || 'Public Service';

      // 1. SMS Notification (requires valid Ethiopian phone)
      let smsResult = null;
      const phoneToUse = queueEntry.metadata?.phone || customer.phone;
      if (phoneToUse && isValidEthiopianPhone(phoneToUse)) {
        smsResult = await sendQueueJoinSMS(
          phoneToUse,
          queueNumber,
          service,
          queueEntry.id
        );
      } else {
        console.log(`[NOTIF-ORCHESTRATOR] ℹ️ Queue join SMS skipped: No valid Ethiopian phone for customer ${customer.id} (${maskPhone(phoneToUse)})`);
      }

      // 2. Email Notification (requires verified email)
      let emailResult = null;
      if (customer.email && isUserEmailVerified(customer)) {
        emailResult = await sendQueueJoinEmail({
          to: customer.email,
          recipientUser: customer,
          queueNumber,
          serviceName: service,
          institutionName,
          position,
          estimatedWaitMinutes,
          queueEntryId: queueEntry.id,
        });
      } else if (customer.email) {
        console.log(`[NOTIF-ORCHESTRATOR] ℹ️ Queue join Email skipped: Customer email ${maskEmail(customer.email)} is not verified.`);
      }

      // 3. Separate delivery tracking metadata
      const deliveryTracking = buildDeliveryTracking({
        event: 'QUEUE_JOIN_NOTIFIED',
        referenceType: 'queue',
        referenceId: queueEntry.id,
        referenceNumber: queueNumber,
        recipientEmail: customer.email,
        recipientPhone: phoneToUse,
        emailResult,
        smsResult,
      });

      // 4. In-App Notification with independent delivery tracking
      await createNotification({
        recipientId: customer.id,
        type: 'QUEUE_ASSIGNMENT',
        title: 'Queue Registration Confirmed',
        message: `Your queue ticket is #${queueNumber} for ${service}. Status: Waiting.`,
        relatedEntityType: 'queue',
        relatedEntityId: queueEntry.id,
        metadata: {
          delivery_tracking: deliveryTracking,
        }
      });

      // 5. Audit log entry with separate tracking statuses
      await recordNotificationAudit(customer.id, 'QUEUE_JOIN_NOTIFIED', deliveryTracking);

    } catch (err) {
      console.error('[NOTIF-ORCHESTRATOR] ❌ Error in dispatchQueueJoinNotifications:', err.message);
    }
  });
};

/**
 * 2.B - Event: Customer's ticket is called
 */
export const dispatchQueueCallNotifications = async ({
  queueEntry,
  citizenId,
  serviceName,
  institutionName = 'Hawassa MESOB Center',
  counterNumber = '1',
}) => {
  const targetCustomerId = citizenId || queueEntry?.citizen_id;
  if (!queueEntry || !targetCustomerId) return;

  setImmediate(async () => {
    try {
      const customer = await getCustomerContactProfile(targetCustomerId);
      if (!customer) return;

      const queueNumber = queueEntry.queue_number || queueEntry.token;
      const service = serviceName || 'Public Service';

      // 1. SMS Notification
      let smsResult = null;
      const phoneToUse = queueEntry.metadata?.phone || customer.phone;
      if (phoneToUse && isValidEthiopianPhone(phoneToUse)) {
        smsResult = await sendQueueCallSMS(
          phoneToUse,
          queueNumber,
          counterNumber,
          queueEntry.id
        );
      }

      // 2. Email Notification
      let emailResult = null;
      if (customer.email && isUserEmailVerified(customer)) {
        emailResult = await sendQueueCallEmail({
          to: customer.email,
          recipientUser: customer,
          queueNumber,
          serviceName: service,
          institutionName,
          counterNumber,
          queueEntryId: queueEntry.id,
        });
      }

      // 3. Separate delivery tracking
      const deliveryTracking = buildDeliveryTracking({
        event: 'QUEUE_CALLED_NOTIFIED',
        referenceType: 'queue',
        referenceId: queueEntry.id,
        referenceNumber: queueNumber,
        recipientEmail: customer.email,
        recipientPhone: phoneToUse,
        emailResult,
        smsResult,
      });

      // 4. In-App Notification with independent tracking
      await createNotification({
        recipientId: customer.id,
        type: 'QUEUE_ASSIGNMENT',
        title: 'Your Turn in Queue',
        message: `Token #${queueNumber} has been called! Please proceed immediately to Counter #${counterNumber}.`,
        relatedEntityType: 'queue',
        relatedEntityId: queueEntry.id,
        metadata: {
          delivery_tracking: deliveryTracking,
        }
      });

      await recordNotificationAudit(customer.id, 'QUEUE_CALLED_NOTIFIED', deliveryTracking);

    } catch (err) {
      console.error('[NOTIF-ORCHESTRATOR] ❌ Error in dispatchQueueCallNotifications:', err.message);
    }
  });
};

/**
 * 3.A - Event: Customer's application is submitted
 */
export const dispatchApplicationSubmittedNotifications = async ({
  application,
  citizenId,
  serviceName,
  institutionName = 'Hawassa MESOB Center',
}) => {
  const targetCustomerId = citizenId || application?.citizen_id;
  if (!application || !targetCustomerId) return;

  setImmediate(async () => {
    try {
      const customer = await getCustomerContactProfile(targetCustomerId);
      if (!customer) return;

      const appNumber = application.application_number;
      const service = serviceName || 'Public Service';
      const submittedAt = application.submitted_at || application.created_at || new Date().toISOString();

      // 1. SMS Notification
      let smsResult = null;
      const phoneToUse = application.application_data?.phone || customer.phone;
      if (phoneToUse && isValidEthiopianPhone(phoneToUse)) {
        smsResult = await sendApplicationSubmittedSMS(
          phoneToUse,
          appNumber,
          service,
          submittedAt,
          application.id
        );
      }

      // 2. Email Notification
      let emailResult = null;
      if (customer.email && isUserEmailVerified(customer)) {
        emailResult = await sendApplicationSubmittedEmail({
          to: customer.email,
          recipientUser: customer,
          applicationNumber: appNumber,
          serviceName: service,
          institutionName,
          submittedAt,
          applicationId: application.id,
        });
      }

      // 3. Separate delivery tracking
      const deliveryTracking = buildDeliveryTracking({
        event: 'APPLICATION_SUBMIT_NOTIFIED',
        referenceType: 'application',
        referenceId: application.id,
        referenceNumber: appNumber,
        recipientEmail: customer.email,
        recipientPhone: phoneToUse,
        emailResult,
        smsResult,
      });

      // 4. In-App Notification with independent tracking
      await createNotification({
        recipientId: customer.id,
        type: 'APPLICATION_UPDATE',
        title: 'Application Submitted Successfully',
        message: `Your application #${appNumber} for ${service} has been received and is awaiting staff review.`,
        relatedEntityType: 'application',
        relatedEntityId: application.id,
        metadata: {
          delivery_tracking: deliveryTracking,
        }
      });

      await recordNotificationAudit(customer.id, 'APPLICATION_SUBMIT_NOTIFIED', deliveryTracking);

    } catch (err) {
      console.error('[NOTIF-ORCHESTRATOR] ❌ Error in dispatchApplicationSubmittedNotifications:', err.message);
    }
  });
};

/**
 * 3.B - Event: Application requires additional information
 */
export const dispatchApplicationActionRequiredNotifications = async ({
  application,
  citizenId,
  serviceName,
  institutionName = 'Hawassa MESOB Center',
  notes,
}) => {
  const targetCustomerId = citizenId || application?.citizen_id;
  if (!application || !targetCustomerId) return;

  setImmediate(async () => {
    try {
      const customer = await getCustomerContactProfile(targetCustomerId);
      if (!customer) return;

      const appNumber = application.application_number;
      const service = serviceName || 'Public Service';

      // 1. SMS Notification (no sensitive documents via SMS, directs to portal)
      let smsResult = null;
      const phoneToUse = application.application_data?.phone || customer.phone;
      if (phoneToUse && isValidEthiopianPhone(phoneToUse)) {
        smsResult = await sendApplicationActionRequiredSMS(
          phoneToUse,
          appNumber,
          application.id
        );
      }

      // 2. Email Notification
      let emailResult = null;
      if (customer.email && isUserEmailVerified(customer)) {
        emailResult = await sendApplicationActionRequiredEmail({
          to: customer.email,
          recipientUser: customer,
          applicationNumber: appNumber,
          serviceName: service,
          institutionName,
          notes,
          applicationId: application.id,
        });
      }

      // 3. Separate delivery tracking
      const deliveryTracking = buildDeliveryTracking({
        event: 'APPLICATION_ACTION_REQUIRED_NOTIFIED',
        referenceType: 'application',
        referenceId: application.id,
        referenceNumber: appNumber,
        recipientEmail: customer.email,
        recipientPhone: phoneToUse,
        emailResult,
        smsResult,
      });

      // 4. In-App Notification with independent tracking
      await createNotification({
        recipientId: customer.id,
        type: 'APPLICATION_UPDATE',
        title: 'Action Required: Additional Information Needed',
        message: `Please review required documents for application #${appNumber}.${notes ? ` Instructions: ${notes.trim()}` : ''}`,
        relatedEntityType: 'application',
        relatedEntityId: application.id,
        metadata: {
          delivery_tracking: deliveryTracking,
        }
      });

      await recordNotificationAudit(customer.id, 'APPLICATION_ACTION_REQUIRED_NOTIFIED', deliveryTracking);

    } catch (err) {
      console.error('[NOTIF-ORCHESTRATOR] ❌ Error in dispatchApplicationActionRequiredNotifications:', err.message);
    }
  });
};

/**
 * 3.C - Event: Application approved or rejected
 */
export const dispatchApplicationDecisionNotifications = async ({
  application,
  citizenId,
  serviceName,
  institutionName = 'Hawassa MESOB Center',
  decision, // 'APPROVED' or 'REJECTED'
  notes,
}) => {
  const targetCustomerId = citizenId || application?.citizen_id;
  if (!application || !targetCustomerId) return;

  setImmediate(async () => {
    try {
      const customer = await getCustomerContactProfile(targetCustomerId);
      if (!customer) return;

      const appNumber = application.application_number;
      const service = serviceName || 'Public Service';
      const isApproved = String(decision).toUpperCase() === 'APPROVED';

      // 1. SMS Notification
      let smsResult = null;
      const phoneToUse = application.application_data?.phone || customer.phone;
      if (phoneToUse && isValidEthiopianPhone(phoneToUse)) {
        smsResult = await sendApplicationDecisionSMS(
          phoneToUse,
          appNumber,
          service,
          decision,
          notes,
          application.id
        );
      }

      // 2. Email Notification
      let emailResult = null;
      if (customer.email && isUserEmailVerified(customer)) {
        emailResult = await sendApplicationDecisionEmail({
          to: customer.email,
          recipientUser: customer,
          applicationNumber: appNumber,
          serviceName: service,
          institutionName,
          decision,
          notes,
          applicationId: application.id,
        });
      }

      // 3. Separate delivery tracking
      const deliveryTracking = buildDeliveryTracking({
        event: isApproved ? 'APPLICATION_APPROVED_NOTIFIED' : 'APPLICATION_REJECTED_NOTIFIED',
        referenceType: 'application',
        referenceId: application.id,
        referenceNumber: appNumber,
        recipientEmail: customer.email,
        recipientPhone: phoneToUse,
        emailResult,
        smsResult,
      });

      // 4. In-App Notification with independent tracking
      await createNotification({
        recipientId: customer.id,
        type: 'APPLICATION_UPDATE',
        title: isApproved ? 'Application Approved' : 'Application Decision Update',
        message: isApproved 
          ? `Congratulations! Your application #${appNumber} for ${service} has been approved.`
          : `Your application #${appNumber} for ${service} was not approved.${notes ? ` Reason: ${notes.trim()}` : ''}`,
        relatedEntityType: 'application',
        relatedEntityId: application.id,
        metadata: {
          delivery_tracking: deliveryTracking,
        }
      });

      await recordNotificationAudit(customer.id, 'APPLICATION_DECISION_NOTIFIED', deliveryTracking);

    } catch (err) {
      console.error('[NOTIF-ORCHESTRATOR] ❌ Error in dispatchApplicationDecisionNotifications:', err.message);
    }
  });
};

/**
 * 3.D - Event: Application or service genuinely completed
 */
export const dispatchApplicationCompletedNotifications = async ({
  application,
  citizenId,
  serviceName,
  institutionName = 'Hawassa MESOB Center',
  completedAt = null,
}) => {
  const targetCustomerId = citizenId || application?.citizen_id;
  if (!application || !targetCustomerId) return;

  setImmediate(async () => {
    try {
      const customer = await getCustomerContactProfile(targetCustomerId);
      if (!customer) return;

      const appNumber = application.application_number;
      const service = serviceName || 'Public Service';
      const completionDate = completedAt || new Date().toISOString();

      // 1. SMS Notification
      let smsResult = null;
      const phoneToUse = application.application_data?.phone || customer.phone;
      if (phoneToUse && isValidEthiopianPhone(phoneToUse)) {
        smsResult = await sendApplicationCompletedSMS(
          phoneToUse,
          appNumber,
          service,
          completionDate,
          application.id
        );
      }

      // 2. Email Notification
      let emailResult = null;
      if (customer.email && isUserEmailVerified(customer)) {
        emailResult = await sendApplicationCompletedEmail({
          to: customer.email,
          recipientUser: customer,
          applicationNumber: appNumber,
          serviceName: service,
          institutionName,
          completedAt: completionDate,
          applicationId: application.id,
        });
      }

      // 3. Separate delivery tracking
      const deliveryTracking = buildDeliveryTracking({
        event: 'APPLICATION_COMPLETED_NOTIFIED',
        referenceType: 'application',
        referenceId: application.id,
        referenceNumber: appNumber,
        recipientEmail: customer.email,
        recipientPhone: phoneToUse,
        emailResult,
        smsResult,
      });

      // 4. In-App Notification with independent tracking
      await createNotification({
        recipientId: customer.id,
        type: 'APPLICATION_UPDATE',
        title: 'Service Completed',
        message: `Your service application #${appNumber} for ${service} has been successfully completed. Please share your rating and feedback!`,
        relatedEntityType: 'application',
        relatedEntityId: application.id,
        metadata: {
          delivery_tracking: deliveryTracking,
        }
      });

      await recordNotificationAudit(customer.id, 'APPLICATION_COMPLETED_NOTIFIED', deliveryTracking);

    } catch (err) {
      console.error('[NOTIF-ORCHESTRATOR] ❌ Error in dispatchApplicationCompletedNotifications:', err.message);
    }
  });
};

/**
 * Fetch delivery tracking history for an application or queue entry
 */
export const getNotificationTrackingByEntity = async (entityId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, created_at, metadata')
      .eq('related_entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(n => ({
      notification_id: n.id,
      type: n.type,
      title: n.title,
      created_at: n.created_at,
      tracking: n.metadata?.delivery_tracking || null
    }));
  } catch (err) {
    return [];
  }
};

export const getCitizenContactProfile = getCustomerContactProfile;
