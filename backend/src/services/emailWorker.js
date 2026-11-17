import crypto from 'crypto';
import {
  fetchPendingBatch,
  markEmailSent,
  markEmailFailedOrRetry,
  getOutboxBacklogDepth,
} from './emailOutboxService.js';
import {
  dispatchEmail,
  getProviderMetrics,
  getActiveEmailProvider,
  setActiveEmailProvider,
} from './emailProviderFactory.js';
import {
  buildEmailHtml,
  maskEmail,
} from './emailService.js';

const WORKER_ID = `WORKER_${process.pid}_${crypto.randomUUID().slice(0, 8)}`;
let workerIntervalId = null;
let isProcessingBatch = false;
let isWorkerRunning = false;
let activeWorkerConcurrency = parseInt(process.env.EMAIL_WORKER_CONCURRENCY || '10', 10);
let activePollIntervalMs = parseInt(process.env.EMAIL_WORKER_POLL_INTERVAL_MS || '2500', 10);

// Worker runtime health & throughput telemetry
const workerTelemetry = {
  workerId: WORKER_ID,
  startedAt: null,
  lastHeartbeat: null,
  lastTickAt: null,
  totalProcessed: 0,
  totalSuccess: 0,
  totalFailed: 0,
  totalProcessingTimeMs: 0,
  rollingDeliveries: [], // timestamps of last deliveries for throughput calculation
};

const recordWorkerDelivery = (success, durationMs) => {
  const now = Date.now();
  workerTelemetry.totalProcessed++;
  workerTelemetry.totalProcessingTimeMs += durationMs;

  if (success) {
    workerTelemetry.totalSuccess++;
  } else {
    workerTelemetry.totalFailed++;
  }

  workerTelemetry.rollingDeliveries.push(now);
  // Keep only deliveries within the last 60 seconds
  const oneMinAgo = now - 60000;
  while (workerTelemetry.rollingDeliveries.length > 0 && workerTelemetry.rollingDeliveries[0] < oneMinAgo) {
    workerTelemetry.rollingDeliveries.shift();
  }
};

/**
 * Render email content based on template_name and payload
 */
