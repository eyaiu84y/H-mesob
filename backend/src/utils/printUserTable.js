import { supabase } from '../config/supabase.js';

async function printTables() {
  const { data: users, error } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      email,
      role,
      status,
      institution_id,
      created_at,
      institutions (
        name_en
      )
    `)
    .order('role', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const staff = [];
  const customers = [];

  for (const u of users) {
    const roleUpper = (u.role || '').toUpperCase();
    const isStaff = ['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER', 'EMPLOYEE', 'TECHNICIAN', 'ICT_STAFF'].includes(roleUpper);
    const row = {
      name: u.full_name || '—',
      email: u.email,
      role: u.role,
      status: u.status,
      institution: u.institutions?.name_en || (u.institution_id ? 'Assigned' : '—'),
      date: u.created_at ? u.created_at.split('T')[0] : '—'
    };
    if (isStaff) staff.push(row);
    else customers.push(row);
  }

  console.log('### Internal Staff Users (' + staff.length + ')');
  console.log('| # | Full Name | Official Email | Role | Status | Assigned Institution | Created |');
  console.log('|---|---|---|---|---|---|---|');
  staff.forEach((s, idx) => {
    console.log(`| ${idx + 1} | ${s.name} | \`${s.email}\` | ${s.role} | ${s.status} | ${s.institution} | ${s.date} |`);
  });

  console.log('\n### External Customers / Citizens (' + customers.length + ')');
  console.log('| # | Full Name | Email | Role | Status | Created |');
  console.log('|---|---|---|---|---|---|');
  customers.forEach((c, idx) => {
    console.log(`| ${idx + 1} | ${c.name} | \`${c.email}\` | ${c.role} | ${c.status} | ${c.date} |`);
  });
}

printTables();
