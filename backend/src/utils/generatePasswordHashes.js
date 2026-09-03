/**
 * Password Hash Generator for Initial Users
 * 
 * IMPORTANT: This script generates bcrypt password hashes for the initial system users.
 * Run this BEFORE executing the 003_seed_initial_users.sql migration.
 * 
 * Usage:
 *   node src/utils/generatePasswordHashes.js
 * 
 * Security:
 * - Uses bcrypt with 10 salt rounds (industry standard)
 * - Generates strong random passwords by default
 * - Or use custom passwords (not recommended for production)
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

// Generate a strong random password
function generateStrongPassword(length = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const values = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[values[i] % charset.length];
  }
  return password;
}

// User configurations
// OPTION 1: Use custom passwords (for testing/development)
const USE_CUSTOM_PASSWORDS = true;

const CUSTOM_PASSWORDS = {
  'superadmin@mesobcenter.et': 'SuperAdmin@2026',
  'manager@mesobcenter.et': 'MesobManager@2026',
  'inst.manager@mesobcenter.et': 'InstManager@2026',
  'employee@mesobcenter.et': 'Employee@2026',
  'ict.staff@mesobcenter.et': 'IctStaff@2026',
  'citizen@mesobcenter.et': 'Citizen@2026',
  'cbe.manager@mesobcenter.et': 'CbeManager@2026',
  'cbe.employee@mesobcenter.et': 'CbeEmployee@2026',
  'cbe.ict@mesobcenter.et': 'CbeIct@2026',
  'ethiotel.manager@mesobcenter.et': 'EthioManager@2026',
  'ethiotel.employee@mesobcenter.et': 'EthioEmployee@2026',
  'ethiotel.ict@mesobcenter.et': 'EthioIct@2026',
};

// OPTION 2: Generate random strong passwords (for production)
const RANDOM_PASSWORDS = {
  'superadmin@mesobcenter.et': generateStrongPassword(),
  'manager@mesobcenter.et': generateStrongPassword(),
  'inst.manager@mesobcenter.et': generateStrongPassword(),
  'employee@mesobcenter.et': generateStrongPassword(),
  'ict.staff@mesobcenter.et': generateStrongPassword(),
  'citizen@mesobcenter.et': generateStrongPassword(),
  'cbe.manager@mesobcenter.et': generateStrongPassword(),
  'cbe.employee@mesobcenter.et': generateStrongPassword(),
  'cbe.ict@mesobcenter.et': generateStrongPassword(),
  'ethiotel.manager@mesobcenter.et': generateStrongPassword(),
  'ethiotel.employee@mesobcenter.et': generateStrongPassword(),
  'ethiotel.ict@mesobcenter.et': generateStrongPassword(),
};

const PASSWORDS = USE_CUSTOM_PASSWORDS ? CUSTOM_PASSWORDS : RANDOM_PASSWORDS;

async function generateHashes() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     🔐 PASSWORD HASH GENERATOR                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log(`Mode: ${USE_CUSTOM_PASSWORDS ? '⚠️ CUSTOM PASSWORDS (Dev/Test)' : '✅ RANDOM PASSWORDS (Production)'}`);
  console.log(`Salt Rounds: ${SALT_ROUNDS}`);
  console.log(`Total Users: ${Object.keys(PASSWORDS).length}\n`);
  
  console.log('─────────────────────────────────────────────────────────\n');
  
  const results = [];
  
  for (const [email, password] of Object.entries(PASSWORDS)) {
    try {
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      results.push({ email, password, hash });
      console.log(`✅ Generated hash for: ${email}`);
    } catch (error) {
      console.error(`❌ Failed to hash password for ${email}:`, error.message);
    }
  }
  
  console.log('\n─────────────────────────────────────────────────────────\n');
  
  // Display results
  console.log('📋 PASSWORD CREDENTIALS\n');
  console.log('⚠️  IMPORTANT: Store these securely! They will only be shown once.\n');
  
  results.forEach(({ email, password }, index) => {
    console.log(`${index + 1}. ${email}`);
    console.log(`   Password: ${password}`);
    console.log('');
  });
  
  console.log('─────────────────────────────────────────────────────────\n');
  
  // Generate SQL UPDATE statements
  console.log('📝 SQL UPDATE STATEMENTS\n');
  console.log('Copy and paste these into your SQL editor to update the seed file:\n');
  console.log('-- ============================================================================');
  console.log('-- UPDATE PASSWORD HASHES IN SEED FILE');
  console.log('-- Generated: ' + new Date().toISOString());
  console.log('-- ============================================================================\n');
  
  results.forEach(({ email, hash }) => {
    console.log(`-- ${email}`);
    console.log(`-- Replace the password_hash in INSERT statement with:`);
    console.log(`'${hash}',`);
    console.log('');
  });
  
  console.log('-- ============================================================================\n');
  
  // Generate JSON for documentation
  console.log('─────────────────────────────────────────────────────────\n');
  console.log('📄 JSON FORMAT (for password manager)\n');
  
  const jsonOutput = results.map(({ email, password }) => ({
    email,
    password,
    role: getRoleFromEmail(email),
  }));
  
  console.log(JSON.stringify(jsonOutput, null, 2));
  
  console.log('\n─────────────────────────────────────────────────────────\n');
  
  // Security reminders
  console.log('🔐 SECURITY REMINDERS:\n');
  console.log('1. ✅ Store passwords in a secure password manager');
  console.log('2. ✅ Update 003_seed_initial_users.sql with the hashes above');
  console.log('3. ✅ Never commit passwords to git');
  console.log('4. ✅ Force password change on first login (implement in backend)');
  console.log('5. ✅ Enable MFA for admin users (future enhancement)');
  console.log('6. ✅ Rotate passwords regularly');
  console.log('7. ✅ Use random passwords for production (set USE_CUSTOM_PASSWORDS = false)');
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     ✅ PASSWORD HASH GENERATION COMPLETE              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

function getRoleFromEmail(email) {
  if (email.includes('superadmin')) return 'SUPER_ADMIN';
  if (email.includes('manager') && !email.includes('inst') && !email.includes('cbe') && !email.includes('ethiotel')) return 'MESOB_MANAGER';
  if (email.includes('inst.manager') || email.includes('.manager')) return 'INSTITUTION_MANAGER';
  if (email.includes('employee')) return 'EMPLOYEE';
  if (email.includes('ict')) return 'ICT_STAFF';
  if (email.includes('citizen')) return 'CITIZEN';
  return 'UNKNOWN';
}

// Check if bcrypt is installed
try {
  await bcrypt.hash('test', 10);
} catch (error) {
  console.error('\n❌ Error: bcrypt is not installed!');
  console.error('\nInstall bcrypt with:');
  console.error('  npm install bcrypt');
  console.error('\nOr add to package.json dependencies:');
  console.error('  "bcrypt": "^5.1.1"');
  process.exit(1);
}

// Run the generator
generateHashes().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

