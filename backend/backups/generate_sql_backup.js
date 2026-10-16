import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, 'pre_migration_backup_1792094828942.json');
const backup = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let sql = `-- ============================================================================
-- Hawassa MESOB Database Full Data Backup (Pre-Role Migration)
-- Generated: ${backup.timestamp}
-- Tables: ${Object.keys(backup.tables).join(', ')}
-- ============================================================================

BEGIN;

-- Disable triggers temporarily during restore if needed
SET session_replication_role = 'replica';

`;

// Table insertion order to satisfy foreign key dependencies
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

for (const table of tableOrder) {
  const rows = backup.tables[table] || [];
  if (rows.length === 0) continue;

  sql += `-- ============================================================================\n`;
  sql += `-- Table: ${table} (${rows.length} rows)\n`;
  sql += `-- ============================================================================\n`;

  for (const row of rows) {
    const cols = Object.keys(row);
    const vals = cols.map(c => {
      const v = row[c];
      if (v === null || v === undefined) return 'NULL';
      if (typeof v === 'boolean' || typeof v === 'number') return v;
      if (Array.isArray(v)) {
        if (v.length === 0) return "'{}'";
        return `ARRAY[${v.map(item => `'${String(item).replace(/'/g, "''")}'`).join(', ')}]`;
      }
      if (typeof v === 'object') {
        return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
      }
      return `'${String(v).replace(/'/g, "''")}'`;
    });

    sql += `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT (id) DO UPDATE SET ${cols.filter(c => c !== 'id').map(c => `${c} = EXCLUDED.${c}`).join(', ')};\n`;
  }
  sql += '\n';
}

sql += `
SET session_replication_role = 'origin';

COMMIT;

-- Backup verification queries
SELECT 'users' AS tbl, count(*) FROM users
UNION ALL SELECT 'institutions', count(*) FROM institutions
UNION ALL SELECT 'services', count(*) FROM services
UNION ALL SELECT 'applications', count(*) FROM applications
UNION ALL SELECT 'queue_entries', count(*) FROM queue_entries
UNION ALL SELECT 'maintenance_reports', count(*) FROM maintenance_reports
UNION ALL SELECT 'maintenance_tasks', count(*) FROM maintenance_tasks
UNION ALL SELECT 'announcements', count(*) FROM announcements
UNION ALL SELECT 'notifications', count(*) FROM notifications
UNION ALL SELECT 'service_feedback', count(*) FROM service_feedback;
`;

const outPath = path.join(__dirname, 'pre_migration_backup_1792094828942.sql');
fs.writeFileSync(outPath, sql);
console.log(`✅ Generated SQL backup: ${outPath} (${Math.round(sql.length / 1024)} KB)`);
