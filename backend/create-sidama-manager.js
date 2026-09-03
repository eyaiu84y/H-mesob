/**
 * Create Institution Manager for Sidama Bank
 * Run: node create-sidama-manager.js
 */

import { supabase } from './src/config/supabase.js';
import bcrypt from 'bcrypt';

async function createSidamaManager() {
  try {
    console.log('Creating Institution Manager for Sidama Bank...\n');

    const institutionId = '15208ad9-5fc3-4e8c-aa14-1f392437c6c9'; // Sidama Bank
    const email = 'sidama.manager@mesobcenter.et';
    const password = 'manager123';
    const fullName = 'Sidama Bank Manager';

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existing) {
      console.log('✅ User already exists:', existing.email);
      console.log('   ID:', existing.id);
      console.log('\nLogin Credentials:');
      console.log('Email:', email);
      console.log('Password:', password);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        full_name: fullName,
        phone: '+251922222222',
        role: 'INSTITUTION_MANAGER',
        status: 'ACTIVE',
        institution_id: institutionId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating user:', error);
      return;
    }

    console.log('✅ Institution Manager created successfully!');
    console.log('\nLogin Credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\nUser Details:');
    console.log('ID:', user.id);
    console.log('Name:', user.full_name);
    console.log('Role:', user.role);
    console.log('Institution ID:', user.institution_id);

  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

createSidamaManager();
