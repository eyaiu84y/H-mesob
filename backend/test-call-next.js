/**
 * Test script to diagnose call-next endpoint
 * Run: node test-call-next.js
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

// Use the Sidama Bank employee credentials
const EMPLOYEE_EMAIL = 'sidama.employee@mesobcenter.et';
const EMPLOYEE_PASSWORD = 'sidama123';

async function test() {
  try {
    console.log('===========================================');
    console.log('TESTING CALL-NEXT ENDPOINT');
    console.log('===========================================\n');

    // Step 1: Login as employee
    console.log('Step 1: Login as Sidama Bank employee...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: EMPLOYEE_EMAIL,
        password: EMPLOYEE_PASSWORD
      })
    });

    const loginData = await loginRes.json();
    
    console.log('Login response:', loginData);
    
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }
    
    const token = loginData.data?.accessToken || loginData.token;
    if (!token) {
      console.error('❌ No token in response');
      return;
    }

    console.log('✅ Login successful');
    console.log('User:', loginData.data.user.full_name);
    console.log('Role:', loginData.data.user.role);
    console.log('Institution ID:', loginData.data.user.institution_id);
    console.log('Token:', token.substring(0, 20) + '...\n');

    // Step 2: Get current queues
    console.log('Step 2: Get current queues...');
    const queuesRes = await fetch(`${API_URL}/queues`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const queuesData = await queuesRes.json();
    
    if (!queuesData.success) {
      console.error('❌ Failed to get queues:', queuesData.message);
      return;
    }

    console.log('✅ Queues fetched successfully');
    console.log('Total queues:', queuesData.data.length);
    
    const pendingQueues = queuesData.data.filter(q => q.status === 'PENDING');
    console.log('Pending queues:', pendingQueues.length);
    
    if (pendingQueues.length > 0) {
      console.log('\nPending queue entries:');
      pendingQueues.forEach(q => {
        console.log(`  - ${q.queue_number} | Status: ${q.status} | Citizen: ${q.citizen_id}`);
      });
    }
    
    const inProgressQueues = queuesData.data.filter(q => q.status === 'IN_PROGRESS');
    console.log('In-progress queues:', inProgressQueues.length);
    
    if (inProgressQueues.length > 0) {
      console.log('\nIn-progress queue entries:');
      inProgressQueues.forEach(q => {
        console.log(`  - ${q.queue_number} | Status: ${q.status} | Citizen: ${q.citizen_id}`);
      });
    }
    console.log();

    // Step 3: Call next
    console.log('Step 3: Call next customer...');
    const callNextRes = await fetch(`${API_URL}/queues/call-next`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const callNextData = await callNextRes.json();
    
    console.log('Response status:', callNextRes.status);
    console.log('Response data:', JSON.stringify(callNextData, null, 2));

    if (!callNextData.success) {
      console.error('❌ Call next failed:', callNextData.message);
      return;
    }

    console.log('✅ Call next successful!');
    console.log('Called queue:', callNextData.data.queue_number);
    console.log('Status:', callNextData.data.status);
    console.log('Assigned to:', callNextData.data.assigned_to);
    console.log('Started at:', callNextData.data.started_at);

    console.log('\n===========================================');
    console.log('TEST COMPLETED SUCCESSFULLY');
    console.log('===========================================');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();
