/**
 * Check if there are ICT staff members for Sidama Bank
 * Run: node check-ict-staff.js
 */

import { supabase } from './src/config/supabase.js';

async function checkIctStaff() {
  try {
    console.log('Checking ICT staff for Sidama Bank...\n');

    const sidamaInstitutionId = '15208ad9-5fc3-4e8c-aa14-1f392437c6c9';

    // Get ICT staff for Sidama Bank
    const { data: ictStaff, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, status, institution_id')
      .eq('role', 'ICT_STAFF')
      .eq('institution_id', sidamaInstitutionId)
      .eq('status', 'ACTIVE');

    if (error) {
      console.error('❌ Error fetching ICT staff:', error);
      return;
    }

    if (!ictStaff || ictStaff.length === 0) {
      console.log('❌ No ICT staff found for Sidama Bank');
      console.log('\nYou need to create an ICT staff account for testing task assignment.');
      console.log('I will create one now...\n');
      
      // Create ICT staff
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.default.hash('ict123', 10);

      const { data: newIct, error: createError } = await supabase
        .from('users')
        .insert({
          email: 'sidama.ict@mesobcenter.et',
          password_hash: hashedPassword,
          full_name: 'Sidama ICT Technician',
          phone: '+251933333333',
          role: 'ICT_STAFF',
          status: 'ACTIVE',
          institution_id: sidamaInstitutionId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating ICT staff:', createError);
        return;
      }

      console.log('✅ ICT staff created successfully!');
      console.log('\nLogin Credentials:');
      console.log('Email: sidama.ict@mesobcenter.et');
      console.log('Password: ict123');
      console.log('\nUser Details:');
      console.log('ID:', newIct.id);
      console.log('Name:', newIct.full_name);
      console.log('Role:', newIct.role);
      console.log('Institution ID:', newIct.institution_id);
      
    } else {
      console.log(`✅ Found ${ictStaff.length} ICT staff member(s) for Sidama Bank:\n`);
      ictStaff.forEach((staff, i) => {
        console.log(`${i + 1}. ${staff.full_name}`);
        console.log(`   Email: ${staff.email}`);
        console.log(`   ID: ${staff.id}`);
        console.log(`   Status: ${staff.status}`);
        console.log();
      });
    }

  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

checkIctStaff();
