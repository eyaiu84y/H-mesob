import nodemailer from 'nodemailer';
import { supabase } from '../config/supabase.js';

/**
 * Mask email address for logging and privacy protection
 * Example: eyasu.mesob@gmail.com -> e***b@gmail.com
 */
export const maskEmail = (email) => {
  if (!email) return 'N/A';
  const parts = email.toString().trim().split('@');
  if (parts.length !== 2) return '***';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length <= 2 ? name[0] + '*' : name[0] + '***' + name[name.length - 1];
  return `${maskedName}@${domain}`;
};

/**
 * Validates basic email structure
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Checks whether a user's email address has been verified.
 * Internal staff are pre-verified by administrator onboarding.
 * Citizens must have verified their email address via verification code.
 */
export const isUserEmailVerified = (user) => {
  if (!user) return false;
  
  const roleUpper = String(user.role || '').toUpperCase();
  const internalRoles = ['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER', 'EMPLOYEE', 'ICT_STAFF', 'TECHNICIAN'];
  if (internalRoles.includes(roleUpper)) {
    return true;
  }

  // Explicitly unverified citizen accounts
  if (user.metadata?.email_verification?.verified === false) {
    return false;
  }

  // Check direct column or metadata verification block
  if (user.email_verified === true) return true;
  if (user.metadata?.email_verification?.verified === true) return true;

  // Active registered customer accounts in the database without an explicit false flag
  if (user.email && (!user.metadata || user.metadata.email_verification === undefined)) {
    return true;
  }

  return false;
};

// ── Transporter Configuration ────────────────────────────────────
let transporter = null;
const isEmailEnabled = (process.env.EMAIL_ENABLED || 'true').toLowerCase() === 'true';

const createTransporter = () => {
  try {
    const user = (process.env.GMAIL_USER || process.env.EMAIL_USER || '').trim();
    const pass = (process.env.GMAIL_PASS || process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '');
    const service = (process.env.EMAIL_SERVICE || 'gmail').toLowerCase();

    if (!user || !pass) {
      console.log('⚠️ Email Service: GMAIL_USER/EMAIL_USER or GMAIL_PASS/EMAIL_PASS not configured. Emails will be simulated in development mode.');
      return null;
    }

    if (service === 'gmail') {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
      });
    }

    // Generic SMTP fallback
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: user.trim(),
        pass: pass.trim(),
      },
    });
  } catch (err) {
    console.error('❌ Failed to create email transporter:', err.message);
    return null;
  }
};

transporter = createTransporter();

// ── In-Memory Idempotency Cache ──────────────────────────────────
// Prevents duplicate emails for the same event key within 5 minutes
const sentEmailCache = new Map();
const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000;

const isDuplicateEmail = (key) => {
  if (!key) return false;
  const now = Date.now();
  // Clean expired keys
  for (const [k, timestamp] of sentEmailCache.entries()) {
    if (now - timestamp > IDEMPOTENCY_TTL_MS) {
      sentEmailCache.delete(k);
    }
  }
  if (sentEmailCache.has(key)) {
    return true;
  }
  sentEmailCache.set(key, now);
  return false;
};

