import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: institutions, error: instError } = await supabase
  .from('institutions')
  .select('id, code, name_en')
  .order('name_en');

if (instError) {
  console.error('Institution query failed:', instError);
  process.exit(1);
}

console.log('\n=== INSTITUTIONS ===');
for (const i of institutions) {
  console.log(`${i.name_en} | code=${i.code} | id=${i.id}`);
}

const { data: users, error: userError } = await supabase
  .from('users')
  .select('id, email, full_name, role, status, institution_id')
  .eq('role', 'EMPLOYEE')
  .order('full_name');

if (userError) {
  console.error('User query failed:', userError);
  process.exit(1);
}

console.log('\n=== EMPLOYEES ===');
for (const u of users) {
  console.log(
    `${u.full_name} | ${u.email} | role=${u.role} | status=${u.status} | institution_id=${u.institution_id}`
  );
}
