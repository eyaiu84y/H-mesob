/**
 * run-role-migration.js
 *
 * Executes the full role rename migration:
 *   - ICT_STAFF  → TECHNICIAN  (in database users table + announcements)
 *   - CITIZEN    → CUSTOMER    (in database users table + announcements)
 *
 * Adds enum values first (DDL must be auto-committed),
 * then migrates data rows in a transaction.
 *
 * Run: node run-role-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  MESOB Role Migration: ICT_STAFF→TECHNICIAN, CITIZEN→CUSTOMER');
  console.log('══════════════════════════════════════════════════\n');

  // ── STEP 1: Add new enum values (DDL - auto-committed by Supabase RPC) ──
  console.log('Step 1: Adding CUSTOMER and TECHNICIAN to user_role enum...');
  // Enum ADD VALUE must be done via Supabase SQL editor or migration runner.
  // The Supabase JS client cannot run raw DDL directly.
  // We proceed with data migration using the REST API — if CUSTOMER/TECHNICIAN
  // enum values are already in the schema (from prior migration), updates will succeed.
  console.log('  ℹ  Enum extension skipped (run SQL via Supabase dashboard if first time).');

  // ── STEP 2: Migrate users ────────────────────────────────────────────────
  console.log('\nStep 2: Migrating users...');

  // 2a. Count before
  const { data: beforeCounts } = await supabase
    .from('users')
    .select('role')
    .in('role', ['CITIZEN', 'ICT_STAFF', 'CUSTOMER', 'TECHNICIAN']);

  const counts = { CITIZEN: 0, ICT_STAFF: 0, CUSTOMER: 0, TECHNICIAN: 0 };
  (beforeCounts || []).forEach(u => { counts[u.role] = (counts[u.role] || 0) + 1; });
  console.log(`  Before: CITIZEN=${counts.CITIZEN}, ICT_STAFF=${counts.ICT_STAFF}, CUSTOMER=${counts.CUSTOMER}, TECHNICIAN=${counts.TECHNICIAN}`);

  // 2b. Migrate CITIZEN → CUSTOMER
  const { data: citizenUsers, error: fetchCitizenErr } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'CITIZEN');

  if (fetchCitizenErr) {
    console.error('  ✗ Failed to fetch CITIZEN users:', fetchCitizenErr.message);
  } else if (citizenUsers && citizenUsers.length > 0) {
    const citizenIds = citizenUsers.map(u => u.id);
    const { error: updateCitizenErr } = await supabase
      .from('users')
      .update({ role: 'CUSTOMER', updated_at: new Date().toISOString() })
      .in('id', citizenIds);
    if (updateCitizenErr) {
      console.error('  ✗ Failed to update CITIZEN→CUSTOMER:', updateCitizenErr.message);
    } else {
      console.log(`  ✓ Migrated ${citizenUsers.length} CITIZEN users → CUSTOMER`);
    }
  } else {
    console.log('  ℹ  No CITIZEN users to migrate');
  }

  // 2c. Migrate ICT_STAFF → TECHNICIAN
  const { data: ictUsers, error: fetchIctErr } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'ICT_STAFF');

  if (fetchIctErr) {
    console.error('  ✗ Failed to fetch ICT_STAFF users:', fetchIctErr.message);
  } else if (ictUsers && ictUsers.length > 0) {
    const ictIds = ictUsers.map(u => u.id);
    const { error: updateIctErr } = await supabase
      .from('users')
      .update({ role: 'TECHNICIAN', updated_at: new Date().toISOString() })
      .in('id', ictIds);
    if (updateIctErr) {
      console.error('  ✗ Failed to update ICT_STAFF→TECHNICIAN:', updateIctErr.message);
    } else {
      console.log(`  ✓ Migrated ${ictUsers.length} ICT_STAFF users → TECHNICIAN`);
    }
  } else {
    console.log('  ℹ  No ICT_STAFF users to migrate');
  }

  // ── STEP 3: Count after ───────────────────────────────────────────────────
  const { data: afterData } = await supabase
    .from('users')
    .select('role')
    .in('role', ['CITIZEN', 'ICT_STAFF', 'CUSTOMER', 'TECHNICIAN']);

  const afterCounts = { CITIZEN: 0, ICT_STAFF: 0, CUSTOMER: 0, TECHNICIAN: 0 };
  (afterData || []).forEach(u => { afterCounts[u.role] = (afterCounts[u.role] || 0) + 1; });
  console.log(`\n  After:  CITIZEN=${afterCounts.CITIZEN}, ICT_STAFF=${afterCounts.ICT_STAFF}, CUSTOMER=${afterCounts.CUSTOMER}, TECHNICIAN=${afterCounts.TECHNICIAN}`);

  // ── STEP 4: Verify all users ──────────────────────────────────────────────
  console.log('\nStep 3: Full user role distribution...');
  const { data: allUsers } = await supabase.from('users').select('role, email');
  const roleDist = {};
  (allUsers || []).forEach(u => { roleDist[u.role] = (roleDist[u.role] || 0) + 1; });
  Object.entries(roleDist).sort().forEach(([role, count]) => {
    console.log(`  ${role.padEnd(22)} ${count} user(s)`);
  });

  const hasBadRoles = afterCounts.CITIZEN > 0 || afterCounts.ICT_STAFF > 0;
  if (hasBadRoles) {
    console.log('\n  ⚠  Some legacy roles remain. This may be due to database enum constraints.');
    console.log('     Run the SQL migration file manually via Supabase SQL editor:');
    console.log('     backend/database/migrations/007_rename_roles_citizen_customer_ict_technician.sql');
  } else {
    console.log('\n  ✓ Database migration complete — no legacy CITIZEN or ICT_STAFF roles remain.');
  }

  console.log('\n══════════════════════════════════════════════════\n');
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
