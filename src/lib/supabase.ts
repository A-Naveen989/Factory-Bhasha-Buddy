
import { createClient } from '@supabase/supabase-js';

// --------------------------------------------------
// ENVIRONMENT CONFIGURATION
// --------------------------------------------------

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();

// Prefer the newer publishable key.
// Retain compatibility with the existing anon key.
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// --------------------------------------------------
// CONFIGURATION VALIDATION
// --------------------------------------------------

if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL. Check your .env configuration.'
  );
}

if (!supabaseKey) {
  throw new Error(
    'Missing Supabase API key. Configure VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.'
  );
}

// Validate the Supabase project URL.
try {
  const parsedUrl = new URL(supabaseUrl);

  if (
    parsedUrl.protocol !== 'https:' &&
    parsedUrl.protocol !== 'http:'
  ) {
    throw new Error('Invalid URL protocol.');
  }
} catch {
  throw new Error(
    'Invalid VITE_SUPABASE_URL. Provide a valid HTTP or HTTPS URL.'
  );
}

// --------------------------------------------------
// SUPABASE CLIENT
// --------------------------------------------------

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
