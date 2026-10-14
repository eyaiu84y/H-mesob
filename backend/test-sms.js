/**
 * Quick SMS Test Script
 * Tests if Africa's Talking SMS is working
 */

import { sendQueueCallSMS } from './src/services/smsService.js';

console.log('🧪 Testing SMS Service...\n');

// Test phone number (from your test citizen user)
const testPhone = '+251911000006';
const queueNumber = 'Q-2026-TEST';
const institution = 'Test Institution';

console.log('📱 Sending test SMS to:', testPhone);
console.log('📄 Queue Number:', queueNumber);
console.log('🏢 Institution:', institution);
console.log('');

// Send SMS
const result = await sendQueueCallSMS(
  testPhone,
  queueNumber,
  institution,
  'en'
);

console.log('\n📊 Result:');
console.log('Success:', result.success);
console.log('Message:', result.message);

if (result.data) {
  console.log('\n📦 Response Data:');
  console.log(JSON.stringify(result.data, null, 2));
}

if (result.success) {
  console.log('\n✅ SMS sent successfully!');
  console.log('Check the phone: ' + testPhone);
} else {
  console.log('\n❌ SMS failed');
  console.log('Error:', result.message);
  console.log('\nTroubleshooting:');
  console.log('1. Check if phone number is registered in Africa\'s Talking sandbox');
  console.log('2. Check if you have sandbox credits');
  console.log('3. Verify API key is correct');
}

process.exit(result.success ? 0 : 1);
