import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateAnnouncementsWithAmharic() {
  try {
    // Fetch all announcements
    const { data: announcements, error: fetchError } = await supabase
      .from('announcements')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching announcements:', fetchError);
      return;
    }
    
    console.log(`Found ${announcements.length} announcements to update`);
    
    // Update each announcement with Amharic translation
    for (const announcement of announcements) {
      let title_am = announcement.title;
      let content_am = announcement.content;
      
      // Translate based on English title
      if (announcement.title === 'Important Service Announcement') {
        title_am = 'አስፈላጊ የአገልግሎት ማስታወቂያ';
        content_am = 'ዜጎች የሃዋሳ መሶብ በዲጂታል መረጃ ስርዓቱ አማካይነት የህዝብ አገልግሎቶችን ለማሻሻል እንደሚቀጥል በደግነት ተበሳጭተዋል። ዜጎች የአገልግሎት መረጃን መፈተሽ፣ የመተግበሪያ ሁኔታን መከታተል፣ የጥገና ሪፖርቶችን ማስተዳደር እና በይፋ የተደረጉ ማስታወቂያዎችን ማግኘት ይችላሉ።';
      } else if (announcement.title === 'Public Service Information Update') {
        title_am = 'የህዝብ አገልግሎት መረጃ ዝማኔ';
        content_am = 'የሃዋሳ መሶብ የህዝብ አገልግሎት መረጃ ስርዓት አሁን ዜጎችን ለህዝብ አገልግሎት መረጃ፣ ለወረፋ አስተዳደር፣ ለመተግበሪያ ክትትል፣ ለጥገና ሪፖርት፣ ለተግባር አገልግሎቶች እና ለቅርብ ጊዜ የህዝብ ማስታወቂያዎች ምቹ መዳረሻ እየሰጠ ነው።';
      } else if (announcement.title === 'Test Announcement') {
        title_am = 'የሙከራ ማስታወቂያ';
        content_am = 'ይህ የሙከራ ማስታወቂያ ነው';
      }
      
      // Update the announcement
      const { error: updateError } = await supabase
        .from('announcements')
        .update({
          title_am: title_am,
          content_am: content_am
        })
        .eq('id', announcement.id);
      
      if (updateError) {
        console.error(`Error updating announcement ${announcement.id}:`, updateError);
      } else {
        console.log(`✅ Updated: ${announcement.title} → ${title_am}`);
      }
    }
    
    console.log('\n✅ All announcements updated with Amharic translations!');
    console.log('Now refresh your browser and switch to Amharic language.');
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

updateAnnouncementsWithAmharic();
