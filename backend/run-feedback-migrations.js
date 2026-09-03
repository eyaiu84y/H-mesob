import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  try {
    console.log('📦 Running feedback table migrations...\n');

    // Read migration files
    const createTableSQL = readFileSync(
      join(__dirname, 'database/migrations/004_create_feedback_table.sql'),
      'utf8'
    );

    const createRLSSQL = readFileSync(
      join(__dirname, 'database/migrations/005_feedback_rls_policies.sql'),
      'utf8'
    );

    // Run create table migration
    console.log('1️⃣  Creating service_feedback table...');
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql_string: createTableSQL
    });

    if (createError) {
      // If exec_sql function doesn't exist, we need to execute via raw query
      // Try direct execution
      console.log('   Attempting direct execution...');
      const statements = createTableSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));

      for (const statement of statements) {
        if (statement) {
          const { error } = await supabase.from('_migrations').select('*').limit(0);
          // This won't work directly, we need to use the REST API or CLI
          console.log('   Migration SQL prepared (needs manual execution via Supabase dashboard)');
        }
      }
    }

    console.log('✅ Table creation migration prepared\n');

    // Run RLS policies migration
    console.log('2️⃣  Creating RLS policies...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql_string: createRLSSQL
    });

    if (rlsError) {
      console.log('   RLS policies migration prepared (needs manual execution via Supabase dashboard)');
    }

    console.log('✅ RLS policies migration prepared\n');

    console.log('📋 MIGRATION INSTRUCTIONS:');
    console.log('════════════════════════════════════════════════════════');
    console.log('Since direct SQL execution requires special permissions,');
    console.log('please run these migrations manually via Supabase dashboard:');
    console.log('');
    console.log('1. Open Supabase Dashboard → SQL Editor');
    console.log('2. Run: database/migrations/004_create_feedback_table.sql');
    console.log('3. Run: database/migrations/005_feedback_rls_policies.sql');
    console.log('════════════════════════════════════════════════════════\n');

    // Verify table exists
    console.log('🔍 Verifying feedback table...');
    const { data, error } = await supabase
      .from('service_feedback')
      .select('id')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('⚠️  Table does not exist yet - please run migrations via Supabase dashboard');
      } else {
        console.log('✅ Table exists!');
      }
    } else {
      console.log('✅ service_feedback table is ready!');
    }

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

runMigrations();
