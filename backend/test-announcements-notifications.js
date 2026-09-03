import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Test credentials (from seed data)
const SUPER_ADMIN = { email: 'superadmin@mesobcenter.et', password: 'SuperAdmin@2026' };
const EMPLOYEE = { email: 'employee@mesobcenter.et', password: 'Employee@2026' };

let superAdminToken = null;
let employeeToken = null;
let createdAnnouncementId = null;
let notificationId = null;

// Helper function for API calls
const api = axios.create({ baseURL: API_URL });

// Test 1: Login as Super Admin and Employee
async function test1_login() {
  console.log('\n=== TEST 1: Login ===');
  try {
    // Login as Super Admin
    const adminRes = await api.post('/auth/login', SUPER_ADMIN);
    superAdminToken = adminRes.data.data.accessToken;
    console.log('✅ Super Admin login successful');

    // Login as Employee
    const empRes = await api.post('/auth/login', EMPLOYEE);
    employeeToken = empRes.data.data.accessToken;
    console.log('✅ Employee login successful');

    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Get announcements (public access, no auth required)
async function test2_getAnnouncementsPublic() {
  console.log('\n=== TEST 2: Get Announcements (Public) ===');
  try {
    const res = await api.get('/announcements');
    console.log(`✅ Retrieved ${res.data.data.length} announcements`);
    console.log('Sample:', res.data.data[0] ? `ID: ${res.data.data[0].id}, Title: ${res.data.data[0].title}` : 'No announcements');
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Employee tries to create announcement (should fail with 403)
async function test3_employeeCreateAnnouncementDenied() {
  console.log('\n=== TEST 3: Employee Creates Announcement (Should Fail) ===');
  try {
    await api.post('/announcements', 
      {
        title: 'Unauthorized Announcement',
        message: 'This should not be created',
        priority: 'LOW'
      },
      { headers: { Authorization: `Bearer ${employeeToken}` } }
    );
    console.error('❌ Employee was able to create announcement (should have been denied!)');
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Employee correctly denied (403 Forbidden)');
      return true;
    }
    console.error('❌ Unexpected error:', error.response?.data || error.message);
    return false;
  }
}

// Test 4: Super Admin creates announcement
async function test4_superAdminCreateAnnouncement() {
  console.log('\n=== TEST 4: Super Admin Creates Announcement ===');
  try {
    const res = await api.post('/announcements',
      {
        title: 'Test Announcement ' + Date.now(),
        content: 'This is a test announcement for Phase 6 integration',
        scope: 'PUBLIC'
      },
      { headers: { Authorization: `Bearer ${superAdminToken}` } }
    );
    
    createdAnnouncementId = res.data.data.id;
    console.log('✅ Announcement created successfully');
    console.log(`   ID: ${res.data.data.id}`);
    console.log(`   Title: ${res.data.data.title}`);
    console.log(`   Scope: ${res.data.data.scope}`);
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 5: Employee gets notifications
async function test5_employeeGetNotifications() {
  console.log('\n=== TEST 5: Employee Gets Notifications ===');
  try {
    const res = await api.get('/notifications', {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    
    console.log(`✅ Retrieved ${res.data.data.length} notifications`);
    
    if (res.data.data.length > 0) {
      notificationId = res.data.data[0].id;
      const unreadCount = res.data.data.filter(n => !n.is_read).length;
      console.log(`   Unread: ${unreadCount}`);
      console.log(`   Sample: ID: ${res.data.data[0].id}, Type: ${res.data.data[0].type}, Read: ${res.data.data[0].is_read}`);
    }
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 6: Employee gets unread count
async function test6_employeeGetUnreadCount() {
  console.log('\n=== TEST 6: Employee Gets Unread Count ===');
  try {
    const res = await api.get('/notifications/unread-count', {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    
    console.log(`✅ Unread count: ${res.data.data.unreadCount}`);
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 7: Employee marks notification as read
async function test7_employeeMarkNotificationRead() {
  console.log('\n=== TEST 7: Employee Marks Notification as Read ===');
  if (!notificationId) {
    console.log('⚠️  Skipped: No notification ID available');
    return false;
  }
  
  try {
    const res = await api.patch(`/notifications/${notificationId}/read`, {}, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    
    console.log('✅ Notification marked as read');
    console.log(`   ID: ${notificationId}`);
    console.log(`   Read at: ${res.data.data.read_at || 'N/A'}`);
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 8: Employee marks all notifications as read
async function test8_employeeMarkAllRead() {
  console.log('\n=== TEST 8: Employee Marks All Notifications as Read ===');
  try {
    const res = await api.patch('/notifications/read-all', {}, {
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    
    console.log('✅ All notifications marked as read');
    console.log(`   Response: ${JSON.stringify(res.data)}`);
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  PHASE 6: Announcements & Notifications Tests     ║');
  console.log('╚════════════════════════════════════════════════════╝');

  const results = [];

  results.push(await test1_login());
  if (!results[0]) {
    console.log('\n❌ Login failed, stopping tests');
    return;
  }

  results.push(await test2_getAnnouncementsPublic());
  results.push(await test3_employeeCreateAnnouncementDenied());
  results.push(await test4_superAdminCreateAnnouncement());
  results.push(await test5_employeeGetNotifications());
  results.push(await test6_employeeGetUnreadCount());
  results.push(await test7_employeeMarkNotificationRead());
  results.push(await test8_employeeMarkAllRead());

  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║                   TEST SUMMARY                     ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`Tests Passed: ${passed}/${total} (${percentage}%)`);
  console.log(results.map((r, i) => `${i + 1}. ${r ? '✅ PASS' : '❌ FAIL'}`).join('\n'));
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Phase 6 backend integration working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check errors above.');
  }
}

runAllTests();