/**
 * Base email sending function with error isolation and logging
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  idempotencyKey = null,
  recipientUser = null,
  allowUnverified = false,
  allowAdminRecipient = false,
}) => {
  try {
    if (!to || !isValidEmail(to)) {
      return {
        success: false,
        message: 'Invalid recipient email address',
        skipped: true,
      };
    }

    const senderEmail = (process.env.GMAIL_USER || process.env.EMAIL_USER || 'no-reply@mesobcenterh.gov.et').trim();
    const recipientLower = to.trim().toLowerCase();
    const senderLower = senderEmail.toLowerCase();

    // Guardrail: Customer notices must never route to the system sender account as a fallback
    if (recipientLower === senderLower && !allowAdminRecipient) {
      console.warn(`[EMAIL] ⚠️ Prevented customer notification dispatch to system sender account (${maskEmail(to)}). Notifications must target verified customer database emails.`);
      return {
        success: false,
        message: 'Customer notifications cannot be delivered to the system sender account (GMAIL_USER). Genuine customer recipient required.',
        skipped: true,
        reason: 'SENDER_CANNOT_BE_CUSTOMER_RECIPIENT',
      };
    }

    // Verify contact verification status if recipient user object is provided
    if (!allowUnverified && recipientUser && !isUserEmailVerified(recipientUser)) {
      console.log(`[EMAIL] ℹ️ Recipient ${maskEmail(to)} is not verified. Skipping email dispatch to protect privacy.`);
      return {
        success: false,
        message: 'Recipient email address is not verified',
        skipped: true,
        reason: 'UNVERIFIED_EMAIL',
      };
    }

    // Idempotency check
    if (idempotencyKey && isDuplicateEmail(idempotencyKey)) {
      console.log(`[EMAIL] ℹ️ Deduplicated email dispatch for key: ${idempotencyKey}`);
      return {
        success: true,
        message: 'Email deduplicated (already processed)',
        deduplicated: true,
      };
    }

    if (!isEmailEnabled) {
      console.log(`[EMAIL] ℹ️ Email disabled in environment (EMAIL_ENABLED=false). Simulated dispatch to ${maskEmail(to)}: "${subject}"`);
      return {
        success: true,
        message: 'Email dispatch simulated (EMAIL_ENABLED=false)',
        simulated: true,
      };
    }

    let fromAddress = process.env.EMAIL_FROM || `"Hawassa MESOB Integrated Public Services" <${senderEmail}>`;
    if (!fromAddress.includes('@')) {
      fromAddress = `"${fromAddress}" <${senderEmail}>`;
    }

    if (!transporter) {
      // Re-attempt creation in case env vars were set after boot
      transporter = createTransporter();
      if (!transporter) {
        console.log(`[EMAIL] ℹ️ Email credentials not configured. Simulated dispatch to ${maskEmail(to)}: "${subject}"`);
        return {
          success: true,
          message: 'Email credentials not configured; simulated successfully',
          simulated: true,
        };
      }
    }

    console.log(`[EMAIL] 📨 Dispatching email to ${maskEmail(to)} | Subject: "${subject}"`);

    const mailOptions = {
      from: fromAddress,
      to: to.trim(),
      subject: subject.trim(),
      text: text || '',
      html: html || '',
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] ✅ Email accepted by provider. MessageId: ${info.messageId || 'OK'}`);

    return {
      success: true,
      message: 'Email accepted by provider',
      messageId: info.messageId,
      accepted: info.accepted,
    };
  } catch (error) {
    console.error(`[EMAIL] ❌ Email delivery error for ${maskEmail(to)}:`, error.message);
    return {
      success: false,
      message: error.message || 'Failed to dispatch email',
      error: error.toString(),
    };
  }
};

// ── HTML Email Template Builder ──────────────────────────────────
const buildEmailHtml = ({
  heading,
  badgeText = 'Official Notice',
  badgeColor = '#1e3a8a',
  greeting = 'Dear Customer',
  bodyText,
  details = [],
  actionButton = null,
  note = null,
}) => {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const cta = actionButton || {
    label: 'Open Customer Dashboard',
    url: `${portalUrl}/dashboard`,
  };

  const detailsRows = details
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; font-weight: 600; width: 40%;">${item.label}</td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 13px; font-weight: 700;">${item.value}</td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.05);">
          
          <!-- Top Decorative Bar -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #1e3a8a 0%, #314ea1 50%, #f4b51a 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; background-color: #0f172a; color: #ffffff;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display: inline-block; padding: 4px 10px; background-color: rgba(244, 181, 26, 0.15); border: 1px solid rgba(244, 181, 26, 0.35); border-radius: 9999px; color: #f4b51a; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                      FDRE • Hawassa MESOB
                    </span>
                    <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      Hawassa MESOB Public Services
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">
                      Integrated Public Service Information System
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              
              <!-- Greeting & Main Message -->
              <div style="margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #1e3a8a;">
                  ${greeting},
                </p>
                <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 800; color: #0f172a; line-height: 1.35;">
                  ${heading}
                </h2>
                <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.6;">
                  ${bodyText}
                </p>
              </div>

              <!-- Details Table -->
              ${
                details.length > 0
                  ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
                ${detailsRows}
              </table>
              `
                  : ''
              }

              <!-- Important Note -->
              ${
                note
                  ? `
              <div style="background-color: #eff6ff; border-left: 4px solid #314ea1; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; color: #1e3a8a; line-height: 1.5;">
                  <strong>Please note:</strong> ${note}
                </p>
              </div>
              `
                  : ''
              }

              <!-- Action CTA -->
              <div style="text-align: center; margin: 32px 0 16px 0;">
                <a href="${cta.url}" style="display: inline-block; padding: 12px 28px; background-color: #1e3a8a; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2);">
                  ${cta.label} →
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;">
                FDRE Hawassa MESOB Integrated Public Service Center • Sidama Region, Ethiopia
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                This is an automated operational notification regarding your service application or queue ticket. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

// ── Queue Notification Emails ────────────────────────────────────

/**
 * 2.A - Customer successfully joins a queue
 */
