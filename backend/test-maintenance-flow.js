/**
 * Test maintenance report flow
 * Run: node test-maintenance-flow.js
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

const EMPLOYEE_EMAIL = 'sidama.employee@mesobcenter.et';
const EMPLOYEE_PASSWORD = 'sidama123';

const MANAGER_EMAIL = 'sidama.manager@mesobcenter.et';
const MANAGER_PASSWORD = 'manager123';

async function test() {
  try {
    console.log('===========================================');
    console.log('TESTING MAINTENANCE REPORT FLOW');
    console.log('===========================================\n');

    // Step 1: Login as employee
    console.log('Step 1: Login as Sidama Bank employee...');
    const empLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: EMPLOYEE_EMAIL,
        password: EMPLOYEE_PASSWORD
      })
    });

    const empLoginData = await empLoginRes.json();
    
    if (!empLoginData.success) {
      console.error('❌ Employee login failed:', empLoginData.message);
      return;
    }

    const empToken = empLoginData.data.accessToken;
    const empUser = empLoginData.data.user;
    console.log('✅ Employee logged in');
    console.log('   Name:', empUser.full_name);
    console.log('   Institution ID:', empUser.institution_id);
    console.log();

    // Step 2: Employee submits maintenance report
    console.log('Step 2: Employee submits maintenance report...');
    const reportRes = await fetch(`${API_URL}/maintenance/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${empToken}`
      },
      body: JSON.stringify({
        institutionId: empUser.institution_id,
        problemType: 'Broken Computer',
        description: 'The desktop computer in my office is not turning on',
        location: 'Building A, Floor 2',
        officeNumber: '205',
        priority: 'NORMAL',
        category: 'IT Equipment'
      })
    });

    const reportData = await reportRes.json();
    
    console.log('Report submission response:', reportData);
    
    if (!reportData.success) {
      console.error('❌ Failed to submit report:', reportData.message);
      return;
    }

    console.log('✅ Report submitted successfully');
    console.log('   Report Number:', reportData.data.report_number);
    console.log('   Report ID:', reportData.data.id);
    console.log();

    // Step 3: Login as manager
    console.log('Step 3: Login as Sidama Bank manager...');
    const mgrLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: MANAGER_EMAIL,
        password: MANAGER_PASSWORD
      })
    });

    const mgrLoginData = await mgrLoginRes.json();
    
    if (!mgrLoginData.success) {
      console.error('❌ Manager login failed:', mgrLoginData.message);
      return;
    }

    const mgrToken = mgrLoginData.data.accessToken;
    const mgrUser = mgrLoginData.data.user;
    console.log('✅ Manager logged in');
    console.log('   Name:', mgrUser.full_name);
    console.log('   Institution ID:', mgrUser.institution_id);
    console.log();

    // Step 4: Manager fetches reports
    console.log('Step 4: Manager fetches maintenance reports...');
    const reportsRes = await fetch(`${API_URL}/maintenance/reports`, {
      headers: {
        'Authorization': `Bearer ${mgrToken}`
      }
    });

    const reportsData = await reportsRes.json();
    
    console.log('Fetch reports response:', reportsData);
    
    if (!reportsData.success) {
      console.error('❌ Failed to fetch reports:', reportsData.message);
      return;
    }

    console.log('✅ Reports fetched successfully');
    console.log('   Total reports:', reportsData.data.length);
    
    if (reportsData.data.length > 0) {
      console.log('\nReports:');
      reportsData.data.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.report_number} - ${r.title} [${r.status}]`);
      });
    } else {
      console.log('   ⚠️ No reports found for manager');
    }

    console.log('\n===========================================');
    console.log('TEST COMPLETED');
    console.log('===========================================');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();
