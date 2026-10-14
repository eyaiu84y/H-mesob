import { supabase } from './src/config/supabase.js';

async function applyEnumMigration() {
  console.log('🔧 Applying enum migration...');
  
  try {
    // Add INTERNAL to announcement_scope enum
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          ALTER TYPE announcement_scope ADD VALUE IF NOT EXISTS 'INTERNAL';
        END
        $$;
      `
    });
    
    if (error) {
      console.error('❌ Migration failed (trying alternative method):', error.message);
      
      // Try direct SQL execution through raw query
      const { error: error2 } = await supabase
        .from('_migrations')
        .select('*')
        .limit(0); // Just to test connection
      
      console.log('\n⚠️  Cannot execute DDL through RPC.');
      console.log('\n📋 Please run this SQL command manually in Supabase SQL Editor:');
      console.log('\n' + '='.repeat(60));
      console.log(`ALTER TYPE announcement_scope ADD VALUE IF NOT EXISTS 'INTERNAL';`);
      console.log('='.repeat(60) + '\n');
      
      return;
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('✅ announcement_scope now includes: SYSTEM, INSTITUTION, ROLE, PUBLIC, INTERNAL');
    
  } catch (err) {
    console.error('❌ Error:', err);
    console.log('\n📋 Please run this SQL command manually in Supabase SQL Editor:');
    console.log('\n' + '='.repeat(60));
    console.log(`ALTER TYPE announcement_scope ADD VALUE IF NOT EXISTS 'INTERNAL';`);
    console.log('='.repeat(60) + '\n');
  }
}

applyEnumMigration()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Script failed:', err);
    process.exit(1);
  });
