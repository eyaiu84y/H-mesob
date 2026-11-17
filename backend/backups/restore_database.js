/**
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
  const jsonFile = path.join(__dirname, 'backup_pre_migration_2026-11-07T18-20-30-831Z.json');
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
