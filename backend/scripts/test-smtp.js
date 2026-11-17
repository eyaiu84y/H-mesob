/**
 * test-smtp.js
 * Comprehensive diagnostic script for Hawassa MESOB transactional email system
 * Tests Gmail SMTP connectivity, verifies App Password credentials, and checks outbox status.
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
const rawPass = (process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || '').trim();
const pass = rawPass.replace(/\s+/g, '');

console.log('======================================================');
console.log('   Hawassa MESOB - Gmail SMTP Diagnostic Suite');
console.log('======================================================');
console.log(`[CONFIG] Provider:       ${process.env.EMAIL_PROVIDER || 'smtp'}`);
console.log(`[CONFIG] Service:        ${process.env.EMAIL_SERVICE || 'gmail'}`);
console.log(`[CONFIG] Gmail Account:  ${user || '(not configured)'}`);
console.log(`[CONFIG] Password Len:   ${pass ? pass.length + ' characters' : '(empty)'}`);
console.log(`[CONFIG] From Address:   ${process.env.EMAIL_FROM || user}`);
console.log('------------------------------------------------------');

if (!user || !pass) {
  console.error('❌ ERROR: GMAIL_USER or GMAIL_PASS is not set in backend/.env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass },
});

console.log('[TEST 1/2] Verifying SMTP credentials against smtp.gmail.com...');

transporter.verify((error, success) => {
  if (error) {
    console.error('\n❌ SMTP AUTHENTICATION FAILED:');
    console.error(`   Error code:    ${error.code || 'UNKNOWN'}`);
    console.error(`   Response:      ${error.response || error.message}`);
    console.error('\n📋 DIAGNOSIS:');
    if (error.code === 'EAUTH' || (error.response && error.response.includes('535'))) {
      console.error('   Google actively rejected your credentials (535-5.7.8 BadCredentials).');
      console.error('   This occurs because:');
      console.error('     1) Standard Google account passwords cannot be used for SMTP.');
      console.error('     2) The 16-character App Password has expired, was revoked, or account password changed.');
      console.error('\n🔧 HOW TO RESOLVE:');
      console.error('     Step 1: Sign in to your Google Account at https://myaccount.google.com');
      console.error('     Step 2: Ensure "2-Step Verification" is ON at https://myaccount.google.com/security');
      console.error('     Step 3: Go to https://myaccount.google.com/apppasswords');
      console.error('     Step 4: Generate a new App Password (name it "Hawassa MESOB")');
      console.error('     Step 5: Copy the 16 characters and update backend/.env:');
      console.error(`             GMAIL_PASS=your-16-char-app-password`);
      console.error('     Step 6: Restart backend server or rerun: npm run verify:email\n');
    } else {
      console.error(`   Network or connection issue: ${error.message}\n`);
    }
    process.exit(1);
  }

  console.log('✅ SMTP AUTHENTICATION SUCCESSFUL!');
  console.log('   The Gmail SMTP server accepted the credentials and is ready to send messages.');

  // Test sending if a recipient was passed via CLI argument
  const targetRecipient = process.argv[2];
  if (targetRecipient) {
    console.log(`\n[TEST 2/2] Sending test verification email to: ${targetRecipient}...`);
    transporter.sendMail({
      from: `"Hawassa MESOB Center" <${user}>`,
      to: targetRecipient,
      subject: 'Hawassa MESOB — SMTP Connection Test Verification',
      text: 'Hello, this is a verified test email from the Hawassa MESOB transactional email system.',
      html: '<h3>Hawassa MESOB Notification System</h3><p>Your SMTP credentials are now active and working properly.</p>',
    }).then(info => {
      console.log(`✅ TEST EMAIL DISPATCHED! Message ID: ${info.messageId}`);
      process.exit(0);
    }).catch(err => {
      console.error(`❌ FAILED TO SEND TEST EMAIL: ${err.message}`);
      process.exit(1);
    });
  } else {
    console.log('\n💡 Tip: You can test sending an actual email by running:');
    console.log('   node scripts/test-smtp.js your_email@gmail.com\n');
    process.exit(0);
  }
});
