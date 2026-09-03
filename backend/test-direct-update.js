/**
 * Direct database test - bypass API to test Supabase update
 * Run: node test-direct-update.js
 */

import { supabase } from './src/config/supabase.js';

async function testDirectUpdate() {
  try {
    console.log('===========================================');
    console.log('TESTING DIRECT DATABASE UPDATE');
    console.log('===========================================\n');

    const employeeId = 'a0c3655b-0599-4b35-856d-55a9b0d5f79e'; // Sidama Bank employee
    const institutionId = '15208ad9-5fc3-4e8c-aa14-1f392437c6c9'; // Sidama Bank

    // Step 1: Find pending queue
    console.log('Step 1: Find pending queue...');
    const { data: queues, error: findError } = await supabase
      .from('queue_entries')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('status', 'PENDING')
      .order('priority', { ascending: false })
      .order('queue_number', { ascending: true })
      .limit(1);

    if (findError) {
      console.error('❌ Error finding queue:', findError);
      return;
    }

    if (!queues || queues.length === 0) {
      console.log('❌ No pending queues found');
      return;
    }

    const queue = queues[0];
    console.log('✅ Found queue:', {
      id: queue.id,
      queue_number: queue.queue_number,
      status: queue.status,
      institution_id: queue.institution_id,
      citizen_id: queue.citizen_id
    });
    console.log();

    // Step 2: Try to update
    console.log('Step 2: Attempting to update queue to IN_PROGRESS...');
    const updateData = {
      status: 'IN_PROGRESS',
      assigned_to: employeeId,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Update data:', updateData);
    console.log();

    const { data: updatedQueue, error: updateError } = await supabase
      .from('queue_entries')
      .update(updateData)
      .eq('id', queue.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      console.error('Error code:', updateError.code);
      console.error('Error message:', updateError.message);
      console.error('Error details:', JSON.stringify(updateError.details, null, 2));
      console.error('Error hint:', updateError.hint);
      return;
    }

    if (!updatedQueue) {
      console.error('❌ Update succeeded but no data returned');
      return;
    }

    console.log('✅ UPDATE SUCCESSFUL!');
    console.log('Updated queue:', {
      id: updatedQueue.id,
      queue_number: updatedQueue.queue_number,
      status: updatedQueue.status,
      assigned_to: updatedQueue.assigned_to,
      started_at: updatedQueue.started_at
    });

    console.log('\n===========================================');
    console.log('TEST COMPLETED SUCCESSFULLY');
    console.log('===========================================');
    console.log('The database update works! The issue is elsewhere.');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDirectUpdate();
