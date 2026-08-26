/**
 * Simple Supabase Connection Test
 * Tests basic connectivity and provides detailed error information
 * 
 * Usage: node src/utils/simpleConnectionTest.js
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║     🔍 SIMPLE SUPABASE CONNECTION TEST               ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Check environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📋 Configuration Check:');
console.log(`   SUPABASE_URL: ${supabaseUrl || '❌ NOT SET'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? '✅ SET' : '❌ NOT SET'}`);

if (supabaseKey) {
  console.log(`   Key length: ${supabaseKey.length} characters`);
  console.log(`   Key starts with: ${supabaseKey.substring(0, 10)}...`);
  
  // Check if it's the wrong key (old publishable format)
  if (supabaseKey.startsWith('sb_publishable')) {
    console.log('\n❌ ERROR: You are using the PUBLISHABLE key!');
    console.log('   You need the SERVICE_ROLE key instead.');
    console.log('   Go to: Supabase Dashboard → Settings → API');
    console.log('   Copy the "service_role" key (NOT the "anon" or "publishable" key)\n');
    process.exit(1);
  }
  
  // Warn about placeholder
  if (supabaseKey.includes('your-') || supabaseKey.length < 30) {
    console.log('\n❌ ERROR: You are still using the placeholder value!');
    console.log('   Replace SUPABASE_SERVICE_ROLE_KEY in .env with your actual key.\n');
    process.exit(1);
  }
}

console.log();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Missing Supabase credentials in .env file\n');
  process.exit(1);
}

console.log('🔌 Attempting connection to Supabase...\n');

async function testConnection() {
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    console.log('   Step 1: Client created ✅');

    // Test 1: Simple query to test connection
    console.log('   Step 2: Testing basic query...');
    
    const { data, error, status, statusText } = await supabase
      .from('institutions')
      .select('count', { count: 'exact', head: true })
      .limit(0);

    console.log(`   Response status: ${status} ${statusText || ''}`);

    if (error) {
      console.log(`   Error code: ${error.code || 'unknown'}`);
      console.log(`   Error message: ${error.message}`);
      console.log(`   Error details: ${error.details || 'none'}`);
      console.log(`   Error hint: ${error.hint || 'none'}`);

      // Check specific error cases
      if (error.code === '42P01') {
        console.log('\n⚠️  DIAGNOSIS: Table "institutions" does not exist');
        console.log('   This means the database schema has not been created yet.\n');
        console.log('   ✅ Good news: Connection to Supabase is working!');
        console.log('   ⚠️  Next step: Run database migrations\n');
        console.log('   How to fix:');
        console.log('   1. Open Supabase SQL Editor (in your dashboard)');
        console.log('   2. Run: backend/database/migrations/001_create_schema.sql');
        console.log('   3. Run: backend/database/migrations/002_create_rls_policies.sql');
        console.log('   4. Run: backend/database/migrations/003_create_functions_views.sql');
        console.log('   5. Run: backend/database/seeds/001_seed_institutions.sql');
        console.log('   6. Run this test again\n');
        process.exit(2); // Exit with code 2 = connection works, schema missing
      }

      if (error.code === 'PGRST301' || error.message.includes('JWT')) {
        console.log('\n❌ DIAGNOSIS: Authentication failed');
        console.log('   Your service_role key is incorrect or expired.\n');
        console.log('   How to fix:');
        console.log('   1. Go to: Supabase Dashboard → Settings → API');
        console.log('   2. Copy the "service_role" key (the secret one)');
        console.log('   3. Update SUPABASE_SERVICE_ROLE_KEY in backend/.env');
        console.log('   4. Make sure you copy the entire key (400+ characters)\n');
        process.exit(1);
      }

      console.log('\n❌ Connection test failed');
      console.log('   Check the error details above for more information.\n');
      process.exit(1);
    }

    console.log('   Step 3: Query executed ✅\n');

    // Test 2: Try to count institutions
    console.log('📊 Fetching institution count...');
    const { count, error: countError } = await supabase
      .from('institutions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`   ⚠️  Could not count institutions: ${countError.message}`);
    } else {
      console.log(`   ✅ Found ${count || 0} institutions in database`);
    }

    // Test 3: List some institutions
    console.log('\n🏛️  Fetching institution list...');
    const { data: institutions, error: instError } = await supabase
      .from('institutions')
      .select('code, name_en, status')
      .order('name_en')
      .limit(5);

    if (instError) {
      console.log(`   ⚠️  Could not fetch institutions: ${instError.message}`);
    } else if (institutions && institutions.length > 0) {
      console.log(`   ✅ Found ${institutions.length} institutions (showing first 5):\n`);
      institutions.forEach(inst => {
        console.log(`      - ${inst.code}: ${inst.name_en} (${inst.status})`);
      });
    } else {
      console.log('   ⚠️  No institutions found. You may need to run the seed script.');
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║     ✅ CONNECTION TEST PASSED                         ║');
    console.log('║     ✅ SUPABASE DATABASE IS ACCESSIBLE                ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('🎉 Success! Your backend can connect to Supabase.\n');
    console.log('Next steps:');
    console.log('   1. Start the backend: npm run dev');
    console.log('   2. Test health endpoint: http://localhost:5000/api/health');
    console.log('   3. Begin implementing API endpoints\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n🔍 DIAGNOSIS: Network connection issue');
      console.log('   - Check your internet connection');
      console.log('   - Check if your firewall is blocking Supabase');
      console.log('   - Try accessing your Supabase project in a browser\n');
    }
    
    console.error('\nFull error details:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testConnection();
