/**
 * Run Service Seed File
 * Executes 002_seed_services.sql to populate all 37 approved services
 */

import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

// Parse Supabase connection string
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract database connection info from Supabase URL
// Format: https://[project-ref].supabase.co
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

// Supabase PostgreSQL connection details
const connectionString = `postgresql://postgres.${projectRef}:${supabaseKey}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runSeed() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');
    console.log('');

    // Count existing services
    console.log('📊 Checking current service count...');
    const countBefore = await client.query('SELECT COUNT(*) FROM services');
    console.log(`   Current services: ${countBefore.rows[0].count}`);
    console.log('');

    // Read seed file
    console.log('📄 Reading seed file: database/seeds/002_seed_services.sql');
    const seedSQL = fs.readFileSync('database/seeds/002_seed_services.sql', 'utf8');
    console.log('✅ Seed file loaded');
    console.log('');

    // Execute seed file
    console.log('🚀 Executing seed file...');
    console.log('   This may take a moment...');
    await client.query(seedSQL);
    console.log('✅ Seed file executed successfully');
    console.log('');

    // Count services after
    console.log('📊 Checking final service count...');
    const countAfter = await client.query('SELECT COUNT(*) FROM services');
    const servicesAdded = parseInt(countAfter.rows[0].count) - parseInt(countBefore.rows[0].count);
    console.log(`   Previous services: ${countBefore.rows[0].count}`);
    console.log(`   Current services: ${countAfter.rows[0].count}`);
    console.log(`   Services added: ${servicesAdded}`);
    console.log('');

    // Get breakdown by institution
    console.log('📋 Services by Institution:');
    const breakdown = await client.query(`
      SELECT 
        i.name_en,
        i.code,
        COUNT(s.id) as service_count
      FROM institutions i
      LEFT JOIN services s ON i.id = s.institution_id
      GROUP BY i.id, i.name_en, i.code
      ORDER BY i.code
    `);

    breakdown.rows.forEach(row => {
      console.log(`   ${row.code.padEnd(15)} ${row.name_en.padEnd(40)} ${row.service_count} services`);
    });
    console.log('');

    // Check for any services with missing data
    console.log('🔍 Checking for data quality issues...');
    const issuesQuery = await client.query(`
      SELECT 
        title_en,
        CASE WHEN title_en IS NULL OR title_en = '' THEN 'Missing title_en' ELSE NULL END as issue1,
        CASE WHEN service_fee IS NULL OR service_fee = '' THEN 'Missing service_fee' ELSE NULL END as issue2,
        CASE WHEN service_url IS NULL OR service_url = '' THEN 'Missing service_url' ELSE NULL END as issue3
      FROM services
      WHERE 
        (title_en IS NULL OR title_en = '') OR
        (service_fee IS NULL OR service_fee = '') OR
        (service_url IS NULL OR service_url = '')
    `);

    if (issuesQuery.rows.length > 0) {
      console.log(`   ⚠️  Found ${issuesQuery.rows.length} services with missing data`);
      issuesQuery.rows.forEach(row => {
        const issues = [row.issue1, row.issue2, row.issue3].filter(Boolean).join(', ');
        console.log(`      - ${row.title_en || '(unnamed)'}: ${issues}`);
      });
    } else {
      console.log('   ✅ All services have complete data');
    }
    console.log('');

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║              SERVICE SEED COMPLETE                           ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`✅ Successfully seeded ${servicesAdded} services`);
    console.log(`📊 Total services in database: ${countAfter.rows[0].count}`);
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR running seed:');
    console.error(error.message);
    if (error.position) {
      console.error(`   Error at position: ${error.position}`);
    }
    if (error.detail) {
      console.error(`   Detail: ${error.detail}`);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();
