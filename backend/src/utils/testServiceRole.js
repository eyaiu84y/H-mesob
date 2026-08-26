import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║     🔍 SERVICE ROLE KEY TEST                          ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('📋 Configuration Check:');
console.log(`   SUPABASE_URL: ${supabaseUrl}`);
console.log(`   SERVICE_ROLE_KEY: ${serviceRoleKey ? '✅ SET' : '❌ MISSING'}`);
console.log(`   Key length: ${serviceRoleKey?.length || 0} characters`);
console.log(`   Key starts with: ${serviceRoleKey?.substring(0, 20)}...`);

// Create admin client with service_role key
// Service role should bypass RLS automatically
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function testServiceRole() {
  console.log('\n🔌 Testing service_role access...\n');
  
  try {
    // Test 1: Direct table access (should bypass RLS)
    console.log('Test 1: Query institutions table');
    const { data: institutions, error: instError } = await supabaseAdmin
      .from('institutions')
      .select('*');
    
    if (instError) {
      console.log(`   ❌ Error: ${instError.message}`);
      console.log(`   Code: ${instError.code}`);
      console.log(`   Details: ${instError.details || 'none'}`);
      
      // If we get permission denied with service_role, something is wrong
      if (instError.code === '42501') {
        console.log('\n⚠️  CRITICAL ISSUE:');
        console.log('   Service role key cannot bypass RLS!');
        console.log('   This should NOT happen with a valid service_role key.\n');
        console.log('💡 POSSIBLE CAUSES:');
        console.log('   1. Key is not actually the service_role key');
        console.log('   2. Supabase project has custom permissions');
        console.log('   3. Database connection issue\n');
      }
    } else {
      console.log(`   ✅ Success! Found ${institutions?.length || 0} institutions`);
      if (institutions && institutions.length > 0) {
        console.log('\n📋 Institutions found:');
        institutions.forEach(inst => {
          console.log(`   - ${inst.code}: ${inst.name_en}`);
        });
      }
    }
    
    // Test 2: Check RLS status
    console.log('\n\nTest 2: Check RLS configuration');
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin.rpc('check_rls_status');
    
    if (rlsError) {
      // Function might not exist, that's okay
      console.log('   ⚠️  Could not check RLS status (function not found)');
    } else {
      console.log('   ✅ RLS Status retrieved');
      console.log(rlsStatus);
    }
    
    // Test 3: Try to insert a test record (should work with service_role)
    console.log('\n\nTest 3: Test write permissions');
    const { data: testInsert, error: insertError } = await supabaseAdmin
      .from('institutions')
      .insert({
        code: 'test_temp',
        name_en: 'Test Institution',
        name_am: 'ሙከራ ተቋም',
        description_en: 'Temporary test record',
        description_am: 'ጊዜያዊ የሙከራ መዝገብ',
        created_at: new Date().toISOString()
      })
      .select();
    
    if (insertError) {
      console.log(`   ❌ Cannot insert: ${insertError.message}`);
      console.log(`   Code: ${insertError.code}`);
    } else {
      console.log('   ✅ Insert successful - service_role has write access');
      
      // Clean up test record
      const { error: deleteError } = await supabaseAdmin
        .from('institutions')
        .delete()
        .eq('code', 'test_temp');
      
      if (!deleteError) {
        console.log('   ✅ Test record cleaned up');
      }
    }
    
  } catch (err) {
    console.log('\n❌ Unexpected error:');
    console.log(err);
  }
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     TEST COMPLETE                                      ║');
  console.log('╚════════════════════════════════════════════════════════╝');
}

testServiceRole();
