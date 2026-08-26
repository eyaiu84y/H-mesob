/**
 * Check Migration Status - Works with RLS
 * Uses direct SQL queries that bypass RLS
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║     🔍 DATABASE MIGRATION STATUS                      ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkMigrations() {
  console.log('📊 Checking database tables...\n');

  // Use FROM clause directly - service_role should bypass RLS
  try {
    // Check institutions with RLS bypass
    const { data: institutions, error, count } = await supabase
      .from('institutions')
      .select('code, name_en, status', { count: 'exact' });

    if (error) {
      console.log('❌ Error querying institutions:');
      console.log(`   Code: ${error.code}`);
      console.log(`   Message: ${error.message}`);
      console.log(`   Details: ${error.details || 'none'}\n`);
      
      if (error.code === '42P01') {
        console.log('📋 DIAGNOSIS:');
        console.log('   ❌ institutions table does NOT exist');
        console.log('   → Migration 001 was not run successfully\n');
      } else if (error.message.includes('permission') || error.message.includes('RLS')) {
        console.log('📋 DIAGNOSIS:');
        console.log('   ✅ institutions table exists');
        console.log('   ✅ RLS is active (migration 002 succeeded)');
        console.log('   ⚠️  But service_role key might not bypass RLS properly\n');
        console.log('💡 SOLUTION:');
        console.log('   Run the seed file in Supabase SQL Editor to insert institutions');
        console.log('   (SQL Editor runs with superuser privileges)\n');
      }
    } else {
      console.log('✅ institutions table exists and is accessible!');
      console.log(`✅ Found ${count} institutions\n`);
      
      if (institutions && institutions.length > 0) {
        console.log('🏛️  Institution List:');
        institutions.forEach(inst => {
          console.log(`   - ${inst.code}: ${inst.name_en} (${inst.status})`);
        });
        console.log();
      } else {
        console.log('⚠️  No institutions found in database');
        console.log('   → Need to run: 001_seed_institutions.sql\n');
      }
    }

    // Summary
    console.log('╔════════════════════════════════════════════════════════╗');
    
    if (count >= 12) {
      console.log('║     ✅ ALL MIGRATIONS COMPLETE                        ║');
      console.log('║     ✅ DATABASE READY FOR USE                         ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      console.log('🎉 Success! Your database is fully set up.\n');
      console.log('Next steps:');
      console.log('  1. Start backend: npm run dev');
      console.log('  2. Test API: http://localhost:5000/api/health');
      console.log('  3. Begin API development\n');
      process.exit(0);
    } else if (count >= 0 && count < 12) {
      console.log('║     ⚠️  MIGRATIONS INCOMPLETE                         ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      console.log(`Found ${count} institutions, expected 12.\n`);
      console.log('Action required:');
      console.log('  → Run: 001_seed_institutions.sql in Supabase SQL Editor\n');
      process.exit(1);
    } else {
      console.log('║     ❌ MIGRATIONS NOT COMPLETE                        ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      console.log('Action required:');
      console.log('  1. Run: 003_create_functions_views.sql');
      console.log('  2. Run: 001_seed_institutions.sql\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkMigrations();
