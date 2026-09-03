/**
 * Test if ICT staff can fetch their tasks
 * Run: node test-ict-fetch-tasks.js
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';
const ICT_EMAIL = 'getahun45@gmail.com';
const ICT_PASSWORD = 'ict123'; // Reset password

async function test() {
  try {
    console.log('===========================================');
    console.log('TESTING ICT STAFF FETCH TASKS');
    console.log('===========================================\n');

    // Step 1: Login as ICT staff
    console.log('Step 1: Attempting to login as ICT staff...');
    console.log(`Email: ${ICT_EMAIL}`);
    
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ICT_EMAIL,
        password: ICT_PASSWORD
      })
    });

    const loginData = await loginRes.json();
    
    console.log('Login response:', loginData);
    
    if (!loginData.success) {
      console.error('\n❌ Login failed:', loginData.message);
      console.log('\nPlease provide the correct password for getahun45@gmail.com');
      console.log('Or I can reset the password for you.\n');
      return;
    }

    const token = loginData.data.accessToken;
    const user = loginData.data.user;
    
    console.log('\n✅ ICT staff logged in');
    console.log('   User ID:', user.id);
    console.log('   Name:', user.full_name);
    console.log('   Role:', user.role);
    console.log('   Institution ID:', user.institution_id);
    console.log();

    // Step 2: Fetch maintenance tasks
    console.log('Step 2: Fetching maintenance tasks...');
    const tasksRes = await fetch(`${API_URL}/maintenance/my-tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Tasks response status:', tasksRes.status);
    
    const tasksData = await tasksRes.json();
    
    console.log('\nTasks response:');
    console.log(JSON.stringify(tasksData, null, 2));

    if (!tasksData.success) {
      console.error('\n❌ Failed to fetch tasks:', tasksData.message);
      return;
    }

    console.log('\n✅ Tasks fetched successfully');
    console.log('   Total tasks:', tasksData.data?.length || 0);
    
    if (tasksData.data && tasksData.data.length > 0) {
      console.log('\n📋 Tasks:');
      tasksData.data.forEach((t, i) => {
        console.log(`   ${i + 1}. Task ID: ${t.id}`);
        console.log(`      Report: ${t.maintenance_reports?.report_number || 'N/A'}`);
        console.log(`      Title: ${t.maintenance_reports?.title || 'N/A'}`);
        console.log(`      Status: ${t.status}`);
        console.log(`      Priority: ${t.maintenance_reports?.priority || 'N/A'}`);
        console.log();
      });
    } else {
      console.log('\n⚠️ No tasks found for this ICT staff');
      console.log('\nChecking maintenance_tasks table directly...');
      
      // Direct database check would go here
    }

    console.log('===========================================');
    console.log('TEST COMPLETED');
    console.log('===========================================');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();
