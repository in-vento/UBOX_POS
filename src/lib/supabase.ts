import { createClient } from '@supabase/supabase-js';

// These should be in environment variables, but for the Desktop App (Electron/Next.js client-side),
// we need to expose them. Since we are using a public anon key, it's safe to expose.
// Ideally, we would use process.env.NEXT_PUBLIC_SUPABASE_URL, but we'll hardcode for now to ensure it works
// without complex build config changes, or we can add a .env.local file.

const SUPABASE_URL = 'https://pftrdefyezdybsoaemdp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdHJkZWZ5ZXpkeWJzb2FlbWRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNDA3MTQsImV4cCI6MjA4NDcxNjcxNH0.jbuTRDiM3SxyN9_FLx8SJCTQC7Pv5BbtmwZJWFAwkwc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        detectSessionInUrl: false
    }
});
