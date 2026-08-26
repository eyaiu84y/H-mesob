/**
 * Check Database Migration Status
 * Verifies what has been created in Supabase
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
console.log('║     🔍 DATABASE MIGRATION STATUS CHECK                ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function checkDatabase() {
  console.log('🔌 Connecting to Supabase...\n');

  // Check 1: Try to query pg_catalog to see what tables exist
  console.log('📊 Checking for tables...');
  try {
    const { data: tables, error } = await supabase
      .rpc('exec_sql', { 
        query: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        ` 
      })
      .catch(async () => {
        // Fallback: Try direct query
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `
              SELECT table_name 
              FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_type = 'BASE TABLE'
              ORDER BY table_name;
            `
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      });

    if (error) {
      console.log('   ⚠️  Could not query tables directly');
      console.log(`   Error: ${error.message}\n`);
    } else if (tables) {
      console.log(`   ✅ Found ${tables.length} tables\n`);
      if (tables.length > 0) {
        console.log('   Tables:');
        tables.forEach(t => console.log(`     - ${t.table_name}`));
        console.log();
      }
    }
  } catch (error) {
    console.log('   ⚠️  Could not check tables');
    console.log(`   ${error.message}\n`);
  }

  // Check 2: Try to query institutions table specifically
  console.log('🏛️  Checking institutions table...');
  try {
    const { count, error } = await supabase
      .from('institutions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01') {
        console.log('   ❌ institutions table does NOT exist');
        console.log('   → Migration 001_create_schema.sql has NOT been run\n');
      } else if (error.message.includes('permission') || error.message.includes('forbidden')) {
        console.log('   ⚠️  Table might exist but RLS is blocking access');
        console.log('   → This could mean migrations were partially run\n');
      } else {
        console.log(`   ❌ Error: ${error.message}`);
        console.log(`   Code: ${error.code || 'unknown'}\n`);
      }
    } else {
      console.log(`   ✅ institutions table EXISTS`);
      console.log(`   ✅ Contains ${count || 0} institutions\n`);
    }
  } catch (error) {
    console.log(`   ❌ Unexpected error: ${error.message}\n`);
  }

  // Check 3: Try to query users table
  console.log('👤 Checking users table...');
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01') {
        console.log('   ❌ users table does NOT exist\n');
      } else {
        console.log(`   ⚠️  Error: ${error.message}\n`);
      }
    } else {
      console.log(`   ✅ users table EXISTS`);
      console.log(`   ✅ Contains ${count || 0} users\n`);
    }
  } catch (error) {
    console.log(`   ❌ Unexpected error: ${error.message}\n`);
  }

  // Summary
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     📋 MIGRATION STATUS SUMMARY                       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('Based on the checks above:\n');
  console.log('If you see "table does NOT exist" errors:');
  console.log('  → Migrations have NOT been run yet');
  console.log('  → You need to run the SQL files in Supabase SQL Editor\n');
  
  console.log('If you see "permission" or "forbidden" errors:');
  console.log('  → Tables might exist but RLS is blocking access');
  console.log('  → Check your service_role key is correct\n');
  
  console.log('If you see table counts:');
  console.log('  → Migrations have been successfully run');
  console.log('  → Database is ready for use\n');
}

checkDatabase().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
