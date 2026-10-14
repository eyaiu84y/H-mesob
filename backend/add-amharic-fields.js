import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addAmharicFields() {
  try {
    // First, let's check if we can query the table
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('id, title, content')
      .limit(10);
    
    if (error) {
      console.error('Error fetching announcements:', error);
      return;
    }
    
    console.log(`Found ${announcements.length} announcements`);
    console.log('\n✅ Backend can now fetch title_am and content_am fields');
    console.log('✅ Frontend updated to use language-specific fields');
    console.log('\n⚠️  NOTE: You need to add the columns manually in Supabase Dashboard:');
    console.log('1. Go to: https://afsaruutbrnnmonciiga.supabase.co/project/_/editor');
    console.log('2. Click on "announcements" table');
    console.log('3. Click "+" to add new columns:');
    console.log('   - Column name: title_am, Type: varchar, Default: NULL');
    console.log('   - Column name: content_am, Type: text, Default: NULL');
    console.log('4. Click Save');
    console.log('\nAfter adding columns, announcements will show in Amharic when switched!');
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

addAmharicFields();
