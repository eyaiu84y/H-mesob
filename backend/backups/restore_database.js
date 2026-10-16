import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { supabase } from '../src/config/supabase.js';

const tableOrder = [
  'institutions',
  'users',
  'services',
  'applications',
  'queue_entries',
  'maintenance_reports',
  'maintenance_tasks',
  'announcements',
  'notifications',
  'service_feedback'
];

export async function restoreDatabase(backupFilePath, dryRun = false) {
  console.log(`\n============================================================`);
  console.log(`🔄 Database Restore Tool`);
  console.log(`============================================================`);
  console.log(`Source backup: ${backupFilePath}`);
  console.log(`Dry run mode: ${dryRun ? 'YES (validation only)' : 'NO (executing restore)'}`);

  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not found: ${backupFilePath}`);
  }

  const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
  console.log(`Backup created at: ${backupData.timestamp}`);

  const results = {};

  for (const table of tableOrder) {
    const rows = backupData.tables[table] || [];
    console.log(`\n📦 Checking table: ${table} (${rows.length} rows in backup)...`);

    if (rows.length === 0) {
      console.log(`   (No rows to restore)`);
      results[table] = { status: 'skipped', count: 0 };
      continue;
    }

    if (dryRun) {
      // Validate columns with a limit(1) query
      const keys = Object.keys(rows[0]);
      const { error } = await supabase.from(table).select(keys.join(',')).limit(1);
      if (error) {
        console.error(`   ❌ Dry-run schema validation failed for ${table}:`, error.message);
        results[table] = { status: 'failed', error: error.message };
      } else {
        console.log(`   ✅ Dry-run schema validation passed (${keys.length} columns match).`);
        results[table] = { status: 'validated', count: rows.length };
      }
      continue;
    }

    // Execute restore via batches of 50
    let restoredCount = 0;
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase.from(table).upsert(batch, { onConflict: 'id' });
      if (error) {
        console.error(`   ❌ Failed restoring batch ${i}-${i + batch.length} for ${table}:`, error.message);
        results[table] = { status: 'error', error: error.message };
        break;
      }
      restoredCount += batch.length;
    }

    if (!results[table] || results[table].status !== 'error') {
      console.log(`   ✅ Successfully restored ${restoredCount}/${rows.length} rows to ${table}.`);
      results[table] = { status: 'success', count: restoredCount };
    }
  }

  console.log(`\n============================================================`);
  console.log(`📊 Restore Summary:`);
  console.log(`============================================================`);
  console.table(results);
  return results;
}

// Allow CLI execution: node restore_database.js [path] [--dry-run]
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const isDryRun = process.argv.includes('--dry-run');
  const targetFile = process.argv.find(arg => arg.endsWith('.json')) || 
    path.join(__dirname, 'pre_migration_backup_1792094828942.json');

  restoreDatabase(targetFile, isDryRun)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal restore error:', err);
      process.exit(1);
    });
}
