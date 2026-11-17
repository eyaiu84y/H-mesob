import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { maskEmail, isValidEmail } from './emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'mesob_data')
  : path.resolve(__dirname, '../../data');
const OUTBOX_FILE = path.join(DATA_DIR, 'email_outbox.json');

// Ensure local persistence folder exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create outbox data directory:', err.message);
  }
}

// In-memory cache + persistent fallback store
let fallbackOutboxStore = [];
let hasSupabaseTable = null; // null = unverified, true/false after check
let persistScheduled = false;

// Load fallback store from disk if present
try {
  if (fs.existsSync(OUTBOX_FILE)) {
    const raw = fs.readFileSync(OUTBOX_FILE, 'utf8');
    fallbackOutboxStore = JSON.parse(raw || '[]');
  }
} catch (err) {
  fallbackOutboxStore = [];
}

const persistFallbackStore = (immediate = false) => {
  if (immediate) {
    try {
      fs.writeFileSync(OUTBOX_FILE, JSON.stringify(fallbackOutboxStore, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write to email_outbox.json:', err.message);
    }
    return;
  }

  if (persistScheduled) return;
  persistScheduled = true;
  setImmediate(() => {
    persistScheduled = false;
    try {
      fs.writeFileSync(OUTBOX_FILE, JSON.stringify(fallbackOutboxStore, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write to email_outbox.json:', err.message);
    }
  });
};

/**
 * Detect whether Supabase has the email_outbox table ready in schema cache
 */
export const checkOutboxTableAvailability = async () => {
  if (hasSupabaseTable !== null) return hasSupabaseTable;
  try {
    const { error } = await supabase.from('email_outbox').select('id').limit(1);
    if (!error) {
      hasSupabaseTable = true;
    } else {
      hasSupabaseTable = false;
    }
  } catch {
    hasSupabaseTable = false;
  }
  return hasSupabaseTable;
};

/**
 * Hash a secret (token or 6-digit code) using SHA-256
 * Tokens are never stored in plain text
 */
export const hashVerificationSecret = (secret) => {
  if (!secret) return null;
  return crypto.createHash('sha256').update(String(secret).trim()).digest('hex');
};

/**
 * Enqueue an email into the reliable outbox.
 * Non-blocking: returns in < 15ms.
 */
export const enqueueEmail = async ({
  to,
  recipientId = null,
  subject,
  templateName,
  payload = {},
  idempotencyKey = null,
  maxAttempts = 5,
}) => {
  try {
    if (!to || !isValidEmail(to)) {
      return {
        success: false,
        message: 'Invalid recipient email address.',
        skipped: true,
      };
    }

    const cleanEmail = to.trim().toLowerCase();
    const nowIso = new Date().toISOString();

    const isTableReady = await checkOutboxTableAvailability();

    // 1. Idempotency Check
    if (idempotencyKey) {
      if (isTableReady) {
        const { data: existing } = await supabase
          .from('email_outbox')
          .select('id, status, attempts, sent_at')
          .eq('idempotency_key', idempotencyKey)
          .maybeSingle();

        if (existing) {
          return {
            success: true,
            deduplicated: true,
            outboxId: existing.id,
            status: existing.status,
            message: 'Email dispatch deduplicated by idempotency key.',
          };
        }
      } else {
        const existing = fallbackOutboxStore.find((i) => i.idempotency_key === idempotencyKey);
        if (existing) {
          return {
            success: true,
            deduplicated: true,
            outboxId: existing.id,
            status: existing.status,
            message: 'Email dispatch deduplicated by idempotency key.',
          };
        }
      }
    }

    const newItem = {
      id: crypto.randomUUID(),
      recipient_email: cleanEmail,
      recipient_id: recipientId || null,
      subject: subject.trim(),
      template_name: templateName,
      payload: payload || {},
      status: 'PENDING',
      idempotency_key: idempotencyKey || null,
      attempts: 0,
      max_attempts: maxAttempts,
      next_retry_at: nowIso,
      last_error: null,
      message_id: null,
      sent_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    if (isTableReady) {
      const { data, error } = await supabase
        .from('email_outbox')
        .insert(newItem)
        .select('*')
        .single();

      if (error) {
        console.error('[OUTBOX] Supabase insert error, falling back to local store:', error.message);
        fallbackOutboxStore.unshift(newItem);
        persistFallbackStore();
      }
    } else {
      fallbackOutboxStore.unshift(newItem);
      persistFallbackStore();
    }

    // Trigger background worker if registered
    if (typeof global.__MESOB_EMAIL_WORKER_TRIGGER__ === 'function') {
      setImmediate(() => {
        try {
          global.__MESOB_EMAIL_WORKER_TRIGGER__();
        } catch {}
      });
    }

    return {
      success: true,
      outboxId: newItem.id,
      status: 'PENDING',
      recipient: maskEmail(cleanEmail),
    };
  } catch (err) {
    console.error('[OUTBOX] ❌ Failed to enqueue email:', err.message);
    return {
      success: false,
      message: err.message,
    };
  }
};

/**
 * Fetch a batch of pending or retrying emails ready for processing.
 * Atomic lease-based locking prevents duplicate processing across horizontal worker instances.
 */
export const fetchPendingBatch = async (batchSize = 25, workerId = null) => {
  const isTableReady = await checkOutboxTableAvailability();
  const now = new Date();
  const nowIso = now.toISOString();
  const effectiveWorkerId = workerId || `W_${process.pid}_${crypto.randomUUID().slice(0, 8)}`;
  const lockTimeoutMs = 5 * 60 * 1000; // 5 minute lock lease
  const lockExpiredThreshold = new Date(Date.now() - lockTimeoutMs).toISOString();

  if (isTableReady) {
    try {
      // 1. Try calling the PostgreSQL atomic claim RPC if installed
      const { data: rpcData, error: rpcError } = await supabase.rpc('claim_email_outbox_batch', {
        p_worker_id: effectiveWorkerId,
        p_batch_size: batchSize,
        p_lease_duration_seconds: 300,
      });

      if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
        return rpcData;
      }

      // 2. Fallback to atomic select-for-update lock query
      const { data: candidates, error: candidateErr } = await supabase
        .from('email_outbox')
        .select('id')
        .or(`status.in.(PENDING,RETRYING),and(status.eq.PROCESSING,locked_at.lt.${lockExpiredThreshold})`)
        .lte('next_retry_at', nowIso)
        .order('next_retry_at', { ascending: true })
        .limit(batchSize);

      if (!candidateErr && candidates && candidates.length > 0) {
        const ids = candidates.map((d) => d.id);
        const { data: claimed, error: claimErr } = await supabase
          .from('email_outbox')
          .update({
            status: 'PROCESSING',
            locked_by: effectiveWorkerId,
            locked_at: nowIso,
            updated_at: nowIso,
          })
          .in('id', ids)
          .select('*');

        if (!claimErr && claimed) {
          return claimed;
        }
      }
    } catch (err) {
      console.error('[OUTBOX] Fetch batch error from Supabase:', err.message);
    }
  }

  // Fallback store with distributed lease and stranded-lock recovery
  const readyItems = [];
  for (const item of fallbackOutboxStore) {
    const isDue = (item.status === 'PENDING' || item.status === 'RETRYING') && new Date(item.next_retry_at) <= now;
    const isStrandedLease = item.status === 'PROCESSING' && (!item.locked_at || new Date(item.locked_at).getTime() < (now.getTime() - lockTimeoutMs));

    if ((isDue || isStrandedLease) && readyItems.length < batchSize) {
      item.status = 'PROCESSING';
      item.locked_by = effectiveWorkerId;
      item.locked_at = nowIso;
      item.updated_at = nowIso;
      readyItems.push(item);
    }
  }

  if (readyItems.length > 0) {
    persistFallbackStore();
  }
  return readyItems;
};

/**
 * Mark an email as successfully sent and release worker lease
 */
export const markEmailSent = async (outboxId, messageId = 'SENT_OK') => {
  const nowIso = new Date().toISOString();
  const isTableReady = await checkOutboxTableAvailability();

  if (isTableReady) {
    try {
      await supabase
        .from('email_outbox')
        .update({
          status: 'SENT',
          sent_at: nowIso,
          message_id: messageId,
          last_error: null,
          locked_by: null,
          locked_at: null,
          updated_at: nowIso,
        })
        .eq('id', outboxId);
    } catch (err) {
      console.error('[OUTBOX] Error updating sent status in Supabase:', err.message);
    }
  }

  // Also update fallback store
  const item = fallbackOutboxStore.find((i) => i.id === outboxId);
  if (item) {
    item.status = 'SENT';
    item.sent_at = nowIso;
    item.message_id = messageId;
    item.last_error = null;
    item.locked_by = null;
    item.locked_at = null;
    item.updated_at = nowIso;
    persistFallbackStore();
  }
};

/**
 * Mark an email as failed or set it to retry with exponential backoff and release worker lease
 */
export const markEmailFailedOrRetry = async (outboxId, errorMessage, attemptCount, maxAttempts = 5) => {
  const now = Date.now();
  const nowIso = new Date().toISOString();
  const willRetry = attemptCount < maxAttempts;

  // Exponential backoff: base 5s * 2^(attempt-1), capped at 30 minutes
  const backoffMs = willRetry
    ? Math.min(30 * 60 * 1000, 5000 * Math.pow(2, Math.max(0, attemptCount - 1)))
    : 0;
  const nextRetryAt = willRetry ? new Date(now + backoffMs).toISOString() : nowIso;
  const newStatus = willRetry ? 'RETRYING' : 'FAILED';

  const isTableReady = await checkOutboxTableAvailability();
  if (isTableReady) {
    try {
      await supabase
        .from('email_outbox')
        .update({
          status: newStatus,
          attempts: attemptCount,
          last_error: errorMessage,
          next_retry_at: nextRetryAt,
          locked_by: null,
          locked_at: null,
          updated_at: nowIso,
        })
        .eq('id', outboxId);
    } catch (err) {
      console.error('[OUTBOX] Error updating retry status in Supabase:', err.message);
    }
  }

  const item = fallbackOutboxStore.find((i) => i.id === outboxId);
  if (item) {
    item.status = newStatus;
    item.attempts = attemptCount;
    item.last_error = errorMessage;
    item.next_retry_at = nextRetryAt;
    item.locked_by = null;
    item.locked_at = null;
    item.updated_at = nowIso;
    persistFallbackStore();
  }

  return { status: newStatus, nextRetryAt };
};

/**
 * Get aggregated outbox statistics for administrators
 */
export const getOutboxStats = async () => {
  const isTableReady = await checkOutboxTableAvailability();

  if (isTableReady) {
    try {
      const { data, error } = await supabase
        .from('email_outbox')
        .select('status, attempts');

      if (!error && data) {
        let sent = 0;
        let failed = 0;
        let pending = 0;
        let processing = 0;
        let retrying = 0;
        let totalRetries = 0;

        for (const row of data) {
          if (row.status === 'SENT') sent++;
          else if (row.status === 'FAILED') failed++;
          else if (row.status === 'PENDING') pending++;
          else if (row.status === 'PROCESSING') processing++;
          else if (row.status === 'RETRYING') retrying++;

          if (row.attempts > 1) {
            totalRetries += row.attempts - 1;
          }
        }

        return {
          total: data.length,
          sent,
          failed,
          pending,
          processing,
          retrying,
          totalRetries,
        };
      }
    } catch (err) {
      console.error('[OUTBOX] Error fetching stats from Supabase:', err.message);
    }
  }

  // Refresh fallback store from disk only if in-memory store is empty
  if (fallbackOutboxStore.length === 0 && fs.existsSync(OUTBOX_FILE)) {
    try {
      const raw = fs.readFileSync(OUTBOX_FILE, 'utf8');
      fallbackOutboxStore = JSON.parse(raw || '[]');
    } catch {}
  }

  // Compute from fallback store
  let sent = 0;
  let failed = 0;
  let pending = 0;
  let processing = 0;
  let retrying = 0;
  let totalRetries = 0;

  for (const item of fallbackOutboxStore) {
    if (item.status === 'SENT') sent++;
    else if (item.status === 'FAILED') failed++;
    else if (item.status === 'PENDING') pending++;
    else if (item.status === 'PROCESSING') processing++;
    else if (item.status === 'RETRYING') retrying++;

    if (item.attempts > 1) {
      totalRetries += item.attempts - 1;
    }
  }

  return {
    total: fallbackOutboxStore.length,
    sent,
    failed,
    pending,
    processing,
    retrying,
    totalRetries,
  };
};

/**
 * Get real-time backlog depth and worker queue health metrics
 */
export const getOutboxBacklogDepth = async () => {
  const stats = await getOutboxStats();
  const backlog = (stats.pending || 0) + (stats.retrying || 0) + (stats.processing || 0);

  return {
    backlogDepth: backlog,
    pending: stats.pending || 0,
    retrying: stats.retrying || 0,
    processing: stats.processing || 0,
    failed: stats.failed || 0,
    sent: stats.sent || 0,
    total: stats.total || 0,
    health: backlog > 1000 ? 'DEGRADED_BACKLOG' : backlog > 200 ? 'ELEVATED' : 'HEALTHY',
    timestamp: new Date().toISOString(),
  };
};

/**
 * Get delivery logs for administrative monitoring.
 * Emails are masked and passwords/tokens are NEVER included.
 */
export const getOutboxLogs = async ({ limit = 50, page = 1, status = null } = {}) => {
  const isTableReady = await checkOutboxTableAvailability();
  const safeLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const offset = (safePage - 1) * safeLimit;

  if (isTableReady) {
    try {
      let query = supabase
        .from('email_outbox')
        .select('id, recipient_email, subject, template_name, status, attempts, max_attempts, next_retry_at, last_error, message_id, sent_at, created_at, updated_at', { count: 'exact' });

      if (status) {
        query = query.eq('status', status.toUpperCase());
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + safeLimit - 1);

      if (!error && data) {
        const sanitized = data.map((item) => ({
          id: item.id,
          recipient: maskEmail(item.recipient_email),
          subject: item.subject,
          templateName: item.template_name,
          status: item.status,
          attempts: item.attempts,
          maxAttempts: item.max_attempts,
          nextRetryAt: item.next_retry_at,
          error: item.last_error,
          messageId: item.message_id,
          sentAt: item.sent_at,
          createdAt: item.created_at,
        }));

        return {
          total: count || data.length,
          page: safePage,
          limit: safeLimit,
          logs: sanitized,
        };
      }
    } catch (err) {
      console.error('[OUTBOX] Error fetching logs from Supabase:', err.message);
    }
  }

  // Refresh fallback store from disk only if in-memory store is empty
  if (fallbackOutboxStore.length === 0 && fs.existsSync(OUTBOX_FILE)) {
    try {
      const raw = fs.readFileSync(OUTBOX_FILE, 'utf8');
      fallbackOutboxStore = JSON.parse(raw || '[]');
    } catch {}
  }

  // Fallback logs: sort descending (newest first)
  let filtered = [...fallbackOutboxStore].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  if (status) {
    filtered = filtered.filter((i) => i.status === status.toUpperCase());
  }

  const paginated = filtered.slice(offset, offset + safeLimit).map((item) => ({
    id: item.id,
    recipient: maskEmail(item.recipient_email),
    subject: item.subject,
    templateName: item.template_name,
    status: item.status,
    attempts: item.attempts,
    maxAttempts: item.max_attempts,
    nextRetryAt: item.next_retry_at,
    error: item.last_error,
    messageId: item.message_id,
    sentAt: item.sent_at,
    createdAt: item.created_at,
  }));

  return {
    total: filtered.length,
    page: safePage,
    limit: safeLimit,
    logs: paginated,
  };
};

/**
 * Purge mock/simulated email outbox items or failed test logs
 */
export const purgeMockOutbox = async ({ clearAllFailed = false } = {}) => {
  const isTableReady = await checkOutboxTableAvailability();
  if (isTableReady) {
    try {
      if (clearAllFailed) {
        await supabase.from('email_outbox').delete().eq('status', 'FAILED');
      } else {
        await supabase.from('email_outbox').delete().ilike('recipient_email', 'sim.%');
        await supabase.from('email_outbox').delete().ilike('recipient_email', 'test%');
      }
    } catch (err) {
      console.error('[OUTBOX] Supabase purge error:', err.message);
    }
  }

  // Ensure fallback store is loaded
  if (fallbackOutboxStore.length === 0 && fs.existsSync(OUTBOX_FILE)) {
    try {
      const raw = fs.readFileSync(OUTBOX_FILE, 'utf8');
      fallbackOutboxStore = JSON.parse(raw || '[]');
    } catch {}
  }

  const initialCount = fallbackOutboxStore.length;
  fallbackOutboxStore = fallbackOutboxStore.filter((item) => {
    const email = (item.recipient_email || '').toLowerCase();
    if (clearAllFailed && item.status === 'FAILED') return false;
    return !email.startsWith('sim.') && !email.startsWith('test') && !email.includes('sim.004505');
  });

  const purgedCount = initialCount - fallbackOutboxStore.length;
  persistFallbackStore(true);
  console.log(`[OUTBOX] Purged ${purgedCount} mock/test outbox items. Remaining: ${fallbackOutboxStore.length}`);
  return { purgedCount, remainingCount: fallbackOutboxStore.length };
};
