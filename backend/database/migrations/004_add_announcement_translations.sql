-- Add Amharic translation fields to announcements table
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS title_am VARCHAR(255),
ADD COLUMN IF NOT EXISTS content_am TEXT;

-- Update existing announcements with Amharic translations
UPDATE announcements 
SET 
  title_am = CASE 
    WHEN title = 'Important Service Announcement' THEN 'አስፈላጊ የአገልግሎት ማስታወቂያ'
    WHEN title = 'Public Service Information Update' THEN 'የህዝብ አገልግሎት መረጃ ዝማኔ'
    WHEN title = 'Test Announcement' THEN 'የሙከራ ማስታወቂያ'
    ELSE title
  END,
  content_am = CASE 
    WHEN title = 'Important Service Announcement' THEN 'ዜጎች የሃዋሳ መሶብ በዲጂታል መረጃ ስርዓቱ አማካይነት የህዝብ አገልግሎቶችን ለማሻሻል እንደሚቀጥል በደግነት ተበሳጭተዋል። ዜጎች የአገልግሎት መረጃን መፈተሽ፣ የመተግበሪያ ሁኔታን መከታተል፣ የጥገና ሪፖርቶችን ማስተዳደር እና በይፋ የተደረጉ ማስታወቂያዎችን ማግኘት ይችላሉ።'
    WHEN title = 'Public Service Information Update' THEN 'የሃዋሳ መሶብ የህዝብ አገልግሎት መረጃ ስርዓት አሁን ዜጎችን ለህዝብ አገልግሎት መረጃ፣ ለወረፋ አስተዳደር፣ ለመተግበሪያ ክትትል፣ ለጥገና ሪፖርት፣ ለተግባር አገልግሎቶች እና ለቅርብ ጊዜ የህዝብ ማስታወቂያዎች ምቹ መዳረሻ እየሰጠ ነው።'
    WHEN title = 'Test Announcement' THEN 'ይህ የሙከራ ማስታወቂያ ነው'
    ELSE content
  END
WHERE title_am IS NULL OR content_am IS NULL;
