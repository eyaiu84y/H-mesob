import { supabase } from './src/config/supabase.js';

async function testInsert() {
  console.log('=== TESTING CITIZEN QUEUE INSERT ===\n');

  // Get citizen
  const { data: citizen } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('email', 'citizen@mesobcenter.et')
    .single();

  // Get Sidama Bank
  const { data: sidama } = await supabase
    .from('institutions')
    .select('id')
    .eq('code', 'sidama-bank')
    .single();

  // Get a service
  const { data: service } = await supabase
    .from('services')
    .select('id, title_en')
    .eq('institution_id', sidama.id)
    .limit(1)
    .single();

  console.log('Citizen:', citizen?.email);
  console.log('Sidama ID:', sidama?.id);
  console.log('Service:', service?.title_en, service?.id);
  console.log('');

  // Try to insert
  const { data, error } = await supabase
    .from('queue_entries')
    .insert({
      queue_number: 'Q-2026-TEST',
      institution_id: sidama.id,
      service_id: service.id,
      citizen_id: citizen.id,
      priority: 'NORMAL',
      status: 'PENDING',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('❌ INSERT FAILED:', error);
  } else {
    console.log('✅ INSERT SUCCESS:', data.queue_number);
  }

  process.exit(0);
}

testInsert();