export const renderOutboxContent = (templateName, payload = {}) => {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  switch (templateName) {
    case 'REGISTRATION_VERIFY': {
      const { name = 'Customer', code, token, verificationLink } = payload;
      const verifyUrl =
        verificationLink ||
        `${portalUrl}/signup?verify=true&email=${encodeURIComponent(payload.email || '')}&token=${encodeURIComponent(token || '')}`;

      const details = [
        {
          label: 'One-Time Verification Code',
          value: `<span style="font-size: 22px; font-weight: 800; letter-spacing: 4px; color: #1e3a8a;">${code || '------'}</span>`,
        },
        { label: 'Validity Period', value: '15 Minutes' },
        { label: 'Security Note', value: 'Single-use cryptographic token' },
      ];

      const html = buildEmailHtml({
        heading: 'Verify Your Hawassa MESOB Account',
        badgeText: 'Account Security',
        badgeColor: '#10b981',
        greeting: `Hello ${name}`,
        bodyText:
          'Thank you for registering on the Hawassa MESOB Public Service Management System. Please confirm your email address using the one-time code below or click the direct verification button.',
        details,
        actionButton: {
          label: 'Verify Email Address',
          url: verifyUrl,
        },
        note: 'This verification link and OTP code are single-use and will expire in 15 minutes. Unverified accounts cannot register for live queues.',
      });

      const text = `Hawassa MESOB Account Verification\n\nHello ${name},\nYour verification code is: ${code}\nValid for 15 minutes.\nOr verify directly at: ${verifyUrl}`;
      return { html, text };
    }

    case 'QUEUE_CONFIRMATION': {
      const {
        customerName = 'Customer',
        institutionName = 'Hawassa MESOB Center',
        serviceName = 'Public Service',
        ticketNumber = 'N/A',
        queuePosition = 1,
        registrationDate,
        trackingLink,
      } = payload;

      const trackUrl = trackingLink || `${portalUrl}/dashboard/customer`;
      const formattedDate = registrationDate
        ? new Date(registrationDate).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

      const details = [
        {
          label: 'Ticket Number',
          value: `<span style="font-size: 20px; font-weight: 800; color: #1e3a8a;">#${ticketNumber}</span>`,
        },
        { label: 'Institution', value: institutionName },
        { label: 'Service Requested', value: serviceName },
        {
          label: 'Current Queue Position',
          value: `Position #${queuePosition} in line`,
        },
        { label: 'Registration Time', value: formattedDate },
      ];

      const html = buildEmailHtml({
        heading: `Queue Ticket #${ticketNumber} Confirmed`,
        badgeText: 'Queue Ticket Confirmed',
        badgeColor: '#314ea1',
        greeting: `Hello ${customerName}`,
        bodyText: `Your queue registration for <strong>${serviceName}</strong> at <strong>${institutionName}</strong> has been confirmed. Please monitor your live position on your customer portal.`,
        details,
        actionButton: {
          label: 'Track My Live Queue Position',
          url: trackUrl,
        },
        note: 'When your ticket is called, you will receive an immediate turn notification indicating your assigned service counter.',
      });

      const text = `Hawassa MESOB Ticket Confirmed\n\nHello ${customerName},\nYour ticket #${ticketNumber} for ${serviceName} at ${institutionName} is confirmed.\nQueue Position: #${queuePosition}\nRegistration Time: ${formattedDate}\nTrack status: ${trackUrl}`;
      return { html, text };
    }

    case 'QUEUE_TURN': {
      const {
        customerName = 'Customer',
        ticketNumber = 'N/A',
        institutionName = 'Hawassa MESOB Center',
        serviceName = 'Public Service',
        counterNumber = '1',
        instructions = 'Please proceed immediately to the counter with your National ID.',
      } = payload;

      const details = [
        {
          label: 'Called Ticket',
          value: `<span style="font-size: 22px; font-weight: 800; color: #047857;">#${ticketNumber}</span>`,
        },
        {
          label: 'Assigned Counter',
          value: `<strong style="font-size: 16px; color: #0f172a;">Counter #${counterNumber}</strong>`,
        },
        { label: 'Institution', value: institutionName },
        { label: 'Service Desk', value: serviceName },
      ];

      const html = buildEmailHtml({
        heading: `It's Your Turn! Ticket #${ticketNumber}`,
        badgeText: 'Now Serving',
        badgeColor: '#059669',
        greeting: `Hello ${customerName}`,
        bodyText: `Your queue ticket <strong>#${ticketNumber}</strong> has just been called by the service officer. Please proceed immediately to <strong>Counter #${counterNumber}</strong>.`,
        details,
        actionButton: {
          label: 'Open Live Counter Display',
          url: `${portalUrl}/dashboard/customer`,
        },
        note: `${instructions} Please have your documents ready to ensure quick service delivery.`,
      });

      const text = `Hawassa MESOB Alert: Your ticket #${ticketNumber} has been called!\nPlease proceed immediately to Counter #${counterNumber} at ${institutionName}.\nInstructions: ${instructions}`;
      return { html, text };
    }

    case 'QUEUE_COMPLETED': {
      const {
        customerName = 'Customer',
        ticketNumber = 'N/A',
        serviceName = 'Public Service',
        institutionName = 'Hawassa MESOB Center',
        completedAt,
        feedbackLink,
      } = payload;

      const fbUrl = feedbackLink || `${portalUrl}/dashboard/customer`;
      const formattedDate = completedAt
        ? new Date(completedAt).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

      const details = [
        { label: 'Ticket Reference', value: `#${ticketNumber}` },
        { label: 'Service Provided', value: serviceName },
        { label: 'Institution', value: institutionName },
        { label: 'Completed On', value: formattedDate },
        { label: 'Status', value: '<span style="color: #059669; font-weight: 700;">Completed</span>' },
      ];

      const html = buildEmailHtml({
        heading: `Service Completed for Ticket #${ticketNumber}`,
        badgeText: 'Service Complete',
        badgeColor: '#10b981',
        greeting: `Hello ${customerName}`,
        bodyText: `Your service request for <strong>${serviceName}</strong> at <strong>${institutionName}</strong> has been successfully completed. We strive for excellence and would appreciate your valuable rating and feedback.`,
        details,
        actionButton: {
          label: 'Rate Service & Submit Feedback',
          url: fbUrl,
        },
        note: 'Thank you for choosing Hawassa MESOB Integrated Public Services.',
      });

      const text = `Hawassa MESOB: Your service #${ticketNumber} for ${serviceName} was completed on ${formattedDate}.\nPlease rate your service experience: ${fbUrl}`;
      return { html, text };
    }

    default: {
      return {
        html: payload.html || `<p>${payload.text || 'Hawassa MESOB Notification'}</p>`,
        text: payload.text || 'Hawassa MESOB Notification',
      };
    }
  }
};

/**
 * Process a single email outbox item
 */
