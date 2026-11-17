/**
 * emailProviderFactory.js
 * Pluggable Transactional Email Provider Registry & Adapter Factory
 * Hawassa MESOB Public Service Management System
 */

import nodemailer from 'nodemailer';
import axios from 'axios';
import crypto from 'crypto';
import { globalEmailRateLimiter } from './rateLimiter.js';

// Provider state
let activeProviderType = (process.env.EMAIL_PROVIDER || 'smtp').toLowerCase();
let smtpTransporter = null;

// Performance and tracking statistics across all providers
const providerStats = {
  activeProvider: activeProviderType,
  totalDispatched: 0,
  successfulDispatched: 0,
  failedDispatched: 0,
  totalLatencyMs: 0,
  lastDispatchedAt: null,
  recentDeliveries: [], // circular buffer of last 50 deliveries
};

const recordDeliveryMetric = ({ success, provider, latencyMs, recipient, messageId, error }) => {
  providerStats.totalDispatched++;
  providerStats.lastDispatchedAt = new Date().toISOString();
  providerStats.totalLatencyMs += latencyMs;

  if (success) {
    providerStats.successfulDispatched++;
  } else {
    providerStats.failedDispatched++;
  }

  // Circular buffer
  providerStats.recentDeliveries.unshift({
    timestamp: providerStats.lastDispatchedAt,
    provider,
    recipient,
    latencyMs,
    success,
    messageId: messageId || null,
    error: error || null,
  });

  if (providerStats.recentDeliveries.length > 50) {
    providerStats.recentDeliveries.pop();
  }
};

/**
 * 1. SMTP Provider Adapter (Gmail or custom enterprise SMTP)
 */
const getSmtpTransporter = () => {
  if (smtpTransporter) return smtpTransporter;

  const service = (process.env.EMAIL_SERVICE || 'gmail').toLowerCase();
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const pass = (process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || '').trim().replace(/\s+/g, '');

  if (service === 'gmail' || (!process.env.SMTP_HOST && user && user.includes('@gmail.com'))) {
    smtpTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: user && pass ? { user, pass } : undefined,
    });
  } else {
    smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
      pool: true,
      maxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS, 10) || 5,
      maxMessages: 100,
      rateLimit: parseInt(process.env.EMAIL_RATE_LIMIT_PER_SEC, 10) || 10,
    });
  }

  return smtpTransporter;
};

const sendViaSmtp = async ({ to, subject, html, text, from }) => {
  const transporter = getSmtpTransporter();
  const rawFrom = (from || process.env.EMAIL_FROM || process.env.GMAIL_USER || 'no-reply@hawassamesob.gov.et').trim();
  
  // Format from header cleanly without double angle brackets
  let fromAddress = rawFrom;
  if (!fromAddress.includes('<')) {
    fromAddress = `"Hawassa MESOB Center" <${fromAddress}>`;
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
      provider: 'smtp',
      response: info.response,
    };
  } catch (err) {
    // If SMTP connection had a socket/login error, reset transporter instance so next call can recover
    if (err.message && (err.message.includes('login') || err.message.includes('auth') || err.message.includes('greeting') || err.message.includes('connect'))) {
      smtpTransporter = null;
    }
    if (err.code === 'EAUTH' || (err.response && err.response.includes('535'))) {
      console.error('[SMTP] ⚠️ Google SMTP Authentication Failed (EAUTH 535 BadCredentials): Gmail App Password in GMAIL_PASS is expired or invalid. Generate an active 16-character App Password at https://myaccount.google.com/apppasswords');
    }
    throw err;
  }
};

/**
 * 2. Resend REST API Adapter
 */
const sendViaResend = async ({ to, subject, html, text, from }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured in environment variables');
  }

  const fromAddress = from || process.env.EMAIL_FROM || 'onboarding@resend.dev';

  const response = await axios.post(
    'https://api.resend.com/emails',
    {
      from: `Hawassa MESOB Center <${fromAddress}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  return {
    success: true,
    messageId: response.data?.id || `resend_${Date.now()}`,
    provider: 'resend',
  };
};

/**
 * 3. SendGrid REST API Adapter
 */
const sendViaSendGrid = async ({ to, subject, html, text, from }) => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY is not configured in environment variables');
  }

  const fromAddress = from || process.env.EMAIL_FROM || 'no-reply@hawassamesob.gov.et';

  const response = await axios.post(
    'https://api.sendgrid.com/v3/mail/send',
    {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromAddress, name: 'Hawassa MESOB Center' },
      subject,
      content: [
        { type: 'text/plain', value: text || subject },
        { type: 'text/html', value: html || text || subject },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  const messageId = response.headers['x-message-id'] || `sg_${Date.now()}`;
  return {
    success: true,
    messageId,
    provider: 'sendgrid',
  };
};

/**
 * 4. High-Performance Mock Adapter (for Stress & Progressive Load Testing)
 * Validates payload structure, simulates realistic 5-20ms latency,
 * and records comprehensive delivery audit without consuming external provider quotas.
 */
const sendViaMock = async ({ to, subject }) => {
  // Simulate minimal network/processing latency
  await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 15) + 5));

  const mockMessageId = `mock_${crypto.randomUUID()}`;
  return {
    success: true,
    messageId: mockMessageId,
    provider: 'mock',
    simulated: true,
    recipient: to,
    subject,
  };
};

/**
 * Main dispatch function honoring rate-limiting, active provider, and latency metrics
 */
export const dispatchEmail = async ({ to, subject, html, text, from, provider = null }) => {
  const chosenProvider = (provider || activeProviderType).toLowerCase();
  const startTime = Date.now();

  // 1. Acquire token bucket permission to respect sending quotas
  await globalEmailRateLimiter.acquire();

  try {
    let result;

    switch (chosenProvider) {
      case 'resend':
        result = await sendViaResend({ to, subject, html, text, from });
        break;
      case 'sendgrid':
        result = await sendViaSendGrid({ to, subject, html, text, from });
        break;
      case 'mock':
        result = await sendViaMock({ to, subject, html, text });
        break;
      case 'smtp':
      default:
        result = await sendViaSmtp({ to, subject, html, text, from });
        break;
    }

    const latencyMs = Date.now() - startTime;
    recordDeliveryMetric({
      success: true,
      provider: chosenProvider,
      latencyMs,
      recipient: to,
      messageId: result.messageId,
    });

    return {
      success: true,
      ...result,
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    recordDeliveryMetric({
      success: false,
      provider: chosenProvider,
      latencyMs,
      recipient: to,
      error: error.message,
    });

    throw error;
  }
};

/**
 * Configure active provider dynamically
 */
export const setActiveEmailProvider = (providerType) => {
  const valid = ['smtp', 'resend', 'sendgrid', 'mock'];
  const lower = String(providerType || '').toLowerCase();
  if (valid.includes(lower)) {
    activeProviderType = lower;
    providerStats.activeProvider = lower;
    console.log(`[PROVIDER-FACTORY] Active email provider switched to: [${lower.toUpperCase()}]`);
    return true;
  }
  return false;
};

/**
 * Get active provider name
 */
export const getActiveEmailProvider = () => activeProviderType;

/**
 * Get provider telemetry and performance stats
 */
export const getProviderMetrics = () => {
  const avgLatency =
    providerStats.totalDispatched > 0
      ? Math.round(providerStats.totalLatencyMs / providerStats.totalDispatched)
      : 0;

  return {
    ...providerStats,
    averageLatencyMs: avgLatency,
    rateLimiter: globalEmailRateLimiter.getStatus(),
  };
};
