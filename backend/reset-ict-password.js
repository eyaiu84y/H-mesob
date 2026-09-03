/**
 * Reset ICT staff password
 * Run: node reset-ict-password.js
 */

import { supabase } from './src/config/supabase.js';
import bcrypt from 'bcrypt';

async function resetPassword() {
  try {
    console.log('Resetting password for ICT staff...\n');

    const email = 'getahun45@gmail.com';
    const newPassword = 'ict123';

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const { data, error } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating password:', error);
      return;
    }

    console.log('✅ Password reset successfully!');
    console.log('\nLogin Credentials:');
    console.log('Email:', email);
    console.log('Password:', newPassword);
    console.log('\nUser Details:');
    console.log('ID:', data.id);
    console.log('Name:', data.full_name);
    console.log('Role:', data.role);

  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

resetPassword();
