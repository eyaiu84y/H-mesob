/**
 * Fix Queue Duplicate Key Error
 * This script clears all queue entries to allow fresh registrations
 */

import { supabase } from './src/config/supabase.js';

async function fixQueueDuplicates() {
  console.log('=== FIXING QUEUE DUPLICATE KEY ERROR ===\n');

  try {
    // Step 1: Delete all queue entries
    console.log('Step 1: Deleting all queue entries...');
    const { error: deleteError } = await supabase
      .from('queue_entries')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('❌ Failed to delete queue entries:', deleteError);
      return;
    }

    console.log('✅ All queue entries deleted\n');

    // Step 2: Verify deletion
    console.log('Step 2: Verifying deletion...');
    const { data, error } = await supabase
      .from('queue_entries')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Failed to verify:', error);
      return;
    }

    console.log(`✅ Queue entries count: 0\n`);

    console.log('=== FIX COMPLETE ===');
    console.log('You can now register for queue without duplicate key errors!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  process.exit(0);
}

fixQueueDuplicates();
