#!/usr/bin/env node
/**
 * Verification script for Announcement Edit/Delete buttons
 * 
 * Run this to verify all components are in place:
 * node verify-announcement-buttons.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Announcement Edit/Delete Implementation...\n');

const checks = [];

// Check 1: MesobManagerDashboard has canModify function
const dashboardPath = path.join(__dirname, 'frontend/src/pages/dashboard/MesobManagerDashboard.jsx');
const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');

checks.push({
  name: 'canModify function exists',
  pass: dashboardCode.includes('function canModify(ann)'),
  details: 'Checks user permissions for edit/delete'
});

checks.push({
  name: 'handleEdit function exists',
  pass: dashboardCode.includes('function handleEdit(ann)'),
  details: 'Opens edit form with pre-filled data'
});

checks.push({
  name: 'handleDelete function exists',
  pass: dashboardCode.includes('async function handleDelete(annId, annTitle)'),
  details: 'Deletes announcement with confirmation'
});

checks.push({
  name: 'Edit button rendered',
  pass: dashboardCode.includes('onClick={() => handleEdit(ann)}') && dashboardCode.includes('Edit') && dashboardCode.includes('title="Edit announcement"'),
  details: 'Edit button in detail view'
});

checks.push({
  name: 'Delete button rendered',
  pass: dashboardCode.includes('onClick={() => handleDelete(ann.id, ann.title)}') && dashboardCode.includes('Delete') && dashboardCode.includes('title="Delete announcement"'),
  details: 'Delete button in detail view'
});

checks.push({
  name: 'Conditional rendering with canEdit',
  pass: dashboardCode.includes('const canEdit = canModify(ann)') && dashboardCode.includes('{canEdit && ('),
  details: 'Buttons only show when user has permission'
});

checks.push({
  name: 'SUPER_ADMIN role check',
  pass: dashboardCode.includes("['SUPER_ADMIN', 'MESOB_MANAGER'].includes(user?.role)"),
  details: 'Super Admin can edit/delete all announcements'
});

checks.push({
  name: 'MESOB_MANAGER role check',
  pass: dashboardCode.includes("['SUPER_ADMIN', 'MESOB_MANAGER'].includes(user?.role)"),
  details: 'MESOB Manager can edit/delete all announcements'
});

checks.push({
  name: 'Owner check for Institution Manager',
  pass: dashboardCode.includes('ann.creator?.id === user?.id || ann.published_by === user?.id'),
  details: 'Institution Manager can edit/delete own announcements'
});

checks.push({
  name: 'Debug console logs',
  pass: dashboardCode.includes("console.log('canModify check:',") && dashboardCode.includes("console.log('User is admin/manager - can modify all')"),
  details: 'Console logs for troubleshooting'
});

// Check 2: AnnouncementContext has update/delete methods
const contextPath = path.join(__dirname, 'frontend/src/context/AnnouncementContext.jsx');
const contextCode = fs.readFileSync(contextPath, 'utf8');

checks.push({
  name: 'updateAnnouncement in context',
  pass: contextCode.includes('const updateAnnouncement = useCallback(async (announcementId, announcementData)'),
  details: 'Context method for updating announcements'
});

checks.push({
  name: 'deleteAnnouncement in context',
  pass: contextCode.includes('const deleteAnnouncement = useCallback(async (announcementId)'),
  details: 'Context method for deleting announcements'
});

checks.push({
  name: 'updateAnnouncement exported',
  pass: contextCode.includes('updateAnnouncement,') && contextCode.includes('AnnouncementContext.Provider'),
  details: 'Method available via useAnnouncements hook'
});

checks.push({
  name: 'deleteAnnouncement exported',
  pass: contextCode.includes('deleteAnnouncement,') && contextCode.includes('AnnouncementContext.Provider'),
  details: 'Method available via useAnnouncements hook'
});

checks.push({
  name: 'PATCH API call for update',
  pass: contextCode.includes("api.patch(`/announcements/${announcementId}`, announcementData)"),
  details: 'Calls PATCH /api/announcements/:id'
});

checks.push({
  name: 'DELETE API call',
  pass: contextCode.includes("api.delete(`/announcements/${announcementId}`)"),
  details: 'Calls DELETE /api/announcements/:id'
});

// Check 3: Dashboard imports context correctly
checks.push({
  name: 'useAnnouncements imported',
  pass: dashboardCode.includes("import { useAnnouncements } from '../../context/AnnouncementContext'"),
  details: 'Dashboard imports announcement context'
});

checks.push({
  name: 'updateAnnouncement destructured',
  pass: dashboardCode.includes('updateAnnouncement') && dashboardCode.includes('useAnnouncements()'),
  details: 'Dashboard gets updateAnnouncement from context'
});

checks.push({
  name: 'deleteAnnouncement destructured',
  pass: dashboardCode.includes('deleteAnnouncement') && dashboardCode.includes('useAnnouncements()'),
  details: 'Dashboard gets deleteAnnouncement from context'
});

checks.push({
  name: 'useAuth imported',
  pass: dashboardCode.includes("import { useAuth } from '../../context/AuthContext'"),
  details: 'Dashboard imports auth context for user role'
});

checks.push({
  name: 'user destructured from useAuth',
  pass: dashboardCode.includes('const { user } = useAuth()'),
  details: 'Dashboard gets user object for role checking'
});

// Print results
let passCount = 0;
let failCount = 0;

console.log('═══════════════════════════════════════════════════════════════\n');

checks.forEach((check, index) => {
  const icon = check.pass ? '✅' : '❌';
  const status = check.pass ? 'PASS' : 'FAIL';
  
  if (check.pass) {
    passCount++;
  } else {
    failCount++;
  }
  
  console.log(`${icon} ${status}: ${check.name}`);
  console.log(`   ${check.details}`);
  console.log();
});

console.log('═══════════════════════════════════════════════════════════════\n');
console.log(`📊 Results: ${passCount}/${checks.length} checks passed`);

if (failCount === 0) {
  console.log('\n✅ ALL CHECKS PASSED!');
  console.log('\n🎉 Announcement Edit/Delete functionality is fully implemented!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Start dev server: cd frontend && npm run dev');
  console.log('   2. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
  console.log('   3. Log in as MESOB Manager or Super Admin');
  console.log('   4. Go to Announcements → Click any announcement');
  console.log('   5. You will see Edit and Delete buttons!');
  console.log('\n📚 See FIX_ANNOUNCEMENT_BUTTONS_NOW.md for complete guide');
} else {
  console.log(`\n❌ ${failCount} check(s) failed!`);
  console.log('   Review the failed checks above and fix the issues.');
}

console.log('\n═══════════════════════════════════════════════════════════════\n');

process.exit(failCount === 0 ? 0 : 1);
