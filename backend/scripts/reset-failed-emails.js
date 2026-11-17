/**
 * reset-failed-emails.js
 * Utility to reset FAILED email outbox items back to PENDING so the background worker can re-attempt delivery.
 * Useful after updating GMAIL_PASS or fixing SMTP network settings.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTBOX_FILE = path.resolve(__dirname, '../data/email_outbox.json');

if (!fs.existsSync(OUTBOX_FILE)) {
  console.log('No email_outbox.json found.');
  process.exit(0);
}

const outbox = JSON.parse(fs.readFileSync(OUTBOX_FILE, 'utf8') || '[]');
let resetCount = 0;

const updated = outbox.map(item => {
  if (item.status === 'FAILED') {
    resetCount++;
    return {
      ...item,
      status: 'PENDING',
      attempts: 0,
      next_retry_at: new Date().toISOString(),
      last_error: null,
      locked_by: null,
      locked_at: null,
      updated_at: new Date().toISOString(),
    };
  }
  return item;
});

fs.writeFileSync(OUTBOX_FILE, JSON.stringify(updated, null, 2), 'utf8');
console.log(`[OUTBOX] Successfully reset ${resetCount} failed email(s) back to PENDING.`);
console.log('[OUTBOX] When the email worker runs with valid credentials, it will immediately attempt delivery.');
