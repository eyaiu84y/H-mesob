import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file.'
  );
}

// Create Supabase client with service role key (backend only - never expose to frontend)
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Helper function to check Supabase connection
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('_healthcheck').select('*').limit(1);
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = table doesn't exist (which is fine for health check)
      throw error;
    }
    return { connected: true, message: 'Supabase connection successful' };
  } catch (error) {
    return { connected: false, message: error.message };
  }
};

export default supabase;
