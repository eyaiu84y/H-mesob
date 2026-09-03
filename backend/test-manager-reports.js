/**
 * Test if manager can fetch maintenance reports
 * Run: node test-manager-reports.js
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';
const MANAGER_EMAIL = 'sidama.manager@mesobcenter.et';
const MANAGER_PASSWORD = 'manager123';

async function test() {
  try {
    console.log('===========================================');
    console.log('TESTING MANAGER REPORTS FETCH');
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
    console.log('   User ID:', user.id);
    console.log('   Name:', user.full_name);
    console.log('   Role:', user.role);
    console.log('   Institution ID:', user.institution_id);
    console.log();

    // Fetch reports
    console.log('Step 2: Fetching maintenance reports...');
    const reportsRes = await fetch(`${API_URL}/maintenance/reports`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', reportsRes.status);
    
    const reportsData = await reportsRes.json();
    
    console.log('\nResponse data:');
    console.log(JSON.stringify(reportsData, null, 2));

    if (!reportsData.success) {
      console.error('\n❌ Failed to fetch reports:', reportsData.message);
      return;
    }

    console.log('\n✅ Reports fetched successfully');
    console.log('   Total reports:', reportsData.data?.length || 0);
    
    if (reportsData.data && reportsData.data.length > 0) {
      console.log('\n📋 Reports:');
      reportsData.data.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.report_number || r.id}`);
        console.log(`      Title: ${r.title}`);
        console.log(`      Status: ${r.status}`);
        console.log(`      Institution ID: ${r.institution_id}`);
        console.log(`      Reported By: ${r.reported_by}`);
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
