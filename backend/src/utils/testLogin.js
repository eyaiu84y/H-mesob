/**
 * Test login functionality
 * Verifies bcrypt password comparison with database hashes
 */

import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.js';

const TEST_EMAIL = 'superadmin@mesobcenter.et';
const TEST_PASSWORD = 'SuperAdmin@2026';

async function testLogin() {
  console.log('\n🔍 Testing Login Functionality\n');
  console.log(`Email: ${TEST_EMAIL}`);
  console.log(`Password: ${TEST_PASSWORD}\n`);

  // Step 1: Fetch user from database
  console.log('Step 1: Fetching user from database...');
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password_hash, role, status')
    .eq('email', TEST_EMAIL)
    .single();

  if (error) {
    console.error('❌ Error fetching user:', error);
    return;
  }

  if (!user) {
    console.error('❌ User not found in database');
    return;
  }

  console.log('✅ User found:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Status: ${user.status}`);
  console.log(`   Hash (first 30 chars): ${user.password_hash.substring(0, 30)}...`);
  console.log('');

  // Step 2: Test password comparison
  console.log('Step 2: Testing password comparison...');
  const passwordMatch = await bcrypt.compare(TEST_PASSWORD, user.password_hash);

  if (passwordMatch) {
    console.log('✅ PASSWORD MATCH! Login would succeed.\n');
  } else {
    console.log('❌ PASSWORD MISMATCH! Login would fail.\n');
    
    // Additional debug info
    console.log('Debug Info:');
    console.log(`   Expected password: ${TEST_PASSWORD}`);
    console.log(`   Password length: ${TEST_PASSWORD.length}`);
    console.log(`   Hash algorithm: ${user.password_hash.substring(0, 4)}`);
    console.log('');
    
    // Try generating a new hash to compare
    console.log('Generating fresh hash for comparison...');
    const freshHash = await bcrypt.hash(TEST_PASSWORD, 10);
    console.log(`   Fresh hash: ${freshHash.substring(0, 30)}...`);
    console.log(`   DB hash:    ${user.password_hash.substring(0, 30)}...`);
    console.log('');
    
    // Test with fresh hash
    const freshMatch = await bcrypt.compare(TEST_PASSWORD, freshHash);
    console.log(`   Fresh hash comparison: ${freshMatch ? '✅ MATCH' : '❌ FAIL'}`);
  }
}

testLogin().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
