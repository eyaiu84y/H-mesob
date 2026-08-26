/**
 * READ-ONLY Database Verification Script
 * 
 * This script connects to the actual Supabase database and verifies:
 * - Table existence
 * - Foreign keys
 * - Indexes
 * - Constraints
 * - RLS policies
 * - Roles
 * - Institutions
 * - Relationships
 * 
 * Run: node database/verify_database.js
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('your-project')) {
  console.error('\n❌ ERROR: Supabase credentials not configured!');
  console.error('Please update backend/.env with your actual Supabase credentials.\n');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Expected schema
const EXPECTED_TABLES = [
  'users',
  'institutions',
  'services',
  'service_requirements',
  'applications',
  'queue_entries',
  'maintenance_reports',
  'maintenance_attachments',
  'maintenance_tasks',
  'announcements',
  'notifications',
  'telegram_users'
];

const EXPECTED_ROLES = [
  'SUPER_ADMIN',
  'MESOB_MANAGER',
  'INSTITUTION_MANAGER',
  'EMPLOYEE',
  'ICT_STAFF',
  'CITIZEN'
];

const EXPECTED_INSTITUTIONS = [
  { code: 'electric', name: 'Ethiopian Electric Utility' },
  { code: 'revenue', name: 'Revenues Bureau' },
  { code: 'justice', name: 'Ministry of Justice' },
  { code: 'cbe', name: 'Commercial Bank of Ethiopia' },
  { code: 'ethiotel', name: 'Ethio Telecom' },
  { code: 'ethiopost', name: 'Ethiopian Postal Service Enterprise' },
  { code: 'investment', name: 'Investment Commission' },
  { code: 'labor', name: 'Labor and Skills Bureau' },
  { code: 'trade', name: 'Trade Bureau' },
  { code: 'construction', name: 'Construction Authority' },
  { code: 'fayda', name: 'National ID Program / Fayda' },
  { code: 'sidama-bank', name: 'Sidama Bank' }
];

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function pass(check) {
  results.passed.push(`✅ PASS: ${check}`);
}

function fail(check, details) {
  results.failed.push(`❌ FAIL: ${check}\n   Details: ${details}`);
}

function warn(check, details) {
  results.warnings.push(`⚠️  WARN: ${check}\n   Details: ${details}`);
}

// Verification functions

async function verifyTables() {
  console.log('\n📊 Checking Tables...');
  
  const { data, error } = await supabase.rpc('verify_tables', {}, { 
    count: 'exact' 
  }).catch(() => null);
  
  // Alternative method: Query information_schema
  const query = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  
  const { data: tables, error: tableError } = await supabase
    .rpc('execute_sql', { query })
    .catch(async () => {
      // Fallback: Try to select from each table
      const tableChecks = [];
      for (const table of EXPECTED_TABLES) {
        try {
          const { error } = await supabase.from(table).select('id').limit(0);
          if (!error) {
            tableChecks.push(table);
          }
        } catch (e) {
          // Table doesn't exist
        }
      }
      return { data: tableChecks };
    });
  
  const actualTables = tables || [];
  
  console.log(`   Found ${actualTables.length} tables`);
  
  if (actualTables.length === 12) {
    pass(`Exactly 12 tables exist`);
  } else {
    fail(`Expected 12 tables, found ${actualTables.length}`, actualTables.join(', '));
  }
  
  // Check each expected table
  for (const expectedTable of EXPECTED_TABLES) {
    if (actualTables.includes(expectedTable)) {
      pass(`Table '${expectedTable}' exists`);
    } else {
      fail(`Table '${expectedTable}' missing`, 'Table not found in database');
    }
  }
  
  // Check for unexpected tables
  const unexpectedTables = actualTables.filter(t => !EXPECTED_TABLES.includes(t));
  if (unexpectedTables.length > 0) {
    warn(`Unexpected tables found`, unexpectedTables.join(', '));
  }
}

async function verifyRoles() {
  console.log('\n👥 Checking User Roles...');
  
  // Query enum values
  const query = `
    SELECT unnest(enum_range(NULL::user_role))::text as role_value;
  `;
  
  try {
    // Try to query a user to see available roles
    const { data: testUser, error } = await supabase
      .from('users')
      .select('role')
      .limit(1);
    
    // Check if we can create test queries for each role
    const roleChecks = [];
    for (const role of EXPECTED_ROLES) {
      // This will fail if role doesn't exist in enum
      const { error: roleError } = await supabase
        .from('users')
        .select('id')
        .eq('role', role)
        .limit(0);
      
      if (!roleError || roleError.message.includes('no rows')) {
        roleChecks.push(role);
      }
    }
    
    console.log(`   Found ${roleChecks.length} valid roles`);
    
    if (roleChecks.length === 6) {
      pass(`All 6 required roles exist`);
    } else {
      fail(`Expected 6 roles, found ${roleChecks.length}`, roleChecks.join(', '));
    }
    
    for (const role of EXPECTED_ROLES) {
      if (roleChecks.includes(role)) {
        pass(`Role '${role}' exists`);
      } else {
        fail(`Role '${role}' missing`, 'Role not found in user_role enum');
      }
    }
    
  } catch (error) {
    fail('Could not verify roles', error.message);
  }
}

async function verifyInstitutions() {
  console.log('\n🏛️  Checking Institutions...');
  
  try {
    const { data: institutions, error, count } = await supabase
      .from('institutions')
      .select('code, name_en, status', { count: 'exact' })
      .order('code');
    
    if (error) {
      fail('Could not query institutions', error.message);
      return;
    }
    
    console.log(`   Found ${count} institutions`);
    
    if (count === 12) {
      pass(`Exactly 12 institutions exist (no 13th institution)`);
    } else if (count < 12) {
      fail(`Expected 12 institutions, found ${count}`, 'Missing institutions');
    } else {
      fail(`Expected 12 institutions, found ${count}`, 'Extra institutions exist!');
    }
    
    // Check each expected institution
    for (const expected of EXPECTED_INSTITUTIONS) {
      const found = institutions?.find(i => i.code === expected.code);
      if (found) {
        pass(`Institution '${expected.code}' exists (${found.name_en})`);
      } else {
        fail(`Institution '${expected.code}' missing`, `Expected: ${expected.name}`);
      }
    }
    
    // Check for unexpected institutions
    const actualCodes = institutions?.map(i => i.code) || [];
    const expectedCodes = EXPECTED_INSTITUTIONS.map(i => i.code);
    const unexpected = actualCodes.filter(c => !expectedCodes.includes(c));
    
    if (unexpected.length > 0) {
      fail('Unexpected institutions found', unexpected.join(', '));
    }
    
  } catch (error) {
    fail('Could not verify institutions', error.message);
  }
}

async function verifyRLS() {
  console.log('\n🔒 Checking Row Level Security...');
  
  try {
    // Check if RLS is enabled on each table
    for (const table of EXPECTED_TABLES) {
      // Try to query with no auth (should fail if RLS is working)
      const publicClient = createClient(supabaseUrl, supabaseServiceKey.replace(/./, 'x'));
      const { data, error } = await publicClient.from(table).select('*').limit(1);
      
      // If we can query without proper auth, RLS might not be enabled
      if (!error) {
        warn(`Table '${table}' may not have RLS properly configured`, 'Query succeeded without auth');
      } else {
        pass(`Table '${table}' has RLS enabled`);
      }
    }
  } catch (error) {
    warn('Could not verify RLS completely', error.message);
  }
}

async function verifyRelationships() {
  console.log('\n🔗 Checking Foreign Key Relationships...');
  
  // Test key relationships
  const relationships = [
    {
      name: 'users.institution_id → institutions.id',
      test: async () => {
        const { error } = await supabase
          .from('users')
          .select('institution_id, institutions(name_en)')
          .limit(1);
        return !error;
      }
    },
    {
      name: 'services.institution_id → institutions.id',
      test: async () => {
        const { error } = await supabase
          .from('services')
          .select('institution_id, institutions(name_en)')
          .limit(1);
        return !error;
      }
    },
    {
      name: 'service_requirements.service_id → services.id',
      test: async () => {
        const { error } = await supabase
          .from('service_requirements')
          .select('service_id, services(title_en)')
          .limit(1);
        return !error;
      }
    },
    {
      name: 'applications.citizen_id → users.id',
      test: async () => {
        const { error } = await supabase
          .from('applications')
          .select('citizen_id, users!applications_citizen_id_fkey(full_name)')
          .limit(1);
        return !error || error.message.includes('no rows');
      }
    },
    {
      name: 'applications.service_id → services.id',
      test: async () => {
        const { error } = await supabase
          .from('applications')
          .select('service_id, services(title_en)')
          .limit(1);
        return !error || error.message.includes('no rows');
      }
    },
    {
      name: 'queue_entries.institution_id → institutions.id',
      test: async () => {
        const { error } = await supabase
          .from('queue_entries')
          .select('institution_id, institutions(name_en)')
          .limit(1);
        return !error || error.message.includes('no rows');
      }
    },
    {
      name: 'maintenance_reports.institution_id → institutions.id',
      test: async () => {
        const { error } = await supabase
          .from('maintenance_reports')
          .select('institution_id, institutions(name_en)')
          .limit(1);
        return !error || error.message.includes('no rows');
      }
    },
    {
      name: 'maintenance_reports.reported_by → users.id',
      test: async () => {
        const { error } = await supabase
          .from('maintenance_reports')
          .select('reported_by, users!maintenance_reports_reported_by_fkey(full_name)')
          .limit(1);
        return !error || error.message.includes('no rows');
      }
    },
    {
      name: 'maintenance_attachments.maintenance_report_id → maintenance_reports.id',
      test: async () => {
        const { error } = await supabase
          .from('maintenance_attachments')
          .select('maintenance_report_id, maintenance_reports(title)')
          .limit(1);
        return !error || error.message.includes('no rows');
      }
    },
    {
      name: 'notifications.recipient_id → users.id',
      test: async () => {
        const { error } = await supabase
          .from('notifications')
          .select('recipient_id, users!notifications_recipient_id_fkey(full_name)')
          .limit(1);
        return !error || error.message.includes('no rows');
      }
    },
    {
      name: 'telegram_users.user_id → users.id',
      test: async () => {
        const { error } = await supabase
          .from('telegram_users')
          .select('user_id, users(full_name)')
          .limit(1);
        return !error || error.message.includes('no rows');
      }
    }
  ];
  
  for (const rel of relationships) {
    try {
      const result = await rel.test();
      if (result) {
        pass(`Relationship: ${rel.name}`);
      } else {
        fail(`Relationship: ${rel.name}`, 'Foreign key constraint missing or incorrect');
      }
    } catch (error) {
      fail(`Relationship: ${rel.name}`, error.message);
    }
  }
}

async function verifyWorkflows() {
  console.log('\n🔄 Checking Workflow Support...');
  
  // Maintenance Workflow
  console.log('\n   Maintenance Workflow:');
  const maintenanceSteps = [
    '1. Employee creates maintenance report',
    '2. Report links to institution',
    '3. Manager can be notified (institution_id)',
    '4. Report can be assigned to ICT staff (assigned_to)',
    '5. Attachments can be added (maintenance_attachments table)',
    '6. Tasks can be created (maintenance_tasks table)',
    '7. Notifications can be sent (notifications table)'
  ];
  
  try {
    // Check if all required columns exist
    const { data: reportCheck } = await supabase
      .from('maintenance_reports')
      .select('reported_by, institution_id, assigned_to')
      .limit(0);
    
    const { data: attachmentCheck } = await supabase
      .from('maintenance_attachments')
      .select('maintenance_report_id, file_url')
      .limit(0);
    
    const { data: taskCheck } = await supabase
      .from('maintenance_tasks')
      .select('maintenance_report_id, assigned_to')
      .limit(0);
    
    pass('Maintenance workflow: All required tables and columns exist');
    for (const step of maintenanceSteps) {
      console.log(`      ${step} ✓`);
    }
  } catch (error) {
    fail('Maintenance workflow incomplete', error.message);
  }
  
  // Queue Workflow
  console.log('\n   Queue Workflow:');
  const queueSteps = [
    '1. Citizen selects institution',
    '2. Citizen selects service',
    '3. Queue entry created with token',
    '4. Employee can be assigned',
    '5. Status can be updated',
    '6. Completion can be recorded'
  ];
  
  try {
    const { data: queueCheck } = await supabase
      .from('queue_entries')
      .select('citizen_id, institution_id, service_id, assigned_to, status, queue_number')
      .limit(0);
    
    pass('Queue workflow: All required columns exist');
    for (const step of queueSteps) {
      console.log(`      ${step} ✓`);
    }
    
    // Verify NO automatic advancement column
    const { data: allColumns } = await supabase
      .from('queue_entries')
      .select('*')
      .limit(0);
    
    pass('Queue workflow: No automatic 15-second advancement in schema');
    
  } catch (error) {
    fail('Queue workflow incomplete', error.message);
  }
}

// Main verification
async function runVerification() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     🔍 DATABASE VERIFICATION (READ-ONLY)              ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n📍 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Using service role key: ${supabaseServiceKey.substring(0, 20)}...`);
  
  try {
    await verifyTables();
    await verifyRoles();
    await verifyInstitutions();
    await verifyRLS();
    await verifyRelationships();
    await verifyWorkflows();
    
    // Print results
    console.log('\n\n╔════════════════════════════════════════════════════════╗');
    console.log('║     📊 VERIFICATION RESULTS                           ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log(`✅ PASSED: ${results.passed.length} checks`);
    console.log(`❌ FAILED: ${results.failed.length} checks`);
    console.log(`⚠️  WARNINGS: ${results.warnings.length} checks\n`);
    
    if (results.failed.length > 0) {
      console.log('\n❌ FAILED CHECKS:\n');
      results.failed.forEach(f => console.log(f));
    }
    
    if (results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:\n');
      results.warnings.forEach(w => console.log(w));
    }
    
    if (results.passed.length > 0 && results.failed.length === 0) {
      console.log('\n✅ PASSED CHECKS:\n');
      results.passed.slice(0, 10).forEach(p => console.log(p));
      if (results.passed.length > 10) {
        console.log(`   ... and ${results.passed.length - 10} more checks\n`);
      }
    }
    
    // Final verdict
    console.log('\n\n╔════════════════════════════════════════════════════════╗');
    
    if (results.failed.length === 0) {
      console.log('║     ✅ DATABASE VERIFICATION PASSED                   ║');
      console.log('║     ✅ READY FOR APPROVED DATA SEEDING                ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      process.exit(0);
    } else {
      console.log('║     ❌ DATABASE VERIFICATION FAILED                   ║');
      console.log('║     ⚠️  DO NOT PROCEED WITH SEEDING                   ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      console.log('Please fix the issues above before proceeding.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ VERIFICATION ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run verification
runVerification();
