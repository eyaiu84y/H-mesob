/**
 * Seed Services via Supabase Client
 * Populates all 37 approved services using Supabase JS client
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function seedServices() {
  try {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           SEED SERVICES VIA SUPABASE CLIENT                  ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    // Count existing services
    console.log('📊 Checking current service count...');
    const { count: countBefore, error: countError } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    console.log(`   Current services: ${countBefore}`);
    console.log('');

    // Get all institutions
    console.log('🏢 Fetching institutions...');
    const { data: institutions, error: instError } = await supabase
      .from('institutions')
      .select('id, code, name_en');
    
    if (instError) throw instError;
    console.log(`   Found ${institutions.length} institutions`);
    
    const instMap = {};
    institutions.forEach(inst => {
      instMap[inst.code] = inst.id;
    });
    console.log('');

    // Read and parse the seed file to extract service data
    console.log('📄 Parsing seed file for service data...');
    const seedFileContent = fs.readFileSync('database/seeds/002_seed_services.sql', 'utf8');
    
    // Since parsing SQL is complex, let me use the API endpoint instead
    // Actually, let me just execute the SQL via Supabase RPC
    
    console.log('🚀 Executing seed SQL via Supabase...');
    const { data: result, error: execError } = await supabase.rpc('exec_sql', {
      sql_query: seedFileContent
    });
    
    if (execError) {
      console.log('   ⚠️  RPC method not available, trying direct SQL execution...');
      
      // Alternative: Use raw SQL query
      const { error: rawError } = await supabase.rpc('exec', {
        query: seedFileContent
      });
      
      if (rawError) {
        throw new Error('Cannot execute SQL directly. Manual seeding required.');
      }
    }
    
    console.log('✅ Seed executed');
    console.log('');

    // Count services after
    console.log('📊 Checking final service count...');
    const { count: countAfter, error: countError2 } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true });
    
    if (countError2) throw countError2;
    
    const servicesAdded = countAfter - countBefore;
    console.log(`   Previous services: ${countBefore}`);
    console.log(`   Current services: ${countAfter}`);
    console.log(`   Services added: ${servicesAdded}`);
    console.log('');

    console.log('✅ SEED COMPLETE');
    console.log(`📊 Total services: ${countAfter}`);

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('ALTERNATIVE APPROACH REQUIRED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('The seed file must be run directly in Supabase SQL Editor:');
    console.log('');
    console.log('1. Go to: https://supabase.com/dashboard/project/afsaruutbrnnmonciiga/sql');
    console.log('2. Create a new query');
    console.log('3. Copy the contents of: database/seeds/002_seed_services.sql');
    console.log('4. Paste and run the query');
    console.log('');
    console.log('Or use psql command line:');
    console.log('');
    console.log('psql "postgresql://postgres:[PASSWORD]@db.afsaruutbrnnmonciiga.supabase.co:5432/postgres" < database/seeds/002_seed_services.sql');
    console.log('');
    
    process.exit(1);
  }
}

seedServices();