const processOutboxItem = async (item) => {
  const startTime = Date.now();
  try {
    const { html, text } = renderOutboxContent(item.template_name, item.payload);

    const result = await dispatchEmail({
      to: item.recipient_email,
      subject: item.subject,
      html,
      text,
    });

    const duration = Date.now() - startTime;
    if (result.success) {
      await markEmailSent(item.id, result.messageId || 'OK');
      recordWorkerDelivery(true, duration);
      console.log(`[WORKER] ✅ Email sent to ${maskEmail(item.recipient_email)} (${item.template_name}) via [${result.provider || 'default'}] in ${duration}ms`);
    } else {
      const nextAttempt = (item.attempts || 0) + 1;
      const { status } = await markEmailFailedOrRetry(
        item.id,
        result.message || 'Dispatch failure',
        nextAttempt,
        item.max_attempts || 5
      );
      recordWorkerDelivery(false, duration);
      console.warn(
        `[WORKER] ⚠️ Email to ${maskEmail(item.recipient_email)} failed (attempt ${nextAttempt}/${item.max_attempts}): status=${status}`
      );
    }
  } catch (err) {
    const duration = Date.now() - startTime;
    const nextAttempt = (item.attempts || 0) + 1;
    await markEmailFailedOrRetry(
      item.id,
      err.message || 'Unexpected worker exception',
      nextAttempt,
      item.max_attempts || 5
    );
    recordWorkerDelivery(false, duration);
    console.error(`[WORKER] ❌ Error processing item ${item.id}:`, err.message);
  }
};

/**
 * Process one tick / batch of pending outbox emails
 */
export const runWorkerTick = async () => {
  if (isProcessingBatch) return;
  isProcessingBatch = true;
  workerTelemetry.lastHeartbeat = new Date().toISOString();
  workerTelemetry.lastTickAt = workerTelemetry.lastHeartbeat;

  try {
    const batch = await fetchPendingBatch(activeWorkerConcurrency, WORKER_ID);
    if (!batch || batch.length === 0) {
      return;
    }

    console.log(`[WORKER] 🚀 Worker [${WORKER_ID}] processing batch of ${batch.length} emails (concurrency=${activeWorkerConcurrency})...`);
    await Promise.allSettled(batch.map((item) => processOutboxItem(item)));

    // Continuous backlog draining: if a full batch was claimed, immediately run next tick
    if (batch.length === activeWorkerConcurrency) {
      setImmediate(() => {
        runWorkerTick().catch(() => {});
      });
    }
  } catch (err) {
    console.error('[WORKER] Error in worker tick:', err.message);
  } finally {
    isProcessingBatch = false;
  }
};

/**
 * Get aggregated health and backlog telemetry for administrators
 */
export const getWorkerHealth = async () => {
  const backlog = await getOutboxBacklogDepth();
  const providerMetrics = getProviderMetrics();
  const now = Date.now();
  const oneMinAgo = now - 60000;
  const recentCount = workerTelemetry.rollingDeliveries.filter((t) => t >= oneMinAgo).length;

  const avgProcessTime =
    workerTelemetry.totalProcessed > 0
      ? Math.round(workerTelemetry.totalProcessingTimeMs / workerTelemetry.totalProcessed)
      : 0;

  return {
    workerId: WORKER_ID,
    isRunning: isWorkerRunning,
    concurrency: activeWorkerConcurrency,
    pollIntervalMs: activePollIntervalMs,
    startedAt: workerTelemetry.startedAt,
    lastHeartbeat: workerTelemetry.lastHeartbeat,
    throughputPerMinute: recentCount,
    averageProcessingLatencyMs: avgProcessTime,
    totalProcessed: workerTelemetry.totalProcessed,
    totalSuccess: workerTelemetry.totalSuccess,
    totalFailed: workerTelemetry.totalFailed,
    backlog,
    provider: providerMetrics,
  };
};

/**
 * Update worker concurrency dynamically
 */
export const setWorkerConcurrency = (concurrency) => {
  const parsed = parseInt(concurrency, 10);
  if (parsed && parsed >= 1 && parsed <= 100) {
    activeWorkerConcurrency = parsed;
    console.log(`[WORKER] Concurrency updated to: ${activeWorkerConcurrency}`);
    return true;
  }
  return false;
};

/**
 * Start the email background worker
 */
export const startEmailWorker = () => {
  if (isWorkerRunning) return;
  isWorkerRunning = true;
  workerTelemetry.startedAt = new Date().toISOString();
  workerTelemetry.lastHeartbeat = workerTelemetry.startedAt;

  console.log(`[WORKER] 📬 Hawassa MESOB Email Worker [${WORKER_ID}] started (poll=${activePollIntervalMs}ms, concurrency=${activeWorkerConcurrency})`);

  // Register global immediate trigger
  global.__MESOB_EMAIL_WORKER_TRIGGER__ = () => {
    runWorkerTick().catch(() => {});
  };

  // Immediate first run
  runWorkerTick().catch(() => {});

  // Periodic polling interval for retries and pending tasks
  workerIntervalId = setInterval(() => {
    runWorkerTick().catch(() => {});
  }, activePollIntervalMs);
};

/**
 * Stop the worker gracefully
 */
export const stopEmailWorker = () => {
  if (workerIntervalId) {
    clearInterval(workerIntervalId);
    workerIntervalId = null;
  }
  isWorkerRunning = false;
  delete global.__MESOB_EMAIL_WORKER_TRIGGER__;
  console.log('[WORKER] 🛑 Hawassa MESOB Email Worker stopped.');
};
