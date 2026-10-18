import fs from 'fs';
import path from 'path';
import { supabase } from '../src/config/supabase.js';

export async function executeSafeCleanup(dryRun = false) {
  console.log('=====================================================');
  console.log(`🧹 HAWASSA MESOB SAFE DATABASE CLEANUP ${dryRun ? '(DRY RUN)' : '(LIVE EXECUTION)'}`);
  console.log('=====================================================');

  // Verify backup exists
  const backupPath = './database/backups/backup_defense_preclean_2026-10-18T10-34-04-300Z.json';
  if (!fs.existsSync(backupPath)) {
    throw new Error('Pre-cleanup backup not found! Aborting for safety.');
  }
  console.log('✅ Pre-cleanup backup verified at:', backupPath);

  // 1. Identify Accounts to Keep vs Delete
  const { data: allUsers } = await supabase.from('users').select('id, email, role, full_name');
  const disposableUserIds = allUsers.filter(u => 
    u.email.includes('rbactest.et') || 
    u.email.includes('test.debug') || 
    u.email.startsWith('testuser') || 
    /^test\d+@/.test(u.email)
  ).map(u => u.id);

  console.log(`\n1. Users: ${allUsers.length} total. Keeping ${allUsers.length - disposableUserIds.length}, deleting ${disposableUserIds.length} disposable test accounts.`);

  // 2. Identify Applications to Keep
  // Keep 6 demonstration applications showing all lifecycle stages
  const keptAppNumbers = [
    'APP-MVCQAFBF-BK6Q', // SUBMITTED (CBE)
    'APP-MUY8970A-VCMO', // UNDER_REVIEW (Sidama Bank)
    'APP-MUY8F9DW-FR57', // PENDING_DOCUMENTS (Sidama Bank)
    'APP-MTE692X1-97ME', // APPROVED (Fayda)
    'APP-MTE6JMBT-0MRT', // COMPLETED (Fayda)
    'APP-MTE6HWDT-KXBJ'  // REJECTED demo
  ];

  const { data: allApps } = await supabase.from('applications').select('id, application_number, status');
  const keptAppIds = (allApps || []).filter(a => keptAppNumbers.includes(a.application_number)).map(a => a.id);
  const deleteAppIds = (allApps || []).filter(a => !keptAppNumbers.includes(a.application_number)).map(a => a.id);
  console.log(`2. Applications: ${allApps.length} total. Keeping ${keptAppIds.length} demo records, deleting ${deleteAppIds.length} redundant test records.`);

  // 3. Identify Maintenance Reports to Keep
  const keptMaintNumbers = [
    'MAINT-2026-630075', // REPORTED
    'MAINT-2026-869250', // ASSIGNED
    'MAINT-2026-644895', // IN_PROGRESS
    'MAINT-2026-718368', // RESOLVED
    'MAINT-2026-603219'  // CLOSED
  ];

  const { data: allMaints } = await supabase.from('maintenance_reports').select('id, report_number');
  const keptMaintIds = (allMaints || []).filter(m => keptMaintNumbers.includes(m.report_number)).map(m => m.id);
  const deleteMaintIds = (allMaints || []).filter(m => !keptMaintNumbers.includes(m.report_number)).map(m => m.id);
  console.log(`3. Maintenance Reports: ${allMaints.length} total. Keeping ${keptMaintIds.length} demo records, deleting ${deleteMaintIds.length} test records.`);

  // 4. Identify Queue Entries to Keep
  // Keep 4 demonstration tickets
  const keptQueueTokens = ['Q-2026-0001', 'Q-2026-0002', 'Q-2026-0003', 'Q-2026-0004'];
  const { data: allQueues } = await supabase.from('queue_entries').select('id, queue_number');
  const keptQueueIds = (allQueues || []).filter(q => keptQueueTokens.includes(q.queue_number)).map(q => q.id);
  const deleteQueueIds = (allQueues || []).filter(q => !keptQueueTokens.includes(q.queue_number)).map(q => q.id);
  console.log(`4. Queue Entries: ${allQueues.length} total. Keeping ${keptQueueIds.length} demo tickets, deleting ${deleteQueueIds.length} test entries.`);

  // 5. Identify Feedback to Keep
  // Keep clean, realistic feedback
  const { data: allFeedbacks } = await supabase.from('service_feedback').select('id, rating, comment');
  const keptFeedbackIds = [
    '11619877-0c18-4dcb-99d1-2a5a2e67c3d4' // Realistic feedback
  ];
  const deleteFeedbackIds = (allFeedbacks || []).filter(f => !keptFeedbackIds.includes(f.id)).map(f => f.id);
  console.log(`5. Feedback: ${allFeedbacks.length} total. Keeping demo feedback, deleting ${deleteFeedbackIds.length} gibberish/null entries.`);

  // 6. Identify Announcements to Keep
  const keptAnnouncementIds = [
    '10861855-245b-4183-8709-081f9e51d6a6', // PUBLIC: Announcement to All Hawassa Mesob Users
    '8ba5aa0d-7842-4a8d-8862-edcb94e5e8e2', // PUBLIC: Public Service Information Update
    '71a51d83-266d-4a9b-a467-a7ab58fb27ea'  // SYSTEM: System Maintenance Notification
  ];
  const { data: allAnnouncements } = await supabase.from('announcements').select('id, title');
  const deleteAnnouncementIds = (allAnnouncements || []).filter(a => !keptAnnouncementIds.includes(a.id)).map(a => a.id);
  console.log(`6. Announcements: ${allAnnouncements.length} total. Keeping 3 official announcements, deleting ${deleteAnnouncementIds.length} test announcements.`);

  if (dryRun) {
    console.log('\n[DRY RUN COMPLETE] No records were modified.');
    return;
  }

  console.log('\n=====================================================');
  console.log('🚀 EXECUTING SAFE CLEANUP IN STRICT DEPENDENCY ORDER');
  console.log('=====================================================');

  // STEP A: Truncate failed login attempts (unlock all accounts)
  const { error: failedLoginsErr } = await supabase.from('failed_login_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('  ✓ Cleared failed login attempts:', failedLoginsErr ? failedLoginsErr.message : 'OK');

  // STEP B: Delete Notifications for deleted users, deleted applications, and deleted maintenance
  console.log('  Deleting obsolete test notifications...');
  if (disposableUserIds.length > 0) {
    await supabase.from('notifications').delete().in('recipient_id', disposableUserIds);
  }
  if (deleteAppIds.length > 0) {
    await supabase.from('notifications').delete().in('related_entity_id', deleteAppIds);
  }
  if (deleteMaintIds.length > 0) {
    await supabase.from('notifications').delete().in('related_entity_id', deleteMaintIds);
  }
  if (deleteAnnouncementIds.length > 0) {
    await supabase.from('notifications').delete().in('announcement_id', deleteAnnouncementIds);
  }
  console.log('  ✓ Cleaned obsolete notifications');

  // STEP C: Delete Audit Logs for disposable users
  if (disposableUserIds.length > 0) {
    await supabase.from('audit_logs').delete().in('user_id', disposableUserIds);
    console.log('  ✓ Cleaned audit logs for disposable accounts');
  }

  // STEP D: Delete Maintenance Attachments & Tasks for deleted maintenance reports
  if (deleteMaintIds.length > 0) {
    await supabase.from('maintenance_attachments').delete().in('maintenance_report_id', deleteMaintIds);
    await supabase.from('maintenance_tasks').delete().in('maintenance_report_id', deleteMaintIds);
    await supabase.from('maintenance_reports').delete().in('id', deleteMaintIds);
    console.log('  ✓ Cleaned deleted maintenance tickets, tasks, and attachments');
  }

  // STEP E: Delete Feedback entries
  if (deleteFeedbackIds.length > 0) {
    await supabase.from('service_feedback').delete().in('id', deleteFeedbackIds);
    console.log('  ✓ Cleaned gibberish feedback entries');
  }

  // Insert two clean, realistic demonstration feedbacks for the defense
  const { data: customerUser } = await supabase.from('users').select('id').eq('email', 'customer@mesobcenter.et').single();
  const { data: faydaInst } = await supabase.from('institutions').select('id').eq('code', 'fayda').single();
  const { data: faydaSvc } = await supabase.from('services').select('id').eq('code', 'FAYDA_NEW').single();

  if (customerUser && faydaInst && faydaSvc) {
    await supabase.from('service_feedback').upsert([
      {
        id: '11619877-0c18-4dcb-99d1-2a5a2e67c3d4',
        citizen_id: customerUser.id,
        institution_id: faydaInst.id,
        service_id: faydaSvc.id,
        rating: 5,
        comment: 'Excellent and smooth experience applying for the national ID at Hawassa MESOB!',
        source: 'WEBSITE'
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        citizen_id: customerUser.id,
        institution_id: faydaInst.id,
        service_id: faydaSvc.id,
        rating: 4,
        comment: 'Very professional staff and clean digital process.',
        source: 'WEBSITE'
      }
    ]);
    console.log('  ✓ Formatted clean demonstration feedback records');
  }

  // STEP F: Delete Queue Entries
  if (deleteQueueIds.length > 0) {
    await supabase.from('queue_entries').delete().in('id', deleteQueueIds);
    console.log('  ✓ Cleaned test queue entries');
  }

  // Format remaining demonstration queue entries nicely
  if (customerUser && faydaInst && faydaSvc) {
    await supabase.from('queue_entries').update({
      status: 'WAITING',
      notes: 'Waiting for document verification'
    }).eq('queue_number', 'Q-2026-0001');

    await supabase.from('queue_entries').update({
      status: 'WAITING',
      notes: 'Waiting for biometric capture'
    }).eq('queue_number', 'Q-2026-0002');

    await supabase.from('queue_entries').update({
      status: 'IN_PROGRESS',
      counter: 'Counter 3',
      notes: 'Currently undergoing biometric capture at Counter 3'
    }).eq('queue_number', 'Q-2026-0003');

    await supabase.from('queue_entries').update({
      status: 'COMPLETED',
      counter: 'Counter 1',
      notes: 'Service successfully completed'
    }).eq('queue_number', 'Q-2026-0004');
    console.log('  ✓ Formatted demonstration queue tickets (WAITING, IN_PROGRESS, COMPLETED)');
  }

  // STEP G: Delete Applications
  if (deleteAppIds.length > 0) {
    await supabase.from('applications').delete().in('id', deleteAppIds);
    console.log('  ✓ Cleaned redundant test applications');
  }

  // Format demonstration applications
  // Set APP-MTE6HWDT-KXBJ to REJECTED with note
  await supabase.from('applications').update({
    status: 'REJECTED',
    review_notes: 'Submitted passport copy was expired. Please resubmit with a valid government ID.',
    reviewed_at: new Date().toISOString()
  }).eq('application_number', 'APP-MTE6HWDT-KXBJ');

  // Format APP-MVCQAFBF-BK6Q to SUBMITTED
  await supabase.from('applications').update({
    status: 'SUBMITTED',
    review_notes: null
  }).eq('application_number', 'APP-MVCQAFBF-BK6Q');

  // Format APP-MUY8970A-VCMO to UNDER_REVIEW
  await supabase.from('applications').update({
    status: 'UNDER_REVIEW',
    review_notes: 'Document verification in progress by institution staff.'
  }).eq('application_number', 'APP-MUY8970A-VCMO');

  // Format APP-MUY8F9DW-FR57 to PENDING_DOCUMENTS
  await supabase.from('applications').update({
    status: 'PENDING_DOCUMENTS',
    review_notes: 'Please attach proof of residency (Kebele ID or utility bill).'
  }).eq('application_number', 'APP-MUY8F9DW-FR57');
  console.log('  ✓ Formatted demonstration applications across all 6 lifecycle stages');

  // STEP H: Delete Announcements
  if (deleteAnnouncementIds.length > 0) {
    await supabase.from('announcements').delete().in('id', deleteAnnouncementIds);
    console.log('  ✓ Cleaned test announcements');
  }

  // Make the 3 kept announcements active and clean
  await supabase.from('announcements').update({
    is_active: true,
    title: 'Announcement to All Hawassa MESOB Users',
    content: 'Welcome to the Hawassa MESOB One-Stop Public Service Center digital portal. All municipal, utility, and banking services are operational.',
    title_am: 'ለሁሉም የሃዋሳ መሶብ ተጠቃሚዎች የተላለፈ ማስታወቂያ',
    content_am: 'እንኳን ወደ ሃዋሳ መሶብ የአንድ ማዕከል የህዝብ አገልግሎት ዲጂታል ፖርታል በደህና መጡ።'
  }).eq('id', '10861855-245b-4183-8709-081f9e51d6a6');

  await supabase.from('announcements').update({
    is_active: true,
    title: 'Public Service Center Operating Hours',
    content: 'The Hawassa MESOB Center is open Monday to Friday from 8:30 AM to 5:30 PM, and Saturday from 8:30 AM to 12:30 PM.',
    title_am: 'የማዕከሉ የስራ ሰዓት ማስታወቂያ',
    content_am: 'የሃዋሳ መሶብ ማዕከል ከሰኞ እስከ አርብ ከጠዋቱ 2:30 እስከ 11:30፣ እንዲሁም ቅዳሜ ከጠዋቱ 2:30 እስከ 6:30 ክፍት ነው።'
  }).eq('id', '8ba5aa0d-7842-4a8d-8862-edcb94e5e8e2');

  await supabase.from('announcements').update({
    is_active: true,
    scope: 'SYSTEM',
    title: 'Scheduled System Maintenance Notice',
    content: 'Routine server maintenance and database index optimization are scheduled for Sunday midnight.',
    title_am: 'የታቀደ የስርዓት ጥገና ማስታወቂያ',
    content_am: 'መደበኛ የሰርቨር ጥገና እና የዳታቤዝ ማሻሻያ እሁድ እኩለ ሌሊት ይከናወናል።'
  }).eq('id', '71a51d83-266d-4a9b-a467-a7ab58fb27ea');
  console.log('  ✓ Polished remaining 3 official announcements');

  // STEP I: Delete disposable test accounts from users table
  if (disposableUserIds.length > 0) {
    const { error: delUserErr } = await supabase.from('users').delete().in('id', disposableUserIds);
    if (delUserErr) {
      console.error('Failed to delete disposable users:', delUserErr);
    } else {
      console.log(`  ✓ Successfully deleted ${disposableUserIds.length} disposable test accounts`);
    }
  }

  // STEP J: Clean orphaned notifications
  const { data: remainingUsers } = await supabase.from('users').select('id');
  const remainingUserIds = (remainingUsers || []).map(u => u.id);
  // Any notification whose recipient is not in remainingUserIds
  await supabase.from('notifications').delete().not('recipient_id', 'in', `(${remainingUserIds.map(id => `"${id}"`).join(',')})`);
  console.log('  ✓ Cleaned all orphaned notifications');

  console.log('\n=====================================================');
  console.log('✅ SAFE CLEANUP EXECUTION COMPLETE');
  console.log('=====================================================');
}

// Check command line arg
const isLive = process.argv.includes('--live');
executeSafeCleanup(!isLive).catch(err => {
  console.error('Cleanup execution error:', err);
  process.exit(1);
});
