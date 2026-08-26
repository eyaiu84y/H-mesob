/**
 * Standalone Supabase Connection Test Script
 * 
 * Tests connection to Supabase and verifies database schema
 * 
 * Usage: node src/utils/testConnection.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { supabase } from '../config/supabase.js';
import {
  testDatabaseConnection,
  verifyDatabaseSchema,
  getDatabaseStats
} from '../services/databaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║     🔍 SUPABASE CONNECTION TEST                       ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Check environment variables
console.log('📋 Environment Configuration:');
console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL || '❌ NOT SET'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET (hidden)' : '❌ NOT SET'}`);
console.log();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: Missing Supabase credentials in .env file\n');
  console.log('Please configure backend/.env with:');
  console.log('  - SUPABASE_URL');
  console.log('  - SUPABASE_SERVICE_ROLE_KEY\n');
  process.exit(1);
}

async function runTests() {
  try {
    // Test 1: Basic Connection
    console.log('🔌 Test 1: Testing Supabase Connection...');
    const connectionTest = await testDatabaseConnection();
    
    if (connectionTest.connected) {
      console.log(`   ✅ ${connectionTest.message}`);
    } else {
      console.log(`   ❌ ${connectionTest.message}`);
      console.log('\n🔍 Detailed Error Information:');
      console.log(`   Error: ${connectionTest.message}`);
      console.log('\n⚠️  Possible issues:');
      console.log('   1. Service role key is incorrect or expired');
      console.log('   2. Database migrations have not been run yet');
      console.log('   3. Network/firewall blocking Supabase connection');
      console.log('   4. Supabase project is paused or suspended\n');
      console.log('💡 Try this:');
      console.log('   1. Verify your service_role key in Supabase Dashboard → Settings → API');
      console.log('   2. Check if database migrations have been executed in Supabase SQL Editor');
      console.log('   3. Try accessing your Supabase project in the dashboard\n');
      process.exit(1);
    }
    
    if (!connectionTest.schemaExists) {
      console.log('\n⚠️  WARNING: Database schema not found!');
      console.log('   Please run database migrations first:');
      console.log('   1. Open Supabase SQL Editor');
      console.log('   2. Run: backend/database/migrations/001_create_schema.sql');
      console.log('   3. Run: backend/database/migrations/002_create_rls_policies.sql');
      console.log('   4. Run: backend/database/migrations/003_create_functions_views.sql');
      console.log('   5. Run: backend/database/seeds/001_seed_institutions.sql\n');
      process.exit(1);
    }

    console.log();

    // Test 2: Database Statistics
    console.log('📊 Test 2: Fetching Database Statistics...');
    const stats = await getDatabaseStats();
    console.log(`   Tables: ${stats.tableCount} detected`);
    console.log(`   Institutions: ${stats.institutionCount || 0} found`);
    
    if (stats.institutions.length > 0) {
      console.log('\n   Institution List:');
      stats.institutions.slice(0, 5).forEach((inst) => {
        console.log(`     - ${inst.code}: ${inst.name_en} (${inst.status})`);
      });
      if (stats.institutions.length > 5) {
        console.log(`     ... and ${stats.institutions.length - 5} more`);
      }
    }
    console.log();

    // Test 3: Schema Verification
    console.log('🔍 Test 3: Verifying Database Schema...');
    const verification = await verifyDatabaseSchema();
    
    console.log(`   Expected Tables: ${verification.tables.expected}`);
    console.log(`   Actual Tables: ${verification.tables.actual}`);
    console.log(`   Missing Tables: ${verification.tables.missing.length}`);
    
    if (verification.tables.missing.length > 0) {
      console.log('   ❌ Missing:', verification.tables.missing.join(', '));
    }
    
    if (verification.tables.unexpected.length > 0) {
      console.log('   ⚠️  Unexpected:', verification.tables.unexpected.join(', '));
    }
    
    console.log(`\n   Expected Institutions: ${verification.institutions.expected}`);
    console.log(`   Actual Institutions: ${verification.institutions.actual}`);
    
    if (verification.institutions.correct) {
      console.log('   ✅ Institution count correct (no 13th institution)');
    } else {
      console.log('   ❌ Institution count mismatch!');
    }
    
    console.log();

    // Final Verdict
    console.log('╔════════════════════════════════════════════════════════╗');
    if (verification.passed) {
      console.log('║     ✅ ALL TESTS PASSED                               ║');
      console.log('║     ✅ DATABASE SCHEMA VERIFIED                       ║');
      console.log('║     ✅ READY FOR BACKEND OPERATIONS                   ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      console.log('🎉 Your backend is ready to connect to Supabase!\n');
      console.log('Next steps:');
      console.log('  1. Start the backend: npm run dev');
      console.log('  2. Test health endpoint: http://localhost:5000/api/health');
      console.log('  3. Begin implementing API endpoints\n');
      process.exit(0);
    } else {
      console.log('║     ❌ TESTS FAILED                                   ║');
      console.log('║     ⚠️  DATABASE SCHEMA INCOMPLETE                    ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      console.log('⚠️  Please fix the issues above before proceeding.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    console.log('\n⚠️  Connection test failed. Please check your configuration.\n');
    process.exit(1);
  }
}

// Run tests
runTests();
