/**
 * Simple login test - direct database query
 */

import { supabase } from '../config/supabase.js';
import bcrypt from 'bcrypt';

const TEST_EMAIL = 'superadmin@mesobcenter.et';
const TEST_PASSWORD = 'SuperAdmin@2026';

async function testSimpleLogin() {
  console.log('\n🔍 Simple Login Test\n');

  // Test 1: Query without join
  console.log('Test 1: Query without institutions join...');
  const { data: user1, error: error1 } = await supabase
    .from('users')
    .select(`
      id,
      email,
      password_hash,
      first_name,
      last_name,
      role,
      status
    `)
    .eq('email', TEST_EMAIL)
    .single();

  if (error1) {
    console.error('❌ Error (no join):', error1);
  } else {
    console.log('✅ Success (no join):', user1?.email, user1?.role);
    const match1 = await bcrypt.compare(TEST_PASSWORD, user1.password_hash);
    console.log('   Password match:', match1 ? '✅' : '❌');
  }

  // Test 2: Query with join
  console.log('\nTest 2: Query with institutions join...');
  const { data: user2, error: error2 } = await supabase
    .from('users')
    .select(`
      id,
      email,
      password_hash,
      role,
      institutions (
        id,
        name
      )
    `)
    .eq('email', TEST_EMAIL)
    .single();

  if (error2) {
    console.error('❌ Error (with join):', error2);
  } else {
    console.log('✅ Success (with join):', user2?.email, user2?.role);
    console.log('   Institution:', user2?.institutions);
    const match2 = await bcrypt.compare(TEST_PASSWORD, user2.password_hash);
    console.log('   Password match:', match2 ? '✅' : '❌');
  }

  console.log('\n');
  process.exit(0);
}

testSimpleLogin().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
