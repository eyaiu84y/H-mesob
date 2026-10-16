import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { supabase } from './src/config/supabase.js';

async function applyRoleMigration() {
  console.log('============================================================');
  console.log('🔄 Applying Role Migration: CITIZEN -> CUSTOMER, ICT_STAFF -> TECHNICIAN');
  console.log('============================================================');

  // Step 1: Check pre-migration counts
  const { data: usersBefore, error: errBefore } = await supabase.from('users').select('id, role');
  if (errBefore) {
    console.error('❌ Failed fetching users:', errBefore.message);
    process.exit(1);
  }

  const countsBefore = usersBefore.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Current users count by role:');
  console.table(countsBefore);

  const citizenCount = countsBefore['CITIZEN'] || 0;
  const ictCount = countsBefore['ICT_STAFF'] || 0;

  console.log(`Found ${citizenCount} CITIZEN users to migrate to CUSTOMER.`);
  console.log(`Found ${ictCount} ICT_STAFF users to migrate to TECHNICIAN.`);

  // Step 2: Test if enum 'CUSTOMER' is accepted by PostgreSQL
  console.log('\n🔍 Testing database enum support for CUSTOMER...');
  const testUser = usersBefore.find(u => u.role === 'CITIZEN');

  if (testUser) {
    const { error: testErr } = await supabase
      .from('users')
      .update({ role: 'CUSTOMER' })
      .eq('id', testUser.id);

    if (testErr) {
      if (testErr.code === '22P02' || testErr.message.includes('invalid input value for enum user_role')) {
        console.error('\n⚠️  PostgreSQL enum type `user_role` does not have "CUSTOMER" or "TECHNICIAN" yet.');
        console.error('   Error:', testErr.message);
        console.log('\n📋 REQUIRED STEP:');
        console.log('   Please run the forward migration in the Supabase SQL Editor:');
        console.log('   URL: https://supabase.com/dashboard/project/afsaruutbrnnmonciiga/sql/new');
        console.log('   File: backend/database/migrations/007_rename_roles_citizen_customer_ict_technician.sql\n');
        console.log('   Specifically, execute:');
        console.log(`   ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'CUSTOMER';`);
        console.log(`   ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'TECHNICIAN';\n`);
        return {
          success: false,
          reason: 'ENUM_NEEDS_DDL',
          details: testErr.message,
          citizenCount,
          ictCount
        };
      } else {
        console.error('❌ Unexpected error during test update:', testErr);
        return { success: false, error: testErr };
      }
    } else {
      console.log('✅ Enum check passed! Updating all remaining CITIZEN and ICT_STAFF users...');

      // Revert test user temporarily so bulk update is clean
      await supabase.from('users').update({ role: 'CITIZEN' }).eq('id', testUser.id);
    }
  }

  // Step 3: Perform migration on all users
  const { data: updatedCitizens, error: citizenErr } = await supabase
    .from('users')
    .update({ role: 'CUSTOMER' })
    .eq('role', 'CITIZEN')
    .select('id');

  if (citizenErr) {
    console.error('❌ Failed updating CITIZEN users:', citizenErr.message);
    return { success: false, error: citizenErr };
  }

  const { data: updatedICT, error: ictErr } = await supabase
    .from('users')
    .update({ role: 'TECHNICIAN' })
    .eq('role', 'ICT_STAFF')
    .select('id');

  if (ictErr) {
    console.error('❌ Failed updating ICT_STAFF users:', ictErr.message);
    return { success: false, error: ictErr };
  }

  // Step 4: Verify post-migration counts
  const { data: usersAfter } = await supabase.from('users').select('role');
  const countsAfter = usersAfter.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Final users count by role:');
  console.table(countsAfter);

  return {
    success: true,
    migratedCitizens: updatedCitizens?.length || 0,
    migratedTechnicians: updatedICT?.length || 0,
    countsAfter
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  applyRoleMigration()
    .then(result => {
      if (!result.success && result.reason === 'ENUM_NEEDS_DDL') {
        process.exit(2);
      } else if (!result.success) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