export const sendQueueJoinEmail = async ({
  to,
  recipientUser,
  queueNumber,
  serviceName,
  institutionName = 'Hawassa MESOB Center',
  position,
  estimatedWaitMinutes,
  queueEntryId,
}) => {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const subject = `Hawassa MESOB — Your queue ticket #${queueNumber} is confirmed`;
  const name = recipientUser?.name || recipientUser?.full_name || 'Customer';

  const details = [
    { label: 'Queue Ticket', value: `#${queueNumber}` },
    { label: 'Service Requested', value: serviceName || 'Public Service' },
    { label: 'Institution', value: institutionName },
    { label: 'Current Status', value: 'Waiting in Queue' },
    {
      label: 'Estimated Position',
      value: position ? `Position #${position}` : 'Confirmed in line',
    },
  ];

  if (estimatedWaitMinutes) {
    details.push({
      label: 'Estimated Wait',
      value: `Approx. ${estimatedWaitMinutes} minutes`,
    });
  }

  const html = buildEmailHtml({
    heading: `Queue Ticket #${queueNumber} Confirmed`,
    greeting: `Hello ${name}`,
    bodyText: `Your queue registration for <strong>${serviceName || 'Public Service'}</strong> at <strong>${institutionName}</strong> has been received and confirmed. Please monitor your live status on your customer portal.`,
    details,
    actionButton: {
      label: 'Check My Live Queue',
      url: `${portalUrl}/dashboard`,
    },
    note: 'When your ticket is called, you will receive an immediate SMS and email notification indicating your assigned counter.',
  });

  const text = `Hawassa MESOB Notification\n\nHello ${name},\nYour queue ticket #${queueNumber} for ${serviceName || 'Public Service'} at ${institutionName} is confirmed.\nStatus: Waiting in Queue\nEstimated Position: ${position ? `#${position}` : 'In queue'}\nCheck your dashboard for real-time updates: ${portalUrl}/dashboard`;

  return sendEmail({
    to,
    subject,
    html,
    text,
    idempotencyKey: `QUEUE_JOIN:${queueEntryId || queueNumber}`,
    recipientUser,
  });
};

/**
 * 2.B - Customer's ticket is called
 */
export const sendQueueCallEmail = async ({
  to,
  recipientUser,
  queueNumber,
  serviceName,
  institutionName = 'Hawassa MESOB Center',
  counterNumber = '1',
  queueEntryId,
}) => {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const subject = `Hawassa MESOB — Your ticket #${queueNumber} has been called!`;
  const name = recipientUser?.name || recipientUser?.full_name || 'Customer';

  const details = [
    { label: 'Called Ticket', value: `#${queueNumber}` },
    { label: 'Service', value: serviceName || 'Public Service' },
    { label: 'Assigned Counter', value: `Counter #${counterNumber}` },
    { label: 'Institution', value: institutionName },
  ];

  const html = buildEmailHtml({
    heading: `It's Your Turn! Ticket #${queueNumber}`,
    greeting: `Hello ${name}`,
    bodyText: `Your queue ticket <strong>#${queueNumber}</strong> has just been called by the service desk. Please proceed immediately to <strong>Counter #${counterNumber}</strong> to be served.`,
    details,
    actionButton: {
      label: 'View Queue Display',
      url: `${portalUrl}/dashboard`,
    },
    note: 'Please bring your national ID card and any required service documents with you to the service window.',
  });

  const text = `Hawassa MESOB Alert: Your ticket #${queueNumber} for ${serviceName || 'Public Service'} has been called!\nPlease proceed immediately to Counter #${counterNumber} at ${institutionName}.\nView details: ${portalUrl}/dashboard`;

  return sendEmail({
    to,
    subject,
    html,
    text,
    idempotencyKey: `QUEUE_CALL:${queueEntryId || queueNumber}`,
    recipientUser,
  });
};

// ── Application Tracking Emails ──────────────────────────────────

/**
 * 3.A - Application submitted confirmation
 */
