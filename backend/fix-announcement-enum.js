import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function fixAnnouncementEnum() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }
  
  console.log('🔧 Fixing announcement_scope enum...');
  console.log('📍 Supabase URL:', supabaseUrl);
  
  const sql = `ALTER TYPE announcement_scope ADD VALUE IF NOT EXISTS 'INTERNAL';`;
  
  try {
    const response = await axios.post(
      `${supabaseUrl}/rest/v1/rpc/exec_sql`,
      { query: sql },
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Migration successful!');
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Request Error:', error.message);
    }
    
    console.log('\n⚠️  Direct execution not available.');
    console.log('\n📋 Please apply this migration manually:');
    console.log('\n1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new');
    console.log('2. Paste and run this SQL:\n');
    console.log('='.repeat(70));
    console.log(sql);
    console.log('='.repeat(70));
    console.log('\n3. After running, restart the backend server\n');
  }
}

fixAnnouncementEnum();
