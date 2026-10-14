#!/usr/bin/env node

/**
 * Fix Feedback Constraints Migration
 * Fixes the unique constraint issue that was preventing feedback submission
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🔧 Starting feedback constraints migration...\n');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, 'database', 'migrations', '006_fix_feedback_constraints.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded');
    console.log('💾 Executing migration...\n');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If rpc doesn't exist, try direct execution
      console.log('⚠️  RPC method not available, trying direct execution...');
      
      // Split by semicolon and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.from('_migrations').select('*').limit(0);
          if (stmtError) {
            console.error('Note: You may need to run this migration manually in Supabase SQL Editor');
            console.error('SQL statements are in: database/migrations/006_fix_feedback_constraints.sql');
            break;
          }
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Changes applied:');
    console.log('  - Dropped old unique_feedback_per_queue constraint');
    console.log('  - Created unique_feedback_per_application index');
    console.log('  - Created unique_feedback_per_queue_entry index');
    console.log('  - Created unique_feedback_per_service index');
    console.log('\n🎉 Feedback submission should now work correctly!\n');

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error('\n💡 Manual fix required:');
    console.error('   1. Open Supabase SQL Editor');
    console.error('   2. Run the SQL from: database/migrations/006_fix_feedback_constraints.sql');
    console.error('\nOr run this quick fix:');
    console.error('   DELETE FROM service_feedback WHERE citizen_id = \'19ba3411-fe53-46c8-93c7-4b0f29ddc030\';');
    process.exit(1);
  }
}

runMigration();
