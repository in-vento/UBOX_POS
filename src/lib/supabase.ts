import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
// These are safe to expose on the client-side as they use the public anon key
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pftrdefyezdybsoaemdp.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHJkZWZ5ZXpkeWJzb2FlbWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNDA3MTQsImV4cCI6MjA4NDcxNjcxNH0.jbuTRDiM3SxyN9_FLx8SJCTQC7Pv5BbtmwZJWFAwkwc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        detectSessionInUrl: false
    }
});
