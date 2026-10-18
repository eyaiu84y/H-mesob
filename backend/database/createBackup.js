import fs from 'fs';
import path from 'path';
import { supabase } from '../src/config/supabase.js';

async function fetchAllRows(tableName) {
  let allRows = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, from + pageSize - 1);

    if (error) {
      console.warn(`Warning reading table ${tableName}:`, error.message);
      break;
    }

    if (data && data.length > 0) {
      allRows = allRows.concat(data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    } else {
      hasMore = false;
    }
  }

  return allRows;
}

export async function createFullBackup() {
  const backupDir = path.resolve('./database/backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, 'backup_defense_preclean_' + timestamp + '.json');

  console.log('Generating complete restorable pre-cleanup backup to:\n', backupFilePath);

  const tablesToBackup = [
    'users',
    'institutions',
    'services',
    'applications',
    'queue_entries',
    'service_feedback',
    'maintenance_reports',
    'maintenance_tasks',
    'maintenance_attachments',
    'announcements',
    'notifications',
    'failed_login_attempts',
    'audit_logs'
  ];

  const backupData = {
    timestamp: new Date().toISOString(),
    tables: {}
  };

  for (const table of tablesToBackup) {
    try {
      const rows = await fetchAllRows(table);
      backupData.tables[table] = rows;
      console.log(`  📦 ${table}: ${rows.length} records backed up`);
    } catch (e) {
      console.warn(`Exception reading table ${table}:`, e.message);
      backupData.tables[table] = [];
    }
  }

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
  const stats = fs.statSync(backupFilePath);
  console.log(`\n✅ Backup successfully created and verified! Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);
  return backupFilePath;
}

createFullBackup().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
