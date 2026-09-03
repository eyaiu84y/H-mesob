import { supabase } from './src/config/supabase.js';

async function diagnoseAndFix() {
  console.log('=== QUEUE SYSTEM DIAGNOSIS ===\n');

  // 1. Check queue entry exists
  const { data: queue, error: qErr } = await supabase
    .from('queue_entries')
    .select(`
      id,
      queue_number,
      status,
      institution_id,
      service_id,
      citizen_id,
      created_at,
      institutions (id, code, name_en),
      services (id, title_en),
      users:citizen_id (id, email, full_name, role)
    `)
    .eq('queue_number', 'Q-2026-0001')
    .single();

  if (qErr || !queue) {
    console.log('❌ Queue Q-2026-0001 NOT FOUND in database!');
    console.log('   The "already in queue" check is looking at wrong data.');
    console.log('\nFIX: Clear the queue cache and register again.\n');
    process.exit(0);
  }

  console.log('✅ Queue Entry Found:');
  console.log('   Token:', queue.queue_number);
  console.log('   Status:', queue.status);
  console.log('   Institution:', queue.institutions.name_en, `(${queue.institutions.code})`);
  console.log('   Service:', queue.services.title_en);
  console.log('   Citizen:', queue.users.full_name, `(${queue.users.email})`);
  console.log('   Institution ID:', queue.institution_id);
  console.log('');

  // 2. Check Sidama employee
  const { data: sidamaEmp } = await supabase
    .from('users')
    .select('id, email, full_name, role, institution_id, institutions (id, code, name_en)')
    .eq('email', 'sidama.employee@mesobcenter.et')
    .single();

  if (!sidamaEmp) {
    console.log('❌ Sidama Bank employee not found!');
    console.log('\nFIX: Login as sidama.employee@mesobcenter.et / sidama123\n');
    process.exit(0);
  }

  console.log('✅ Sidama Bank Employee Found:');
  console.log('   Email:', sidamaEmp.email);
  console.log('   Institution:', sidamaEmp.institutions.name_en, `(${sidamaEmp.institutions.code})`);
  console.log('   Institution ID:', sidamaEmp.institution_id);
  console.log('');

  // 3. Check if institutions match
  if (queue.institution_id !== sidamaEmp.institution_id) {
    console.log('❌ INSTITUTION MISMATCH!');
    console.log('   Queue institution ID:', queue.institution_id);
    console.log('   Employee institution ID:', sidamaEmp.institution_id);
    console.log('   Queue institution:', queue.institutions.name_en);
    console.log('   Employee institution:', sidamaEmp.institutions.name_en);
    console.log('\n   Employee CANNOT see this queue (different institution)');
    console.log('\nFIX: Delete this queue and have citizen register for Sidama Bank service.\n');
    process.exit(0);
  }

  console.log('✅ Institution IDs MATCH!');
  console.log('');

  // 4. Check RLS policies
  console.log('Checking RLS policies...');
  const { data: policies } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT policyname, cmd, roles, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'queue_entries'
        ORDER BY policyname;
      `
    });

  if (policies && policies.length > 0) {
    console.log('Found', policies.length, 'RLS policies on queue_entries');
  }
  console.log('');

  // 5. Test employee query directly
  console.log('Testing employee queue query...');
  
  // Simulate what getInstitutionQueue does
  const { data: empQueues, error: empErr } = await supabase
    .from('queue_entries')
    .select(`
      id,
      queue_number,
      status,
      created_at,
      institutions (name_en),
      services (title_en)
    `)
    .eq('institution_id', sidamaEmp.institution_id)
    .order('created_at', { ascending: true });

  if (empErr) {
    console.log('❌ Employee query FAILED:', empErr.message);
    console.log('   Error code:', empErr.code);
    console.log('   This is an RLS policy issue!');
  } else if (!empQueues || empQueues.length === 0) {
    console.log('❌ Employee query returned EMPTY result');
    console.log('   RLS policy is blocking the employee from seeing queues!');
    console.log('\nROOT CAUSE: Missing or incorrect RLS policy');
    console.log('The employee_manage_institution_queue policy might be wrong.');
  } else {
    console.log('✅ Employee query SUCCESS!');
    console.log('   Found', empQueues.length, 'queue(s)');
    empQueues.forEach(q => {
      console.log('   -', q.queue_number, '|', q.status, '|', q.services.title_en);
    });
  }

  console.log('\n=== END DIAGNOSIS ===');
  process.exit(0);
}

diagnoseAndFix();
