import { supabase } from './src/config/supabase.js';
import bcrypt from 'bcrypt';

async function createSidamaEmployee() {
  console.log('=== CREATING SIDAMA BANK EMPLOYEE ===\n');

  const { data: sidama } = await supabase
    .from('institutions')
    .select('id, name_en')
    .eq('code', 'sidama-bank')
    .single();

  if (!sidama) {
    console.error('❌ Sidama Bank not found!');
    process.exit(1);
  }

  console.log('✅ Sidama Bank found:', sidama.name_en);

  const password = 'sidama123';
  const passwordHash = await bcrypt.hash(password, 10);

  const { data: employee, error } = await supabase
    .from('users')
    .insert({
      email: 'sidama.employee@mesobcenter.et',
      password_hash: passwordHash,
      full_name: 'Sidama Bank Employee',
      phone: '+251911111111',
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      institution_id: sidama.id,
      employee_id: 'SID-EMP-001',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      console.log('⚠️  Employee already exists');
    } else {
      console.error('❌ Error:', error);
    }
  } else {
    console.log('✅ Employee created!');
    console.log('\nLOGIN:');
    console.log('Email: sidama.employee@mesobcenter.et');
    console.log('Password: sidama123');
  }

  process.exit(0);
}

createSidamaEmployee();
