/**
 * seed-internal-users.js
 * 
 * Seeds one test account for every internal role:
 *   SUPER_ADMIN, MESOB_MANAGER, INSTITUTION_MANAGER, EMPLOYEE, ICT_STAFF
 * 
 * All accounts are created with:
 *  - @mesobcenterh.gov.et email
 *  - A known temporary password (shown in the output table)
 *  - must_change_password: true  → user must change on FIRST login only
 * 
 * Run from the backend directory:
 *   node seed-internal-users.js
 */

import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Test accounts ─────────────────────────────────────────────────────────
// Passwords meet the policy: 8+ chars, upper, lower, digit, special char
const INTERNAL_USERS = [
  {
    full_name:   'Dawit Tadesse',
    email:       'superadmin@mesobcenterh.gov.et',
    role:        'SUPER_ADMIN',
    temp_password: 'Admin@2026',
    employee_id: 'SA-001',
    institution_id: null,
  },
  {
    full_name:   'Tigist Haile',
    email:       'manager@mesobcenterh.gov.et',
    role:        'MESOB_MANAGER',
    temp_password: 'Manager@2026',
    employee_id: 'MM-001',
    institution_id: null,
  },
  {
    full_name:   'Abebe Girma',
    email:       'instmanager@mesobcenterh.gov.et',
    role:        'INSTITUTION_MANAGER',
    temp_password: 'InstMgr@2026',
    employee_id: 'IM-001',
    institution_id: null,   // will be updated below if an institution exists
  },
  {
    full_name:   'Selamawit Bekele',
    email:       'employee@mesobcenterh.gov.et',
    role:        'EMPLOYEE',
    temp_password: 'Employee@2026',
    employee_id: 'EMP-001',
    institution_id: null,
  },
  {
    full_name:   'Yonas Tesfaye',
    email:       'technician@mesobcenterh.gov.et',
    role:        'TECHNICIAN',
    temp_password: 'Technician@2026',
    employee_id: 'TECH-001',
    institution_id: null,
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────
const SALT_ROUNDS = 10;

async function getFirstInstitutionId() {
  const { data, error } = await supabase
    .from('institutions')
    .select('id, name_en, name')
    .limit(1)
    .single();
  if (error || !data) return null;
  console.log(`  ℹ  Using institution: "${data.name_en || data.name}" (${data.id}) for institution-scoped roles`);
  return data.id;
}

async function upsertUser(userData, institutionId) {
  const nowIso = new Date().toISOString();
  const passwordHash = await bcrypt.hash(userData.temp_password, SALT_ROUNDS);

  // Resolve institution: INSTITUTION_MANAGER and EMPLOYEE/TECHNICIAN get assigned one if available
  const needsInstitution = ['INSTITUTION_MANAGER', 'EMPLOYEE', 'TECHNICIAN', 'ICT_STAFF'].includes(userData.role);
  const resolvedInstitution = needsInstitution ? institutionId : null;

  // Check if user already exists
  const { data: existing } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('email', userData.email)
    .single();

  if (existing) {
    console.log(`  ⚠  SKIP  ${userData.email} already exists (id: ${existing.id})`);
    return { skipped: true, email: userData.email, role: userData.role, tempPassword: userData.temp_password };
  }

  let dbRole = userData.role;
  const payload = {
    email:        userData.email,
    password_hash: passwordHash,
    full_name:    userData.full_name,
    role:         dbRole,
    status:       'ACTIVE',
    employee_id:  userData.employee_id,
    institution_id: resolvedInstitution,
    created_at:   nowIso,
    metadata: {
      must_change_password: true,
      temp_password_issued_at: nowIso,
      seeded_by: 'seed-internal-users.js'
    }
  };

  let { data: newUser, error } = await supabase
    .from('users')
    .insert(payload)
    .select('id, email, role, status')
    .single();

  if (error && error.code === '22P02') {
    const fallback = dbRole === 'TECHNICIAN' ? 'ICT_STAFF' : dbRole === 'CUSTOMER' ? 'CITIZEN' : null;
    if (fallback) {
      payload.role = fallback;
      const res = await supabase.from('users').insert(payload).select('id, email, role, status').single();
      newUser = res.data;
      error = res.error;
    }
  }

  if (error) {
    console.error(`  ✗  FAIL  ${userData.email}:`, error.message);
    return { failed: true, email: userData.email, error: error.message };
  }

  console.log(`  ✓  OK    ${userData.email} (id: ${newUser.id}) [Role: ${userData.role}]`);
  return { created: true, id: newUser.id, email: userData.email, role: userData.role, tempPassword: userData.temp_password };
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  MESOB Internal Users — Seed Script');
  console.log('══════════════════════════════════════════════════════\n');

  // Fetch one institution for institution-scoped roles
  const institutionId = await getFirstInstitutionId();
  console.log('');

  const results = [];
  for (const u of INTERNAL_USERS) {
    const result = await upsertUser(u, institutionId);
    results.push({ ...result, fullName: u.full_name, role: u.role, email: u.email, tempPassword: u.temp_password });
  }

  // ─── Summary table ──────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════════════════════════════════');
  console.log('  TEST CREDENTIALS — share securely with QA team');
  console.log('══════════════════════════════════════════════════════════════════════════════════════');
  console.log(
    '\n  ' +
    'Role'.padEnd(22) +
    'Email'.padEnd(40) +
    'Temp Password'.padEnd(20) +
    'Status'
  );
  console.log('  ' + '─'.repeat(88));

  for (const r of results) {
    const status = r.created ? '✓ Created' : r.skipped ? '⚠ Already existed' : `✗ FAILED: ${r.error}`;
    const roleLabel = r.role?.padEnd(22) || ''.padEnd(22);
    const emailLabel = r.email?.padEnd(40) || ''.padEnd(40);
    const pwdLabel   = r.tempPassword?.padEnd(20) || ''.padEnd(20);
    console.log(`  ${roleLabel}${emailLabel}${pwdLabel}${status}`);
  }

  console.log('\n══════════════════════════════════════════════════════════════════════════════════════');
  console.log('  NOTE: All users have must_change_password = true.');
  console.log('        On first login they will be redirected to /change-password.');
  console.log('        After setting their own password the flag is cleared — no repeat prompt.');
  console.log('══════════════════════════════════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
