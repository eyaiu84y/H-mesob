import { supabase } from './src/config/supabase.js';

async function checkQueue() {
  console.log('=== CHECKING CURRENT QUEUE STATUS ===\n');

  // Check all queue entries
  const { data: queues } = await supabase
    .from('queue_entries')
    .select(`
      id,
      queue_number,
      status,
      priority,
      created_at,
      institutions (code, name_en),
      services (title_en),
      users!queue_entries_citizen_id_fkey (email, full_name, role)
    `)
    .order('created_at', { ascending: false });

  if (!queues || queues.length === 0) {
    console.log('❌ NO QUEUE ENTRIES FOUND!');
    console.log('   The citizen registration failed or was not saved.');
    console.log('');
    console.log('ACTION: Have the citizen register for queue again.');
    process.exit(0);
  }

  console.log(`✅ Found ${queues.length} queue entries:\n`);

  queues.forEach((q, i) => {
    console.log(`${i + 1}. Token: ${q.queue_number}`);
    console.log(`   Status: ${q.status}`);
    console.log(`   Priority: ${q.priority}`);
    console.log(`   Institution: ${q.institutions.name_en} (${q.institutions.code})`);
    console.log(`   Service: ${q.services.title_en}`);
    console.log(`   Citizen: ${q.users.full_name} (${q.users.email})`);
    console.log(`   Created: ${new Date(q.created_at).toLocaleString()}`);
    console.log('');
  });

  // Check Sidama Bank employee
  const { data: sidamaEmp } = await supabase
    .from('users')
    .select('id, email, full_name, institution_id, institutions (code, name_en)')
    .eq('email', 'sidama.employee@mesobcenter.et')
    .single();

  if (sidamaEmp) {
    console.log('Sidama Bank Employee:');
    console.log('- Email:', sidamaEmp.email);
    console.log('- Institution:', sidamaEmp.institutions.name_en);
    console.log('');

    // Check if any queues match this employee's institution
    const matchingQueues = queues.filter(q => 
      q.institutions.code === sidamaEmp.institutions.code
    );

    if (matchingQueues.length > 0) {
      console.log(`✅ Employee SHOULD see ${matchingQueues.length} queue(s)`);
    } else {
      console.log('❌ No queues match employee institution');
      console.log(`   Employee institution: ${sidamaEmp.institutions.code}`);
      console.log(`   Queue institution: ${queues[0]?.institutions.code}`);
    }
  }

  process.exit(0);
}

checkQueue();
