import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function clearAllQueueEntries() {
  console.log('🔍 Checking for all queue entries...\n');

  // Check existing queue entries
  const { data: existingEntries, error: checkError } = await supabase
    .from('queue_entries')
    .select('*');

  if (checkError) {
    console.error('❌ Error checking queue entries:', checkError.message);
    process.exit(1);
  }

  if (!existingEntries || existingEntries.length === 0) {
    console.log('✅ No queue entries found. Database is clean.');
    process.exit(0);
  }

  console.log(`📋 Found ${existingEntries.length} queue entry(ies):`);
  existingEntries.forEach(entry => {
    console.log(`   - ${entry.queue_number} (${entry.status}) - Institution: ${entry.institution_id.substring(0, 8)}...`);
  });

  // Delete all queue entries
  console.log('\n🗑️  Deleting all queue entries...');
  const { error: deleteError } = await supabase
    .from('queue_entries')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using dummy condition)

  if (deleteError) {
    console.error('❌ Error deleting queue entries:', deleteError.message);
    process.exit(1);
  }

  console.log('✅ Successfully cleared all queue entries from database.');
  console.log('\n📝 You can now run the test suite:\n   node test-auth-rbac-complete.js\n');
}

clearAllQueueEntries();
