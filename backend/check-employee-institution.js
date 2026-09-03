import { supabase } from './src/config/supabase.js';

async function checkInstitutions() {
  console.log('=== CHECKING INSTITUTIONS AND QUEUE ===\n');

  // Check queue entry
  const { data: queue } = await supabase
    .from('queue_entries')
    .select(`
      id,
      queue_number,
      status,
      institutions (code, name_en),
      services (title_en),
      users!queue_entries_citizen_id_fkey (email, full_name)
    `)
    .eq('queue_number', 'Q-2026-0001')
    .single();

  console.log('Queue Entry:');
  console.log('- Token:', queue?.queue_number);
  console.log('- Institution:', queue?.institutions?.name_en, `(${queue?.institutions?.code})`);
  console.log('- Service:', queue?.services?.title_en);
  console.log('- Citizen:', queue?.users?.full_name, `(${queue?.users?.email})`);
  console.log('- Status:', queue?.status);
  console.log('');

  // Check which employee is logged in (Test Employee)
  const { data: employees } = await supabase
    .from('users')
    .select('id, full_name, email, role, institutions (code, name_en)')
    .ilike('full_name', '%Test%')
    .eq('role', 'EMPLOYEE');

  if (employees && employees.length > 0) {
    console.log('Test Employee:');
    employees.forEach(emp => {
      console.log('- Name:', emp.full_name);
      console.log('- Email:', emp.email);
      console.log('- Institution:', emp.institutions?.name_en, `(${emp.institutions?.code})`);
      console.log('');
    });
  }

  // Check Sidama Bank
  const { data: sidama } = await supabase
    .from('institutions')
    .select('id, code, name_en')
    .eq('code', 'sidama-bank')
    .single();

  console.log('Sidama Bank ID:', sidama?.id);
  console.log('');

  console.log('=== DIAGNOSIS ===');
  if (queue?.institutions?.code !== employees?.[0]?.institutions?.code) {
    console.log('❌ MISMATCH: Employee is NOT from the same institution as the queue!');
    console.log(`   Queue institution: ${queue?.institutions?.code}`);
    console.log(`   Employee institution: ${employees?.[0]?.institutions?.code}`);
    console.log('');
    console.log('FIX: Login as an employee from Sidama Bank');
  } else {
    console.log('✅ Employee and queue are from the same institution');
  }

  process.exit(0);
}

checkInstitutions();