export const sendApplicationSubmittedEmail = async ({
  to,
  recipientUser,
  applicationNumber,
  serviceName,
  institutionName = 'Hawassa MESOB Center',
  submittedAt,
  applicationId,
}) => {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const subject = `Hawassa MESOB — Application #${applicationNumber} submitted successfully`;
  const name = recipientUser?.name || recipientUser?.full_name || 'Customer';

  const formattedDate = submittedAt
    ? new Date(submittedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const details = [
    { label: 'Application Ref', value: `#${applicationNumber}` },
    { label: 'Service', value: serviceName || 'Public Service Application' },
    { label: 'Submitted Date', value: formattedDate },
    { label: 'Initial Status', value: 'Received & Awaiting Review' },
  ];

  const html = buildEmailHtml({
    heading: `Application #${applicationNumber} Received`,
    greeting: `Hello ${name}`,
    bodyText: `Your application for <strong>${serviceName || 'Public Service'}</strong> has been successfully submitted to Hawassa MESOB. Staff will review your information and verify your uploaded documents.`,
    details,
    actionButton: {
      label: 'Track My Application',
      url: `${portalUrl}/dashboard`,
    },
    note: 'You can check your application review status and download official verification updates through your authenticated customer dashboard.',
  });

  const text = `Hawassa MESOB: Your application #${applicationNumber} for ${serviceName || 'Public Service'} was submitted on ${formattedDate}.\nTrack progress: ${portalUrl}/dashboard`;

  return sendEmail({
    to,
    subject,
    html,
    text,
    idempotencyKey: `APP_SUBMIT:${applicationId || applicationNumber}`,
    recipientUser,
  });
};

/**
 * 3.B - Application requires additional information
 */
export const sendApplicationActionRequiredEmail = async ({
  to,
  recipientUser,
  applicationNumber,
  serviceName,
  institutionName = 'Hawassa MESOB Center',
  notes,
  applicationId,
}) => {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const subject = `Hawassa MESOB — Action required: Additional information needed for application #${applicationNumber}`;
  const name = recipientUser?.name || recipientUser?.full_name || 'Customer';

  const details = [
    { label: 'Application Ref', value: `#${applicationNumber}` },
    { label: 'Service', value: serviceName || 'Public Service' },
    { label: 'Institution', value: institutionName },
    { label: 'Status', value: 'Action Required (Pending Documents)' },
  ];

  if (notes) {
    details.push({ label: 'Officer Instructions', value: notes });
  }

  const html = buildEmailHtml({
    heading: `Action Required for Application #${applicationNumber}`,
    greeting: `Hello ${name}`,
    bodyText: `During the official review of your application for <strong>${serviceName || 'Public Service'}</strong>, the reviewing officer requested additional information or documentation to complete your request.`,
    details,
    actionButton: {
      label: 'Sign In to Review & Upload',
      url: `${portalUrl}/dashboard`,
    },
    note: 'For your security, sensitive documents should only be uploaded directly through your official Hawassa MESOB customer portal. Do not send confidential documents by return email.',
  });

  const text = `Hawassa MESOB Action Required: Additional information or documents are needed for application #${applicationNumber} (${serviceName || 'Public Service'}).\nOfficer Instructions: ${notes || 'Please sign in to view required items'}.\nSign in to review requirements: ${portalUrl}/dashboard`;

  return sendEmail({
    to,
    subject,
    html,
    text,
    idempotencyKey: `APP_ACTION_REQ:${applicationId || applicationNumber}:${new Date().toDateString()}`,
    recipientUser,
  });
};

/**
 * 3.C - Application decision (Approved or Rejected)
 */
export const sendApplicationDecisionEmail = async ({
  to,
  recipientUser,
  applicationNumber,
  serviceName,
  institutionName = 'Hawassa MESOB Center',
  decision, // 'APPROVED' or 'REJECTED'
  notes,
  applicationId,
}) => {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const isApproved = String(decision).toUpperCase() === 'APPROVED';
  const subject = isApproved
    ? `Hawassa MESOB — Application #${applicationNumber} has been approved`
    : `Hawassa MESOB — Application #${applicationNumber} decision update`;
  const name = recipientUser?.name || recipientUser?.full_name || 'Customer';

  const details = [
    { label: 'Application Ref', value: `#${applicationNumber}` },
    { label: 'Service', value: serviceName || 'Public Service' },
    { label: 'Institution', value: institutionName },
    {
      label: 'Decision',
      value: isApproved ? 'APPROVED' : 'NOT APPROVED (REJECTED)',
    },
  ];

  if (!isApproved && notes) {
    details.push({ label: 'Decision Reason', value: notes });
  }

  const heading = isApproved
    ? `Application #${applicationNumber} Approved`
    : `Decision on Application #${applicationNumber}`;

  const bodyText = isApproved
    ? `We are pleased to inform you that your application for <strong>${serviceName || 'Public Service'}</strong> has been officially approved. Please log in to your dashboard to review next steps or download your approval letter.`
    : `Your application for <strong>${serviceName || 'Public Service'}</strong> has been reviewed and was not approved. Please sign in to your dashboard to read the full decision details.`;

  const html = buildEmailHtml({
    heading,
    greeting: `Hello ${name}`,
    bodyText,
    details,
    actionButton: {
      label: 'View Application Details',
      url: `${portalUrl}/dashboard`,
    },
    note: isApproved
      ? 'If your service requires counter collection or certificate pick-up, bring your reference number and national ID.'
      : 'You can re-apply after addressing the listed criteria or contact MESOB customer support for guidance.',
  });

  const text = isApproved
    ? `Hawassa MESOB: Your application #${applicationNumber} for ${serviceName || 'Public Service'} has been APPROVED.\nLog in to view next steps: ${portalUrl}/dashboard`
    : `Hawassa MESOB: Your application #${applicationNumber} for ${serviceName || 'Public Service'} was not approved.${notes ? ` Reason: ${notes}` : ''}\nView details: ${portalUrl}/dashboard`;

  return sendEmail({
    to,
    subject,
    html,
    text,
    idempotencyKey: `APP_DECISION:${applicationId || applicationNumber}:${decision}`,
    recipientUser,
  });
};

/**
 * 3.D - Application or service genuinely completed
 */
export const sendApplicationCompletedEmail = async ({
  to,
  recipientUser,
  applicationNumber,
  serviceName,
  institutionName = 'Hawassa MESOB Center',
  completedAt,
  applicationId,
}) => {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const subject = `Hawassa MESOB — Your service application has been completed`;
  const name = recipientUser?.name || recipientUser?.full_name || 'Customer';

  const formattedDate = completedAt
    ? new Date(completedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const details = [
    { label: 'Application Ref', value: `#${applicationNumber}` },
    { label: 'Service', value: serviceName || 'Public Service' },
    { label: 'Institution', value: institutionName },
    { label: 'Final Status', value: 'Completed' },
    { label: 'Completion Date', value: formattedDate },
  ];

  const html = buildEmailHtml({
    heading: `Service Application #${applicationNumber} Completed`,
    greeting: `Hello ${name}`,
    bodyText: `Your public service request for <strong>${serviceName || 'Public Service'}</strong> has been confirmed as fully completed by Hawassa MESOB Center. We value your feedback to help us continuously enhance public service delivery.`,
    details,
    actionButton: {
      label: 'Rate Service & Provide Feedback',
      url: `${portalUrl}/dashboard`,
    },
    note: 'Thank you for using the Hawassa MESOB Integrated Public Service System.',
  });

  const text = `Hawassa MESOB: Your service application #${applicationNumber} for ${serviceName || 'Public Service'} has been completed on ${formattedDate}.\nPlease sign in to your dashboard to share your feedback: ${portalUrl}/dashboard`;

  return sendEmail({
    to,
    subject,
    html,
    text,
    idempotencyKey: `APP_COMPLETED:${applicationId || applicationNumber}`,
    recipientUser,
  });
};

/**
 * Customer email verification email with 6-digit code and direct link
 */
export const sendCustomerVerificationEmail = async ({
  to,
  recipientUser = null,
  code,
  token = null,
}) => {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const subject = `Hawassa MESOB — Verify your customer email address (${code})`;
  const name = recipientUser?.name || recipientUser?.full_name || 'Customer';

  const verificationLink = token
    ? `${portalUrl}/signup?verify=true&email=${encodeURIComponent(to)}&token=${encodeURIComponent(token)}`
    : `${portalUrl}/signup?verify=true&email=${encodeURIComponent(to)}`;

  const details = [
    { label: 'One-Time Verification Code', value: `<span style="font-size: 22px; font-weight: 800; letter-spacing: 4px; color: #1e3a8a;">${code}</span>` },
    { label: 'Valid For', value: '15 Minutes' },
    { label: 'Account Email', value: maskEmail(to) },
  ];

  const html = buildEmailHtml({
    heading: 'Verify Your Email Address',
    badgeText: 'Account Verification',
    badgeColor: '#10b981',
    greeting: `Hello ${name}`,
    bodyText: `Thank you for registering with Hawassa MESOB Integrated Public Service System. To activate all customer services, verify your email address using the one-time code below or click the verification button.`,
    details,
    actionButton: {
      label: 'Verify Email Address',
      url: verificationLink,
    },
    note: 'This code and link are single-use and will expire in 15 minutes. If you did not create an account on Hawassa MESOB, please disregard this email.',
  });

  const text = `Hawassa MESOB Account Verification\n\nHello ${name},\nYour verification code is: ${code}\nValid for 15 minutes.\n\nOr click here to verify directly: ${verificationLink}`;

  return sendEmail({
    to,
    subject,
    html,
    text,
    idempotencyKey: `EMAIL_VERIFY:${to}:${token || code}`,
    allowUnverified: true,
  });
};
