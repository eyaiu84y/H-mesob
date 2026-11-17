import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { supabase } from '../src/config/supabase.js';

async function backup() {
  const backupsDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const tables = [
    'users',
    'institutions',
    'services',
    'applications',
    'queue_entries',
    'announcements',
    'maintenance_reports',
    'maintenance_tasks',
    'service_feedback'
  ];

  const dbData = {};

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.warn(`Warning backing up ${table}:`, error.message);
      dbData[table] = [];
    } else {
      dbData[table] = data || [];
      console.log(`Backed up ${table}: ${dbData[table].length} rows`);
    }
  }

  const jsonFilename = `backup_pre_migration_${timestamp}.json`;
  const jsonPath = path.join(backupsDir, jsonFilename);
  fs.writeFileSync(jsonPath, JSON.stringify(dbData, null, 2));
  console.log(`Saved JSON backup to ${jsonPath}`);

  // Also create a standalone SQL restore dump
  let sqlDump = `-- Hawassa MESOB Database Pre-Migration Snapshot\n-- Created: ${new Date().toISOString()}\n\n`;
  for (const table of tables) {
    const rows = dbData[table];
    if (rows && rows.length > 0) {
      sqlDump += `-- Table: ${table} (${rows.length} rows)\n`;
      for (const row of rows) {
        const cols = Object.keys(row);
        const vals = cols.map(c => {
          const val = row[c];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number' || typeof val === 'boolean') return val;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        sqlDump += `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`;
      }
      sqlDump += `\n`;
    }
  }

  const sqlFilename = `backup_pre_migration_${timestamp}.sql`;
  const sqlPath = path.join(backupsDir, sqlFilename);
  fs.writeFileSync(sqlPath, sqlDump);
  console.log(`Saved SQL backup to ${sqlPath}`);

  // Create restore runner script
  const restoreScriptContent = `/**
 * Database Restore Runner Script
 * Restores data from the pre-migration JSON snapshot.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { supabase } from '../src/config/supabase.js';

async function restore() {
  const jsonFile = path.join(__dirname, '${jsonFilename}');
  if (!fs.existsSync(jsonFile)) {
    console.error('Backup JSON not found at:', jsonFile);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  console.log('Restoring from:', jsonFile);
  for (const [table, rows] of Object.entries(data)) {
    if (rows && rows.length > 0) {
      console.log('Restoring ' + rows.length + ' rows to ' + table);
      const { error } = await supabase.from(table).upsert(rows);
      if (error) console.error('Error restoring ' + table + ':', error.message);
      else console.log('Successfully restored ' + table);
    }
  }
}

restore();
`;

  fs.writeFileSync(path.join(backupsDir, 'restore_database.js'), restoreScriptContent);
  console.log(`Created restore script at backend/backups/restore_database.js`);
}

backup();
