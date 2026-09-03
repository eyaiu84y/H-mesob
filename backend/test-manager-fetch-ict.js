/**
 * Test if manager can fetch ICT staff via /api/users
 * Run: node test-manager-fetch-ict.js
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';
const MANAGER_EMAIL = 'sidama.manager@mesobcenter.et';
const MANAGER_PASSWORD = 'manager123';

async function test() {
  try {
    console.log('===========================================');
    console.log('TESTING MANAGER FETCH ICT STAFF');
    console.log('===========================================\n');

    // Login as manager
    console.log('Step 1: Login as Sidama Bank manager...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: MANAGER_EMAIL,
        password: MANAGER_PASSWORD
      })
    });

    const loginData = await loginRes.json();
    
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }

    const token = loginData.data.accessToken;
    const user = loginData.data.user;
    
    console.log('✅ Manager logged in');
    console.log('   Institution ID:', user.institution_id);
    console.log();

    // Fetch users with ICT_STAFF role
    console.log('Step 2: Fetching ICT staff (GET /api/users?role=ICT_STAFF&status=ACTIVE)...');
    const usersRes = await fetch(`${API_URL}/users?role=ICT_STAFF&status=ACTIVE`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', usersRes.status);
    
    const usersData = await usersRes.json();
    
    console.log('\nResponse data:');
    console.log(JSON.stringify(usersData, null, 2));

    if (!usersData.success) {
      console.error('\n❌ Failed to fetch users:', usersData.message);
      return;
    }

    console.log('\n✅ Users fetched successfully');
    console.log('   Total users:', usersData.data?.length || 0);
    
    if (usersData.data && usersData.data.length > 0) {
      console.log('\n👤 ICT Staff:');
      usersData.data.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.full_name || u.name}`);
        console.log(`      Email: ${u.email}`);
        console.log(`      ID: ${u.id}`);
        console.log(`      Role: ${u.role}`);
        console.log(`      Institution ID: ${u.institution_id}`);
        console.log();
      });
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
