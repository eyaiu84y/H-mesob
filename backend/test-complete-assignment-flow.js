/**
 * Test complete task assignment flow
 * Run: node test-complete-assignment-flow.js
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';
const MANAGER_EMAIL = 'sidama.manager@mesobcenter.et';
const MANAGER_PASSWORD = 'manager123';

async function test() {
  try {
    console.log('===========================================');
    console.log('TESTING COMPLETE ASSIGNMENT FLOW');
    console.log('===========================================\n');

    // Step 1: Login as manager
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
    console.log('✅ Manager logged in');
    console.log();

    // Step 2: Get maintenance reports
    console.log('Step 2: Fetching maintenance reports...');
    const reportsRes = await fetch(`${API_URL}/maintenance/reports`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const reportsData = await reportsRes.json();
    
    if (!reportsData.success || !reportsData.data || reportsData.data.length === 0) {
      console.error('❌ No maintenance reports found');
      return;
    }

    const report = reportsData.data[0];
    console.log('✅ Found maintenance reports');
    console.log(`   Using report: ${report.report_number} - ${report.title}`);
    console.log(`   Report ID: ${report.id}`);
    console.log();

    // Step 3: Get ICT staff
    console.log('Step 3: Fetching ICT staff...');
    const ictRes = await fetch(`${API_URL}/users?role=ICT_STAFF&status=ACTIVE`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const ictData = await ictRes.json();
    
    if (!ictData.success || !ictData.data || ictData.data.length === 0) {
      console.error('❌ No ICT staff found');
      return;
    }

    const ictStaff = ictData.data[0];
    console.log('✅ Found ICT staff');
    console.log(`   Technician: ${ictStaff.full_name}`);
    console.log(`   ICT ID: ${ictStaff.id}`);
    console.log();

    // Step 4: Assign report to ICT staff
    console.log('Step 4: Assigning report to ICT staff...');
    const assignRes = await fetch(`${API_URL}/maintenance/reports/${report.id}/assign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ictStaffId: ictStaff.id
      })
    });

    console.log('Assignment response status:', assignRes.status);
    
    const assignData = await assignRes.json();
    
    console.log('Assignment response:');
    console.log(JSON.stringify(assignData, null, 2));

    if (!assignData.success) {
      console.error('\n❌ Assignment failed:', assignData.message);
      return;
    }

    console.log('\n✅ ASSIGNMENT SUCCESSFUL!');
    console.log(`   Report ${report.report_number} assigned to ${ictStaff.full_name}`);
    console.log('   Status changed to: ASSIGNED');
    console.log('   Task created for ICT staff');
    console.log();

    // Step 5: Verify assignment
    console.log('Step 5: Verifying assignment...');
    const verifyRes = await fetch(`${API_URL}/maintenance/reports/${report.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const verifyData = await verifyRes.json();
    
    if (verifyData.success && verifyData.data) {
      console.log('✅ Verification successful');
      console.log(`   Report status: ${verifyData.data.status}`);
      console.log(`   Assigned to: ${verifyData.data.assigned_to || 'Not assigned'}`);
    }

    console.log('\n===========================================');
    console.log('TEST COMPLETED SUCCESSFULLY');
    console.log('===========================================');
    console.log('\nNow the ICT staff can:');
    console.log('1. Login as: getahun45@gmail.com');
    console.log('2. Go to Task Assignment → My Tasks');
    console.log('3. See the assigned task');
    console.log('4. Update status and complete it');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();
