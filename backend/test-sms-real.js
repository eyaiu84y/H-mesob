/**
 * Test SMS with Real Phone Number
 */

import { sendQueueCallSMS } from './src/services/smsService.js';

console.log('🧪 Testing SMS with your actual phone number...\n');

const testPhone = '+251994351771';
const queueNumber = 'Q-2026-0013';
const institution = 'Sidama Bank';

console.log('📱 Sending SMS to:', testPhone);
console.log('📄 Queue Number:', queueNumber);
console.log('🏢 Institution:', institution);
console.log('');

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
  console.log('📱 Check your phone: 0994351771');
  console.log('You should receive the message within 1-2 minutes.');
} else {
  console.log('\n❌ SMS failed');
  console.log('Error:', result.message);
}

process.exit(result.success ? 0 : 1);
