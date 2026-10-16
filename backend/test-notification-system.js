import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5000/api';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const testUsers = {
  SUPER_ADMIN: { email: 'superadmin@mesobcenter.et', password: 'SuperAdmin@2026' },
  MESOB_MANAGER: { email: 'manager@mesobcenter.et', password: 'MesobManager@2026' },
  INSTITUTION_MANAGER: { email: 'inst.manager@mesobcenter.et', password: 'InstManager@2026' },
  EMPLOYEE: { email: 'employee@mesobcenter.et', password: 'Employee@2026' },
  TECHNICIAN: { email: 'tech@mesobcenter.et', password: 'tech@2026' },
  CUSTOMER: { email: 'customer@mesobcenter.et', password: 'customer@2026' }
};

let tokens = {};
let users = {};
let passes = 0;
let fails = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passes++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    fails++;
  }
}

async function run() {
  console.log('===============================================================');
  console.log('   HAWASSA MESOB NOTIFICATION SYSTEM VERIFICATION TEST SUITE  ');
  console.log('===============================================================\n');

  // TEST 1: Unauthenticated Requests Rejected
  console.log('--- 1. Testing Authentication Enforcement ---');
  const unauthRes1 = await fetch(`${API_URL}/notifications`);
  assert(unauthRes1.status === 401, 'GET /notifications without token returns 401');

  const unauthRes2 = await fetch(`${API_URL}/notifications/unread-count`);
  assert(unauthRes2.status === 401, 'GET /notifications/unread-count without token returns 401');

  const badTokenRes = await fetch(`${API_URL}/notifications`, {
    headers: { Authorization: 'Bearer invalid-token-xyz' }
  });
  assert(badTokenRes.status === 401, 'GET /notifications with invalid token returns 401');

  // TEST 2: Login All Six Roles
  console.log('\n--- 2. Authenticating All Six Roles ---');
  for (const [role, creds] of Object.entries(testUsers)) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds)
    });
    const data = await res.json();
    if (res.ok && data.success && data.data?.accessToken) {
      tokens[role] = data.data.accessToken;
      users[role] = data.data.user;
      assert(true, `Login successful for ${role} (${creds.email})`);
    } else {
      assert(false, `Login failed for ${role}: ${data.message || res.status}`);
    }
  }

  // TEST 3: Notification Retrieval for All Six Roles
  console.log('\n--- 3. Testing Notification Retrieval & Isolation for All Six Roles ---');
  for (const [role] of Object.entries(testUsers)) {
    const token = tokens[role];
    const user = users[role];
    if (!token) continue;

    const res = await fetch(`${API_URL}/notifications?limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    assert(res.ok && json.success === true, `GET /notifications succeeds for ${role}`);
    assert(Array.isArray(json.data), `GET /notifications returns array for ${role}`);

    // Verify all returned notifications strictly belong to the authenticated user
    const otherUserNotifications = json.data.filter(n => n.recipient_id !== user.id);
    assert(
      otherUserNotifications.length === 0,
      `Strict user isolation: 0 notifications from other users for ${role}`
    );

    // Verify unread count endpoint
    const countRes = await fetch(`${API_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const countJson = await countRes.json();
    assert(
      countRes.ok && typeof countJson.data?.unreadCount === 'number',
      `GET /notifications/unread-count returns integer for ${role} (count=${countJson.data?.unreadCount})`
    );
  }

  // TEST 4: Security & Cross-User Tampering Prevention
  console.log('\n--- 4. Testing Cross-User Tampering & RBAC Security ---');
  const customerUser = users.CUSTOMER;
  const employeeUser = users.EMPLOYEE;

  // Insert a test notification explicitly for customerUser
  const { data: testNotif, error: insertErr } = await supabase
    .from('notifications')
    .insert({
      recipient_id: customerUser.id,
      type: 'APPLICATION_UPDATE',
      title: 'Security Isolation Test',
      message: 'This notification belongs only to the customer.',
      is_read: false
    })
    .select()
    .single();

  assert(!insertErr && testNotif, 'Created isolated test notification for Customer');

  // Attempt to mark Customer notification as read using Employee token
  const tamperRes = await fetch(`${API_URL}/notifications/${testNotif.id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokens.EMPLOYEE}` }
  });
  const tamperJson = await tamperRes.json();
  assert(
    tamperRes.status === 404 || tamperRes.status === 403,
    `Unauthorized mark-read attempt rejected (${tamperRes.status}: ${tamperJson.message})`
  );

  // Verify notification is STILL unread in the database
  const { data: checkNotif } = await supabase
    .from('notifications')
    .select('is_read')
    .eq('id', testNotif.id)
    .single();
  assert(checkNotif?.is_read === false, 'Notification read status remained false after tampered attempt');

  // Customer legitimately marks their own notification as read
  const legitimateRes = await fetch(`${API_URL}/notifications/${testNotif.id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokens.CUSTOMER}` }
  });
  assert(legitimateRes.ok, 'Legitimate owner (Customer) successfully marked notification as read');

  // Customer marks all as read
  const markAllRes = await fetch(`${API_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokens.CUSTOMER}` }
  });
  const markAllJson = await markAllRes.json();
  assert(markAllRes.ok && markAllJson.success, 'Customer mark-all-as-read succeeded');

  const customerUnreadRes = await fetch(`${API_URL}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${tokens.CUSTOMER}` }
  });
  const customerUnreadJson = await customerUnreadRes.json();
  assert(customerUnreadJson.data?.unreadCount === 0, 'Customer unread count is now 0');

  // Clean up test notification
  await supabase.from('notifications').delete().eq('id', testNotif.id);

  // TEST 5: Real Workflow Notification Creation
  console.log('\n--- 5. Testing Real Workflow Events Notification Generation ---');
  const { createNotification, notifyApprovalRequest, notifyApprovalDecision } = await import(
    './src/services/notificationService.js'
  );

  // Test centralized createNotification with deduplication
  const notif1 = await createNotification({
    recipientId: employeeUser.id,
    type: 'APPLICATION_UPDATE',
    title: 'New Service Application Assigned',
    message: 'Application #TEST-001 has been assigned to your queue.',
    relatedEntityType: 'application',
    relatedEntityId: '00000000-0000-0000-0000-000000000001'
  });
  assert(notif1?.success === true, 'Centralized createNotification created notification for Employee');

  // Deduplication test: immediately calling with same content should return existing without duplicate insert
  const notif2 = await createNotification({
    recipientId: employeeUser.id,
    type: 'APPLICATION_UPDATE',
    title: 'New Service Application Assigned',
    message: 'Application #TEST-001 has been assigned to your queue.',
    relatedEntityType: 'application',
    relatedEntityId: '00000000-0000-0000-0000-000000000001'
  });
  assert(notif2?.deduplicated === true, 'Deduplication works: identical notification within 2 min deduplicated');

  // Test Approval Workflow Hooks
  console.log('\n--- 6. Testing Approval Workflow Notification Helpers ---');
  const approvalReq = await notifyApprovalRequest({
    entityType: 'Institution',
    entityName: 'Hawassa City Water Supply Sub-Office',
    requestingAdminId: users.SUPER_ADMIN.id
  });
  assert(approvalReq?.success === true, 'notifyApprovalRequest executed and dispatched notifications');

  const approvalDecision = await notifyApprovalDecision({
    entityType: 'Institution',
    entityName: 'Hawassa City Water Supply Sub-Office',
    status: 'APPROVED',
    requestingAdminId: users.SUPER_ADMIN.id,
    decisionNotes: 'Meets all municipal guidelines'
  });
  assert(approvalDecision?.success === true, 'notifyApprovalDecision sent decision notification to requesting Admin');

  // Clean up any test notifications created
  await supabase
    .from('notifications')
    .delete()
    .eq('related_entity_id', '00000000-0000-0000-0000-000000000001');
  await supabase
    .from('notifications')
    .delete()
    .eq('title', 'New Service Application Assigned');
  await supabase
    .from('notifications')
    .delete()
    .eq('title', 'Approval Required: Institution');
  await supabase
    .from('notifications')
    .delete()
    .eq('title', 'Approval APPROVED: Institution');

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passes} Passed, ${fails} Failed`);
  console.log('===============================================================\n');

  if (fails > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
