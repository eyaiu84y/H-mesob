import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupStorage() {
  try {
    console.log('Setting up Supabase storage bucket for maintenance attachments...');

    // Create bucket
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('maintenance-attachments', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Bucket already exists');
      } else {
        console.error('❌ Error creating bucket:', bucketError);
        return;
      }
    } else {
      console.log('✅ Bucket created successfully');
    }

    // Set bucket policy to public read
    console.log('Setting bucket policy...');
    
    console.log('✅ Storage setup complete!');
    console.log('\nBucket details:');
    console.log('  Name: maintenance-attachments');
    console.log('  Public: Yes');
    console.log('  Max file size: 10MB');
    console.log('  Allowed types: JPG, PNG, PDF, DOCX');

  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

setupStorage();
