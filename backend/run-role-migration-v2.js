/**
 * run-role-migration-v2.js
 * 
 * Executes full role rename via Supabase's /rest/v1/rpc (pg_execute) pattern
 * OR falls back to executing the SQL parts individually.
 * 
 * Strategy: Use the supabase-js client's from('...').rpc pattern,
 * or execute via the Postgres REST endpoint directly.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Helper: POST to Supabase SQL endpoint
function execSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const url  = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);
    
    // Supabase doesn't have exec_sql by default — use pg_query via REST
    // Instead we POST directly to the SQL API endpoint
    const sqlUrl = new URL(`${SUPABASE_URL}/pg/query`);

    const options = {
      method: 'POST',
      hostname: sqlUrl.hostname,
      path: `/rest/v1/rpc/exec_sql`,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Helper: Run SQL via Supabase SQL HTTP API (v2)
function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = sql;
    const urlObj = new URL(SUPABASE_URL);
    const projectRef = urlObj.hostname.split('.')[0];
    
    const options = {
      method: 'POST',
      hostname: `db.${urlObj.hostname.split('.').slice(-3).join('.')}`,
      path: '/query',
      headers: {
        'Content-Type': 'application/sql',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  Role Migration v2: Using Supabase Management API');
  console.log('══════════════════════════════════════════════════\n');

  // Check current state
  const { data: allUsers } = await supabase.from('users').select('role, email, id');
  const roleDist = {};
  (allUsers || []).forEach(u => { roleDist[u.role] = (roleDist[u.role] || 0) + 1; });
  
  console.log('Current role distribution:');
  Object.entries(roleDist).sort().forEach(([role, count]) => {
    const flag = ['CITIZEN','ICT_STAFF'].includes(role) ? ' ← NEEDS MIGRATION' : '';
    console.log(`  ${role.padEnd(25)} ${count} user(s)${flag}`);
  });

  const needMigration = (roleDist['CITIZEN'] || 0) + (roleDist['ICT_STAFF'] || 0);
  if (needMigration === 0) {
    console.log('\n  ✓ No migration needed — all users already use CUSTOMER/TECHNICIAN.');
    return;
  }

  console.log(`\n  Need to migrate: ${roleDist['CITIZEN'] || 0} CITIZEN + ${roleDist['ICT_STAFF'] || 0} ICT_STAFF users`);

  // Try Supabase Management API for DDL
  const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];
  console.log(`\n  Project ref: ${projectRef}`);

  // First add enum values via management API
  const ddlStatements = [
    "ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'CUSTOMER'",
    "ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'TECHNICIAN'"
  ];

  for (const sql of ddlStatements) {
    console.log(`\n  Executing DDL: ${sql}`);
    const result = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify({ sql })
    }).catch(e => ({ ok: false, text: async () => e.message }));
    
    const text = await result.text().catch(() => 'no response');
    console.log(`  Response: ${result.status || 'err'} — ${text.substring(0, 120)}`);
  }

  // Now attempt data migration regardless (if enum values already exist from prior SQL run)
  console.log('\n  Attempting data migration...');
  
  // CITIZEN → CUSTOMER
  const citizenList = (allUsers || []).filter(u => u.role === 'CITIZEN').map(u => u.id);
  if (citizenList.length > 0) {
    const { error } = await supabase
      .from('users')
      .update({ role: 'CUSTOMER', updated_at: new Date().toISOString() })
      .in('id', citizenList);
    
    if (error) {
      console.error(`  ✗ CITIZEN→CUSTOMER failed: ${error.message}`);
      console.log('\n  ══ ACTION REQUIRED ══');
      console.log('  The "CUSTOMER" enum value does not exist in your database yet.');
      console.log('  Please run this SQL in Supabase Dashboard → SQL Editor:');
      console.log('\n  -- Step 1: Add enum values (run separately, not in a transaction):');
      console.log("  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'CUSTOMER';");
      console.log("  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'TECHNICIAN';");
      console.log('\n  -- Step 2: After the above is committed, run the data migration:');
      console.log("  UPDATE users SET role = 'CUSTOMER', updated_at = NOW() WHERE role = 'CITIZEN';");
      console.log("  UPDATE users SET role = 'TECHNICIAN', updated_at = NOW() WHERE role = 'ICT_STAFF';");
    } else {
      console.log(`  ✓ Migrated ${citizenList.length} CITIZEN → CUSTOMER`);
    }
  }

  // ICT_STAFF → TECHNICIAN
  const ictList = (allUsers || []).filter(u => u.role === 'ICT_STAFF').map(u => u.id);
  if (ictList.length > 0) {
    const { error } = await supabase
      .from('users')
      .update({ role: 'TECHNICIAN', updated_at: new Date().toISOString() })
      .in('id', ictList);
    
    if (error) {
      console.error(`  ✗ ICT_STAFF→TECHNICIAN failed: ${error.message}`);
    } else {
      console.log(`  ✓ Migrated ${ictList.length} ICT_STAFF → TECHNICIAN`);
    }
  }

  // Final state
  const { data: finalUsers } = await supabase.from('users').select('role');
  const finalDist = {};
  (finalUsers || []).forEach(u => { finalDist[u.role] = (finalDist[u.role] || 0) + 1; });
  console.log('\nFinal role distribution:');
  Object.entries(finalDist).sort().forEach(([role, count]) => {
    console.log(`  ${role.padEnd(25)} ${count} user(s)`);
  });

  console.log('\n══════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
