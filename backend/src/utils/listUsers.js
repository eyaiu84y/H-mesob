import { supabase } from '../config/supabase.js';

async function listAllUsers() {
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
      metadata,
      institutions (
        name_en,
        code
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    process.exit(1);
  }

  const formatted = users.map((u, index) => {
    const isInternal = ['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER', 'EMPLOYEE', 'TECHNICIAN', 'ICT_STAFF'].includes((u.role || '').toUpperCase());
    const mustChange = u.must_change_password === true || u.metadata?.must_change_password === true;
    const isVerified = isInternal || u.email_verified === true || u.metadata?.email_verification?.verified === true || !u.metadata?.email_verification;
    const instName = u.institutions?.name_en || (u.institution_id ? u.institution_id : 'N/A');

    return {
      index: index + 1,
      id: u.id,
      name: u.full_name || 'N/A',
      email: u.email,
      role: u.role,
      type: isInternal ? 'Internal Staff' : 'External Customer',
      status: u.status,
      institution: instName,
      mustChangePassword: mustChange ? 'YES (Temp)' : 'NO (Permanent)',
      emailVerified: isVerified ? 'Verified' : 'Pending',
      createdAt: u.created_at ? u.created_at.split('T')[0] : 'N/A'
    };
  });

  console.log(JSON.stringify(formatted, null, 2));
}

listAllUsers();
